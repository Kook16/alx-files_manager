import { v4 as uuidv4 } from 'uuid';
import { promises as fs } from 'fs';
import { ObjectID } from 'mongodb';
import Queue from 'bull';
import mime from 'mime-types';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

const fileQueue = new Queue('fileQueue', 'redis://127.0.0.1:6379');

class FileController {
  // Retrieves the user by token from Redis and MongoDB
  static async getUser(req) {
    const token = req.header('X-Token');
    const key = `auth_${token}`;
    const id = await redisClient.get(key);
    if (id) {
      const users = dbClient.db.collection('users');
      const mongoID = new ObjectID(id);
      const user = await users.findOne({ _id: mongoID });
      return user || null;
    }
    return null;
  }

  // Publishes a file by setting isPublic to true
  static async putPublish(req, res) {
    const user = await FileController.getUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    const files = dbClient.db.collection('files');
    const mongoID = new ObjectID(id);

    const updatedFile = await files.findOneAndUpdate(
      { _id: mongoID, userId: user._id },
      { $set: { isPublic: true } },
      { returnOriginal: false }
    );

    if (!updatedFile.lastErrorObject.updatedExisting) {
      return res.status(404).json({ error: 'Not found' });
    }
    return res.status(200).json(updatedFile.value);
  }

  // Unpublishes a file by setting isPublic to false
  static async putUnpublish(req, res) {
    const user = await FileController.getUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    const files = dbClient.db.collection('files');
    const mongoID = new ObjectID(id);

    const updatedFile = await files.findOneAndUpdate(
      { _id: mongoID, userId: user._id },
      { $set: { isPublic: false } },
      { returnOriginal: false }
    );

    if (!updatedFile.lastErrorObject.updatedExisting) {
      return res.status(404).json({ error: 'Not found' });
    }
    return res.status(200).json(updatedFile.value);
  }

  // Retrieves file data by ID, including size variants
  static async getFile(req, res) {
    const { id } = req.params;
    const size = req.query.size || null;
    const files = dbClient.db.collection('files');
    const mongoID = new ObjectID(id);

    const file = await files.findOne({ _id: mongoID });

    if (!file) return res.status(404).json({ error: 'Not found' });

    if (
      file.isPublic ||
      (await FileController.checkUserAccess(req, file.userId))
    ) {
      if (file.type === 'folder') {
        return res.status(400).json({ error: "A folder doesn't have content" });
      }
      return await FileController.sendFile(file, size, res);
    }
    return res.status(404).json({ error: 'Not found' });
  }

  // Checks if the user has access to the file
  static async checkUserAccess(req, fileUserId) {
    const user = await FileController.getUser(req);
    return user && user._id.toString() === fileUserId.toString();
  }

  // Sends file content to the client, with the correct MIME type
  static async sendFile(file, size, res) {
    let filePath = file.localPath;
    if (size) filePath += `_${size}`;

    try {
      const data = await fs.readFile(filePath);
      const contentType = mime.contentType(file.name);
      return res.header('Content-Type', contentType).status(200).send(data);
    } catch (error) {
      console.log(error);
      return res.status(404).json({ error: 'Not found' });
    }
  }
}

export default FileController;

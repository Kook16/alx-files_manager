import sha1 from 'sha1';
import { ObjectID } from 'mongodb';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;

    // Check for missing email
    if (!email) {
      res.status(400).json({ error: 'Missing email' });
      return;
    }

    // Check for missing password
    if (!password) {
      res.status(400).json({ error: 'Missing password' });
      return;
    }

    try {
      const users = dbClient.db.collection('users');

      // Check if email already exists
      const userExists = await users.findOne({ email });
      if (userExists) {
        res.status(400).json({ error: 'Already exist' });
        return;
      }

      // Hash the password and create the user
      const hashPwd = sha1(password);
      const newUser = await users.insertOne({ email, password: hashPwd });

      // Respond with the new user's id and email
      res.status(201).json({ id: newUser.insertedId, email });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getMe(req, res) {
    const token = req.header('X-Token');
    const key = `auth_${token}`;

    try {
      const userId = await redisClient.get(key);
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const users = dbClient.db.collection('users');
      const objectId = new ObjectID(userId);
      const user = await users.findOne({ _id: objectId });

      if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      res.status(200).json({ id: userId, email: user.email });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export default UsersController;

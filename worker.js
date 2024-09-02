import imageThumbnail from 'image-thumbnail';
import Queue from 'bull';
import { ObjectID } from 'mongodb';
import { promises as fs } from 'fs';
import dbClient from './utils/db';

const REDIS_URL = 'redis://127.0.0.1:6379';

const fileQueue = new Queue('fileQueue', REDIS_URL);

async function processThumbnail(width, localPath) {
  const thumbnail = await imageThumbnail(localPath, { width });
  return thumbnail;
}

async function generateThumbnails(file, sizes) {
  for (const size of sizes) {
    try {
      const thumbnail = await processThumbnail(size, file.localPath);
      const imagePath = `${file.localPath}_${size}`;
      await fs.writeFile(imagePath, thumbnail);
    } catch (error) {
      console.error(`Error generating thumbnail for size ${size}:`, error);
      throw new Error(`Failed to generate thumbnail for size ${size}`);
    }
  }
}

fileQueue.process(async (job, done) => {
  console.log('Thumbnail generation job started...');
  const { fileId, userId } = job.data;

  if (!fileId) return done(new Error('Missing fileId'));
  if (!userId) return done(new Error('Missing userId'));

  const filesCollection = dbClient.db.collection('files');
  const idObject = new ObjectID(fileId);

  const file = await filesCollection.findOne({ _id: idObject, userId });
  if (!file) return done(new Error('File not found'));

  if (file.type !== 'image') {
    return done(new Error('File is not an image'));
  }

  const sizes = [500, 250, 100];
  await generateThumbnails(file, sizes);
  done();
});

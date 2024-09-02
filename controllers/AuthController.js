import sha1 from 'sha1';
import { v4 as uuidv4 } from 'uuid';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class AuthController {
  static async getConnect(req, res) {
    const authHeader = req.header('Authorization') || '';

    // Extract and decode Base64 from Basic Auth header
    const base64Credentials = authHeader.split(' ')[1];
    if (!base64Credentials) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const [email, password] = Buffer.from(base64Credentials, 'base64')
      .toString('ascii')
      .split(':');

    // Hash the password
    const hashedPassword = sha1(password);

    try {
      // Check if user exists with the given email and hashed password
      const user = await dbClient.db
        .collection('users')
        .findOne({ email, password: hashedPassword });
      if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Generate token and store in Redis
      const token = uuidv4();
      const key = `auth_${token}`;
      await redisClient.set(key, user._id.toString(), 86400); // Store for 24 hours (86400 seconds)

      // Return the token
      res.status(200).json({ token });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getDisconnect(req, res) {
    const token = req.header('X-Token');

    if (!token) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const key = `auth_${token}`;
    const userId = await redisClient.get(key);

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Delete token from Redis
    await redisClient.del(key);
    res.status(204).send(); // No content, successful disconnect
  }
}

export default AuthController;

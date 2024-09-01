import { promisify } from 'util';
import { createClient } from 'redis';

class RedisClient {
  constructor() {
    this.client = createClient();

    this.client.on('error', (err) => {
      console.error(
        'Redis client failed to connect:',
        err.message || err.toString()
      );
    });

    this.client.on('connect', () => {
      console.log('Connected to Redis:', this.client.connected);
    });
  }

  // Returns true if Redis connection is alive
  isAlive() {
    return this.client.connected;
  }

  // Retrieves the value associated with the key from Redis
  async get(key) {
    const getAsync = promisify(this.client.get).bind(this.client);
    return await getAsync(key);
  }

  // Stores a key-value pair in Redis with an expiration duration
  async set(key, value, duration) {
    const setAsync = promisify(this.client.setex).bind(this.client);
    await setAsync(key, duration, value);
  }

  // Deletes a key-value pair from Redis
  async del(key) {
    const delAsync = promisify(this.client.del).bind(this.client);
    await delAsync(key);
  }
}

// Export an instance of RedisClient
const redisClient = new RedisClient();
export default redisClient;

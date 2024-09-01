import { MongoClient } from 'mongodb';

const host = process.env.DB_HOST || 'localhost';
const port = process.env.DB_PORT || 27017;
const dbName = process.env.DB_DATABASE || 'files_manager';
const url = `mongodb://${host}:${port}`;

class DBClient {
  constructor() {
    this.client = new MongoClient(url, { useUnifiedTopology: true });

    // Handle connection
    this.client
      .connect()
      .then(() => {
        console.log('MongoDB connected successfully');
        this.db = this.client.db(dbName);
      })
      .catch((err) => {
        console.error('MongoDB connection failed:', err);
      });
  }

  isAlive() {
    return (
      this.client && this.client.topology && this.client.topology.isConnected()
    );
  }

  async nbUsers() {
    try {
      return this.db.collection('users').countDocuments();
    } catch (err) {
      console.error('Error counting users:', err);
      return 0;
    }
  }

  async nbFiles() {
    try {
      return this.db.collection('files').countDocuments();
    } catch (err) {
      console.error('Error counting files:', err);
      return 0;
    }
  }
}

const dbClient = new DBClient();
export default dbClient;

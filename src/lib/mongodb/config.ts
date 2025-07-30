import mongoose, { ConnectOptions } from 'mongoose';

// External MongoDB connection string - using the provided MongoDB Atlas connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://rijalboy94:kvPfojAOpzITixtP@studiocontacts.t1x8fae.mongodb.net/contacts';

// Track connection status
let isConnected = false;
let connectionPromise: Promise<typeof mongoose> | null = null;

/**
 * Connect to MongoDB with optimized settings
 */
export async function connectToDatabase() {
  if (isConnected) {
    console.log('Using existing MongoDB connection');
    return mongoose;
  }

  // If connection is in progress, return the existing promise
  if (connectionPromise) {
    return connectionPromise;
  }

  connectionPromise = (async () => {
  try {
    console.log('Connecting to MongoDB Atlas...');
    // Hide sensitive information when logging
    console.log(`Using connection string: ${MONGODB_URI.replace(/\/\/([^:]+):[^@]+@/, '//***:***@')}`);
    
      // Optimized connection options (Mongoose v7+) – remove deprecated flags
      const options: ConnectOptions = {
        maxPoolSize: 10, // Limit connection pool size
        serverSelectionTimeoutMS: 5000, // 5 seconds timeout
        socketTimeoutMS: 45000, // 45 seconds socket timeout
        retryWrites: true,
        retryReads: true,
        connectTimeoutMS: 10000, // 10 seconds
      };

      // Simple retry (up to 3 attempts) with exponential backoff in case Atlas transiently refuses connections
      const MAX_RETRIES = 3;
      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          await mongoose.connect(MONGODB_URI, options);
          break; // Connected successfully
        } catch (innerErr) {
          if (attempt === MAX_RETRIES) throw innerErr;
          const delay = 250 * Math.pow(2, attempt); // 250ms, 500ms, 1000ms
          console.warn(`MongoDB connection attempt ${attempt} failed – retrying in ${delay}ms`);
          await new Promise(res => setTimeout(res, delay));
        }
      }
      
      // Handle connection events
      mongoose.connection.on('error', (error) => {
        console.error('MongoDB connection error:', error);
        isConnected = false;
        connectionPromise = null;
      });

      mongoose.connection.on('disconnected', () => {
        console.log('MongoDB disconnected');
        isConnected = false;
        connectionPromise = null;
      });

      mongoose.connection.on('reconnected', () => {
        console.log('MongoDB reconnected');
        isConnected = true;
      });
    
    isConnected = true;
    console.log('Connected to MongoDB Atlas');
    return mongoose;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
      isConnected = false;
      connectionPromise = null;
    throw error;
  }
  })();

  return connectionPromise;
}

// Export the mongoose instance
export { mongoose }; 
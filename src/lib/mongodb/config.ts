import mongoose from 'mongoose';

// Determine if we're running in Docker or locally
const isDocker = process.env.DOCKER_ENV === 'true';

// MongoDB connection string
// In Docker, use the service name 'mongodb' as the hostname
// Otherwise, use 'localhost' for local development
const host = isDocker ? 'mongodb' : 'localhost';
const MONGODB_URI = process.env.MONGODB_URI || `mongodb://admin:password@${host}:27017/contacts?authSource=admin`;

// Connection options
const options: mongoose.ConnectOptions = {
  // These options are no longer needed in newer Mongoose versions
  // but kept for compatibility
};

// Track connection status
let isConnected = false;

/**
 * Connect to MongoDB
 */
export async function connectToDatabase() {
  if (isConnected) {
    console.log('Using existing MongoDB connection');
    return mongoose;
  }

  try {
    console.log('Connecting to MongoDB...');
    console.log(`Using connection string: ${MONGODB_URI.replace(/\/\/([^:]+):[^@]+@/, '//***:***@')}`);
    
    await mongoose.connect(MONGODB_URI, options);
    
    isConnected = true;
    console.log('Connected to MongoDB');
    return mongoose;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}

// Export the mongoose instance
export { mongoose }; 
import mongoose from 'mongoose';

// External MongoDB connection string - using the provided MongoDB Atlas connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://rijalboy94:kvPfojAOpzITixtP@studiocontacts.t1x8fae.mongodb.net/contacts';

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
    console.log('Connecting to MongoDB Atlas...');
    // Hide sensitive information when logging
    console.log(`Using connection string: ${MONGODB_URI.replace(/\/\/([^:]+):[^@]+@/, '//***:***@')}`);
    
    await mongoose.connect(MONGODB_URI);
    
    isConnected = true;
    console.log('Connected to MongoDB Atlas');
    return mongoose;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}

// Export the mongoose instance
export { mongoose }; 
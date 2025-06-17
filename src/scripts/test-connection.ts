import { connectToDatabase, mongoose } from '../lib/mongodb/config';

async function testConnection() {
  try {
    console.log('Attempting to connect to MongoDB...');
    await connectToDatabase();
    
    if (mongoose.connection && mongoose.connection.db) {
      console.log('Successfully connected to MongoDB!');
      console.log('Connection details:', mongoose.connection.host, mongoose.connection.port);
      
      // List databases
      const admin = mongoose.connection.db.admin();
      const result = await admin.listDatabases();
      console.log('Available databases:');
      console.log(result.databases.map((db: { name: string }) => db.name).join(', '));
      
      // Close connection
      await mongoose.connection.close();
      console.log('Connection closed');
    } else {
      console.error('Connection object or db is null');
    }
    process.exit(0);
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
}

testConnection(); 
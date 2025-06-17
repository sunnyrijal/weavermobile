const { MongoClient } = require('mongodb');

// Connection URI
const uri = 'mongodb://admin:password@localhost:27017/contacts?authSource=admin';

// Create a new MongoClient
const client = new MongoClient(uri);

async function run() {
  try {
    // Connect the client to the server
    console.log('Attempting to connect to MongoDB...');
    await client.connect();
    console.log('Connected successfully to MongoDB server');
    
    // Get the list of databases
    const adminDb = client.db('admin');
    const dbs = await adminDb.admin().listDatabases();
    console.log('Databases:');
    dbs.databases.forEach(db => {
      console.log(`- ${db.name}`);
    });
  } catch (err) {
    console.error('Error connecting to MongoDB:', err);
  } finally {
    // Close the connection
    await client.close();
    console.log('Connection closed');
  }
}

run().catch(console.error); 
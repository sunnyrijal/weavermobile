// Script to test MongoDB Atlas connection
const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

// Connection URI - use the environment variable or the provided MongoDB Atlas connection
const uri = process.env.MONGODB_URI || 'mongodb+srv://rijalboy94:kvPfojAOpzITixtP@studiocontacts.t1x8fae.mongodb.net/contacts';

// Hide sensitive information when logging
console.log(`Trying to connect with URI: ${uri.replace(/\/\/([^:]+):[^@]+@/, '//***:***@')}`);

async function testConnection() {
  const client = new MongoClient(uri);
  
  try {
    console.log('Connecting to MongoDB Atlas...');
    await client.connect();
    console.log('Connected successfully to MongoDB Atlas');
    
    // List databases
    const adminDb = client.db('admin');
    const dbs = await adminDb.admin().listDatabases();
    console.log('Databases:');
    dbs.databases.forEach(db => {
      console.log(`- ${db.name}`);
    });
    
    // Check contacts database
    const db = client.db('contacts');
    const collections = await db.listCollections().toArray();
    console.log('\nCollections in contacts database:');
    if (collections.length === 0) {
      console.log('No collections found. Creating contacts collection...');
      await db.createCollection('contacts');
      console.log('Contacts collection created.');
      collections.push({ name: 'contacts' });
    }
    
    collections.forEach(collection => {
      console.log(`- ${collection.name}`);
    });
    
    // Count contacts
    const contactsCollection = db.collection('contacts');
    const count = await contactsCollection.countDocuments();
    console.log(`\nNumber of contacts: ${count}`);
    
    if (count > 0) {
      // List some contacts
      console.log('\nSample contacts:');
      const contacts = await contactsCollection.find().limit(3).toArray();
      contacts.forEach(contact => {
        console.log(`- ${contact.name} (${contact.id || contact._id})`);
      });
    } else {
      console.log('No contacts found in the database.');
    }
  } catch (err) {
    console.error('Error connecting to MongoDB:', err);
  } finally {
    await client.close();
    console.log('Connection closed');
  }
}

testConnection().catch(console.error); 
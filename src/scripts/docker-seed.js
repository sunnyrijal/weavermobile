// Simple script to seed MongoDB in Docker environment
const { MongoClient } = require('mongodb');

// Connection URI - use the service name as hostname in Docker
const uri = process.env.MONGODB_URI || 'mongodb://admin:password@mongodb:27017/contacts?authSource=admin';

// Simple mock data for seeding
const mockContacts = [
  {
    id: "1",
    ownerId: "user1",
    name: "John Doe",
    category: "Friend",
    tags: ["Work", "Tech"],
    email: "john@example.com",
    phone: "555-1234",
    relationships: [],
    photosTogether: [],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "2",
    ownerId: "user1",
    name: "Jane Smith",
    category: "Family",
    tags: ["Relative", "Birthday July"],
    email: "jane@example.com",
    phone: "555-5678",
    relationships: [{ relatedContactId: "1", type: "Friend", customLabel: "Colleague" }],
    photosTogether: [],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "3",
    ownerId: "user1",
    name: "Bob Johnson",
    category: "Professional",
    tags: ["Client", "Business"],
    email: "bob@example.com",
    phone: "555-9012",
    relationships: [],
    photosTogether: [],
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Maximum number of connection attempts
const MAX_RETRIES = 5;
const RETRY_INTERVAL = 3000; // 3 seconds

async function connectWithRetry(uri, retries = MAX_RETRIES) {
  try {
    console.log(`Attempting to connect to MongoDB (attempt ${MAX_RETRIES - retries + 1}/${MAX_RETRIES})...`);
    const client = new MongoClient(uri);
    await client.connect();
    console.log('Successfully connected to MongoDB!');
    return client;
  } catch (err) {
    if (retries > 0) {
      console.log(`Failed to connect. Retrying in ${RETRY_INTERVAL/1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_INTERVAL));
      return connectWithRetry(uri, retries - 1);
    } else {
      console.error('Max connection attempts reached. Could not connect to MongoDB.');
      throw err;
    }
  }
}

async function seedDatabase() {
  let client;
  
  try {
    client = await connectWithRetry(uri);
    
    const db = client.db('contacts');
    const contactsCollection = db.collection('contacts');
    
    // Check if collection already has data
    const count = await contactsCollection.countDocuments();
    if (count > 0) {
      console.log(`Collection already has ${count} documents. Clearing existing data...`);
    }
    
    // Clear existing contacts
    console.log('Clearing existing contacts...');
    await contactsCollection.deleteMany({});
    
    // Insert mock contacts
    console.log(`Inserting ${mockContacts.length} contacts...`);
    const result = await contactsCollection.insertMany(mockContacts);
    
    console.log(`Successfully inserted ${result.insertedCount} contacts`);
    
    // Verify the data was inserted
    const newCount = await contactsCollection.countDocuments();
    console.log(`Collection now has ${newCount} documents.`);
    
    // List the inserted contacts
    console.log('Inserted contacts:');
    const contacts = await contactsCollection.find({}).toArray();
    contacts.forEach(contact => {
      console.log(`- ${contact.name} (${contact.id})`);
    });
    
  } catch (err) {
    console.error('Error seeding database:', err);
  } finally {
    if (client) {
      await client.close();
      console.log('Connection closed');
    }
  }
}

seedDatabase().catch(console.error); 
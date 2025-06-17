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

async function seedDatabase() {
  const client = new MongoClient(uri);
  
  try {
    console.log('Connecting to MongoDB...');
    await client.connect();
    console.log('Connected to MongoDB server');
    
    const db = client.db('contacts');
    const contactsCollection = db.collection('contacts');
    
    // Clear existing contacts
    console.log('Clearing existing contacts...');
    await contactsCollection.deleteMany({});
    
    // Insert mock contacts
    console.log(`Inserting ${mockContacts.length} contacts...`);
    const result = await contactsCollection.insertMany(mockContacts);
    
    console.log(`Successfully inserted ${result.insertedCount} contacts`);
  } catch (err) {
    console.error('Error seeding database:', err);
  } finally {
    await client.close();
    console.log('Connection closed');
  }
}

seedDatabase().catch(console.error); 
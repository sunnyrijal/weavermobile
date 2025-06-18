// Script to seed MongoDB Atlas with sample contacts
const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

// Connection URI - use the environment variable or the provided MongoDB Atlas connection
const uri = process.env.MONGODB_URI || 'mongodb+srv://rijalboy94:kvPfojAOpzITixtP@studiocontacts.t1x8fae.mongodb.net/contacts';

// Sample contacts data
const sampleContacts = [
  {
    id: "1",
    ownerId: "user1",
    name: "John Doe",
    photoURL: "https://randomuser.me/api/portraits/men/1.jpg",
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
    photoURL: "https://randomuser.me/api/portraits/women/2.jpg",
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
    photoURL: "https://randomuser.me/api/portraits/men/3.jpg",
    category: "Professional",
    tags: ["Client", "Business"],
    email: "bob@example.com",
    phone: "555-9012",
    relationships: [],
    photosTogether: [],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "4",
    ownerId: "user1",
    name: "Alice Williams",
    photoURL: "https://randomuser.me/api/portraits/women/4.jpg",
    category: "Friend",
    tags: ["College", "Music"],
    email: "alice@example.com",
    phone: "555-3456",
    occupation: "Software Engineer",
    company: "Tech Solutions Inc.",
    college: "State University",
    hometown: "Portland, OR",
    currentLocation: "Seattle, WA",
    relationships: [],
    photosTogether: [],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "5",
    ownerId: "user1",
    name: "Charlie Brown",
    photoURL: "https://randomuser.me/api/portraits/men/5.jpg",
    category: "Professional",
    tags: ["Client", "Finance"],
    email: "charlie@example.com",
    phone: "555-7890",
    occupation: "Financial Advisor",
    company: "Money Matters LLC",
    college: "Business School",
    hometown: "Chicago, IL",
    currentLocation: "New York, NY",
    relationships: [],
    photosTogether: [],
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

async function seedDatabase() {
  const client = new MongoClient(uri);
  
  try {
    console.log('Connecting to MongoDB Atlas...');
    await client.connect();
    console.log('Connected successfully to MongoDB Atlas');
    
    const db = client.db('contacts');
    const contactsCollection = db.collection('contacts');
    
    // Check if collection has data
    const count = await contactsCollection.countDocuments();
    if (count > 0) {
      console.log(`Collection already has ${count} contacts. Clearing existing data...`);
      await contactsCollection.deleteMany({});
    }
    
    // Insert sample contacts
    console.log(`Inserting ${sampleContacts.length} sample contacts...`);
    const result = await contactsCollection.insertMany(sampleContacts);
    
    console.log(`Successfully inserted ${result.insertedCount} contacts`);
    
    // List the inserted contacts
    console.log('Inserted contacts:');
    const contacts = await contactsCollection.find().toArray();
    contacts.forEach(contact => {
      console.log(`- ${contact.name} (${contact.id})`);
    });
    
  } catch (err) {
    console.error('Error seeding database:', err);
  } finally {
    await client.close();
    console.log('Connection closed');
  }
}

seedDatabase().catch(console.error); 
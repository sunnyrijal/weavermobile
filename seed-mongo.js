// Simple MongoDB seeding script that can be run directly from the MongoDB container
db = db.getSiblingDB('admin');
db.auth('admin', 'password');

db = db.getSiblingDB('contacts');

// Clear existing contacts
print('Clearing existing contacts...');
db.contacts.deleteMany({});

// Create sample contacts
const contacts = [
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
  },
  {
    id: "4",
    ownerId: "user1",
    name: "Alice Williams",
    category: "Friend",
    tags: ["College", "Music"],
    email: "alice@example.com",
    phone: "555-3456",
    relationships: [],
    photosTogether: [],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "5",
    ownerId: "user1",
    name: "Charlie Brown",
    category: "Professional",
    tags: ["Client", "Finance"],
    email: "charlie@example.com",
    phone: "555-7890",
    relationships: [],
    photosTogether: [],
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Insert contacts
print(`Inserting ${contacts.length} contacts...`);
db.contacts.insertMany(contacts);

// Verify insertion
const count = db.contacts.countDocuments();
print(`Successfully inserted contacts. Collection now has ${count} documents.`);

// List inserted contacts
print('Inserted contacts:');
db.contacts.find().forEach(contact => {
  print(`- ${contact.name} (${contact.id})`);
}); 
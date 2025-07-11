import { MongoClient } from 'mongodb';

async function addTestBirthdayContact() {
  const uri = process.env.MONGODB_URI || "mongodb+srv://prasanny:prasanny123@studiocontacts.t1x8fae.mongodb.net/contacts";
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB Atlas');

    const db = client.db('contacts');
    const contactsCollection = db.collection('contacts');

    // Get tomorrow's date for the birthday
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const birthdayString = tomorrow.toISOString().split('T')[0]; // Format as YYYY-MM-DD

    const testContact = {
      name: "Test Birthday Contact",
      email: "test@example.com",
      phone: "+1234567890",
      birthday: birthdayString,
      notes: "This is a test contact for testing the birthday modal",
      tags: ["test", "birthday"],
      ownerId: "user1",
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await contactsCollection.insertOne(testContact);
    console.log('Test birthday contact added:', result.insertedId);
    console.log('Birthday date:', birthdayString);

  } catch (error) {
    console.error('Error adding test contact:', error);
  } finally {
    await client.close();
  }
}

addTestBirthdayContact(); 
import { connectToDatabase } from '../lib/mongodb/config';
import Contact from '../lib/mongodb/models/Contact';
import { mockContacts } from '../lib/mockData';

async function seedDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await connectToDatabase();
    
    console.log('Clearing existing contacts...');
    await Contact.deleteMany({});
    
    console.log('Importing mock contacts...');
    const result = await Contact.insertMany(mockContacts);
    
    console.log(`Successfully imported ${result.length} contacts`);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase(); 
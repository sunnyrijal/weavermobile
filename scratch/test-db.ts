import { connectToDatabase } from '../src/lib/mongodb/config';
import Contact from '../src/lib/mongodb/models/Contact';

async function run() {
  try {
    console.log("Connecting...");
    await connectToDatabase();
    console.log("Connected. Querying...");
    const contacts = await Contact.find({}, 'name isCompanyContact companyContextType').lean();
    console.log("Query success! Contacts field values:");
    console.log(JSON.stringify(contacts.slice(0, 10), null, 2));
    console.log("Total contacts count:", contacts.length);
  } catch (error) {
    console.error("Test failed with error:", error);
  }
  process.exit(0);
}

run();

import { connectToDatabase } from '../lib/mongodb/config';
import Memory from '../lib/mongodb/models/Memory';
import Contact from '../lib/mongodb/models/Contact';
import { MemoryService } from '../lib/mongodb/services/memoryService';
import { ContactService } from '../lib/mongodb/services/contactService';

async function testMemoryConnection() {
  try {
    console.log('Connecting to MongoDB...');
    await connectToDatabase();
    console.log('Connected to MongoDB successfully');

    // Test Memory model
    console.log('\nTesting Memory model...');
    const memoryCount = await Memory.countDocuments();
    console.log(`Found ${memoryCount} memories in the database`);

    // Test Contact model
    console.log('\nTesting Contact model...');
    const contactCount = await Contact.countDocuments();
    console.log(`Found ${contactCount} contacts in the database`);

    // Test creating a test memory
    console.log('\nCreating a test memory...');
    const testMemory = {
      ownerId: 'test-user',
      timestamp: new Date(),
      inputType: 'text' as const,
      summary: 'This is a test memory',
      linkedContactIds: [],
      tags: ['test'],
    };

    const createdMemory = await MemoryService.createMemory(testMemory);
    console.log('Test memory created:', createdMemory);

    // Test retrieving the memory
    console.log('\nRetrieving the test memory...');
    const retrievedMemory = await MemoryService.getMemoryById(createdMemory.id);
    console.log('Retrieved memory:', retrievedMemory);

    // Test deleting the memory
    console.log('\nDeleting the test memory...');
    const deleteResult = await MemoryService.deleteMemory(createdMemory.id);
    console.log('Delete result:', deleteResult);

    // Test retrieving memories by owner ID
    console.log('\nRetrieving memories by owner ID...');
    const ownerMemories = await MemoryService.getMemoriesByOwnerId('test-user');
    console.log(`Found ${ownerMemories.length} memories for owner 'test-user'`);

    console.log('\nAll tests completed successfully');
  } catch (error) {
    console.error('Error during memory connection test:', error);
  } finally {
    process.exit(0);
  }
}

testMemoryConnection(); 
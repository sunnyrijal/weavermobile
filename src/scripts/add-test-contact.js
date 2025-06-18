// Script to add a test contact with a valid ID
import fetch from 'node-fetch';

async function addTestContact() {
  try {
    console.log('Adding test contact...');
    
    const testContact = {
      ownerId: 'user1',
      name: 'Test Contact',
      email: 'test@example.com',
      phone: '555-1234',
      category: 'Friend',
      tags: ['Test', 'Example'],
      id: `test-${Date.now()}` // Ensure unique ID
    };
    
    const response = await fetch('http://localhost:9002/api/contacts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testContact)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to add test contact');
    }
    
    const data = await response.json();
    console.log('Success! Contact added:', data.contact);
  } catch (error) {
    console.error('Error adding test contact:', error);
  }
}

addTestContact(); 
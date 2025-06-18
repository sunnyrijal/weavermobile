// Script to import mock data into MongoDB
import fetch from 'node-fetch';

async function importMockData() {
  try {
    console.log('Importing mock data into MongoDB...');
    
    const response = await fetch('http://localhost:9002/api/contacts?importMock=true', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to import mock data');
    }
    
    const data = await response.json();
    console.log('Success:', data.message);
  } catch (error) {
    console.error('Error importing mock data:', error);
  }
}

importMockData(); 
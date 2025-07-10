import { NextRequest, NextResponse } from 'next/server';
import { ContactService } from '@/lib/mongodb/services/contactService';

// Mock Google OAuth flow - in production, you would use Google OAuth 2.0
const mockGoogleContacts = [
  {
    resourceName: 'people/c123456789',
    names: [{ displayName: 'John Doe', givenName: 'John', familyName: 'Doe' }],
    emailAddresses: [{ value: 'john.doe@gmail.com' }],
    phoneNumbers: [{ value: '+1-555-123-4567' }],
    organizations: [{ name: 'Google Inc.', title: 'Software Engineer' }],
    addresses: [{ city: 'Mountain View', region: 'CA' }],
    birthdays: [{ date: { year: 1990, month: 5, day: 15 } }]
  },
  {
    resourceName: 'people/c987654321',
    names: [{ displayName: 'Jane Smith', givenName: 'Jane', familyName: 'Smith' }],
    emailAddresses: [{ value: 'jane.smith@gmail.com' }],
    phoneNumbers: [{ value: '+1-555-987-6543' }],
    organizations: [{ name: 'Microsoft Corp.', title: 'Product Manager' }],
    addresses: [{ city: 'Seattle', region: 'WA' }],
    birthdays: [{ date: { year: 1988, month: 8, day: 22 } }]
  }
];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const ownerId = searchParams.get('ownerId');
    const authCode = searchParams.get('code');
    
    if (!ownerId) {
      return NextResponse.json({ error: 'ownerId is required' }, { status: 400 });
    }

    if (!authCode) {
      return NextResponse.json({ error: 'Authorization code is required' }, { status: 400 });
    }

    // In production, you would:
    // 1. Exchange auth code for access token
    // 2. Use access token to fetch contacts from Google People API
    // 3. Transform the data to match your contact schema
    
    // For now, we'll use mock data
    const importedContacts = mockGoogleContacts.map(contact => ({
      name: contact.names[0]?.displayName || 'Unknown',
      email: contact.emailAddresses[0]?.value || '',
      phone: contact.phoneNumbers[0]?.value || '',
      occupation: contact.organizations[0]?.title || '',
      company: contact.organizations[0]?.name || '',
      currentLocation: contact.addresses[0] ? 
        `${contact.addresses[0].city}, ${contact.addresses[0].region}` : '',
      birthday: contact.birthdays[0]?.date ? 
        `${contact.birthdays[0].date.year}-${String(contact.birthdays[0].date.month).padStart(2, '0')}-${String(contact.birthdays[0].date.day).padStart(2, '0')}` : '',
      importSource: 'Google Contacts',
      tags: ['Imported from Google'],
      ownerId
    }));

    return NextResponse.json({ 
      contacts: importedContacts,
      totalCount: importedContacts.length
    });
  } catch (error) {
    console.error('Error importing from Google:', error);
    return NextResponse.json({ error: 'Failed to import from Google' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { contacts, ownerId } = await req.json();
    
    if (!contacts || !Array.isArray(contacts) || !ownerId) {
      return NextResponse.json({ error: 'Contacts array and ownerId are required' }, { status: 400 });
    }

    const createdContacts = [];
    
    for (const contactData of contacts) {
      try {
        const contact = await ContactService.createContact({
          ...contactData,
          ownerId
        });
        createdContacts.push(contact);
      } catch (error) {
        console.error('Error creating contact:', error);
        // Continue with other contacts even if one fails
      }
    }

    return NextResponse.json({ 
      message: `Successfully imported ${createdContacts.length} contacts`,
      contacts: createdContacts
    });
  } catch (error) {
    console.error('Error saving imported contacts:', error);
    return NextResponse.json({ error: 'Failed to save imported contacts' }, { status: 500 });
  }
} 
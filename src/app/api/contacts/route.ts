import { NextRequest, NextResponse } from 'next/server';
import { ContactService } from '@/lib/mongodb/services/contactService';
import { UserService } from '@/lib/mongodb/services/userService';
import { mockContacts } from '@/lib/mockData';

// GET /api/contacts - Get all contacts for a user
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const ownerId = searchParams.get('ownerId');
    const name = searchParams.get('name');
    
    if (!ownerId) {
      return NextResponse.json({ error: 'ownerId is required' }, { status: 400 });
    }

    let contacts = [];
    
    try {
      if (name) {
        contacts = await ContactService.searchContacts(ownerId, name);
      } else {
        contacts = await ContactService.getContactsByOwnerId(ownerId);
      }
    } catch (dbError) {
      console.error('Database error, using fallback data:', dbError);
      // Return empty array instead of error when database is unavailable
      contacts = [];
    }
    
    return NextResponse.json({ contacts });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    // Return empty array instead of error to prevent frontend crashes
    return NextResponse.json({ contacts: [] });
  }
}

// POST /api/contacts - Create a new contact
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Received contact data:', body);
    
    if (!body.ownerId) {
      return NextResponse.json({ error: 'ownerId is required' }, { status: 400 });
    }
    
    // Check contact limits
    const contactLimitCheck = await UserService.canAddContact(body.ownerId);
    if (!contactLimitCheck.canAdd) {
      return NextResponse.json({ 
        error: 'Contact limit reached', 
        details: `You have reached your contact limit (${contactLimitCheck.limit}). Upgrade to Pro for more contacts.`,
        upgradeRequired: true
      }, { status: 403 });
    }
    
    // Check if we have a name (either full name or separate name fields)
    const hasName = body.name || (body.firstName && body.firstName.trim()) || (body.lastName && body.lastName.trim());
    if (!hasName) {
      return NextResponse.json({ error: 'Name is required (either full name or first/last name)' }, { status: 400 });
    }

    const contact = await ContactService.createContact(body);
    console.log('Contact created successfully:', contact);
    
    // Update contact count
    const contacts = await ContactService.getContactsByOwnerId(body.ownerId);
    await UserService.updateContactCount(body.ownerId, contacts.length);
    
    return NextResponse.json({ 
      contact, 
      usage: {
        remaining: contactLimitCheck.remaining - 1,
        limit: contactLimitCheck.limit
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating contact:', error);
    return NextResponse.json({ error: 'Failed to create contact', details: error.message }, { status: 500 });
  }
}

// Special route to import mock data (for development only)
// Should be secured or removed in production
export async function PUT(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const importMock = searchParams.get('importMock');
    
    if (importMock === 'true') {
      const count = await ContactService.importMockData(mockContacts);
      return NextResponse.json({ message: `Imported ${count} contacts` });
    }
    
    return NextResponse.json({ error: 'Invalid operation' }, { status: 400 });
  } catch (error) {
    console.error('Error importing mock data:', error);
    return NextResponse.json({ error: 'Failed to import mock data' }, { status: 500 });
  }
} 
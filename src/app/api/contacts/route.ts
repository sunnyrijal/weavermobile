import { NextRequest, NextResponse } from 'next/server';
import { ContactService } from '@/lib/mongodb/services/contactService';
import { mockContacts } from '@/lib/mockData';

// GET /api/contacts - Get all contacts for a user
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const ownerId = searchParams.get('ownerId');
    
    if (!ownerId) {
      return NextResponse.json({ error: 'ownerId is required' }, { status: 400 });
    }

    const contacts = await ContactService.getContactsByOwnerId(ownerId);
    return NextResponse.json({ contacts });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 });
  }
}

// POST /api/contacts - Create a new contact
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.ownerId || !body.name) {
      return NextResponse.json({ error: 'ownerId and name are required' }, { status: 400 });
    }

    const contact = await ContactService.createContact(body);
    return NextResponse.json({ contact }, { status: 201 });
  } catch (error) {
    console.error('Error creating contact:', error);
    return NextResponse.json({ error: 'Failed to create contact' }, { status: 500 });
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
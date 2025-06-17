import { NextRequest, NextResponse } from 'next/server';
import { ContactService } from '@/lib/mongodb/services/contactService';

// GET /api/contacts/search - Search contacts
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const ownerId = searchParams.get('ownerId');
    const query = searchParams.get('q');
    const tag = searchParams.get('tag');
    const category = searchParams.get('category');
    
    if (!ownerId) {
      return NextResponse.json({ error: 'ownerId is required' }, { status: 400 });
    }

    let contacts = [];

    if (query) {
      contacts = await ContactService.searchContacts(ownerId, query);
    } else if (tag) {
      contacts = await ContactService.getContactsByTag(ownerId, tag);
    } else if (category) {
      contacts = await ContactService.getContactsByCategory(ownerId, category);
    } else {
      return NextResponse.json({ error: 'Search query, tag, or category is required' }, { status: 400 });
    }

    return NextResponse.json({ contacts });
  } catch (error) {
    console.error('Error searching contacts:', error);
    return NextResponse.json({ error: 'Failed to search contacts' }, { status: 500 });
  }
} 
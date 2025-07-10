import { NextRequest, NextResponse } from 'next/server';
import { ContactService } from '@/lib/mongodb/services/contactService';

// GET /api/contacts/[id] - Get a contact by ID
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Access params properly using async pattern
    const params = await context.params;
    if (!params?.id) {
      return NextResponse.json({ error: 'Contact ID is required' }, { status: 400 });
    }
    
    const id = params.id;
    const contact = await ContactService.getContactById(id);
    
    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }
    
    return NextResponse.json({ contact });
  } catch (error) {
    console.error('Error fetching contact:', error);
    return NextResponse.json({ error: 'Failed to fetch contact' }, { status: 500 });
  }
}

// PATCH /api/contacts/[id] - Update a contact
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Access params properly using async pattern
    const params = await context.params;
    if (!params?.id) {
      return NextResponse.json({ error: 'Contact ID is required' }, { status: 400 });
    }
    
    const id = params.id;
    const body = await request.json();
    
    const updatedContact = await ContactService.updateContact(id, body);
    
    if (!updatedContact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }
    
    return NextResponse.json({ contact: updatedContact });
  } catch (error) {
    console.error('Error updating contact:', error);
    return NextResponse.json({ error: 'Failed to update contact' }, { status: 500 });
  }
}

// DELETE /api/contacts/[id] - Delete a contact
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Access params properly using async pattern
    const params = await context.params;
    if (!params?.id) {
      return NextResponse.json({ error: 'Contact ID is required' }, { status: 400 });
    }
    
    const id = params.id;
    const deleted = await ContactService.deleteContact(id);
    
    if (!deleted) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }
    
    return NextResponse.json({ message: 'Contact deleted successfully' });
  } catch (error) {
    console.error('Error deleting contact:', error);
    return NextResponse.json({ error: 'Failed to delete contact' }, { status: 500 });
  }
} 
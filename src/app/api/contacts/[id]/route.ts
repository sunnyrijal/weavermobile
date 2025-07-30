import { NextRequest, NextResponse } from 'next/server';
import { ContactService } from '@/lib/mongodb/services/contactService';

// Define relationship maps directly in the API route
const INVERSE_RELATIONSHIP_MAP: Record<string, string> = {
  "Dad": "Child",
  "Mom": "Child",
  "Parent": "Child",
  "Child": "Parent",
  "Brother": "Brother",
  "Sister": "Sister",
  "Sibling": "Sibling",
  "Partner": "Partner",
  "Spouse": "Spouse",
  "Friend": "Friend",
  "Colleague": "Colleague",
  "Cousin": "Cousin",
  "Grandparent": "Grandchild",
  "Grandchild": "Grandparent",
  "Uncle": "Niece/Nephew",
  "Aunt": "Niece/Nephew",
  "Niece": "Uncle/Aunt",
  "Nephew": "Uncle/Aunt",
  "Niece/Nephew": "Uncle/Aunt",
  "Uncle/Aunt": "Niece/Nephew",
  "Pet": "Owner",
  "Owner": "Pet",
};

// Gender-specific relationship mappings
const GENDER_RELATIONSHIP_MAP: Record<string, Record<string, string>> = {
  "Male": {
    "Child": "Son",
    "Parent": "Dad",
    "Sibling": "Brother",
  },
  "Female": {
    "Child": "Daughter",
    "Parent": "Mom",
    "Sibling": "Sister",
  }
};

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

// Helper to ensure inverse relationship is present
async function ensureInverseRelationships(contactId, relationships) {
  // For each relationship, update the related contact
  for (const rel of relationships || []) {
    if (!rel.relatedContactId) continue;
    // Fetch both contacts
    const [contact, relatedContact] = await Promise.all([
      ContactService.getContactById(contactId),
      ContactService.getContactById(rel.relatedContactId)
    ]);
    if (!contact || !relatedContact) continue;
    // Determine inverse type
    let inverseType = INVERSE_RELATIONSHIP_MAP[rel.type] || 'connected';
    if (contact.gender && GENDER_RELATIONSHIP_MAP[contact.gender] && GENDER_RELATIONSHIP_MAP[contact.gender][inverseType]) {
      inverseType = GENDER_RELATIONSHIP_MAP[contact.gender][inverseType];
    }
    // Check if already present
    const already = (relatedContact.relationships || []).find(r => r.relatedContactId === contactId);
    if (!already) {
      const updated = [
        ...(relatedContact.relationships || []),
        { relatedContactId: contactId, type: inverseType }
      ];
      await ContactService.updateContact(rel.relatedContactId, { relationships: updated });
    }
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
    
    // If relationships were updated, ensure inverse relationships
    if (body.relationships) {
      await ensureInverseRelationships(id, body.relationships);
    }
    
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
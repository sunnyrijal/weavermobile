import { NextRequest, NextResponse } from 'next/server';
import { ContactService } from '@/lib/mongodb/services/contactService';

export async function POST(req: NextRequest) {
  try {
    const { mergedContact, duplicateIds } = await req.json();
    if (!mergedContact || !Array.isArray(duplicateIds) || duplicateIds.length === 0) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }
    // Update or create the merged contact
    let merged;
    if (mergedContact.id) {
      merged = await ContactService.updateContact(mergedContact.id, mergedContact);
    } else {
      merged = await ContactService.createContact(mergedContact);
    }
    if (!merged) {
      return NextResponse.json({ error: 'Failed to save merged contact' }, { status: 500 });
    }
    // Delete all duplicates except the merged one
    for (const id of duplicateIds) {
      if (id !== merged.id) {
        await ContactService.deleteContact(id);
      }
    }
    return NextResponse.json({ contact: merged });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to merge contacts' }, { status: 500 });
  }
} 
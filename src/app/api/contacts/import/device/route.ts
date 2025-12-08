import { NextRequest, NextResponse } from 'next/server';
import { ContactService } from '@/lib/mongodb/services/contactService';

interface DeviceContact {
  sourceId: string;
  name: string;
  email?: string;
  phone?: string;
  photoURL?: string;
  details?: string;
}

export async function POST(req: NextRequest) {
  try {
    const { contacts, ownerId } = await req.json();
    
    if (!contacts || !Array.isArray(contacts) || !ownerId) {
      return NextResponse.json({ error: 'Contacts array and ownerId are required' }, { status: 400 });
    }

    const createdContacts = [];
    const skippedContacts = [];
    
    // Get all existing contacts for duplicate checking
    const allContacts = await ContactService.getContactsByOwnerId(ownerId);
    
    for (const contactData of contacts as DeviceContact[]) {
      try {
        // Check for duplicates by email or phone
        let existingContact = null;
        
        if (contactData.email) {
          existingContact = allContacts.find((c: any) => 
            c.email && c.email.toLowerCase() === contactData.email.toLowerCase()
          );
        }
        
        if (!existingContact && contactData.phone) {
          // Normalize phone number for comparison (remove non-digits)
          const normalizedPhone = contactData.phone.replace(/\D/g, '');
          existingContact = allContacts.find((c: any) => {
            if (!c.phone) return false;
            const existingNormalized = c.phone.replace(/\D/g, '');
            return existingNormalized === normalizedPhone && normalizedPhone.length > 0;
          });
        }
        
        if (existingContact) {
          skippedContacts.push({
            name: contactData.name,
            reason: 'Duplicate contact found'
          });
          continue;
        }
        
        // Create new contact
        const contact = await ContactService.createContact({
          name: contactData.name,
          email: contactData.email || undefined,
          phone: contactData.phone || undefined,
          photoURL: contactData.photoURL || undefined,
          notes: contactData.details || undefined,
          importSource: 'Device Contacts',
          tags: ['Imported from Device'],
          ownerId
        });
        
        createdContacts.push(contact);
        // Add to allContacts array for subsequent duplicate checks
        allContacts.push(contact as any);
      } catch (error) {
        console.error('Error creating contact:', error);
        skippedContacts.push({
          name: contactData.name,
          reason: 'Failed to create contact'
        });
        // Continue with other contacts even if one fails
      }
    }

    return NextResponse.json({ 
      message: `Successfully imported ${createdContacts.length} contacts`,
      contacts: createdContacts,
      skipped: skippedContacts.length,
      skippedContacts: skippedContacts
    });
  } catch (error) {
    console.error('Error importing device contacts:', error);
    return NextResponse.json({ error: 'Failed to import device contacts' }, { status: 500 });
  }
}


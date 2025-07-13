import { NextRequest, NextResponse } from 'next/server';
import { parseAdvancedMemory, AdvancedMemoryInput } from '@/ai/flows/advanced-memory-parser';
import { ContactService } from '@/lib/mongodb/services/contactService';

export async function POST(req: NextRequest) {
  try {
    const { memory, ownerId } = await req.json();

    if (!memory || !ownerId) {
      return NextResponse.json(
        { error: 'Missing required fields: memory and ownerId' },
        { status: 400 }
      );
    }

    // Get existing contacts for context
    const existingContacts = await ContactService.getContactsByOwnerId(ownerId);
    
    const input: AdvancedMemoryInput = {
      memory,
      existingContacts: existingContacts.map(contact => ({
        id: contact._id.toString(),
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        birthday: contact.birthday,
        occupation: contact.occupation,
        company: contact.company,
        location: contact.location,
        notes: contact.notes,
        relationships: contact.relationships?.map(rel => ({
          contactId: rel.contactId.toString(),
          type: rel.type,
          name: rel.name
        })) || []
      }))
    };

    console.log('🔍 Advanced Memory Parser Input:', {
      memory,
      contactCount: existingContacts.length
    });

    // Parse the memory using advanced NLP
    const result = await parseAdvancedMemory(input);

    console.log('✨ Advanced Memory Parser Result:', {
      updatesCount: result.updates.length,
      newContactsCount: result.newContacts.length,
      eventsCount: result.events.length,
      confidence: result.confidence,
      ambiguity: result.ambiguity
    });

    // Process updates and create new contacts
    const processedUpdates = [];
    const createdContacts = [];

    // Handle new contacts
    for (const newContact of result.newContacts) {
      try {
        const created = await ContactService.createContact({
          ...newContact,
          ownerId,
          category: 'Other'
        });
        createdContacts.push(created);
        console.log('✅ Created new contact:', created.name);
      } catch (error) {
        console.error('❌ Failed to create new contact:', error);
      }
    }

    // Handle updates to existing contacts
    for (const update of result.updates) {
      if (update.contactId) {
        try {
          const contact = await ContactService.getContactById(update.contactId);
          if (contact) {
            // Apply the update based on field type
            const updateData: any = {};
            
            switch (update.field) {
              case 'name':
                updateData.name = update.value as string;
                break;
              case 'email':
                updateData.email = update.value as string;
                break;
              case 'phone':
                updateData.phone = update.value as string;
                break;
              case 'birthday':
                updateData.birthday = update.value as string;
                break;
              case 'occupation':
                updateData.occupation = update.value as string;
                break;
              case 'company':
                updateData.company = update.value as string;
                break;
              case 'location':
                updateData.location = update.value as string;
                break;
              case 'notes':
                updateData.notes = update.value as string;
                break;
              case 'relationship':
                if (update.relationship) {
                  // Find the related contact
                  const relatedContact = existingContacts.find(c => 
                    c.name.toLowerCase().includes(update.relationship.to?.toLowerCase() || '') ||
                    c.notes?.toLowerCase().includes(update.relationship.to?.toLowerCase() || '')
                  );
                  
                  if (relatedContact) {
                    const newRelationship = {
                      contactId: relatedContact._id,
                      type: update.relationship.type,
                      name: relatedContact.name
                    };
                    
                    updateData.relationships = [
                      ...(contact.relationships || []),
                      newRelationship
                    ];
                  }
                }
                break;
            }

            if (Object.keys(updateData).length > 0) {
              await ContactService.updateContact(update.contactId, updateData);
              processedUpdates.push({
                contactId: update.contactId,
                contactName: contact.name,
                field: update.field,
                value: update.value,
                correction: update.correction,
                confidence: update.confidence
              });
              console.log('✅ Updated contact:', contact.name, update.field, update.value);
            }
          }
        } catch (error) {
          console.error('❌ Failed to update contact:', error);
        }
      }
    }

    return NextResponse.json({
      success: true,
      result: {
        ...result,
        processedUpdates,
        createdContacts: createdContacts.map(c => ({
          id: c._id,
          name: c.name
        }))
      }
    });

  } catch (error) {
    console.error('❌ Advanced Memory Parser Error:', error);
    return NextResponse.json(
      { error: 'Failed to parse advanced memory' },
      { status: 500 }
    );
  }
} 
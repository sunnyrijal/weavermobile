import { NextRequest, NextResponse } from 'next/server';
import { parseAdvancedMemory, AdvancedMemoryInput } from '@/ai/flows/advanced-memory-parser';
import { ContactService } from '@/lib/mongodb/services/contactService';
import { findPotentialContactMatches } from '@/lib/utils';

export async function POST(req: NextRequest) {
  try {
    console.log('🔍 Advanced Memory Parser API called');
    
    const { memory, ownerId } = await req.json();

    if (!memory || !ownerId) {
      console.error('❌ Missing required fields:', { memory: !!memory, ownerId: !!ownerId });
      return NextResponse.json(
        { error: 'Missing required fields: memory and ownerId' },
        { status: 400 }
      );
    }

    console.log('✅ Valid input received:', { memoryLength: memory.length, ownerId });

    // Get existing contacts for context
    const existingContacts = await ContactService.getContactsByOwnerId(ownerId);
    console.log('✅ Retrieved existing contacts:', existingContacts.length);
    
    // Build a map for quick lookup of contact names by id
    const contactIdToName = new Map(existingContacts.map(c => [c._id.toString(), c.name]));
    
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
          contactId: rel.relatedContactId ? rel.relatedContactId.toString() : undefined,
          type: rel.type,
          name: rel.relatedContactId ? contactIdToName.get(rel.relatedContactId.toString()) || '' : ''
        })) || []
      }))
    };

    console.log('🔍 Advanced Memory Parser Input:', {
      memory,
      contactCount: existingContacts.length
    });

    let result;
    try {
      console.log('🤖 Calling parseAdvancedMemory...');
      result = await parseAdvancedMemory(input);
      console.log('✅ parseAdvancedMemory completed successfully');
    } catch(parseErr:any){
      console.error('❌ Raw parser error:', parseErr);
      console.error('❌ Error details:', {
        message: parseErr?.message,
        stack: parseErr?.stack,
        name: parseErr?.name
      });
      return NextResponse.json({ 
        error:'Failed to parse advanced memory', 
        details: parseErr?.message||'parse error'
      }, { status: 500 });
    }

    // Debug: Log the AI result
    console.log('🔍 Advanced Memory Parser Result:', {
      updatesCount: result.updates?.length || 0,
      newContactsCount: result.newContacts?.length || 0,
      eventsCount: result.events?.length || 0,
      confidence: result.confidence,
      ambiguity: result.ambiguity
    });
    
    // Debug: Log the full AI result for detailed inspection
    console.log('🔍 Full AI Result:', JSON.stringify(result, null, 2));

    // Debug: Log the new contacts being created
    if (result.newContacts && result.newContacts.length > 0) {
      console.log('🔍 New contacts to be created:', result.newContacts.map(c => ({
        name: c.name,
        occupation: c.occupation,
        currentLocation: c.currentLocation,
        college: c.college,
        relationships: c.relationships?.length || 0
      })));
    }

    // Process updates and create new contacts
    const processedUpdates = [];
    const createdContacts = [];

    // Process new contacts
    for (const newContact of result.newContacts || []) {
      try {
        // Clean the name - remove any "(The)" or extra words
        const cleanName = newContact.name.replace(/\s*\(The\)\s*/gi, '').replace(/^the\s+/i, '').trim();
        
        // Validate that this contact was actually mentioned in the memory
        const isMentionedInMemory = memory.toLowerCase().includes(cleanName.toLowerCase());
        if (!isMentionedInMemory) {
          console.log('⚠️ Contact not mentioned in memory, skipping:', cleanName);
          continue;
        }
        
        // Check if contact already exists (case insensitive)
        const existingContact = existingContacts.find(c => 
          c.name.toLowerCase() === cleanName.toLowerCase()
        );
        
        if (existingContact) {
          console.log('⚠️ Contact already exists, updating instead of creating:', cleanName);
          
          // Update the existing contact with new information
          const updateData: any = {};
          
          if (newContact.birthday) updateData.birthday = newContact.birthday;
          if (newContact.occupation) updateData.occupation = newContact.occupation;
          if (newContact.company) updateData.company = newContact.company;
          if (newContact.location) updateData.currentLocation = newContact.location;
          if (newContact.hometown) updateData.hometown = newContact.hometown;
          if (newContact.college) updateData.college = newContact.college;
          if (newContact.notes) updateData.notes = newContact.notes;
          
          if (Object.keys(updateData).length > 0) {
            await ContactService.updateContact(existingContact.id, updateData);
            console.log('✅ Updated existing contact:', cleanName, updateData);
          }
          
          // Process relationships for the existing contact
          if (newContact.relationships && newContact.relationships.length > 0) {
            for (const rel of newContact.relationships) {
              // Clean the related contact name
              const cleanRelName = rel.name.replace(/\s*\(The\)\s*/gi, '').replace(/^the\s+/i, '').trim();
              
              // Validate that the related contact was also mentioned in the memory
              const isRelatedMentionedInMemory = memory.toLowerCase().includes(cleanRelName.toLowerCase());
              if (!isRelatedMentionedInMemory) {
                console.log('⚠️ Related contact not mentioned in memory, skipping:', cleanRelName);
                continue;
              }
              
              // Find or create the related contact
              let relatedContact = existingContacts.find(c => 
                c.name.toLowerCase() === cleanRelName.toLowerCase()
              );
              
              if (!relatedContact) {
                // Create the related contact if it doesn't exist
                const relatedContactData = {
                  name: cleanRelName,
                  ownerId,
                  category: rel.type === 'Pet' ? 'Pet' : 'Family',
                  relationships: []
                };
                
                relatedContact = await ContactService.createContact(relatedContactData);
                existingContacts.push(relatedContact);
                console.log('✅ Created related contact:', relatedContact.name, 'with category:', relatedContactData.category);
              }
              
              // Add relationship to the existing contact
              await ContactService.updateContact(existingContact.id, {
                relationships: [
                  ...(existingContact.relationships || []),
                  { relatedContactId: relatedContact.id, type: rel.type }
                ]
              });
              
              // Add inverse relationship to the related contact
              const inverseType = rel.type === 'Brother' || rel.type === 'Sister' ? rel.type : 
                (['Parent', 'Mother', 'Father'].includes(rel.type) ? 'Child' : 
                (['Child', 'Son', 'Daughter'].includes(rel.type) ? 'Parent' : 
                (rel.type === 'Pet' ? 'Owner' : rel.type)));
              
              await ContactService.updateContact(relatedContact.id, {
                relationships: [
                  ...(relatedContact.relationships || []),
                  { relatedContactId: existingContact.id, type: inverseType }
                ]
              });
            }
          }
          
          continue;
        }
        
        // Create the contact without relationships first
        const contactData = {
          ...newContact,
          name: cleanName, // Use cleaned name
          ownerId,
          category: 'Other',
          relationships: [] // Start with empty relationships
        };
        
        // Remove relationships from contactData as they'll be handled separately
        delete contactData.relationships;
        
        const created = await ContactService.createContact(contactData);
        createdContacts.push(created);
        console.log('✅ Created new contact:', created.name);
        
        // Add to existing contacts for relationship processing
        existingContacts.push(created);
        
        // Process relationships if they exist in the newContact
        if (newContact.relationships && newContact.relationships.length > 0) {
          for (const rel of newContact.relationships) {
            // Clean the related contact name
            const cleanRelName = rel.name.replace(/\s*\(The\)\s*/gi, '').replace(/^the\s+/i, '').trim();
            
            // Validate that the related contact was also mentioned in the memory
            const isRelatedMentionedInMemory = memory.toLowerCase().includes(cleanRelName.toLowerCase());
            if (!isRelatedMentionedInMemory) {
              console.log('⚠️ Related contact not mentioned in memory, skipping:', cleanRelName);
              continue;
            }
            
            // Find or create the related contact
            let relatedContact = existingContacts.find(c => 
              c.name.toLowerCase() === cleanRelName.toLowerCase()
            );
            
                          if (!relatedContact) {
                // Create the related contact if it doesn't exist
                const relatedContactData = {
                  name: cleanRelName,
                  ownerId,
                  category: rel.type === 'Pet' ? 'Pet' : 'Family',
                  relationships: []
                };
                
                relatedContact = await ContactService.createContact(relatedContactData);
                existingContacts.push(relatedContact);
                console.log('✅ Created related contact:', relatedContact.name, 'with category:', relatedContactData.category);
              }
            
            // Add relationship to the main contact
            await ContactService.updateContact(created.id, {
              relationships: [
                ...(created.relationships || []),
                { relatedContactId: relatedContact.id, type: rel.type }
              ]
            });
            
            // Add inverse relationship to the related contact
            const inverseType = rel.type === 'Brother' || rel.type === 'Sister' ? rel.type : 
              (['Parent', 'Mother', 'Father'].includes(rel.type) ? 'Child' : 
              (['Child', 'Son', 'Daughter'].includes(rel.type) ? 'Parent' : rel.type));
            
            await ContactService.updateContact(relatedContact.id, {
              relationships: [
                ...(relatedContact.relationships || []),
                { relatedContactId: created.id, type: inverseType }
              ]
            });
          }
        }
      } catch (error) {
        console.error('❌ Failed to create new contact:', error);
      }
    }

    // === Custom Disambiguation and Update Logic ===
    // For each update in result.updates, try to match contact by name (if contactId not present)
    for (const update of result.updates || []) {
      let contactId = update.contactId;
      let contactName = update.contactName || update.name || '';
      let field = update.field;
      let value = update.value;
      if (!contactId && contactName) {
        // Use disambiguation logic
        const matches = findPotentialContactMatches(contactName, existingContacts);
        if (matches.length === 1) {
          contactId = matches[0].id;
        } else if (matches.length > 1) {
          // Return ambiguous response for UI to resolve
          return NextResponse.json({
            ambiguous: true,
            message: `Multiple contacts found for '${contactName}'. Please select which one to update.`,
            options: matches.map(m => ({ id: m.id, name: m.name, nickname: m.nickname, similarity: m.similarity }))
          });
        } else {
          // No match, create new contact
          const newContact = await ContactService.createContact({ ownerId, name: contactName, [field]: value });
          processedUpdates.push({ contactId: newContact.id, contactName, field, value, created: true });
          continue;
        }
      }
      if (contactId) {
        // Update the contact
        const updateData = { [field]: value };
        await ContactService.updateContact(contactId, updateData);
        processedUpdates.push({ contactId, contactName, field, value, updated: true });
      }
    }

    // After processing updates to existing contacts
    // === Handle relationship updates ===
    const nameSimilarity = (a: string, b: string) => {
      const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim();
      const n1 = normalize(a);
      const n2 = normalize(b);
      if (n1 === n2) return 1;
      // very simple similarity: proportion of same starting tokens
      const tokens1 = n1.split(' ');
      const tokens2 = n2.split(' ');
      const match = tokens1.filter(t => tokens2.includes(t)).length;
      return match / Math.max(tokens1.length, tokens2.length);
    };

    const getContactByNameFuzzy = (name: string) => {
      let best: any = null;
      let bestScore = 0.0;
      for (const c of existingContacts) {
        const score = nameSimilarity(name, c.name);
        if (score > bestScore) { bestScore = score; best = c; }
      }
      return bestScore > 0.6 ? best : null;
    };

    const isParentType = (t: string) => ['Mom', 'Dad', 'Parent', 'Mother', 'Father'].includes(t);
    const isChildType = (t: string) => ['Child', 'Son', 'Daughter'].includes(t);

    for (const upd of result.updates || []) {
      if (upd.field === 'relationship' && upd.relationship) {
        // Resolve from & to contacts
        let fromContact: any = null;
        if (upd.contactId) {
          fromContact = await ContactService.getContactById(upd.contactId);
        } else {
          fromContact = getContactByNameFuzzy(upd.contactName);
        }
        if (!fromContact) continue;

        const toName = upd.relationship.to || '';
        let toContact = getContactByNameFuzzy(toName);
        if (!toContact) {
          // create new contact with ownerId
          const category = upd.relationship.type === 'Pet' ? 'Pet' : 'Family';
          toContact = await ContactService.createContact({ ownerId, name: toName, category });
          existingContacts.push(toContact);
        }

        // Ensure bidirectional link
        await ContactService.updateContact(fromContact.id, { 
          relationships: [
            ...(fromContact.relationships || []),
            { relatedContactId: toContact.id, type: upd.relationship.type }
          ]
        });

        const inverseType = upd.relationship.type === 'Brother' || upd.relationship.type === 'Sister' ? upd.relationship.type : 
          (isParentType(upd.relationship.type) ? 'Child' : 
          (isChildType(upd.relationship.type) ? 'Parent' : 
          (upd.relationship.type === 'Pet' ? 'Owner' : upd.relationship.type)));

        await ContactService.updateContact(toContact.id, {
          relationships: [
            ...(toContact.relationships || []),
            { relatedContactId: fromContact.id, type: inverseType }
          ]
        });

        // Propagate parent to siblings
        if (isParentType(upd.relationship.type)) {
          for (const c of existingContacts) {
            if (c.id === fromContact.id) continue;
            if (c.relationships && c.relationships.find(r => r.relatedContactId === fromContact.id && ['Brother','Sister','Sibling'].includes(r.type))) {
              // sibling of child
              const hasParent = c.relationships.find(r => r.relatedContactId === toContact.id && isParentType(r.type));
              if (!hasParent) {
                await ContactService.updateContact(c.id, { relationships: [...c.relationships, { relatedContactId: toContact.id, type: 'Parent' }] });
              }
              const hasChildBack = toContact.relationships && toContact.relationships.find(r => r.relatedContactId === c.id && isChildType(r.type));
              if (!hasChildBack) {
                await ContactService.updateContact(toContact.id, { relationships: [...(toContact.relationships||[]), { relatedContactId: c.id, type: 'Child' }] });
              }
            }
          }
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
      { error: 'Failed to parse advanced memory', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 
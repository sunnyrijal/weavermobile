import { NextRequest, NextResponse } from 'next/server';
import { processVoiceInput } from '@/ai/flows/process-voice-input-flow';
import { parseContactInfo } from '@/ai/flows/parse-contact-info-flow';
import { ContactService } from '@/lib/mongodb/services/contactService';
import { MemoryService } from '@/lib/mongodb/services/memoryService';
import { UserService } from '@/lib/mongodb/services/userService';
import { parseTextWithGeminiCli } from '@/lib/gemini-cli-integration';

// Helper function to deduplicate people based on nickname/full name relationships
function deduplicatePeople(people: string[], transcript: string): string[] {
  const nameMap = new Map<string, string>();
  const duplicates = new Set<string>();
  
  // Look for patterns like "Jake" and "Jacob Lucas" in the transcript
  const namePatterns = [
    // Pattern: "nickname" and "full name" mentioned separately
    /(\w+).*?full name.*?(\w+\s+\w+)/gi,
    /(\w+).*?real name.*?(\w+\s+\w+)/gi,
    /(\w+).*?actually.*?(\w+\s+\w+)/gi,
    // Pattern: "nickname (full name)" or "full name (nickname)"
    /(\w+)\s*\((\w+\s+\w+)\)/gi,
    /(\w+\s+\w+)\s*\((\w+)\)/gi,
  ];
  
  for (const pattern of namePatterns) {
    const matches = transcript.matchAll(pattern);
    for (const match of matches) {
      const nickname = match[1].trim();
      const fullName = match[2].trim();
      
      // Determine which is the nickname and which is the full name
      const isNicknameShorter = nickname.split(' ').length < fullName.split(' ').length;
      const actualNickname = isNicknameShorter ? nickname : fullName;
      const actualFullName = isNicknameShorter ? fullName : nickname;
      
      nameMap.set(actualNickname.toLowerCase(), actualFullName);
      duplicates.add(actualNickname.toLowerCase());
    }
  }
  
  // Filter out duplicates and use full names
  const deduplicated = people.filter(person => {
    const personLower = person.toLowerCase();
    
    // If this person has a nickname that maps to a full name, use the full name
    if (nameMap.has(personLower)) {
      const fullName = nameMap.get(personLower);
      // Check if the full name is already in the list
      const fullNameExists = people.some(p => p.toLowerCase() === fullName?.toLowerCase());
      if (fullNameExists) {
        return false; // Remove the nickname
      } else {
        return true; // Keep the nickname but we'll replace it with full name
      }
    }
    
    // If this person is a full name that has a nickname, keep it
    const hasNickname = Array.from(nameMap.values()).some(fullName => 
      fullName.toLowerCase() === personLower
    );
    if (hasNickname) {
      return true; // Keep the full name
    }
    
    // If this person is not involved in any nickname/full name relationship, keep it
    return !duplicates.has(personLower);
  });
  
  // Replace nicknames with full names
  return deduplicated.map(person => {
    const personLower = person.toLowerCase();
    return nameMap.get(personLower) || person;
  });
}

export async function POST(req: NextRequest) {
  try {
    const { transcript, ownerId, inputType = 'voice' } = await req.json();
    
    if (!transcript || !ownerId) {
      return NextResponse.json({ error: 'Transcript and ownerId are required' }, { status: 400 });
    }

    // Check AI parsing limits
    const usageCheck = await UserService.canUseAiParsing(ownerId);
    if (!usageCheck.canUse) {
      return NextResponse.json({ 
        error: 'AI parsing limit reached', 
        details: `You have used ${usageCheck.limit - usageCheck.remaining}/${usageCheck.limit} AI parsing sessions this month. Upgrade to Pro for unlimited parsing.`,
        upgradeRequired: true
      }, { status: 403 });
    }

    console.log('🔍 Memory Parser API called');
    console.log('Input type:', inputType);
    console.log('Transcript length:', transcript.length);

    // Try Gemini CLI first for enhanced parsing
    let geminiCliResult = null;
    let extractedNames: string[] = [];
    
    try {
      console.log('🚀 Attempting Gemini CLI parsing...');
      const user = await UserService.getUserByUid(ownerId);
      const userProfile = {
        education: {
          college: (user as any)?.education?.college || (user as any)?.college || ''
        }
      };
      geminiCliResult = await parseTextWithGeminiCli(transcript, userProfile, ownerId);
      
      if (geminiCliResult.contacts.length > 0) {
        console.log('✅ Gemini CLI parsing successful');
        console.log('Contacts found:', geminiCliResult.contacts.length);
        
        // Extract people from Gemini CLI results
        extractedNames = geminiCliResult.contacts.map((contact: any) => contact.name);
        console.log('📋 People extracted via Gemini CLI:', extractedNames);
        
        // Replace the original contacts with processed ones
        geminiCliResult.contacts = geminiCliResult.contacts;
        console.log('🔧 Processed contacts in API:', geminiCliResult.contacts);
        
        extractedNames = geminiCliResult.contacts.map(c => c.name);
      } else {
        console.log('⚠️ Gemini CLI returned no contacts, falling back to existing processing');
      }
    } catch (error) {
      console.log('⚠️ Gemini CLI parsing failed, using fallback:', error);
    }

    // Fallback to existing processing if Gemini CLI fails or returns no results
    let memoryResult;
    let contactResult;
    
    if (!geminiCliResult || geminiCliResult.contacts.length === 0) {
      console.log('🔄 Using fallback processing...');
      
      // Process the transcript to extract entities and create summary
      memoryResult = await processVoiceInput({ transcript });
      
      // Parse contact information from the transcript
      contactResult = await parseContactInfo({ transcript });
      
      // Extract names from the fallback processing
      if (memoryResult.extractedEntities?.people) {
        extractedNames = memoryResult.extractedEntities.people;
      }
    } else {
      // Use Gemini CLI results
      memoryResult = {
        summary: `Processed ${geminiCliResult.contacts.length} contacts using Gemini CLI`,
        extractedEntities: {
          people: extractedNames,
          organizations: geminiCliResult.contacts.flatMap(c => [c.company, c.college].filter(Boolean)),
          relationships: geminiCliResult.contacts.flatMap(c => c.relationships?.map(r => `${c.name}'s ${r.type}: ${r.name}`) || []),
          locations: geminiCliResult.contacts.flatMap(c => [c.hometown, c.currentLocation].filter(Boolean)),
          keyEvents: []
        }
      };
      
      contactResult = geminiCliResult.contacts[0] || {};
    }

    // Post-process to deduplicate people based on nickname/full name relationships
    if (memoryResult.extractedEntities?.people) {
      const deduplicatedPeople = deduplicatePeople(memoryResult.extractedEntities.people, transcript);
      memoryResult.extractedEntities.people = deduplicatedPeople;
      extractedNames = deduplicatedPeople;
    }
    
    // Get existing contacts to check for matches
    const existingContacts = await ContactService.getContactsByOwnerId(ownerId);
    
    // Find potential matches based on names
    const potentialMatches = existingContacts.filter(contact => {
      const contactName = contact.name.toLowerCase();
      return extractedNames.some(name => name.toLowerCase() === contactName);
    });

    // Determine which extracted names are NEW
    const newNames = extractedNames.filter(name => !potentialMatches.find(c => c.name.toLowerCase() === name.toLowerCase()));

    const createdContacts: any[] = [];
    
    // Create new contacts from Gemini CLI results if available
    if (geminiCliResult && geminiCliResult.contacts.length > 0) {
      for (const parsedContact of geminiCliResult.contacts) {
        // Check if contact already exists
        const existingContact = existingContacts.find(c => 
          c.name.toLowerCase() === parsedContact.name.toLowerCase()
        );

        if (!existingContact) {
          try {
            const contactData = {
              ownerId,
              name: parsedContact.name,
              email: parsedContact.email,
              phone: parsedContact.phone,
              occupation: parsedContact.occupation,
              company: parsedContact.company,
              college: parsedContact.college,
              birthday: parsedContact.birthday,
              hometown: parsedContact.hometown,
              currentLocation: parsedContact.currentLocation,
              nickname: parsedContact.nickname,
              notes: parsedContact.notes,
              tags: parsedContact.interests || [],
              category: 'Other',
              relationships: parsedContact.relationships?.map(rel => ({
                name: rel.name,
                type: rel.type,
                notes: rel.notes
              })) || []
            };

            const created = await ContactService.createContact(contactData as any);
            createdContacts.push(created);
            potentialMatches.push(created);
            console.log('✅ Created contact via Gemini CLI:', created.name);
          } catch (e) {
            console.error('Failed to create contact for extracted name', parsedContact.name, e);
          }
        }
      }
    } else {
      // Fallback: Create basic contacts for new names
      for (const newName of newNames) {
        try {
          const created = await ContactService.createContact({ ownerId, name: newName, category: 'Uncategorized' });
          createdContacts.push(created);
          potentialMatches.push(created); // so memory links include them
        } catch (e) {
          console.error('Failed to create contact for extracted name', newName, e);
        }
      }
    }

    // Create a memory entry
    const memoryData = {
      ownerId,
      timestamp: new Date(),
      inputType: inputType as 'voice' | 'text',
      transcript,
      summary: memoryResult.summary,
      entities: memoryResult.extractedEntities,
      linkedContactIds: potentialMatches.map(c => c.id),
      tags: []
    };

    const savedMemory = await MemoryService.createMemory(memoryData as any);

    // Increment AI parsing usage for free users
    await UserService.incrementAiParsingUsage(ownerId);

    return NextResponse.json({
      memory: savedMemory,
      parsedContact: contactResult,
      potentialMatches,
      createdContacts,
      extractedEntities: memoryResult.extractedEntities,
      summary: memoryResult.summary,
      geminiCliUsed: !!geminiCliResult,
      confidence: geminiCliResult?.confidence || 0.7,
      processingTime: geminiCliResult?.processingTime || 0,
      usage: {
        remaining: usageCheck.remaining - 1,
        limit: usageCheck.limit
      }
    });
  } catch (error) {
    console.error('Error processing memory:', error);
    return NextResponse.json({ 
      error: 'Failed to process memory',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 
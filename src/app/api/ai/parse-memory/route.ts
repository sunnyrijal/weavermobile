import { NextRequest, NextResponse } from 'next/server';
import { processVoiceInput } from '@/ai/flows/process-voice-input-flow';
import { parseContactInfo } from '@/ai/flows/parse-contact-info-flow';
import { ContactService } from '@/lib/mongodb/services/contactService';
import { MemoryService } from '@/lib/mongodb/services/memoryService';

export async function POST(req: NextRequest) {
  try {
    const { transcript, ownerId, inputType = 'voice' } = await req.json();
    
    if (!transcript || !ownerId) {
      return NextResponse.json({ error: 'Transcript and ownerId are required' }, { status: 400 });
    }

    // Process the transcript to extract entities and create summary
    const memoryResult = await processVoiceInput({ transcript });
    
    // Parse contact information from the transcript
    const contactResult = await parseContactInfo({ transcript });
    
    // Get existing contacts to check for matches
    const existingContacts = await ContactService.getContactsByOwnerId(ownerId);
    
    // Find potential matches based on names
    const potentialMatches = existingContacts.filter(contact => {
      const contactName = contact.name.toLowerCase();
      const extractedNames = memoryResult.extractedEntities?.people || [];
      
      return extractedNames.some(name => 
        name.toLowerCase().includes(contactName) || 
        contactName.includes(name.toLowerCase())
      );
    });

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

    const savedMemory = await MemoryService.createMemory(memoryData);

    return NextResponse.json({
      memory: savedMemory,
      parsedContact: contactResult,
      potentialMatches,
      extractedEntities: memoryResult.extractedEntities,
      summary: memoryResult.summary
    });
  } catch (error) {
    console.error('Error processing memory:', error);
    return NextResponse.json({ 
      error: 'Failed to process memory',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 
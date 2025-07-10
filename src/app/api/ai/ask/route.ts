import { NextRequest, NextResponse } from 'next/server';
import { answerContactQuestion } from '@/ai/flows/answer-contact-question-flow';
import { ContactService } from '@/lib/mongodb/services/contactService';

export async function POST(req: NextRequest) {
  try {
    const { question, ownerId } = await req.json();
    
    if (!question || !ownerId) {
      return NextResponse.json({ error: 'Question and ownerId are required' }, { status: 400 });
    }

    // Get all contacts for the user
    const contacts = await ContactService.getContactsByOwnerId(ownerId);
    
    if (contacts.length === 0) {
      return NextResponse.json({ 
        answer: "You don't have any contacts yet. Add some contacts to ask questions about them." 
      });
    }

    // Enrich contacts for AI processing
    const enrichedContacts = contacts.map(contact => ({
      ...contact,
      relationships: contact.relationships?.map(rel => {
        const relatedContact = contacts.find(c => c.id === rel.relatedContactId);
        return {
          ...rel,
          relatedContactName: relatedContact?.name || 'Unknown Contact'
        };
      }) || []
    }));

    // Process the question with AI
    const result = await answerContactQuestion({
      question,
      contacts: enrichedContacts
    });

    return NextResponse.json({ answer: result.answer });
  } catch (error) {
    console.error('Error processing AI question:', error);
    return NextResponse.json({ 
      error: 'Failed to process question',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 
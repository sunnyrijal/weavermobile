import { NextRequest, NextResponse } from 'next/server';
import { answerContactQuestion } from '@/ai/flows/answer-contact-question-flow';
import { ContactService } from '@/lib/mongodb/services/contactService';

// Age calculation utility
function calculateAge(birthday: string): number | null {
  if (!birthday) return null;
  
  try {
    const birthDate = new Date(birthday);
    if (isNaN(birthDate.getTime())) return null;
    
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    // Adjust age if birthday hasn't occurred yet this year
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  } catch (error) {
    console.error('Error calculating age from birthday:', birthday, error);
    return null;
  }
}

// Clean contact names to remove "(The)" and other artifacts
function cleanContactName(name: string): string {
  return name.replace(/\s*\(The\)\s*/gi, '').replace(/^the\s+/i, '').trim();
}

function formatBirthdayForAI(birthday: string | undefined, birthYear: string | undefined): string | undefined {
  if (!birthday) return undefined;
  
  // If already in YYYY-MM-DD format, return as is
  if (/^\d{4}-\d{2}-\d{2}$/.test(birthday)) {
    return birthday;
  }
  
  // Convert "feb 25" format to YYYY-MM-DD
  const monthMap: { [key: string]: string } = {
    'jan': '01', 'january': '01',
    'feb': '02', 'february': '02',
    'mar': '03', 'march': '03',
    'apr': '04', 'april': '04',
    'may': '05',
    'jun': '06', 'june': '06',
    'jul': '07', 'july': '07',
    'aug': '08', 'august': '08',
    'sep': '09', 'september': '09',
    'oct': '10', 'october': '10',
    'nov': '11', 'november': '11',
    'dec': '12', 'december': '12'
  };
  
  const match = birthday.toLowerCase().match(/^([a-z]+)\s+(\d+)$/);
  if (match) {
    const month = monthMap[match[1]];
    const day = match[2].padStart(2, '0');
    const year = birthYear || '2000'; // Default year if not provided
    return `${year}-${month}-${day}`;
  }
  
  return birthday; // Return original if can't parse
}

// Post-process AI response to convert birthday to age for age queries
function postProcessAIResponse(response: string, question: string): string {
  console.log('🔍 Post-processing response:', { question, response });
  
  // Check if user asked for age (case insensitive)
  const isAgeQuery = /age/i.test(question);
  
  if (isAgeQuery) {
    // Look for birthday patterns in the response
    const birthdayPatterns = [
      /birthday:\s*(\d{4}-\d{2}-\d{2})/i,
      /(\d{4}-\d{2}-\d{2})/i, // Any date format
      /(\d{4}-\d{1,2}-\d{1,2})/i // More flexible date format
    ];
    
    for (const pattern of birthdayPatterns) {
      const match = response.match(pattern);
      if (match) {
        const birthday = match[1];
        const age = calculateAge(birthday);
        if (age !== null) {
          console.log('✅ Converting birthday to age:', { birthday, age });
          // Replace the birthday with age
          const newResponse = response.replace(pattern, `age: ${age} years old`);
          return newResponse;
        }
      }
    }
    
    // If no birthday found but it's an age query, try to find any date
    const anyDateMatch = response.match(/(\d{4}-\d{1,2}-\d{1,2})/);
    if (anyDateMatch) {
      const date = anyDateMatch[1];
      const age = calculateAge(date);
      if (age !== null) {
        console.log('✅ Converting date to age:', { date, age });
        return response.replace(anyDateMatch[0], `age: ${age} years old`);
      }
    }
  }
  
  return response;
}

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
      name: cleanContactName(contact.name), // Clean the name
      birthday: formatBirthdayForAI(contact.birthday, contact.birthYear), // Convert birthday format
      major: contact.major, // Include major field
      relationships: contact.relationships?.map(rel => {
        const relatedContact = contacts.find(c => c.id === rel.relatedContactId);
        return {
          ...rel,
          relatedContactName: relatedContact ? cleanContactName(relatedContact.name) : 'Unknown Contact'
        };
      }) || []
    }));

    // Debug: Log the contact data being sent to AI
    console.log('🔍 Contacts being sent to AI:', enrichedContacts.map(c => ({
      name: c.name,
      occupation: c.occupation,
      currentLocation: c.currentLocation,
      college: c.college,
      notes: c.notes?.substring(0, 100) + '...',
      relationships: c.relationships?.length || 0
    })));

    // Process the question with AI
    const result = await answerContactQuestion({
      question,
      contacts: enrichedContacts
    });

    // Post-process the AI response for age questions
    const processedAnswer = postProcessAIResponse(result.answer, question);

    return NextResponse.json({ answer: processedAnswer });
  } catch (error) {
    console.error('Error processing AI question:', error);
    return NextResponse.json({ 
      error: 'Failed to process question',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 
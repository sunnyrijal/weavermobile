import { NextRequest, NextResponse } from 'next/server';
import { parseContactInfo, convertParsedContactsToContactFormat } from '@/lib/gemini-parser-service';
import { ContactService } from '@/lib/mongodb/services/contactService';

export async function POST(request: NextRequest) {
  try {
    const { text, ownerId, includeRelationships = false, userProfile } = await request.json();
    
    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text input is required' },
        { status: 400 }
      );
    }

    console.log('🔍 Gemini Parser API called (using new structured parsing)');
    console.log('Text length:', text.length);
    console.log('Text sample:', text.substring(0, 100) + '...');
    console.log('Owner ID:', ownerId);

    const startTime = Date.now();
    
    // Use new Gemini structured parsing service
    console.log('🚀 Calling Gemini structured parsing...');
    const parsedResult = await parseContactInfo(text);
    const processingTime = Date.now() - startTime;

    console.log('✅ Gemini parsing completed');
    console.log('Contacts found:', parsedResult.contacts.length);
    console.log('Confidence:', parsedResult.confidence);
    console.log('Processing time:', processingTime, 'ms');
    console.log('Processing notes:', parsedResult.processingNotes);

    // Convert to the format expected by the existing codebase
    const convertedContacts = convertParsedContactsToContactFormat(parsedResult.contacts, ownerId || '');

    // Determine update type from the parsed contacts
    const hasExistingContacts = parsedResult.contacts.some(c => c.status === 'existing');
    const updateTypes = parsedResult.contacts.map(c => c.updateType);
    const primaryUpdateType = updateTypes[0] || 'new_contact';
    const isUpdate = hasExistingContacts || primaryUpdateType !== 'new_contact';

    console.log('🔍 Contact update analysis:');
    console.log('  - Has existing contacts:', hasExistingContacts);
    console.log('  - Primary update type:', primaryUpdateType);
    console.log('  - Is update:', isUpdate);

    // Note: Contacts are not created immediately - they will be created when the memory is saved
    // This prevents premature contact creation and allows users to review before saving
    console.log('📋 Contacts parsed but not created yet - will be created when memory is saved');

    return NextResponse.json({
      success: true,
      contacts: convertedContacts,
      confidence: parsedResult.confidence,
      processingTime: processingTime,
      geminiCliUsed: true, // Keep for backward compatibility
      category: isUpdate ? 'Contact Update' : 'New Contact',
      isUpdate: isUpdate,
      processingNotes: parsedResult.processingNotes
    });

  } catch (error) {
    console.error('❌ Gemini parsing error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to parse text with Gemini API',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 
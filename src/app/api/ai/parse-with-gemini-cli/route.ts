import { NextRequest, NextResponse } from 'next/server';
import { parseTextWithGeminiCli, parseTextWithRelationships, detectContactUpdateType } from '@/lib/gemini-cli-integration';
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

    console.log('🔍 Gemini CLI Parser API called');
    console.log('Text length:', text.length);
    console.log('Include relationships:', includeRelationships);
    console.log('Text sample:', text.substring(0, 100) + '...');
    console.log('User profile:', userProfile);
    console.log('Owner ID:', ownerId);

    // Use Gemini CLI for parsing
    const parseFunction = includeRelationships ? parseTextWithRelationships : parseTextWithGeminiCli;
    console.log('📝 Using parse function:', includeRelationships ? 'parseTextWithRelationships' : 'parseTextWithGeminiCli');
    
    console.log('🚀 Calling Gemini CLI integration...');
    const result = await parseFunction(text, userProfile, ownerId);
    console.log('✅ Gemini CLI integration completed');

    console.log('✅ Gemini CLI parsing completed');
    console.log('Contacts found:', result.contacts.length);
    console.log('Confidence:', result.confidence);
    console.log('Processing time:', result.processingTime, 'ms');
    console.log('Contacts details:', result.contacts);

    // Detect if this is a contact update vs. new contact creation
    const updateType = detectContactUpdateType(text);
    console.log('🔍 Contact update type detection:', updateType);

    // Note: Contacts are not created immediately - they will be created when the memory is saved
    // This prevents premature contact creation and allows users to review before saving
    console.log('📋 Contacts parsed but not created yet - will be created when memory is saved');

    return NextResponse.json({
      success: true,
      contacts: result.contacts,
      confidence: result.confidence,
      processingTime: result.processingTime,
      geminiCliUsed: true,
      category: updateType.category,
      isUpdate: updateType.isUpdate
    });

  } catch (error) {
    console.error('❌ Gemini CLI parsing error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to parse text with Gemini CLI',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 
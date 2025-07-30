import { NextRequest, NextResponse } from 'next/server';
import { enhancedContactParsingService } from '@/lib/enhanced-contact-parsing';

export async function POST(req: NextRequest) {
  try {
    const { text, ownerId } = await req.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text input is required' },
        { status: 400 }
      );
    }

    console.log('🔍 Enhanced Contact Parsing API called with text:', text.substring(0, 100) + '...');

    // Initialize the enhanced contact parsing service
    await enhancedContactParsingService.initialize();

    // Parse contacts with enhanced NLP preprocessing
    const result = await enhancedContactParsingService.parseContactsWithNLP(text, ownerId);

    console.log('✅ Enhanced Contact Parsing completed:');
    console.log(`  - Total contacts: ${result.mergedContacts.length}`);
    console.log(`  - NLP entities found: ${result.nlpEntities.length}`);
    console.log(`  - Gemini CLI success: ${result.geminiCliResult !== null}`);
    console.log(`  - Overall confidence: ${result.confidence}`);
    console.log(`  - Total processing time: ${result.processingTime}ms`);
    console.log(`  - NLP processing time: ${result.nlpProcessingTime}ms`);
    console.log(`  - Gemini CLI processing time: ${result.geminiProcessingTime}ms`);

    return NextResponse.json(result);

  } catch (error) {
    console.error('❌ Enhanced Contact Parsing API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to parse contacts with enhanced processing',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 
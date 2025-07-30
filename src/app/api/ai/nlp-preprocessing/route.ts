import { NextRequest, NextResponse } from 'next/server';
import { nlpPreprocessingService } from '@/lib/nlp-preprocessing';

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text input is required' },
        { status: 400 }
      );
    }

    console.log('🔍 NLP Preprocessing API called with text:', text.substring(0, 100) + '...');

    // Initialize the NLP preprocessing service
    await nlpPreprocessingService.initialize();

    // Process the text
    const result = await nlpPreprocessingService.preprocessText(text);

    console.log('✅ NLP Preprocessing completed:');
    console.log(`  - Persons found: ${result.entities.persons.length}`);
    console.log(`  - Locations found: ${result.entities.locations.length}`);
    console.log(`  - Organizations found: ${result.entities.organizations.length}`);
    console.log(`  - Confidence: ${result.confidence}`);
    console.log(`  - Processing time: ${result.processingTime}ms`);

    return NextResponse.json(result);

  } catch (error) {
    console.error('❌ NLP Preprocessing API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process text with NLP',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 
// parse-with-enhanced-parser/route.ts
// API route for enhanced parser service integration

import { NextRequest, NextResponse } from 'next/server';
import EnhancedParserIntegration from '@/lib/enhanced-parser-integration';

const enhancedParser = new EnhancedParserIntegration();

export async function POST(request: NextRequest) {
  try {
    const { text, ownerId } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    console.log('🔧 Enhanced parser request received');
    console.log(`📝 Text length: ${text.length} characters`);

    // Check if enhanced parser service is available
    const isHealthy = await enhancedParser.checkHealth();
    if (!isHealthy) {
      console.log('⚠️ Enhanced parser service not available, falling back to Gemini CLI');
      return NextResponse.json(
        { error: 'Enhanced parser service not available' },
        { status: 503 }
      );
    }

    // Parse with enhanced parser
    const result = await enhancedParser.parseWithEnhancedParser(text, ownerId);

    console.log(`✅ Enhanced parser completed`);
    console.log(`📊 Contacts found: ${result.contacts.length}`);
    console.log(`🎯 Confidence: ${result.confidence}`);
    console.log(`⏱️ Processing time: ${result.processingTime}ms`);

    return NextResponse.json({
      success: true,
      contacts: result.contacts,
      confidence: result.confidence,
      processingTime: result.processingTime,
      method: 'enhanced-parser',
    });

  } catch (error) {
    console.error('❌ Enhanced parser error:', error);
    return NextResponse.json(
      { 
        error: 'Enhanced parser failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 
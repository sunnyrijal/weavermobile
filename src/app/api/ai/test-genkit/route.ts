import { NextRequest, NextResponse } from 'next/server';
import { ai } from '@/ai/genkit';
import { z } from 'zod';

const TestPromptSchema = z.object({
  message: z.string().describe('A simple test message')
});

const TestOutputSchema = z.object({
  response: z.string().describe('The AI response')
});

const testPrompt = ai.definePrompt({
  name: 'testPrompt',
  input: { schema: TestPromptSchema },
  output: { schema: TestOutputSchema },
  prompt: `Say "Hello World" in response to this message: "{{{message}}}"`
});

export async function GET(req: NextRequest) {
  try {
    console.log('🔍 Testing Genkit AI...');
    
    // Test if Genkit is working with a simple prompt
    const result = await testPrompt({ message: 'test' });
    
    console.log('✅ Genkit AI test successful');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Genkit AI is working',
      result: result.output?.response
    });
  } catch (error) {
    console.error('❌ Genkit AI test failed:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }, { status: 500 });
  }
} 
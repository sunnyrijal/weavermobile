import { NextRequest, NextResponse } from 'next/server';
import JournalEntry from '@/lib/mongodb/models/Journal';
import { connectToDatabase } from '@/lib/mongodb/config';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const ownerId = searchParams.get('ownerId');
    if (!ownerId) {
      return NextResponse.json({ error: 'Missing ownerId' }, { status: 400 });
    }
    
    let entries = [];
    try {
      entries = await JournalEntry.find({ ownerId }).sort({ timestamp: -1 });
    } catch (dbError) {
      console.error('Database error, using fallback data:', dbError);
      // Return empty array instead of error when database is unavailable
      entries = [];
    }
    
    return NextResponse.json({ entries });
  } catch (error) {
    console.error('Error fetching journal entries:', error);
    // Return empty array instead of error to prevent frontend crashes
    return NextResponse.json({ entries: [] });
  }
}

export async function POST(req: NextRequest) {
  await connectToDatabase();
  try {
    const { ownerId, summary, originalContent, content, timestamp, linkedContactIds, tags, mood, category } = await req.json();
    if (!ownerId || !(summary || content) || !(originalContent || content) || !timestamp) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Detect mood if not provided
    let detectedMood = mood;
    if (!mood) {
      const textToAnalyze = summary || content || originalContent;
      detectedMood = await detectMood(textToAnalyze);
    }
    
    // Fallback for old clients: if summary/originalContent missing, use content
    const entry = await JournalEntry.create({
      ownerId,
      summary: summary || content,
      originalContent: originalContent || content,
      timestamp,
      linkedContactIds,
      tags,
      mood: detectedMood,
      category: category || 'General Memory'
    });
    return NextResponse.json({ entry });
  } catch (error) {
    console.error('❌ Journal API Error:', error);
    return NextResponse.json({ error: 'Failed to save journal entry', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  await connectToDatabase();
  try {
    const { searchParams } = new URL(req.url);
    const entryId = searchParams.get('id');
    const ownerId = searchParams.get('ownerId');
    
    if (!entryId || !ownerId) {
      return NextResponse.json({ error: 'Missing entryId or ownerId' }, { status: 400 });
    }
    
    const deletedEntry = await JournalEntry.findOneAndDelete({ 
      _id: entryId, 
      ownerId: ownerId 
    });
    
    if (!deletedEntry) {
      return NextResponse.json({ error: 'Journal entry not found or unauthorized' }, { status: 404 });
    }
    
    return NextResponse.json({ message: 'Journal entry deleted successfully' });
  } catch (error) {
    console.error('❌ Journal Delete API Error:', error);
    return NextResponse.json({ error: 'Failed to delete journal entry', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

async function detectMood(text: string): Promise<string> {
  try {
    // Simple mood detection based on keywords
    const textLower = text.toLowerCase();
    
    const moodKeywords = {
      'Grateful': ['grateful', 'thankful', 'appreciative', 'blessed', 'fortunate', 'appreciate', 'appreciation', 'thankful for', 'happy for having', 'lucky to have', 'lucky'],
      'Energetic': ['energetic', 'enthusiastic', 'motivated', 'inspired', 'pumped', 'excited', 'vibrant', 'dynamic', 'thrilled', 'pumped up'],
      'Happy': ['happy', 'joy', 'great', 'wonderful', 'amazing', 'fantastic', 'delighted', 'elated', 'pleased', 'content'],
      'Sad': ['sad', 'depressed', 'melancholy', 'gloomy', 'miserable', 'unhappy', 'disappointed', 'heartbroken', 'devastated'],
      'Neutral': ['neutral', 'okay', 'fine', 'alright', 'normal', 'regular']
    };
    
    for (const [mood, keywords] of Object.entries(moodKeywords)) {
      if (keywords.some(keyword => textLower.includes(keyword))) {
        return mood;
      }
    }
    
    return 'Neutral';
  } catch (error) {
    console.error('Error detecting mood:', error);
    return 'Neutral';
  }
} 
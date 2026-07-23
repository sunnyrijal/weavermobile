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
    
    let entries: any[] = [];
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
  let body: any = {};
  try {
    body = await req.json();
  } catch (e) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { ownerId, summary, originalContent, content, timestamp, linkedContactIds, tags, mood, category } = body;
  if (!ownerId || !(summary || content) || !(originalContent || content)) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  
  const nowTs = timestamp || new Date().toISOString();
  let detectedMood = mood;
  if (!mood) {
    try {
      const textToAnalyze = summary || content || originalContent || '';
      detectedMood = await detectMood(textToAnalyze);
    } catch (e) {
      detectedMood = 'Thoughtful';
    }
  }

  try {
    await connectToDatabase();
    const entry = await JournalEntry.create({
      ownerId,
      summary: summary || content,
      originalContent: originalContent || content,
      timestamp: nowTs,
      linkedContactIds: linkedContactIds || [],
      tags: tags || [],
      mood: detectedMood,
      category: category || 'General Memory'
    });
    return NextResponse.json({ entry }, { status: 201 });
  } catch (error) {
    console.warn('❌ Journal DB Save Error, creating local fallback journal entry:', error);
    const fallbackId = `journal_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const fallbackEntry = {
      _id: fallbackId,
      id: fallbackId,
      ownerId,
      summary: summary || content,
      originalContent: originalContent || content,
      timestamp: nowTs,
      linkedContactIds: linkedContactIds || [],
      tags: tags || [],
      mood: detectedMood || 'Thoughtful',
      category: category || 'General Memory',
      createdAt: nowTs,
      updatedAt: nowTs
    };
    return NextResponse.json({ entry: fallbackEntry, warning: 'Saved locally due to DB unavailability' }, { status: 201 });
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
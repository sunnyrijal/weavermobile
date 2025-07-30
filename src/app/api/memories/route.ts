import { NextRequest, NextResponse } from 'next/server';
import { MemoryService } from '@/lib/mongodb/services/memoryService';

// GET /api/memories - Get all memories for a user
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const ownerId = searchParams.get('ownerId');
    
    if (!ownerId) {
      return NextResponse.json({ error: 'ownerId is required' }, { status: 400 });
    }

    let memories = [];
    try {
      memories = await MemoryService.getMemoriesByOwnerId(ownerId);
    } catch (dbError) {
      console.error('Database error, using fallback data:', dbError);
      // Return empty array instead of error when database is unavailable
      memories = [];
    }
    
    return NextResponse.json({ memories });
  } catch (error) {
    console.error('Error fetching memories:', error);
    // Return empty array instead of error to prevent frontend crashes
    return NextResponse.json({ memories: [] });
  }
}

// POST /api/memories - Create a new memory
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.ownerId) {
      return NextResponse.json({ error: 'ownerId is required' }, { status: 400 });
    }
    
    if (!body.summary) {
      return NextResponse.json({ error: 'summary is required' }, { status: 400 });
    }

    const memory = await MemoryService.createMemory(body);
    return NextResponse.json({ memory }, { status: 201 });
  } catch (error) {
    console.error('Error creating memory:', error);
    return NextResponse.json({ error: 'Failed to create memory' }, { status: 500 });
  }
} 
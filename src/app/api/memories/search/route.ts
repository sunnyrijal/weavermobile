import { NextRequest, NextResponse } from 'next/server';
import { MemoryService } from '@/lib/mongodb/services/memoryService';

// GET /api/memories/search - Search memories
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const ownerId = searchParams.get('ownerId');
    const query = searchParams.get('q');
    const tag = searchParams.get('tag');
    const contactId = searchParams.get('contactId');
    
    if (!ownerId) {
      return NextResponse.json({ error: 'ownerId is required' }, { status: 400 });
    }

    let memories: any[] = [];

    try {
      if (query) {
        memories = await MemoryService.searchMemories(ownerId, query);
      } else if (tag) {
        memories = await MemoryService.getMemoriesByTag(ownerId, tag);
      } else if (contactId) {
        memories = await MemoryService.getMemoriesByContactId(ownerId, contactId);
      } else {
        return NextResponse.json({ error: 'Search query, tag, or contactId is required' }, { status: 400 });
      }
    } catch (dbError) {
      console.warn('Database error searching memories, returning empty fallback list:', dbError);
      memories = [];
    }

    return NextResponse.json({ memories: memories || [] });
  } catch (error: any) {
    console.error('Error searching memories:', error);
    return NextResponse.json({ memories: [] });
  }
} 
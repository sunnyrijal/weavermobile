import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/lib/mongodb/services/userService';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const uid = searchParams.get('uid');
    
    if (!uid) {
      return NextResponse.json({ error: 'uid is required' }, { status: 400 });
    }

    const usageStats = await UserService.getUsageStats(uid);
    
    return NextResponse.json(usageStats);
  } catch (error) {
    console.error('Error fetching usage stats:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch usage stats',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 
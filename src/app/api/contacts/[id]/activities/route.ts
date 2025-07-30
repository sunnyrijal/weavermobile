import { NextRequest, NextResponse } from 'next/server';
import { ActivityService } from '@/lib/mongodb/services/activityService';
import { connectToDatabase } from '@/lib/mongodb/config';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const type = searchParams.get('type') || undefined;
    const mood = searchParams.get('mood') || undefined;
    
    const activities = await ActivityService.getContactActivities(params.id, {
      limit,
      offset,
      type,
      mood
    });
    
    return NextResponse.json({ success: true, activities });
  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activities' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    
    const body = await request.json();
    const activityData = {
      ...body,
      date: new Date(body.date)
    };
    
    const contact = await ActivityService.addActivity(params.id, activityData);
    
    return NextResponse.json({ 
      success: true, 
      contact,
      message: 'Activity logged successfully' 
    });
  } catch (error) {
    console.error('Error adding activity:', error);
    return NextResponse.json(
      { error: 'Failed to add activity' },
      { status: 500 }
    );
  }
} 
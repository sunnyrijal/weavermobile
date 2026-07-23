import { NextRequest, NextResponse } from 'next/server';
import { ReminderService } from '@/lib/mongodb/services/reminderService';
import { connectToDatabase } from '@/lib/mongodb/config';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const resolvedParams = await params;
    
    const { searchParams } = new URL(request.url);
    const includeCompleted = searchParams.get('includeCompleted') === 'true';
    const type = searchParams.get('type') || undefined;
    
    const reminders = await ReminderService.getUserReminders(resolvedParams.id, {
      includeCompleted,
      type
    });
    
    return NextResponse.json({ success: true, reminders });
  } catch (error) {
    console.error('Error fetching reminders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reminders' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    await params; // Await params even if not used to satisfy Next.js 15 signature
    
    const body = await request.json();
    const { contactId, ...reminderData } = body;
    
    if (!contactId) {
      return NextResponse.json(
        { error: 'Contact ID is required' },
        { status: 400 }
      );
    }
    
    const contact = await ReminderService.addReminder(contactId, reminderData);
    
    return NextResponse.json({ 
      success: true, 
      contact,
      message: 'Reminder added successfully' 
    });
  } catch (error) {
    console.error('Error adding reminder:', error);
    return NextResponse.json(
      { error: 'Failed to add reminder' },
      { status: 500 }
    );
  }
} 
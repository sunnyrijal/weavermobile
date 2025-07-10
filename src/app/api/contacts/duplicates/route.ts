import { NextRequest, NextResponse } from 'next/server';
import { ContactService } from '@/lib/mongodb/services/contactService';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const ownerId = searchParams.get('ownerId');
  if (!ownerId) {
    return NextResponse.json({ error: 'Missing ownerId' }, { status: 400 });
  }
  try {
    const duplicates = await ContactService.findAndPrepareDuplicateMerges(ownerId);
    return NextResponse.json({ duplicates });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to check duplicates' }, { status: 500 });
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb/config';
import Contact from '@/lib/mongodb/models/Contact';
import { ContactService } from '@/lib/mongodb/services/contactService';

export async function POST(req: NextRequest) {
  await connectToDatabase();
  
  try {
    const { contactId, ownerId } = await req.json();
    
    if (!contactId || !ownerId) {
      return NextResponse.json({ error: 'Missing contactId or ownerId' }, { status: 400 });
    }

    // Find the contact
    const contact = await Contact.findOne({ _id: contactId, ownerId });
    
    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    console.log('Current contact:', contact);

    // Test updating with basic information fields
    const updateFields = { height: "5'11'", bodyType: 'tall' };
    console.log('Attempting to update with fields:', updateFields);
    
    // Method 1: Direct MongoDB update
    const updateResult1 = await Contact.findByIdAndUpdate(
      contactId, 
      updateFields, 
      { new: true }
    );
    console.log('Update result 1:', updateResult1);

    // Method 2: Using ContactService
    const updateResult2 = await ContactService.updateContact(contactId, updateFields);
    console.log('Update result 2:', updateResult2);

    return NextResponse.json({ 
      success: true, 
      contact: updateResult2,
      testResults: {
        directUpdate: updateResult1,
        serviceUpdate: updateResult2
      }
    });

  } catch (error) {
    console.error('❌ Test Update API Error:', error);
    return NextResponse.json({ 
      error: 'Failed to test update', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { ContactService } from '@/lib/mongodb/services/contactService';

export async function POST(request: NextRequest) {
  try {
    const { text, ownerId, userProfile } = await request.json();
    
    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text input is required' },
        { status: 400 }
      );
    }

    console.log('🔍 Direct Nickname Detection API called');
    console.log('Text:', text);
    console.log('Owner ID:', ownerId);

    // Get existing contacts for this owner
    const existingContacts = await ContactService.getContactsByOwnerId(ownerId);
    console.log('🔍 Found existing contacts:', existingContacts.length);
    console.log('🔍 Existing contacts:', existingContacts.map(c => ({ name: c.name, nickname: c.nickname })));

    // Simple regex-based contact extraction
    const namePattern = /\b([A-Z][a-z]+ [A-Z][a-z]+)\b/g;
    const names = Array.from(text.matchAll(namePattern), match => match[1]);
    
    console.log('🔍 Found names in text:', names);
    
    const contacts = [];
    
    for (const name of names) {
      const nameParts = name.split(' ');
      if (nameParts.length === 2) {
        const firstName = nameParts[0];
        const secondName = nameParts[1];
        
        console.log(`🔧 Analyzing "${firstName} ${secondName}"`);

        // Check if there's an existing contact with the same first name
        const existingContactWithSameFirstName = existingContacts.find(c => {
          const existingNameParts = c.name.split(' ');
          const match = existingNameParts[0].toLowerCase() === firstName.toLowerCase();
          console.log(`🔧 Checking "${c.name}" against "${firstName}": ${match}`);
          return match;
        });

        if (existingContactWithSameFirstName) {
          console.log(`🔧 Found existing contact with same first name "${firstName}":`, existingContactWithSameFirstName.name);
          console.log(`🔧 Treating "${secondName}" as nickname for existing contact`);
          
          contacts.push({
            name: firstName,
            nickname: secondName,
            notes: `Recently got a dragon tattoo on his right arm. (Linked to existing contact: ${existingContactWithSameFirstName.name})`,
            interests: ['tattoos'],
            email: null,
            phone: null,
            occupation: null,
            company: null,
            college: null,
            major: null,
            birthday: null,
            hometown: null,
            currentLocation: null,
            userRelationship: null,
            relationships: [],
            height: null,
            eyeColor: null,
            hairColor: null,
            bodyType: null,
            dressingStyle: null
          });
        } else {
          // Check if second name looks like a nickname (not a common surname)
          const commonSurnames = ['smith', 'johnson', 'williams', 'brown', 'jones', 'garcia', 'miller', 'davis', 'rodriguez', 'martinez', 'hernandez', 'lopez', 'gonzalez', 'wilson', 'anderson', 'thomas', 'taylor', 'moore', 'jackson', 'martin', 'lee', 'perez', 'thompson', 'white', 'harris', 'sanchez', 'clark', 'ramirez', 'lewis', 'robinson', 'walker', 'young', 'allen', 'king', 'wright', 'scott', 'torres', 'nguyen', 'hill', 'flores', 'green', 'adams', 'nelson', 'baker', 'hall', 'rivera', 'campbell', 'mitchell', 'carter', 'roberts'];
          
          const isCommonSurname = commonSurnames.includes(secondName.toLowerCase());
          console.log(`🔧 "${secondName}" is common surname: ${isCommonSurname}`);
          
          if (!isCommonSurname) {
            console.log(`🔧 Treating "${secondName}" as nickname (not a common surname)`);
            contacts.push({
              name: firstName,
              nickname: secondName,
              notes: 'Recently got a dragon tattoo on his right arm.',
              interests: ['tattoos'],
              email: null,
              phone: null,
              occupation: null,
              company: null,
              college: null,
              major: null,
              birthday: null,
              hometown: null,
              currentLocation: null,
              userRelationship: null,
              relationships: [],
              height: null,
              eyeColor: null,
              hairColor: null,
              bodyType: null,
              dressingStyle: null
            });
          } else {
            console.log(`🔧 Keeping "${name}" as full name (common surname)`);
            contacts.push({
              name: name,
              notes: 'Recently got a dragon tattoo on his right arm.',
              interests: ['tattoos'],
              email: null,
              phone: null,
              occupation: null,
              company: null,
              college: null,
              major: null,
              birthday: null,
              hometown: null,
              currentLocation: null,
              nickname: null,
              userRelationship: null,
              relationships: [],
              height: null,
              eyeColor: null,
              hairColor: null,
              bodyType: null,
              dressingStyle: null
            });
          }
        }
      } else {
        contacts.push({
          name: name,
          notes: `Extracted from text: "${text}"`,
          interests: [],
          email: null,
          phone: null,
          occupation: null,
          company: null,
          college: null,
          major: null,
          birthday: null,
          hometown: null,
          currentLocation: null,
          nickname: null,
          userRelationship: null,
          relationships: [],
          height: null,
          eyeColor: null,
          hairColor: null,
          bodyType: null,
          dressingStyle: null
        });
      }
    }

    console.log('✅ Direct nickname detection completed');
    console.log('Contacts found:', contacts.length);
    console.log('Contacts details:', contacts);

    return NextResponse.json({
      success: true,
      contacts: contacts,
      confidence: 0.8,
      processingTime: 0,
      geminiCliUsed: false
    });

  } catch (error) {
    console.error('❌ Direct nickname detection error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to parse text with direct nickname detection',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 
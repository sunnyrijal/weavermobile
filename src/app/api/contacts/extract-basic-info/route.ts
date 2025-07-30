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

    // Extract basic information from notes using regex patterns
    const updateFields: any = {};
    const notes = contact.notes || '';

    // Height patterns - improved to capture full height expressions
    const heightPatterns = [
      /(?:is|are) (?:around |about |approximately |like )?(\d+\s*(?:feet?|ft|')\s*\d*\s*(?:inches?|in|")?)/i,
      /(?:height|tall|height is) (?:around |about |approximately |like )?(\d+\s*(?:feet?|ft|')\s*\d*\s*(?:inches?|in|")?)/i,
      /(?:like |around |about |approximately )?(\d+\s*(?:feet?|ft|')\s*\d*\s*(?:inches?|in|")?)/i,
      // More specific patterns that require height-related keywords
      /(?:height|tall|height is) (?:around |about |approximately |like )?(\d+['"]?\d*["']?)/i,
      /(?:like |around |about |approximately )?(\d+['"]?\d*["']?)\s*(?:feet?|ft|'|tall)/i,
      // Only match "is X" if followed by height-related words, but exclude age patterns
      /(?:is|are) (?:around |about |approximately |like )?(\d+['"]?\d*["']?)\s*(?:feet?|ft|'|tall|height)(?!\s*(?:years?|yrs?|old))/i
    ];
    
    for (const pattern of heightPatterns) {
      const match = notes.match(pattern);
      if (match && match[1] && !contact.height) {
        // Additional check to exclude age patterns
        const matchedText = match[0];
        if (!matchedText.toLowerCase().includes('age') && 
            !matchedText.toLowerCase().includes('years') && 
            !matchedText.toLowerCase().includes('yrs')) {
          updateFields.height = match[1].trim();
          break;
        }
      }
    }

    // Eye color patterns
    const eyeColorPatterns = [
      /(?:has|have) (\w+) eyes/i,
      /(\w+) eyes/i,
      /eyes are (\w+)/i
    ];
    
    for (const pattern of eyeColorPatterns) {
      const match = notes.match(pattern);
      if (match && match[1] && !contact.eyeColor) {
        const eyeColor = match[1].toLowerCase();
        if (['blue', 'brown', 'green', 'hazel', 'gray', 'grey', 'amber'].includes(eyeColor)) {
          updateFields.eyeColor = eyeColor;
          break;
        }
      }
    }

    // Hair color patterns
    const hairColorPatterns = [
      /(?:has|have) (\w+) hair/i,
      /(\w+) hair/i,
      /hair is (\w+)/i
    ];
    
    for (const pattern of hairColorPatterns) {
      const match = notes.match(pattern);
      if (match && match[1] && !contact.hairColor) {
        const hairColor = match[1].toLowerCase();
        if (['brown', 'blonde', 'black', 'red', 'auburn', 'gray', 'grey', 'white'].includes(hairColor)) {
          updateFields.hairColor = hairColor;
          break;
        }
      }
    }

    // Body type patterns - improved to capture body type descriptions
    const bodyTypePatterns = [
      /(?:is|are) (\w+)(?:\s|$|\.)(?!\s*(?:feet?|ft|'|tall|short))/i,
      /(?:looks|look) (\w+)(?:\s|$|\.)/i,
      /(?:body type|build) is (\w+)(?:\s|$|\.)/i,
      /(?:is|are) (\w+)(?:\s+and|\s+but|\s+with)/i
    ];
    
    for (const pattern of bodyTypePatterns) {
      const match = notes.match(pattern);
      if (match && match[1] && !contact.bodyType) {
        const bodyType = match[1].toLowerCase();
        if (['athletic', 'slim', 'thin', 'tall', 'short', 'average', 'muscular', 'curvy'].includes(bodyType)) {
          updateFields.bodyType = bodyType;
          break;
        }
      }
    }

    // Dressing style patterns - improved to capture dressing style descriptions
    const dressingStylePatterns = [
      /(?:likes to|like to|dresses|dress) (\w+)(?:\s|$|\.)/i,
      /(?:style is|fashion is) (\w+)(?:\s|$|\.)/i,
      /(?:wears|wear) (\w+)(?:\s|$|\.)/i,
      /(?:dresses|dress) (\w+)(?:\s|$|\.)/i,
      /(?:likes to|like to) dress (\w+)(?:\s|$|\.)/i
    ];
    
    for (const pattern of dressingStylePatterns) {
      const match = notes.match(pattern);
      if (match && match[1] && !contact.dressingStyle) {
        const dressingStyle = match[1].toLowerCase();
        // Handle variations like "casually" -> "casual"
        const normalizedStyle = dressingStyle.endsWith('ly') ? dressingStyle.slice(0, -2) : dressingStyle;
        if (['classy', 'casual', 'formal', 'trendy', 'elegant', 'sophisticated', 'minimalist'].includes(normalizedStyle)) {
          updateFields.dressingStyle = normalizedStyle;
          break;
        }
      }
    }

    // Skin tone patterns
    const skinTonePatterns = [
      /(?:has|have) (\w+)\s*(?:skin|complexion)/i,
      /(?:skin|complexion) is (\w+)/i,
      /(\w+)\s*(?:skin|complexion)/i,
      /(?:looks|appears) (\w+)/i
    ];
    
    for (const pattern of skinTonePatterns) {
      const match = notes.match(pattern);
      if (match && match[1] && !contact.skinTone) {
        const skinTone = match[1].toLowerCase();
        const validSkinTones = ['fair', 'light', 'medium', 'olive', 'tan', 'dark', 'brown', 'black', 'pale', 'rosy', 'golden'];
        if (validSkinTones.includes(skinTone)) {
          updateFields.skinTone = skinTone;
          break;
        }
      }
    }

    // Ethnicity patterns
    const ethnicityPatterns = [
      /(?:is|are) (\w+)/i,
      /(?:of|from) (\w+)\s*(?:descent|background|heritage)/i,
      /(\w+)\s*(?:descent|background|heritage)/i,
      /(?:ethnicity|race) is (\w+)/i
    ];
    
    for (const pattern of ethnicityPatterns) {
      const match = notes.match(pattern);
      if (match && match[1] && !contact.ethnicity) {
        const ethnicity = match[1].toLowerCase();
        const validEthnicities = ['asian', 'chinese', 'japanese', 'korean', 'vietnamese', 'filipino', 'indian', 'pakistani', 'bangladeshi', 'sri lankan', 'nepali', 'african', 'nigerian', 'ghanaian', 'kenyan', 'ethiopian', 'somali', 'caribbean', 'jamaican', 'haitian', 'trinidadian', 'barbadian', 'european', 'british', 'irish', 'french', 'german', 'italian', 'spanish', 'portuguese', 'dutch', 'swedish', 'norwegian', 'danish', 'finnish', 'polish', 'russian', 'ukrainian', 'belarusian', 'latin american', 'mexican', 'brazilian', 'argentine', 'chilean', 'colombian', 'peruvian', 'venezuelan', 'ecuadorian', 'middle eastern', 'arab', 'persian', 'turkish', 'lebanese', 'syrian', 'jordanian', 'egyptian', 'moroccan', 'algerian', 'tunisian', 'libyan', 'sudanese', 'south asian', 'north african', 'sub saharan african', 'pacific islander', 'polynesian', 'melanesian', 'micronesian', 'mixed', 'biracial', 'multiracial'];
        if (validEthnicities.includes(ethnicity)) {
          updateFields.ethnicity = ethnicity;
          break;
        }
      }
    }

    // Facial features patterns - improved for better extraction
    const facialFeaturesPatterns = [
      /(?:has|have) (\w+(?:\s+\w+)*)\s*(?:face|features)/i,
      /(?:face|features) are (\w+(?:\s+\w+)*)/i,
      /(\w+(?:\s+\w+)*)\s*(?:face|features)/i,
      /(?:looks|appears) (\w+(?:\s+\w+)*)/i,
      /(?:with|has)\s+(\w+(?:\s+\w+)*)\s+(?:cheekbones|cheeks|jaw|chin)/i
    ];
    
    for (const pattern of facialFeaturesPatterns) {
      const match = notes.match(pattern);
      if (match && match[1] && !contact.facialFeatures) {
        const facialFeatures = match[1].toLowerCase();
        const validFeatures = ['round', 'oval', 'square', 'heart', 'diamond', 'triangular', 'angular', 'soft', 'sharp', 'defined', 'delicate', 'strong', 'prominent', 'high cheekbones', 'full cheeks', 'thin face', 'wide face'];
        if (validFeatures.includes(facialFeatures)) {
          updateFields.facialFeatures = facialFeatures;
          break;
        }
      }
    }

    // Distinguishing features patterns - improved for better extraction
    const distinguishingFeaturesPatterns = [
      /(?:has|have) (\w+(?:\s+\w+)*)\s*(?:scar|birthmark|mole|tattoo|piercing)/i,
      /(?:scar|birthmark|mole|tattoo|piercing) on (\w+(?:\s+\w+)*)/i,
      /(\w+(?:\s+\w+)*)\s*(?:scar|birthmark|mole|tattoo|piercing)/i,
      /(?:distinguishing|unique) feature is (\w+(?:\s+\w+)*)/i,
      /(?:small|large|tiny|big)\s+(\w+(?:\s+\w+)*)\s+(?:on|in|at)/i
    ];
    
    for (const pattern of distinguishingFeaturesPatterns) {
      const match = notes.match(pattern);
      if (match && match[1] && !contact.distinguishingFeatures) {
        const distinguishingFeatures = match[1].toLowerCase();
        updateFields.distinguishingFeatures = distinguishingFeatures;
        break;
      }
    }

    // Voice patterns
    const voicePatterns = [
      /(?:has|have) (\w+)\s*(?:voice|accent)/i,
      /(?:voice|accent) is (\w+)/i,
      /(\w+)\s*(?:voice|accent)/i,
      /(?:speaks|talks) with (\w+)\s*(?:accent|voice)/i
    ];
    
    for (const pattern of voicePatterns) {
      const match = notes.match(pattern);
      if (match && match[1] && !contact.voice) {
        const voice = match[1].toLowerCase();
        const validVoices = ['deep', 'high', 'soft', 'loud', 'raspy', 'smooth', 'rough', 'gentle', 'harsh', 'warm', 'cold', 'friendly', 'authoritative', 'shy', 'confident'];
        if (validVoices.includes(voice)) {
          updateFields.voice = voice;
          break;
        }
      }
    }

    // Accent patterns
    const accentPatterns = [
      /(?:has|have) (\w+)\s*accent/i,
      /(?:accent is|speaks with) (\w+)\s*accent/i,
      /(\w+)\s*accent/i,
      /(?:from|originally from) (\w+)/i
    ];
    
    for (const pattern of accentPatterns) {
      const match = notes.match(pattern);
      if (match && match[1] && !contact.accent) {
        const accent = match[1].toLowerCase();
        const validAccents = ['british', 'american', 'australian', 'canadian', 'irish', 'scottish', 'welsh', 'french', 'german', 'italian', 'spanish', 'portuguese', 'russian', 'chinese', 'japanese', 'korean', 'indian', 'pakistani', 'bangladeshi', 'nigerian', 'ghanaian', 'kenyan', 'jamaican', 'barbadian', 'mexican', 'brazilian', 'argentine', 'chilean', 'colombian', 'peruvian', 'venezuelan', 'ecuadorian', 'arab', 'persian', 'turkish', 'lebanese', 'syrian', 'jordanian', 'egyptian', 'moroccan', 'algerian', 'tunisian', 'libyan', 'sudanese'];
        if (validAccents.includes(accent)) {
          updateFields.accent = accent;
          break;
        }
      }
    }

    // Update the contact if we found any basic information
    if (Object.keys(updateFields).length > 0) {
      console.log('Updating contact with fields:', updateFields);
      
      // Update the contact with the actual database fields
      const updatedContact = await ContactService.updateContact(contactId, updateFields);
      
      if (!updatedContact) {
        return NextResponse.json({ 
          success: false, 
          error: 'Failed to update contact'
        }, { status: 500 });
      }
      
      console.log('Updated contact:', updatedContact);
      
      return NextResponse.json({ 
        success: true, 
        contact: updatedContact,
        extractedFields: updateFields
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        message: 'No basic information found in notes',
        contact: contact
      });
    }

  } catch (error) {
    console.error('❌ Extract Basic Info API Error:', error);
    return NextResponse.json({ 
      error: 'Failed to extract basic information', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
} 
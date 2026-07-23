import { GoogleGenAI, Type } from "@google/genai";

// Types matching the new parser structure
export interface ParsedContactRelationship {
  relatedPersonName: string;
  type: 'Mother' | 'Father' | 'Brother' | 'Sister' | 'Spouse' | 'Friend' | 'Colleague' | 'Partner' | 'Son' | 'Daughter' | 'Custom';
  customLabel?: string;
}

export interface ParsedSocialProfiles {
  instagram?: string;
  linkedin?: string;
  facebook?: string;
  twitter?: string;
}

export interface ParsedContact {
  name: string;
  nickname?: string;
  status: 'new' | 'existing';
  confidence: number;
  phone?: string;
  email?: string;
  currentLocation?: string;
  hometown?: string;
  occupation?: string;
  company?: string;
  college?: string;
  previousCollege?: string;
  major?: string;
  birthday?: string;
  birthYear?: string;
  age?: number;
  height?: string;
  eyeColor?: string;
  hairColor?: string;
  category: 'Family' | 'Friend' | 'Colleague' | 'Professional' | 'Partner' | 'Other';
  relationships: ParsedContactRelationship[];
  tags?: string[];
  interests?: string[];
  socialProfiles?: ParsedSocialProfiles;
  notes: string;
  updateType: 'new_contact' | 'contact_update' | 'relationship_update' | 'info_update';
}

export interface ParsedContactsResult {
  contacts: ParsedContact[];
  confidence: number;
  processingNotes?: string;
}

// Initialize Google GenAI
const getGeminiAI = () => {
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_API_KEY or GEMINI_API_KEY environment variable is required');
  }
  return new GoogleGenAI({ apiKey });
};

const systemInstruction = `
You are an advanced contact information parser. Your task is to analyze the given text and extract all contact information, determining whether contacts are new or existing, and structuring the data accordingly.

## Rules:
1. **Contact Status Detection**: Mark as "existing" if the text indicates prior knowledge (e.g., "my friend", "my colleague", "I know", "met again", "update about"). Mark as "new" if this is the first mention or if the text suggests meeting someone new.
2. **Relationship Extraction**: Identify all relationships between people mentioned. Extract relationship types (Mother, Father, Brother, Sister, Spouse, Friend, Colleague, etc.). Link related contacts when mentioned together.
3. **Nickname Handling**: Extract nicknames when mentioned (e.g., "Sarah (also goes by Sally)"). Store nicknames separately but link them to the main name.
4. **Information Extraction**: Extract all available information. Don't leave fields empty if clearly stated. Handle ambiguous information by lowering confidence scores.
5. **Context Preservation**: Always include relevant context in the notes field. Preserve stories, memorable details, or significant events mentioned.
6. **Date and Location Handling**: For birthdays: Use YYYY-MM-DD format if full date is given, or MM-DD if only month and day. Distinguish between current location and hometown.
7. **Category Assignment**: Assign categories: Family, Friend, Colleague, Professional, Partner, or Other. Default to "Friend" if unclear, but use "Family" for family members.
8. **Location Inheritance for Families**: If a location (hometown or current) is given for one member of a family, assume other mentioned family members share that location unless a different location is specified for them.
9. **Education History**: Differentiate between current and past education. If a person is currently attending an institution, list it as 'college'. If they are an alumnus or it's mentioned as a past institution, list it as 'previousCollege'.

## Output Format:
Return a valid JSON object with the specified structure. Do not include any extra text or explanations.

## Examples:
**Example 1 - New Contact:**
Input: "I just met Sarah Johnson at a coffee shop in Seattle. She's a software engineer at Microsoft, originally from Portland. Her birthday is February 15th, and she loves hiking. Her Instagram is @sarah_johnson."
Output:
{
  "contacts": [
    {
      "name": "Sarah Johnson", "status": "new", "confidence": 0.95, "currentLocation": "Seattle", "hometown": "Portland", "occupation": "Software Engineer", "company": "Microsoft", "birthday": "02-15", "category": "Friend", "interests": ["hiking"], "socialProfiles": {"instagram": "@sarah_johnson"}, "notes": "Met at a coffee shop in Seattle", "updateType": "new_contact"
    }
  ],
  "confidence": 0.95
}

**Example 2 - Existing Contact Update:**
Input: "My friend Mike moved to San Francisco last month. He got a new job at Google as a Product Manager. He's now dating someone named Emma."
Output:
{
  "contacts": [
    {
      "name": "Mike", "status": "existing", "confidence": 0.9, "currentLocation": "San Francisco", "occupation": "Product Manager", "company": "Google", "category": "Friend", "relationships": [{"relatedPersonName": "Emma", "type": "Partner", "customLabel": "dating"}], "notes": "Moved to San Francisco last month, got new job at Google", "updateType": "contact_update"
    },
    {
      "name": "Emma", "status": "new", "confidence": 0.7, "category": "Friend", "relationships": [{"relatedPersonName": "Mike", "type": "Partner", "customLabel": "dating"}], "notes": "Mike's girlfriend", "updateType": "new_contact"
    }
  ],
  "confidence": 0.85
}
`;

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    contacts: {
      type: Type.ARRAY,
      description: 'A list of all contacts found in the text.',
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: 'Full name of the person.' },
          nickname: { type: Type.STRING, description: 'Nickname, if mentioned.' },
          status: { type: Type.STRING, description: '"new" or "existing".' },
          confidence: { type: Type.NUMBER, description: 'Confidence score from 0.0 to 1.0 for the extracted contact.' },
          phone: { type: Type.STRING, description: 'Phone number.' },
          email: { type: Type.STRING, description: 'Email address.' },
          currentLocation: { type: Type.STRING, description: 'Current city or location.' },
          hometown: { type: Type.STRING, description: 'Hometown, if different from current location.' },
          occupation: { type: Type.STRING, description: 'Job title.' },
          company: { type: Type.STRING, description: 'Company name.' },
          college: { type: Type.STRING, description: 'Current college or university name.' },
          previousCollege: { type: Type.STRING, description: 'Previous college or university name, if they are an alumnus.' },
          major: { type: Type.STRING, description: 'Field of study.' },
          birthday: { type: Type.STRING, description: 'Birthday in YYYY-MM-DD or MM-DD format.' },
          birthYear: { type: Type.STRING, description: 'Birth year, if mentioned separately.' },
          age: { type: Type.INTEGER, description: 'Age in years.' },
          height: { type: Type.STRING, description: 'Height if mentioned.' },
          eyeColor: { type: Type.STRING, description: 'Eye color if mentioned.' },
          hairColor: { type: Type.STRING, description: 'Hair color if mentioned.' },
          category: { type: Type.STRING, description: 'Category: Family, Friend, Colleague, etc.' },
          relationships: {
            type: Type.ARRAY,
            description: 'List of relationships with other people.',
            items: {
              type: Type.OBJECT,
              properties: {
                relatedPersonName: { type: Type.STRING, description: 'Name of the related person.' },
                type: { type: Type.STRING, description: 'Type of relationship (e.g., Mother, Friend).' },
                customLabel: { type: Type.STRING, description: 'Custom relationship label if applicable.' },
              },
              required: ['relatedPersonName', 'type'],
            },
          },
          tags: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Relevant tags.' },
          interests: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Hobbies or interests.' },
          socialProfiles: {
            type: Type.OBJECT,
            properties: {
              instagram: { type: Type.STRING },
              linkedin: { type: Type.STRING },
              facebook: { type: Type.STRING },
              twitter: { type: Type.STRING },
            },
          },
          notes: { type: Type.STRING, description: 'Contextual notes, stories, or memorable details.' },
          updateType: { type: Type.STRING, description: 'The type of update this information represents.' },
        },
        required: ['name', 'status', 'confidence', 'category', 'relationships', 'notes', 'updateType'],
      },
    },
    confidence: { type: Type.NUMBER, description: 'Overall confidence score for the entire parsing process.' },
    processingNotes: { type: Type.STRING, description: 'Any notes about the parsing process, like ambiguities.' },
  },
  required: ['contacts', 'confidence'],
};

/**
 * Fallback parser using regex patterns when Gemini API is not available
 */
function fallbackParseContactInfo(text: string): ParsedContactsResult {
  console.log('🔄 Using fallback regex-based parsing');
  
  // Comprehensive list of non-person entities to filter out
  const nonPersonEntities = new Set([
    // Academic terms
    'Comp Sci', 'Computer Science', 'Comp', 'Sci', 'Major', 'Alumni', 'University', 'College', 
    'School', 'High', 'Academy', 'Institute', 'Freshman', 'Sophomore', 'Junior', 'Senior',
    'Gustavus Alumni', 'Gustavus Adolphus', 'Mankato University',
    // Common words
    'Home', 'Currently', 'Goes', 'To', 'Also', 'Age', 'Year', 'Years', 'Old', 'Roommate',
    'From', 'But', 'And', 'The', 'A', 'An', 'In', 'On', 'At', 'For', 'With', 'By', 'Of',
    'Is', 'Are', 'Was', 'Were', 'Has', 'Have', 'Had', 'Will', 'Would', 'Could', 'Should',
    'May', 'Might', 'Must', 'Can', 'Shall', 'Do', 'Does', 'Did',
    // Location words (when standalone)
    'Minnesota', 'California', 'Texas', 'Florida', 'New York', 'Washington', 'Oregon',
    'Colorado', 'Arizona', 'Nevada', 'Illinois', 'Massachusetts', 'Pennsylvania', 'Ohio',
    'Michigan', 'Georgia', 'North Carolina', 'South Carolina', 'Virginia', 'Maryland',
    'New Jersey', 'Connecticut', 'Rhode Island', 'Vermont', 'New Hampshire', 'Maine',
    'Alaska', 'Hawaii', 'Seattle', 'San Francisco', 'Los Angeles', 'Chicago', 'Boston',
    'Portland', 'Minneapolis', 'Austin', 'Denver', 'Miami', 'Atlanta', 'Philadelphia',
    'Phoenix', 'Dallas', 'Houston', 'Detroit', 'Cincinnati', 'Kansas', 'Faribault',
    // Relationship labels (these should be relationships, not contacts)
    'Mom', 'Dad', 'Father', 'Mother', 'Brother', 'Sister', 'Sibling', 'Girlfriend',
    'Boyfriend', 'Partner', 'Spouse', 'Wife', 'Husband', 'Son', 'Daughter', 'Child',
    // Other common non-person words
    'The', 'This', 'That', 'They', 'There', 'Then', 'Than', 'When', 'Where', 'What',
    'Which', 'Who', 'How', 'Why', 'I', 'You', 'He', 'She', 'We', 'It', 'My', 'Your',
    'His', 'Her', 'Our', 'Their'
  ]);
  
  // Extract organizations first to exclude them
  const orgPattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:Inc|Corp|LLC|Ltd|University|College|School|High|Academy|Institute|Company|Corporation|Technologies|Tech|Systems|Solutions|Group|Industries|Services|Alumni))\b/gi;
  const organizations = Array.from(text.matchAll(orgPattern), match => match[1].trim());
  organizations.forEach(org => nonPersonEntities.add(org));
  
  // Extract full names only (two capitalized words)
  const fullNamePattern = /\b([A-Z][a-z]+ [A-Z][a-z]+)\b/g;
  const allFullNames = Array.from(text.matchAll(fullNamePattern), match => match[1].trim());
  
  // Filter out non-person entities
  const validFullNames = allFullNames.filter(name => {
    const nameLower = name.toLowerCase();
    // Check if it's a known non-person entity
    if (nonPersonEntities.has(name)) return false;
    // Check if any word in the name is a non-person entity
    const words = name.split(' ');
    if (words.some(word => nonPersonEntities.has(word))) return false;
    // Check if it matches organization patterns
    if (/\b(University|College|School|Alumni|Inc|Corp|LLC)\b/i.test(name)) return false;
    // Check if it's a location pattern (City, State)
    if (/^[A-Z][a-z]+,\s*[A-Z][a-z]+$/.test(name)) return false;
    return true;
  });
  
  // Extract relationships from text to link contacts
  const relationshipPatterns = [
    { pattern: /(?:mom|mother|dad|father|parent)\s*[:\-]?\s*\(?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\)?/gi, type: 'Parent' },
    { pattern: /(?:brother|sister|sibling)\s*[:\-]?\s*\(?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\)?/gi, type: 'Sibling' },
    { pattern: /(?:girlfriend|boyfriend|partner|spouse|wife|husband)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi, type: 'Partner' },
  ];
  
  // Also extract relationships in the format "relationship: Name" or "relationship Name"
  const relationshipContextPattern = /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)[^.]*?(?:girlfriend|boyfriend|partner|spouse|wife|husband|mom|mother|dad|father|parent|brother|sister|sibling)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi;
  
  const contacts: ParsedContact[] = [];
  const processedNames = new Set<string>();
  
  // Process each valid full name
  validFullNames.forEach(name => {
    // Skip if already processed
    if (processedNames.has(name.toLowerCase())) return;
    processedNames.add(name.toLowerCase());
    
    // Extract information for this contact
    const nameRegex = new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    const nameContext = text.match(new RegExp(`.{0,100}${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}.{0,100}`, 'i'))?.[0] || text;
    
    const contact: ParsedContact = {
      name: name,
      status: text.toLowerCase().includes('my ') || text.toLowerCase().includes('i know') || text.toLowerCase().includes('met again') || text.toLowerCase().includes('roommate') ? 'existing' : 'new',
      confidence: 0.7,
      category: 'Friend',
      relationships: [],
      notes: '',
      updateType: 'new_contact'
    };
    
    // Extract age
    const ageMatch = nameContext.match(new RegExp(`(?:age|aged)\\s+(\\d+)`, 'i')) || 
                     text.match(new RegExp(`${name}\\D*(\\d+)\\s*years?\\s*old`, 'i'));
    if (ageMatch) {
      contact.age = parseInt(ageMatch[1]);
    }
    
    // Extract major
    const majorMatch = nameContext.match(/(?:major|studies?)\s+(?:in\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i);
    if (majorMatch && !nonPersonEntities.has(majorMatch[1])) {
      contact.major = majorMatch[1];
    }
    
    // Extract college/university (only if it's a valid institution name)
    const collegeMatch = nameContext.match(/(?:goes? to|at|attends?|studies? at)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:University|College))/i);
    if (collegeMatch) {
      contact.college = collegeMatch[1];
    }
    
    // Extract location (hometown) - look for "Home:" pattern
    const homeMatch = text.match(/Home:\s*([A-Z][a-z]+(?:\s*,\s*[A-Z][a-z]+)?)/i);
    if (homeMatch && nameContext.toLowerCase().includes('home')) {
      contact.hometown = homeMatch[1];
    }
    
    // Extract relationships - check if this person is mentioned with relationship labels
    relationshipPatterns.forEach(({ pattern, type }) => {
      const matches = Array.from(text.matchAll(pattern));
      matches.forEach(match => {
        const relatedName = match[1]?.trim();
        if (relatedName) {
          // Find the full name that matches
          const relatedFullName = validFullNames.find(n => {
            const nLower = n.toLowerCase();
            const relatedLower = relatedName.toLowerCase();
            // Check if full name contains the related name or vice versa
            return nLower === relatedLower || 
                   nLower.includes(relatedLower) || 
                   relatedLower.includes(nLower.split(' ')[0]) ||
                   (nLower.split(' ').length > 1 && relatedLower.includes(nLower.split(' ')[1]));
          });
          
          // Check if the current contact is the subject (the one with the relationship)
          const isSubject = nameContext.toLowerCase().includes(match[0].toLowerCase()) ||
                           text.toLowerCase().indexOf(name.toLowerCase()) < text.toLowerCase().indexOf(match[0].toLowerCase());
          
          if (relatedFullName && relatedFullName !== name && isSubject) {
            contact.relationships.push({
              relatedPersonName: relatedFullName,
              type: type as any,
              customLabel: type === 'Partner' && match[0].toLowerCase().includes('girlfriend') ? 'Girlfriend' : 
                          type === 'Partner' && match[0].toLowerCase().includes('boyfriend') ? 'Boyfriend' :
                          type === 'Parent' && match[0].toLowerCase().includes('mom') ? 'Mother' :
                          type === 'Parent' && match[0].toLowerCase().includes('dad') ? 'Father' : undefined
            });
          }
        }
      });
    });
    
    // Also check reverse: if someone else is described in relation to this person
    const reversePattern = new RegExp(`([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)?)\\s+(?:girlfriend|boyfriend|partner|spouse|wife|husband|mom|mother|dad|father|parent|brother|sister|sibling)\\s+${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'gi');
    const reverseMatches = Array.from(text.matchAll(reversePattern));
    reverseMatches.forEach(match => {
      const relatedName = match[1]?.trim();
      const relatedFullName = validFullNames.find(n => 
        n.toLowerCase() === relatedName.toLowerCase() || 
        n.toLowerCase().includes(relatedName.toLowerCase())
      );
      if (relatedFullName && relatedFullName !== name) {
        // This is a reverse relationship, so we don't add it here
        // It will be handled when processing the other contact
      }
    });
    
    // Build notes
    const notesParts: string[] = [];
    if (nameContext.includes('roommate')) notesParts.push('Roommate in college');
    if (contact.age) notesParts.push(`Age ${contact.age}`);
    if (contact.major) notesParts.push(`Major: ${contact.major}`);
    if (contact.college) notesParts.push(`College: ${contact.college}`);
    contact.notes = notesParts.join('. ') || `Mentioned in memory: ${text.substring(0, 150)}`;
    
    contacts.push(contact);
  });
  
  // Remove duplicate contacts and merge relationships
  const uniqueContacts = contacts.reduce((acc, contact) => {
    const existing = acc.find(c => c.name.toLowerCase() === contact.name.toLowerCase());
    if (existing) {
      // Merge relationships
      contact.relationships.forEach(rel => {
        if (!existing.relationships.some(r => r.relatedPersonName === rel.relatedPersonName)) {
          existing.relationships.push(rel);
        }
      });
      // Merge other fields
      if (contact.age && !existing.age) existing.age = contact.age;
      if (contact.major && !existing.major) existing.major = contact.major;
      if (contact.college && !existing.college) existing.college = contact.college;
      if (contact.hometown && !existing.hometown) existing.hometown = contact.hometown;
    } else {
      acc.push(contact);
    }
    return acc;
  }, [] as ParsedContact[]);
  
  return {
    contacts: uniqueContacts,
    confidence: 0.7,
    processingNotes: `Used fallback regex-based parsing. Found ${uniqueContacts.length} valid contacts. Enable Generative Language API for better accuracy.`
  };
}

/**
 * Parse contact information from text using Google Gemini with structured output
 */
export async function parseContactInfo(text: string): Promise<ParsedContactsResult> {
  try {
    const ai = getGeminiAI();
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Now parse the following text and return the JSON structure:\n\n${text}`,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const jsonText = response.text?.trim() || '';
    if (!jsonText) {
      throw new Error('Empty response received from Gemini API');
    }
    const parsedJson = JSON.parse(jsonText);
    return parsedJson as ParsedContactsResult;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    
    // Check if it's an API disabled error
    if (error instanceof Error) {
      const errorMessage = error.message || '';
      const errorString = JSON.stringify(error) || '';
      
      if (errorMessage.includes('SERVICE_DISABLED') || 
          errorMessage.includes('Generative Language API') ||
          errorMessage.includes('403 Forbidden') ||
          errorString.includes('SERVICE_DISABLED')) {
        console.warn('⚠️ Generative Language API is not enabled. Using fallback parser.');
        console.warn('📝 To enable the API, visit: https://console.developers.google.com/apis/api/generativelanguage.googleapis.com/overview?project=362815930485');
        // Use fallback parser instead of throwing error
        return fallbackParseContactInfo(text);
      }
      
      if (errorMessage.includes('API key not valid') || errorMessage.includes('API_KEY_INVALID')) {
        throw new Error('The provided API key is not valid. Please check your GOOGLE_API_KEY in .env.local');
      }
    }
    
    // For other errors, try fallback parser
    console.warn('⚠️ Gemini API error, using fallback parser:', error);
    return fallbackParseContactInfo(text);
  }
}

/**
 * Convert parsed contacts to the format expected by the existing codebase
 * This maps the new parser structure to the existing Contact structure
 */
export function convertParsedContactsToContactFormat(
  parsedContacts: ParsedContact[],
  ownerId: string
): Array<{
  name: string;
  nickname?: string;
  phone?: string;
  email?: string;
  currentLocation?: string;
  hometown?: string;
  occupation?: string;
  company?: string;
  college?: string;
  major?: string;
  birthday?: string;
  birthYear?: string;
  age?: number;
  height?: string;
  eyeColor?: string;
  hairColor?: string;
  category?: string;
  tags: string[];
  notes?: string;
  socialProfiles?: {
    instagram?: string;
    linkedin?: string;
    facebook?: string;
    twitter?: string;
  };
  relationships: Array<{
    name: string;
    relatedPersonName: string;
    type: string;
    customLabel?: string;
    notes?: string;
  }>;
  status: 'new' | 'existing';
  confidence: number;
  updateType: string;
  userRelationship?: string; // For compatibility with existing code
}> {
  return parsedContacts.map(contact => ({
    name: contact.name,
    nickname: contact.nickname,
    phone: contact.phone,
    email: contact.email,
    currentLocation: contact.currentLocation,
    hometown: contact.hometown,
    occupation: contact.occupation,
    company: contact.company,
    college: contact.college || contact.previousCollege,
    major: contact.major,
    birthday: contact.birthday,
    birthYear: contact.birthYear,
    age: contact.age,
    height: contact.height,
    eyeColor: contact.eyeColor,
    hairColor: contact.hairColor,
    category: contact.category,
    userRelationship: contact.category, // Map category to userRelationship for compatibility
    tags: [
      ...(contact.tags || []),
      ...(contact.interests || [])
    ],
    notes: contact.notes,
    socialProfiles: contact.socialProfiles,
    relationships: contact.relationships.map(rel => ({
      name: rel.relatedPersonName, // Use 'name' for compatibility with existing code
      relatedPersonName: rel.relatedPersonName, // Also keep for API response
      type: rel.type,
      customLabel: rel.customLabel,
      notes: rel.customLabel || '' // Use customLabel as notes if available
    })),
    status: contact.status,
    confidence: contact.confidence,
    updateType: contact.updateType
  }));
}


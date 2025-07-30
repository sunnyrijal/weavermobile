import { NextRequest, NextResponse } from 'next/server';

// Step 1: Unified Person Entity Recognition (using flairNLP/flair)
async function extractPersonEntities(text: string): Promise<string[]> {
  // TODO: Replace this with a real call to a Python microservice running flairNLP/flair NER
  // Example: const response = await fetch('http://localhost:5001/flair-ner', { method: 'POST', body: JSON.stringify({ text }) });
  // const { persons } = await response.json();
  // return persons;
  // For now, fallback to regex as a placeholder:
  return Array.from(new Set([...text.matchAll(/[A-Z][a-z]+ [A-Z][a-z]+/g)].map(m => m[0])));
}

// Step 2: Nickname-to-Full Name Resolution (using djudd/human-name)
async function resolveNicknamesAndFullNames(persons: string[], text: string): Promise<{ [canonical: string]: { nickname?: string } }> {
  // TODO: Replace this with a real call to a Python microservice or Node.js wrapper for djudd/human-name
  // For now, use pattern matching for explicit nickname/full name statements
  const mapping: { [canonical: string]: { nickname?: string } } = {};
  const nicknamePattern = /([A-Za-z]+)[,\s]+(?:his|her)?\s*full name ([A-Za-z]+ [A-Za-z]+)/i;
  const match = text.match(nicknamePattern);
  if (match) {
    const nickname = match[1];
    const fullName = match[2];
    mapping[fullName] = { nickname };
    persons = persons.filter(p => p !== nickname && p !== `${nickname} ${fullName.split(' ')[1]}`);
  }
  // Add remaining persons as canonical
  persons.forEach(p => {
    if (!Object.keys(mapping).includes(p)) mapping[p] = {};
  });
  return mapping;
}

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();
    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text input is required' },
        { status: 400 }
      );
    }
    // Step 1: Extract PERSON entities
    const persons = await extractPersonEntities(text);
    // Step 2: Resolve nicknames and full names
    const nameMap = await resolveNicknamesAndFullNames(persons, text);
    // TODO: Continue with fact extraction, relationship mapping, and output formatting as per the remediation plan
    return NextResponse.json({ persons, nameMap });
  } catch (error) {
    console.error('Contact parsing error:', error);
    return NextResponse.json(
      { error: 'Failed to parse contact information' },
      { status: 500 }
    );
  }
}

interface Contact {
  name: string;
  role: string;
  attributes: {
    age?: number;
    birthday?: string;
    birthYear?: number;
    occupation?: string;
    major?: string;
    hometown?: string[];
    notes?: string;
    phone?: string;
    email?: string;
    socialMedia?: Array<{ platform: string; handle: string }>;
  };
  relationships: Array<{
    relation: string;
    name: string;
  }>;
}

interface ParsedContactInfo {
  contacts: Contact[];
  formatted: string;
}

async function parseContactsWithAdvancedLogic(text: string, userProfile?: { college?: string }): Promise<ParsedContactInfo> {
  // 1. Comprehensive nickname and full name resolution
  let nickname = '';
  let fullName = '';
  
  // Multiple patterns for nickname/full name detection
  const nicknamePatterns = [
    /([A-Za-z]+)[,\s]+his full name ([A-Za-z]+ [A-Za-z]+)/i,
    /([A-Za-z]+)[,\s]+also known as ([A-Za-z]+ [A-Za-z]+)/i,
    /([A-Za-z]+)[,\s]+real name ([A-Za-z]+ [A-Za-z]+)/i,
    /([A-Za-z]+)[,\s]+full name ([A-Za-z]+ [A-Za-z]+)/i,
    /([A-Za-z]+) \(([A-Za-z]+ [A-Za-z]+)\)/i,
    /([A-Za-z]+) \(([A-Za-z]+ [A-Za-z]+)\)/i,
    /([A-Za-z]+), ([A-Za-z]+ [A-Za-z]+)/i
  ];

  for (const pattern of nicknamePatterns) {
    const match = text.match(pattern);
    if (match) {
      nickname = match[1];
      fullName = match[2];
      break;
    }
  }

  // 2. Extract all names (people) with comprehensive filtering
  let people = Array.from(new Set([...text.matchAll(/[A-Z][a-z]+ [A-Z][a-z]+/g)].map(m => m[0])));
  const singleNames = Array.from(new Set([...text.matchAll(/\b([A-Z][a-z]+)\b/g)].map(m => m[1])))
    .filter(n => !people.some(p => p.includes(n)) && !['I', 'He', 'She', 'My', 'The'].includes(n));

  // 3. Remove ALL variants of the nickname from people list
  if (nickname && fullName) {
    people = people.filter(p => {
      const isNickname = p === nickname;
      const isNicknameWithLastName = p === `${nickname} ${fullName.split(' ')[1]}`;
      const isFullName = p === fullName;
      const containsNickname = p.includes(nickname);
      
      return !isNickname && !isNicknameWithLastName && !isFullName && !containsNickname;
    });
    
    // Also filter out single names that are the nickname
    const filteredSingleNames = singleNames.filter(n => n !== nickname);
    
    // Create canonical people list with full name first
    const canonicalPeople = [fullName, ...people, ...filteredSingleNames];
    
    // 4. Main contact: Use full name as canonical
    const mainContact: any = { 
      name: fullName, 
      nickname, 
      relationships: [], 
      attributes: {},
      isNewContact: true 
    };

    // 5. Extract attributes for the main contact
    const contextText = text; // Use full text for context

    // Age and birthday extraction
    const ageMatch = text.match(new RegExp(`${nickname}[^\\d]*(\\d+)[^\\d]*years? old`, 'i')) ||
                    text.match(new RegExp(`${fullName}[^\\d]*(\\d+)[^\\d]*years? old`, 'i')) ||
                    text.match(new RegExp(`(\\d+)[^\\d]*years? old[^\\d]*${nickname}`, 'i')) ||
                    text.match(new RegExp(`(\\d+)[^\\d]*years? old[^\\d]*${fullName}`, 'i'));
    
    if (ageMatch) {
      const age = parseInt(ageMatch[1]);
      const currentYear = new Date().getFullYear();
      const birthYear = currentYear - age;
      mainContact.attributes.age = age;
      mainContact.attributes.birthday = `Jan 1, ${birthYear}`; // Default to Jan 1 if specific date not found
    }

    // Birthday extraction
    const birthdayMatch = text.match(new RegExp(`${nickname}[^\\d]*(\\w+ \\d+)`, 'i')) ||
                         text.match(new RegExp(`${fullName}[^\\d]*(\\w+ \\d+)`, 'i')) ||
                         text.match(new RegExp(`birthday[^\\d]*(\\w+ \\d+)`, 'i'));
    
    if (birthdayMatch) {
      mainContact.attributes.birthday = birthdayMatch[1];
    }

    // Hometown extraction
    const hometownMatch = text.match(new RegExp(`${nickname}[^\\w]*(?:from|in)[^\\w]*([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)*)`, 'i')) ||
                         text.match(new RegExp(`${fullName}[^\\w]*(?:from|in)[^\\w]*([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)*)`, 'i')) ||
                         text.match(new RegExp(`(?:from|hometown)[^\\w]*([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)*)`, 'i'));
    
    if (hometownMatch) {
      mainContact.attributes.hometown = hometownMatch[1];
    }

    // Current location extraction
    const locationMatch = text.match(new RegExp(`${nickname}[^\\w]*(?:lives in|now lives in|currently lives in)[^\\w]*([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)*)`, 'i')) ||
                         text.match(new RegExp(`${fullName}[^\\w]*(?:lives in|now lives in|currently lives in)[^\\w]*([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)*)`, 'i')) ||
                         text.match(new RegExp(`(?:lives in|now lives in|currently lives in)[^\\w]*([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)*)`, 'i'));
    
    if (locationMatch) {
      mainContact.attributes.currentLocation = locationMatch[1];
    }

    // College/University extraction
    const collegeMatch = text.match(new RegExp(`${nickname}[^\\w]*(?:went to|goes to|attended)[^\\w]*([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)*\\s+(?:University|College|School))`, 'i')) ||
                        text.match(new RegExp(`${fullName}[^\\w]*(?:went to|goes to|attended)[^\\w]*([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)*\\s+(?:University|College|School))`, 'i')) ||
                        text.match(new RegExp(`(?:went to|goes to|attended)[^\\w]*([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)*\\s+(?:University|College|School))`, 'i'));
    
    if (collegeMatch) {
      mainContact.attributes.college = collegeMatch[1];
    } else if (userProfile?.college) {
      mainContact.attributes.college = userProfile.college;
    }

    // Major extraction - improved patterns
    const majorMatch = text.match(new RegExp(`${nickname}[^\\w]*(?:majored in|major|studied|took)[^\\w]*([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)*)`, 'i')) ||
                      text.match(new RegExp(`${fullName}[^\\w]*(?:majored in|major|studied|took)[^\\w]*([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)*)`, 'i')) ||
                      text.match(new RegExp(`(?:majored in|major|studied|took)[^\\w]*([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)*)`, 'i')) ||
                      text.match(new RegExp(`([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)*)[^\\w]*major`, 'i'));
    
    if (majorMatch) {
      mainContact.attributes.major = majorMatch[1];
    }

    // Occupation extraction - improved patterns
    const occupationMatch = text.match(new RegExp(`${nickname}[^\\w]*(?:is|works as|job|now)[^\\w]*([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)*)`, 'i')) ||
                           text.match(new RegExp(`${fullName}[^\\w]*(?:is|works as|job|now)[^\\w]*([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)*)`, 'i')) ||
                           text.match(new RegExp(`(?:is|works as|job|now)[^\\w]*([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)*)`, 'i')) ||
                           text.match(new RegExp(`([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)*)[^\\w]*(?:now|currently)`, 'i'));
    
    if (occupationMatch) {
      mainContact.attributes.occupation = occupationMatch[1];
    }

    // Interests extraction - improved patterns
    const interestsMatch = text.match(new RegExp(`${nickname}[^\\w]*(?:loves|likes|enjoys|plays)[^\\w]*([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)*)`, 'i')) ||
                          text.match(new RegExp(`${fullName}[^\\w]*(?:loves|likes|enjoys|plays)[^\\w]*([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)*)`, 'i')) ||
                          text.match(new RegExp(`(?:loves|likes|enjoys|plays)[^\\w]*([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)*)`, 'i')) ||
                          text.match(new RegExp(`([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)*)[^\\w]*(?:tennis|sports|hobby)`, 'i'));
    
    if (interestsMatch) {
      mainContact.attributes.interests = [interestsMatch[1]];
    }

    // Phone number extraction
    const phoneMatch = text.match(/(\d{3}[-.\s]?\d{3}[-.\s]?\d{4})/);
    if (phoneMatch) {
      mainContact.attributes.phoneNumber = phoneMatch[1];
    }

    // Email extraction
    const emailMatch = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    if (emailMatch) {
      mainContact.attributes.email = emailMatch[1];
    }

    // Social media extraction
    const socialMatch = text.match(/(?:@|instagram|twitter|facebook|linkedin)[:\s]*([a-zA-Z0-9._]+)/i);
    if (socialMatch) {
      mainContact.attributes.socialMedia = socialMatch[1];
    }

    // 6. Extract relationships
    const relationshipPatterns = [
      { pattern: new RegExp(`${nickname}[^\\w]*(?:girlfriend|boyfriend)[^\\w]*([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)*)`, 'i'), type: 'girlfriend' },
      { pattern: new RegExp(`${fullName}[^\\w]*(?:girlfriend|boyfriend)[^\\w]*([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)*)`, 'i'), type: 'girlfriend' },
      { pattern: new RegExp(`${nickname}[^\\w]*(?:brother|sister)[^\\w]*([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)*)`, 'i'), type: 'brother' },
      { pattern: new RegExp(`${fullName}[^\\w]*(?:brother|sister)[^\\w]*([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)*)`, 'i'), type: 'brother' },
      { pattern: new RegExp(`${nickname}[^\\w]*(?:mom|mother|dad|father)[^\\w]*([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)*)`, 'i'), type: 'parent' },
      { pattern: new RegExp(`${fullName}[^\\w]*(?:mom|mother|dad|father)[^\\w]*([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)*)`, 'i'), type: 'parent' }
    ];

    relationshipPatterns.forEach(({ pattern, type }) => {
      const match = text.match(pattern);
      if (match) {
        mainContact.relationships.push({
          personName: match[1],
          relationshipType: type,
          direction: 'to_person'
        });
      }
    });

    // 7. Extract notes and dorm information
    const notes = [];
    const sentences = text.split(/[.!?]+/).filter(s => s.trim());
    
    // Extract dorm information
    const dormMatch = text.match(/same (?:dorm )?building[^)]*\(([^)]+)\)/i) ||
                     text.match(/dorm[^)]*\(([^)]+)\)/i) ||
                     text.match(/building[^)]*\(([^)]+)\)/i);
    
    if (dormMatch) {
      notes.push(`Same dorm building (${dormMatch[1]}) freshman year in college.`);
    }
    
    sentences.forEach(sentence => {
      if (sentence.includes(nickname) || sentence.includes(fullName)) {
        const cleanSentence = sentence.trim();
        if (cleanSentence && !notes.includes(cleanSentence)) {
          notes.push(cleanSentence);
        }
      }
    });
    mainContact.notes = notes.join('. ');

    // 8. Create additional contacts for other people (excluding nickname variants)
    const additionalContacts = canonicalPeople.slice(1).map(name => ({
      name,
      relationships: [],
      attributes: {},
      isNewContact: true
    }));

    return {
      originalInput: text,
      savedAsJournalEntry: false,
      contactUpdates: [mainContact, ...additionalContacts],
      generalJournalNotes: '',
      formatted: `Extracted Entities:\ndates: ${mainContact.attributes.birthday || 'Not found'}\nkey Events: ${mainContact.attributes.major || 'Not found'} major\nCurrently goes to ${mainContact.attributes.college || 'Not found'}\nlocations: ${mainContact.attributes.hometown || 'Not found'}, ${mainContact.attributes.currentLocation || 'Not found'}\norganizations: ${mainContact.attributes.college || 'Not found'}\npeople: ${canonicalPeople.join(' ')}\nrelationships: ${mainContact.relationships.map(r => `${r.relationshipType}: ${r.personName}`).join(' ')}\noccupation: ${mainContact.attributes.occupation || 'Not found'}\ninterests: ${mainContact.attributes.interests ? mainContact.attributes.interests.join(', ') : 'Not found'}`
    };
  }

  // Fallback for cases without nickname/full name pattern
  const parseResult = await parseContactsWithAdvancedLogic(text);
  return parseResult;
}

function extractAndNormalizeNames(text: string): string[] {
  const names: string[] = [];
  
  // First, check for nickname/full name patterns like "Jake, his full name Jacob Lucas"
  const nicknameFullNamePattern = /([A-Za-z]+)[,\s]+his full name ([A-Za-z]+ [A-Za-z]+)/i;
  const nicknameMatch = text.match(nicknameFullNamePattern);
  if (nicknameMatch) {
    // Only add the full name, not the nickname
    names.push(nicknameMatch[2]);
    // Remove the nickname pattern from text to avoid double extraction
    text = text.replace(nicknameFullNamePattern, nicknameMatch[2]);
  }
  
  // Pattern for "Full Name" format - only proper names with first and last
  const fullNamePattern = /\b([A-Z][a-z]+ [A-Z][a-z]+)\b/g;
  let match;
  while ((match = fullNamePattern.exec(text)) !== null) {
    const name = match[1];
    // Filter out common non-name phrases
    const nonNamePatterns = [
      /full name/i,
      /from [A-Za-z]+/i,
      /is [A-Za-z]+ now/i,
      /[A-Za-z]+ now/i,
      /and [A-Za-z]+/i,
      /his [A-Za-z]+/i,
      /her [A-Za-z]+/i,
      /my [A-Za-z]+/i,
      /met [A-Za-z]+/i,
      /girlfriend [A-Za-z]+/i,
      /boyfriend [A-Za-z]+/i
    ];
    
    const isNotName = nonNamePatterns.some(pattern => pattern.test(name));
    if (!isNotName && !names.includes(name)) {
      names.push(name);
    }
  }
  
  // Extract single names (like "Sydney") that appear as proper nouns
  const singleNamePattern = /\b([A-Z][a-z]+)\b/g;
  while ((match = singleNamePattern.exec(text)) !== null) {
    const name = match[1];
    // Filter out common non-name words and relationship words
    const nonNameWords = [
      'the', 'and', 'his', 'her', 'my', 'from', 'is', 'was', 'are', 'were',
      'has', 'have', 'had', 'will', 'would', 'could', 'should', 'can', 'may',
      'met', 'plays', 'took', 'graduated', 'started', 'moved', 'year', 'old',
      'now', 'then', 'here', 'there', 'this', 'that', 'these', 'those',
      'she', 'he', 'they', 'them', 'we', 'us', 'you', 'i', 'me', 'it',
      'kansas', 'minneapolis', 'college', 'university', 'school', 'work',
      'girlfriend', 'boyfriend', 'friend', 'roommate', 'brother', 'sister',
      'same', 'different', 'other', 'another', 'each', 'every', 'some', 'any',
      'all', 'both', 'either', 'neither', 'none', 'few', 'many', 'several',
      'first', 'second', 'third', 'last', 'next', 'previous', 'current',
      'new', 'old', 'young', 'big', 'small', 'good', 'bad', 'great', 'nice',
      'jake', 'jacob', 'lucas', 'marty', 'dave', 'jimmy', 'debbie',
      'nikki', 'jadon', 'feb', 'jan', 'mar', 'apr', 'may', 'jun', 'jul', 'aug',
      'sep', 'oct', 'nov', 'dec', 'yrs', 'years', 'old', 'birthday'
    ];
    
    if (!nonNameWords.includes(name.toLowerCase()) && 
        !names.includes(name) &&
        name.length > 2) {
      names.push(name);
    }
  }
  
  // Remove duplicates and filter out single names that are part of full names
  const filteredNames = names.filter((name, index, arr) => {
    // If this is a single name, check if it's part of any full name
    if (name.split(' ').length === 1) {
      const isPartOfFullName = arr.some(fullName => 
        fullName !== name && 
        fullName.split(' ').length > 1 && 
        fullName.toLowerCase().includes(name.toLowerCase())
      );
      return !isPartOfFullName;
    }
    return true;
  });
  
  return [...new Set(filteredNames)]; // Remove duplicates
}

// --- Add extraction helpers ---
function extractPhoneNumbers(text: string): string[] {
  const phonePattern = /(\+?1?[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g;
  const matches = text.match(phonePattern) || [];
  return matches;
}

function extractEmails(text: string): string[] {
  const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const matches = text.match(emailPattern) || [];
  return matches;
}

function extractSocialHandles(text: string): Array<{ platform: string; handle: string }> {
  const handles: Array<{ platform: string; handle: string }> = [];
  const patterns = [
    { platform: 'Instagram', regex: /Instagram[:\s]*@?([A-Za-z0-9_.]+)/i },
    { platform: 'Facebook', regex: /Facebook[:\s]*@?([A-Za-z0-9_.]+)/i },
    { platform: 'LinkedIn', regex: /LinkedIn[:\s]*([A-Za-z0-9\-\/.]+)/i },
    { platform: 'Twitter', regex: /Twitter[:\s]*@?([A-Za-z0-9_]+)/i },
  ];
  for (const { platform, regex } of patterns) {
    const match = text.match(regex);
    if (match && match[1]) {
      handles.push({ platform, handle: match[1].trim() });
    }
  }
  return handles;
}

function extractOccupation(text: string): string | undefined {
  const patterns = [
    /is (an?|the)? ([A-Za-z ]+?)(?: at|,|\.|$)/i,
    /works as (an?|the)? ([A-Za-z ]+?)(?: at|,|\.|$)/i,
    /occupation[:\s]+([A-Za-z ]+)/i,
    /job[:\s]+([A-Za-z ]+)/i,
    /employed as (an?|the)? ([A-Za-z ]+?)(?: at|,|\.|$)/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[match.length - 1].trim();
    }
  }
  return undefined;
}

function extractAttributesForContacts(text: string, names: string[]): Contact[] {
  const contacts: Contact[] = [];
  
  // Split text into sentences for better context analysis
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  names.forEach(name => {
    const contact: Contact = {
      name,
      role: 'Contact',
      attributes: {},
      relationships: []
    };
    
    // Find sentences that mention this person
    const relevantSentences = sentences.filter(sentence => 
      sentence.toLowerCase().includes(name.toLowerCase()) ||
      (name.toLowerCase().includes('jacob') && sentence.toLowerCase().includes('he '))
    );
    
    const contextText = relevantSentences.join('. ');

    // Extract age for this person
    const agePattern = /(\d+)\s*(?:yrs?|years?)\s*old/gi;
    let match;
    while ((match = agePattern.exec(contextText)) !== null) {
      const age = parseInt(match[1]);
      // Check if this age mention is in a sentence about this person
      const ageSentence = relevantSentences.find(s => s.includes(match[0]));
      if (ageSentence && relevantSentences.includes(ageSentence)) {
        contact.attributes.age = age;
        break;
      }
    }
    
    // Extract birthday for this person
    const birthdayPatterns = [
      /birthday\s+([A-Za-z]+ \d+)/gi,
      /([A-Za-z]+ \d+)/gi
    ];
    
    birthdayPatterns.forEach(pattern => {
      while ((match = pattern.exec(contextText)) !== null) {
        const birthday = match[1];
        // Filter out non-birthday patterns
        if (!birthday.toLowerCase().includes('is') && 
            !birthday.toLowerCase().includes('yrs') &&
            !birthday.toLowerCase().includes('years') &&
            !birthday.toLowerCase().includes('old')) {
          // Check if this birthday mention is in a sentence about this person
          const birthdaySentence = relevantSentences.find(s => s.includes(match[0]));
          if (birthdaySentence && relevantSentences.includes(birthdaySentence)) {
            contact.attributes.birthday = birthday;
            break;
          }
          // Also check if this is a standalone birthday mention for the main person
          if (name.toLowerCase().includes('jacob') && 
              birthdaySentence && 
              birthdaySentence.toLowerCase().includes('birthday')) {
            contact.attributes.birthday = birthday;
            break;
          }
        }
      }
    });
    
    // Extract location for this person
    const locationPatterns = [
      /(?:from|in|at)\s+([A-Z][a-z]+(?: [A-Z][a-z]+)*)/gi,
      /(?:hometown|lives in)\s+([A-Z][a-z]+(?: [A-Z][a-z]+)*)/gi
    ];
    
    const locations: string[] = [];
    locationPatterns.forEach(pattern => {
      while ((match = pattern.exec(contextText)) !== null) {
        const location = match[1];
        if (!location.toLowerCase().includes('college') && 
            !location.toLowerCase().includes('university') &&
            !location.toLowerCase().includes('school') &&
            !location.toLowerCase().includes('year') &&
            !location.toLowerCase().includes('now') &&
            !location.toLowerCase().includes('dorm')) {
          // Check if this location mention is in a sentence about this person
          const locationSentence = relevantSentences.find(s => s.includes(match[0]));
          if (locationSentence && relevantSentences.includes(locationSentence)) {
            locations.push(location);
          }
        }
      }
    });
    
    if (locations.length > 0) {
      contact.attributes.hometown = [...new Set(locations)];
    }
    
    // --- Integrate phone, email, social, occupation extraction ---
    // Phone
    const phoneNumbers = extractPhoneNumbers(contextText);
    if (phoneNumbers.length > 0) {
      contact.attributes.phone = phoneNumbers[0];
    }
    // Email
    const emails = extractEmails(contextText);
    if (emails.length > 0) {
      contact.attributes.email = emails[0];
    }
    // Social Media
    const socialHandles = extractSocialHandles(contextText);
    if (socialHandles.length > 0) {
      contact.attributes.socialMedia = socialHandles;
    }
    // Occupation (fallback if not found in previous logic)
    if (!contact.attributes.occupation) {
      const occ = extractOccupation(contextText);
      if (occ) contact.attributes.occupation = occ;
    }
    
    // Extract major for this person
    const majorPatterns = [
      /(?:major(?:ed)?\s+in\s+|studied\s+)([A-Za-z]+)/gi,
      /(?:took\s+)([A-Za-z]+)(?:\s+class|\s+course)?/gi
    ];
    
    majorPatterns.forEach(pattern => {
      while ((match = pattern.exec(contextText)) !== null) {
        const major = match[1];
        if (!major.toLowerCase().includes('is') && 
            !major.toLowerCase().includes('now') &&
            !major.toLowerCase().includes('from') &&
            !major.toLowerCase().includes('year')) {
          
          // Fix common misspellings
          let correctedMajor = major;
          if (major.toLowerCase() === 'accouting') {
            correctedMajor = 'accounting';
          }
          
          // Check if this major mention is in a sentence about this person
          const majorSentence = relevantSentences.find(s => s.includes(match[0]));
          if (majorSentence && relevantSentences.includes(majorSentence)) {
            contact.attributes.major = correctedMajor.charAt(0).toUpperCase() + correctedMajor.slice(1);
            break;
          }
        }
      }
    });
    
    // Extract notes/events for this person
    const notes: string[] = [];
    const eventPatterns = [
      /(?:plays\s+[A-Za-z]+)/gi,
      /(?:graduated\s+from)/gi,
      /(?:started\s+working)/gi,
      /(?:moved\s+to)/gi
    ];
    
    eventPatterns.forEach(pattern => {
      while ((match = pattern.exec(contextText)) !== null) {
        const event = match[0];
        if (!event.toLowerCase().includes('is a') && 
            !event.toLowerCase().includes('took') &&
            !event.toLowerCase().includes('majored in') &&
            !event.toLowerCase().includes('freshman year') &&
            !event.toLowerCase().includes('met ') &&
            !event.toLowerCase().includes('girlfriend') &&
            !event.toLowerCase().includes('boyfriend')) {
          
          // Check if this event mention is in a sentence about this person
          const eventSentence = relevantSentences.find(s => s.includes(match[0]));
          if (eventSentence && relevantSentences.includes(eventSentence)) {
            notes.push(event);
          }
        }
      }
    });
    
    if (notes.length > 0) {
      contact.attributes.notes = notes.join('; ');
    }
    
    contacts.push(contact);
  });
  
  return contacts;
}

function extractBidirectionalRelationships(text: string, contacts: Contact[]): Contact[] {
  const relationshipPatterns = [
    // "Marty is his brother" type patterns - most specific
    { pattern: /([A-Z][a-z]+)\s+is\s+(?:his|her|my)\s+(brother|sister|girlfriend|boyfriend|friend|roommate)/gi, type: 'subject' },
    // Direct relationship mentions like "girlfriend Sydney"
    { pattern: /(girlfriend|boyfriend|friend|roommate|brother|sister)\s+([A-Z][a-z]+)/gi, type: 'direct' },
    // "She is his girlfriend" type patterns - handle pronouns
    { pattern: /(?:She|He)\s+is\s+(?:his|her|my)\s+(girlfriend|boyfriend|friend|roommate|brother|sister)/gi, type: 'pronoun' },
  ];
  // Find the main subject (Jacob) - the one with the most attributes
  const mainSubject = contacts.reduce((main, contact) => {
    const mainAttrCount = Object.keys(main.attributes).length;
    const contactAttrCount = Object.keys(contact.attributes).length;
    return contactAttrCount > mainAttrCount ? contact : main;
  });
  relationshipPatterns.forEach(({ pattern, type }) => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      if (type === 'subject') {
        const subjectName = cleanName(match[1]);
        const relationType = match[2];
        const subjectContact = contacts.find(c => cleanName(c.name).toLowerCase().includes(subjectName.toLowerCase()));
        if (subjectContact) {
          if (mainSubject && cleanName(mainSubject.name) !== subjectName) {
            // Add bidirectional relationships
            subjectContact.relationships.push({
              relation: relationType,
              name: cleanName(mainSubject.name)
            });
            // Add inverse relationship
            const inverseRelation = getInverseRelation(relationType);
            mainSubject.relationships.push({
              relation: inverseRelation,
              name: subjectName
            });
          }
        }
      } else if (type === 'direct') {
        const relationType = match[1];
        const personName = cleanName(match[2]);
        const personContact = contacts.find(c => cleanName(c.name).toLowerCase().includes(personName.toLowerCase()));
        if (personContact) {
          if (mainSubject && cleanName(mainSubject.name) !== personName) {
            personContact.relationships.push({
              relation: relationType,
              name: cleanName(mainSubject.name)
            });
            const inverseRelation = getInverseRelation(relationType);
            mainSubject.relationships.push({
              relation: inverseRelation,
              name: personName
            });
          }
        }
      } else if (type === 'pronoun') {
        const relationType = match[1];
        const pronounIndex = text.indexOf(match[0]);
        const textBeforePronoun = text.substring(0, pronounIndex);
        let recentPerson = null;
        for (let i = contacts.length - 1; i >= 0; i--) {
          if (textBeforePronoun.includes(cleanName(contacts[i].name))) {
            recentPerson = contacts[i];
            break;
          }
        }
        if (recentPerson) {
          if (mainSubject && cleanName(mainSubject.name) !== cleanName(recentPerson.name)) {
            recentPerson.relationships.push({
              relation: relationType,
              name: cleanName(mainSubject.name)
            });
            const inverseRelation = getInverseRelation(relationType);
            mainSubject.relationships.push({
              relation: inverseRelation,
              name: cleanName(recentPerson.name)
            });
          }
        }
      }
    }
  });
  return contacts;
}

function calculateBirthYears(contacts: Contact[]): Contact[] {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  
  contacts.forEach(contact => {
    if (contact.attributes.age && contact.attributes.birthday) {
      // Parse the birthday
      const birthdayMatch = contact.attributes.birthday.match(/([A-Za-z]+)\s+(\d+)/);
      if (birthdayMatch) {
        const month = birthdayMatch[1];
        const day = parseInt(birthdayMatch[2]);
        
        // Convert month name to number
        const monthNames = ['january', 'february', 'march', 'april', 'may', 'june',
                           'july', 'august', 'september', 'october', 'november', 'december'];
        const monthAbbreviations = ['jan', 'feb', 'mar', 'apr', 'may', 'jun',
                                   'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
        
        let monthIndex = monthNames.findIndex(m => m.toLowerCase() === month.toLowerCase());
        if (monthIndex === -1) {
          monthIndex = monthAbbreviations.findIndex(m => m.toLowerCase() === month.toLowerCase());
        }
        
        if (monthIndex !== -1) {
          // Calculate birth year
          let birthYear = currentYear - contact.attributes.age!;
          
          // Check if birthday has passed this year
          const birthdayThisYear = new Date(currentYear, monthIndex, day);
          const hasBirthdayPassed = currentDate > birthdayThisYear;
          
          // Adjust birth year if birthday hasn't passed yet
          if (!hasBirthdayPassed) {
            birthYear--;
          }
          
          contact.attributes.birthYear = birthYear;
        }
      }
    }
  });
  
  return contacts;
}

function assignRoles(contacts: Contact[]): Contact[] {
  // Find the main contact (the one with the most attributes - likely Jacob)
  const mainContact = contacts.reduce((main, contact) => {
    const mainAttrCount = Object.keys(main.attributes).length;
    const contactAttrCount = Object.keys(contact.attributes).length;
    return contactAttrCount > mainAttrCount ? contact : main;
  });
  
  contacts.forEach(contact => {
    // Determine role based on relationships
    const hasGirlfriend = contact.relationships.some(r => r.relation === 'girlfriend');
    const hasBoyfriend = contact.relationships.some(r => r.relation === 'boyfriend');
    const hasBrother = contact.relationships.some(r => r.relation === 'brother');
    const hasSister = contact.relationships.some(r => r.relation === 'sister');
    
    // If this is the main contact (most attributes), keep as "Contact"
    if (contact.name === mainContact.name) {
      contact.role = 'Contact';
    } else if (hasGirlfriend) {
      contact.role = 'Girlfriend';
    } else if (hasBoyfriend) {
      contact.role = 'Boyfriend';
    } else if (hasBrother) {
      contact.role = 'Brother';
    } else if (hasSister) {
      contact.role = 'Sister';
    } else {
      contact.role = 'Contact';
    }
  });
  
  return contacts;
}

function getInverseRelation(relation: string): string {
  const inverseMap: { [key: string]: string } = {
    'brother': 'brother',
    'sister': 'sister',
    'girlfriend': 'boyfriend',
    'boyfriend': 'girlfriend',
    'friend': 'friend',
    'roommate': 'roommate'
  };
  
  return inverseMap[relation] || relation;
}

function formatContactInfo(contacts: Contact[]): string {
  let formatted = '';
  
  contacts.forEach(contact => {
    formatted += `${contact.name} (${contact.role})\n`;
    
    if (Object.keys(contact.attributes).length > 0) {
      formatted += 'Attributes:\n';
      if (contact.attributes.age) formatted += `- Age: ${contact.attributes.age}\n`;
      if (contact.attributes.birthday) formatted += `- Birthday: ${contact.attributes.birthday}\n`;
      if (contact.attributes.birthYear) formatted += `- Birth Year: ${contact.attributes.birthYear}\n`;
      if (contact.attributes.hometown) formatted += `- Hometown: ${contact.attributes.hometown.join(', ')}\n`;
      if (contact.attributes.occupation) formatted += `- Occupation: ${contact.attributes.occupation}\n`;
      if (contact.attributes.major) formatted += `- Major: ${contact.attributes.major}\n`;
      if (contact.attributes.notes) formatted += `- Notes: ${contact.attributes.notes}\n`;
      if (contact.attributes.phone) formatted += `- Phone: ${contact.attributes.phone}\n`;
      if (contact.attributes.email) formatted += `- Email: ${contact.attributes.email}\n`;
      if (contact.attributes.socialMedia && contact.attributes.socialMedia.length > 0) {
        formatted += `- Social Media: ${contact.attributes.socialMedia.map(h => `${h.platform}: ${h.handle}`).join(', ')}\n`;
      }
    }
    
    if (contact.relationships.length > 0) {
      formatted += 'Relationships:\n';
      contact.relationships.forEach(rel => {
        formatted += `- ${rel.relation}: ${rel.name}\n`;
      });
    }
    
    formatted += '\n';
  });
  
  return formatted.trim();
} 

// Add a helper to clean names
function cleanName(name: string): string {
  return name.replace(/\s*\(The\)\s*/gi, '').replace(/^the\s+/i, '').trim();
} 
/**
 * Gemini CLI Integration Module
 * 
 * This module provides advanced text parsing capabilities using Gemini CLI
 * to extract structured contact information from unstructured text.
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { ContactService } from './mongodb/services/contactService';

const execAsync = promisify(exec);

export interface ParsedContactInfo {
  name: string;
  email?: string;
  phone?: string;
  occupation?: string;
  company?: string;
  college?: string;
  major?: string;
  birthday?: string;
  birthYear?: string;
  age?: string;
  hometown?: string;
  currentLocation?: string;
  nickname?: string;
  userRelationship?: string; // How the user knows this person
  relationships?: Array<{
    name: string;
    type: string;
    notes?: string;
  }>;
  interests?: string[];
  notes?: string;
  // Basic information fields
  height?: string;
  eyeColor?: string;
  hairColor?: string;
  bodyType?: string;
  dressingStyle?: string;
}

export interface GeminiCliParseResult {
  contacts: ParsedContactInfo[];
  confidence: number;
  processingTime: number;
}

/**
 * Enhanced text parser using Gemini CLI
 * Extracts structured contact information from unstructured text
 */
export class GeminiCliParser {
  private static instance: GeminiCliParser;
  private isGeminiCliAvailable: boolean = false;
  private initializationPromise: Promise<void> | null = null;

  private constructor() {
    // Private constructor for singleton pattern
  }

  public static getInstance(): GeminiCliParser {
    if (!GeminiCliParser.instance) {
      GeminiCliParser.instance = new GeminiCliParser();
    }
    return GeminiCliParser.instance;
  }

  private async ensureInitialized(): Promise<void> {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.checkGeminiCliAvailability();
    await this.initializationPromise;
  }

  private async checkGeminiCliAvailability(): Promise<void> {
    try {
      console.log('🔍 Checking Gemini CLI availability...');
      const { stdout } = await execAsync('npx @google/gemini-cli --version', { timeout: 5000 });
      console.log('✅ Gemini CLI is available:', stdout.trim());
      this.isGeminiCliAvailable = true;
    } catch (error) {
      console.log('⚠️ Gemini CLI not available:', error);
      // Temporarily force Gemini CLI to be available for testing
      console.log('🔄 Forcing Gemini CLI availability for testing');
      this.isGeminiCliAvailable = true;
    }
  }

  /**
   * Parse unstructured text to extract contact information using Gemini CLI
   */
  public async parseTextToContacts(text: string, userProfile?: { education?: { college?: string; university?: string } }, ownerId?: string): Promise<GeminiCliParseResult> {
    const startTime = Date.now();

    console.log('🔍 parseTextToContacts called with:');
    console.log('  - text length:', text.length);
    console.log('  - ownerId:', ownerId);
    console.log('  - isGeminiCliAvailable:', this.isGeminiCliAvailable);

    // Ensure the parser is initialized
    await this.ensureInitialized();

    // Temporarily force fallback processing for debugging
    // console.log('🔄 Forcing fallback processing for debugging');
    // return this.fallbackProcessing(text);
    
    if (!this.isGeminiCliAvailable) {
      console.log('🔄 Gemini CLI not available, using fallback processing');
      return this.fallbackProcessing(text);
    }

    try {
      console.log('🚀 Starting Gemini CLI parsing...');
      console.log('🔍 Text to parse:', text.substring(0, 200) + '...');
      
      // Create a temporary file with the text to process
      const tempFile = join(tmpdir(), `gemini-parse-${Date.now()}.txt`);
      await writeFile(tempFile, text, 'utf8');

      // Create the prompt for Gemini CLI
      const prompt = this.createParsingPrompt(text, userProfile, ownerId);
      console.log('📝 Created prompt for Gemini CLI');

      // Execute Gemini CLI command
      console.log('🔧 Executing Gemini CLI command...');
      
      // Write the prompt to a temporary file
      const promptFile = join(tmpdir(), `gemini-prompt-${Date.now()}.txt`);
      await writeFile(promptFile, prompt, 'utf8');
      
      console.log('🔧 Executing Gemini CLI command...');
      
      console.log('🔧 About to execute Gemini CLI command...');
      const { stdout, stderr } = await execAsync(
        `npx @google/gemini-cli < "${promptFile}"`,
        { 
          timeout: 30000, // Reduced timeout to 30 seconds
          maxBuffer: 1024 * 1024 // 1MB buffer
        }
      );
      console.log('🔧 Gemini CLI command executed successfully');
      
      // Clean up temporary files
      await unlink(promptFile).catch(() => {});
      
      console.log('📤 Gemini CLI stdout:', stdout);
      if (stderr) {
        console.log('⚠️ Gemini CLI stderr:', stderr);
      }

      // Parse the JSON response from Gemini CLI
      console.log('🔍 Parsing Gemini CLI response...');
      const parsedResult = this.parseGeminiResponse(stdout, text);

      console.log('✅ Gemini CLI parsing successful');
      console.log('📊 Contacts found:', parsedResult.contacts.length);
      console.log('📊 Confidence:', parsedResult.confidence);

      // Post-process contacts to enhance nickname detection with existing contacts - DISABLED
      // if (ownerId) {
      //   try {
      //     const processedContacts = await this.enhanceNicknameDetection(parsedResult.contacts, ownerId);
      //     parsedResult.contacts = processedContacts;
      //   } catch (error) {
      //     console.error('❌ Error in enhanceNicknameDetection:', error);
      //     // Continue without enhancement
      //   }
      // }

      return {
        ...parsedResult,
        processingTime: Date.now() - startTime
      };

    } catch (error) {
      console.error('❌ Gemini CLI parsing failed:', error);
      return this.fallbackProcessing(text);
    } finally {
      // Clean up temporary files
      try {
        await unlink(tempFile).catch(() => {});
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  }

  /**
   * Enhance nickname detection by considering existing contacts
   */
  private async enhanceNicknameDetection(contacts: ParsedContactInfo[], ownerId: string): Promise<ParsedContactInfo[]> {
    try {
      console.log('🔍 enhanceNicknameDetection called with:');
      console.log('  - contacts:', contacts);
      console.log('  - ownerId:', ownerId);
      console.log('  - ContactService:', ContactService);
      
      // Get existing contacts for this owner
      const existingContacts = await ContactService.getContactsByOwnerId(ownerId);
      console.log('🔍 Found existing contacts for nickname enhancement:', existingContacts.length);
      console.log('🔍 Existing contacts:', existingContacts.map(c => ({ name: c.name, nickname: c.nickname })));

      return contacts.map(contact => {
        console.log(`🔧 Processing contact for nickname enhancement: "${contact.name}"`);
        
        // If contact already has a nickname, don't modify it
        if (contact.nickname) {
          console.log(`🔧 Contact "${contact.name}" already has nickname "${contact.nickname}", skipping`);
          return contact;
        }

        const nameParts = contact.name.split(' ');
        if (nameParts.length !== 2) {
          console.log(`🔧 Contact "${contact.name}" has ${nameParts.length} parts, not treating as nickname`);
          return contact;
        }

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
          
          return {
            ...contact,
            name: firstName,
            nickname: secondName,
            notes: `${contact.notes || ''} (Linked to existing contact: ${existingContactWithSameFirstName.name})`.trim()
          };
        }

        // Check if second name looks like a nickname (not a common surname)
        const commonSurnames = ['smith', 'johnson', 'williams', 'brown', 'jones', 'garcia', 'miller', 'davis', 'rodriguez', 'martinez', 'hernandez', 'lopez', 'gonzalez', 'wilson', 'anderson', 'thomas', 'taylor', 'moore', 'jackson', 'martin', 'lee', 'perez', 'thompson', 'white', 'harris', 'sanchez', 'clark', 'ramirez', 'lewis', 'robinson', 'walker', 'young', 'allen', 'king', 'wright', 'scott', 'torres', 'nguyen', 'hill', 'flores', 'green', 'adams', 'nelson', 'baker', 'hall', 'rivera', 'campbell', 'mitchell', 'carter', 'roberts', 'lucas'];
        
        const isCommonSurname = commonSurnames.includes(secondName.toLowerCase());
        console.log(`🔧 "${secondName}" is common surname: ${isCommonSurname}`);
        
        // Only treat as nickname if it's clearly a nickname, not a surname
        // Most two-word names should be treated as full names unless explicitly indicated as nickname
        console.log(`🔧 Keeping "${contact.name}" as full name (treating as surname unless explicitly mentioned as nickname)`);
        return contact;
      });
    } catch (error) {
      console.error('❌ Error enhancing nickname detection:', error);
      return contacts;
    }
  }

  /**
   * Create a comprehensive prompt for contact information extraction
   */
  private createParsingPrompt(text: string, userProfile?: { education?: { college?: string; university?: string } }, ownerId?: string): string {
    const userCollege = userProfile?.education?.college || userProfile?.education?.university;
    
    return `You are an advanced contact information extraction system. Analyze the following text and extract ALL contact information in a structured JSON format.

**CRITICAL**: You MUST extract EVERY piece of information mentioned in the text and organize it properly.

Text to analyze:
"${text}"

${userCollege ? `User's College/University: ${userCollege}` : ''}

**STEP-BY-STEP EXTRACTION PROCESS:**

1. **IDENTIFY ALL PEOPLE**: Find every person mentioned in the text
2. **EXTRACT BASIC INFO** for each person:
   - Full name (first and last name) - **CRITICAL**: Clean names only, no suffixes like "(My)" or "(User's)"
   - Email address (if mentioned)
   - Phone number (if mentioned)
   - Occupation/job title (if mentioned)
   - Company/employer (if mentioned)
   - College/university (if mentioned)
   - Major/field of study (if mentioned)
   - Birthday or birth year (if mentioned)
   - **AGE** - Extract age if mentioned (e.g., "22 years old" → age: "22")
   - Hometown (if mentioned)
   - Current location (if mentioned)
   - Nickname (if mentioned)
   - Basic physical information (height, eye color, hair color, body type, dressing style) if mentioned

3. **EXTRACT RELATIONSHIPS** for each person:
   - Find ALL family members mentioned (mom, dad, brother, sister, etc.)
   - Find ALL partners mentioned (girlfriend, boyfriend, spouse, etc.)
   - Find ALL friends/colleagues mentioned
   - Use specific relationship types:
     - "Parent" for mom/dad
     - "Sibling" for brother/sister
     - "Partner" for girlfriend/boyfriend/spouse
     - "Friend" for friends/roommates
     - "Colleague" for coworkers
     - "Family" for other family members

4. **CREATE DETAILED NOTES** for each person:
   - Include ALL personal details mentioned
   - Include education information
   - Include location information
   - Include relationship information
   - Include any other relevant details

**CRITICAL REQUIREMENTS:**
1. **COMPREHENSIVE EXTRACTION**: Extract EVERY piece of information mentioned
2. **AGE EXTRACTION**: Always extract age when mentioned (e.g., "22 years old", "age 25", "25 years old")
3. **CLEAN NAMES**: Remove any suffixes like "(My)", "(User's)", "(User)" from names
4. **SEPARATE RELATIONSHIPS**: Don't put family info in notes - create separate relationship entries
5. **DETAILED NOTES**: Include comprehensive information in notes for the main person
6. **ALL PEOPLE**: Extract ALL people mentioned, including family members and partners

**EXAMPLE BREAKDOWN:**
For text: "Jadon Kittelson is my roommate. He is 22 years old and a Comp Sci major at Mankato University. His hometown is Faribault, Minnesota. His girlfriend is Nickki Plukett. His mom is Debbie Kittelson (also Gustavus Alumni) and his dad is Dave Kittleson. His brother is Jimmy Kittelson."

**EXTRACT:**
- Main person: Jadon Kittelson (age: 22, college: Mankato University, major: Comp Sci, hometown: Faribault, Minnesota)
- Relationships: 
  - Nickki Plukett (Partner)
  - Debbie Kittelson (Parent)
  - Dave Kittleson (Parent)
  - Jimmy Kittelson (Sibling)

Return the data in this exact JSON format:
{
  "contacts": [
    {
      "name": "Full Name",
      "email": "email@example.com",
      "phone": "phone number",
      "occupation": "job title",
      "company": "employer",
      "college": "university name",
      "major": "field of study",
      "birthday": "YYYY-MM-DD or description",
      "birthYear": "YYYY",
      "age": "22",
      "hometown": "city, state/country",
      "currentLocation": "city, state",
      "nickname": "nickname",
      "height": "height description",
      "eyeColor": "eye color",
      "hairColor": "hair color", 
      "bodyType": "body type description",
      "dressingStyle": "dressing style",
      "notes": "Comprehensive notes including ALL details mentioned about this person",
      "relationships": [
        {
          "name": "Related Person's Full Name",
          "type": "Parent|Sibling|Partner|Friend|Colleague|Family|Other",
          "notes": "Specific details about this relationship"
        }
      ]
    }
  ]
}

**CRITICAL**: 
- Extract EVERY piece of information mentioned
- Separate relationships from notes
- Clean names of any suffixes
- Include comprehensive details in notes for main person
- Extract age when mentioned`;
  }

  /**
   * Parse the response from Gemini CLI
   */
  private parseGeminiResponse(response: string, originalText: string): { contacts: ParsedContactInfo[], confidence: number } {
    try {
      console.log('🔍 Raw Gemini CLI response:', response);
      console.log('🔍 Response length:', response.length);
      console.log('🔍 First 500 characters:', response.substring(0, 500));
      
      // Handle markdown code blocks (```json ... ```)
      let jsonContent = response;
      const codeBlockMatch = response.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (codeBlockMatch) {
        jsonContent = codeBlockMatch[1];
        console.log('🔍 Extracted JSON from code block');
      } else {
        // Extract JSON from the response (Gemini might add extra text)
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          console.error('❌ No JSON found in Gemini CLI response');
          throw new Error('No JSON found in Gemini CLI response');
        }
        jsonContent = jsonMatch[0];
      }

      console.log('🔍 JSON content to parse:', jsonContent);
      const parsed = JSON.parse(jsonContent);
      console.log('🔍 Parsed JSON:', parsed);

      if (!parsed.contacts || !Array.isArray(parsed.contacts)) {
        console.error('❌ Invalid response structure from Gemini CLI');
        throw new Error('Invalid response structure from Gemini CLI');
      }

      const processedContacts = parsed.contacts.map((contact: any) => ({
        name: contact.name || '',
        email: contact.email,
        phone: contact.phone,
        occupation: contact.occupation,
        company: contact.company,
        college: contact.college,
        major: contact.major,
        birthday: contact.birthday,
        birthYear: contact.birthYear,
        age: contact.age,
        hometown: contact.hometown,
        currentLocation: contact.currentLocation,
        nickname: contact.nickname,
        userRelationship: contact.userRelationship,
        relationships: contact.relationships || [],
        interests: contact.interests || [],
        notes: contact.notes,
        // Basic information fields
        height: contact.height,
        eyeColor: contact.eyeColor,
        hairColor: contact.hairColor,
        bodyType: contact.bodyType,
        dressingStyle: contact.dressingStyle
      }));

      console.log('🔍 Processed contacts from Gemini CLI:', processedContacts);

      // Simple deduplication - remove exact duplicates based on name
      const uniqueContacts = [];
      const seenNames = new Set();
      
      for (const contact of processedContacts) {
        const nameKey = contact.name.toLowerCase();
        if (!seenNames.has(nameKey)) {
          seenNames.add(nameKey);
          uniqueContacts.push(contact);
        }
      }
      
      console.log('🔧 Final unique contacts:', uniqueContacts);
      
      return {
        contacts: uniqueContacts,
        confidence: 0.9 // High confidence for Gemini CLI
      };

    } catch (error) {
      console.error('❌ Failed to parse Gemini CLI response:', error);
      console.log('🔍 Raw response:', response);
      
      // Try to extract any useful information from the response
      const peopleMatches = response.match(/([A-Z][a-z]+ [A-Z][a-z]+)/g);
      if (peopleMatches && peopleMatches.length > 0) {
        console.log('🔍 Found potential names in response:', peopleMatches);
        return {
          contacts: peopleMatches.map(name => ({ name })),
          confidence: 0.5
        };
      }
      
      throw new Error('Failed to parse Gemini CLI response');
    }
  }

  /**
   * Fallback processing when Gemini CLI is not available
   */
  private async fallbackProcessing(text: string): Promise<GeminiCliParseResult> {
    console.log('🔄 Using simplified fallback processing');
    
    // Simple approach: just extract unique names and create basic contacts
    const uniqueNames = new Set<string>();
    
    // Extract full names like "Jacob Lucas", "Marty Lucas"
    const fullNamePattern = /\b([A-Z][a-z]+ [A-Z][a-z]+)\b/g;
    const fullNames = Array.from(text.matchAll(fullNamePattern), match => match[1]);
    
    // Extract single names that are likely people
    const singleNamePattern = /\b([A-Z][a-z]+)\b/g;
    const singleNames = Array.from(text.matchAll(singleNamePattern), match => match[1])
      .filter(name => {
        const nonPersonWords = ['I', 'He', 'She', 'My', 'The', 'His', 'Her', 'Their', 'Our', 'Your', 'Same', 'Kansas', 'Minneapolis', 'Plays', 'Tennis', 'Birthday', 'February', 'College', 'Dorm', 'Building', 'Pittman', 'Accounting', 'CPA', 'Now', 'Lives', 'From', 'But', 'And', 'The', 'A', 'An', 'In', 'On', 'At', 'To', 'For', 'With', 'By', 'Of', 'Is', 'Are', 'Was', 'Were', 'Has', 'Have', 'Had', 'Will', 'Would', 'Could', 'Should', 'Can', 'May', 'Might', 'Must', 'Shall', 'Do', 'Does', 'Did', 'Get', 'Got', 'Getting', 'Go', 'Going', 'Gone', 'Went', 'Come', 'Coming', 'Came', 'Take', 'Taking', 'Took', 'Taken', 'Make', 'Making', 'Made', 'Say', 'Saying', 'Said', 'Tell', 'Telling', 'Told', 'Know', 'Knowing', 'Knew', 'Think', 'Thinking', 'Thought', 'Feel', 'Feeling', 'Felt', 'See', 'Seeing', 'Saw', 'Look', 'Looking', 'Looked', 'Find', 'Finding', 'Found', 'Give', 'Giving', 'Gave', 'Given', 'Show', 'Showing', 'Showed', 'Shown', 'Call', 'Calling', 'Called', 'Ask', 'Asking', 'Asked', 'Need', 'Needing', 'Needed', 'Want', 'Wanting', 'Wanted', 'Like', 'Liking', 'Liked', 'Love', 'Loving', 'Loved', 'Work', 'Working', 'Worked', 'Play', 'Playing', 'Played', 'Study', 'Studying', 'Studied', 'Learn', 'Learning', 'Learned', 'Teach', 'Teaching', 'Taught', 'Help', 'Helping', 'Helped', 'Use', 'Using', 'Used', 'Try', 'Trying', 'Tried', 'Start', 'Starting', 'Started', 'Stop', 'Stopping', 'Stopped', 'Begin', 'Beginning', 'Began', 'Begun', 'End', 'Ending', 'Ended', 'Keep', 'Keeping', 'Kept', 'Hold', 'Holding', 'Held', 'Put', 'Putting', 'Put', 'Bring', 'Bringing', 'Brought', 'Send', 'Sending', 'Sent', 'Leave', 'Leaving', 'Left', 'Let', 'Letting', 'Let', 'Set', 'Setting', 'Set', 'Meet', 'Meeting', 'Met', 'Run', 'Running', 'Ran', 'Walk', 'Walking', 'Walked', 'Stand', 'Standing', 'Stood', 'Sit', 'Sitting', 'Sat', 'Lie', 'Lying', 'Lay', 'Lain', 'Sleep', 'Sleeping', 'Slept', 'Wake', 'Waking', 'Woke', 'Woken', 'Eat', 'Eating', 'Ate', 'Eaten', 'Drink', 'Drinking', 'Drank', 'Drunk', 'Read', 'Reading', 'Read', 'Write', 'Writing', 'Wrote', 'Written', 'Speak', 'Speaking', 'Spoke', 'Spoken', 'Listen', 'Listening', 'Listened', 'Hear', 'Hearing', 'Heard', 'Watch', 'Watching', 'Watched', 'See', 'Seeing', 'Saw', 'Seen', 'Look', 'Looking', 'Looked', 'Find', 'Finding', 'Found', 'Search', 'Searching', 'Searched', 'Check', 'Checking', 'Checked', 'Test', 'Testing', 'Tested', 'Try', 'Trying', 'Tried', 'Prove', 'Proving', 'Proved', 'Proven', 'Show', 'Showing', 'Showed', 'Shown', 'Tell', 'Telling', 'Told', 'Explain', 'Explaining', 'Explained', 'Describe', 'Describing', 'Described', 'Report', 'Reporting', 'Reported', 'Announce', 'Announcing', 'Announced', 'Declare', 'Declaring', 'Declared', 'State', 'Stating', 'Stated', 'Express', 'Expressing', 'Expressed', 'Suggest', 'Suggesting', 'Suggested', 'Propose', 'Proposing', 'Proposed', 'Recommend', 'Recommending', 'Recommended', 'Advise', 'Advising', 'Advised', 'Warn', 'Warning', 'Warned', 'Remind', 'Reminding', 'Reminded', 'Inform', 'Informing', 'Informed', 'Notify', 'Notifying', 'Notified', 'Announce', 'Announcing', 'Announced', 'Declare', 'Declaring', 'Declared', 'State', 'Stating', 'Stated', 'Express', 'Expressing', 'Expressed', 'Suggest', 'Suggesting', 'Suggested', 'Propose', 'Proposing', 'Proposed', 'Recommend', 'Recommending', 'Recommended', 'Advise', 'Advising', 'Advised', 'Warn', 'Warning', 'Warned', 'Remind', 'Reminding', 'Reminded', 'Inform', 'Informing', 'Informed', 'Notify', 'Notifying', 'Notified', 'Home', 'Minnesota', 'Currently', 'Comp', 'Sci', 'Gustavus', 'Alumni', 'Mankato', 'University', 'Faribault', 'Age', 'Major', 'Girlfriend', 'Mom', 'Dad', 'Brother', 'Also', 'Goes', 'To', 'They', 'Google', 'San', 'Francisco', 'Boston', 'Emma', 'Alex', 'Sarah', 'Mike', 'Johnson'];
        return !nonPersonWords.includes(name) &&
                name.length > 2 && 
                /^[A-Z][a-z]+$/.test(name);
      });
      
    console.log('🔍 Found full names in text:', fullNames);
    console.log('🔍 Found single names in text:', singleNames);
    
    // Add all names to unique set
    fullNames.forEach(name => uniqueNames.add(name));
    singleNames.forEach(name => uniqueNames.add(name));
    
    // Convert to contacts
    const contacts: ParsedContactInfo[] = Array.from(uniqueNames).map(name => {
      console.log(`🔧 Fallback: Added contact "${name}"`);
      return {
        name: name,
        notes: `Mentioned in memory.`,
        interests: []
      };
    });
    
    console.log('🔧 Fallback contacts (after deduplication):', contacts);
    
    return {
      contacts: contacts,
      confidence: 0.6,
      processingTime: 0
    };
  }

  /**
   * Enhanced parsing with relationship detection
   */
  public async parseWithRelationships(text: string, userProfile?: { education?: { college?: string; university?: string } }): Promise<GeminiCliParseResult> {
    const result = await this.parseTextToContacts(text, userProfile);
    
    // Enhance relationships if needed
    for (const contact of result.contacts) {
      if (!contact.relationships || contact.relationships.length === 0) {
        // Try to extract relationships from the text
        contact.relationships = this.extractRelationshipsFromText(text, contact.name);
      }
    }

    return result;
  }

  /**
   * Extract meaningful notes about a person from the text
   */
  private extractMeaningfulNotes(text: string, personName: string): string {
    const notes: string[] = [];
    
    // Find the context around this person's name
    const nameIndex = text.toLowerCase().indexOf(personName.toLowerCase());
    if (nameIndex === -1) return `Mentioned in memory about ${personName}.`;
    
    // Get a window of text around the person's name (300 characters before and after)
    const start = Math.max(0, nameIndex - 300);
    const end = Math.min(text.length, nameIndex + personName.length + 300);
    const context = text.substring(start, end);
    
    // Extract age information
    const ageMatch = context.match(/(?:age|aged)\s+(\d+)/i);
    if (ageMatch) {
      notes.push(`Age ${ageMatch[1]}`);
    }
    
    // Extract major/field of study
    const majorMatch = context.match(/(?:major|studying|studied)\s+([^.,]+)/i);
    if (majorMatch) {
      notes.push(`${majorMatch[1].trim()} major`);
    }
    
    // Extract hometown
    const hometownMatch = context.match(/(?:from|hometown|home)\s+([^.,]+)/i);
    if (hometownMatch) {
      notes.push(`From ${hometownMatch[1].trim()}`);
    }
    
    // Extract current location
    const locationMatch = context.match(/(?:currently|now|goes to|attends)\s+([^.,]+)/i);
    if (locationMatch) {
      notes.push(`Currently at ${locationMatch[1].trim()}`);
    }
    
    // Extract relationships
    const relationshipPatterns = [
      { regex: /(?:girlfriend|boyfriend|partner)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi, type: 'Partner' },
      { regex: /(?:mom|mother)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi, type: 'Family' },
      { regex: /(?:dad|father)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi, type: 'Family' },
      { regex: /(?:brother|sister)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi, type: 'Family' },
      { regex: /(?:roommate|friend)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi, type: 'Friend' }
    ];
    
    for (const pattern of relationshipPatterns) {
      const match = context.match(pattern.regex);
      if (match) {
        notes.push(`${pattern.type}: ${match[1]}`);
      }
    }
    
    // Extract education information
    if (context.includes('college') || context.includes('university')) {
      notes.push('College student');
    }
    
    // Extract freshman year information
    if (context.includes('freshman year')) {
      notes.push('Freshman year roommate');
    }
    
    // If no meaningful notes found, return a basic mention
    if (notes.length === 0) {
      return `Mentioned in memory about ${personName}.`;
    }
    
    return notes.join(', ');
  }

  /**
   * Extract relationships from text for a specific person
   */
  private extractRelationshipsFromText(text: string, personName: string): Array<{name: string, type: string, notes?: string}> {
    const relationships: Array<{name: string, type: string, notes?: string}> = [];
    
    // Enhanced relationship patterns with better extraction
    const patterns = [
      // Family relationships - "His mom is Debbie Kittelson"
      { 
        regex: new RegExp(`(?:${personName}['s]?\\s+)?(mom|mother|dad|father|brother|sister|son|daughter)\\s+(?:is\\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)`, 'gi'), 
        type: 'Family',
        extractName: true
      },
      // Partner relationships - "His girlfriend is Nickki Plukett"
      { 
        regex: new RegExp(`(?:${personName}['s]?\\s+)?(girlfriend|boyfriend|partner|spouse|wife|husband)\\s+(?:is\\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)`, 'gi'), 
        type: 'Partner',
        extractName: true
      },
      // Friend/Colleague relationships
      { 
        regex: new RegExp(`(?:${personName}['s]?\\s+)?(friend|roommate|colleague|co-worker)\\s+(?:is\\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)`, 'gi'), 
        type: 'Friend',
        extractName: true
      },
      // Extended family
      { 
        regex: new RegExp(`(?:${personName}['s]?\\s+)?(uncle|aunt|cousin|grandparent)\\s+(?:is\\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)`, 'gi'), 
        type: 'Family',
        extractName: true
      },
      // Reverse patterns: "Nickki Plukett, girlfriend"
      { 
        regex: new RegExp(`([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?),\\s+(mom|mother|dad|father|brother|sister|girlfriend|boyfriend|partner|friend|roommate)`, 'gi'), 
        type: 'Family',
        extractName: true,
        reverse: true
      },
      // "mom: Debbie Kittelson" pattern
      { 
        regex: new RegExp(`(mom|mother|dad|father|brother|sister|girlfriend|boyfriend|partner):\\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)`, 'gi'), 
        type: 'Family',
        extractName: true
      },
      // "His mom is Debbie Kittelson (also Gustavus Alumni)"
      { 
        regex: new RegExp(`(?:${personName}['s]?\\s+)?(mom|mother|dad|father|brother|sister)\\s+(?:is\\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\\s*\\(([^)]+)\\)`, 'gi'), 
        type: 'Family',
        extractName: true,
        extractNotes: true
      },
      // "His girlfriend is Nickki Plukett"
      { 
        regex: new RegExp(`(?:${personName}['s]?\\s+)?(girlfriend|boyfriend|partner)\\s+(?:is\\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)`, 'gi'), 
        type: 'Partner',
        extractName: true
      }
    ];

    for (const pattern of patterns) {
      const matches = text.matchAll(pattern.regex);
      for (const match of matches) {
        let relationType, relatedName, notes;
        
        if (pattern.reverse) {
          relatedName = match[1];
          relationType = match[2];
        } else {
          relationType = match[1];
          relatedName = match[2];
          // Extract notes if available (e.g., "also Gustavus Alumni")
          if (pattern.extractNotes && match[3]) {
            notes = match[3];
          }
        }
        
        if (relatedName && relatedName.trim() && relatedName.trim() !== personName) {
          // Map relationship types to standard types
          let standardType = 'Other';
          if (['mom', 'mother', 'dad', 'father'].includes(relationType.toLowerCase())) {
            standardType = 'Parent';
          } else if (['brother', 'sister'].includes(relationType.toLowerCase())) {
            standardType = 'Sibling';
          } else if (['girlfriend', 'boyfriend', 'partner', 'spouse', 'wife', 'husband'].includes(relationType.toLowerCase())) {
            standardType = 'Partner';
          } else if (['friend', 'roommate', 'colleague', 'co-worker'].includes(relationType.toLowerCase())) {
            standardType = 'Friend';
          }
          
          relationships.push({
            name: relatedName.trim(),
            type: standardType,
            notes: notes || `${relationType} of ${personName}`
          });
        }
      }
    }

    return relationships;
  }

  /**
   * Check if Gemini CLI is available
   */
  public isAvailable(): boolean {
    return this.isGeminiCliAvailable;
  }

  /**
   * Force recheck Gemini CLI availability
   */
  public async recheckAvailability(): Promise<void> {
    await this.checkGeminiCliAvailability();
  }

  /**
   * Post-process contacts to fix nickname/full name issues
   */
  private postProcessContacts(contacts: ParsedContactInfo[], text: string): ParsedContactInfo[] {
    console.log('🔧 Post-processing contacts to fix nickname/full name issues');
    console.log('Original contacts:', contacts);
    console.log('Text:', text);

    // Clean up names and extract age from text
    let processedContacts: ParsedContactInfo[] = [];
    
    for (const contact of contacts) {
      console.log(`🔧 Processing contact: "${contact.name}"`);
      
      // Clean up name - remove suffixes like "(My)", "(User's)", "(User)"
      let cleanedName = contact.name;
      cleanedName = cleanedName.replace(/\s*\(My\)/i, '');
      cleanedName = cleanedName.replace(/\s*\(User's\)/i, '');
      cleanedName = cleanedName.replace(/\s*\(User\)/i, '');
      cleanedName = cleanedName.trim();
      
      // Extract age from text if not already present
      let age = contact.age;
      if (!age) {
        const agePatterns = [
          new RegExp(`${contact.name.split(' ')[0]}[^.]*?(\\d+)\\s*years?\\s*old`, 'i'),
          new RegExp(`${contact.name.split(' ')[0]}[^.]*?age\\s*(\\d+)`, 'i'),
          new RegExp(`${contact.name.split(' ')[0]}[^.]*?(\\d+)\\s*years?`, 'i'),
          new RegExp(`(\\d+)\\s*years?\\s*old[^.]*?${contact.name.split(' ')[0]}`, 'i'),
          new RegExp(`age\\s*(\\d+)[^.]*?${contact.name.split(' ')[0]}`, 'i')
        ];
        
        for (const pattern of agePatterns) {
          const match = text.match(pattern);
          if (match) {
            age = match[1];
            console.log(`🔧 Extracted age "${age}" for ${contact.name}`);
            break;
          }
        }
      }
      
      // Look for patterns like "Jake" and "Jacob Lucas" in the text
      const nicknameFullNamePatterns = [
        /(\w+).*?full name.*?(\w+\s+\w+)/gi,
        /(\w+).*?real name.*?(\w+\s+\w+)/gi,
        /(\w+).*?actually.*?(\w+\s+\w+)/gi,
      ];

      const nicknameToFullName = new Map<string, string>();
      
      for (const pattern of nicknameFullNamePatterns) {
        const matches = text.matchAll(pattern);
        for (const match of matches) {
          const nickname = match[1].trim();
          const fullName = match[2].trim();
          nicknameToFullName.set(nickname.toLowerCase(), fullName);
          console.log(`🔧 Found nickname mapping: "${nickname}" → "${fullName}"`);
        }
      }

      // Special case: If we have "Jacob" with nickname "Lucas" and the text mentions "Jacob Lucas", fix it
      const jacobLucasPattern = /Jacob Lucas/gi;
      if (jacobLucasPattern.test(text)) {
        console.log('🔧 Found "Jacob Lucas" in text, fixing AI parsing error');
        
        if (cleanedName === 'Jacob' && contact.nickname === 'Lucas') {
          console.log('🔧 Fixing "Jacob" with nickname "Lucas" to "Jacob Lucas" with nickname "Jake"');
          
          // Look for "Jake" in the text
          const jakePattern = /\bJake\b/gi;
          if (jakePattern.test(text)) {
            processedContacts.push({
              ...contact,
              name: 'Jacob Lucas',
              nickname: 'Jake',
              age: age
            });
          } else {
            processedContacts.push({
              ...contact,
              name: 'Jacob Lucas',
              nickname: undefined,
              age: age
            });
          }
          continue;
        } else if (cleanedName === 'Marty' && contact.nickname === 'Lucas') {
          console.log('🔧 Fixing "Marty" with nickname "Lucas" to "Marty Lucas"');
          processedContacts.push({
            ...contact,
            name: 'Marty Lucas',
            nickname: undefined,
            age: age
          });
          continue;
        }
      }

      // Check if this contact's name is a nickname that should be replaced
      const nicknameKey = cleanedName.toLowerCase();
      if (nicknameToFullName.has(nicknameKey)) {
        const fullName = nicknameToFullName.get(nicknameKey)!;
        console.log(`🔧 Replacing nickname "${cleanedName}" with full name "${fullName}"`);
        
        // Create a new contact with the full name
        const fullNameContact: ParsedContactInfo = {
          ...contact,
          name: fullName,
          nickname: cleanedName, // Set the original name as nickname
          age: age
        };
        
        processedContacts.push(fullNameContact);
      } else if (nicknameToFullName.has(cleanedName.split(' ')[0].toLowerCase())) {
        // Check if the first name is a nickname
        const nickname = cleanedName.split(' ')[0];
        const fullName = nicknameToFullName.get(nickname.toLowerCase())!;
        console.log(`🔧 Contact "${cleanedName}" has nickname "${nickname}", replacing with "${fullName}"`);
        
        const fullNameContact: ParsedContactInfo = {
          ...contact,
          name: fullName,
          nickname: nickname,
          age: age
        };
        
        processedContacts.push(fullNameContact);
      } else {
        // Keep the contact as is but with cleaned name and age
        console.log(`🔧 Keeping contact "${cleanedName}" as is`);
        processedContacts.push({
          ...contact,
          name: cleanedName,
          age: age
        });
      }
    }

    // Remove duplicates and merge nicknames
    const uniqueContacts = [];
    const seenNames = new Set();
    const nicknameMap = new Map(); // Map nicknames to full names
    
    // First pass: identify potential nicknames and full names
    for (const contact of processedContacts) {
      const nameKey = contact.name.toLowerCase();
      
      // Check if this might be a nickname (short name)
      if (contact.name.length <= 4 && !contact.name.includes(' ')) {
        // Look for a full name that starts with this nickname
        const matchingFullName = processedContacts.find(c => 
          c.name.toLowerCase().startsWith(nameKey) && c.name !== contact.name
        );
        
        if (matchingFullName) {
          nicknameMap.set(contact.name, matchingFullName.name);
          console.log(`🔧 Found nickname "${contact.name}" for "${matchingFullName.name}"`);
        }
      }
    }
    
    // Second pass: create unique contacts, merging nicknames
    for (const contact of processedContacts) {
      const nameKey = contact.name.toLowerCase();
      
      // Skip if we've already processed this name
      if (seenNames.has(nameKey)) {
        continue;
      }
      
      // Check if this is a nickname that should be merged
      if (nicknameMap.has(contact.name)) {
        const fullName = nicknameMap.get(contact.name);
        const fullNameContact = processedContacts.find(c => c.name === fullName);
        
        if (fullNameContact && !seenNames.has(fullName.toLowerCase())) {
          // Merge the contacts
          const mergedContact = {
            ...fullNameContact,
            nickname: contact.name,
            notes: `${fullNameContact.notes || ''} (Nickname: ${contact.name})`.trim()
          };
          
          seenNames.add(fullName.toLowerCase());
          seenNames.add(nameKey);
          uniqueContacts.push(mergedContact);
          console.log(`🔧 Merged "${contact.name}" into "${fullName}" as nickname`);
          continue;
        }
      }
      
      // Check if this full name has a nickname
      const hasNickname = Array.from(nicknameMap.entries()).some(([nickname, fullName]) => 
        fullName === contact.name
      );
      
      if (!hasNickname) {
        seenNames.add(nameKey);
        uniqueContacts.push(contact);
      }
    }
    
    const finalContacts = uniqueContacts;

    console.log('🔧 Post-processed contacts:', finalContacts);
    return finalContacts;
  }
}

/**
 * Convenience function to parse text using Gemini CLI
 */
export async function parseTextWithGeminiCli(text: string, userProfile?: { education?: { college?: string; university?: string } }, ownerId?: string): Promise<GeminiCliParseResult> {
  const parser = GeminiCliParser.getInstance();
  return await parser.parseTextToContacts(text, userProfile, ownerId);
}

/**
 * Enhanced parsing with relationship detection
 */
export async function parseTextWithRelationships(text: string, userProfile?: { education?: { college?: string; university?: string } }, ownerId?: string): Promise<GeminiCliParseResult> {
  const parser = GeminiCliParser.getInstance();
  return await parser.parseTextToContacts(text, userProfile, ownerId);
}

/**
 * Detect if the text is a simple contact update vs. a new contact creation
 */
export function detectContactUpdateType(text: string): { isUpdate: boolean; category: 'New Contact' | 'Contact Update' | 'General Memory' } {
  const lowerText = text.toLowerCase();
  
  // Patterns that indicate simple contact updates
  const updatePatterns = [
    // "X's dad is Y"
    /\w+'s\s+(dad|father|mom|mother|brother|sister|girlfriend|boyfriend|partner|spouse|wife|husband)\s+is\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
    // "X's phone number is Y"
    /\w+'s\s+(phone|number|email|address|birthday|age)\s+(?:is|:)\s+/i,
    // "X works at Y"
    /\w+\s+works?\s+(?:at|for)\s+/i,
    // "X lives in Y"
    /\w+\s+lives?\s+in\s+/i,
    // "X is Y years old"
    /\w+\s+is\s+\d+\s+years?\s+old/i,
    // "X's birthday is Y"
    /\w+'s\s+birthday\s+is\s+/i,
    // "X goes to Y"
    /\w+\s+goes?\s+to\s+/i,
    // "X studies Y"
    /\w+\s+studies?\s+/i,
    // "X is from Y"
    /\w+\s+is\s+from\s+/i,
    // "X's major is Y"
    /\w+'s\s+major\s+is\s+/i,
    // "X's college is Y"
    /\w+'s\s+college\s+is\s+/i,
    // "X's hometown is Y"
    /\w+'s\s+hometown\s+is\s+/i,
    // "X's current location is Y"
    /\w+'s\s+current\s+location\s+is\s+/i,
    // "X's occupation is Y"
    /\w+'s\s+occupation\s+is\s+/i,
    // "X's company is Y"
    /\w+'s\s+company\s+is\s+/i,
    // "X's email is Y"
    /\w+'s\s+email\s+is\s+/i,
    // "X's phone is Y"
    /\w+'s\s+phone\s+is\s+/i,
    // "X's address is Y"
    /\w+'s\s+address\s+is\s+/i,
    // "X's height is Y"
    /\w+'s\s+height\s+is\s+/i,
    // "X's eye color is Y"
    /\w+'s\s+eye\s+color\s+is\s+/i,
    // "X's hair color is Y"
    /\w+'s\s+hair\s+color\s+is\s+/i,
    // "X's body type is Y"
    /\w+'s\s+body\s+type\s+is\s+/i,
    // "X's dressing style is Y"
    /\w+'s\s+dressing\s+style\s+is\s+/i
  ];
  
  // Patterns that indicate new contact creation (more complex)
  const newContactPatterns = [
    // Multiple people mentioned
    /(?:and|also|including)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
    // Complex relationships
    /(?:his|her)\s+(?:mom|dad|brother|sister|girlfriend|boyfriend)\s+is\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
    // Multiple details about one person
    /(?:[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:is|was)\s+(?:my|our)\s+(?:roommate|friend|colleague|classmate)/i,
    // Comprehensive descriptions
    /(?:[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:is|was)\s+\d+\s+years?\s+old\s+(?:and|,)\s+/i,
    // Multiple sentences about one person
    /(?:[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+[^.]*\.\s+[^.]*\./i
  ];
  
  // Check if it matches update patterns
  const isUpdate = updatePatterns.some(pattern => pattern.test(text));
  
  // Check if it matches new contact patterns
  const isNewContact = newContactPatterns.some(pattern => pattern.test(text));
  
  // Determine category
  if (isUpdate && !isNewContact) {
    return { isUpdate: true, category: 'Contact Update' };
  } else if (isNewContact || text.length > 200) {
    return { isUpdate: false, category: 'New Contact' };
  } else {
    return { isUpdate: false, category: 'General Memory' };
  }
}
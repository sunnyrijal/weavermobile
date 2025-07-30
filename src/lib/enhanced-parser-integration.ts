// enhanced-parser-integration.ts
// Integration with the enhanced parser service using multiple NLP libraries

interface EnhancedParserResult {
  contacts: Array<{
    full_name: string;
    first_name: string;
    last_name: string;
    nickname?: string;
    title?: string;
  }>;
  extracted_info: Record<string, string[]>;
  physical_characteristics: {
    height?: string;
    notes: string[];
  };
  relationships: string[];
  notable_events: string[];
  phone_numbers: string[];
  dates: Array<{
    text: string;
    parsed: string;
    type: string;
  }>;
  entities: Record<string, string[]>;
  confidence: number;
}

interface ParsedContactInfo {
  name: string;
  nickname?: string;
  notes: string;
  interests: string[];
  relationships?: Array<{
    name: string;
    type: string;
    notes: string;
  }>;
  // Personal identifiers
  age?: string;
  birthday?: string;
  birthYear?: string;
  
  // Professional & Educational
  occupation?: string;
  college?: string;
  major?: string;
  
  // Contact Information
  email?: string;
  phone?: string;
  
  // Location
  currentLocation?: string;
  hometown?: string;
  
  // Physical characteristics
  height?: string;
  
  // Notable events
  notableEvents?: string[];
}

interface EnhancedParserResponse {
  success: boolean;
  data?: EnhancedParserResult;
  error?: string;
}

export class EnhancedParserIntegration {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:5003') {
    this.baseUrl = baseUrl;
  }

  async parseWithEnhancedParser(text: string, ownerId: string): Promise<{
    contacts: ParsedContactInfo[];
    confidence: number;
    processingTime: number;
  }> {
    const startTime = Date.now();
    
    try {
      console.log('🔧 Using enhanced parser service for comprehensive extraction');
      
      const response = await fetch(`${this.baseUrl}/enhanced-parse`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          ownerId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Enhanced parser service error: ${response.status}`);
      }

      const enhancedResult: EnhancedParserResult = await response.json();
      
      // Convert enhanced parser result to ParsedContactInfo format
      const contacts: ParsedContactInfo[] = this.convertToParsedContacts(enhancedResult, text);
      
      const processingTime = Date.now() - startTime;
      
      console.log(`✅ Enhanced parser completed with confidence: ${enhancedResult.confidence}`);
      console.log(`📊 Contacts found: ${contacts.length}`);
      console.log(`⏱️ Processing time: ${processingTime} ms`);
      
      return {
        contacts,
        confidence: enhancedResult.confidence,
        processingTime,
      };
      
    } catch (error) {
      console.error('❌ Enhanced parser service error:', error);
      throw error;
    }
  }

  private convertToParsedContacts(enhancedResult: EnhancedParserResult, originalText: string): ParsedContactInfo[] {
    const contacts: ParsedContactInfo[] = [];
    
    // Process each contact from the enhanced parser
    for (const contact of enhancedResult.contacts) {
      const parsedContact: ParsedContactInfo = {
        name: contact.full_name,
        nickname: contact.nickname || undefined,
        notes: `Mentioned in memory about ${contact.full_name}.`,
        interests: [],
        relationships: [],
      };

      // Extract specific information for this contact
      this.extractContactSpecificInfo(parsedContact, enhancedResult, contact.full_name);
      
      // Add physical characteristics to notes
      if (enhancedResult.physical_characteristics.notes.length > 0) {
        parsedContact.notes += ` Physical characteristics: ${enhancedResult.physical_characteristics.notes.join(', ')}.`;
      }

      // Add height if available
      if (enhancedResult.physical_characteristics.height) {
        parsedContact.height = enhancedResult.physical_characteristics.height;
      }

      // Add notable events
      if (enhancedResult.notable_events.length > 0) {
        parsedContact.notableEvents = enhancedResult.notable_events;
      }

      contacts.push(parsedContact);
    }

    // If no contacts found, create a default contact
    if (contacts.length === 0) {
      contacts.push({
        name: 'Unknown Contact',
        notes: `Mentioned in memory: ${originalText.substring(0, 100)}...`,
        interests: [],
      });
    }

    return contacts;
  }

  private extractContactSpecificInfo(
    contact: ParsedContactInfo, 
    enhancedResult: EnhancedParserResult, 
    contactName: string
  ) {
    // Extract age
    const ageInfo = enhancedResult.extracted_info.age;
    if (ageInfo && ageInfo.length > 0) {
      const ageMatch = ageInfo[0].match(/(\d+)/);
      if (ageMatch) {
        contact.age = ageMatch[1];
      }
    }

    // Extract birthday
    const birthdayDates = enhancedResult.dates.filter(date => date.type === 'birthday');
    if (birthdayDates.length > 0) {
      contact.birthday = birthdayDates[0].text;
      // Try to extract birth year
      const yearMatch = birthdayDates[0].parsed.match(/(\d{4})/);
      if (yearMatch) {
        contact.birthYear = yearMatch[1];
      }
    }

    // Extract occupation
    const occupationInfo = enhancedResult.extracted_info.occupation;
    if (occupationInfo && occupationInfo.length > 0) {
      contact.occupation = occupationInfo[0];
    }

    // Extract college
    const collegeInfo = enhancedResult.extracted_info.college;
    if (collegeInfo && collegeInfo.length > 0) {
      contact.college = collegeInfo[0];
    }

    // Extract major
    const majorInfo = enhancedResult.extracted_info.major;
    if (majorInfo && majorInfo.length > 0) {
      contact.major = majorInfo[0];
    }

    // Extract location
    const locationInfo = enhancedResult.extracted_info.location;
    if (locationInfo && locationInfo.length > 0) {
      contact.currentLocation = locationInfo[0];
    }

    // Extract hometown
    const hometownInfo = enhancedResult.extracted_info.hometown;
    if (hometownInfo && hometownInfo.length > 0) {
      contact.hometown = hometownInfo[0];
    }

    // Extract interests
    const interestsInfo = enhancedResult.extracted_info.interests;
    if (interestsInfo && interestsInfo.length > 0) {
      contact.interests = interestsInfo;
    }

    // Extract phone numbers
    if (enhancedResult.phone_numbers.length > 0) {
      contact.phone = enhancedResult.phone_numbers[0];
    }

    // Extract relationships
    const relationshipsInfo = enhancedResult.extracted_info.relationships;
    if (relationshipsInfo && relationshipsInfo.length > 0) {
      for (const relationship of relationshipsInfo) {
        // Parse relationship type and related person
        const relationshipMatch = relationship.match(/(\w+)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/);
        if (relationshipMatch) {
          const relationshipType = relationshipMatch[1];
          const relatedPerson = relationshipMatch[2];
          
          contact.relationships?.push({
            name: relatedPerson,
            type: this.mapRelationshipType(relationshipType),
            notes: `${relationshipType} of ${contact.name}`
          });
        }
      }
    }
  }

  private mapRelationshipType(relationshipType: string): string {
    const typeMapping: Record<string, string> = {
      'girlfriend': 'Partner',
      'boyfriend': 'Partner',
      'wife': 'Partner',
      'husband': 'Partner',
      'spouse': 'Partner',
      'partner': 'Partner',
      'brother': 'Family',
      'sister': 'Family',
      'mom': 'Family',
      'mother': 'Family',
      'dad': 'Family',
      'father': 'Family',
      'parent': 'Family',
      'friend': 'Friend',
      'colleague': 'Colleague',
      'roommate': 'Roommate',
      'classmate': 'Classmate',
    };

    return typeMapping[relationshipType.toLowerCase()] || 'Other';
  }

  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      if (response.ok) {
        const health = await response.json();
        console.log('🔍 Enhanced parser service health:', health);
        return health.status === 'healthy';
      }
      return false;
    } catch (error) {
      console.error('❌ Enhanced parser service health check failed:', error);
      return false;
    }
  }
}

export default EnhancedParserIntegration; 
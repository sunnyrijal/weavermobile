// flairParser.ts
// Enhanced contact parsing using Flair NLP

import { Sentence, Classifier } from 'flair';

export interface ParsedContactInfo {
  names: string[];
  relationships: Array<{
    person: string;
    relation: string;
    relatedPerson?: string;
  }>;
  locations: string[];
  organizations: string[];
  dates: string[];
  phoneNumbers: string[];
  emails: string[];
  notes: string[];
}

export interface FlairParseResult {
  contactInfo: ParsedContactInfo;
  confidence: number;
}

/**
 * Enhanced contact parsing using Flair NLP
 * Combines NER, dependency parsing, and custom entity extraction
 */
export async function parseContactWithFlair(text: string): Promise<FlairParseResult> {
  try {
    // Create sentence object
    const sentence = new Sentence(text);
    
    // Load NER tagger for person names, locations, organizations
    const nerTagger = await Classifier.load('ner');
    await nerTagger.predict(sentence);
    
    // Extract entities by type
    const names: string[] = [];
    const locations: string[] = [];
    const organizations: string[] = [];
    const dates: string[] = [];
    
    // Extract entities from NER results
    sentence.getSpans('ner').forEach(span => {
      const entity = span.text;
      const tag = span.tag;
      
      switch (tag) {
        case 'PERSON':
          names.push(entity);
          break;
        case 'LOC':
          locations.push(entity);
          break;
        case 'ORG':
          organizations.push(entity);
          break;
        case 'DATE':
          dates.push(entity);
          break;
      }
    });
    
    // Extract relationships using dependency parsing patterns
    const relationships = extractRelationships(text, names);
    
    // Extract contact information using regex patterns
    const phoneNumbers = extractPhoneNumbers(text);
    const emails = extractEmails(text);
    
    // Generate notes based on context
    const notes = generateNotes(text, names, relationships);
    
    const contactInfo: ParsedContactInfo = {
      names,
      relationships,
      locations,
      organizations,
      dates,
      phoneNumbers,
      emails,
      notes
    };
    
    return {
      contactInfo,
      confidence: calculateConfidence(contactInfo)
    };
    
  } catch (error) {
    console.error('Flair parsing error:', error);
    return {
      contactInfo: {
        names: [],
        relationships: [],
        locations: [],
        organizations: [],
        dates: [],
        phoneNumbers: [],
        emails: [],
        notes: []
      },
      confidence: 0
    };
  }
}

/**
 * Extract relationships between people using pattern matching
 */
function extractRelationships(text: string, names: string[]): Array<{
  person: string;
  relation: string;
  relatedPerson?: string;
}> {
  const relationships: Array<{
    person: string;
    relation: string;
    relatedPerson?: string;
  }> = [];
  
  const relationshipPatterns = [
    // Family relationships
    { pattern: /(\w+)\s+(?:is\s+)?(?:my\s+)?(mom|mother|dad|father|brother|sister|son|daughter)/gi, relation: 'family' },
    { pattern: /(\w+)\s+(?:is\s+)?(?:my\s+)?(girlfriend|boyfriend|partner|spouse|wife|husband)/gi, relation: 'romantic' },
    { pattern: /(\w+)\s+(?:is\s+)?(?:my\s+)?(roommate|friend|colleague|co-worker)/gi, relation: 'associate' },
    
    // Possessive patterns
    { pattern: /(\w+)\s+(?:'s\s+)?(mom|mother|dad|father|brother|sister)/gi, relation: 'family' },
    { pattern: /(\w+)\s+(?:'s\s+)?(girlfriend|boyfriend|partner)/gi, relation: 'romantic' },
  ];
  
  relationshipPatterns.forEach(({ pattern, relation }) => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const person = match[1];
      const relationType = match[2];
      
      if (names.includes(person)) {
        relationships.push({
          person,
          relation: `${relationType} (${relation})`,
          relatedPerson: undefined
        });
      }
    }
  });
  
  return relationships;
}

/**
 * Extract phone numbers using regex
 */
function extractPhoneNumbers(text: string): string[] {
  const phonePattern = /(\+?1?[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g;
  const matches = text.match(phonePattern) || [];
  return matches;
}

/**
 * Extract email addresses using regex
 */
function extractEmails(text: string): string[] {
  const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const matches = text.match(emailPattern) || [];
  return matches;
}

/**
 * Generate contextual notes based on extracted information
 */
function generateNotes(text: string, names: string[], relationships: Array<{person: string, relation: string}>): string[] {
  const notes: string[] = [];
  
  // Check for roommate context
  if (text.toLowerCase().includes('roommate')) {
    const roommateName = names.find(name => 
      text.toLowerCase().includes(name.toLowerCase())
    );
    if (roommateName) {
      notes.push(`${roommateName} is my roommate`);
    }
  }
  
  // Check for college/university context
  if (text.toLowerCase().includes('college') || text.toLowerCase().includes('university')) {
    notes.push('Met through college/university');
  }
  
  // Check for work context
  if (text.toLowerCase().includes('work') || text.toLowerCase().includes('job') || text.toLowerCase().includes('colleague')) {
    notes.push('Met through work');
  }
  
  return notes;
}

/**
 * Calculate confidence score based on extracted information
 */
function calculateConfidence(contactInfo: ParsedContactInfo): number {
  let score = 0;
  
  // Base score for having names
  if (contactInfo.names.length > 0) score += 0.3;
  
  // Additional score for relationships
  if (contactInfo.relationships.length > 0) score += 0.2;
  
  // Score for contact information
  if (contactInfo.phoneNumbers.length > 0) score += 0.2;
  if (contactInfo.emails.length > 0) score += 0.1;
  
  // Score for locations/organizations
  if (contactInfo.locations.length > 0) score += 0.1;
  if (contactInfo.organizations.length > 0) score += 0.1;
  
  return Math.min(score, 1.0);
}

/**
 * Format parsed contact info for display
 */
export function formatContactInfo(parseResult: FlairParseResult): string {
  const { contactInfo } = parseResult;
  let formatted = '';
  
  // Names
  if (contactInfo.names.length > 0) {
    formatted += contactInfo.names.join(', ') + '\n\n';
  }
  
  // Relationships
  if (contactInfo.relationships.length > 0) {
    formatted += 'Relationships:\n';
    contactInfo.relationships.forEach(rel => {
      formatted += `- ${rel.person}: ${rel.relation}\n`;
    });
    formatted += '\n';
  }
  
  // Contact info
  if (contactInfo.phoneNumbers.length > 0) {
    formatted += `Phone: ${contactInfo.phoneNumbers.join(', ')}\n`;
  }
  if (contactInfo.emails.length > 0) {
    formatted += `Email: ${contactInfo.emails.join(', ')}\n`;
  }
  
  // Locations
  if (contactInfo.locations.length > 0) {
    formatted += `Location: ${contactInfo.locations.join(', ')}\n`;
  }
  
  // Organizations
  if (contactInfo.organizations.length > 0) {
    formatted += `Organization: ${contactInfo.organizations.join(', ')}\n`;
  }
  
  // Notes
  if (contactInfo.notes.length > 0) {
    formatted += `\nNotes:\n${contactInfo.notes.join('\n')}\n`;
  }
  
  return formatted.trim();
} 
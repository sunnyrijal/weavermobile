// flairParser.ts
// Mocked implementation to resolve compiler errors

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

export async function parseContactWithFlair(text: string): Promise<FlairParseResult> {
  console.log('Flair parser is disabled/mocked');
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

export function formatContactInfo(parseResult: FlairParseResult): string {
  return '';
} 
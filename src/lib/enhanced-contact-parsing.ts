import { nlpPreprocessingService, NLPPreprocessingResult, ContactEntity } from './nlp-preprocessing';
import { parseTextWithGeminiCli, GeminiCliParseResult } from './gemini-cli-integration';

export interface EnhancedContactParsingResult {
  originalText: string;
  preprocessedText: string;
  nlpEntities: ContactEntity[];
  geminiCliResult: GeminiCliParseResult | null;
  mergedContacts: any[];
  confidence: number;
  processingTime: number;
  nlpProcessingTime: number;
  geminiProcessingTime: number;
}

export class EnhancedContactParsingService {
  private static instance: EnhancedContactParsingService;
  private isInitialized: boolean = false;

  private constructor() {}

  public static getInstance(): EnhancedContactParsingService {
    if (!EnhancedContactParsingService.instance) {
      EnhancedContactParsingService.instance = new EnhancedContactParsingService();
    }
    return EnhancedContactParsingService.instance;
  }

  /**
   * Initialize the enhanced contact parsing service
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Initialize NLP preprocessing service
      await nlpPreprocessingService.initialize();
      this.isInitialized = true;
      console.log('✅ Enhanced Contact Parsing Service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Enhanced Contact Parsing Service:', error);
      throw error;
    }
  }

  /**
   * Parse contact information with enhanced NLP preprocessing
   */
  public async parseContactsWithNLP(text: string, ownerId?: string): Promise<EnhancedContactParsingResult> {
    const startTime = Date.now();
    
    try {
      // Step 1: NLP Preprocessing
      const nlpStartTime = Date.now();
      const nlpResult = await nlpPreprocessingService.preprocessText(text);
      const nlpEntities = await nlpPreprocessingService.extractContactEntities(text);
      const nlpProcessingTime = Date.now() - nlpStartTime;

      console.log('🔍 NLP Preprocessing Results:');
      console.log('  - Persons found:', nlpResult.entities.persons);
      console.log('  - Locations found:', nlpResult.entities.locations);
      console.log('  - Organizations found:', nlpResult.entities.organizations);
      console.log('  - Ages found:', nlpResult.entities.ages);
      console.log('  - Majors found:', nlpResult.entities.majors);
      console.log('  - Universities found:', nlpResult.entities.universities);

      // Step 2: Gemini CLI Processing (with preprocessed text)
      const geminiStartTime = Date.now();
      let geminiCliResult: GeminiCliParseResult | null = null;
      let geminiProcessingTime = 0;

      try {
        geminiCliResult = await parseTextWithGeminiCli(nlpResult.cleanedText, undefined, ownerId);
        geminiProcessingTime = Date.now() - geminiStartTime;
        console.log('✅ Gemini CLI processing completed');
        console.log('🔍 Gemini CLI result:', geminiCliResult);
        console.log('🔍 Gemini CLI contacts:', geminiCliResult?.contacts);
      } catch (error) {
        console.log('⚠️ Gemini CLI failed, using NLP results only:', error);
        geminiProcessingTime = Date.now() - geminiStartTime;
      }

      // Step 3: Merge and enhance results
      console.log('🔍 About to merge results:');
      console.log('  - nlpResult:', nlpResult);
      console.log('  - geminiCliResult:', geminiCliResult);
      console.log('  - nlpEntities:', nlpEntities);
      
      const mergedContacts = this.mergeResults(nlpResult, geminiCliResult, nlpEntities);

      const processingTime = Date.now() - startTime;
      const confidence = this.calculateOverallConfidence(nlpResult.confidence, geminiCliResult?.confidence || 0);

      return {
        originalText: text,
        preprocessedText: nlpResult.cleanedText,
        nlpEntities,
        geminiCliResult,
        mergedContacts,
        confidence,
        processingTime,
        nlpProcessingTime,
        geminiProcessingTime
      };

    } catch (error) {
      console.error('❌ Enhanced contact parsing failed:', error);
      throw error;
    }
  }

  /**
   * Merge NLP and Gemini CLI results
   */
  private mergeResults(
    nlpResult: NLPPreprocessingResult, 
    geminiCliResult: GeminiCliParseResult | null,
    nlpEntities: ContactEntity[]
  ): any[] {
    console.log('🔍 mergeResults called with:');
    console.log('  - nlpResult:', nlpResult);
    console.log('  - geminiCliResult:', geminiCliResult);
    console.log('  - nlpEntities:', nlpEntities);
    
    const mergedContacts: any[] = [];

    // Start with Gemini CLI contacts if available
    if (geminiCliResult && geminiCliResult.contacts && geminiCliResult.contacts.length > 0) {
      console.log('🔍 Adding Gemini CLI contacts:', geminiCliResult.contacts);
      mergedContacts.push(...geminiCliResult.contacts);
    }

    // Add contacts from NLP entities that weren't found by Gemini CLI
    const geminiContactNames = new Set(
      (geminiCliResult?.contacts || []).map(c => c.name.toLowerCase())
    );

    // Create contacts from NLP persons that weren't found by Gemini CLI
    nlpResult.entities.persons.forEach(person => {
      if (!geminiContactNames.has(person.toLowerCase())) {
        const contact = this.createContactFromNLPEntity(person, nlpResult);
        if (contact) {
          mergedContacts.push(contact);
        }
      }
    });

    // Enhance existing contacts with NLP information
    mergedContacts.forEach(contact => {
      this.enhanceContactWithNLP(contact, nlpResult);
    });

    return mergedContacts;
  }

  /**
   * Create a contact from NLP entity
   */
  private createContactFromNLPEntity(personName: string, nlpResult: NLPPreprocessingResult): any | null {
    // Find related information for this person
    const age = nlpResult.entities.ages.find(age => 
      nlpResult.cleanedText.includes(`${personName}.*age ${age}`) ||
      nlpResult.cleanedText.includes(`age ${age}.*${personName}`)
    );

    const major = nlpResult.entities.majors.find(major => 
      nlpResult.cleanedText.includes(`${personName}.*${major}`) ||
      nlpResult.cleanedText.includes(`${major}.*${personName}`)
    );

    const university = nlpResult.entities.universities.find(uni => 
      nlpResult.cleanedText.includes(`${personName}.*${uni}`) ||
      nlpResult.cleanedText.includes(`${uni}.*${personName}`)
    );

    const location = nlpResult.entities.locations.find(loc => 
      nlpResult.cleanedText.includes(`${personName}.*${loc}`) ||
      nlpResult.cleanedText.includes(`${loc}.*${personName}`)
    );

    return {
      name: personName,
      age: age || undefined,
      major: major || undefined,
      college: university || undefined,
      hometown: location || undefined,
      currentLocation: location || undefined,
      notes: `Extracted from NLP preprocessing. ${personName} was mentioned in the text.`,
      relationships: [],
      interests: [],
      category: 'Other'
    };
  }

  /**
   * Enhance existing contact with NLP information
   */
  private enhanceContactWithNLP(contact: any, nlpResult: NLPPreprocessingResult): void {
    // Add age if not present
    if (!contact.age && nlpResult.entities.ages.length > 0) {
      contact.age = nlpResult.entities.ages[0];
    }

    // Add major if not present
    if (!contact.major && nlpResult.entities.majors.length > 0) {
      contact.major = nlpResult.entities.majors[0];
    }

    // Add college if not present
    if (!contact.college && nlpResult.entities.universities.length > 0) {
      contact.college = nlpResult.entities.universities[0];
    }

    // Add location if not present
    if (!contact.hometown && nlpResult.entities.locations.length > 0) {
      contact.hometown = nlpResult.entities.locations[0];
    }

    // Add phone numbers if found
    if (nlpResult.entities.phone_numbers.length > 0) {
      contact.phone = nlpResult.entities.phone_numbers[0];
    }

    // Add emails if found
    if (nlpResult.entities.emails.length > 0) {
      contact.email = nlpResult.entities.emails[0];
    }

    // Enhance notes with NLP findings
    const nlpNotes = [];
    if (nlpResult.entities.ages.length > 0) nlpNotes.push(`Age: ${nlpResult.entities.ages.join(', ')}`);
    if (nlpResult.entities.majors.length > 0) nlpNotes.push(`Major: ${nlpResult.entities.majors.join(', ')}`);
    if (nlpResult.entities.universities.length > 0) nlpNotes.push(`University: ${nlpResult.entities.universities.join(', ')}`);
    if (nlpResult.entities.locations.length > 0) nlpNotes.push(`Location: ${nlpResult.entities.locations.join(', ')}`);

    if (nlpNotes.length > 0) {
      contact.notes = contact.notes ? `${contact.notes} NLP findings: ${nlpNotes.join('; ')}` : `NLP findings: ${nlpNotes.join('; ')}`;
    }
  }

  /**
   * Calculate overall confidence score
   */
  private calculateOverallConfidence(nlpConfidence: number, geminiConfidence: number): number {
    // Weight NLP confidence at 30% and Gemini confidence at 70%
    return (nlpConfidence * 0.3) + (geminiConfidence * 0.7);
  }

  /**
   * Get detailed analysis of the parsing process
   */
  public async getDetailedAnalysis(text: string): Promise<any> {
    const result = await this.parseContactsWithNLP(text);
    
    return {
      summary: {
        totalContacts: result.mergedContacts.length,
        nlpEntitiesFound: result.nlpEntities.length,
        geminiCliSuccess: result.geminiCliResult !== null,
        overallConfidence: result.confidence,
        totalProcessingTime: result.processingTime
      },
      nlpAnalysis: {
        persons: result.nlpEntities.filter(e => e.type === 'PERSON').map(e => e.name),
        locations: result.nlpEntities.filter(e => e.type === 'LOCATION').map(e => e.name),
        organizations: result.nlpEntities.filter(e => e.type === 'ORGANIZATION').map(e => e.name),
        processingTime: result.nlpProcessingTime
      },
      geminiCliAnalysis: result.geminiCliResult ? {
        contactsFound: result.geminiCliResult.contacts.length,
        confidence: result.geminiCliResult.confidence,
        processingTime: result.geminiProcessingTime
      } : null,
      mergedContacts: result.mergedContacts
    };
  }
}

// Export singleton instance
export const enhancedContactParsingService = EnhancedContactParsingService.getInstance(); 
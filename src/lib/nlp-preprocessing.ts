import { spawn } from 'child_process';
import { promisify } from 'util';
import { exec } from 'child_process';

const execAsync = promisify(exec);

export interface NLPPreprocessingResult {
  cleanedText: string;
  entities: {
    persons: string[];
    locations: string[];
    organizations: string[];
    dates: string[];
    numbers: string[];
    phone_numbers: string[];
    emails: string[];
    ages: string[];
    majors: string[];
    universities: string[];
  };
  confidence: number;
  processingTime: number;
}

export interface ContactEntity {
  name: string;
  type: 'PERSON' | 'LOCATION' | 'ORGANIZATION' | 'DATE' | 'NUMBER';
  confidence: number;
  start: number;
  end: number;
}

export class NLPPreprocessingService {
  private static instance: NLPPreprocessingService;
  private isInitialized: boolean = false;

  private constructor() {}

  public static getInstance(): NLPPreprocessingService {
    if (!NLPPreprocessingService.instance) {
      NLPPreprocessingService.instance = new NLPPreprocessingService();
    }
    return NLPPreprocessingService.instance;
  }

  /**
   * Initialize the NLP preprocessing service
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Check if Python and required packages are available
      await this.checkPythonEnvironment();
      this.isInitialized = true;
      console.log('✅ NLP Preprocessing Service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize NLP Preprocessing Service:', error);
      throw error;
    }
  }

  /**
   * Check if Python environment is properly set up
   */
  private async checkPythonEnvironment(): Promise<void> {
    try {
      // Test if spaCy is available
      const { stdout } = await execAsync('python -c "import spacy; print(\'spaCy available\')"');
      console.log('✅ spaCy is available:', stdout.trim());
    } catch (error) {
      throw new Error('spaCy not available. Please install: pip install spacy && python -m spacy download en_core_web_sm');
    }
  }

  /**
   * Preprocess text using NLP techniques
   */
  public async preprocessText(text: string): Promise<NLPPreprocessingResult> {
    const startTime = Date.now();

    try {
      // Call Python script for NLP processing
      const result = await this.runNLPProcessing(text);
      
      const processingTime = Date.now() - startTime;
      
      return {
        cleanedText: result.cleaned_text,
        entities: {
          persons: result.entities.persons || [],
          locations: result.entities.locations || [],
          organizations: result.entities.organizations || [],
          dates: result.entities.dates || [],
          numbers: result.entities.numbers || [],
          phone_numbers: result.entities.phone_numbers || [],
          emails: result.entities.emails || [],
          ages: result.entities.ages || [],
          majors: result.entities.majors || [],
          universities: result.entities.universities || []
        },
        confidence: result.confidence || 0.8,
        processingTime
      };
    } catch (error) {
      console.error('❌ NLP preprocessing failed:', error);
      // Return fallback result
      return {
        cleanedText: text,
        entities: {
          persons: [],
          locations: [],
          organizations: [],
          dates: [],
          numbers: [],
          phone_numbers: [],
          emails: [],
          ages: [],
          majors: [],
          universities: []
        },
        confidence: 0.0,
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * Run NLP processing using Python script
   */
  private async runNLPProcessing(text: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const pythonProcess = spawn('python', [
        'src/scripts/nlp_preprocessing.py',
        '--text', text
      ]);

      let output = '';
      let errorOutput = '';

      pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(output);
            resolve(result);
          } catch (error) {
            reject(new Error(`Failed to parse Python output: ${error}`));
          }
        } else {
          reject(new Error(`Python process failed with code ${code}: ${errorOutput}`));
        }
      });

      pythonProcess.on('error', (error) => {
        reject(new Error(`Failed to start Python process: ${error}`));
      });
    });
  }

  /**
   * Extract contact-specific entities from text
   */
  public async extractContactEntities(text: string): Promise<ContactEntity[]> {
    const preprocessingResult = await this.preprocessText(text);
    const entities: ContactEntity[] = [];

    // Convert persons to contact entities
    preprocessingResult.entities.persons.forEach((person, index) => {
      entities.push({
        name: person,
        type: 'PERSON',
        confidence: preprocessingResult.confidence,
        start: text.indexOf(person),
        end: text.indexOf(person) + person.length
      });
    });

    // Convert locations to contact entities
    preprocessingResult.entities.locations.forEach((location, index) => {
      entities.push({
        name: location,
        type: 'LOCATION',
        confidence: preprocessingResult.confidence,
        start: text.indexOf(location),
        end: text.indexOf(location) + location.length
      });
    });

    // Convert organizations to contact entities
    preprocessingResult.entities.organizations.forEach((org, index) => {
      entities.push({
        name: org,
        type: 'ORGANIZATION',
        confidence: preprocessingResult.confidence,
        start: text.indexOf(org),
        end: text.indexOf(org) + org.length
      });
    });

    return entities;
  }

  /**
   * Clean and normalize text for better parsing
   */
  public async cleanText(text: string): Promise<string> {
    const preprocessingResult = await this.preprocessText(text);
    return preprocessingResult.cleanedText;
  }

  /**
   * Get confidence score for text preprocessing
   */
  public async getConfidence(text: string): Promise<number> {
    const preprocessingResult = await this.preprocessText(text);
    return preprocessingResult.confidence;
  }
}

// Export singleton instance
export const nlpPreprocessingService = NLPPreprocessingService.getInstance(); 
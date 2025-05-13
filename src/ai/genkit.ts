import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import { config } from 'dotenv';

// Call config() at the top to load environment variables from .env
// This is crucial for ensuring GOOGLE_API_KEY is available when googleAI() is initialized,
// especially when this module is imported by Next.js server actions.
config();

export const ai = genkit({
  plugins: [
    googleAI(), // The googleAI plugin will look for GOOGLE_API_KEY in process.env
  ],
  model: 'googleai/gemini-2.0-flash', // Default model for text generation
});

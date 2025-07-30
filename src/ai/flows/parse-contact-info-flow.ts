'use server';
/**
 * @fileOverview A Genkit flow to parse contact information from a voice transcript.
 *
 * - parseContactInfo - A function that takes a voice transcript and returns parsed contact details.
 * - ParseContactInfoInput - The input type for the parseContactInfo function.
 * - ParseContactInfoOutput - The return type for the parseContactInfo function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const ParseContactInfoInputSchema = z.object({
  transcript: z.string().describe('The voice transcript containing contact information.'),
});
export type ParseContactInfoInput = z.infer<typeof ParseContactInfoInputSchema>;

const ParseContactInfoOutputSchema = z.object({
  name: z.string().optional().describe("The contact's full name."),
  email: z.string().optional().describe("The contact's email address."),
  phone: z.string().optional().describe("The contact's phone number."),
  occupation: z.string().optional().describe("The contact's occupation."),
  company: z.string().optional().describe("The contact's company."),
  college: z.string().optional().describe("The contact's college or university."),
  category: z.string().optional().describe("The contact's category. Choose from: Family, Friend, Colleague, Professional, Partner, Other, Pet."),
  hometown: z.string().optional().describe("The contact's city of origin or hometown (e.g., where they grew up)."),
  currentLocation: z.string().optional().describe("The contact's current city and state, or general current location."),
  birthday: z.string().optional().describe("The contact's birthday in YYYY-MM-DD format. If the year is not mentioned, try to infer a reasonable one or leave it out."),
  tags: z.array(z.string()).optional().describe("A list of relevant tags based on the transcript (e.g., interests, skills, affiliations)."),
});
export type ParseContactInfoOutput = z.infer<typeof ParseContactInfoOutputSchema>;

export async function parseContactInfo(input: ParseContactInfoInput): Promise<ParseContactInfoOutput> {
  return parseContactInfoFlow(input);
}

const parseContactInfoPrompt = ai.definePrompt({
  name: 'parseContactInfoPrompt',
  input: {schema: ParseContactInfoInputSchema},
  output: {schema: ParseContactInfoOutputSchema},
  prompt: `You are an intelligent assistant designed to parse contact information from a raw voice transcript.
Extract the following details for a new contact. If a piece of information is not present in the transcript, omit the field or leave it as an empty string/array where appropriate.

Transcript:
"{{{transcript}}}"

Parse the information according to the following schema:
- name: The full name of the contact.
- email: The email address.
- phone: The phone number.
- occupation: The job title or profession.
- company: The company or organization they work for.
- college: The college or university they attended or are attending.
- category: The relationship category. If mentioned, try to map it to one of: "Family", "Friend", "Colleague", "Professional", "Partner", "Pet", "Other". If not clear, use "Other" or omit.
- hometown: The city/place where the contact is originally from or grew up, if mentioned distinctly from current location.
- currentLocation: The current city, state, or general location where the contact lives.
- birthday: The birthday in YYYY-MM-DD format. If the year is not mentioned, try to infer a reasonable one or leave it out.
- tags: A list of relevant keywords or tags that describe the contact based on the transcript (e.g., interests, skills, shared activities, projects, specific locations mentioned if not primary location).

Example Transcript 1: "Add John Doe, he's a software engineer at Google, email john.doe@example.com, phone is 555-1234. He went to Stanford. We know him from the hiking group, birthday is April 10th 1985. He's originally from Boston but now lives in San Francisco."
Expected Output (example 1):
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "phone": "555-1234",
  "occupation": "software engineer",
  "company": "Google",
  "college": "Stanford",
  "category": "Friend",
  "hometown": "Boston",
  "currentLocation": "San Francisco",
  "birthday": "1985-04-10",
  "tags": ["hiking group", "software engineer", "Stanford alumni"]
}

Example Transcript 2: "New contact: Jane Smith. She works at Microsoft. Lives in Seattle. Birthday is June 5th."
Expected Output (example 2):
{
  "name": "Jane Smith",
  "company": "Microsoft",
  "currentLocation": "Seattle",
  "birthday": "1990-06-05", // Assuming a default year if not specified
  "tags": ["Microsoft"]
}


Provide the output as a JSON object matching the defined output schema.
`,
});

const parseContactInfoFlow = ai.defineFlow(
  {
    name: 'parseContactInfoFlow',
    inputSchema: ParseContactInfoInputSchema,
    outputSchema: ParseContactInfoOutputSchema,
  },
  async (input) => {
    const {output} = await parseContactInfoPrompt(input);
    if (!output) {
        throw new Error("AI failed to parse contact information.");
    }
    return output;
  }
);

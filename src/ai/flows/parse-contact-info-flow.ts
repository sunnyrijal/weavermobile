
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
  email: z.string().email().optional().describe("The contact's email address."),
  phone: z.string().optional().describe("The contact's phone number."),
  occupation: z.string().optional().describe("The contact's occupation."),
  company: z.string().optional().describe("The contact's company."),
  college: z.string().optional().describe("The contact's college or university."),
  category: z.enum(["Family", "Friend", "Colleague", "Professional", "Partner", "Other", ""]).optional().describe("The contact's category. Choose from the provided list if a suitable one is mentioned, otherwise leave blank or use 'Other'."),
  locationDetails: z.string().optional().describe("Details about the contact's location (e.g., city, state)."),
  birthday: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe("The contact's birthday in YYYY-MM-DD format. If the year is not mentioned, try to infer a reasonable one or leave it out."),
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
- category: The relationship category. If mentioned, try to map it to one of: "Family", "Friend", "Colleague", "Professional", "Partner", "Other". If not clear, use "Other" or omit.
- locationDetails: Any details about their location (city, state, country).
- birthday: The birthday in YYYY-MM-DD format. If the year is unclear, you can try to infer a plausible one or omit the year if only month/day is mentioned, but try to adhere to YYYY-MM-DD. If only month and day are mentioned, you could for example use the current year or a common year like 1990, but state this assumption if made. For example, if "birthday is March 15th", output something like "1990-03-15".
- tags: A list of relevant keywords or tags that describe the contact based on the transcript (e.g., interests, skills, shared activities, projects, specific locations mentioned if not primary location).

Example Transcript: "Add John Doe, he's a software engineer at Google, email john.doe@example.com, phone is 555-1234. He went to Stanford. We know him from the hiking group, birthday is April 10th 1985. He lives in San Francisco."
Expected Output (example):
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "phone": "555-1234",
  "occupation": "software engineer",
  "company": "Google",
  "college": "Stanford",
  "category": "Friend", // (inferred or could be 'Other' if not specified)
  "locationDetails": "San Francisco",
  "birthday": "1985-04-10",
  "tags": ["hiking group", "software engineer", "Stanford alumni"]
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

    
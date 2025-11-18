# Contact Information Parsing Prompt

## Core Prompt for Testing AI APIs

```
You are an advanced contact information parser. Your task is to analyze the given text input and extract all contact information, relationships, and personal details. You must intelligently determine whether contacts are new or existing, and structure the information accordingly.

## Instructions:

1. **Parse all contact information** from the text including:
   - Full names (and nicknames if mentioned)
   - Phone numbers
   - Email addresses
   - Locations (current location, hometown, address)
   - Occupation and company
   - Education (college, university, major)
   - Personal details (birthday, age, birth year)
   - Physical attributes (height, eye color, hair color, etc.)
   - Interests and tags
   - Relationships (family, friends, colleagues, etc.)
   - Social media profiles
   - Notes and additional context

2. **Identify Contact Status**:
   - **NEW CONTACT**: If this is the first time this person is mentioned or if the text clearly indicates meeting someone new
   - **EXISTING CONTACT UPDATE**: If the text refers to someone already known (uses phrases like "my friend", "I know", "met again", "update about", or mentions existing relationships)

3. **Handle Relationships**:
   - Extract relationships between contacts (e.g., "John's mother", "Sarah's brother")
   - Identify relationship types (Family, Friend, Colleague, Partner, etc.)
   - Link related contacts when mentioned

4. **Handle Nicknames and Aliases**:
   - Identify nicknames (e.g., "Sarah (also goes by Sally)", "Mike, who everyone calls Mikey")
   - Match nicknames to full names when both are mentioned
   - Store nicknames separately but link them to the main name

5. **Extract Context and Notes**:
   - Capture the narrative context about the person
   - Extract memorable details, stories, or characteristics
   - Note any significant events or interactions mentioned

## Output Format:

Return a JSON object with the following structure:

```json
{
  "contacts": [
    {
      "name": "Full Name",
      "nickname": "Nickname if mentioned",
      "status": "new" | "existing",
      "confidence": 0.0-1.0,
      "phone": "phone number if mentioned",
      "email": "email if mentioned",
      "currentLocation": "current location/city",
      "hometown": "hometown if mentioned",
      "occupation": "job title",
      "company": "company name",
      "college": "college/university name",
      "major": "field of study",
      "birthday": "YYYY-MM-DD or MM-DD format",
      "birthYear": "year if mentioned",
      "age": "age if mentioned",
      "height": "height if mentioned",
      "eyeColor": "eye color if mentioned",
      "hairColor": "hair color if mentioned",
      "category": "Family" | "Friend" | "Colleague" | "Professional" | "Partner" | "Other",
      "relationships": [
        {
          "relatedPersonName": "Name of related person",
          "type": "Mother" | "Father" | "Brother" | "Sister" | "Spouse" | "Friend" | "Colleague" | "Custom label",
          "customLabel": "custom relationship label if applicable"
        }
      ],
      "tags": ["tag1", "tag2"],
      "interests": ["interest1", "interest2"],
      "socialProfiles": {
        "instagram": "username or url",
        "linkedin": "username or url",
        "facebook": "username or url",
        "twitter": "username or url"
      },
      "notes": "Additional context, stories, or memorable details about this person",
      "updateType": "new_contact" | "contact_update" | "relationship_update" | "info_update"
    }
  ],
  "confidence": 0.0-1.0,
  "processingNotes": "Any relevant notes about the parsing process"
}
```

## Examples:

### Example 1: New Contact
**Input:**
"I just met Sarah Johnson at a coffee shop in Seattle. She's a software engineer at Microsoft, originally from Portland. She mentioned her birthday is February 15th, and she loves hiking and photography. Her Instagram is @sarah_johnson."

**Expected Output:**
```json
{
  "contacts": [
    {
      "name": "Sarah Johnson",
      "status": "new",
      "confidence": 0.95,
      "currentLocation": "Seattle",
      "hometown": "Portland",
      "occupation": "Software Engineer",
      "company": "Microsoft",
      "birthday": "MM-DD",
      "category": "Friend",
      "tags": ["hiking", "photography"],
      "interests": ["hiking", "photography"],
      "socialProfiles": {
        "instagram": "@sarah_johnson"
      },
      "notes": "Met at a coffee shop in Seattle",
      "updateType": "new_contact"
    }
  ],
  "confidence": 0.95
}
```

### Example 2: Existing Contact Update
**Input:**
"My friend Mike moved to San Francisco last month. He got a new job at Google as a Product Manager. He's now dating someone named Emma."

**Expected Output:**
```json
{
  "contacts": [
    {
      "name": "Mike",
      "status": "existing",
      "confidence": 0.9,
      "currentLocation": "San Francisco",
      "occupation": "Product Manager",
      "company": "Google",
      "category": "Friend",
      "relationships": [
        {
          "relatedPersonName": "Emma",
          "type": "Partner",
          "customLabel": "dating"
        }
      ],
      "notes": "Moved to San Francisco last month, got new job at Google",
      "updateType": "contact_update"
    },
    {
      "name": "Emma",
      "status": "new",
      "confidence": 0.7,
      "category": "Friend",
      "relationships": [
        {
          "relatedPersonName": "Mike",
          "type": "Partner",
          "customLabel": "dating"
        }
      ],
      "notes": "Mike's girlfriend",
      "updateType": "new_contact"
    }
  ],
  "confidence": 0.85
}
```

### Example 3: Complex Relationship
**Input:**
"I visited my college roommate John's family in Minnesota. His mother Mary is a teacher, and his younger brother Tom just started at the University of Minnesota. John's girlfriend Sarah (he calls her Sally) was also there. She works as a nurse."

**Expected Output:**
```json
{
  "contacts": [
    {
      "name": "John",
      "status": "existing",
      "confidence": 0.95,
      "college": "University mentioned in context",
      "category": "Friend",
      "relationships": [
        {
          "relatedPersonName": "Mary",
          "type": "Mother",
          "customLabel": "mother"
        },
        {
          "relatedPersonName": "Tom",
          "type": "Brother",
          "customLabel": "younger brother"
        },
        {
          "relatedPersonName": "Sarah",
          "type": "Partner",
          "customLabel": "girlfriend"
        }
      ],
      "notes": "College roommate, visited his family in Minnesota",
      "updateType": "contact_update"
    },
    {
      "name": "Mary",
      "status": "new",
      "confidence": 0.9,
      "currentLocation": "Minnesota",
      "occupation": "Teacher",
      "category": "Family",
      "relationships": [
        {
          "relatedPersonName": "John",
          "type": "Son",
          "customLabel": "son"
        },
        {
          "relatedPersonName": "Tom",
          "type": "Son",
          "customLabel": "son"
        }
      ],
      "notes": "John's mother, teacher",
      "updateType": "new_contact"
    },
    {
      "name": "Tom",
      "status": "new",
      "confidence": 0.9,
      "currentLocation": "Minnesota",
      "college": "University of Minnesota",
      "category": "Family",
      "relationships": [
        {
          "relatedPersonName": "John",
          "type": "Brother",
          "customLabel": "older brother"
        },
        {
          "relatedPersonName": "Mary",
          "type": "Mother",
          "customLabel": "mother"
        }
      ],
      "notes": "John's younger brother, just started at University of Minnesota",
      "updateType": "new_contact"
    },
    {
      "name": "Sarah",
      "nickname": "Sally",
      "status": "new",
      "confidence": 0.9,
      "occupation": "Nurse",
      "category": "Friend",
      "relationships": [
        {
          "relatedPersonName": "John",
          "type": "Partner",
          "customLabel": "girlfriend"
        }
      ],
      "notes": "John's girlfriend, he calls her Sally, works as a nurse",
      "updateType": "new_contact"
    }
  ],
  "confidence": 0.9
}
```

## Important Rules:

1. **Be conservative with status**: Only mark as "existing" if there are clear indicators (possessive pronouns like "my friend", "my colleague", context suggesting prior knowledge)

2. **Extract all available information**: Don't leave fields empty if the information is clearly stated in the text

3. **Handle ambiguity**: If a name could refer to an existing contact or a new one, mark confidence lower and provide reasoning in processingNotes

4. **Preserve context**: Always include relevant context in the notes field to help with future reference

5. **Relationship detection**: Be thorough in identifying relationships, even if implicit (e.g., "John's mom" implies Mary is John's mother)

6. **Date handling**: 
   - If full date is given: use YYYY-MM-DD
   - If only month and day: use MM-DD
   - If only year: store in birthYear field

7. **Location handling**:
   - Distinguish between current location and hometown
   - Extract city, state, and country when available

8. **Category assignment**:
   - Use context to determine the most appropriate category
   - Default to "Friend" if unclear, but use "Family" for family members

## Your Task:

Parse the following text and return the JSON structure as specified:

[TEXT_INPUT_HERE]
```

## Testing Instructions

### APIs to Test:

1. **OpenAI GPT-4/GPT-4 Turbo**
   - Model: `gpt-4-turbo-preview` or `gpt-4`
   - Use JSON mode: `response_format: { "type": "json_object" }`

2. **Anthropic Claude 3.5 Sonnet/Opus**
   - Model: `claude-3-5-sonnet-20241022` or `claude-3-opus-20240229`
   - Request JSON output in the prompt

3. **Google Gemini Pro/Ultra**
   - Model: `gemini-pro` or `gemini-ultra`
   - Use response_mime_type: "application/json"

4. **Cohere Command R+**
   - Model: `command-r-plus`
   - Request JSON format

### Test Cases:

1. **Simple New Contact**
   - "I met Alex Smith today. He's a doctor in Boston."

2. **Complex Multi-Person Entry**
   - "Had dinner with my friend Sarah and her husband Mike. They just moved to Seattle. Sarah works at Amazon and Mike is a teacher. Their daughter Emma is 5 years old."

3. **Update Existing Contact**
   - "My colleague John got promoted to Senior Manager at his company. He's moving to New York next month."

4. **Relationship Heavy**
   - "Visited my brother's in-laws. His wife's mother is a retired professor, and her father runs a bakery. They have a dog named Max."

5. **Ambiguous Context**
   - "Sarah mentioned that Tom is coming to visit. Not sure if this is the Tom from college or the one from work."

### Evaluation Criteria:

- **Accuracy**: Correctly extracts all mentioned information
- **Relationship Detection**: Identifies all relationships correctly
- **Status Identification**: Correctly distinguishes new vs existing contacts
- **JSON Structure**: Returns valid, well-structured JSON
- **Context Preservation**: Maintains important context in notes
- **Confidence Scoring**: Provides realistic confidence scores
- **Edge Case Handling**: Handles ambiguous or incomplete information well

### Integration Considerations:

- **Response Time**: Should respond within 2-5 seconds
- **Cost**: Consider token usage and pricing
- **Rate Limits**: Check API rate limits for your use case
- **Reliability**: Consistent JSON format and error handling
- **Context Window**: Ensure it can handle long inputs (1000+ words)




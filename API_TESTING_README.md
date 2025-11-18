# Contact Parsing API Testing Guide

This guide helps you test different AI APIs to find the best one for parsing contact information from text entries.

## Files Overview

1. **`test-contact-parsing-prompt.txt`** - The core prompt template for testing
2. **`test-parsing-apis.py`** - Python test script (recommended)
3. **`test-parsing-apis.js`** - Node.js test script
4. **`CONTACT_PARSING_PROMPT.md`** - Detailed documentation of the prompt

## Quick Start

### 1. Install Dependencies

**For Python:**
```bash
pip install openai anthropic google-generativeai cohere
```

**For Node.js:**
```bash
npm install openai @anthropic-ai/sdk @google/generative-ai cohere-ai
```

### 2. Set API Keys

Create a `.env` file or export environment variables:

```bash
export OPENAI_API_KEY="your-openai-key"
export ANTHROPIC_API_KEY="your-claude-key"
export GEMINI_API_KEY="your-gemini-key"  # or GOOGLE_API_KEY
export COHERE_API_KEY="your-cohere-key"
```

### 3. Run Tests

**Python:**
```bash
python test-parsing-apis.py
```

**Node.js:**
```bash
node test-parsing-apis.js
```

## Testing Individual APIs

### Test OpenAI GPT-4

```python
from test_parsing_apis import test_openai
import os

result = test_openai(os.getenv("OPENAI_API_KEY"), "Your test text here")
print(json.dumps(result, indent=2))
```

### Test Anthropic Claude

```python
from test_parsing_apis import test_claude
import os

result = test_claude(os.getenv("ANTHROPIC_API_KEY"), "Your test text here")
print(json.dumps(result, indent=2))
```

### Test Google Gemini

```python
from test_parsing_apis import test_gemini
import os

result = test_gemini(os.getenv("GEMINI_API_KEY"), "Your test text here")
print(json.dumps(result, indent=2))
```

### Test Cohere

```python
from test_parsing_apis import test_cohere
import os

result = test_cohere(os.getenv("COHERE_API_KEY"), "Your test text here")
print(json.dumps(result, indent=2))
```

## Using the Prompt Directly

You can copy the prompt from `test-contact-parsing-prompt.txt` and test it directly in:

1. **OpenAI Playground**: https://platform.openai.com/playground
2. **Anthropic Console**: https://console.anthropic.com/
3. **Google AI Studio**: https://makersuite.google.com/app/apikey
4. **Cohere Playground**: https://dashboard.cohere.com/playground

Just replace `[TEXT_INPUT_HERE]` with your test text.

## Test Cases

The script includes 5 test cases:

1. **Simple New Contact** - Basic contact information extraction
2. **Complex Multi-Person Entry** - Multiple contacts with relationships
3. **Update Existing Contact** - Information update for existing contact
4. **Relationship Heavy** - Complex family/relationship structures
5. **Nickname and Context** - Handling nicknames and additional context

## Evaluation Criteria

When testing APIs, evaluate:

1. **Accuracy** - Correctly extracts all mentioned information
2. **Relationship Detection** - Identifies relationships between people
3. **Status Identification** - Correctly distinguishes new vs existing contacts
4. **JSON Structure** - Returns valid, well-structured JSON
5. **Context Preservation** - Maintains important context in notes
6. **Confidence Scoring** - Provides realistic confidence scores
7. **Edge Case Handling** - Handles ambiguous or incomplete information

## Expected JSON Output

```json
{
  "contacts": [
    {
      "name": "Full Name",
      "nickname": "Nickname if mentioned",
      "status": "new" | "existing",
      "confidence": 0.0-1.0,
      "phone": "phone if mentioned",
      "email": "email if mentioned",
      "currentLocation": "current city/location",
      "hometown": "hometown if mentioned",
      "occupation": "job title",
      "company": "company name",
      "college": "college/university",
      "major": "field of study",
      "birthday": "YYYY-MM-DD or MM-DD",
      "birthYear": "year if mentioned",
      "age": "age if mentioned",
      "category": "Family" | "Friend" | "Colleague" | "Professional" | "Partner" | "Other",
      "relationships": [
        {
          "relatedPersonName": "Name of related person",
          "type": "Mother" | "Father" | "Brother" | "Sister" | "Spouse" | "Friend" | "Colleague" | "Custom",
          "customLabel": "custom label if applicable"
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
      "notes": "Additional context and memorable details",
      "updateType": "new_contact" | "contact_update" | "relationship_update" | "info_update"
    }
  ],
  "confidence": 0.0-1.0,
  "processingNotes": "Any relevant parsing notes"
}
```

## API Comparison

### OpenAI GPT-4 Turbo
- **Pros**: Excellent JSON mode, high accuracy, good relationship detection
- **Cons**: Higher cost, slower response times
- **Best for**: Complex parsing with high accuracy requirements

### Anthropic Claude 3.5 Sonnet
- **Pros**: Excellent reasoning, good at context understanding, competitive pricing
- **Cons**: Slightly slower than GPT-4
- **Best for**: Complex relationships and contextual understanding

### Google Gemini Pro
- **Pros**: Good performance, competitive pricing, fast responses
- **Cons**: May need more prompt engineering for consistent JSON
- **Best for**: Cost-effective solutions with good performance

### Cohere Command R+
- **Pros**: Good for structured data extraction, competitive pricing
- **Cons**: May need more tuning for complex relationships
- **Best for**: Simple to moderate complexity parsing

## Integration into Your App

Once you've chosen an API, integrate it by:

1. Creating an API route (e.g., `/api/ai/parse-contact`)
2. Using the chosen API SDK
3. Applying the prompt template
4. Parsing and validating the JSON response
5. Handling errors and fallbacks

Example integration:

```typescript
// src/app/api/ai/parse-contact/route.ts
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  const { text } = await req.json();
  
  const prompt = loadPromptTemplate().replace('[TEXT_INPUT_HERE]', text);
  
  const response = await openai.chat.completions.create({
    model: "gpt-4-turbo-preview",
    messages: [
      { role: "system", content: "You are a contact information parser. Return only valid JSON." },
      { role: "user", content: prompt }
    ],
    response_format: { type: "json_object" },
    temperature: 0.3
  });
  
  const data = JSON.parse(response.choices[0].message.content);
  
  return NextResponse.json(data);
}
```

## Next Steps

1. Run the test script with all APIs
2. Review the `test-results.json` file
3. Compare accuracy, cost, and response times
4. Test with your own custom text samples
5. Choose the best API for your use case
6. Integrate into your application

## Troubleshooting

### JSON Parsing Errors
- Some APIs may add explanatory text before/after JSON
- Use the `extract_json()` function to extract JSON from responses
- Consider using JSON mode (OpenAI) or response_mime_type (Gemini)

### Rate Limits
- Implement retry logic with exponential backoff
- Consider caching responses for similar inputs
- Monitor API usage and costs

### Inconsistent Results
- Adjust temperature (lower = more deterministic)
- Provide more examples in the prompt
- Use few-shot learning with examples

## Support

For issues or questions:
1. Check the API documentation
2. Review the prompt template for clarity
3. Test with simpler examples first
4. Verify API keys are correct
5. Check rate limits and quotas




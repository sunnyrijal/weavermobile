/**
 * Test Script for Contact Parsing APIs
 * Tests different AI APIs with the contact parsing prompt
 */

const fs = require('fs');
const path = require('path');

// Load the prompt template
const promptTemplate = fs.readFileSync(path.join(__dirname, 'test-contact-parsing-prompt.txt'), 'utf8');

// Test cases
const testCases = [
  {
    name: "Simple New Contact",
    text: "I just met Alex Smith today. He's a doctor in Boston. His phone number is 555-1234 and email is alex.smith@email.com."
  },
  {
    name: "Complex Multi-Person Entry",
    text: "Had dinner with my friend Sarah and her husband Mike. They just moved to Seattle. Sarah works at Amazon as a Software Engineer and Mike is a teacher at Lincoln High School. Their daughter Emma is 5 years old. Sarah's birthday is March 20th."
  },
  {
    name: "Update Existing Contact",
    text: "My colleague John got promoted to Senior Manager at his company. He's moving to New York next month. He mentioned his new email is john.manager@company.com."
  },
  {
    name: "Relationship Heavy",
    text: "Visited my brother's in-laws. His wife's mother Mary is a retired professor from Harvard, and her father Robert runs a bakery in Portland. They have a dog named Max. Mary's birthday is in December."
  },
  {
    name: "Nickname and Context",
    text: "Met Sarah at the conference - she goes by Sally with friends. She's a product designer at Apple, originally from San Francisco but now lives in Austin. She loves hiking and photography. Her Instagram is @sally_designs."
  }
];

/**
 * Test OpenAI GPT-4
 */
async function testOpenAI(apiKey, testText) {
  const OpenAI = require('openai');
  const openai = new OpenAI({ apiKey });

  const prompt = promptTemplate.replace('[TEXT_INPUT_HERE]', testText);

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        { role: "system", content: "You are a contact information parser. Return only valid JSON." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3
    });

    return {
      success: true,
      data: JSON.parse(response.choices[0].message.content),
      usage: response.usage,
      model: response.model
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Test Anthropic Claude
 */
async function testClaude(apiKey, testText) {
  const Anthropic = require('@anthropic-ai/sdk');
  const anthropic = new Anthropic({ apiKey });

  const prompt = promptTemplate.replace('[TEXT_INPUT_HERE]', testText);

  try {
    const message = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 4096,
      temperature: 0.3,
      messages: [
        { role: "user", content: prompt }
      ]
    });

    const content = message.content[0].text;
    // Extract JSON from response (Claude might add explanations)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : content;

    return {
      success: true,
      data: JSON.parse(jsonStr),
      usage: message.usage,
      model: message.model
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Test Google Gemini
 */
async function testGemini(apiKey, testText) {
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

  const prompt = promptTemplate.replace('[TEXT_INPUT_HERE]', testText);

  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,
        responseMimeType: 'application/json'
      }
    });

    const response = await result.response;
    const text = response.text();
    const data = JSON.parse(text);

    return {
      success: true,
      data: data,
      usage: response.usageMetadata,
      model: 'gemini-pro'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Test Cohere
 */
async function testCohere(apiKey, testText) {
  const cohere = require('cohere-ai');
  cohere.init(apiKey);

  const prompt = promptTemplate.replace('[TEXT_INPUT_HERE]', testText);

  try {
    const response = await cohere.generate({
      model: 'command-r-plus',
      prompt: prompt,
      max_tokens: 2048,
      temperature: 0.3,
      return_likelihoods: 'NONE'
    });

    const content = response.body.generations[0].text;
    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : content;

    return {
      success: true,
      data: JSON.parse(jsonStr),
      usage: response.body.meta,
      model: 'command-r-plus'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Run tests
 */
async function runTests() {
  console.log('🧪 Contact Parsing API Test Suite\n');
  console.log('=' .repeat(60));

  // Load API keys from environment or config
  const config = {
    openai: process.env.OPENAI_API_KEY,
    claude: process.env.ANTHROPIC_API_KEY,
    gemini: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY,
    cohere: process.env.COHERE_API_KEY
  };

  const results = {
    openai: [],
    claude: [],
    gemini: [],
    cohere: []
  };

  // Test each API
  for (const testCase of testCases) {
    console.log(`\n📝 Test Case: ${testCase.name}`);
    console.log(`Text: ${testCase.text.substring(0, 100)}...\n`);

    // Test OpenAI
    if (config.openai) {
      console.log('Testing OpenAI GPT-4...');
      const openaiResult = await testOpenAI(config.openai, testCase.text);
      results.openai.push({
        testCase: testCase.name,
        ...openaiResult
      });
      if (openaiResult.success) {
        console.log(`✅ Success - Contacts: ${openaiResult.data.contacts?.length || 0}, Confidence: ${openaiResult.data.confidence}`);
        console.log(`   Tokens: ${openaiResult.usage?.total_tokens || 'N/A'}`);
      } else {
        console.log(`❌ Error: ${openaiResult.error}`);
      }
    }

    // Test Claude
    if (config.claude) {
      console.log('Testing Anthropic Claude...');
      const claudeResult = await testClaude(config.claude, testCase.text);
      results.claude.push({
        testCase: testCase.name,
        ...claudeResult
      });
      if (claudeResult.success) {
        console.log(`✅ Success - Contacts: ${claudeResult.data.contacts?.length || 0}, Confidence: ${claudeResult.data.confidence}`);
        console.log(`   Tokens: ${claudeResult.usage?.input_tokens + claudeResult.usage?.output_tokens || 'N/A'}`);
      } else {
        console.log(`❌ Error: ${claudeResult.error}`);
      }
    }

    // Test Gemini
    if (config.gemini) {
      console.log('Testing Google Gemini...');
      const geminiResult = await testGemini(config.gemini, testCase.text);
      results.gemini.push({
        testCase: testCase.name,
        ...geminiResult
      });
      if (geminiResult.success) {
        console.log(`✅ Success - Contacts: ${geminiResult.data.contacts?.length || 0}, Confidence: ${geminiResult.data.confidence}`);
        console.log(`   Tokens: ${geminiResult.usage?.totalTokenCount || 'N/A'}`);
      } else {
        console.log(`❌ Error: ${geminiResult.error}`);
      }
    }

    // Test Cohere
    if (config.cohere) {
      console.log('Testing Cohere...');
      const cohereResult = await testCohere(config.cohere, testCase.text);
      results.cohere.push({
        testCase: testCase.name,
        ...cohereResult
      });
      if (cohereResult.success) {
        console.log(`✅ Success - Contacts: ${cohereResult.data.contacts?.length || 0}, Confidence: ${cohereResult.data.confidence}`);
      } else {
        console.log(`❌ Error: ${cohereResult.error}`);
      }
    }

    console.log('\n' + '-'.repeat(60));
  }

  // Generate summary report
  console.log('\n📊 Summary Report\n');
  console.log('=' .repeat(60));

  const apis = ['openai', 'claude', 'gemini', 'cohere'];
  for (const api of apis) {
    if (!config[api]) continue;
    
    const apiResults = results[api];
    const successCount = apiResults.filter(r => r.success).length;
    const totalContacts = apiResults
      .filter(r => r.success)
      .reduce((sum, r) => sum + (r.data?.contacts?.length || 0), 0);
    const avgConfidence = apiResults
      .filter(r => r.success && r.data?.confidence)
      .reduce((sum, r) => sum + r.data.confidence, 0) / successCount;

    console.log(`\n${api.toUpperCase()}:`);
    console.log(`  Success Rate: ${successCount}/${apiResults.length} (${(successCount/apiResults.length*100).toFixed(1)}%)`);
    console.log(`  Total Contacts Found: ${totalContacts}`);
    console.log(`  Average Confidence: ${avgConfidence ? avgConfidence.toFixed(2) : 'N/A'}`);
  }

  // Save detailed results
  fs.writeFileSync(
    path.join(__dirname, 'test-results.json'),
    JSON.stringify(results, null, 2)
  );
  console.log('\n💾 Detailed results saved to test-results.json');
}

// Run if executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testOpenAI, testClaude, testGemini, testCohere, runTests };




#!/usr/bin/env python3
"""
Test Script for Contact Parsing APIs
Tests different AI APIs with the contact parsing prompt
"""

import os
import json
import re
from typing import Dict, List, Any, Optional

# Test cases
TEST_CASES = [
    {
        "name": "Simple New Contact",
        "text": "I just met Alex Smith today. He's a doctor in Boston. His phone number is 555-1234 and email is alex.smith@email.com."
    },
    {
        "name": "Complex Multi-Person Entry",
        "text": "Had dinner with my friend Sarah and her husband Mike. They just moved to Seattle. Sarah works at Amazon as a Software Engineer and Mike is a teacher at Lincoln High School. Their daughter Emma is 5 years old. Sarah's birthday is March 20th."
    },
    {
        "name": "Update Existing Contact",
        "text": "My colleague John got promoted to Senior Manager at his company. He's moving to New York next month. He mentioned his new email is john.manager@company.com."
    },
    {
        "name": "Relationship Heavy",
        "text": "Visited my brother's in-laws. His wife's mother Mary is a retired professor from Harvard, and her father Robert runs a bakery in Portland. They have a dog named Max. Mary's birthday is in December."
    },
    {
        "name": "Nickname and Context",
        "text": "Met Sarah at the conference - she goes by Sally with friends. She's a product designer at Apple, originally from San Francisco but now lives in Austin. She loves hiking and photography. Her Instagram is @sally_designs."
    }
]

def load_prompt_template() -> str:
    """Load the prompt template from file"""
    with open('test-contact-parsing-prompt.txt', 'r') as f:
        return f.read()

def extract_json(text: str) -> Optional[Dict]:
    """Extract JSON from response text"""
    # Try to find JSON object in the text
    json_match = re.search(r'\{[\s\S]*\}', text)
    if json_match:
        try:
            return json.loads(json_match.group(0))
        except json.JSONDecodeError:
            pass
    return None

def test_openai(api_key: str, test_text: str) -> Dict[str, Any]:
    """Test OpenAI GPT-4"""
    try:
        from openai import OpenAI
        client = OpenAI(api_key=api_key)
        
        prompt_template = load_prompt_template()
        prompt = prompt_template.replace('[TEXT_INPUT_HERE]', test_text)
        
        response = client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[
                {"role": "system", "content": "You are a contact information parser. Return only valid JSON."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.3
        )
        
        content = response.choices[0].message.content
        data = json.loads(content)
        
        return {
            "success": True,
            "data": data,
            "usage": {
                "prompt_tokens": response.usage.prompt_tokens,
                "completion_tokens": response.usage.completion_tokens,
                "total_tokens": response.usage.total_tokens
            },
            "model": response.model
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

def test_claude(api_key: str, test_text: str) -> Dict[str, Any]:
    """Test Anthropic Claude"""
    try:
        import anthropic
        client = anthropic.Anthropic(api_key=api_key)
        
        prompt_template = load_prompt_template()
        prompt = prompt_template.replace('[TEXT_INPUT_HERE]', test_text)
        
        message = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=4096,
            temperature=0.3,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )
        
        content = message.content[0].text
        data = extract_json(content)
        
        if not data:
            return {
                "success": False,
                "error": "Could not parse JSON from response"
            }
        
        return {
            "success": True,
            "data": data,
            "usage": {
                "input_tokens": message.usage.input_tokens,
                "output_tokens": message.usage.output_tokens
            },
            "model": message.model
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

def test_gemini(api_key: str, test_text: str) -> Dict[str, Any]:
    """Test Google Gemini"""
    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        
        prompt_template = load_prompt_template()
        prompt = prompt_template.replace('[TEXT_INPUT_HERE]', test_text)
        
        model = genai.GenerativeModel('gemini-pro')
        response = model.generate_content(
            prompt,
            generation_config={
                "temperature": 0.3,
                "response_mime_type": "application/json"
            }
        )
        
        data = json.loads(response.text)
        
        return {
            "success": True,
            "data": data,
            "usage": response.usage_metadata._pb if hasattr(response, 'usage_metadata') else {},
            "model": "gemini-pro"
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

def test_cohere(api_key: str, test_text: str) -> Dict[str, Any]:
    """Test Cohere"""
    try:
        import cohere
        client = cohere.Client(api_key)
        
        prompt_template = load_prompt_template()
        prompt = prompt_template.replace('[TEXT_INPUT_HERE]', test_text)
        
        response = client.generate(
            model='command-r-plus',
            prompt=prompt,
            max_tokens=2048,
            temperature=0.3
        )
        
        content = response.generations[0].text
        data = extract_json(content)
        
        if not data:
            return {
                "success": False,
                "error": "Could not parse JSON from response"
            }
        
        return {
            "success": True,
            "data": data,
            "usage": response.meta,
            "model": "command-r-plus"
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

def run_tests():
    """Run all tests"""
    print("🧪 Contact Parsing API Test Suite\n")
    print("=" * 60)
    
    # Load API keys from environment
    config = {
        "openai": os.getenv("OPENAI_API_KEY"),
        "claude": os.getenv("ANTHROPIC_API_KEY"),
        "gemini": os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY"),
        "cohere": os.getenv("COHERE_API_KEY")
    }
    
    results = {
        "openai": [],
        "claude": [],
        "gemini": [],
        "cohere": []
    }
    
    # Test each API
    for test_case in TEST_CASES:
        print(f"\n📝 Test Case: {test_case['name']}")
        print(f"Text: {test_case['text'][:100]}...\n")
        
        # Test OpenAI
        if config["openai"]:
            print("Testing OpenAI GPT-4...")
            result = test_openai(config["openai"], test_case["text"])
            results["openai"].append({
                "testCase": test_case["name"],
                **result
            })
            if result["success"]:
                contacts_count = len(result["data"].get("contacts", []))
                confidence = result["data"].get("confidence", 0)
                print(f"✅ Success - Contacts: {contacts_count}, Confidence: {confidence}")
                if "usage" in result:
                    print(f"   Tokens: {result['usage'].get('total_tokens', 'N/A')}")
            else:
                print(f"❌ Error: {result['error']}")
        
        # Test Claude
        if config["claude"]:
            print("Testing Anthropic Claude...")
            result = test_claude(config["claude"], test_case["text"])
            results["claude"].append({
                "testCase": test_case["name"],
                **result
            })
            if result["success"]:
                contacts_count = len(result["data"].get("contacts", []))
                confidence = result["data"].get("confidence", 0)
                print(f"✅ Success - Contacts: {contacts_count}, Confidence: {confidence}")
                if "usage" in result:
                    total_tokens = result["usage"].get("input_tokens", 0) + result["usage"].get("output_tokens", 0)
                    print(f"   Tokens: {total_tokens}")
            else:
                print(f"❌ Error: {result['error']}")
        
        # Test Gemini
        if config["gemini"]:
            print("Testing Google Gemini...")
            result = test_gemini(config["gemini"], test_case["text"])
            results["gemini"].append({
                "testCase": test_case["name"],
                **result
            })
            if result["success"]:
                contacts_count = len(result["data"].get("contacts", []))
                confidence = result["data"].get("confidence", 0)
                print(f"✅ Success - Contacts: {contacts_count}, Confidence: {confidence}")
            else:
                print(f"❌ Error: {result['error']}")
        
        # Test Cohere
        if config["cohere"]:
            print("Testing Cohere...")
            result = test_cohere(config["cohere"], test_case["text"])
            results["cohere"].append({
                "testCase": test_case["name"],
                **result
            })
            if result["success"]:
                contacts_count = len(result["data"].get("contacts", []))
                confidence = result["data"].get("confidence", 0)
                print(f"✅ Success - Contacts: {contacts_count}, Confidence: {confidence}")
            else:
                print(f"❌ Error: {result['error']}")
        
        print("\n" + "-" * 60)
    
    # Generate summary report
    print("\n📊 Summary Report\n")
    print("=" * 60)
    
    for api_name in ["openai", "claude", "gemini", "cohere"]:
        if not config[api_name]:
            continue
        
        api_results = results[api_name]
        success_count = sum(1 for r in api_results if r.get("success"))
        total_contacts = sum(
            len(r.get("data", {}).get("contacts", []))
            for r in api_results
            if r.get("success")
        )
        confidences = [
            r.get("data", {}).get("confidence", 0)
            for r in api_results
            if r.get("success") and r.get("data", {}).get("confidence")
        ]
        avg_confidence = sum(confidences) / len(confidences) if confidences else 0
        
        print(f"\n{api_name.upper()}:")
        print(f"  Success Rate: {success_count}/{len(api_results)} ({success_count/len(api_results)*100:.1f}%)")
        print(f"  Total Contacts Found: {total_contacts}")
        print(f"  Average Confidence: {avg_confidence:.2f}" if avg_confidence else "  Average Confidence: N/A")
    
    # Save detailed results
    with open('test-results.json', 'w') as f:
        json.dump(results, f, indent=2)
    print("\n💾 Detailed results saved to test-results.json")

if __name__ == "__main__":
    run_tests()




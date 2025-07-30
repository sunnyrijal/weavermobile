"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles, CheckCircle, AlertCircle } from 'lucide-react';

export function GeminiCliTest() {
  const [text, setText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const testGeminiCli = async () => {
    if (!currentUser?.uid || !text.trim()) {
      toast({ title: "Error", description: "Please enter text to test.", variant: "destructive" });
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch('/api/ai/parse-with-gemini-cli', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text,
          ownerId: currentUser.uid,
          includeRelationships: true
        })
      });

      if (response.ok) {
        const data = await response.json();
        setResult(data);
        toast({ 
          title: "Gemini CLI Test Success!", 
          description: `Processed ${data.contacts.length} contacts with ${data.confidence.toFixed(2)} confidence.`,
          variant: "default"
        });
      } else {
        const error = await response.json();
        toast({ 
          title: "Gemini CLI Test Failed", 
          description: error.error || "Unknown error occurred.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Gemini CLI test error:', error);
      toast({ 
        title: "Gemini CLI Test Error", 
        description: "Failed to test Gemini CLI functionality.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const testMemoryParsing = async () => {
    if (!currentUser?.uid || !text.trim()) {
      toast({ title: "Error", description: "Please enter text to test.", variant: "destructive" });
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch('/api/ai/parse-memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: text,
          ownerId: currentUser.uid,
          inputType: 'text'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setResult(data);
        toast({ 
          title: "Memory Parsing Success!", 
          description: `Processed with ${data.geminiCliUsed ? 'Gemini CLI' : 'fallback processing'}.`,
          variant: "default"
        });
      } else {
        const error = await response.json();
        toast({ 
          title: "Memory Parsing Failed", 
          description: error.error || "Unknown error occurred.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Memory parsing error:', error);
      toast({ 
        title: "Memory Parsing Error", 
        description: "Failed to test memory parsing functionality.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const sampleTexts = [
    "My roommate in freshman year of college was Jadon Kittelson, age 22. Comp Sci major, girlfriend Nickki Plukett, mom: Debbie Kittelson (also Gustavus Alumni), dad (Dave Kittleson), brother (Jimmy kittelson) Home: faribault, Minnesota. Currently goes to Mankato University",
    "John Smith is a software engineer at Google. His email is john.smith@google.com and phone is 555-123-4567. He lives in San Francisco and is originally from Boston. His birthday is March 15, 1990.",
    "Sarah Johnson works as a marketing manager at Apple. She graduated from Stanford University with a degree in Business Administration. She's married to Mike Johnson who works at Tesla. They live in Cupertino, California."
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Gemini CLI Integration Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Test Text</label>
            <Textarea
              placeholder="Enter text to test Gemini CLI parsing..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={6}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {sampleTexts.map((sample, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => setText(sample)}
              >
                Sample {index + 1}
              </Button>
            ))}
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={testGeminiCli} 
              disabled={isProcessing}
              className="flex items-center gap-2"
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Test Gemini CLI
            </Button>
            
            <Button 
              onClick={testMemoryParsing} 
              disabled={isProcessing}
              variant="outline"
              className="flex items-center gap-2"
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              Test Memory Parsing
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant={result.geminiCliUsed ? "default" : "secondary"}>
                {result.geminiCliUsed ? "Gemini CLI Used" : "Fallback Processing"}
              </Badge>
              <Badge variant="outline">
                Confidence: {(result.confidence * 100).toFixed(1)}%
              </Badge>
              <Badge variant="outline">
                Time: {result.processingTime}ms
              </Badge>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Contacts Found ({result.contacts?.length || 0})</h4>
                <div className="space-y-2">
                  {result.contacts?.map((contact: any, index: number) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="font-medium">{contact.name}</div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        {contact.email && <div>Email: {contact.email}</div>}
                        {contact.phone && <div>Phone: {contact.phone}</div>}
                        {contact.occupation && <div>Occupation: {contact.occupation}</div>}
                        {contact.company && <div>Company: {contact.company}</div>}
                        {contact.college && <div>College: {contact.college}</div>}
                        {contact.hometown && <div>Hometown: {contact.hometown}</div>}
                        {contact.currentLocation && <div>Current Location: {contact.currentLocation}</div>}
                        {contact.relationships?.length > 0 && (
                          <div>
                            Relationships: {contact.relationships.map((r: any) => `${r.name} (${r.type})`).join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {result.createdContacts?.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Created Contacts ({result.createdContacts.length})</h4>
                  <div className="space-y-2">
                    {result.createdContacts.map((contact: any, index: number) => (
                      <div key={index} className="p-2 bg-green-50 border border-green-200 rounded">
                        <div className="font-medium text-green-800">{contact.name}</div>
                        <div className="text-sm text-green-600">ID: {contact.id}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.extractedEntities && (
                <div>
                  <h4 className="font-medium mb-2">Extracted Entities</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {result.extractedEntities.people && (
                      <div>
                        <div className="font-medium">People:</div>
                        <div className="text-muted-foreground">{result.extractedEntities.people.join(', ')}</div>
                      </div>
                    )}
                    {result.extractedEntities.organizations && (
                      <div>
                        <div className="font-medium">Organizations:</div>
                        <div className="text-muted-foreground">{result.extractedEntities.organizations.join(', ')}</div>
                      </div>
                    )}
                    {result.extractedEntities.locations && (
                      <div>
                        <div className="font-medium">Locations:</div>
                        <div className="text-muted-foreground">{result.extractedEntities.locations.join(', ')}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 
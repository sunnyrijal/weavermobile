"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export function AdvancedNlpTest() {
  const [memoryText, setMemoryText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const testAdvancedNlp = async () => {
    if (!currentUser?.uid || !memoryText.trim()) {
      toast({ title: "Error", description: "Please enter a memory to test.", variant: "destructive" });
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch('/api/ai/parse-advanced-memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memory: memoryText,
          ownerId: currentUser.uid
        })
      });

      if (response.ok) {
        const data = await response.json();
        setResult(data);
        toast({ 
          title: "Advanced NLP Test Success!", 
          description: `Processed memory with ${data.result.updates.length} updates.`,
          variant: "default"
        });
      } else {
        const error = await response.json();
        toast({ 
          title: "Advanced NLP Test Failed", 
          description: error.error || "Unknown error occurred.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Advanced NLP test error:', error);
      toast({ 
        title: "Advanced NLP Test Error", 
        description: "Failed to test advanced NLP functionality.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Advanced NLP Test (Gemini Pro)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium">Test Memory:</label>
          <Textarea
            value={memoryText}
            onChange={(e) => setMemoryText(e.target.value)}
            placeholder="Enter a memory to test advanced NLP... e.g., 'Ally's brother John's birthday is actually July 21, not July 20. Also, Ally's new email is ally@example.com.'"
            className="mt-1"
            rows={4}
          />
        </div>
        
        <Button 
          onClick={testAdvancedNlp} 
          disabled={isProcessing || !memoryText.trim()}
          className="w-full"
        >
          {isProcessing ? "Processing..." : "Test Advanced NLP"}
        </Button>

        {result && (
          <div className="mt-4 space-y-4">
            <h3 className="font-semibold">Results:</h3>
            
            {result.result.updates.length > 0 && (
              <div>
                <h4 className="font-medium text-green-600">Updates ({result.result.updates.length}):</h4>
                <pre className="bg-muted p-2 rounded text-xs overflow-auto">
                  {JSON.stringify(result.result.updates, null, 2)}
                </pre>
              </div>
            )}

            {result.result.newContacts.length > 0 && (
              <div>
                <h4 className="font-medium text-blue-600">New Contacts ({result.result.newContacts.length}):</h4>
                <pre className="bg-muted p-2 rounded text-xs overflow-auto">
                  {JSON.stringify(result.result.newContacts, null, 2)}
                </pre>
              </div>
            )}

            {result.result.events.length > 0 && (
              <div>
                <h4 className="font-medium text-purple-600">Events ({result.result.events.length}):</h4>
                <pre className="bg-muted p-2 rounded text-xs overflow-auto">
                  {JSON.stringify(result.result.events, null, 2)}
                </pre>
              </div>
            )}

            <div>
              <h4 className="font-medium">Confidence: {result.result.confidence}</h4>
              {result.result.ambiguity.length > 0 && (
                <div>
                  <h4 className="font-medium text-orange-600">Ambiguous References:</h4>
                  <ul className="list-disc list-inside text-sm">
                    {result.result.ambiguity.map((item: string, index: number) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 
"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Mic, MicOff, Send, Loader2, Brain, MessageSquare } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useContacts } from '@/hooks/useContacts';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface AIAskModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AIAskModal({ isOpen, onOpenChange }: AIAskModalProps) {
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const [question, setQuestion] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [answer, setAnswer] = useState('');
  const [microphonePermissionError, setMicrophonePermissionError] = useState<string | null>(null);
  const speechRecognitionRef = useRef<any | null>(null);
  const { contacts } = useContacts({ initialLoad: true });
  const router = useRouter();

  const resetState = () => {
    setQuestion('');
    setAnswer('');
    setIsListening(false);
    setIsProcessing(false);
    setMicrophonePermissionError(null);
  };

  useEffect(() => {
    if (!isOpen) {
      resetState();
    }
  }, [isOpen]);

  const startListening = () => {
    const win = window as any;
    if (!win.webkitSpeechRecognition && !win.SpeechRecognition) {
      toast({ title: "Speech recognition not supported", description: "Your browser doesn't support speech recognition.", variant: "destructive" });
      return;
    }

    const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;
    speechRecognitionRef.current = new SpeechRecognition();
    const recognition = speechRecognitionRef.current;

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setMicrophonePermissionError(null);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setQuestion(transcript);
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      let errorMessage = `Speech recognition error: ${event.error}.`;
      
      if (event.error === 'no-speech') {
        errorMessage = "No speech detected. Please try again.";
      } else if (event.error === 'audio-capture') {
        errorMessage = "Microphone problem. Please check your microphone.";
      } else if (event.error === 'not-allowed') {
        errorMessage = "Microphone access denied. Please enable microphone permissions in your browser settings.";
        setMicrophonePermissionError(errorMessage);
      } else if (event.error === 'network') {
        errorMessage = "Network error during speech recognition. Please check your internet connection.";
      }
      
      toast({ title: "Voice Input Error", description: errorMessage, variant: "destructive" });
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    try {
      recognition.start();
    } catch (err: any) {
      console.error("Error accessing microphone:", err);
      let description = "Could not access microphone. Please ensure permission is granted.";
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        description = "Microphone access denied. Please enable it in your browser settings.";
        setMicrophonePermissionError(description);
      }
      toast({ title: "Microphone Access Error", description, variant: "destructive" });
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (speechRecognitionRef.current) {
      speechRecognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const handleAskQuestion = async () => {
    if (!question.trim()) {
      toast({ title: "Empty Question", description: "Please type or speak a question.", variant: "destructive" });
      return;
    }

    if (!currentUser) {
      toast({ title: "Not Logged In", description: "Please log in to ask questions.", variant: "destructive" });
      return;
    }

    setIsProcessing(true);
    setAnswer('');

    try {
      const response = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: question.trim(),
          ownerId: currentUser.uid,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setAnswer(data.answer);
      toast({ title: "Question Answered", description: "AI has processed your question." });
    } catch (error) {
      console.error("Error asking AI:", error);
      let description = "Could not get an answer from the AI.";
      if (error instanceof Error) {
        description = error.message;
      }
      toast({ title: "AI Error", description, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleAskQuestion();
  };

  // Helper to render clickable contact name in answer
  function renderAnswerWithLink(answer: string) {
    if (!contacts || contacts.length === 0) return answer;
    // Build a list of all display names, names, and nicknames
    const nameToContact = new Map<string, typeof contacts[0]>();
    contacts.forEach(c => {
      const displayName = c.nickname ? `${c.name} (${c.nickname})` : c.name;
      nameToContact.set(displayName, c);
      nameToContact.set(c.name, c);
      if (c.nickname) nameToContact.set(c.nickname, c);
    });
    // Sort by length descending to prefer longest match
    const allNames = Array.from(nameToContact.keys()).sort((a, b) => b.length - a.length);
    // Build a regex to match any name, nickname, or display name, even if followed by punctuation, parentheses, or at line start
    const nameRegex = new RegExp(`(^|[\s\n\r\t:>\-\*\(])(${allNames.map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})(?=[\s\n\r\t:,.!?()\-]|$)`, 'g');
    // Find what to highlight (simple: if 'Birthday:' in answer, highlight birthday)
    let highlight = '';
    if (/Birthday:/i.test(answer)) highlight = 'birthday';
    const parts = [];
    let lastIndex = 0;
    answer.replace(nameRegex, (match, pre, name, offset) => {
      const start = offset;
      const end = offset + match.length;
      if (start > lastIndex) parts.push(answer.slice(lastIndex, start));
      const contact = nameToContact.get(name);
      if (contact) {
        parts.push(
          <span key={name + start} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <span
              style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', marginRight: 2 }}
              onClick={() => router.push(`/contacts/${contact.id}${highlight ? `?highlight=${highlight}` : ''}`)}
              title={`View ${contact.name}'s profile`}
            >
              <Avatar className="w-5 h-5 mr-1 inline-block align-middle">
                {contact.photoURL ? (
                  <AvatarImage src={contact.photoURL} alt={contact.name} />
                ) : (
                  <AvatarFallback>{contact.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2)}</AvatarFallback>
                )}
              </Avatar>
            </span>
            {match}
          </span>
        );
      } else {
        parts.push(match);
      }
      lastIndex = end;
      return match;
    });
    if (lastIndex < answer.length) parts.push(answer.slice(lastIndex));
    return <>{parts}</>;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Ask AI About Your Contacts
          </DialogTitle>
          <DialogDescription>
            Ask questions about your contacts using natural language. Try questions like "Who is John's wife?" or "When is Alice's birthday?"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Question Input */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex gap-2">
              <Textarea
                placeholder="Ask a question about your contacts..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="flex-1 min-h-[80px]"
                disabled={isProcessing}
              />
              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={isListening ? stopListening : startListening}
                  disabled={isProcessing}
                  className="h-10 w-10"
                >
                  {isListening ? (
                    <MicOff className="h-4 w-4 text-destructive" />
                  ) : (
                    <Mic className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  type="submit"
                  size="icon"
                  disabled={!question.trim() || isProcessing}
                  className="h-10 w-10"
                >
                  {isProcessing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </form>

          {/* Microphone Permission Error */}
          {microphonePermissionError && (
            <Alert variant="destructive">
              <AlertDescription>{microphonePermissionError}</AlertDescription>
            </Alert>
          )}

          {/* AI Answer */}
          {answer && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <MessageSquare className="h-5 w-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold mb-2">AI Answer:</h4>
                    <div className="whitespace-pre-wrap text-sm">{renderAnswerWithLink(answer)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Example Questions */}
          <div className="text-sm text-muted-foreground">
            <p className="font-medium mb-2">Example questions:</p>
            <ul className="space-y-1 text-xs">
              <li>• "Who is John's wife?"</li>
              <li>• "When is Alice's birthday?"</li>
              <li>• "What's Sam's phone number?"</li>
              <li>• "Where does Jane work?"</li>
              <li>• "Who are my family members?"</li>
              <li>• "Tell me about John Doe"</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 

"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label"; // Added import
import { Mic, MicOff, Loader2, Save, XCircle, Brain } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { processVoiceInput } from '@/ai/flows/process-voice-input-flow';
import type { ProcessVoiceInputOutput } from '@/ai/flows/process-voice-input-flow';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { Memory } from '@/lib/types';
import { useAuth } from '@/hooks/useAuth';

interface VoiceMemoryInputModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function VoiceMemoryInputModal({ isOpen, onOpenChange }: VoiceMemoryInputModalProps) {
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessingAi, setIsProcessingAi] = useState(false);
  const [aiResponse, setAiResponse] = useState<ProcessVoiceInputOutput | null>(null);
  const [manualMemoryText, setManualMemoryText] = useState('');
  const speechRecognitionRef = useRef<SpeechRecognition | null>(null);
  const [microphonePermissionError, setMicrophonePermissionError] = useState<string | null>(null);


  const resetState = useCallback(() => {
    setTranscript('');
    setIsListening(false);
    setIsProcessingAi(false);
    setAiResponse(null);
    setManualMemoryText('');
    setMicrophonePermissionError(null);
  }, []);

  useEffect(() => {
    if (isOpen) {
      resetState();
    }
    return () => {
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.stop();
        speechRecognitionRef.current = null;
      }
    };
  }, [isOpen, resetState]);

  const handleVoiceInput = async () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      toast({ title: "Voice Input Not Supported", description: "Your browser doesn't support voice recognition.", variant: "destructive" });
      return;
    }

    if (isListening && speechRecognitionRef.current) {
      speechRecognitionRef.current.stop();
      return;
    }
    setMicrophonePermissionError(null);

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true }); // Just to request permission

      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = false;
      recognition.interimResults = true; // Show interim results for better UX
      recognition.lang = 'en-US';
      speechRecognitionRef.current = recognition;

      recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            // Show interim transcript, useful for user feedback
            interimTranscript += event.results[i][0].transcript;
          }
        }
        // Update with interim first, then final if available
        setTranscript(prev => finalTranscript || (prev + interimTranscript)); 
      };
      
      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error, event.message);
        let errorMessage = `Speech recognition error: ${event.error}.`;
        if (event.message) errorMessage += ` Details: ${event.message}`;
        if (event.error === 'no-speech') errorMessage = "No speech detected. Please try again.";
        else if (event.error === 'audio-capture') errorMessage = "Microphone problem.";
        else if (event.error === 'not-allowed') {
            errorMessage = "Microphone access denied. Please enable it in your browser settings.";
            setMicrophonePermissionError(errorMessage);
        } else if (event.error === 'network') {
            errorMessage = "Network error during speech recognition. Please check your internet connection.";
        } else {
            errorMessage = `An unknown error occurred with speech recognition: ${event.error}.`;
        }
        toast({ title: "Voice Input Error", description: errorMessage, variant: "destructive" });
        setIsListening(false);
      };

      recognition.onstart = () => {
        setTranscript(''); // Clear previous transcript
        setAiResponse(null); // Clear previous AI response
        setIsListening(true);
        toast({ title: "Listening...", description: "Please speak your memory." });
      };

      recognition.onend = () => {
        setIsListening(false);
        if (speechRecognitionRef.current) {
          speechRecognitionRef.current.stop(); // Ensure it's stopped
        }
        speechRecognitionRef.current = null;
        // Process the final transcript after speech ends
        // This ensures we use the transcript state that was updated by onresult
        // Need to access transcript via a state callback or ref if onresult is the only place it's finalized.
        // For simplicity, we'll assume `transcript` state is up-to-date after onresult/onend sequence.
        // A slight delay might be needed if transcript state isn't immediately updated before onend.
        setTimeout(() => { 
            // Access the transcript state here which should be updated by onresult
            setTranscript(currentTranscript => {
                if (currentTranscript.trim()) {
                    handleProcessTranscript(currentTranscript.trim());
                }
                return currentTranscript;
            });
        }, 0);
      };
      recognition.start();
    } catch (err: any) {
      console.error("Error accessing microphone", err);
      let description = "Could not access microphone.";
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        description = "Microphone access denied. Please enable it in browser settings.";
        setMicrophonePermissionError(description);
      } else if (err.name === "NotFoundError") {
        description = "No microphone found. Please ensure a microphone is connected and enabled.";
        setMicrophonePermissionError(description);
      }
      toast({ title: "Microphone Error", description, variant: "destructive" });
      setIsListening(false);
    }
  };

  const handleProcessTranscript = async (textToProcess: string) => {
    if (!textToProcess.trim()) {
      toast({ title: "Empty Transcript", description: "Nothing to process.", variant: "destructive"});
      return;
    }
    setIsProcessingAi(true);
    setAiResponse(null);
    try {
      const result = await processVoiceInput({ transcript: textToProcess });
      setAiResponse(result);
      toast({ title: "AI Processing Complete", description: "Review summary and entities." });
    } catch (error) {
      console.error("AI processing error:", error);
      toast({ title: "AI Error", description: (error as Error).message || "Could not process memory.", variant: "destructive" });
    } finally {
      setIsProcessingAi(false);
    }
  };
  
  const handleProcessManualText = () => {
      if (manualMemoryText.trim()){
          setTranscript(manualMemoryText); // Use manual text as transcript for processing
          handleProcessTranscript(manualMemoryText.trim());
      } else {
          toast({title: "Empty Text", description: "Please write down a memory to process.", variant: "destructive"});
      }
  };

  const handleSaveMemory = () => {
    if (!currentUser) {
        toast({title: "Not Logged In", description: "Please log in to save memories.", variant: "destructive"});
        return;
    }
    if (!aiResponse && !transcript.trim() && !manualMemoryText.trim()) {
      toast({ title: "No Memory Captured", description: "Please record or type a memory first.", variant: "destructive"});
      return;
    }

    // For now, just log. Actual Firestore save will be complex.
    const memoryToSave: Partial<Memory> = {
        ownerId: currentUser.uid,
        timestamp: new Date(),
        inputType: transcript ? 'voice' : 'text',
        transcript: transcript || manualMemoryText,
        summary: aiResponse?.summary || transcript || manualMemoryText, // Fallback summary
        entities: aiResponse?.extractedEntities,
        linkedContactIds: [], // To be implemented: allow user to link contacts
        tags: [], // To be implemented: allow user to add tags
    };
    console.log("Memory to save:", memoryToSave);
    toast({ title: "Memory Saved (Logged)", description: "Memory details logged to console."});
    onOpenChange(false); // Close modal
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) resetState();
    }}>
      <DialogContent className="sm:max-w-lg md:max-w-xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Brain className="text-primary"/> Add New Memory</DialogTitle>
          <DialogDescription>
            Capture memories using voice or text. Our AI will help summarize and extract key details.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-grow overflow-y-auto space-y-4 pr-2">
          <div className="space-y-2">
            <Label htmlFor="manual-memory">Write down your memory:</Label>
            <Textarea
              id="manual-memory"
              placeholder="Type your memory here..."
              value={manualMemoryText}
              onChange={(e) => setManualMemoryText(e.target.value)}
              rows={4}
              disabled={isListening || isProcessingAi}
            />
            <Button onClick={handleProcessManualText} size="sm" disabled={isListening || isProcessingAi || !manualMemoryText.trim()}>
                {isProcessingAi && manualMemoryText.trim() === transcript ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Process Text
            </Button>
          </div>

          <div className="text-center text-sm text-muted-foreground">OR</div>

          <div className="space-y-2">
            <Label>Record your memory by voice:</Label>
            <Button onClick={handleVoiceInput} className="w-full" disabled={isProcessingAi}>
              {isListening ? <MicOff className="mr-2 h-5 w-5 text-destructive" /> : <Mic className="mr-2 h-5 w-5" />}
              {isListening ? "Stop Listening..." : isProcessingAi && transcript ? "Processing Voice..." : "Start Voice Recording"}
            </Button>
             {microphonePermissionError && (
              <Alert variant="destructive" className="mt-2">
                <MicOff className="h-4 w-4" />
                <AlertTitle>Microphone Access Denied</AlertTitle>
                <AlertDescription>{microphonePermissionError}</AlertDescription>
              </Alert>
            )}
          </div>

          {transcript && (
            <div className="space-y-2 p-3 border rounded-md bg-muted/50">
              <h3 className="font-semibold text-sm">Transcript:</h3>
              <p className="text-xs whitespace-pre-wrap">{transcript}</p>
            </div>
          )}

          {isProcessingAi && !aiResponse && <div className="text-center p-4"><Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" /> <p className="text-sm text-muted-foreground">AI is processing...</p></div>}

          {aiResponse && (
            <div className="space-y-3 p-3 border-2 border-primary/50 rounded-md shadow-sm">
              <h3 className="font-semibold text-md text-primary">AI Summary &amp; Insights:</h3>
              <div className="space-y-1">
                <p className="font-medium text-sm">Summary:</p>
                <p className="text-xs bg-accent/10 p-2 rounded">{aiResponse.summary}</p>
              </div>
              {/* Basic display of entities for now */}
              {Object.entries(aiResponse.extractedEntities).map(([key, value]) => (
                Array.isArray(value) && value.length > 0 && (
                  <div key={key} className="space-y-0.5">
                    <p className="font-medium text-xs capitalize text-muted-foreground">{key.replace(/([A-Z])/g, ' $1')}:</p>
                    <ul className="list-disc list-inside pl-2 text-xs">
                      {value.map((item, idx) => <li key={idx}>{item}</li>)}
                    </ul>
                  </div>
                )
              ))}
            </div>
          )}
          {/* Placeholder for contact linking UI */}
        </div>

        <DialogFooter className="mt-auto pt-4 border-t">
          <DialogClose asChild>
            <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto"><XCircle className="mr-2"/>Cancel</Button>
          </DialogClose>
          <Button onClick={handleSaveMemory} disabled={isProcessingAi || isListening} className="w-full sm:w-auto">
            <Save className="mr-2"/> Save Memory
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}



"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  const [processedInputType, setProcessedInputType] = useState<'voice' | 'text' | null>(null);


  const resetState = useCallback(() => {
    setTranscript('');
    setIsListening(false);
    setIsProcessingAi(false);
    setAiResponse(null);
    setManualMemoryText('');
    setMicrophonePermissionError(null);
    setProcessedInputType(null);
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

  const handleProcessTranscript = async (textToProcess: string, inputType: 'voice' | 'text') => {
    if (!textToProcess.trim()) {
      toast({ title: "Empty Transcript", description: "Nothing to process.", variant: "destructive"});
      return;
    }
    setIsProcessingAi(true);
    setAiResponse(null); 
    setProcessedInputType(inputType);
    toast({ title: `Processing ${inputType} input...`, description: "AI is analyzing your memory." });
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
    setAiResponse(null); // Clear previous AI response when starting new voice input

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true }); 

      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = false;
      recognition.interimResults = true; 
      recognition.lang = 'en-US';
      speechRecognitionRef.current = recognition;

      let finalTranscriptForProcessing = '';

      recognition.onresult = (event) => {
        let interimTranscript = '';
        finalTranscriptForProcessing = transcript; // Capture current transcript state

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscriptForProcessing += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        setTranscript(finalTranscriptForProcessing + interimTranscript); 
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
        setTranscript(''); 
        finalTranscriptForProcessing = ''; // Reset for new recording
        setAiResponse(null); 
        setIsListening(true);
        toast({ title: "Listening...", description: "Please speak your memory." });
      };

      recognition.onend = () => {
        setIsListening(false);
        if (speechRecognitionRef.current) {
          try { speechRecognitionRef.current.stop(); } catch(e) {/* Already stopped */}
        }
        speechRecognitionRef.current = null;
        // Use the transcript state which should now be final
        setTranscript(currentTranscriptState => {
            if (currentTranscriptState.trim()) {
                handleProcessTranscript(currentTranscriptState.trim(), 'voice');
            }
            return currentTranscriptState;
        });
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
  
  const handleProcessManualText = () => {
      if (manualMemoryText.trim()){
          setTranscript(manualMemoryText); 
          handleProcessTranscript(manualMemoryText.trim(), 'text');
      } else {
          toast({title: "Empty Text", description: "Please write down a memory to process.", variant: "destructive"});
      }
  };

  const handleSaveMemory = () => {
    if (!currentUser) {
        toast({title: "Not Logged In", description: "Please log in to save memories.", variant: "destructive"});
        return;
    }
    // Check if there is content to save, either from AI processing or raw input
    const contentToSave = aiResponse?.summary || transcript || manualMemoryText;
    if (!contentToSave || !contentToSave.trim()) {
      toast({ title: "No Memory Captured", description: "Please record or type and process a memory first.", variant: "destructive"});
      return;
    }

    const memoryToSave: Partial<Memory> = {
        ownerId: currentUser.uid,
        timestamp: new Date(),
        inputType: processedInputType || (manualMemoryText && !transcript ? 'text' : 'voice'), // Refined logic for inputType
        transcript: transcript || manualMemoryText, 
        summary: aiResponse?.summary || transcript || manualMemoryText,
        entities: aiResponse?.extractedEntities,
        linkedContactIds: [], 
        tags: [], 
    };
    console.log("Memory to save:", memoryToSave);
    // Firestore save logic would go here
    // For example: await addDoc(collection(db, "memories"), memoryToSave);
    toast({ title: "Memory Saved (Logged)", description: "Memory details logged to console. Saving to database is pending."});
    onOpenChange(false); 
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
                {isProcessingAi && processedInputType === 'text' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Process Text
            </Button>
          </div>

          <div className="text-center text-sm text-muted-foreground">OR</div>

          <div className="space-y-2">
            <Label>Record your memory by voice:</Label>
            <Button onClick={handleVoiceInput} className="w-full" disabled={isProcessingAi && processedInputType === 'voice'}>
              {isListening ? <MicOff className="mr-2 h-5 w-5 text-destructive" /> : <Mic className="mr-2 h-5 w-5" />}
              {isListening ? "Stop Listening..." : (isProcessingAi && processedInputType === 'voice' ? "Processing Voice..." : "Start Voice Recording")}
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
              {aiResponse.extractedEntities && Object.entries(aiResponse.extractedEntities).map(([key, value]) => (
                Array.isArray(value) && value.length > 0 && (
                  <div key={key} className="space-y-0.5">
                    <p className="font-medium text-xs capitalize text-muted-foreground">{key.replace(/([A-Z])/g, ' $1').trim()}:</p>
                    <ul className="list-disc list-inside pl-2 text-xs">
                      {value.map((item, idx) => <li key={idx}>{item}</li>)}
                    </ul>
                  </div>
                )
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="mt-auto pt-4 border-t">
          <DialogClose asChild>
            <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto"><XCircle className="mr-2 h-4 w-4"/>Cancel</Button>
          </DialogClose>
          <Button 
            onClick={handleSaveMemory} 
            disabled={isProcessingAi || isListening || (!aiResponse && !transcript.trim() && !manualMemoryText.trim())} 
            className="w-full sm:w-auto"
          >
            <Save className="mr-2 h-4 w-4"/> Save Memory
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


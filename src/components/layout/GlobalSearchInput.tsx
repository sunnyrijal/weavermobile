"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Mic, MicOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // Added Alert imports


export function GlobalSearchInput() {
  const [internalSearchTerm, setInternalSearchTerm] = useState('');
  const [isListeningToVoice, setIsListeningToVoice] = useState(false);
  const speechRecognitionRef = useRef<any | null>(null);
  const router = useRouter();
  const { toast } = useToast();
  const [microphonePermissionError, setMicrophonePermissionError] = useState<string | null>(null); // Added state for mic error

  useEffect(() => {
    return () => {
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.stop();
        speechRecognitionRef.current = null;
      }
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInternalSearchTerm(e.target.value);
  };

  const handleSearchSubmit = () => {
    if (internalSearchTerm.trim()) {
      router.push(`/contacts?search=${encodeURIComponent(internalSearchTerm.trim())}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearchSubmit();
    }
  };

  const handleVoiceSearchClick = async () => {
    if (typeof window === 'undefined') return;
    const win = window as any;
    const SpeechRecognitionAPI = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      toast({ title: "Voice Search Not Supported", description: "Your browser doesn't support voice recognition. Please check browser settings.", variant: "destructive" });
      return;
    }

    if (isListeningToVoice && speechRecognitionRef.current) {
      speechRecognitionRef.current.stop();
      return;
    }
    setMicrophonePermissionError(null); // Reset permission error state

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true }); // Request permission
      stream.getTracks().forEach(track => track.stop()); // Stop tracks immediately

      const recognition = new (SpeechRecognitionAPI as any)();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      speechRecognitionRef.current = recognition;

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInternalSearchTerm(transcript);
        toast({ title: "Voice input received", description: `Search term set to: "${transcript}". Press Enter to search.` });
        // To auto-submit: handleSearchSubmit(transcript); 
        // Or router.push(`/contacts?search=${encodeURIComponent(transcript.trim())}`);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error (global search):", event.error, event.message);
        let errorMessage = `Speech recognition error: ${event.error}.`;
        if (event.message) errorMessage += ` Details: ${event.message}`;

        if (event.error === 'no-speech') errorMessage = "No speech detected. Please try again.";
        else if (event.error === 'audio-capture') errorMessage = "Microphone problem. Please check your microphone.";
        else if (event.error === 'not-allowed') {
            errorMessage = "Microphone access denied. Please enable microphone permissions in your browser settings.";
            setMicrophonePermissionError(errorMessage); // Set permission error
        }
        else if (event.error === 'network') {
            errorMessage = "Network error during speech recognition. Please check your internet connection. This could be a temporary issue with your network or the speech recognition service.";
        }
        toast({ title: "Voice Search Error", description: errorMessage, variant: "destructive" });
        setIsListeningToVoice(false);
        if (speechRecognitionRef.current) {
           try { speechRecognitionRef.current.stop(); } catch(e) {/* Already stopped */}
           speechRecognitionRef.current = null;
        }
      };
      
      recognition.onstart = () => {
        setIsListeningToVoice(true);
        toast({ title: "Listening...", description: "Speak now for global search." });
      };

      recognition.onend = () => {
        setIsListeningToVoice(false);
         if (speechRecognitionRef.current) {
           try { speechRecognitionRef.current.stop(); } catch(e) {/* already stopped */}
        }
        speechRecognitionRef.current = null;
      };
      
      recognition.start();

    } catch (err: any) { // Catch microphone permission errors specifically
      console.error("Error accessing microphone", err);
      let description = "Could not access microphone. Please ensure permission is granted.";
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        description = "Microphone access denied. Please enable it in your browser settings.";
        setMicrophonePermissionError(description); // Set permission error
      }
      toast({ title: "Microphone Access Error", description, variant: "destructive" });
      setIsListeningToVoice(false);
    }
  };

  return (
    <div className="relative flex-1 md:grow-0">
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Search contacts, tags..."
        className="w-full rounded-lg bg-muted pl-8 pr-10 md:w-[200px] lg:w-[320px] focus-visible:ring-accent"
        value={internalSearchTerm}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
      />
      <Button 
        variant="ghost" 
        size="icon" 
        className="absolute right-1.5 top-1/2 -translate-y-1/2 h-7 w-7" 
        onClick={handleVoiceSearchClick}
        title="Global search with voice"
      >
        {isListeningToVoice ? <MicOff className="h-4 w-4 text-destructive" /> : <Mic className="h-4 w-4 text-muted-foreground" />}
      </Button>
      {microphonePermissionError && ( // Display alert if microphone permission error
          <Alert variant="destructive" className="mt-2">
            <MicOff className="h-4 w-4" />
            <AlertTitle>Microphone Access Denied</AlertTitle>
            <AlertDescription>
              {microphonePermissionError}
            </AlertDescription>
          </Alert>
        )}
    </div>
  );
}

"use client";

import { ContactForm, contactFormSchema } from "@/components/contacts/ContactForm";
import type { ContactFormValues } from "@/lib/types/forms";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, Mic, MicOff, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { mockContacts } from "@/lib/mockData";
import { parseContactInfo } from "@/ai/flows/parse-contact-info-flow";
import type { ParseContactInfoOutput } from "@/ai/flows/parse-contact-info-flow";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Helper function to read file as Data URL
const readFileAsDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};


export default function NewContactPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const speechRecognitionRef = useRef<SpeechRecognition | null>(null);
  const [formKey, setFormKey] = useState(Date.now()); // Used to re-mount ContactForm with new defaults
  const [dynamicDefaultValues, setDynamicDefaultValues] = useState<Partial<ContactFormValues>>({});
  const [microphonePermissionError, setMicrophonePermissionError] = useState<string | null>(null);


  const handleSubmit = async (values: ContactFormValues) => {
    setIsLoading(true);
    if (!currentUser) {
      toast({
        title: "Error",
        description: "You must be logged in to add a contact.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    let photoUrlToStore = values.photoURL;
    if (values.photoFile) {
      try {
        photoUrlToStore = await readFileAsDataURL(values.photoFile);
      } catch (error) {
        console.error("Error converting file to data URL:", error);
        toast({
          title: "Image Upload Error",
          description: "Could not process the uploaded image. Please try again or use a URL.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
    }

    await new Promise(resolve => setTimeout(resolve, 1000));

    const newContactData = {
      ...values,
      photoURL: photoUrlToStore, // Use processed photo URL
      id: Date.now().toString(), 
      ownerId: currentUser.uid,
      createdAt: new Date(),
      updatedAt: new Date(),
      hometown: values.hometown || undefined,
      currentLocation: values.currentLocation || undefined,
      birthday: values.birthday ? formatDateForStorage(values.birthday) : undefined,
      college: values.college || undefined,
      ownerRelationshipLabel: values.ownerRelationshipLabel || undefined,
      tags: values.tags ? values.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
      socialProfiles: {},
      photosTogether: [],
      relationships: [],
    };
    // Remove photoFile from the data to be stored if it exists
    delete (newContactData as any).photoFile;


    mockContacts.push(newContactData);

    toast({
      title: "Contact Added",
      description: `${values.name} has been successfully added to your contacts.`,
    });
    setIsLoading(false);
    router.push("/contacts"); 
  };

  const handleVoiceInput = async () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      toast({ title: "Voice Input Not Supported", description: "Your browser doesn't support voice recognition. Please check your browser settings or use a different browser.", variant: "destructive" });
      return;
    }

    if (isListening && speechRecognitionRef.current) {
      speechRecognitionRef.current.stop();
      // onend will set isListening to false
      return;
    }
    setMicrophonePermissionError(null);

    try {
      // Check and request permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // If we get the stream, permission is granted. We can stop it immediately if not needed for actual recording indicator.
      stream.getTracks().forEach(track => track.stop());


      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      speechRecognitionRef.current = recognition;

      recognition.onresult = async (event) => {
        const transcript = event.results[0][0].transcript;
        toast({ title: "Voice input received", description: "Parsing contact information..." });
        setIsParsing(true);
        try {
          const parsedInfo = await parseContactInfo({ transcript });
          if (parsedInfo) {
            const newDefaults: Partial<ContactFormValues> = {};
            if (parsedInfo.name) newDefaults.name = parsedInfo.name;
            if (parsedInfo.email) newDefaults.email = parsedInfo.email;
            if (parsedInfo.phone) newDefaults.phone = parsedInfo.phone;
            if (parsedInfo.occupation) newDefaults.occupation = parsedInfo.occupation;
            if (parsedInfo.company) newDefaults.company = parsedInfo.company;
            if (parsedInfo.college) newDefaults.college = parsedInfo.college;
            if (parsedInfo.category) newDefaults.category = parsedInfo.category as ContactFormValues['category'];
            if (parsedInfo.hometown) newDefaults.hometown = parsedInfo.hometown;
            if (parsedInfo.currentLocation) newDefaults.currentLocation = parsedInfo.currentLocation;
            // AI for ownerRelationshipLabel not yet implemented in parseContactInfoFlow
            // if (parsedInfo.ownerRelationship) newDefaults.ownerRelationshipLabel = parsedInfo.ownerRelationship;
            if (parsedInfo.birthday) {
                // Attempt to parse AI-returned birthday string. YYYY-MM-DD is expected.
                const dateParts = parsedInfo.birthday.split('-');
                if (dateParts.length === 3) {
                    const year = parseInt(dateParts[0]);
                    const month = parseInt(dateParts[1]) - 1; // Month is 0-indexed
                    const day = parseInt(dateParts[2]);
                    const parsedDate = new Date(Date.UTC(year, month, day)); // Use UTC to avoid timezone issues
                    if (!isNaN(parsedDate.getTime())) {
                        newDefaults.birthday = parsedDate;
                    } else {
                        toast({ title: "AI Parsing Note", description: `Could not parse birthday: ${parsedInfo.birthday}`, variant: "default" });
                    }
                } else {
                     toast({ title: "AI Parsing Note", description: `Could not parse birthday format: ${parsedInfo.birthday}`, variant: "default" });
                }
            }
            if (parsedInfo.tags && parsedInfo.tags.length > 0) newDefaults.tags = parsedInfo.tags.join(', ');
            
            setDynamicDefaultValues(prev => ({...prev, ...newDefaults}));
            setFormKey(Date.now()); // Trigger re-mount of ContactForm
            toast({ title: "AI Parsing Complete", description: "Form fields updated with parsed information." });
          }
        } catch (aiError) {
          console.error("AI parsing error:", aiError);
          toast({ title: "AI Parsing Error", description: "Could not parse contact information from voice.", variant: "destructive" });
        } finally {
          setIsParsing(false);
        }
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error, event.message);
        let errorMessage = `Speech recognition error: ${event.error}.`;
        if (event.message) errorMessage += ` Details: ${event.message}`;

        if (event.error === 'no-speech') errorMessage = "No speech detected. Please try again.";
        else if (event.error === 'audio-capture') errorMessage = "Microphone problem. Please check your microphone.";
        else if (event.error === 'not-allowed') {
          errorMessage = "Microphone access denied. Please enable microphone permissions in your browser settings.";
          setMicrophonePermissionError(errorMessage);
        }
        else if (event.error === 'network') {
            errorMessage = "Network error during speech recognition. Please check your internet connection. If this persists, it might be an issue with your network environment or the speech recognition service.";
        }
        toast({ title: "Voice Input Error", description: errorMessage, variant: "destructive" });
        setIsListening(false);
        setIsParsing(false); // Reset parsing state on error
        if (speechRecognitionRef.current) {
            try { speechRecognitionRef.current.stop(); } catch(e) {/* Already stopped */}
            speechRecognitionRef.current = null;
        }
      };

      recognition.onstart = () => {
        setIsListening(true);
        toast({ title: "Listening...", description: "Please state the contact's information." });
      };

      recognition.onend = () => {
        setIsListening(false);
        // isParsing is handled by onresult or onerror
        if (speechRecognitionRef.current) {
           try { speechRecognitionRef.current.stop(); } catch(e) {/* already stopped */}
        }
        speechRecognitionRef.current = null; 
      };
      recognition.start();

    } catch (err: any) {
      console.error("Error accessing microphone", err);
      let description = "Could not access microphone. Please ensure permission is granted in browser settings.";
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        description = "Microphone access denied. Please enable it in your browser settings.";
         setMicrophonePermissionError(description);
      }
      toast({ title: "Microphone Access Error", description, variant: "destructive" });
      setIsListening(false);
    }
  };

   useEffect(() => {
    // Clean up speech recognition instance if component unmounts while listening
    return () => {
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.stop();
        speechRecognitionRef.current = null;
      }
    };
  }, []);


  return (
    <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
            <Button variant="outline" onClick={() => router.back()} className="w-full sm:w-auto">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <Button variant="outline" onClick={handleVoiceInput} disabled={isListening || isParsing} className="relative w-full sm:w-auto">
                {isListening ? <MicOff className="mr-2 h-4 w-4 text-destructive" /> : <Mic className="mr-2 h-4 w-4" />}
                {isListening ? "Stop Listening" : "Voice Input"}
                {isParsing && <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-primary" />}
                <Sparkles className="ml-2 h-4 w-4 text-accent" />
            </Button>
        </div>
        {microphonePermissionError && (
          <Alert variant="destructive" className="mb-4">
            <MicOff className="h-4 w-4" />
            <AlertTitle>Microphone Access Denied</AlertTitle>
            <AlertDescription>
              {microphonePermissionError} Please enable microphone permissions in your browser settings to use voice input.
            </AlertDescription>
          </Alert>
        )}
      <ContactForm 
        key={formKey} // Re-mounts the form when key changes, applying new defaultValues
        onSubmit={handleSubmit} 
        isLoading={isLoading || isParsing}
        defaultValues={dynamicDefaultValues}
      />
    </div>
  );
}

const formatDateForStorage = (date: Date): string => {
    // Format to YYYY-MM-DD for storage, ensuring UTC consistency
    const year = date.getUTCFullYear();
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = date.getUTCDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};


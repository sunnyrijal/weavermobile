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
import type { Memory, Contact } from '@/lib/types';
import { useAuth } from '@/hooks/useAuth';
import { useMemories } from '@/hooks/useMemories';
import { Check, ChevronsUpDown } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface VoiceMemoryInputModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function VoiceMemoryInputModal({ isOpen, onOpenChange }: VoiceMemoryInputModalProps) {
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const { createMemory } = useMemories();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessingAi, setIsProcessingAi] = useState(false);
  const [aiResponse, setAiResponse] = useState<ProcessVoiceInputOutput | null>(null);
  const [manualMemoryText, setManualMemoryText] = useState('');
  const speechRecognitionRef = useRef<SpeechRecognition | null>(null);
  const [microphonePermissionError, setMicrophonePermissionError] = useState<string | null>(null);
  const [processedInputType, setProcessedInputType] = useState<'voice' | 'text' | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [contactSelectorOpen, setContactSelectorOpen] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [isCreatingContact, setIsCreatingContact] = useState(false);
  const contactsFetchedRef = useRef(false);

  const resetState = useCallback(() => {
    setTranscript('');
    setIsListening(false);
    setIsProcessingAi(false);
    setAiResponse(null);
    setManualMemoryText('');
    setMicrophonePermissionError(null);
    setProcessedInputType(null);
    setIsSaving(false);
    setSelectedContactIds([]);
    setNewContactName('');
    setIsCreatingContact(false);
  }, []);

  // Fetch contacts only once when modal opens
  useEffect(() => {
    const fetchContacts = async () => {
      if (!currentUser || contactsFetchedRef.current) return;
      
      setIsLoadingContacts(true);
      try {
        const response = await fetch(`/api/contacts?ownerId=${currentUser.uid}`);
        
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        setContacts(data.contacts || []);
        contactsFetchedRef.current = true;
      } catch (error) {
        console.error('Error fetching contacts:', error);
        toast({ 
          title: 'Error',
          description: 'Failed to fetch contacts',
          variant: 'destructive'
        });
      } finally {
        setIsLoadingContacts(false);
      }
    };

    // Only fetch contacts once when the modal opens
    if (isOpen && currentUser && !contactsFetchedRef.current) {
      fetchContacts();
      contactsFetchedRef.current = true;
    }
    
    // Reset the ref when the modal closes
    if (!isOpen) {
      contactsFetchedRef.current = false;
    }
  }, [isOpen, currentUser]);

  const handleCreateContact = async () => {
    if (!newContactName.trim() || !currentUser) return;
    
    setIsCreatingContact(true);
    try {
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newContactName,
          ownerId: currentUser.uid,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Update local contacts state
      setContacts(prevContacts => [...prevContacts, data.contact]);
      
      toast({ 
        title: 'Contact Created',
        description: `${newContactName} has been added to your contacts.`
      });
      
      // Add the new contact to selected contacts
      if (data.contact.id) {
        setSelectedContactIds(prev => [...prev, data.contact.id]);
      }
      
      // Reset the new contact name
      setNewContactName('');
    } catch (error) {
      console.error('Error creating contact:', error);
      toast({ 
        title: 'Error',
        description: 'Failed to create contact',
        variant: 'destructive'
      });
    } finally {
      setIsCreatingContact(false);
    }
  };

  const suggestContactsFromEntities = useCallback(() => {
    if (!aiResponse?.extractedEntities?.people || !aiResponse.extractedEntities.people.length) {
      return;
    }
    
    // For each person mentioned in the memory, check if they exist in contacts
    const peopleNames = aiResponse.extractedEntities.people;
    const existingContactsByName = new Map(contacts.map(contact => [contact.name.toLowerCase(), contact]));
    
    // Extract relationships between people
    const relationships = aiResponse.extractedEntities.relationships || [];
    
    // Extract locations that might be hometowns or current locations
    const locations = aiResponse.extractedEntities.locations || [];
    
    // Extract organizations that might be companies or colleges
    const organizations = aiResponse.extractedEntities.organizations || [];
    
    // Filter out people who are already contacts
    const newPeopleNames = peopleNames.filter(
      personName => !existingContactsByName.has(personName.toLowerCase())
    );
    
    // If there are new people, suggest creating contacts for them
    if (newPeopleNames.length > 0) {
      // For the first new person, try to extract more details from the memory
      const firstPersonName = newPeopleNames[0];
      const transcript = aiResponse?.summary || transcript || manualMemoryText;
      
      // Create a more detailed contact suggestion
      const newContactSuggestion = {
        name: firstPersonName,
        ownerId: currentUser?.uid || '',
      };
      
      // Look for relationships in the transcript
      relationships.forEach(rel => {
        if (rel.toLowerCase().includes(firstPersonName.toLowerCase())) {
          // This relationship involves the first person
          newContactSuggestion.ownerRelationshipLabel = rel;
        }
      });
      
      // Look for locations in the transcript
      if (locations.length > 0) {
        newContactSuggestion.hometown = locations[0];
      }
      
      // Look for organizations in the transcript
      if (organizations.length > 0) {
        // Check if it might be a college/university
        const orgLower = organizations[0].toLowerCase();
        if (orgLower.includes('university') || orgLower.includes('college')) {
          newContactSuggestion.college = organizations[0];
        } else {
          newContactSuggestion.company = organizations[0];
        }
      }
      
      toast({
        title: "New Person Detected",
        description: `Would you like to create a contact for: ${firstPersonName}?`,
        action: (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              handleCreateNewContact(newContactSuggestion);
            }}
          >
            Create
          </Button>
        ),
      });
    }
    
    // Select existing contacts that were mentioned
    const mentionedContactIds = peopleNames
      .map(name => {
        const contact = existingContactsByName.get(name.toLowerCase());
        return contact?.id;
      })
      .filter(Boolean) as string[];
    
    if (mentionedContactIds.length > 0) {
      setSelectedContactIds(prev => {
        const newIds = [...prev];
        mentionedContactIds.forEach(id => {
          if (!newIds.includes(id)) {
            newIds.push(id);
          }
        });
        return newIds;
      });
    }
  }, [aiResponse, contacts, toast, currentUser?.uid, transcript, manualMemoryText]);

  // Add a function to handle creating a new contact with more details
  const handleCreateNewContact = async (contactData: any) => {
    if (!currentUser) return;
    
    setIsCreatingContact(true);
    try {
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contactData),
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Update local contacts state
      setContacts(prevContacts => [...prevContacts, data.contact]);
      
      toast({ 
        title: 'Contact Created',
        description: `${contactData.name} has been added to your contacts.`
      });
      
      // Add the new contact to selected contacts
      if (data.contact.id) {
        setSelectedContactIds(prev => [...prev, data.contact.id]);
      }
    } catch (error) {
      console.error('Error creating contact:', error);
      toast({ 
        title: 'Error',
        description: 'Failed to create contact',
        variant: 'destructive'
      });
    } finally {
      setIsCreatingContact(false);
    }
  };

  // Add a ref to track if suggestions have been processed
  const suggestionsProcessedRef = useRef(false);

  // Fix the useEffect that processes suggestions
  useEffect(() => {
    // Only process suggestions once per AI response
    if (aiResponse && !suggestionsProcessedRef.current) {
      suggestContactsFromEntities();
      suggestionsProcessedRef.current = true;
    }
  }, [aiResponse, suggestContactsFromEntities]);

  // Reset the suggestions processed ref when AI response changes
  useEffect(() => {
    if (!aiResponse) {
      suggestionsProcessedRef.current = false;
    }
  }, [aiResponse]);

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
    if (isListening) {
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.stop();
      }
      return;
    }

    try {
      // Check if the browser supports the Web Speech API
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        throw new Error("Your browser doesn't support speech recognition. Try Chrome or Edge.");
      }

      // Initialize the SpeechRecognition object
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      const recognition = new SpeechRecognition();
      speechRecognitionRef.current = recognition;

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      let finalTranscriptForProcessing = '';

      recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
            finalTranscriptForProcessing += event.results[i][0].transcript + ' ';
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        setTranscript(prevTranscript => {
          const newTranscript = prevTranscript + finalTranscript;
          return newTranscript + (interimTranscript ? ` ${interimTranscript}` : '');
        });
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
    } catch (err) {
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

  const handleSaveMemory = async () => {
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

    setIsSaving(true);

    try {
      // 1. Save the memory first
      const memoryToSave: Partial<Memory> = {
        ownerId: currentUser.uid,
        timestamp: new Date(),
        inputType: processedInputType || (manualMemoryText && !transcript ? 'text' : 'voice'), // Refined logic for inputType
        transcript: transcript || manualMemoryText, 
        summary: aiResponse?.summary || transcript || manualMemoryText,
        entities: aiResponse?.extractedEntities,
        linkedContactIds: selectedContactIds, 
        tags: [], 
      };
      
      const savedMemory = await createMemory(memoryToSave);
      
      if (!savedMemory) {
        throw new Error("Failed to save memory");
      }

      // 2. If there are multiple contacts selected, create relationships between them
      if (selectedContactIds.length > 1) {
        await createContactRelationships(selectedContactIds);
      }

      toast({ title: "Memory Saved", description: "Your memory has been saved successfully." });
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving memory:", error);
      toast({ title: "Save Error", description: "Failed to save memory to database.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  // Add a function to create relationships between contacts
  const createContactRelationships = async (contactIds: string[]) => {
    if (contactIds.length <= 1) return;

    // Get relationship information from AI response
    const relationshipInfo = new Map<string, Map<string, string>>();
    
    // Extract relationship information from AI response if available
    if (aiResponse?.extractedEntities?.relationships) {
      const peopleNames = aiResponse.extractedEntities.people || [];
      const relationships = aiResponse.extractedEntities.relationships || [];
      
      // Create a map of lowercase names to original case names
      const nameMap = new Map<string, string>();
      peopleNames.forEach(name => {
        nameMap.set(name.toLowerCase(), name);
      });
      
      // Process each relationship string to extract relationship types
      relationships.forEach(rel => {
        // Common patterns like "mom: Debbie Kittelson", "girlfriend Nickki Plukett"
        const parentPattern = /(mom|mother|dad|father|parent):\s*([^,]+)/i;
        const siblingPattern = /(brother|sister|sibling):\s*([^,]+)/i;
        const partnerPattern = /(girlfriend|boyfriend|wife|husband|partner|spouse)[\s:]?\s*([^,]+)/i;
        
        let match;
        let relationType = "";
        let name1 = "";
        let name2 = "";
        
        if (match = rel.match(parentPattern)) {
          relationType = "Parent";
          name2 = match[2].trim(); // Parent name
          
          // Find who this person is parent to
          for (const personName of peopleNames) {
            if (!rel.toLowerCase().includes(personName.toLowerCase())) {
              name1 = personName;
              break;
            }
          }
        } 
        else if (match = rel.match(siblingPattern)) {
          relationType = "Sibling";
          name2 = match[2].trim(); // Sibling name
          
          // Find who this person is sibling to
          for (const personName of peopleNames) {
            if (!rel.toLowerCase().includes(personName.toLowerCase())) {
              name1 = personName;
              break;
            }
          }
        }
        else if (match = rel.match(partnerPattern)) {
          relationType = "Partner";
          name2 = match[2].trim(); // Partner name
          
          // Find who this person is partner to
          for (const personName of peopleNames) {
            if (!rel.toLowerCase().includes(personName.toLowerCase())) {
              name1 = personName;
              break;
            }
          }
        }
        
        // Store the relationship info if we found a valid relationship
        if (relationType && name1 && name2) {
          if (!relationshipInfo.has(name1.toLowerCase())) {
            relationshipInfo.set(name1.toLowerCase(), new Map<string, string>());
          }
          relationshipInfo.get(name1.toLowerCase())?.set(name2.toLowerCase(), relationType);
          
          // Also store the reverse relationship
          if (!relationshipInfo.has(name2.toLowerCase())) {
            relationshipInfo.set(name2.toLowerCase(), new Map<string, string>());
          }
          relationshipInfo.get(name2.toLowerCase())?.set(name1.toLowerCase(), relationType);
        }
      });
    }

    // Create a map of contact IDs to names
    const contactIdToName = new Map<string, string>();
    const contactNameToId = new Map<string, string>();
    
    // Fetch all contacts to get their names
    for (const contactId of contactIds) {
      const contactResponse = await fetch(`/api/contacts/${contactId}`);
      if (!contactResponse.ok) continue;
      const contactData = await contactResponse.json();
      const contact = contactData.contact;
      
      contactIdToName.set(contactId, contact.name);
      contactNameToId.set(contact.name.toLowerCase(), contactId);
    }

    // For each pair of contacts, create a relationship if it doesn't exist
    for (let i = 0; i < contactIds.length; i++) {
      for (let j = i + 1; j < contactIds.length; j++) {
        const contact1Id = contactIds[i];
        const contact2Id = contactIds[j];
        
        // Get the first contact
        const contact1Response = await fetch(`/api/contacts/${contact1Id}`);
        if (!contact1Response.ok) continue;
        const contact1Data = await contact1Response.json();
        const contact1 = contact1Data.contact;
        
        // Check if relationship already exists
        const existingRelationship = contact1.relationships?.find(
          (rel: any) => rel.relatedContactId === contact2Id
        );
        
        if (!existingRelationship) {
          // Try to determine the relationship type from AI analysis
          let relationType = "connected";
          let customLabel = "";
          
          const contact1Name = contactIdToName.get(contact1Id)?.toLowerCase() || "";
          const contact2Name = contactIdToName.get(contact2Id)?.toLowerCase() || "";
          
          if (contact1Name && contact2Name) {
            // Check if we have relationship info for these contacts
            const relationshipType = relationshipInfo.get(contact1Name)?.get(contact2Name);
            if (relationshipType) {
              relationType = relationshipType;
              
              // If it's a parent relationship, determine if it's mother or father
              if (relationType === "Parent") {
                // Check if we can determine if it's mother or father from the relationship text
                const relationships = aiResponse?.extractedEntities?.relationships || [];
                for (const rel of relationships) {
                  if (rel.toLowerCase().includes(contact2Name)) {
                    if (rel.toLowerCase().includes("mom") || rel.toLowerCase().includes("mother")) {
                      customLabel = "Mother";
                      break;
                    } else if (rel.toLowerCase().includes("dad") || rel.toLowerCase().includes("father")) {
                      customLabel = "Father";
                      break;
                    }
                  }
                }
              }
            }
          }
          
          // Create a new relationship
          const updatedRelationships = [
            ...(contact1.relationships || []),
            {
              relatedContactId: contact2Id,
              type: relationType,
              customLabel: customLabel
            }
          ];
          
          // Update the contact with the new relationship
          await fetch(`/api/contacts/${contact1Id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ relationships: updatedRelationships }),
          });
          
          // Also create the reverse relationship
          const contact2Response = await fetch(`/api/contacts/${contact2Id}`);
          if (contact2Response.ok) {
            const contact2Data = await contact2Response.json();
            const contact2 = contact2Data.contact;
            
            // Determine the reverse relationship type
            let reverseType = relationType;
            let reverseCustomLabel = "";
            
            if (relationType === "Parent") {
              reverseType = "Child";
            } else if (relationType === "Child") {
              reverseType = "Parent";
            }
            
            // Check if reverse relationship already exists
            const existingReverseRelationship = contact2.relationships?.find(
              (rel: any) => rel.relatedContactId === contact1Id
            );
            
            if (!existingReverseRelationship) {
              const updatedReverseRelationships = [
                ...(contact2.relationships || []),
                {
                  relatedContactId: contact1Id,
                  type: reverseType,
                  customLabel: reverseCustomLabel
                }
              ];
              
              // Update the second contact with the new relationship
              await fetch(`/api/contacts/${contact2Id}`, {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ relationships: updatedReverseRelationships }),
              });
            }
          }
        }
      }
    }
  };

  const toggleContactSelection = (contactId: string) => {
    setSelectedContactIds(prev => 
      prev.includes(contactId) 
        ? prev.filter(id => id !== contactId) 
        : [...prev, contactId]
    );
  };

  const SelectedContactsList = () => {
    if (selectedContactIds.length === 0) return null;
    
    return (
      <div className="mt-2">
        <p className="text-xs font-medium mb-1">Linked Contacts:</p>
        <div className="flex flex-wrap gap-1">
          {selectedContactIds.map(contactId => {
            const contact = contacts.find(c => c.id === contactId);
            return (
              <Badge 
                key={contactId} 
                variant="secondary"
                className="flex items-center gap-1 pr-1"
              >
                <span className="text-xs">{contact?.name || "Unknown Contact"}</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => toggleContactSelection(contactId)}
                >
                  <XCircle className="h-3 w-3" />
                </Button>
              </Badge>
            );
          })}
        </div>
      </div>
    );
  };

  // Add the missing useEffect for modal open/close
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

          <div className="space-y-2 pt-2 border-t">
            <Label htmlFor="link-contacts" className="text-sm">Link to contacts:</Label>
            <Popover open={contactSelectorOpen} onOpenChange={setContactSelectorOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={contactSelectorOpen}
                  className="w-full justify-between"
                  disabled={isLoadingContacts}
                >
                  {isLoadingContacts ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  {selectedContactIds.length > 0 
                    ? `${selectedContactIds.length} contact${selectedContactIds.length > 1 ? 's' : ''} selected` 
                    : "Select contacts..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Search contacts..." />
                  <CommandEmpty>
                    <p className="py-2 px-4 text-sm">No contacts found.</p>
                    <div className="p-2 border-t">
                      <div className="flex items-center">
                        <input
                          type="text"
                          value={newContactName}
                          onChange={(e) => setNewContactName(e.target.value)}
                          placeholder="Enter new contact name"
                          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        />
                        <Button 
                          size="sm" 
                          className="ml-2" 
                          disabled={!newContactName.trim() || isCreatingContact}
                          onClick={handleCreateContact}
                        >
                          {isCreatingContact ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
                        </Button>
                      </div>
                    </div>
                  </CommandEmpty>
                  <CommandGroup className="max-h-60 overflow-y-auto">
                    {contacts.map((contact) => (
                      <CommandItem
                        key={contact.id}
                        value={contact.name}
                        onSelect={() => {
                          toggleContactSelection(contact.id);
                          setContactSelectorOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedContactIds.includes(contact.id) ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {contact.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  <div className="p-2 border-t">
                    <div className="flex items-center">
                      <input
                        type="text"
                        value={newContactName}
                        onChange={(e) => setNewContactName(e.target.value)}
                        placeholder="Enter new contact name"
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      />
                      <Button 
                        size="sm" 
                        className="ml-2" 
                        disabled={!newContactName.trim() || isCreatingContact}
                        onClick={handleCreateContact}
                      >
                        {isCreatingContact ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
                      </Button>
                    </div>
                  </div>
                </Command>
              </PopoverContent>
            </Popover>
            <SelectedContactsList />
          </div>
        </div>

        <DialogFooter className="mt-auto pt-4 border-t">
          <DialogClose asChild>
            <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto"><XCircle className="mr-2 h-4 w-4"/>Cancel</Button>
          </DialogClose>
          <Button 
            onClick={handleSaveMemory} 
            disabled={isProcessingAi || isListening || isSaving || (!aiResponse && !transcript.trim() && !manualMemoryText.trim())} 
            className="w-full sm:w-auto"
          >
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {isSaving ? "Saving..." : "Save Memory"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


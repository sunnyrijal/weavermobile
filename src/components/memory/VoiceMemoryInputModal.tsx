"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mic, MicOff, Loader2, Save, XCircle, Brain, AlertCircle, UserPlus } from "lucide-react";
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
import { findPotentialContactMatches } from "@/lib/utils";
import { v4 as uuidv4 } from 'uuid';
import { useContacts } from '@/hooks/useContacts';

interface VoiceMemoryInputModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function VoiceMemoryInputModal({ isOpen, onOpenChange }: VoiceMemoryInputModalProps) {
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const { createMemory } = useMemories();
  const { addContact, updateContact } = useContacts({ initialLoad: false });
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
  const [suggestedContactMatches, setSuggestedContactMatches] = useState<Array<{id: string, name: string, similarity: number}>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [newPeopleToCreate, setNewPeopleToCreate] = useState<string[]>([]);

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
    setSuggestedContactMatches([]);
    setShowSuggestions(false);
    setNewPeopleToCreate([]);
    
    // Make sure to stop speech recognition if active
    if (speechRecognitionRef.current) {
      try { 
        speechRecognitionRef.current.stop(); 
      } catch(e) {
        /* Ignore errors, already stopped */
      }
      speechRecognitionRef.current = null;
    }
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

  const findContactMatches = useCallback((peopleNames: string[]) => {
    if (!peopleNames?.length || !contacts?.length) {
      setSuggestedContactMatches([]);
      return;
    }

    const allMatches: Array<{id: string, name: string, similarity: number}> = [];
    
    // For each person extracted from the memory
    peopleNames.forEach(person => {
      // Find potential matches in contacts
      const matches = findPotentialContactMatches(person, contacts, 0.65); // Lower threshold for better recall
      
      // Only add unique matches
      matches.forEach(match => {
        if (!allMatches.some(existingMatch => existingMatch.id === match.id)) {
          allMatches.push(match);
        }
      });
    });
    
    setSuggestedContactMatches(allMatches);
    setShowSuggestions(allMatches.length > 0);
  }, [contacts]);

  const identifyNewPeopleContacts = useCallback((peopleNames: string[]) => {
    if (!peopleNames?.length || !contacts?.length) return;
    
    // Find people who don't have matching contacts
    const unmatchedPeople = peopleNames.filter(personName => {
      // Check if this person has no match above threshold
      const matches = findPotentialContactMatches(personName, contacts, 0.6);
      return matches.length === 0;
    });
    
    setNewPeopleToCreate(unmatchedPeople);
  }, [contacts]);

  const processTranscript = useCallback(async () => {
    if (!transcript.trim()) return;

    setIsProcessingAi(true);
    setProcessedInputType(isListening || transcript !== manualMemoryText ? 'voice' : 'text');

    try {
      const result = await processVoiceInput({ transcript });
      setAiResponse(result);
      
      // Find potential contact matches based on extracted people
      if (result.extractedEntities?.people?.length) {
        findContactMatches(result.extractedEntities.people);
        identifyNewPeopleContacts(result.extractedEntities.people);
      }
    } catch (error) {
      console.error('Error processing input:', error);
      toast({
        title: 'Processing Error',
        description: 'Failed to process your input.',
        variant: 'destructive'
      });
    } finally {
      setIsProcessingAi(false);
    }
  }, [transcript, toast, findContactMatches, identifyNewPeopleContacts, isListening, manualMemoryText]);

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
        if (event.error === 'not-allowed') {
          setMicrophonePermissionError("You denied microphone access. Please enable it in your browser settings and try again.");
        } else {
          console.error('Speech recognition error:', event.error);
          toast({ 
            title: 'Recognition Error',
            description: `Error: ${event.error}. Please try again.`,
            variant: 'destructive'
          });
        }
        setIsListening(false);
        if (speechRecognitionRef.current) {
          try { speechRecognitionRef.current.stop(); } catch(e) {/* Already stopped */}
        }
        speechRecognitionRef.current = null;
      };

      recognition.onend = () => {
        setIsListening(false);
        
        if (speechRecognitionRef.current) {
          try { speechRecognitionRef.current.stop(); } catch(e) {/* Already stopped */}
        }
        speechRecognitionRef.current = null;
        
        // Process the transcript when recording stops
        setTranscript(currentTranscript => {
          if (currentTranscript.trim()) {
            // Call processTranscript after the state has been updated
            setTimeout(() => processTranscript(), 0);
          }
          return currentTranscript;
        });
      };

      recognition.start();
      setIsListening(true);
    } catch (error) {
      console.error('Error initializing speech recognition:', error);
      toast({
        title: 'Recognition Error',
        description: error instanceof Error ? error.message : 'Failed to initialize speech recognition',
        variant: 'destructive'
      });
      setMicrophonePermissionError(
        error instanceof Error ? error.message : 'Failed to access your microphone'
      );
    }
  };
  
  const handleProcessManualText = () => {
    if (!manualMemoryText.trim()) {
      toast({ 
        title: 'Empty Input', 
        description: 'Please enter some text to process.',
        variant: 'destructive'
      });
      return;
    }
    
    // Set the transcript from manual text and then process
    setTranscript(manualMemoryText);
    // Wait for state update to complete
    setTimeout(() => processTranscript(), 0);
  };

  const createContactFromMemory = async (personName: string) => {
    if (!currentUser || !aiResponse) return;
    
    try {
      // Extract additional information about this person
      const entities = aiResponse.extractedEntities;
      let college = '';
      let company = '';
      let location = '';
      let hometown = '';
      let relationships = [];
      
      // Check for organizations that might be colleges or companies
      if (entities?.organizations?.length) {
        // Try to identify educational institutions
        const educationalTerms = ['university', 'college', 'school', 'institute', 'academy'];
        const educationalOrg = entities.organizations.find(org => 
          educationalTerms.some(term => org.toLowerCase().includes(term))
        );
        if (educationalOrg) college = educationalOrg;
        
        // Remaining organizations might be companies
        if (!educationalOrg && entities.organizations.length > 0) {
          company = entities.organizations[0];
        }
      }
      
      // Check for locations
      if (entities?.locations?.length) {
        // Use the first location as current location, second as hometown if available
        location = entities.locations[0];
        if (entities.locations.length > 1) {
          hometown = entities.locations[1];
        }
      }
      
      // Try to determine relationships for this person
      if (entities?.relationships?.length) {
        // Look for relationships mentioning this person
        for (const rel of entities.relationships) {
          if (rel.toLowerCase().includes(personName.toLowerCase())) {
            // This relationship involves this person
            relationships.push(rel);
          }
        }
      }
      
      // Create new contact with extracted information
      const newContact = await addContact({
        name: personName,
        ownerId: currentUser.uid,
        college,
        company,
        currentLocation: location,
        hometown,
        tags: entities?.keyEvents?.map(event => event.substring(0, 30)) || [],
        notes: aiResponse.summary,
        notableEvents: entities?.keyEvents?.map(event => ({
          id: uuidv4(),
          title: event.substring(0, 50),
          date: new Date().toISOString().split('T')[0],
          description: event
        })) || [],
      });
      
      if (newContact?.id) {
        // Add the new contact to selected contacts
        setSelectedContactIds(prev => [...prev, newContact.id]);
        // Update contacts list
        setContacts(prev => [...prev, newContact]);
        // Remove from new people list
        setNewPeopleToCreate(prev => prev.filter(name => name !== personName));
        
        toast({
          title: 'Contact Created',
          description: `${personName} has been added to your contacts.`
        });
      }
    } catch (error) {
      console.error('Error creating contact:', error);
      toast({
        title: 'Error',
        description: `Failed to create contact for ${personName}`,
        variant: 'destructive'
      });
    }
  };
  
  const updateContactsWithEvents = async () => {
    if (!selectedContactIds.length || !aiResponse?.extractedEntities) return;
    
    const entities = aiResponse.extractedEntities;
    if (!entities.keyEvents?.length) return;
    
    // For each selected contact, add events from the memory
    for (const contactId of selectedContactIds) {
      try {
        const contactToUpdate = contacts.find(c => c.id === contactId);
        if (!contactToUpdate) continue;
        
        // Create notable events from key events
        const notableEvents = entities.keyEvents.map(event => ({
          id: uuidv4(),
          title: event.substring(0, 50),
          date: new Date().toISOString().split('T')[0],
          description: event
        }));
        
        // Get existing events to avoid duplicates
        const existingEvents = contactToUpdate.notableEvents || [];
        
        // Merge events, avoiding duplicates
        const mergedEvents = [
          ...existingEvents,
          ...notableEvents.filter(newEvent => 
            !existingEvents.some(existing => 
              existing.description === newEvent.description
            )
          )
        ];
        
        // Update the contact with new events
        await updateContact(contactId, {
          notableEvents: mergedEvents,
        });
        
        console.log(`Updated contact ${contactToUpdate.name} with ${notableEvents.length} events`);
      } catch (error) {
        console.error(`Error updating contact ${contactId} with events:`, error);
      }
    }
  };
  
  const handleCreateAllNewContacts = async () => {
    if (!newPeopleToCreate.length) return;
    
    for (const personName of newPeopleToCreate) {
      await createContactFromMemory(personName);
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
        inputType: processedInputType || (manualMemoryText && !transcript ? 'text' : 'voice'), 
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

      // 2. Update contacts with events from memory
      if (selectedContactIds.length > 0 && aiResponse?.extractedEntities?.keyEvents?.length > 0) {
        await updateContactsWithEvents();
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

  // Add a component to show suggested contacts
  const SuggestedContacts = () => {
    if (!suggestedContactMatches.length || !showSuggestions) return null;
    
    return (
      <div className="mt-3 border p-3 rounded-md bg-muted/30">
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-medium text-sm flex items-center">
            <AlertCircle className="h-4 w-4 mr-1 text-amber-500" />
            Suggested Contacts
          </h4>
          <Button variant="ghost" size="sm" onClick={() => setShowSuggestions(false)}>
            Hide
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mb-2">
          We found these potential matching contacts based on names mentioned in your memory:
        </p>
        <div className="flex flex-wrap gap-1 mt-1">
          {suggestedContactMatches.map((match) => {
            const isSelected = selectedContactIds.includes(match.id);
            return (
              <Badge 
                key={match.id} 
                variant={isSelected ? "default" : "outline"}
                className={cn(
                  "cursor-pointer hover:bg-accent transition-colors px-3 py-1",
                  isSelected && "bg-primary"
                )}
                onClick={() => toggleContactSelection(match.id)}
              >
                {match.name}
                {isSelected ? (
                  <Check className="ml-1 h-3 w-3" />
                ) : null}
              </Badge>
            );
          })}
        </div>
      </div>
    );
  };

  // Add a component to show new contacts to create
  const NewContactsSection = () => {
    if (!newPeopleToCreate.length) return null;
    
    return (
      <div className="mt-3 border p-3 rounded-md bg-amber-50/50 dark:bg-amber-950/20">
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-medium text-sm flex items-center">
            <UserPlus className="h-4 w-4 mr-1 text-amber-500" />
            New People Detected
          </h4>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleCreateAllNewContacts}
            disabled={isSaving || newPeopleToCreate.length === 0}
          >
            Create All
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mb-2">
          These people were mentioned but don't match existing contacts:
        </p>
        <div className="flex flex-wrap gap-1 mt-1">
          {newPeopleToCreate.map((personName) => (
            <Badge 
              key={personName} 
              variant="outline"
              className="cursor-pointer hover:bg-accent transition-colors px-3 py-1 border-amber-200 dark:border-amber-800"
              onClick={() => createContactFromMemory(personName)}
            >
              {personName}
              <UserPlus className="ml-1 h-3 w-3" />
            </Badge>
          ))}
        </div>
      </div>
    );
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
            <div className="space-y-2">
              <h3 className="font-medium text-sm">AI Summary:</h3>
              <p className="text-sm p-3 border rounded-md bg-muted/50">{aiResponse.summary}</p>
              
              {/* Show the suggested contacts component */}
              <SuggestedContacts />
              
              {/* Show the new contacts component */}
              <NewContactsSection />
              
              {aiResponse.extractedEntities && Object.values(aiResponse.extractedEntities).some(arr => arr && arr.length > 0) && (
                <div className="space-y-2">
                  <h3 className="font-medium text-sm">Extracted Entities:</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {Object.entries(aiResponse.extractedEntities).map(([key, value]) => (
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
                </div>
              )}
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


"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mic, MicOff, Loader2, Save, XCircle, Brain, AlertCircle, UserPlus, CalendarDays, Mail, Phone, Gift, MapPin } from "lucide-react";
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

// Helper: Apply memory-based corrections/updates to a contact
async function applyMemoryUpdateToContact(memoryText: string, extractedEntities: ProcessVoiceInputOutput['extractedEntities'], contact: Contact, updateContact: (id: string, data: Partial<Contact>) => Promise<Contact>, toast: { title: string, description: string, variant: "default" | "destructive" | "info" | "success" }) {
  console.log('[DEBUG] Attempting to update contact:', contact, extractedEntities);
  const correctionPhrases = ["instead of", "actually", "correction", "now", "used to", "but", "previously"];
  const isCorrection = correctionPhrases.some(phrase => memoryText.toLowerCase().includes(phrase));
  let updateFields = {};

  // Generalized entity update logic
  // 1. Name
  if (extractedEntities.people?.length) {
    // If the memory says "X is actually Y instead of Z", try to update the name
    // (This is a simplification; real NLP would be needed for full accuracy)
    // For now, if the contact's name is in the people list and a correction is detected, update
    const newName = extractedEntities.people.find(p => p !== contact.name);
    if (isCorrection && newName && contact.name !== newName) {
      updateFields.name = newName;
      console.log('[DEBUG] Will update name:', contact.name, '->', newName);
    }
  }

  // 2. Phone
  if (extractedEntities.phone?.length) {
    const newPhone = extractedEntities.phone[0];
    if (contact.phone !== newPhone) {
      updateFields.phone = newPhone;
      console.log('[DEBUG] Will update phone:', contact.phone, '->', newPhone);
    }
  }

  // 3. Email
  if (extractedEntities.email?.length) {
    const newEmail = extractedEntities.email[0];
    if (contact.email !== newEmail) {
      updateFields.email = newEmail;
      console.log('[DEBUG] Will update email:', contact.email, '->', newEmail);
    }
  }

  // 4. Occupation
  if (extractedEntities.occupation?.length) {
    const newOccupation = extractedEntities.occupation[0];
    if (contact.occupation !== newOccupation) {
      updateFields.occupation = newOccupation;
      console.log('[DEBUG] Will update occupation:', contact.occupation, '->', newOccupation);
    }
  }

  // 5. Company
  if (extractedEntities.company?.length) {
    const newCompany = extractedEntities.company[0];
    if (contact.company !== newCompany) {
      updateFields.company = newCompany;
      console.log('[DEBUG] Will update company:', contact.company, '->', newCompany);
    }
  }

  // 6. Location (currentLocation)
  if (extractedEntities.locations?.length) {
    const newLocation = extractedEntities.locations[0];
    if (contact.currentLocation !== newLocation) {
      updateFields.currentLocation = newLocation;
      console.log('[DEBUG] Will update currentLocation:', contact.currentLocation, '->', newLocation);
    }
  }

  // 7. Birthday (dates)
  if (extractedEntities.dates?.length) {
    const newDate = extractedEntities.dates[0];
    if (contact.birthday !== newDate) {
      updateFields.birthday = newDate;
      console.log('[DEBUG] Will update birthday:', contact.birthday, '->', newDate);
    }
  }

  // 8. Relationships (simplified: update relatedContactName if correction detected)
  if (isCorrection && extractedEntities.relationships?.length && contact.relationships?.length) {
    // Example: "X brother name is actually Y instead of Z"
    // Try to find a relationship type in the extracted relationships and update the related contact name
    extractedEntities.relationships.forEach(relStr => {
      contact.relationships.forEach((rel, idx) => {
        if (rel.type && relStr.toLowerCase().includes(rel.type.toLowerCase())) {
          // Try to extract the new related contact name from the relStr
          const match = relStr.match(/name is (.+?) instead of/i);
          if (match && match[1]) {
            // This is a simplification; in reality, you'd need more robust NLP
            contact.relationships[idx].relatedContactName = match[1].trim();
            console.log('[DEBUG] Will update relationship:', rel.type, '->', match[1].trim());
            updateFields.relationships = contact.relationships;
          }
        }
      });
    });
  }

  // 9. Notes (append or correct as before)
  if (isCorrection && extractedEntities.locations?.length) {
    const newPlace = extractedEntities.locations[0];
    if (contact.notes) {
      const locationRegex = /(went to|traveled to|visited|moved to) ([A-Za-z ]+)/i;
      const newNotes = contact.notes.replace(locationRegex, (match, verb, oldPlace) => {
        return `${verb} ${newPlace}`;
      });
      if (newNotes !== contact.notes) {
        updateFields.notes = newNotes;
        console.log('[DEBUG] Will update notes (location):', contact.notes, '->', newNotes);
      }
    }
  } else if (!isCorrection && extractedEntities.locations?.length) {
    const newPlace = extractedEntities.locations[0];
    if (contact.notes && !contact.notes.includes(newPlace)) {
      updateFields.notes = (contact.notes + ` Went to ${newPlace}.`).trim();
      console.log('[DEBUG] Will append to notes:', contact.notes, '->', updateFields.notes);
    }
  }

  // Save the updated contact if changed
  if (Object.keys(updateFields).length > 0) {
    console.log('[DEBUG] Calling updateContact:', contact.id, updateFields);
    const updateResult = await updateContact(contact.id, updateFields);
    console.log('[DEBUG] updateContact response:', updateResult);
    toast({ title: "Contact Updated", description: `Updated ${contact.name}'s profile based on your memory.` });
  } else {
    console.log('[DEBUG] No updateFields, skipping updateContact');
  }
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
  const [pendingContactUpdates, setPendingContactUpdates] = useState<Array<{contactId: string, contactName: string, field: string, value: string}>>([]);
  const [updatingField, setUpdatingField] = useState<string | null>(null);

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
    setPendingContactUpdates([]);
    setUpdatingField(null);
    
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

  // Handler for clicking on the memory saved toast
  const onMemoryClick = (memory) => {
    // For now, just alert or log; replace with navigation/modal as needed
    alert(`Memory ID: ${memory?.id || 'unknown'}\nSummary: ${memory?.summary || ''}`);
    // Example: router.push(`/memories/${memory.id}`) or open modal
  };

  const handleSaveMemory = async () => {
    if (!currentUser) {
      toast({title: "Not Logged In", description: "Please log in to save memories.", variant: "destructive"});
      return;
    }
    
    const contentToSave = aiResponse?.summary || transcript || manualMemoryText;
    if (!contentToSave || !contentToSave.trim()) {
      toast({ title: "No Memory Captured", description: "Please record or type and process a memory first.", variant: "destructive"});
      return;
    }

    setIsSaving(true);

    try {
      // Try advanced NLP parsing first
      let advancedResult = null;
      try {
        console.log('🚀 Attempting advanced NLP parsing...');
        const advancedResponse = await fetch('/api/ai/parse-advanced-memory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            memory: contentToSave,
            ownerId: currentUser.uid
          })
        });

        if (advancedResponse.ok) {
          advancedResult = await advancedResponse.json();
          console.log('✨ Advanced NLP Result:', advancedResult);
          
          // Show results to user
          if (advancedResult.result.processedUpdates.length > 0) {
            toast({ 
              title: "Advanced Updates Applied!", 
              description: `Updated ${advancedResult.result.processedUpdates.length} contact(s) with advanced NLP.`,
              variant: "success"
            });
          }
          
          if (advancedResult.result.createdContacts.length > 0) {
            toast({ 
              title: "New Contacts Created!", 
              description: `Created ${advancedResult.result.createdContacts.length} new contact(s).`,
              variant: "success"
            });
          }
        }
      } catch (advancedError) {
        console.log('⚠️ Advanced NLP failed, falling back to basic processing:', advancedError);
      }

      // 1. If a contact is selected, apply memory-based update/correction (await all updates)
      if (selectedContactIds.length > 0 && aiResponse?.extractedEntities) {
        await Promise.all(selectedContactIds.map(async contactId => {
          const contact = contacts.find(c => c.id === contactId);
          if (contact) {
            await applyMemoryUpdateToContact(contentToSave, aiResponse.extractedEntities, contact, updateContact, toast);
          }
        }));
        // Re-fetch contacts after update to ensure UI and Ask AI are up to date
        if (typeof fetchContacts === 'function') {
          const refreshed = await fetchContacts();
          console.log('[DEBUG] fetchContacts result:', refreshed);
          console.log('[DEBUG] contacts after fetchContacts:', contacts);
        }
      }
      
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
        advancedNlpResult: advancedResult?.result || null
      };
      
      const savedMemory = await createMemory(memoryToSave);
      
      if (!savedMemory) {
        throw new Error("Failed to save memory");
      }

      // 2. Update contacts with events from memory
      if (selectedContactIds.length > 0 && aiResponse?.extractedEntities?.keyEvents?.length > 0) {
        await updateContactsWithEvents();
      }
      
      toast({
        title: "Memory Saved",
        description: (
          <span>
            Your memory has been saved successfully.{' '}
            <button
              style={{ color: "#0070f3", textDecoration: "underline", background: "none", border: "none", cursor: "pointer" }}
              onClick={() => onMemoryClick(savedMemory)}
            >
              View
            </button>
          </span>
        )
      });
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

  // Detect updatable fields after AI processing
  useEffect(() => {
    if (!aiResponse || !selectedContactIds.length) {
      setPendingContactUpdates([]);
      return;
    }
    const updatableFields = [
      { key: 'birthday', label: 'Birthday', icon: CalendarDays },
      { key: 'anniversary', label: 'Anniversary', icon: Gift },
      { key: 'email', label: 'Email', icon: Mail },
      { key: 'phone', label: 'Phone', icon: Phone },
      { key: 'address', label: 'Address', icon: MapPin },
    ];
    const updates: Array<{contactId: string, contactName: string, field: string, value: string}> = [];
    for (const contactId of selectedContactIds) {
      const contact = contacts.find(c => c.id === contactId);
      if (!contact) continue;
      for (const field of updatableFields) {
        const value = aiResponse.extractedEntities?.[field.key]?.[0];
        if (value && contact[field.key] !== value) {
          updates.push({
            contactId,
            contactName: contact.name,
            field: field.key,
            value,
          });
        }
      }
    }
    setPendingContactUpdates(updates);
  }, [aiResponse, selectedContactIds, contacts]);

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

  // UI for pending contact updates (multiple fields)
  const fieldIcons = {
    birthday: CalendarDays,
    anniversary: Gift,
    email: Mail,
    phone: Phone,
    address: MapPin,
  };
  const PendingContactUpdatePrompt = () => {
    if (!pendingContactUpdates.length) return null;
    return (
      <div className="my-3 space-y-2">
        {pendingContactUpdates.map((update, idx) => {
          const Icon = fieldIcons[update.field] || AlertCircle;
          return (
            <div key={idx} className="p-3 border rounded-md bg-blue-50 dark:bg-blue-950/20 flex items-center gap-3">
              <Icon className="h-5 w-5 text-blue-500" />
              <div className="flex-1">
                <div className="text-sm">
                  Update <span className="font-semibold">{update.contactName}</span>'s {update.field} to <span className="font-semibold">{update.value}</span>?
                </div>
              </div>
              <Button
                size="sm"
                variant="default"
                disabled={updatingField === `${update.contactId}-${update.field}`}
                onClick={async () => {
                  setUpdatingField(`${update.contactId}-${update.field}`);
                  try {
                    await updateContact(update.contactId, { [update.field]: update.value });
                    toast({ title: "Contact Updated", description: `${update.contactName}'s ${update.field} updated to ${update.value}.` });
                    setPendingContactUpdates(prev => prev.filter(u => !(u.contactId === update.contactId && u.field === update.field)));
                  } catch (err) {
                    toast({ title: "Update Failed", description: `Could not update contact.`, variant: "destructive" });
                  } finally {
                    setUpdatingField(null);
                  }
                }}
              >
                {updatingField === `${update.contactId}-${update.field}` ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                Confirm
              </Button>
            </div>
          );
        })}
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
              {/* Show the update prompt if needed */}
              <PendingContactUpdatePrompt />
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
                    {contacts.map((contact) => {
                      console.log('Rendering contact item:', contact);
                      return (
                        <CommandItem
                          key={contact.id}
                          value={contact.name}
                          data-disabled={false}
                          aria-disabled={false}
                          style={{ border: '1px solid #e0e0e0', margin: '2px 0', cursor: 'pointer', background: '#ffeeba' }}
                          onSelect={() => {
                            console.log('Contact selected:', contact.id, contact.name);
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
                      );
                    })}
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


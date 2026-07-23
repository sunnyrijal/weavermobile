"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mic, MicOff, Loader2, Save, XCircle, Brain, AlertCircle, UserPlus, CalendarDays, Mail, Phone, Gift, MapPin, Sparkles, Info, X, Type } from "lucide-react";
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
import { Switch } from '@/components/ui/switch';
import { whisperQuickNoteTransform } from '@/lib/whisperTransform';
import { Checkbox } from "@/components/ui/checkbox";

interface VoiceMemoryInputModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  contactId?: string;
  contactName?: string;
  onMemorySaved?: () => void;
  container?: HTMLElement | null;
}

// Helper: Apply memory-based corrections/updates to a contact
async function applyMemoryUpdateToContact(memoryText: string, extractedEntities: ProcessVoiceInputOutput['extractedEntities'], contact: Contact, updateContact: (id: string, data: Partial<Contact>) => Promise<Contact | null>, toast: any) {
  console.log('[DEBUG] Attempting to update contact:', contact, extractedEntities);
  const correctionPhrases = ["instead of", "actually", "correction", "now", "used to", "but", "previously"];
  const isCorrection = correctionPhrases.some(phrase => memoryText.toLowerCase().includes(phrase));
  let updateFields: any = {};
  const entities = extractedEntities as any;

  // Generalized entity update logic
  // 1. Name
  if (Array.isArray(entities?.people) && entities.people.length) {
    const newName = entities.people.find((p: string) => p !== contact.name);
    if (isCorrection && newName && contact.name !== newName) {
      updateFields = { ...updateFields, name: newName };
      console.log('[DEBUG] Will update name:', contact.name, '->', newName);
    }
  }

  // 2. Phone
  if (Array.isArray(entities?.phone) && entities.phone.length) {
    const newPhone = entities.phone[0];
    if ('phone' in contact && contact.phone !== undefined && contact.phone !== newPhone) {
      updateFields = { ...updateFields, phone: newPhone };
      console.log('[DEBUG] Will update phone:', contact.phone, '->', newPhone);
    }
  }

  // 3. Email
  if (Array.isArray(entities?.email) && entities.email.length) {
    const newEmail = entities.email[0];
    if ('email' in contact && contact.email !== undefined && contact.email !== newEmail) {
      updateFields = { ...updateFields, email: newEmail };
      console.log('[DEBUG] Will update email:', contact.email, '->', newEmail);
    }
  }

  // 4. Occupation
  if (Array.isArray(entities?.occupation) && entities.occupation.length) {
    const newOccupation = entities.occupation[0];
    if ('occupation' in contact && contact.occupation !== undefined && contact.occupation !== newOccupation) {
      updateFields = { ...updateFields, occupation: newOccupation };
      console.log('[DEBUG] Will update occupation:', contact.occupation, '->', newOccupation);
    }
  }

  // 5. Company
  if (Array.isArray(entities?.company) && entities.company.length) {
    const newCompany = entities.company[0];
    if ('company' in contact && contact.company !== undefined && contact.company !== newCompany) {
      updateFields = { ...updateFields, company: newCompany };
      console.log('[DEBUG] Will update company:', contact.company, '->', newCompany);
    }
  }

  // 6. Location (currentLocation)
  if (Array.isArray(entities?.locations) && entities.locations.length) {
    const newLocation = entities.locations[0];
    if ('currentLocation' in contact && contact.currentLocation !== undefined && contact.currentLocation !== newLocation) {
      updateFields = { ...updateFields, currentLocation: newLocation };
      console.log('[DEBUG] Will update currentLocation:', contact.currentLocation, '->', newLocation);
    }
  }

  // 7. Birthday (dates)
  if (Array.isArray(entities?.dates) && entities.dates.length) {
    const newDate = entities.dates[0];
    if ('birthday' in contact && contact.birthday !== undefined && contact.birthday !== newDate) {
      updateFields = { ...updateFields, birthday: newDate };
      console.log('[DEBUG] Will update birthday:', contact.birthday, '->', newDate);
    }
  }

  // 8. Relationships (simplified: update relatedContactName if correction detected)
  if (isCorrection && Array.isArray(entities?.relationships) && entities.relationships.length && Array.isArray(contact.relationships) && contact.relationships.length) {
    entities.relationships.forEach((relStr: string) => {
      contact.relationships.forEach((rel, idx) => {
        if (rel.type && relStr.toLowerCase().includes(rel.type.toLowerCase())) {
          const match = relStr.match(/name is (.+?) instead of/i);
          if (match && match[1]) {
            contact.relationships[idx].relatedContactName = match[1].trim();
            console.log('[DEBUG] Will update relationship:', rel.type, '->', match[1].trim());
            updateFields = { ...updateFields, relationships: contact.relationships };
          }
        }
      });
    });
  }

  // 9. Notes (append or correct as before)
  if (isCorrection && Array.isArray(entities?.locations) && entities.locations.length) {
    const newPlace = entities.locations[0];
    if ('notes' in contact && typeof contact.notes === 'string') {
      const locationRegex = /(went to|traveled to|visited|moved to) ([A-Za-z ]+)/i;
      const newNotes = contact.notes.replace(locationRegex, (match, verb, oldPlace) => {
        return `${verb} ${newPlace}`;
      });
      if (newNotes !== contact.notes) {
        updateFields = { ...updateFields, notes: newNotes };
        console.log('[DEBUG] Will update notes (location):', contact.notes, '->', newNotes);
      }
    }
  } else if (!isCorrection && Array.isArray(entities?.locations) && entities.locations.length) {
    const newPlace = entities.locations[0];
    if ('notes' in contact && typeof contact.notes === 'string' && !contact.notes.includes(newPlace)) {
      updateFields = { ...updateFields, notes: (contact.notes + ` Went to ${newPlace}.`).trim() };
      console.log('[DEBUG] Will append to notes:', contact.notes, '->', updateFields.notes);
    }
  }

  // 10. Handle travel/location updates from memory text
  if (!isCorrection && memoryText && typeof memoryText === 'string') {
    const travelPatterns = [
      /(?:is going to|going to|traveling to|visiting|headed to) ([A-Za-z ]+)/i,
      /(?:will be in|will visit|will travel to) ([A-Za-z ]+)/i,
      /(?:plans to go to|planning to visit) ([A-Za-z ]+)/i
    ];
    
    for (const pattern of travelPatterns) {
      const match = memoryText.match(pattern);
      if (match && match[1]) {
        const destination = match[1].trim();
        if ('notes' in contact && typeof contact.notes === 'string' && !contact.notes.includes(destination)) {
          const newNotes = (contact.notes + ` ${destination} trip mentioned.`).trim();
          updateFields = { ...updateFields, notes: newNotes };
          console.log('[DEBUG] Will append travel info to notes:', contact.notes, '->', newNotes);
          break; // Only add once
        }
      }
    }
  }

  // 11. Handle basic information extraction from memory text AND existing notes
  if (!isCorrection && (memoryText || contact.notes) && typeof (memoryText || contact.notes) === 'string') {
    const textToAnalyze = (memoryText || contact.notes || '') as string;
    // Height patterns - improved to capture full height expressions
    const heightPatterns = [
      /(?:is|are) (?:around |about |approximately |like )?(\d+\s*(?:feet?|ft|')\s*\d*\s*(?:inches?|in|")?)/i,
      /(?:height|tall|height is) (?:around |about |approximately |like )?(\d+\s*(?:feet?|ft|')\s*\d*\s*(?:inches?|in|")?)/i,
      /(?:like |around |about |approximately )?(\d+\s*(?:feet?|ft|')\s*\d*\s*(?:inches?|in|")?)/i,
      /(?:is|are) (?:around |about |approximately |like )?(\d+['"]?\d*["']?)/i,
      /(?:height|tall|height is) (?:around |about |approximately |like )?(\d+['"]?\d*["']?)/i,
      /(?:like |around |about |approximately )?(\d+['"]?\d*["']?)/i
    ];
    
    for (const pattern of heightPatterns) {
      const match = textToAnalyze.match(pattern);
      if (match && match[1] && !contact.height) {
        let heightStr = match[1].trim();
        if (heightStr.length > 0) {
          updateFields = { ...updateFields, height: heightStr };
          console.log('[DEBUG] Will update height:', heightStr);
          break;
        }
      }
    }

    // Weight patterns
    const weightPatterns = [
      /(?:is|are) (?:around |about |approximately |like )?(\d+\s*(?:lbs?|pounds?|kg|kilos?))/i,
      /(?:weight|weighs|weight is) (?:around |about |approximately |like )?(\d+\s*(?:lbs?|pounds?|kg|kilos?))/i,
      /(?:like |around |about |approximately )?(\d+\s*(?:lbs?|pounds?|kg|kilos?))/i
    ];
    
    for (const pattern of weightPatterns) {
      const match = textToAnalyze.match(pattern);
      if (match && match[1] && !contact.weight) {
        let weightStr = match[1].trim();
        if (weightStr.length > 0) {
          updateFields = { ...updateFields, weight: weightStr };
          console.log('[DEBUG] Will update weight:', weightStr);
          break;
        }
      }
    }

    // Eye color patterns
    const eyeColorPatterns = [
      /(?:has|have) (\w+) eyes/i,
      /(\w+) eyes/i,
      /eyes are (\w+)/i
    ];
    
    for (const pattern of eyeColorPatterns) {
      const match = textToAnalyze.match(pattern);
      if (match && match[1] && !contact.eyeColor) {
        const eyeColor = match[1].toLowerCase();
        if (['blue', 'brown', 'green', 'hazel', 'gray', 'grey', 'amber'].includes(eyeColor)) {
          updateFields = { ...updateFields, eyeColor: eyeColor };
          console.log('[DEBUG] Will update eye color:', eyeColor);
          break;
        }
      }
    }

    // Hair color patterns
    const hairColorPatterns = [
      /(?:has|have) (\w+) hair/i,
      /(\w+) hair/i,
      /hair is (\w+)/i
    ];
    
    for (const pattern of hairColorPatterns) {
      const match = textToAnalyze.match(pattern);
      if (match && match[1] && !contact.hairColor) {
        const hairColor = match[1].toLowerCase();
        if (['brown', 'blonde', 'black', 'red', 'auburn', 'gray', 'grey', 'white'].includes(hairColor)) {
          updateFields = { ...updateFields, hairColor: hairColor };
          console.log('[DEBUG] Will update hair color:', hairColor);
          break;
        }
      }
    }

    // Body type patterns - improved to capture body type descriptions
    const bodyTypePatterns = [
      /(?:is|are) (\w+)(?:\s|$|\.)(?!\s*(?:feet?|ft|'|tall|short))/i,
      /(?:looks|look) (\w+)(?:\s|$|\.)/i,
      /(?:body type|build) is (\w+)(?:\s|$|\.)/i,
      /(?:is|are) (\w+)(?:\s+and|\s+but|\s+with)/i
    ];
    
    for (const pattern of bodyTypePatterns) {
      const match = textToAnalyze.match(pattern);
      if (match && match[1] && !contact.bodyType) {
        const bodyType = match[1].toLowerCase();
        if (['athletic', 'slim', 'thin', 'tall', 'short', 'average', 'muscular', 'curvy'].includes(bodyType)) {
          updateFields = { ...updateFields, bodyType: bodyType };
          console.log('[DEBUG] Will update body type:', bodyType);
          break;
        }
      }
    }

    // Dressing style patterns - improved to capture dressing style descriptions
    const dressingStylePatterns = [
      /(?:likes to|like to|dresses|dress) (\w+)(?:\s|$|\.)/i,
      /(?:style is|fashion is) (\w+)(?:\s|$|\.)/i,
      /(?:wears|wear) (\w+)(?:\s|$|\.)/i,
      /(?:dresses|dress) (\w+)(?:\s|$|\.)/i,
      /(?:likes to|like to) dress (\w+)(?:\s|$|\.)/i
    ];
    
    for (const pattern of dressingStylePatterns) {
      const match = textToAnalyze.match(pattern);
      if (match && match[1] && !contact.dressingStyle) {
        const dressingStyle = match[1].toLowerCase();
        // Handle variations like "casually" -> "casual"
        const normalizedStyle = dressingStyle.endsWith('ly') ? dressingStyle.slice(0, -2) : dressingStyle;
        if (['classy', 'casual', 'formal', 'trendy', 'elegant', 'sophisticated', 'minimalist'].includes(normalizedStyle)) {
          updateFields = { ...updateFields, dressingStyle: normalizedStyle };
          console.log('[DEBUG] Will update dressing style:', normalizedStyle);
          break;
        }
      }
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

export function VoiceMemoryInputModal({ isOpen, onOpenChange, contactId, contactName, onMemorySaved, container }: VoiceMemoryInputModalProps) {
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const { createMemory } = useMemories();
  const { addContact, updateContact } = useContacts({ initialLoad: false });
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingAi, setIsProcessingAi] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiResponse, setAiResponse] = useState<ProcessVoiceInputOutput | null>(null);
  const [manualMemoryText, setManualMemoryText] = useState('');
  const speechRecognitionRef = useRef<any | null>(null);
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
  const [saveToJournalOnly, setSaveToJournalOnly] = useState(false);
  const [ambiguousOptions, setAmbiguousOptions] = useState<any[]>([]);
  const [showAmbiguousModal, setShowAmbiguousModal] = useState(false);
  const [ambiguousUpdate, setAmbiguousUpdate] = useState<{ field: string, value: string } | null>(null);
  // 1. After receiving advancedResult from the orchestrator, set a new state variable for the structured output:
  const [structuredNlpResult, setStructuredNlpResult] = useState<any>(null);
  const [isUsingGeminiCli, setIsUsingGeminiCli] = useState(false);
  const [contactsCreatedByGeminiCli, setContactsCreatedByGeminiCli] = useState(false);
  const [pendingGeminiCliContacts, setPendingGeminiCliContacts] = useState<any[]>([]);
  const [userRelationship, setUserRelationship] = useState<string>('');
  const [showRelationshipSelector, setShowRelationshipSelector] = useState(false);
  const [selectedRelationship, setSelectedRelationship] = useState<string>('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [geminiCliResult, setGeminiCliResult] = useState<any>(null);
  const [inputMode, setInputMode] = useState<'voice' | 'text'>('voice');
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef(false);

  const handleStartPress = () => {
    isLongPressRef.current = false;
    longPressTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      setInputMode('text');
      toast({
        title: "Switched to Note Typing Mode",
        description: "Type your memory directly below and click 'Process Text' for AI parsing.",
      });
    }, 450);
  };

  const handleEndPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  // Debug pendingGeminiCliContacts changes
  useEffect(() => {
    console.log('🔍 pendingGeminiCliContacts changed:', pendingGeminiCliContacts);
  }, [pendingGeminiCliContacts]);

  // Synchronize selectedContactIds when modal opens with a contactId
  useEffect(() => {
    if (isOpen) {
      if (contactId) {
        setSelectedContactIds([contactId]);
      } else {
        setSelectedContactIds([]);
      }
    }
  }, [isOpen, contactId]);

  const resetState = useCallback(() => {
    setTranscript('');
    setIsListening(false);
    setIsRecording(false);
    setIsProcessingAi(false);
    setIsProcessing(false);
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
    setSaveToJournalOnly(false);
    setAmbiguousOptions([]);
    setShowAmbiguousModal(false);
    setAmbiguousUpdate(null);
    setStructuredNlpResult(null); // Reset structured output
    setIsUsingGeminiCli(false); // Reset Gemini CLI usage indicator
    setContactsCreatedByGeminiCli(false); // Reset Gemini CLI contacts created flag
    setPendingGeminiCliContacts([]); // Reset pending Gemini CLI contacts
    setUserRelationship(''); // Reset user relationship
    setShowRelationshipSelector(false);
    setSelectedRelationship('');
    setGeminiCliResult(null); // Reset Gemini CLI result
    
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

  const fetchContacts = useCallback(async () => {
    if (!currentUser) return;
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
  }, [currentUser]);

  // Fetch contacts only once when modal opens
  useEffect(() => {
    // Only fetch contacts once when the modal opens
    if (isOpen && currentUser && !contactsFetchedRef.current) {
      fetchContacts();
    }
    
    // Reset the ref when the modal closes
    if (!isOpen) {
      contactsFetchedRef.current = false;
    }
  }, [isOpen, currentUser, fetchContacts]);

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
      
      // Add the new contact to selected contacts (prevent duplicates)
      if (data.contact.id) {
        setSelectedContactIds(prev => 
          prev.includes(data.contact.id) ? prev : [...prev, data.contact.id]
        );
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

  const mergeNicknamesWithFullNames = (peopleNames: string[], transcript: string): string[] => {
    // Look for patterns like 'Jake, his full name Jacob Lucas'
    const fullNamePattern = /([A-Za-z]+)[,\s]+his full name ([A-Za-z]+ [A-Za-z]+)/i;
    const match = transcript.match(fullNamePattern);
    if (match) {
      const nickname = match[1].trim();
      const fullName = match[2].trim();
      // Remove both from the list and add only the full name
      return [fullName, ...peopleNames.filter(n => n !== nickname && n !== fullName)];
    }
    return peopleNames;
  };

  const findContactMatches = useCallback((peopleNames: string[]) => {
    // Merge nicknames and full names if needed
    const mergedPeopleNames = mergeNicknamesWithFullNames(peopleNames, transcript);
    if (!mergedPeopleNames?.length || !contacts?.length) {
      setSuggestedContactMatches([]);
      return;
    }

    const allMatches: Array<{id: string, name: string, similarity: number}> = [];
    // For each person extracted from the memory
    mergedPeopleNames.forEach(person => {
      // Find potential matches in contacts
      const matches = findPotentialContactMatches(person, contacts, 0.5); // Lower threshold for better recall
      // Only add unique matches
      matches.forEach(match => {
        if (!allMatches.some(existingMatch => existingMatch.id === match.id)) {
          allMatches.push(match);
          if (match.reason) {
            console.debug(`[SuggestedContact] Reason for match:`, match);
          }
        }
      });
    });
    setSuggestedContactMatches(allMatches);
    setShowSuggestions(allMatches.length > 0);
  }, [contacts, transcript]);

  const identifyNewPeopleContacts = useCallback((peopleNames: string[]) => {
    // Merge nicknames and full names if needed
    const mergedPeopleNames = mergeNicknamesWithFullNames(peopleNames, transcript);
    if (!mergedPeopleNames?.length) return;
    
    // Get all current contacts (including newly created ones)
    const allContacts = contacts || [];
    
    // Find people who don't have matching contacts
    const unmatchedPeople = mergedPeopleNames.filter(personName => {
      // Check if this person has no match above threshold
      const matches = findPotentialContactMatches(personName, allContacts, 0.5);
      return matches.length === 0;
    });
    setNewPeopleToCreate(unmatchedPeople);
  }, [contacts, transcript]);

  // Relationship options for the user to choose from
  const relationshipOptions = [
    { value: 'Roommate', label: 'Roommate' },
    { value: 'Classmate', label: 'Classmate' },
    { value: 'Friend', label: 'Friend' },
    { value: 'Colleague', label: 'Colleague' },
    { value: 'Family', label: 'Family' },
    { value: 'Partner', label: 'Partner' },
    { value: 'Acquaintance', label: 'Acquaintance' },
    { value: 'Mentor', label: 'Mentor' },
    { value: 'Student', label: 'Student' },
    { value: 'Teacher', label: 'Teacher' },
    { value: 'Neighbor', label: 'Neighbor' },
    { value: 'Other', label: 'Other' }
  ];

  const processTranscript = useCallback(async () => {
    if (!transcript.trim()) return;

    setIsProcessingAi(true);
    setProcessedInputType(isListening || transcript !== manualMemoryText ? 'voice' : 'text');

    try {
      // Check AI parsing limits first
      const usageResponse = await fetch(`/api/user/usage?uid=${currentUser?.uid}`);
      if (usageResponse.ok) {
        const usageStats = await usageResponse.json();
        if (usageStats.plan === 'free' && usageStats.remaining.aiParsing <= 0) {
          toast({
            title: "AI Parsing Limit Reached",
            description: "You've used all your free AI parsing sessions this month. Upgrade to Pro for unlimited parsing.",
            variant: "destructive"
          });
          setIsProcessingAi(false);
          return;
        }
      }

      // Try Gemini CLI parsing first for enhanced contact extraction
      // Try Gemini CLI parsing first for enhanced contact extraction
      let geminiCliResult = null;
      let extractedNames: string[] = [];
      
      try {
        console.log('🚀 Starting Enhanced Contact Parsing (NLP + Gemini CLI)...');
        const response = await fetch('/api/ai/parse-with-gemini-cli', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: transcript,
            ownerId: currentUser?.uid
          })
        });

        if (response.ok) {
          const enhancedResult = await response.json();
          geminiCliResult = enhancedResult;
          setGeminiCliResult(enhancedResult);
          
          console.log('✅ Gemini CLI parsing successful:', {
            totalContacts: enhancedResult.contacts?.length || 0,
            confidence: enhancedResult.confidence,
            processingTime: enhancedResult.processingTime
          });
          console.log('✅ Gemini CLI parsing successful:', geminiCliResult);
          console.log('📊 Gemini CLI contacts (before filtering):', geminiCliResult.contacts);
          setIsUsingGeminiCli(true);
          
          // Filter contacts immediately after API call
          if (geminiCliResult.contacts && geminiCliResult.contacts.length > 0) {
            const originalCount = geminiCliResult.contacts.length;
            
            // Filter out non-person entities
            const nonPersonEntities = [
              'Comp Sci', 'Computer Science', 'Mankato University', 'Gustavus Alumni', 
              'Gustavus Adolphus', 'University', 'College', 'Major', 'Home', 'Minnesota',
              'Faribault', 'Currently', 'Goes', 'To', 'Also', 'Age', 'Year', 'Freshman',
              'Comp', 'Sci', 'Gustavus', 'Alumni', 'Mankato', 'University', 'Currently',
              'Minnesota', 'Faribault', 'Home'
            ];
            
            const filteredContacts = geminiCliResult.contacts.filter((contact: any) => {
              const name = contact.name || '';
              // Filter out non-person entities
              if (nonPersonEntities.some(entity => name.toLowerCase() === entity.toLowerCase())) {
                return false;
              }
              // Filter out if name contains non-person keywords
              if (nonPersonEntities.some(entity => name.toLowerCase().includes(entity.toLowerCase()) && name.length <= entity.length + 5)) {
                return false;
              }
              // Filter out organization patterns
              if (/\b(University|College|School|Alumni|Inc|Corp|LLC)\b/i.test(name)) {
                return false;
              }
              // Filter out single words that are too short or common
              if (name.split(' ').length === 1 && name.length < 4) {
                return false;
              }
              // Must have at least first and last name (two words)
              if (name.split(' ').filter((w: string) => w.length > 0).length < 2) {
                return false;
              }
              return true;
            });
            
            // Deduplicate by name (case insensitive)
            const uniqueContacts = filteredContacts.filter((contact: any, index: number, self: any[]) => {
              const currentName = contact.name.toLowerCase().trim();
              const firstIndex = self.findIndex((c: any) => c.name.toLowerCase().trim() === currentName);
              return index === firstIndex;
            });
            
            // Update geminiCliResult with filtered contacts for use in summary generation
            geminiCliResult.contacts = uniqueContacts;
            
            console.log('🔍 Filtered contacts:', {
              original: originalCount,
              filtered: uniqueContacts.length,
              removed: originalCount - uniqueContacts.length
            });
            
            const extractedPeople = uniqueContacts.map((contact: any) => contact.name);
            console.log('📋 People extracted via Gemini CLI (after filtering):', extractedPeople);

            // Store filtered Gemini CLI contacts for later creation (when Save Memory is clicked)
            console.log('🔍 Storing filtered Gemini CLI contacts:', uniqueContacts);
            setPendingGeminiCliContacts(uniqueContacts);
            console.log('🔍 Set pendingGeminiCliContacts to:', uniqueContacts);
            
            // Clear the new people list since they will be created when memory is saved
            setNewPeopleToCreate([]);
            
            // Set flag to indicate contacts were found by Gemini CLI
            setContactsCreatedByGeminiCli(true);
            console.log('✅ Set contactsCreatedByGeminiCli to true');
            
            // Find contact matches for existing contacts and show them
            findContactMatches(extractedPeople);
            
            // Also check if any of the filtered Gemini CLI contacts match existing contacts
            const existingMatches: any[] = [];
            uniqueContacts.forEach((contact: any) => {
              console.log(`🔍 Checking if "${contact.name}" matches existing contacts...`);
              const matches = findPotentialContactMatches(contact.name, contacts, 0.5);
              console.log(`🔍 Found ${matches.length} matches for "${contact.name}":`, matches);
              if (matches.length > 0) {
                existingMatches.push(...matches);
              }
            });
            
            console.log(`🔍 Total existing matches found:`, existingMatches);
            if (existingMatches.length > 0) {
              setSuggestedContactMatches(existingMatches);
              setShowSuggestions(true);
              console.log(`✅ Set suggested contacts:`, existingMatches);
            }
            
            toast({
              title: "Contacts Detected",
              description: `${uniqueContacts.length} new contact${uniqueContacts.length !== 1 ? 's' : ''} will be created when you save the memory.`
            });
            
            console.log('📋 Contacts stored for later creation:', uniqueContacts);
          } else {
            console.log('⚠️ Gemini CLI returned no contacts');
            setIsUsingGeminiCli(false);
          }
        } else {
          console.log('⚠️ Gemini CLI parsing failed, trying direct nickname detection');
          setIsUsingGeminiCli(false);
        }
      } catch (error) {
        console.log('⚠️ Gemini CLI parsing failed, trying direct nickname detection:', error);
        setIsUsingGeminiCli(false);
      }

      // If Gemini CLI failed, try direct nickname detection
      console.log('🔍 Checking if direct nickname detection should run:');
      console.log('  - geminiCliResult:', geminiCliResult);
      console.log('  - geminiCliResult?.contacts:', geminiCliResult?.contacts);
      console.log('  - geminiCliResult?.contacts?.length:', geminiCliResult?.contacts?.length);
      
      // Only run direct nickname detection if Gemini CLI completely failed (not just rate limited)
      // The direct nickname detection provides incorrect data, so we'll skip it
      if (!geminiCliResult || geminiCliResult.contacts.length === 0) {
        console.log('⚠️ Skipping direct nickname detection - it provides incorrect data');
        // Don't run direct nickname detection as it provides wrong data
        // Instead, we'll rely on the fallback processing below
      } else {
        console.log('✅ Gemini CLI already found contacts, skipping direct nickname detection');
      }

      // Apply Flair NLP parsing for enhanced contact extraction (fallback)
      let flairResult = null;
      if (!geminiCliResult) {
        try {
          const response = await fetch('/api/ai/parse-with-flair', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text: transcript }),
          });
          
          if (response.ok) {
            flairResult = await response.json();
            console.log('Flair NLP Parsing Result:', flairResult);
            console.log('Formatted Contact Info:', flairResult.formatted);
          } else {
            console.error('Flair parsing failed');
          }
          
        } catch (error) {
          console.error('Flair parsing failed, using fallback:', error);
        }
      }

      // Apply Whisper quick note transform as fallback
      const { formatted, note } = whisperQuickNoteTransform(transcript);
      console.log('Whisper Quick Note Output:', formatted, 'Note:', note);

      // Custom rule: If transcript contains 'X full name is Y', update contact X
      const fullNamePattern = /([A-Za-z\s\'\"]+)\s+full name is\s+([A-Za-z\s\'\"]+)/i;
      const match = transcript.match(fullNamePattern);
      if (match) {
        const nickname = match[1].replace(/\"/g, '').trim();
        const fullName = match[2].replace(/\"/g, '').trim();
        const contactToUpdate = contacts.find(c => c.name.toLowerCase() === nickname.toLowerCase());
        if (contactToUpdate && contactToUpdate.name !== fullName) {
          await updateContact(contactToUpdate.id, { name: fullName, nickname });
          console.debug(`[CustomFullNameRule] Updated contact '${nickname}' to name='${fullName}', nickname='${nickname}'`);
          setContacts(prev => prev.map(c => c.id === contactToUpdate.id ? { ...c, name: fullName, nickname } : c));
        }
      }

      // Use Gemini CLI result if available, otherwise fall back to standard processing
      let result;
      console.log('🔍 Processing result - geminiCliResult:', geminiCliResult);
      console.log('🔍 geminiCliResult.contacts:', geminiCliResult?.contacts);
      console.log('🔍 geminiCliResult.contacts?.length:', geminiCliResult?.contacts?.length);
      
      if (geminiCliResult && geminiCliResult.contacts && geminiCliResult.contacts.length > 0) {
        // Contacts are already filtered above, use them directly
        const uniqueContacts = geminiCliResult.contacts;
        
        console.log('🎯 Creating result from Gemini CLI data');
        console.log('  - Filtered contacts:', uniqueContacts.length);
        
        // Generate a more detailed summary based on the FILTERED contacts
        const contactDetails = uniqueContacts.map((contact: any) => {
          let details = contact.name;
          if (contact.nickname) details += ` (${contact.nickname})`;
          if (contact.occupation) details += ` - ${contact.occupation}`;
          if (contact.college) details += ` at ${contact.college}`;
          if (contact.hometown) details += ` from ${contact.hometown}`;
          if (contact.currentLocation) details += ` in ${contact.currentLocation}`;
          if (contact.birthday) details += ` - birthday ${contact.birthday}`;
          if (contact.interests && contact.interests.length > 0) details += ` - interests: ${contact.interests.join(', ')}`;
          return details;
        });
        
        // Create a natural summary
        let detailedSummary = '';
        if (uniqueContacts.length === 0) {
          detailedSummary = 'No valid contacts were found in this memory.';
        } else if (uniqueContacts.length === 1) {
          detailedSummary = `The memory describes ${contactDetails[0]}.`;
        } else {
          detailedSummary = `The memory describes ${contactDetails.slice(0, -1).join(', ')}, and ${contactDetails[contactDetails.length - 1]}.`;
        }
        
        if (uniqueContacts.length > 0) {
          detailedSummary += ` This information was processed using AI and ${uniqueContacts.length} contact${uniqueContacts.length !== 1 ? 's' : ''} will be created.`;
        }
        
        // Update geminiCliResult with filtered contacts for later use
        geminiCliResult.contacts = uniqueContacts;
        
        result = {
          summary: detailedSummary,
          extractedEntities: {
            people: uniqueContacts.map((c: any) => c.name),
            organizations: uniqueContacts.flatMap((c: any) => [c.company, c.college].filter(Boolean)),
            relationships: uniqueContacts.flatMap((c: any) => 
              c.relationships?.map((r: any) => `${c.name}'s ${r.type || r.customLabel || 'relationship'}: ${r.relatedPersonName || r.name}`) || []
            ),
            locations: [...new Set(uniqueContacts.flatMap((c: any) => [c.hometown, c.currentLocation].filter(Boolean)))],
            keyEvents: []
          }
        };
        console.log('📝 Created detailed result:', result);
        
        // Skip all fallback processing when Gemini CLI successfully parsed contacts
        console.log('✅ Skipping fallback processing - Gemini CLI successfully parsed contacts');
      } else {
        // Fallback to standard processing only if Gemini CLI didn't find contacts
        console.log('🔄 Using fallback processing - Gemini CLI did not find contacts');
        result = await processVoiceInput({ transcript });
        
        // Merge Flair results with the existing AI response
        if (flairResult) {
          // Merge the extracted entities, prioritizing Flair results for better categorization
          const mergedEntities = {
            ...result.extractedEntities,
            people: flairResult.names || result.extractedEntities?.people || [],
            relationships: flairResult.relationships?.map((r: any) => `${r.person} ${r.relation}`) || result.extractedEntities?.relationships || [],
            locations: flairResult.locations || result.extractedEntities?.locations || [],
            organizations: flairResult.organizations || result.extractedEntities?.organizations || [],
            occupations: flairResult.occupations || [],
            majors: flairResult.majors || [],
            keyEvents: flairResult.keyEvents || result.extractedEntities?.keyEvents || [],
            dates: flairResult.dates || result.extractedEntities?.dates || []
          };
          
          // Update the result with merged entities
          result.extractedEntities = mergedEntities;
        }
        
        // Only process contact matches in fallback mode
        if (result.extractedEntities?.people?.length) {
          // Check for nickname/full name pattern
          if (result.extractedEntities.people.length === 2) {
            // Assume the shorter name is the nickname, the longer is the full name
            const [p1, p2] = result.extractedEntities.people;
            const nickname = p1.length < p2.length ? p1 : p2;
            const fullName = p1.length < p2.length ? p2 : p1;
            // Try to find a contact with the nickname as name
            const contactToUpdate = contacts.find(c => c.name.toLowerCase() === nickname.toLowerCase());
            if (contactToUpdate && contactToUpdate.name !== fullName) {
              // Update the contact's name and set nickname
              await updateContact(contactToUpdate.id, { name: fullName, nickname });
              console.debug(`[AutoNameUpdate] Updated contact '${nickname}' to name='${fullName}', nickname='${nickname}'`);
              // Also update local state
              setContacts(prev => prev.map(c => c.id === contactToUpdate.id ? { ...c, name: fullName, nickname } : c));
            }
          }
          
          // Process contact matches in fallback mode
          findContactMatches(result.extractedEntities.people);
          identifyNewPeopleContacts(result.extractedEntities.people);
        }
      }
      
      setAiResponse(result as any);
      console.log('🎯 Set aiResponse:', result);
      console.log('🎯 aiResponse summary:', result.summary);
      console.log('🎯 aiResponse extractedEntities:', result.extractedEntities);
      
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
  }, [transcript, toast, findContactMatches, identifyNewPeopleContacts, isListening, manualMemoryText, contacts, updateContact, currentUser]);

  const handleVoiceInput = async () => {
    if (isListening) {
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.stop();
      }
      return;
    }

    try {
      const win = window as any;
      // Check if the browser supports the Web Speech API
      if (!win.webkitSpeechRecognition && !win.SpeechRecognition) {
        throw new Error("Your browser doesn't support speech recognition. Try Chrome or Edge.");
      }

      // Initialize the SpeechRecognition object
      const SpeechRecognition = win.webkitSpeechRecognition || win.SpeechRecognition;
      const recognition = new SpeechRecognition();
      speechRecognitionRef.current = recognition;

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      let finalTranscriptForProcessing = '';

      recognition.onresult = (event: any) => {
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

      recognition.onerror = (event: any) => {
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
      // Check if we have Gemini CLI data for this person
      const geminiContact = pendingGeminiCliContacts.find((contact: any) => 
        contact.name.toLowerCase() === personName.toLowerCase() ||
        contact.nickname?.toLowerCase() === personName.toLowerCase()
      );
      
      if (geminiContact) {
        // Use rich Gemini CLI data instead of basic pattern matching
        console.log('🎯 Using Gemini CLI data for contact creation:', geminiContact);
        
        // Determine if this is the main contact (the primary person being discussed)
        // The main contact is typically the first one mentioned or the one with the most details
        const isMainContact = pendingGeminiCliContacts.indexOf(geminiContact) === 0 || 
                            geminiContact.notes?.includes('main') ||
                            geminiContact.notes?.includes('roommate') ||
                            geminiContact.notes?.includes('freshman year');
        
        console.log(`🔍 Contact "${geminiContact.name}" isMainContact: ${isMainContact}`);
        
        const contactToCreate = {
          ownerId: currentUser.uid,
          name: geminiContact.name,
          email: geminiContact.email,
          phone: geminiContact.phone,
          occupation: geminiContact.occupation,
          company: geminiContact.company,
          college: geminiContact.college,
          birthday: geminiContact.birthday,
          birthYear: geminiContact.birthYear,
          age: geminiContact.age,
          hometown: geminiContact.hometown,
          currentLocation: geminiContact.currentLocation,
          nickname: geminiContact.nickname,
          // Only apply selected relationship to the main contact
          ownerRelationshipLabel: isMainContact ? (selectedRelationship || geminiContact.userRelationship) : geminiContact.userRelationship,
          notes: geminiContact.notes,
          tags: geminiContact.interests || [],
          // Only apply selected relationship category to the main contact
          category: isMainContact ? (selectedRelationship || geminiContact.userRelationship || 'Other') : (geminiContact.userRelationship || 'Other'),
          relationships: geminiContact.relationships?.map((rel: any) => {
            // Find the related contact by name
            const relatedContact = contacts.find(c => 
              c.name.toLowerCase() === rel.name.toLowerCase() ||
              (c.nickname && c.nickname.toLowerCase() === rel.name.toLowerCase())
            );
            
            if (relatedContact) {
              return {
                relatedContactId: relatedContact.id,
                type: rel.type,
                notes: rel.notes
              };
            } else {
              // If related contact doesn't exist yet, create a placeholder
              return {
                relatedContactId: null, // Will be updated later when contact is created
                type: rel.type,
                notes: `${rel.notes} (${rel.name})`
              };
            }
          }) || []
        };
        
        const created = await addContact(contactToCreate);
        if (created) {
          // Add to selected contacts (prevent duplicates)
          setSelectedContactIds(prev => 
            prev.includes(created.id) ? prev : [...prev, created.id]
          );
          // Update contacts list
          setContacts(prev => [...prev, created]);
          // Remove from new people list
          setNewPeopleToCreate(prev => prev.filter(name => name !== personName));
          
          toast({
            title: 'Contact Created',
            description: `${personName} has been added to your contacts with detailed information.`
          });
        }
        return;
      }
      
      // Fallback to basic pattern matching if no Gemini CLI data
      console.log('🔄 Using basic pattern matching for contact creation');
      
      // Extract additional information about this person
      const entities = aiResponse.extractedEntities;
      let college = '';
      let company = '';
      let location = '';
      let hometown = '';
      let relationships = [];
      let occupation = '';
      let birthday = '';
      let nickname = '';
      
      // Check for organizations that might be colleges or companies
      if (Array.isArray(entities?.organizations) && entities.organizations.length) {
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
      if (Array.isArray(entities?.locations) && entities.locations.length) {
        // Use the first location as current location, second as hometown if available
        location = entities.locations[0];
        if (entities.locations.length > 1) {
          hometown = entities.locations[1];
        }
      }
      
      // Try to determine relationships for this person
      if (Array.isArray(entities?.relationships) && entities.relationships.length) {
        // Look for relationships mentioning this person
        for (const rel of entities.relationships) {
          if (rel.toLowerCase().includes(personName.toLowerCase())) {
            // This relationship involves this person
            relationships.push(rel);
          }
        }
      }
      
      // In createContactFromMemory, extract nickname and full name if both are present in the memory
      // Create new contact with extracted information
      let contactName = personName;
      
      // If the personName is a short name and the memory or entities contain a full name, set as nickname
      if (Array.isArray(entities?.people) && entities.people.length > 1) {
        // Try to find a full name different from personName
        const fullName = entities.people.find(p => p !== personName && p.split(' ').length > 1);
        if (fullName) {
          nickname = personName;
          contactName = fullName;
        }
      }
      
      // Extract additional fields from the transcript using patterns
      const transcriptLower = transcript.toLowerCase();
      
      // Extract occupation
      const occupationPatterns = [
        /(?:is|works as|job is|occupation is)\s+([^,\.]+)/i,
        /(?:studies|majoring in|major is)\s+([^,\.]+)/i
      ];
      for (const pattern of occupationPatterns) {
        const match = transcript.match(pattern);
        if (match && match[1]) {
          occupation = match[1].trim();
          break;
        }
      }
      
      // Extract birthday/age
      const agePattern = /(?:age|years old)\s+(\d+)/i;
      const ageMatch = transcript.match(agePattern);
      if (ageMatch) {
        const age = parseInt(ageMatch[1]);
        const currentYear = new Date().getFullYear();
        const birthYear = currentYear - age;
        birthday = `${birthYear}-01-01`; // Default to January 1st
      }
      
      // Extract birthday date
      const birthdayPattern = /(?:birthday|born)\s+(?:is|on)\s+([^,\.]+)/i;
      const birthdayMatch = transcript.match(birthdayPattern);
      if (birthdayMatch && birthdayMatch[1]) {
        // Try to parse the birthday
        const dateStr = birthdayMatch[1].trim();
        // Simple date parsing - you might want to enhance this
        if (dateStr.includes('feb') || dateStr.includes('february')) {
          const dayMatch = dateStr.match(/(\d+)/);
          if (dayMatch) {
            const day = dayMatch[1].padStart(2, '0');
            birthday = `2001-02-${day}`; // Assuming year 2001 for now
          }
        }
      }
      
      // Determine if this is the main contact (the primary person being discussed)
      // The main contact is typically the first one mentioned or the one with the most details
      const isMainContact = newPeopleToCreate.indexOf(personName) === 0 || 
                          transcriptLower.includes('roommate') ||
                          transcriptLower.includes('freshman year');
      
      console.log(`🔍 Contact "${personName}" isMainContact: ${isMainContact}`);
      
      const newContact = await addContact({
        name: contactName,
        nickname,
        ownerId: currentUser.uid,
        college,
        company,
        occupation,
        currentLocation: location,
        hometown,
        birthday,
        // Only apply selected relationship to the main contact
        ownerRelationshipLabel: isMainContact ? (selectedRelationship || userRelationship) : userRelationship,
        tags: Array.isArray(entities?.keyEvents) ? entities.keyEvents.map(event => event.substring(0, 30)) : [],
        notes: aiResponse.summary,
        notableEvents: Array.isArray(entities?.keyEvents) ? entities.keyEvents.map(event => ({
          id: uuidv4(),
          title: event.substring(0, 50),
          date: new Date().toISOString().split('T')[0],
          description: event
        })) : [],
      });
      
      if (newContact?.id) {
        // Add the new contact to selected contacts (prevent duplicates)
        setSelectedContactIds(prev => 
          prev.includes(newContact.id) ? prev : [...prev, newContact.id]
        );
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
        description: `Failed to create contact for ${personName}.`,
        variant: 'destructive'
      });
    }
  };
  
  const updateContactsWithEvents = async () => {
    if (!selectedContactIds.length || !aiResponse?.extractedEntities) return;
    
    const entities = aiResponse.extractedEntities;
    if (!Array.isArray(entities?.keyEvents) || !entities.keyEvents.length) return;
    
    // For each selected contact, add events from the memory
    for (const contactId of selectedContactIds) {
      try {
        const contactToUpdate = contacts.find(c => c.id === contactId);
        if (!contactToUpdate) continue;
        
        // Create notable events from key events
        const notableEvents = Array.isArray(entities?.keyEvents) ? entities.keyEvents.map(event => ({
          id: uuidv4(),
          title: event.substring(0, 50),
          date: new Date().toISOString().split('T')[0],
          description: event
        })) : [];
        
        // Get existing events to avoid duplicates
        const existingEvents = Array.isArray(contactToUpdate?.notableEvents) ? contactToUpdate.notableEvents : [];
        
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
    if (!newPeopleToCreate.length || contactsCreatedByGeminiCli) return;
    
    for (const personName of newPeopleToCreate) {
      await createContactFromMemory(personName);
    }
  };

  // Handler for clicking on the memory saved toast
  const onMemoryClick = (memory: any) => {
    // For now, just alert or log; replace with navigation/modal as needed
    alert(`Memory ID: ${memory?.id || 'unknown'}\nSummary: ${memory?.summary || ''}`);
    // Example: router.push(`/memories/${memory.id}`) or open modal
  };

  const handleSaveMemory = async () => {
    if (!currentUser) {
      toast({title: "Not Logged In", description: "Please log in to save memories.", variant: "destructive"});
      return;
    }
    // Use the actual user input as the content, not the AI processing result
    const contentToSave = transcript || manualMemoryText;
    const originalContent = transcript || manualMemoryText;
    if (!contentToSave || !contentToSave.trim()) {
      toast({ title: "No Memory Captured", description: "Please record or type and process a memory first.", variant: "destructive"});
      return;
    }
    setIsSaving(true);
    try {
      // Always save to journal first
      const res = await fetch('/api/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerId: currentUser.uid,
          summary: contentToSave,
          originalContent,
          timestamp: new Date().toISOString(),
          linkedContactIds: selectedContactIds,
          tags: Array.isArray((aiResponse as any)?.extractedEntities?.tags) ? (aiResponse as any).extractedEntities.tags : [],
          category: (aiResponse as any)?.category || 'General Memory',
        })
      });
      if (!res.ok) throw new Error('Failed to save journal entry');
      // If journal only, skip parsing/updating contact
      if (saveToJournalOnly) {
        toast({ title: "Journal Entry Saved", description: "Your memory was saved to your journal." });
        onOpenChange(false);
        onMemorySaved?.();
        return;
      }

      // Try advanced NLP parsing first
      let advancedResult = null;
      try {
        console.log('🚀 Attempting advanced NLP parsing...');
        const advancedResponse = await fetch('/api/ai/parse-with-flair', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: contentToSave })
        });

        if (advancedResponse.ok) {
          advancedResult = await advancedResponse.json();
          setStructuredNlpResult(advancedResult);
          console.log('✨ Advanced NLP Result:', advancedResult);
          // Use advancedResult.contacts to update contacts, new people, and relationships as needed
          // (You can add logic here to update your UI or state with the parsed contacts)
        }
      } catch (advancedError) {
        console.log('⚠️ Advanced NLP failed, falling back to basic processing:', advancedError);
      }

      // 1. Handle pending Gemini CLI contacts - only create if no existing contacts are selected
      console.log('🔍 Save Memory Debug:');
      console.log('  - pendingGeminiCliContacts.length:', pendingGeminiCliContacts.length);
      console.log('  - contactsCreatedByGeminiCli:', contactsCreatedByGeminiCli);
      console.log('  - selectedContactIds:', selectedContactIds);
      console.log('  - saveToJournalOnly:', saveToJournalOnly);
      
      if (pendingGeminiCliContacts.length > 0) {
        console.log('🚀 Processing pending Gemini CLI contacts:', pendingGeminiCliContacts);
        
        // First, try to find and update existing contacts
        const updatedContacts = [];
        const newContacts = [];
        
        for (const contactData of pendingGeminiCliContacts) {
          console.log('🔍 Processing contact data:', contactData);
          console.log('🔍 Contact name:', contactData.name);
          console.log('🔍 Contact nickname:', contactData.nickname);
          
          // Check if this contact has a nickname (indicating it should update an existing contact)
          if (contactData.nickname) {
            console.log(`🔍 Contact "${contactData.name}" has nickname "${contactData.nickname}", looking for existing contact...`);
            
            // Look for existing contact with the same first name
            const existingContact = contacts.find(c => {
              const existingNameParts = c.name.split(' ');
              const match = existingNameParts[0].toLowerCase() === contactData.name.toLowerCase();
              console.log(`🔍 Checking "${c.name}" against "${contactData.name}": ${match}`);
              return match;
            });
            
            if (existingContact) {
              console.log(`✅ Found existing contact "${existingContact.name}" to update with nickname "${contactData.nickname}"`);
              
              // Update the existing contact
              const updateFields: Partial<Contact> = {};
              
              if (contactData.nickname && contactData.nickname.trim()) {
                updateFields.nickname = contactData.nickname;
                console.log('🔄 Adding nickname:', contactData.nickname);
              }
              
              if (contactData.notes && contactData.notes.trim()) {
                updateFields.notes = contactData.notes;
                console.log('🔄 Adding notes:', contactData.notes);
              }
              
              if (contactData.interests && contactData.interests.length > 0) {
                const existingTags = existingContact.tags || [];
                const newTags = contactData.interests.filter((interest: any) => 
                  !existingTags.some(tag => tag.toLowerCase() === interest.toLowerCase())
                );
                if (newTags.length > 0) {
                  updateFields.tags = [...existingTags, ...newTags];
                  console.log('🔄 Adding interests:', newTags);
                }
              }
              
              if (Object.keys(updateFields).length > 0) {
                console.log('🔄 Updating existing contact with fields:', updateFields);
                try {
                  await updateContact(existingContact.id, updateFields);
                  console.log('✅ Contact updated successfully');
                  updatedContacts.push(existingContact.name);
                  
                  // Add to selected contacts if not already selected
                  if (!selectedContactIds.includes(existingContact.id)) {
                    addToSelectedContacts(existingContact.id);
                  }
                  
                  toast({
                    title: "Contact Updated",
                    description: `Updated ${existingContact.name} with nickname "${contactData.nickname}" and new information.`
                  });
                } catch (error) {
                  console.error('Error updating contact:', error);
                }
              } else {
                console.log('⚠️ No fields to update for contact:', existingContact.name);
              }
            } else {
              console.log(`❌ No existing contact found for "${contactData.name}", will create new contact`);
              newContacts.push(contactData);
            }
          } else {
            // No nickname, treat as new contact
            console.log(`🔍 Contact "${contactData.name}" has no nickname, treating as new contact`);
            newContacts.push(contactData);
          }
        }
        
        // Create new contacts if any - allow creation even if existing contacts are selected
        if (newContacts.length > 0) {
          console.log('🚀 Creating new contacts:', newContacts);
          console.log('🔍 Full pendingGeminiCliContacts data:', pendingGeminiCliContacts);
          console.log('🔍 Number of contacts to create:', newContacts.length);
          console.log('🔍 selectedContactIds:', selectedContactIds);
          
          const createdContacts: any[] = [];
          for (const contactData of newContacts) {
            try {
              console.log('🔍 Creating contact with data:', contactData);
              console.log('🔍 Contact data fields:');
              console.log('  - name:', contactData.name);
              console.log('  - age:', contactData.age);
              console.log('  - major:', contactData.major);
              console.log('  - hometown:', contactData.hometown);
              console.log('  - currentLocation:', contactData.currentLocation);
              console.log('  - notes:', contactData.notes);
              console.log('  - relationships:', contactData.relationships);
              
              // Determine if this is the main contact (the primary person being discussed)
              // The main contact is typically the first one mentioned or the one with the most details
              const isMainContact = newContacts.indexOf(contactData) === 0 || 
                                  contactData.notes?.includes('main') ||
                                  contactData.notes?.includes('roommate') ||
                                  contactData.notes?.includes('freshman year');
              
              console.log(`🔍 Contact "${contactData.name}" isMainContact: ${isMainContact}`);
              
              // Convert age to birthYear if available
              let birthYear = contactData.birthYear;
              if (contactData.age && !birthYear) {
                const currentYear = new Date().getFullYear();
                birthYear = (currentYear - parseInt(contactData.age)).toString();
              }
              
              const contactToCreate = {
                ownerId: currentUser.uid,
                name: contactData.name,
                email: contactData.email,
                phone: contactData.phone,
                occupation: contactData.occupation,
                company: contactData.company,
                college: contactData.college,
                major: contactData.major,
                birthday: contactData.birthday,
                birthYear: birthYear,
                hometown: contactData.hometown,
                currentLocation: contactData.currentLocation,
                nickname: contactData.nickname,
                // Only apply selected relationship to the main contact
                ownerRelationshipLabel: isMainContact ? (selectedRelationship || contactData.userRelationship) : contactData.userRelationship,
                notes: contactData.notes,
                tags: contactData.interests || [],
                // Only apply selected relationship category to the main contact
                category: isMainContact ? (selectedRelationship || 'Other') : 'Other',
                // Don't include relationships here - we'll handle them separately after contact creation
                relationships: [],
                height: contactData.height,
                eyeColor: contactData.eyeColor,
                hairColor: contactData.hairColor,
                bodyType: contactData.bodyType,
                dressingStyle: contactData.dressingStyle
              };
              
              const created = await addContact(contactToCreate);
              if (created) {
                createdContacts.push(created);
                addToSelectedContacts(created.id);
                
                // Now handle relationships for this contact
                if (contactData.relationships && contactData.relationships.length > 0) {
                  console.log(`🔗 Processing relationships for contact: ${contactData.name}`);
                  console.log(`🔗 Number of relationships to process: ${contactData.relationships.length}`);
                  console.log(`🔗 Relationships:`, contactData.relationships);
                  
                  for (const relationship of contactData.relationships) {
                    try {
                      // Find or create the related contact
                      let relatedContact = contacts.find((c: any) => 
                        c.name.toLowerCase() === relationship.name.toLowerCase() ||
                        c.nickname?.toLowerCase() === relationship.name.toLowerCase()
                      );
                      
                      console.log(`🔗 Looking for related contact: "${relationship.name}"`);
                      console.log(`🔗 Found existing contact:`, relatedContact ? relatedContact.name : 'None');
                      
                      if (!relatedContact) {
                        // Create the related contact if it doesn't exist
                        console.log('🔗 Creating related contact:', relationship.name);
                        const relatedContactData = {
                          ownerId: currentUser.uid,
                          name: relationship.name,
                          category: 'Other',
                          ownerRelationshipLabel: 'Other',
                          notes: `Mentioned in relationship to ${contactData.name}`,
                          tags: [],
                          photosTogether: [],
                          relationships: [],
                          notableEvents: []
                        };
                        
                        const createdRelatedContact = await addContact(relatedContactData);
                        if (createdRelatedContact) {
                          relatedContact = createdRelatedContact;
                          console.log('✅ Created related contact:', relatedContact.name);
                        }
                      }
                      
                      if (relatedContact) {
                        // Create bidirectional relationship
                        console.log('🔗 Creating bidirectional relationship between', contactData.name, 'and', relatedContact.name);
                        
                        // Add relationship to main contact
                        const mainContactRelationship = {
                          relatedContactId: (relatedContact as any).id || (relatedContact as any)._id,
                          type: relationship.type,
                          notes: relationship.notes || `${relationship.type} of ${contactData.name}`
                        };
                        
                        // Add relationship to related contact
                        const relatedContactRelationship = {
                          relatedContactId: created.id,
                          type: relationship.type,
                          notes: relationship.notes || `${relationship.type} of ${relatedContact.name}`
                        };
                        
                        // Update both contacts with the relationships
                        await updateContact(created.id, {
                          relationships: [...(created.relationships || []), mainContactRelationship]
                        });
                        
                        await updateContact((relatedContact as any).id || (relatedContact as any)._id, {
                          relationships: [...(relatedContact.relationships || []), relatedContactRelationship]
                        });
                        
                        console.log('✅ Created bidirectional relationship');
                      }
                    } catch (error) {
                      console.error('❌ Error creating relationship:', error);
                    }
                  }
                }
              }
            } catch (error) {
              console.error('Error creating contact:', error);
            }
          }
          
          console.log('🔍 Contact creation results:');
          console.log('  - createdContacts.length:', createdContacts.length);
          console.log('  - updatedContacts:', updatedContacts);
          console.log('  - createdContacts:', createdContacts.map(c => c.name));
          
          if (createdContacts.length > 0) {
            setContacts(prev => [...prev, ...createdContacts]);
            toast({
              title: "Contacts Created",
              description: `Created ${createdContacts.length} new contacts.`
            });
          }
        }
        
        // Show summary
        if (updatedContacts.length > 0) {
          console.log('✅ Updated contacts:', updatedContacts);
        }
        if (newContacts.length > 0) {
          console.log('✅ New contacts to create:', newContacts.length);
        }
      }
      
        // 2. If a contact is selected, apply memory-based update/correction (await all updates)
  if (selectedContactIds.length > 0 && aiResponse?.extractedEntities) {
    console.log('🔄 Updating selected contacts with memory information...');
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

  // 3. Process existing contacts to extract basic information from notes (only if explicitly triggered)
  // This will be called when user asks for basic information about a contact

  // Helper function to extract basic information from existing contact notes
  const extractBasicInfoFromContact = async (contact: Contact) => {
    if (contact.notes && typeof contact.notes === 'string' && 
        (!contact.height && !contact.eyeColor && !contact.hairColor && !contact.bodyType && !contact.dressingStyle)) {
      console.log(`🔄 Extracting basic information from ${contact.name}'s notes...`);
      await applyMemoryUpdateToContact('', { people: [], phone: [], email: [], occupation: [], company: [], locations: [], dates: [], relationships: [] } as any, contact, updateContact, toast);
    }
  };
      
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
      if (selectedContactIds.length > 0 && Array.isArray(aiResponse?.extractedEntities?.keyEvents) && aiResponse.extractedEntities.keyEvents.length > 0) {
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
      onMemorySaved?.();
    } catch (error) {
      console.error("Error saving memory:", error);
      toast({ title: "Save Error", description: "Failed to save memory to database.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  // Helper function to ensure selectedContactIds is always unique
  const addToSelectedContacts = (contactId: string) => {
    setSelectedContactIds(prev => {
      const uniqueIds = [...new Set(prev)];
      return uniqueIds.includes(contactId) ? uniqueIds : [...uniqueIds, contactId];
    });
  };

  const toggleContactSelection = (contactId: string) => {
    setSelectedContactIds(prev => {
      // First, ensure we have a unique array
      const uniqueIds = [...new Set(prev)];
      
      // Check if the contact is already selected
      if (uniqueIds.includes(contactId)) {
        // Remove it
        return uniqueIds.filter(id => id !== contactId);
      } else {
        // Add it
        return [...uniqueIds, contactId];
      }
    });
  };

  const SelectedContactsList = () => {
    if (selectedContactIds.length === 0) return null;
    
    // Remove duplicates from selectedContactIds
    const uniqueContactIds = [...new Set(selectedContactIds)];
    
    return (
      <div className="mt-2">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs font-medium">Linked Contacts:</p>
          <p className="text-xs text-muted-foreground">
            {pendingGeminiCliContacts.length > 0 ? "Will update existing contacts" : "Will be updated with memory"}
          </p>
        </div>
        <div className="flex flex-wrap gap-1">
          {uniqueContactIds.map((contactId, index) => {
            const contact = contacts.find(c => c.id === contactId);
            return (
              <Badge 
                key={`selected-contact-${contactId}`} 
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
        const entities = aiResponse.extractedEntities as any;
        const value = Array.isArray(entities?.[field.key]) ? entities[field.key][0] : null;
        if (value && 'birthday' in contact && (contact as any)[field.key] !== value) {
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
    
    // Deduplicate suggested contacts by ID
    const uniqueMatches = suggestedContactMatches.filter((match, index, self) => 
      index === self.findIndex(m => m.id === match.id)
    );
    
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
          {uniqueMatches.map((match, index) => {
            const isSelected = selectedContactIds.includes(match.id);
            return (
              <Badge 
                key={`${match.id}-${index}`} 
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
    console.log('🔍 NewContactsSection render:', {
      contactsCreatedByGeminiCli,
      pendingGeminiCliContacts: pendingGeminiCliContacts.length,
      newPeopleToCreate: newPeopleToCreate.length
    });
    
    // Add visible debugging
    const debugInfo = (
      <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-950/20 border rounded text-xs">
        <strong>Debug Info:</strong><br/>
        contactsCreatedByGeminiCli: {contactsCreatedByGeminiCli ? 'true' : 'false'}<br/>
        pendingGeminiCliContacts.length: {pendingGeminiCliContacts.length}<br/>
        newPeopleToCreate.length: {newPeopleToCreate.length}
      </div>
    );
    
    // If Gemini CLI found contacts, show them as pending instead of manual creation
    if (contactsCreatedByGeminiCli && pendingGeminiCliContacts.length > 0) {
      console.log('🔍 Showing Gemini CLI contacts:', pendingGeminiCliContacts);
      
      // Filter out non-person entities and deduplicate
      const nonPersonEntities = [
        'Comp Sci', 'Computer Science', 'Mankato University', 'Gustavus Alumni', 
        'Gustavus Adolphus', 'University', 'College', 'Major', 'Home', 'Minnesota',
        'Faribault', 'Currently', 'Goes', 'To', 'Also', 'Age', 'Year', 'Freshman'
      ];
      
      const filteredContacts = pendingGeminiCliContacts.filter((contact: any) => {
        const name = contact.name || '';
        return !nonPersonEntities.some(entity => 
          name.toLowerCase().includes(entity.toLowerCase())
        );
      });
      
      // Deduplicate by name (case insensitive and handle slight variations)
      const uniqueContacts = filteredContacts.filter((contact: any, index: number, self: any[]) => {
        const currentName = contact.name.toLowerCase().trim();
        const firstIndex = self.findIndex((c: any) => {
          const otherName = c.name.toLowerCase().trim();
          // Exact match or very similar names (handle slight spelling variations)
          return otherName === currentName || 
                 otherName.includes(currentName) || 
                 currentName.includes(otherName);
        });
        return index === firstIndex;
      });
      
      console.log('🔍 Filtered and deduplicated contacts:', uniqueContacts);
      
      return (
        <div className="mt-3 border p-3 rounded-md bg-green-50/50 dark:bg-green-950/20">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-medium text-sm flex items-center">
              <UserPlus className="h-4 w-4 mr-1 text-green-500" />
              Contacts Ready to Create
            </h4>
          </div>
          <p className="text-xs text-muted-foreground mb-2">
            These contacts will be created when you save the memory:
          </p>
          <div className="flex flex-wrap gap-1 mt-1">
            {uniqueContacts.map((contact: any, index: number) => (
              <Badge 
                key={`contact-${index}-${contact.name}`} 
                variant="outline"
                className="px-3 py-1 border-green-200 dark:border-green-800"
              >
                {contact.name}
                {contact.nickname && ` (${contact.nickname})`}
              </Badge>
            ))}
          </div>
        </div>
      );
    }
    
    // If Gemini CLI didn't find contacts, show manual creation
    if (newPeopleToCreate.length > 0) {
      console.log('🔍 Manual creation:', newPeopleToCreate);
      return (
        <div className="mt-3 border p-3 rounded-md bg-yellow-50/50 dark:bg-yellow-950/20">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-medium text-sm flex items-center">
              <UserPlus className="h-4 w-4 mr-1 text-yellow-500" />
              New Contacts to Create
            </h4>
          </div>
          <p className="text-xs text-muted-foreground mb-2">
            These contacts will be created manually:
          </p>
          <div className="flex flex-wrap gap-1 mt-1">
            {newPeopleToCreate.map((name, index) => (
              <Badge 
                key={`new-contact-${index}`} 
                variant="outline"
                className="px-3 py-1 border-yellow-200 dark:border-yellow-800"
              >
                {name}
              </Badge>
            ))}
          </div>
        </div>
      );
    }
    
    return null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent container={container} className="w-[92%] max-w-[420px] max-h-[85vh] overflow-y-auto rounded-3xl p-4 sm:p-5 bg-[#FAF7F4] dark:bg-background border border-[rgba(26,15,6,0.08)]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="font-serif text-2xl font-bold text-[#1A0F06] dark:text-foreground">
              Add Memory
            </DialogTitle>
            {/* Mode Switcher Tabs */}
            <div className="flex bg-[#EDE8E3] dark:bg-muted p-1 rounded-full text-xs font-semibold shrink-0 mr-6">
              <button
                type="button"
                onClick={() => setInputMode('voice')}
                title="Voice Input"
                aria-label="Voice Input"
                className={`p-2 rounded-full transition-all flex items-center justify-center ${
                  inputMode === 'voice' 
                    ? 'bg-white dark:bg-card text-[#C4622D] shadow-sm' 
                    : 'text-[#8C7B6B] hover:text-[#1A0F06]'
                }`}
              >
                <Mic className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setInputMode('text')}
                title="Note Typing"
                aria-label="Note Typing"
                className={`p-2 rounded-full transition-all flex items-center justify-center ${
                  inputMode === 'text' 
                    ? 'bg-white dark:bg-card text-[#C4622D] shadow-sm' 
                    : 'text-[#8C7B6B] hover:text-[#1A0F06]'
                }`}
              >
                <Type className="h-4 w-4" />
              </button>
            </div>
          </div>
          <DialogDescription className="text-xs text-[#8C7B6B] dark:text-muted-foreground mt-1">
            {inputMode === 'voice' 
              ? "Record a voice memory (hold button down to switch to Note Typing)."
              : "Type notes directly below and tap 'Process Text' for AI parsing."}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 pt-2">
          {/* Voice Input Section */}
          {inputMode === 'voice' ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-[#B0A090] tracking-wider uppercase font-sans">VOICE CAPTURE</h3>
                <div className="flex items-center space-x-2">
                  {isListening && (
                    <div className="flex items-center space-x-1 text-red-500">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-xs font-semibold">Listening...</span>
                    </div>
                  )}
                  {isRecording && (
                    <div className="flex items-center space-x-1 text-red-500">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-xs font-semibold">Recording...</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={(e) => {
                    if (isLongPressRef.current) return;
                    handleVoiceInput();
                  }}
                  onMouseDown={handleStartPress}
                  onMouseUp={handleEndPress}
                  onTouchStart={handleStartPress}
                  onTouchEnd={handleEndPress}
                  disabled={isListening || isRecording || isProcessing}
                  className="flex-1 rounded-2xl py-6 bg-[#C4622D] hover:bg-[#A84F20] text-white font-semibold text-sm shadow-md"
                >
                  {isListening ? (
                    <>
                      <Mic className="mr-2 h-4 w-4 animate-pulse text-white" />
                      Stop Listening
                    </>
                  ) : (
                    <>
                      <Mic className="mr-2 h-4 w-4" />
                      Hold or Click to Speak
                    </>
                  )}
                </Button>

                <Button
                  onClick={() => setInputMode('text')}
                  variant="outline"
                  className="rounded-2xl border-[rgba(26,15,6,0.12)] text-[#5A4535] hover:bg-[#FAEEE5]"
                  title="Switch to direct Note Typing mode"
                >
                  <Type className="h-4 w-4" />
                </Button>
              </div>

              <p className="text-[11px] text-[#B0A090] text-center italic">
                💡 Tip: Press & hold the Voice button to switch directly to Note Typing.
              </p>

              {transcript && (
                <div className="p-3.5 bg-white dark:bg-card rounded-2xl border border-[rgba(26,15,6,0.08)] shadow-sm">
                  <p className="text-xs font-semibold text-[#8C7B6B] mb-1">Transcript:</p>
                  <p className="text-sm text-[#1A0F06] dark:text-foreground">{transcript}</p>
                </div>
              )}
            </div>
          ) : (
            /* Direct Note Typing Section */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="manualMemoryText" className="text-xs font-bold text-[#B0A090] tracking-wider uppercase font-sans">
                  TYPE MEMORY NOTE
                </Label>
                <span className="text-[11px] text-[#C4622D] font-medium">Direct AI Parsing</span>
              </div>
              <Textarea
                id="manualMemoryText"
                value={manualMemoryText}
                onChange={(e) => setManualMemoryText(e.target.value)}
                placeholder="Type your memory note here (e.g. 'Met Sarah Williams for coffee, she moved to Greenpoint and her birthday is July 26th')..."
                className="min-h-[120px] rounded-2xl border-[rgba(26,15,6,0.12)] p-3 text-sm focus:border-[#C4622D] bg-white dark:bg-card"
                autoFocus
              />
              <Button
                onClick={handleProcessManualText}
                disabled={isProcessing || !manualMemoryText.trim()}
                className="w-full rounded-2xl bg-[#C4622D] hover:bg-[#A84F20] text-white font-semibold py-3 shadow-md"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Parsing Note with AI...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Process & Extract Facts
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Processing Status */}
          {isProcessing && (
            <div className="flex items-center space-x-2 text-blue-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Processing memory...</span>
            </div>
          )}

          {/* AI Response */}
          {aiResponse?.summary && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-md">
              <p className="text-sm font-medium mb-2">AI Analysis:</p>
              <p className="text-sm">{aiResponse.summary}</p>
            </div>
          )}
          
          {/* Enhanced Contact Analysis */}
          {geminiCliResult?.contacts && geminiCliResult.contacts.length > 0 && (
            <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-md">
              <p className="text-sm font-medium mb-2">Contact Analysis:</p>
              <p className="text-sm">
                Found {geminiCliResult.contacts.length} contacts: {geminiCliResult.contacts.map((c: any) => c.name).join(', ')}
              </p>
              {geminiCliResult.contacts.map((contact: any, index: number) => (
                <div key={index} className="mt-2 text-xs">
                  <strong>{contact.name}</strong>
                  {contact.age && ` (Age: ${contact.age})`}
                  {contact.major && ` - ${contact.major} major`}
                  {contact.hometown && ` - From ${contact.hometown}`}
                  {contact.currentLocation && ` - Currently at ${contact.currentLocation}`}
                  {contact.notes && ` - ${contact.notes}`}
                </div>
              ))}
            </div>
          )}

          {/* Suggested Contacts */}
          <SuggestedContacts />

          {/* New Contacts Section */}
          <NewContactsSection />

          {/* Selected Contacts */}
          {selectedContactIds.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Selected Contacts:</h4>
              <SelectedContactsList />
            </div>
          )}

          {/* Contact Selector */}
          {contactSelectorOpen && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Select Contacts</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setContactSelectorOpen(false)}
                >
                  Done
                </Button>
              </div>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {contacts.map((contact) => (
                  <div
                    key={contact.id}
                    className={`flex items-center space-x-2 p-2 rounded cursor-pointer hover:bg-muted ${
                      selectedContactIds.includes(contact.id) ? 'bg-primary/10' : ''
                    }`}
                    onClick={() => toggleContactSelection(contact.id)}
                  >
                    <Checkbox
                      checked={selectedContactIds.includes(contact.id)}
                      onChange={() => toggleContactSelection(contact.id)}
                    />
                    <span className="text-sm">{contact.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New Contact Creation */}
          {showManualInput && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <h4 className="text-sm font-medium">Create New Contact</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowManualInput(false)}
                >
                  Cancel
                </Button>
              </div>
              <div className="space-y-2">
                <Label htmlFor="newContactName">Contact Name</Label>
                <input
                  id="newContactName"
                  value={newContactName}
                  onChange={(e) => setNewContactName(e.target.value)}
                  placeholder="Enter contact name"
                  className="w-full px-3 py-2 border rounded-md"
                />
                <Button
                  onClick={handleCreateContact}
                  disabled={!newContactName.trim() || isCreatingContact}
                  className="w-full"
                >
                  {isCreatingContact ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Contact'
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Save Options */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="saveToJournalOnly"
                checked={saveToJournalOnly}
                onCheckedChange={(checked) => setSaveToJournalOnly(!!checked)}
              />
              <Label htmlFor="saveToJournalOnly">Save to journal only (no contact updates)</Label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={handleSaveMemory}
            disabled={isSaving || (!manualMemoryText.trim() && !transcript)}
            className="w-full"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Memory'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
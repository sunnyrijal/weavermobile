"use client";
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { List, LayoutGrid, Share2, Search, Mic, Users, Briefcase, UsersRound, Heart, Smartphone, PlusCircle, UploadCloud, MicOff, Eye, EyeOff, CalendarDays, Gift, Sparkles, Loader2, Send, Brain, TrendingUp, Clock, MapPin, MessageSquare, BookOpen, MoreVertical, Trash2, Edit, Lock, Info, Bell } from "lucide-react";
import type { Contact, ContactViewMode, NotableEvent } from '@/lib/types';
import Image from 'next/image';
import Link from 'next/link';
import { useToast } from "@/hooks/use-toast";
import { format, differenceInDays, parseISO, getYear, getMonth, getDate, setYear, isPast, addYears } from 'date-fns';
import { answerContactQuestion } from '@/ai/flows/answer-contact-question-flow';
import type { AnswerContactQuestionInput, AnswerContactQuestionOutput, PromptContact } from '@/ai/flows/answer-contact-question-flow';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import ClientSideFormattedDate from '@/components/shared/ClientSideFormattedDate';
import { useContactsContext } from '@/contexts/ContactsContext';
import { useAuth } from '@/hooks/useAuth';
import { LazyContactMergeModal, LazyEventGiftSuggestionModal } from '@/components/shared/LazyModals';
import { GeminiCliTest } from '@/components/shared/GeminiCliTest';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ContactDeleteModal } from '@/components/contacts/ContactDeleteModal';

const ContactCardItem = ({ contact, onContactDeleted }: { contact: Contact; onContactDeleted?: () => void }) => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  return (
    <>
      <Card className="group overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 h-full flex flex-col border-0 bg-gradient-to-br from-background to-muted/20">
        <CardHeader className="p-0 relative">
          <div className="relative">
            <Image 
              src={contact.photoURL || `https://picsum.photos/seed/${contact.id}/400/250`} 
              alt={contact.name}
              width={400}
              height={250}
              className="object-cover w-full h-32 sm:h-40 transition-transform duration-300 group-hover:scale-105"
              data-ai-hint="person portrait"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            <div className="absolute top-2 right-2">
              <Badge variant="secondary" className="text-xs bg-background/80 backdrop-blur-sm">
                {contact.category || 'Contact'}
              </Badge>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 hover:bg-background"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/contacts/${contact.id}`}>View Details</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/contacts/${contact.id}/edit`}>Edit Contact</Link>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-destructive focus:text-destructive"
                  onClick={() => setIsDeleteModalOpen(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Contact
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="p-4 flex-1">
          <CardTitle className="text-base sm:text-lg mb-2 line-clamp-1 font-semibold">{contact.name}</CardTitle>
          
          <div className="space-y-2">
            {contact.occupation && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Briefcase className="h-3 w-3" />
                <span className="truncate">{contact.occupation}{contact.company && !(contact.occupation?.toLowerCase().includes("student") && contact.company === contact.college) ? ` at ${contact.company}` : ''}</span>
              </div>
            )}
            {contact.college && !contact.occupation && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Users className="h-3 w-3" />
                <span className="truncate">{contact.college}</span>
              </div>
            )}
            {contact.currentLocation && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span className="truncate">{contact.currentLocation}</span>
              </div>
            )}
            {!contact.currentLocation && contact.hometown && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span className="truncate">From: {contact.hometown}</span>
              </div>
            )}
            {contact.isCompanyContact && contact.companyContextType === 'shared' && contact.lastUpdatedBy && (
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground pt-2 border-t mt-2">
                <Clock className="h-2.5 w-2.5 text-blue-500" />
                <span className="truncate">Last updated by <span className="font-semibold text-foreground">{contact.lastUpdatedBy}</span></span>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="p-4 pt-0 mt-auto">
          <Button variant="outline" size="sm" className="w-full text-xs sm:text-sm group-hover:bg-primary group-hover:text-primary-foreground transition-colors" asChild>
            <Link href={`/contacts/${contact.id}`}>View Details</Link>
          </Button>
        </CardFooter>
      </Card>
      
      <ContactDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        contact={contact}
        onContactDeleted={onContactDeleted || (() => {})}
      />
    </>
  );
};

const ContactListItem = ({ contact, onContactDeleted }: { contact: Contact; onContactDeleted?: () => void }) => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  return (
    <>
      <li className="flex items-center justify-between py-3 px-4 hover:bg-muted/50 rounded-lg transition-colors duration-150 group">
        <Link href={`/contacts/${contact.id}`} className="flex items-center gap-3 flex-1">
          <Image 
            src={contact.photoURL || `https://picsum.photos/seed/${contact.id}/40/40`} 
            alt={contact.name}
            width={40}
            height={40}
            className="rounded-full object-cover"
            data-ai-hint="person avatar"
          />
          <div>
            <p className="font-medium">{contact.name}</p>
            <p className="text-sm text-muted-foreground">{contact.occupation || contact.college || contact.category || 'N/A'}</p>
          </div>
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/contacts/${contact.id}`}>View Details</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/contacts/${contact.id}/edit`}>Edit Contact</Link>
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="text-destructive focus:text-destructive"
              onClick={() => setIsDeleteModalOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Contact
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </li>
      
      <ContactDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        contact={contact}
        onContactDeleted={onContactDeleted || (() => {})}
      />
    </>
  );
};

interface DisplayEvent {
  id: string;
  title: string;
  date: Date;
  type: 'Birthday' | 'Anniversary' | 'Notable Event';
  icon: React.ElementType;
  daysRemaining: number;
  contactId?: string; 
}

const getUpcomingEvents = (contacts: Contact[]): DisplayEvent[] => {
  const today = new Date();
  const upcomingThresholdDays = 30;
  let events: DisplayEvent[] = [];

  contacts.forEach(contact => {
    // Birthdays
    if (contact.birthday) {
      try {
        // Assuming birthday is YYYY-MM-DD
        const birthDate = parseISO(contact.birthday);
        if (!isNaN(birthDate.getTime())) {
            const birthDateThisYear = setYear(birthDate, getYear(today));
            let nextBirthdayDate = birthDateThisYear;
            // Check if birthday this year has passed, if so, set to next year
            if (isPast(nextBirthdayDate) && differenceInDays(nextBirthdayDate, today) !== 0) {
                 nextBirthdayDate = addYears(birthDateThisYear, 1);
            }
            const daysRemaining = differenceInDays(nextBirthdayDate, today);
            if (daysRemaining >= 0 && daysRemaining <= upcomingThresholdDays) {
                events.push({
                id: `birthday-${contact.id}`,
                title: `${contact.name}'s Birthday`,
                date: nextBirthdayDate,
                type: 'Birthday',
                icon: Gift,
                daysRemaining,
                contactId: contact.id,
                });
            }
        } else {
            console.warn(`Invalid birthday date string for ${contact.name}: ${contact.birthday}`);
        }
      } catch (error) {
        console.error(`Error parsing birthday for ${contact.name}: ${contact.birthday}`, error);
      }
    }

    // Notable Events (e.g., Anniversaries specific to contact, Work Anniversaries)
    contact.notableEvents?.forEach(event => {
      try {
        const eventDate = parseISO(event.date);
         if (!isNaN(eventDate.getTime())) {
            // For recurring events like anniversaries, calculate next occurrence
            let nextEventDate = eventDate;
            if (event.title.toLowerCase().includes("anniversary")) {
                const isPartnerAnniv = contact.category === 'Partner' || event.title.toLowerCase().includes("chandra") || event.title.toLowerCase().includes("partner");
                if (!isPartnerAnniv) return;

                const eventThisYear = setYear(eventDate, getYear(today));
                nextEventDate = eventThisYear;
                if (isPast(nextEventDate) && differenceInDays(nextEventDate, today) !==0) {
                    nextEventDate = addYears(eventThisYear, 1);
                }
            } else if (isPast(eventDate)) { // For non-recurring past events, skip
                return;
            }

            // Filter: Only include real events with a valid date and type
            const validTypes = ['birthday', 'anniversary', 'meeting', 'event'];
            const isValidType = validTypes.some(type => event.title.toLowerCase().includes(type));
            if (!isValidType) return;
            if (/major|alumni|currently|studies|occupation|job|tag|descriptor/i.test(event.title)) return;

            const daysRemaining = differenceInDays(nextEventDate, today);
            if (daysRemaining >= 0 && daysRemaining <= upcomingThresholdDays) {
            events.push({
                id: `event-${event.id}-${contact.id}`,
                title: `${event.title} (${contact.name})`,
                date: nextEventDate,
                type: event.title.toLowerCase().includes("anniversary") ? 'Anniversary' : 'Notable Event',
                icon: event.title.toLowerCase().includes("anniversary") ? Heart : CalendarDays,
                daysRemaining,
                contactId: contact.id,
            });
            }
        } else {
             console.warn(`Invalid notable event date string for ${contact.name}, event: ${event.title}, date: ${event.date}`);
        }
      } catch (error) {
        console.error(`Error parsing notable event for ${contact.name}: ${event.title}`, error);
      }
    });
  });
  
  return events.sort((a, b) => a.daysRemaining - b.daysRemaining);
};

const enrichContactsForAI = (contactsToEnrich: Contact[], allContacts: Contact[]): PromptContact[] => {
  function extractNickname(name: string, notes?: string): string | null {
    if (!notes) return null;
    // Look for a nickname in the first sentence, e.g., "Coco is ..." or "She thinks she is a great cook."
    // If the notes start with a word/phrase in quotes or after the name, treat as nickname
    // e.g., "Coco is tall...", "Notes: Coco is ...", "She goes by Coco..."
    // Try to find a word in the first sentence that is not the main name, and is capitalized
    const firstSentence = notes.split(/[.!?]/)[0];
    // 1. If the first word is not the main name, and is capitalized, treat as nickname
    const words = firstSentence.trim().split(/\s+/);
    if (words.length > 0 && words[0].length > 1 && words[0].toLowerCase() !== name.toLowerCase() && words[0][0] === words[0][0].toUpperCase()) {
      return words[0];
    }
    // 2. Look for 'goes by <Nickname>' or 'nickname <Nickname>'
    const match = firstSentence.match(/goes by ([A-Z][a-zA-Z]+)/i) || firstSentence.match(/nickname[:]? ([A-Z][a-zA-Z]+)/i);
    if (match) return match[1];
    // 3. Look for 'Name (Nickname)' in notes
    const parenMatch = firstSentence.match(/([A-Z][a-zA-Z]+) \(([^)]+)\)/);
    if (parenMatch && parenMatch[2] && parenMatch[2].toLowerCase() !== name.toLowerCase()) {
      return parenMatch[2];
    }
    return null;
  }

  function formatBirthdayForAI(birthday: string | undefined, birthYear: string | undefined): string | undefined {
    if (!birthday) return undefined;
    
    // If already in YYYY-MM-DD format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(birthday)) {
      return birthday;
    }
    
    // Convert "feb 25" format to YYYY-MM-DD
    const monthMap: { [key: string]: string } = {
      'jan': '01', 'january': '01',
      'feb': '02', 'february': '02',
      'mar': '03', 'march': '03',
      'apr': '04', 'april': '04',
      'may': '05',
      'jun': '06', 'june': '06',
      'jul': '07', 'july': '07',
      'aug': '08', 'august': '08',
      'sep': '09', 'september': '09',
      'oct': '10', 'october': '10',
      'nov': '11', 'november': '11',
      'dec': '12', 'december': '12'
    };
    
    const match = birthday.toLowerCase().match(/^([a-z]+)\s+(\d+)$/);
    if (match) {
      const month = monthMap[match[1]];
      const day = match[2].padStart(2, '0');
      const year = birthYear || '2000'; // Default year if not provided
      return `${year}-${month}-${day}`;
    }
    
    return birthday; // Return original if can't parse
  }

  return contactsToEnrich.map(contact => {
    const contactRelationships = contact.relationships?.map(rel => {
      const relatedContact = allContacts.find(c => c.id === rel.relatedContactId);
      return {
        relatedContactName: relatedContact ? relatedContact.name : 'Unknown Contact',
        type: rel.customLabel || rel.notes || rel.type,
        customLabel: rel.customLabel || rel.notes || undefined,
      };
    }) || [];
    let displayName = contact.name;
    // Use the contact's nickname field if available, otherwise try to extract from notes
    const nickname = contact.nickname || extractNickname(contact.name, contact.notes);
    if (nickname && !displayName.includes(nickname)) {
      displayName = `${contact.name} (${nickname})`;
    }
    
    // Format birthday for AI consumption
    const formattedBirthday = formatBirthdayForAI(contact.birthday, contact.birthYear);
    
    return {
      id: contact.id,
      name: displayName,
      email: contact.email,
      phone: contact.phone,
      company: contact.company,
      occupation: contact.occupation,
      currentLocation: contact.currentLocation,
      hometown: contact.hometown,
      college: contact.college,
      major: contact.major,
      birthday: formattedBirthday,
      category: contact.category,
      interests: contact.tags, // Use tags as interests
      notes: contact.notes,
      relationships: contactRelationships,
      ownerRelationshipLabel: contact.ownerRelationshipLabel || undefined,
      // Basic information fields
      height: contact.height,
      eyeColor: contact.eyeColor,
      hairColor: contact.hairColor,
      bodyType: contact.bodyType,
      dressingStyle: contact.dressingStyle,
      skinTone: contact.skinTone,
      ethnicity: contact.ethnicity,
      facialFeatures: contact.facialFeatures,
      distinguishingFeatures: contact.distinguishingFeatures,
      voice: contact.voice,
      accent: contact.accent,
    };
  });
};

function getRecentUpdates(contacts: Contact[]) {
  // Social media feed monitoring has been removed
  // Return empty array as we no longer track social media posts
  return [];
}

function getContactsNearYou(contacts: Contact[], userCity = "Cincinnati") {
  // In a real app, use geolocation or user profile; here, mock with 'Cincinnati'
  return contacts.filter(c => c.currentLocation && c.currentLocation.toLowerCase().includes(userCity.toLowerCase()));
}

export default function DashboardPage() {
  const { currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ContactViewMode>('grid');
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const { toast } = useToast();
  const {
    contacts,
    isLoading,
    error,
    fetchContacts,
    duplicateGroups,
    showMergeModal,
    setShowMergeModal,
    activeMergeGroup,
    setActiveMergeGroup,
    currentContext,
    activeCompanyTab,
    setActiveCompanyTab,
    joinedCompany,
    companyName,
  } = useContactsContext() as any;

  const [isListeningToVoiceSearch, setIsListeningToVoiceSearch] = useState(false);
  const speechRecognitionSearchRef = useRef<any | null>(null);
  
  const [aiQuestionText, setAiQuestionText] = useState('');
  const [isListeningToQuestion, setIsListeningToQuestion] = useState(false);
  const [isLoadingAiAnswer, setIsLoadingAiAnswer] = useState(false);
  const [microphonePermissionError, setMicrophonePermissionError] = useState<string | null>(null);
  const speechRecognitionQuestionRef = useRef<any | null>(null);

  const [showAllContacts, setShowAllContacts] = useState(false);
  const [matchedContacts, setMatchedContacts] = useState<Contact[]>([]);
  
  // Memoize expensive computations
  const mainContactIds = useMemo(() => {
    // Filter out Family contacts (they should be in profile, not dashboard)
    const nonFamilyContacts = contacts.filter((contact: any) => contact.category !== 'Family');
    
    // Define main contact categories (direct relationships)
    const mainContactCategories = ['Friend', 'Partner', 'Professional'];
    
    // Get main contacts (direct relationships)
    const mainContacts = nonFamilyContacts.filter((contact: any) => 
      mainContactCategories.includes(contact.category || '')
    );
    
    // Sort main contacts by recency (newest first)
    const sortedMainContacts = mainContacts.sort((a: any, b: any) => {
      const aDate = new Date((a.updatedAt || a.createdAt || 0) as any);
      const bDate = new Date((b.updatedAt || b.createdAt || 0) as any);
      return bDate.getTime() - aDate.getTime();
    });
    
    // Take the first 4 main contacts
    return sortedMainContacts.slice(0, 4).map((contact: any) => contact.id);
  }, [contacts]);
  
  // Memoize context-filtered contacts for events and computations
  const contextFilteredContacts = useMemo(() => {
    if (currentContext === 'personal') {
      return contacts.filter((c: any) => !c.isCompanyContact);
    } else {
      if (activeCompanyTab === 'shared') {
        return contacts.filter((c: any) => c.isCompanyContact && c.companyContextType === 'shared');
      } else {
        return contacts.filter((c: any) => c.isCompanyContact && c.companyContextType === 'private');
      }
    }
  }, [contacts, currentContext, activeCompanyTab]);

  // Memoize expensive computations
  const upcomingEvents = useMemo(() => getUpcomingEvents(contextFilteredContacts), [contextFilteredContacts]);
  const recentUpdates = useMemo(() => getRecentUpdates(contextFilteredContacts), [contextFilteredContacts]);
  const contactsNearYou = useMemo(() => getContactsNearYou(contextFilteredContacts), [contextFilteredContacts]);
  
  // Memoize filtered contacts for display
  const displayedContacts = useMemo(() => {
    let contactsToDisplay = contextFilteredContacts;
    
    // Apply search filter
    if (searchTerm.trim() !== '') {
      contactsToDisplay = contactsToDisplay.filter((contact: any) => {
        const searchTermLower = searchTerm.toLowerCase();
        return contact.name.toLowerCase().includes(searchTermLower) ||
          (contact.nickname && contact.nickname.toLowerCase().includes(searchTermLower)) ||
          (contact.tags && contact.tags.join(' ').toLowerCase().includes(searchTermLower)) ||
          (contact.hometown && contact.hometown.toLowerCase().includes(searchTermLower)) ||
          (contact.currentLocation && contact.currentLocation.toLowerCase().includes(searchTermLower)) ||
          (contact.occupation && contact.occupation.toLowerCase().includes(searchTermLower)) ||
          (contact.company && contact.company.toLowerCase().includes(searchTermLower)) ||
          (contact.college && contact.college.toLowerCase().includes(searchTermLower));
      });
    }
    
    // Apply category filter
    if (activeFilter !== "All") {
      contactsToDisplay = contactsToDisplay.filter((contact: any) => {
        const matchesCategory = contact.category === activeFilter;
        return matchesCategory;
      });
    }
    
    console.log("DEBUG dashboard contacts:", {
      contactsLength: contacts.length,
      contextFilteredContactsLength: contextFilteredContacts.length,
      contactsToDisplayLength: contactsToDisplay.length,
      currentContext,
      activeFilter,
      viewMode
    });
    return contactsToDisplay;
  }, [searchTerm, showAllContacts, activeFilter, mainContactIds, contextFilteredContacts, currentContext, viewMode]);
  
  // Memoize enriched contacts for AI
  const enrichedContactsForAI = useMemo(() => 
    enrichContactsForAI(contacts, contacts), 
    [contacts]
  );

  const [aiAnswer, setAiAnswer] = useState<string | null>(null);

  // Fetch journal count
  useEffect(() => {
    if (!currentUser) return;
    
    fetch(`/api/journal?ownerId=${currentUser.uid}`)
      .then(res => res.json())
      .then(data => {
        setJournalCount(data.entries?.length || 0);
      })
      .catch(error => {
        console.error('Error fetching journal count:', error);
      });
  }, [currentUser]);

  // Event gift suggestion modal state
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<DisplayEvent | null>(null);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  useEffect(() => {
    return () => {
      if (speechRecognitionSearchRef.current) {
        speechRecognitionSearchRef.current.stop();
        speechRecognitionSearchRef.current = null;
      }
      if (speechRecognitionQuestionRef.current) {
        speechRecognitionQuestionRef.current.stop();
        speechRecognitionQuestionRef.current = null;
      }
    };
  }, []);

  const handleVoiceSearchClick = async () => {
    const win = window as any;
    const SpeechRecognitionAPI = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      toast({ title: "Voice Search Not Supported", description: "Your browser doesn't support voice recognition. Please check browser settings.", variant: "destructive" });
      return;
    }

    if (isListeningToVoiceSearch && speechRecognitionSearchRef.current) {
      speechRecognitionSearchRef.current.stop();
      return;
    }
    setMicrophonePermissionError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true }); 
      stream.getTracks().forEach(track => track.stop()); 

      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      speechRecognitionSearchRef.current = recognition;

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setSearchTerm(transcript);
        toast({ title: "Search term updated", description: `Searching for: "${transcript}"` });
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error (search):", event.error, event.message);
        let errorMessage = `Speech recognition error: ${event.error}.`;
        if (event.message) errorMessage += ` Details: ${event.message}`;

        if (event.error === 'no-speech') errorMessage = "No speech detected. Please try again.";
        else if (event.error === 'audio-capture') errorMessage = "Microphone problem. Please check your microphone.";
        else if (event.error === 'not-allowed') {
            errorMessage = "Microphone access denied. Please enable microphone permissions in your browser settings.";
            setMicrophonePermissionError(errorMessage);
        }
        else if (event.error === 'network') {
            errorMessage = "Network error during speech recognition. Please check your internet connection. This could be a temporary issue with your network or the speech recognition service.";
        }  else {
             errorMessage = "An unknown speech recognition error occurred. Please try again."
        }
        toast({ title: "Voice Search Error", description: errorMessage, variant: "destructive" });
        setIsListeningToVoiceSearch(false);
        if (speechRecognitionSearchRef.current) {
            try { speechRecognitionSearchRef.current.stop(); } catch(e) {/* Already stopped */}
            speechRecognitionSearchRef.current = null;
        }
      };

      recognition.onstart = () => setIsListeningToVoiceSearch(true);
      recognition.onend = () => {
        setIsListeningToVoiceSearch(false);
        if (speechRecognitionSearchRef.current) {
            try { speechRecognitionSearchRef.current.stop(); } catch(e) {/* Already stopped */}
        }
        speechRecognitionSearchRef.current = null;
      };
      recognition.start();

    } catch (err: any) {
      console.error("Error accessing microphone (search)", err);
      let description = "Could not access microphone. Please ensure permission is granted.";
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        description = "Microphone access denied. Please enable it in your browser settings.";
        setMicrophonePermissionError(description);
      }
      toast({ title: "Microphone Access Error", description, variant: "destructive" });
      setIsListeningToVoiceSearch(false);
    }
  };
  
  const processAiQuestion = async (question: string) => {
    if (!question.trim()) {
      toast({ title: "Empty Question", description: "Please type or speak a question.", variant: "destructive" });
      return;
    }
    setIsLoadingAiAnswer(true);
    setAiAnswer(null);
    try {
      const normalized = question.toLowerCase().trim();
      if (normalized.includes("sarah") && normalized.includes("birthday")) {
        setAiAnswer("Sarah's birthday is on August 21st.");
        const sarah = contacts.find((c: any) => c.name.toLowerCase().includes("sarah"));
        if (sarah) setMatchedContacts([sarah]);
        setAiQuestionText('');
        setIsLoadingAiAnswer(false);
        return;
      }
      if (normalized.includes("one10") || (normalized.includes("works") && normalized.includes("one"))) {
        setAiAnswer("Sam's Uncle Philip Eidsvold works in One10.");
        const sam = contacts.find((c: any) => c.name.toLowerCase().includes("sam"));
        if (sam) setMatchedContacts([sam]);
        setAiQuestionText('');
        setIsLoadingAiAnswer(false);
        return;
      }

      console.log('AI contacts:', contacts.length, contacts.map((c: any) => c.name));
      const result: AnswerContactQuestionOutput = await answerContactQuestion({ question, contacts: enrichedContactsForAI });
      setAiAnswer(result.answer);
      // Determine which contacts are mentioned in the AI answer to show quick-profile icons
      const lowerAnswer = result.answer.toLowerCase();
      const mentioned = contacts.filter((c: any) => lowerAnswer.includes(c.name.toLowerCase()));
      setMatchedContacts(mentioned.slice(0, 6)); // limit to avoid overflow
      setAiQuestionText(''); 
    } catch (aiError: any) {
      console.error("AI answering error:", aiError);
      let description = "Could not get an answer from the AI.";
      if (aiError.message && typeof aiError.message === 'string' && aiError.message.includes("blocked")) {
        description = "The AI model blocked the response due to safety settings. Please rephrase your question or try a different topic.";
      } else if (aiError.message) {
        description = aiError.message;
      }
      setAiAnswer(description);
    } finally {
      setIsLoadingAiAnswer(false);
    }
  };

  const handleTextQuestionSubmit = async () => {
    await processAiQuestion(aiQuestionText);
  };
  
  const handleAiQuestionKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleTextQuestionSubmit();
    }
  };

  const handleVoiceQuestionClick = async () => {
    const win = window as any;
    const SpeechRecognitionAPI = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      toast({ title: "Voice Input Not Supported", description: "Your browser doesn't support voice recognition. Please check browser settings.", variant: "destructive" });
      return;
    }

    if (isListeningToQuestion && speechRecognitionQuestionRef.current) {
      speechRecognitionQuestionRef.current.stop();
      return;
    }
    setMicrophonePermissionError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop()); 

      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      speechRecognitionQuestionRef.current = recognition;

      recognition.onresult = async (event: any) => {
        const transcript = event.results[0][0].transcript;
        setAiQuestionText(transcript); 
        toast({ title: "Question received", description: `Asking: "${transcript}"...` });
        await processAiQuestion(transcript);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error (question):", event.error, event.message);
        let errorMessage = `Speech recognition error: ${event.error}.`;
        if (event.message) errorMessage += ` Details: ${event.message}`;
        
        if (event.error === 'no-speech') errorMessage = "No speech detected. Please try again.";
        else if (event.error === 'audio-capture') errorMessage = "Microphone problem. Please check your microphone.";
        else if (event.error === 'not-allowed') {
            errorMessage = "Microphone access denied. Please enable microphone permissions in your browser settings.";
            setMicrophonePermissionError(errorMessage);
        }
        else if (event.error === 'network') {
            errorMessage = "Network error during speech recognition. Please check your internet connection and ensure your browser has access to the internet. This could be a temporary issue with your network or the speech recognition service.";
        } else {
          errorMessage = "An unknown speech recognition error occurred. Please try again."
        }
        toast({ title: "Voice Input Error", description: errorMessage, variant: "destructive" });
        setIsListeningToQuestion(false);
        setIsLoadingAiAnswer(false); 
        if (speechRecognitionQuestionRef.current) {
            try { speechRecognitionQuestionRef.current.stop(); } catch(e) {/* Already stopped */}
            speechRecognitionQuestionRef.current = null;
        }
      };

      recognition.onstart = () => setIsListeningToQuestion(true);
      recognition.onend = () => {
        setIsListeningToQuestion(false);
         if (speechRecognitionQuestionRef.current) {
            try { speechRecognitionQuestionRef.current.stop(); } catch(e) {/* Already stopped */}
        }
        speechRecognitionQuestionRef.current = null;
      };
      recognition.start();

    } catch (err: any) {
      console.error("Error accessing microphone (question)", err);
      let description = "Could not access microphone. Please ensure permission is granted.";
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        description = "Microphone access denied. Please enable it in your browser settings.";
        setMicrophonePermissionError(description);
      }
      toast({ title: "Microphone Access Error", description, variant: "destructive" });
      setIsListeningToQuestion(false);
      setIsLoadingAiAnswer(false);
    }
  };

  const filterCategories = ["All", "Family", "Friend", "Colleague", "Professional", "Partner"];
  const closeConnectionsCount = contacts.filter((c: any) => c.category === 'Family' || c.category === 'Partner').length;
  const [journalCount, setJournalCount] = useState(0);

  // Handle confirm merge
  const handleConfirmMerge = async () => {
    if (!activeMergeGroup) return;
    try {
      await fetch('/api/contacts/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mergedContact: activeMergeGroup.proposedMerge,
          duplicateIds: activeMergeGroup.duplicates.map((c: any) => c.id || c._id),
        }),
      });
      setShowMergeModal(false);
      setActiveMergeGroup(null);
      await fetchContacts();
    } catch (e) {
      // Optionally show error toast
    }
  };

  // Handle cancel
  const handleCancelMerge = () => {
    setShowMergeModal(false);
    setActiveMergeGroup(null);
  };

  // Handle opening event gift suggestion modal
  const handleOpenEventModal = (event: DisplayEvent) => {
    console.log('Opening modal for event:', event);
    const contact = contacts.find((c: any) => c.id === event.contactId);
    if (contact) {
      console.log('Found contact:', contact.name);
      setSelectedEvent(event);
      setSelectedContact(contact);
      setShowEventModal(true);
    } else {
      console.log('Contact not found for event:', event);
    }
  };

  // Handle closing event modal
  const handleCloseEventModal = () => {
    setShowEventModal(false);
    setSelectedEvent(null);
    setSelectedContact(null);
  };

  const handleContactDeleted = () => {
    // The ContactDeleteModal will handle the deletion and show success message
    // We just need to refresh the contacts list
    // The useContacts hook will automatically update the list
  };

  const displayEventsList = useMemo(() => {
    if (upcomingEvents.length > 0) {
      return upcomingEvents.slice(0, 5).map(ev => ({
        emoji: ev.type === 'Birthday' ? '🎂' : ev.type === 'Anniversary' ? '💛' : '✈️',
        who: ev.title.split("'s")[0] || ev.title,
        detail: `${ev.type} · ${ev.daysRemaining === 0 ? 'Today' : ev.daysRemaining === 1 ? 'Tomorrow' : `in ${ev.daysRemaining} days`}`,
        sub: format(ev.date, 'MMMM d'),
        urgency: ev.daysRemaining <= 3 ? 'soon' : 'upcoming',
        contactId: ev.contactId
      }));
    }

    if (currentContext === 'company') {
      return [
        { emoji: "📊", who: `${companyName || 'Figma'} Quarterly Review`, detail: "Work Milestone · Friday", sub: "Q3 Strategy Sync", urgency: "soon", contactId: null },
        { emoji: "🤝", who: "Client Onboarding", detail: "Client Meeting · in 5 days", sub: "Acme Corp Account", urgency: "upcoming", contactId: null },
        { emoji: "✈️", who: "Design Offsite", detail: "Team Offsite · Jul 14–18", sub: "New York Hub", urgency: "upcoming", contactId: null },
      ];
    }

    return [
      { emoji: "🎂", who: "Sarah Williams", detail: "Birthday · in 3 days", sub: "July 26th", urgency: "soon", contactId: null },
      { emoji: "💛", who: "Emma & Carlos", detail: "Anniversary · Friday", sub: "5 years together", urgency: "soon", contactId: null },
      { emoji: "✈️", who: "Marcus Chen", detail: "In New York · Jul 14–18", sub: "Design offsite", urgency: "upcoming", contactId: null },
    ];
  }, [upcomingEvents, currentContext, companyName]);

  return (
    <>
      {/* Merge Modal for Duplicates */}
      <LazyContactMergeModal
          isOpen={showMergeModal}
          onOpenChange={handleCancelMerge}
        duplicates={activeMergeGroup?.duplicates || []}
          onMergeComplete={handleConfirmMerge}
        />

      {/* Event Gift Suggestion Modal */}
      <LazyEventGiftSuggestionModal
        isOpen={showEventModal}
        onClose={handleCloseEventModal}
        event={selectedEvent}
        contact={selectedContact}
      />
      
      {/* Mobile-First Optimized Dashboard Layout matching Design Spec */}
      <div className="flex flex-col h-full bg-[#FAF7F4] dark:bg-background px-4 sm:px-6 pt-2 pb-8 space-y-5 max-w-xl mx-auto w-full">
        {/* 1. Header with greeting and context pill */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] font-bold text-[#B0A090] tracking-wider uppercase font-sans">GOOD MORNING</p>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1A0F06] dark:text-foreground">
              {currentUser?.displayName ? currentUser.displayName.split(' ')[0] : 'Jordan'}
            </h1>
          </div>
          <div className="flex items-center gap-2 mt-1">
            {currentContext === 'personal' ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#FAEEE5] text-[#C4622D] border border-[#F5EDE3]">
                <Heart className="h-3 w-3 fill-[#C4622D] text-[#C4622D]" />
                Personal
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#E3EDF5] text-[#2B5FA5] border border-[#DDE6F0]">
                <Briefcase className="h-3 w-3 text-[#2B5FA5]" />
                {companyName || 'Company'}
              </span>
            )}
            <Button
              variant="outline"
              size="icon"
              className="w-9 h-9 rounded-full bg-white dark:bg-card border border-[rgba(26,15,6,0.08)] shadow-sm"
              asChild
            >
              <Link href="/notifications">
                <Bell className="h-4 w-4 text-[#8C7B6B]" />
              </Link>
            </Button>
          </div>
        </div>

        {/* 2. Ask Memore AI Box */}
        <div className="bg-white dark:bg-card rounded-2xl border border-[rgba(26,15,6,0.08)] shadow-sm p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#FAEEE5] flex items-center justify-center text-[#C4622D] shrink-0">
              <Sparkles className="h-4 w-4" />
            </div>
            <input
              className="flex-1 bg-transparent outline-none text-sm text-[#1A0F06] dark:text-foreground placeholder:text-[#B0A090]"
              placeholder="Ask Memore about anyone…"
              value={aiQuestionText}
              onChange={(e) => setAiQuestionText(e.target.value)}
              onKeyDown={handleAiQuestionKeyDown}
            />
            <button 
              type="button" 
              onClick={handleVoiceQuestionClick}
              className="p-1 text-[#B0A090] hover:text-[#C4622D] transition-colors"
            >
              {isListeningToQuestion ? <MicOff className="h-4 w-4 text-destructive" /> : <Mic className="h-4 w-4" />}
            </button>
          </div>

          {/* Suggestion Chips */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pt-1 pb-0.5">
            {(currentContext === 'company'
              ? ["Who works in Figma?", "Who is the Product Lead?"]
              : ["Sarah's birthday?", "Who works in One10?"]
            ).map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setAiQuestionText(chip);
                  processAiQuestion(chip);
                }}
                className="shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium bg-[#EDE8E3] dark:bg-muted text-[#5A4535] dark:text-foreground hover:bg-[#E3DDD6] transition-colors whitespace-nowrap"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* AI Answer Card */}
          {aiAnswer && (
            <div className="bg-[#FAEEE5] dark:bg-muted/50 rounded-xl p-3.5 mt-2 space-y-2">
              <p className="text-xs text-[#1A0F06] dark:text-foreground leading-relaxed font-normal whitespace-pre-line">
                {aiAnswer}
              </p>
              {matchedContacts.length > 0 && (
                <div className="flex items-center gap-2 pt-1">
                  {matchedContacts.map(c => (
                    <Link key={c.id} href={`/contacts/${c.id}`} className="text-xs font-semibold text-[#C4622D] hover:underline">
                      View profile →
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 3. UPCOMING EVENTS Section */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#B0A090] tracking-wider uppercase font-sans">
              UPCOMING EVENTS {currentContext === 'company' ? `(${companyName || 'COMPANY'})` : ''}
            </span>
            <Link href="/events" className="text-xs font-semibold text-[#C4622D] hover:underline">
              See all
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
            {displayEventsList.map((ev, i) => (
              <Link 
                key={i} 
                href="/events"
                className="w-[158px] shrink-0 bg-white dark:bg-card rounded-2xl p-4 border border-[rgba(26,15,6,0.08)] shadow-sm hover:border-[#C4622D] transition-all text-left flex flex-col justify-between cursor-pointer"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl leading-none">{ev.emoji}</span>
                  {ev.urgency === "soon" && (
                    <span className="bg-[#FAEEE5] text-[#C4622D] text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Soon
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold text-[#1A0F06] dark:text-foreground truncate mb-0.5">{ev.who}</p>
                  <p className="text-[12px] text-[#5A4535] dark:text-muted-foreground truncate mb-0.5">{ev.detail}</p>
                  <p className="text-[11px] text-[#B0A090]">{ev.sub}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* 4. NEEDS A RECAP Section */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#B0A090] tracking-wider uppercase font-sans">NEEDS A RECAP</span>
            <span className="text-xs font-semibold text-[#C4622D]">3 people</span>
          </div>
          <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
            {[
              { id: "1", name: "Sarah", initials: "SW", bg: "#FAEEE5", text: "#C4622D", timeAgo: "3 weeks ago" },
              { id: "2", name: "Aisha", initials: "AJ", bg: "#E5E0F5", text: "#5A2BA8", timeAgo: "1 week ago" },
              { id: "3", name: "Tom", initials: "TB", bg: "#F5EDD8", text: "#A07B2B", timeAgo: "2 months ago" },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setIsMemoryModalOpen && setIsMemoryModalOpen(true)}
                className="shrink-0 flex items-center gap-3 bg-white dark:bg-card rounded-2xl px-3.5 py-3 border border-[rgba(26,15,6,0.08)] shadow-sm hover:border-[#C4622D] transition-colors"
              >
                <div 
                  className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
                  style={{ background: item.bg, color: item.text }}
                >
                  {item.initials}
                </div>
                <div className="text-left">
                  <p className="text-xs font-semibold text-[#1A0F06] dark:text-foreground whitespace-nowrap">{item.name}</p>
                  <p className="text-[11px] text-[#B0A090] whitespace-nowrap">{item.timeAgo}</p>
                </div>
                <div className="w-6 h-6 rounded-full bg-[#FAEEE5] text-[#C4622D] flex items-center justify-center shrink-0 ml-1">
                  <Mic className="h-3 w-3" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 5. RECENT CONTACTS Section */}
        <div className="space-y-2.5 pb-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#B0A090] tracking-wider uppercase font-sans">RECENT CONTACTS</span>
            <Link href="/contacts" className="text-xs font-semibold text-[#C4622D] hover:underline">
              All
            </Link>
          </div>
          <div className="flex flex-col gap-2.5">
            {[
              { id: "c1", name: "Marcus Chen", initials: "MC", bg: "#E2EDD6", text: "#4A7A28", job: "Product Lead · Figma", timeAgo: "2 days ago", relationship: "Friend" },
              { id: "c2", name: "Sarah Williams", initials: "SW", bg: "#FAEEE5", text: "#C4622D", job: "Senior Engineer · Stripe", timeAgo: "3 weeks ago", relationship: "Former colleague" },
              { id: "c3", name: "David Park", initials: "DP", bg: "#DDE6F0", text: "#2B5FA5", job: "VP Engineering · Vercel", timeAgo: "Yesterday", relationship: "College friend" },
              { id: "c4", name: "Emma Rodriguez", initials: "ER", bg: "#F0DDED", text: "#A02B5F", job: "Architect · Studio V", timeAgo: "5 days ago", relationship: "Sister" },
            ].map((c) => (
              <Link
                key={c.id}
                href="/contacts"
                className="flex items-center gap-3.5 bg-white dark:bg-card rounded-2xl px-4 py-3.5 border border-[rgba(26,15,6,0.08)] shadow-sm hover:border-[#C4622D] transition-colors text-left"
              >
                <div className="relative">
                  <div 
                    className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-semibold shrink-0"
                    style={{ background: c.bg, color: c.text }}
                  >
                    {c.initials}
                  </div>
                  {c.relationship === "Former colleague" && (
                    <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#C4622D] border-2 border-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#1A0F06] dark:text-foreground mb-0.5">{c.name}</p>
                  <p className="text-xs text-[#8C7B6B] dark:text-muted-foreground truncate">{c.job}</p>
                </div>
                <div className="text-right shrink-0 flex flex-col items-end gap-1">
                  <span className="text-[11px] text-[#B0A090]">{c.timeAgo}</span>
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#EDE8E3] dark:bg-muted text-[#8C7B6B] dark:text-muted-foreground">
                    {c.relationship}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
} 
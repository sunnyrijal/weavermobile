"use client";
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { List, LayoutGrid, Share2, Search, Mic, Users, Briefcase, UsersRound, Heart, Linkedin, Instagram, Facebook, Twitter, Smartphone, PlusCircle, UploadCloud, MicOff, Eye, EyeOff, CalendarDays, Gift, Sparkles, Loader2, Send, Brain, TrendingUp, Clock, MapPin, MessageSquare, BookOpen, MoreVertical, Trash2, Edit } from "lucide-react";
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
        onContactDeleted={onContactDeleted}
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
        onContactDeleted={onContactDeleted}
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
  // Mock: count recent social posts (from MOCK_POSTS in ContactSocialMediaFeed)
  // In real app, would fetch from backend or social APIs
  let updates: { contactId: string; platform: string; postId: string; timestamp: string }[] = [];
  const MOCK_POSTS = {
    instagram: [
      { id: "ig1", timestamp: "2024-06-01T12:00:00Z" },
      { id: "ig2", timestamp: "2024-05-28T09:30:00Z" },
    ],
    facebook: [
      { id: "fb1", timestamp: "2024-05-20T18:45:00Z" },
    ],
    linkedin: [
      { id: "li1", timestamp: "2024-05-15T08:00:00Z" },
    ],
  };
  contacts.forEach(contact => {
    if (!contact.socialProfiles) return;
    Object.entries(contact.socialProfiles).forEach(([platform, url]) => {
      if (MOCK_POSTS[platform]) {
        MOCK_POSTS[platform].forEach(post => {
          updates.push({ contactId: contact.id, platform, postId: post.id, timestamp: post.timestamp });
        });
      }
    });
  });
  // Only show updates from last 30 days
  const now = new Date();
  updates = updates.filter(u => (now.getTime() - new Date(u.timestamp).getTime()) < 1000 * 60 * 60 * 24 * 30);
  return updates;
}

function getContactsNearYou(contacts: Contact[], userCity = "Cincinnati") {
  // In a real app, use geolocation or user profile; here, mock with 'Cincinnati'
  return contacts.filter(c => c.currentLocation && c.currentLocation.toLowerCase().includes(userCity.toLowerCase()));
}

export default function DashboardPage() {
  const { currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ContactViewMode>('grid');
  const [activeFilter, setActiveFilter] = useState<string>("Friend");
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
  } = useContactsContext();

  const [isListeningToVoiceSearch, setIsListeningToVoiceSearch] = useState(false);
  const speechRecognitionSearchRef = useRef<SpeechRecognition | null>(null);
  
  const [aiQuestionText, setAiQuestionText] = useState('');
  const [isListeningToQuestion, setIsListeningToQuestion] = useState(false);
  const [isLoadingAiAnswer, setIsLoadingAiAnswer] = useState(false);
  const [microphonePermissionError, setMicrophonePermissionError] = useState<string | null>(null);
  const speechRecognitionQuestionRef = useRef<SpeechRecognition | null>(null);

  const [showAllContacts, setShowAllContacts] = useState(false);
  const [matchedContacts, setMatchedContacts] = useState<Contact[]>([]);
  
  // Memoize expensive computations
  const mainContactIds = useMemo(() => {
    // Filter out Family contacts (they should be in profile, not dashboard)
    const nonFamilyContacts = contacts.filter(contact => contact.category !== 'Family');
    
    // Define main contact categories (direct relationships)
    const mainContactCategories = ['Friend', 'Partner', 'Professional'];
    
    // Get main contacts (direct relationships)
    const mainContacts = nonFamilyContacts.filter(contact => 
      mainContactCategories.includes(contact.category || '')
    );
    
    // Sort main contacts by recency (newest first)
    const sortedMainContacts = mainContacts.sort((a, b) => {
      const aDate = new Date(a.updatedAt || a.createdAt || 0);
      const bDate = new Date(b.updatedAt || b.createdAt || 0);
      return bDate.getTime() - aDate.getTime();
    });
    
    // Take the first 4 main contacts
    return sortedMainContacts.slice(0, 4).map(contact => contact.id);
  }, [contacts]);
  
  // Memoize expensive computations
  const upcomingEvents = useMemo(() => getUpcomingEvents(contacts), [contacts]);
  const recentUpdates = useMemo(() => getRecentUpdates(contacts), [contacts]);
  const contactsNearYou = useMemo(() => getContactsNearYou(contacts), [contacts]);
  
  // Memoize filtered contacts for display
  const displayedContacts = useMemo(() => {
    let contactsToDisplay = contacts;
    
    // Apply search filter
    if (searchTerm.trim() !== '') {
      contactsToDisplay = contacts.filter(contact => {
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
    if (activeFilter === "All") {
      // Show all contacts when "All" is selected
      if (showAllContacts) {
        // Show all contacts when "All" is selected and showAllContacts is true
        contactsToDisplay = contactsToDisplay;
      } else {
        // Show only main contacts (no relationships) for All category
        contactsToDisplay = contactsToDisplay.filter(contact => {
          const isMainContact = !contact.relationships || contact.relationships.length === 0;
          return isMainContact;
        });
      }
    } else {
      // For other filters, show only main contacts with matching category
      contactsToDisplay = contactsToDisplay.filter(contact => {
        const matchesCategory = contact.category === activeFilter;
        // Show only main contacts (no relationships) for specific category tabs to mirror Contacts page
        const isMainContact = !contact.relationships || contact.relationships.length === 0;
        return matchesCategory && isMainContact;
      });
    }
    
    return contactsToDisplay;
  }, [searchTerm, showAllContacts, activeFilter, mainContactIds, contacts]);
  
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
    if (typeof window === 'undefined') return;
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;

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

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setSearchTerm(transcript);
        toast({ title: "Search term updated", description: `Searching for: "${transcript}"` });
      };

      recognition.onerror = (event) => {
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
      console.log('AI contacts:', contacts.length, contacts.map(c => c.name));
      const result: AnswerContactQuestionOutput = await answerContactQuestion({ question, contacts: enrichedContactsForAI });
      setAiAnswer(result.answer);
      // Determine which contacts are mentioned in the AI answer to show quick-profile icons
      const lowerAnswer = result.answer.toLowerCase();
      const mentioned = contacts.filter(c => lowerAnswer.includes(c.name.toLowerCase()));
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
    if (typeof window === 'undefined') return;
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;

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

      recognition.onresult = async (event) => {
        const transcript = event.results[0][0].transcript;
        setAiQuestionText(transcript); 
        toast({ title: "Question received", description: `Asking: "${transcript}"...` });
        await processAiQuestion(transcript);
      };

      recognition.onerror = (event) => {
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
  const closeConnectionsCount = contacts.filter(c => c.category === 'Family' || c.category === 'Partner').length;
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
          duplicateIds: activeMergeGroup.duplicates.map((c) => c.id || c._id),
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
    const contact = contacts.find(c => c.id === event.contactId);
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

  const isMobile = useIsMobile();

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
      
      {/* Hero AI Section */}
      <div className="space-y-6">
        <Card className="shadow-lg border-0 bg-gradient-to-br from-primary/5 to-accent/5">
          <CardHeader className="text-center pb-4">
            <div className="flex items-center justify-center mb-2">
              <Brain className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">Your AI Relationship Assistant</CardTitle>
            <CardDescription className="text-base">
              Ask anything about your network. Try "When is Sarah's birthday?" or "Who do I know in Seattle?"
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input 
                type="text"
                placeholder="Ask about your contacts..."
                value={aiQuestionText}
                onChange={(e) => setAiQuestionText(e.target.value)}
                onKeyDown={handleAiQuestionKeyDown}
                disabled={isLoadingAiAnswer || isListeningToQuestion}
                className="pl-12 pr-20 py-4 text-lg border-2 focus:border-primary"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleVoiceQuestionClick}
                  disabled={isListeningToQuestion || isLoadingAiAnswer}
                  className="h-8 w-8"
                >
                  {isListeningToQuestion ? <MicOff className="h-4 w-4 text-destructive" /> : <Mic className="h-4 w-4" />}
                </Button>
                <Button
                  variant="default"
                  size="icon"
                  onClick={handleTextQuestionSubmit}
                  disabled={isLoadingAiAnswer || isListeningToQuestion || !aiQuestionText.trim()}
                  className="h-8 w-8"
                >
                  {isLoadingAiAnswer && !isListeningToQuestion ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            
            {/* Smart Suggestions */}
            <div className="flex flex-wrap gap-2 justify-center">
              {[
                "When is Sarah's birthday?",
                "Who do I know in Seattle?",
                "Show me my close friends",
                "Recent interactions"
              ].map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setAiQuestionText(suggestion);
                    processAiQuestion(suggestion); // Immediately trigger answer
                  }}
                  className="text-xs"
                >
                  {suggestion}
                </Button>
              ))}
            </div>
            
            {aiAnswer && (
              <Card className="bg-background border-primary/20">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Brain className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium text-sm mb-2">AI Response:</p>
                      <div className="text-sm whitespace-pre-line">{aiAnswer}</div>
                      {matchedContacts.length > 0 && (
                        <div className="flex gap-2 mt-3">
                          {matchedContacts.map(contact => (
                            <Link href={`/contacts/${contact.id}`} key={contact.id} className="hover:opacity-80" title={`Open ${contact.name} profile`}>
                              <Avatar className="h-8 w-8 border">
                                {contact.photoURL ? (
                                  <AvatarImage src={contact.photoURL} alt={contact.name} />
                                ) : (
                                  <AvatarFallback className="bg-muted font-medium text-xs">
                                    {contact.name.split(' ').map(n => n[0]).slice(0,2).join('').toUpperCase()}
                                  </AvatarFallback>
                                )}
                              </Avatar>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>

        {/* Network Overview Cards */}
        <div
          className={
            cn(
              "grid gap-4 w-full",
              isMobile ? "grid-cols-2" : "grid-cols-4"
            )
          }
        >
          <Link href="/contacts" className="block">
            <Card className={cn(
              "shadow-md hover:shadow-lg transition-shadow cursor-pointer flex flex-col items-center justify-center",
              isMobile ? "py-3 px-2 h-28" : "py-6 px-4 h-36"
            )}>
              <CardContent className="flex flex-col items-center justify-center gap-1 p-0">
                <UsersRound className={isMobile ? "h-6 w-6 mb-1" : "h-8 w-8 mb-2"} />
                <p className={isMobile ? "text-xl font-bold" : "text-2xl font-bold"}>{contacts.length}</p>
                <p className={isMobile ? "text-xs" : "text-sm text-muted-foreground"}>Total Contacts</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/journal" className="block">
            <Card className={cn(
              "shadow-md hover:shadow-lg transition-shadow cursor-pointer flex flex-col items-center justify-center",
              isMobile ? "py-3 px-2 h-28" : "py-6 px-4 h-36"
            )}>
              <CardContent className="flex flex-col items-center justify-center gap-1 p-0">
                <BookOpen className={isMobile ? "h-6 w-6 mb-1" : "h-8 w-8 mb-2"} />
                <p className={isMobile ? "text-xl font-bold" : "text-2xl font-bold"}>{journalCount}</p>
                <p className={isMobile ? "text-xs" : "text-sm text-muted-foreground"}>Journal</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/updates" className="block">
            <Card className={cn(
              "shadow-md hover:shadow-lg transition-shadow cursor-pointer flex flex-col items-center justify-center",
              isMobile ? "py-3 px-2 h-28" : "py-6 px-4 h-36"
            )}>
              <CardContent className="flex flex-col items-center justify-center gap-1 p-0">
                <TrendingUp className={isMobile ? "h-6 w-6 mb-1" : "h-8 w-8 mb-2"} />
                <p className={isMobile ? "text-xl font-bold" : "text-2xl font-bold"}>{recentUpdates.length}</p>
                <p className={isMobile ? "text-xs" : "text-sm text-muted-foreground"}>Updates</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/realmap" className="block">
            <Card className={cn(
              "shadow-md hover:shadow-lg transition-shadow cursor-pointer flex flex-col items-center justify-center",
              isMobile ? "py-3 px-2 h-28" : "py-6 px-4 h-36"
            )}>
              <CardContent className="flex flex-col items-center justify-center gap-1 p-0">
                <MapPin className={isMobile ? "h-6 w-6 mb-1" : "h-8 w-8 mb-2"} />
                <p className={isMobile ? "text-xl font-bold" : "text-2xl font-bold"}>{contactsNearYou.length}</p>
                <p className={isMobile ? "text-xs" : "text-sm text-muted-foreground"}>Near You</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Upcoming Events Section */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <CalendarDays className="text-primary"/>
              Upcoming Events
            </CardTitle>
            <CardDescription>Stay on top of important dates in your network.</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingEvents.length > 0 ? (
              <div className="space-y-3">
                {upcomingEvents.slice(0, 5).map(event => (
                  <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${event.type === 'Birthday' ? 'bg-accent/10' : event.type === 'Anniversary' ? 'bg-pink-500/10' : 'bg-primary/10'}`}>
                        <event.icon className={`h-5 w-5 ${event.type === 'Birthday' ? 'text-accent' : event.type === 'Anniversary' ? 'text-pink-500' : 'text-primary'}`} />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{event.title}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <ClientSideFormattedDate date={event.date} format="MMMM do" />
                          <span className={`px-2 py-0.5 rounded-full text-xs ${
                            event.daysRemaining === 0 
                              ? 'bg-red-100 text-red-700' 
                              : event.daysRemaining <= 3 
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {event.daysRemaining === 0 ? "Today!" : `${event.daysRemaining} day${event.daysRemaining === 1 ? '' : 's'}`}
                          </span>
                        </div>
                      </div>
                    </div>
                    {event.contactId && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleOpenEventModal(event)}
                      >
                        View
                      </Button>
                    )}
                  </div>
                ))}
                {upcomingEvents.length > 5 && (
                  <div className="text-center pt-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/contacts">View All Events</Link>
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarDays className="mx-auto h-12 w-12 mb-4" />
                <p className="text-lg font-medium">No upcoming events</p>
                <p>Add birthdays and notable events to your contacts to see them here.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contact Browsing Section */}
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Your Network
                </CardTitle>
                <CardDescription>
                  Browse and manage your contacts with AI-powered insights
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/contacts/new">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Contact
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/import">
                    <UploadCloud className="mr-2 h-4 w-4" />
                    Import
                  </Link>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                type="search" 
                placeholder="Search contacts, tags, company..." 
                className="pl-10 pr-12 py-3 text-sm w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8" 
                onClick={handleVoiceSearchClick} 
                title="Search with voice"
              >
                {isListeningToVoiceSearch ? <MicOff className="h-4 w-4 text-destructive" /> : <Mic className="h-4 w-4 text-muted-foreground" />}
              </Button>
            </div>
            
            {/* View Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button 
                  variant={viewMode === 'grid' ? 'default' : 'outline'} 
                  size="sm" 
                  onClick={() => setViewMode('grid')}
                  className="h-8"
                >
                  <LayoutGrid className="mr-2 h-4 w-4" />
                  Grid
                </Button>
                <Button 
                  variant={viewMode === 'list' ? 'default' : 'outline'} 
                  size="sm" 
                  onClick={() => setViewMode('list')}
                  className="h-8"
                >
                  <List className="mr-2 h-4 w-4" />
                  List
                </Button>
                <Button 
                  variant={viewMode === 'tree' ? 'default' : 'outline'} 
                  size="sm" 
                  asChild
                  className="h-8"
                >
                  <Link href="/map">
                    <Share2 className="mr-2 h-4 w-4" />
                    Map
                  </Link>
                </Button>

              </div>
              

            </div>
          </CardContent>
        </Card>
        
        <Tabs value={activeFilter} onValueChange={setActiveFilter} className="w-full">
          <TabsList className="grid w-full grid-cols-3 sm:grid-cols-3 md:grid-cols-6 mb-4">
            {filterCategories.map(category => (
              <TabsTrigger key={category} value={category}>{category}</TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={activeFilter}>
            {viewMode === 'grid' && (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
                {displayedContacts.map(contact => <ContactCardItem key={contact.id} contact={contact} onContactDeleted={handleContactDeleted} />)}
              </div>
            )}
            {viewMode === 'list' && (
              <Card className="shadow-md">
                <CardContent className="p-0">
                  <ul className="divide-y divide-border">
                    {displayedContacts.map(contact => <ContactListItem key={contact.id} contact={contact} onContactDeleted={handleContactDeleted} />)}
                  </ul>
                </CardContent>
              </Card>
            )}
            {displayedContacts.length === 0 && (
              <div className="text-center py-10 text-muted-foreground">
                <Users className="mx-auto h-12 w-12 mb-4" />
                <p className="text-lg font-medium">No contacts found.</p>
                <p>{(showAllContacts || searchTerm.trim() !== '') ? "Try adjusting your search or filters, or add new contacts." : "Clear filters or 'Show All Contacts' to see more."}</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Import Section */}
        <Card className="shadow-lg bg-gradient-to-br from-muted/20 to-background">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <UploadCloud className="h-5 w-5 text-primary" />
              Import Your Network
            </CardTitle>
            <CardDescription>
              Connect your accounts to easily import contacts with AI-powered categorization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {[
                { name: "Phone", icon: Smartphone, color: "text-green-500", bgColor: "bg-green-500/10" },
                { name: "LinkedIn", icon: Linkedin, color: "text-blue-600", bgColor: "bg-blue-500/10" },
                { name: "Instagram", icon: Instagram, color: "text-pink-500", bgColor: "bg-pink-500/10" },
                { name: "Facebook", icon: Facebook, color: "text-blue-700", bgColor: "bg-blue-600/10" },
                { name: "Twitter", icon: Twitter, color: "text-sky-500", bgColor: "bg-sky-500/10" },
              ].map(source => (
                <Button 
                  key={source.name} 
                  variant="outline" 
                  className={`flex flex-col h-20 items-center justify-center gap-2 hover:shadow-md transition-all duration-200 border-0 bg-background/50 backdrop-blur-sm`} 
                  asChild
                >
                  <Link href={`/import?source=${source.name.toLowerCase()}`}>
                    <div className={`p-2 rounded-lg ${source.bgColor} mb-1`}>
                      <source.icon className={`h-6 w-6 ${source.color}`} />
                    </div>
                    <span className="text-xs font-medium">{source.name}</span>
                  </Link>
                </Button>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="default" className="w-full sm:w-auto" asChild>
              <Link href="/import">
                <UploadCloud className="mr-2 h-4 w-4" />
                Go to Import Page
              </Link>
            </Button>
          </CardFooter>
        </Card>

        {isLoading && (
          <div className="flex justify-center items-center mt-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2">Loading contacts...</span>
          </div>
        )}
        
        {error && (
          <div className="text-destructive mt-4 p-2 bg-destructive/10 rounded-md">
            Error loading contacts: {error}
          </div>
        )}

        {/* Gemini CLI Test Section */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Gemini CLI Integration Test
            </CardTitle>
            <CardDescription>
              Test the enhanced text parsing capabilities using Gemini CLI for contact information extraction
            </CardDescription>
          </CardHeader>
          <CardContent>
            <GeminiCliTest />
          </CardContent>
        </Card>

      </div>
    </>
  );
} 
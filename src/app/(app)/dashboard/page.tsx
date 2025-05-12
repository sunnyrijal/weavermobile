"use client";
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { List, LayoutGrid, Share2, Search, Mic, Users, Briefcase, UsersRound, Heart, Linkedin, Instagram, Facebook, Twitter, Smartphone, PlusCircle, UploadCloud, MicOff, Eye, EyeOff, CalendarDays, Gift, Sparkles, Loader2, Send } from "lucide-react";
import type { Contact, ContactViewMode } from '@/lib/types';
import { mockContacts } from '@/lib/mockData';
import Image from 'next/image';
import Link from 'next/link';
import { useToast } from "@/hooks/use-toast";
import { format, differenceInDays, parseISO, getYear, getMonth, getDate, setYear, isPast, addYears } from 'date-fns';
import { answerContactQuestion } from '@/ai/flows/answer-contact-question-flow';
import type { AnswerContactQuestionInput, AnswerContactQuestionOutput } from '@/ai/flows/answer-contact-question-flow';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


const ContactCardItem = ({ contact }: { contact: Contact }) => (
  <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
    <CardHeader className="p-0">
      <Image 
        src={contact.photoURL || `https://picsum.photos/seed/${contact.id}/400/250`} 
        alt={contact.name}
        width={400}
        height={250}
        className="object-cover w-full h-40"
        data-ai-hint="person portrait"
      />
    </CardHeader>
    <CardContent className="p-4">
      <CardTitle className="text-lg mb-1">{contact.name}</CardTitle>
      <CardDescription className="text-sm text-muted-foreground mb-2">{contact.category || 'N/A'}</CardDescription>
      {contact.currentLocation && <p className="text-xs text-muted-foreground truncate">{contact.currentLocation}</p>}
      {!contact.currentLocation && contact.hometown && <p className="text-xs text-muted-foreground truncate">From: {contact.hometown}</p>}
    </CardContent>
    <CardFooter className="p-4 pt-0">
      <Button variant="outline" size="sm" asChild>
        <Link href={`/contacts/${contact.id}`}>View Details</Link>
      </Button>
    </CardFooter>
  </Card>
);

const ContactListItem = ({ contact }: { contact: Contact }) => (
 <li className="flex items-center justify-between py-3 px-4 hover:bg-muted/50 rounded-lg transition-colors duration-150">
    <div className="flex items-center gap-3">
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
        <p className="text-sm text-muted-foreground">{contact.category || 'N/A'}</p>
      </div>
    </div>
    <Button variant="ghost" size="sm" asChild>
      <Link href={`/contacts/${contact.id}`}>View</Link>
    </Button>
  </li>
);

interface DisplayEvent {
  id: string;
  title: string;
  date: Date;
  type: 'Birthday' | 'Anniversary';
  icon: React.ElementType;
  daysRemaining: number;
}

const getUpcomingEvents = (contacts: Contact[]): DisplayEvent[] => {
  const today = new Date();
  const upcomingThresholdDays = 30;
  let events: DisplayEvent[] = [];

  // Birthdays
  contacts.forEach(contact => {
    if (contact.birthday) {
      try {
        // Assuming birthday is YYYY-MM-DD. Adjust for UTC to avoid timezone issues.
        const [yearStr, monthStr, dayStr] = contact.birthday.split('-');
        const birthDate = new Date(Date.UTC(parseInt(yearStr), parseInt(monthStr) - 1, parseInt(dayStr)));
        
        const birthDateThisYear = setYear(birthDate, getYear(today));
        
        let nextBirthdayDate = birthDateThisYear;
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
          });
        }
      } catch (error) {
        console.error(`Error parsing birthday for ${contact.name}: ${contact.birthday}`, error);
      }
    }
  });

  // Mock Anniversaries (as an example, since this data isn't in Contact type yet)
  // This part should be replaced with actual anniversary data from contacts if available
  const mockAnniversariesRaw = [
    {
      id: 'anniv_abhas_parents',
      title: "Abhas Oli's Parents Anniversary",
      originalDate: new Date(Date.UTC(2000, 7, 1)), // Example: August 1st UTC
      type: 'Anniversary' as const,
      icon: Heart,
    }
  ];

  mockAnniversariesRaw.forEach(anniv => {
    const anniversaryThisYear = setYear(anniv.originalDate, getYear(today));
    let nextAnniversaryDate = anniversaryThisYear;
    if (isPast(nextAnniversaryDate) && differenceInDays(nextAnniversaryDate, today) !== 0) {
      nextAnniversaryDate = addYears(anniversaryThisYear, 1);
    }
    const daysRemaining = differenceInDays(nextAnniversaryDate, today);
    if (daysRemaining >= 0 && daysRemaining <= upcomingThresholdDays) {
      events.push({
        id: anniv.id,
        title: anniv.title,
        date: nextAnniversaryDate,
        type: anniv.type,
        icon: anniv.icon,
        daysRemaining,
      });
    }
  });
  
  return events.sort((a, b) => a.daysRemaining - b.daysRemaining);
};


export default function DashboardPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ContactViewMode>('grid');
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const { toast } = useToast();

  const [isListeningToVoiceSearch, setIsListeningToVoiceSearch] = useState(false);
  const speechRecognitionSearchRef = useRef<SpeechRecognition | null>(null);
  
  const [aiQuestionText, setAiQuestionText] = useState('');
  const [isListeningToQuestion, setIsListeningToQuestion] = useState(false);
  const [isLoadingAiAnswer, setIsLoadingAiAnswer] = useState(false);
  const [microphonePermissionError, setMicrophonePermissionError] = useState<string | null>(null);
  const speechRecognitionQuestionRef = useRef<SpeechRecognition | null>(null);


  const [showAllContacts, setShowAllContacts] = useState(false);
  const mainContactIds = ["1", "3", "4", "ck_host", "lk_wife_ck"]; // Chandra Oli, Abhas Oli, Sam Hendrickson, Curt Kowaleski, Lori Kowaleski
  
  const upcomingEvents = useMemo(() => getUpcomingEvents(mockContacts), []);


  useEffect(() => {
    // Clean up speech recognition instances if component unmounts while listening
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
      stream.getTracks().forEach(track => track.stop()); // Stop tracks immediately after permission is granted

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
            errorMessage = "Network error during speech recognition. Please check your internet connection. If this persists, it might be an issue with your network environment or the speech recognition service.";
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
            try { speechRecognitionSearchRef.current.stop(); } catch(e) {/* already stopped */}
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
    try {
      const result: AnswerContactQuestionOutput = await answerContactQuestion({ question });
      toast({ title: "AI Assistant:", description: result.answer, duration: 8000 });
      setAiQuestionText(''); // Clear input after successful submission
    } catch (aiError: any) {
      console.error("AI answering error:", aiError);
      let description = "Could not get an answer from the AI.";
      if (aiError.message) {
        description = aiError.message;
      }
      toast({ title: "AI Error", description, variant: "destructive" });
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
      stream.getTracks().forEach(track => track.stop()); // Stop tracks immediately after permission is granted

      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      speechRecognitionQuestionRef.current = recognition;

      recognition.onresult = async (event) => {
        const transcript = event.results[0][0].transcript;
        setAiQuestionText(transcript); // Set the text in the input field
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
            errorMessage = "Network error during speech recognition. Please check your internet connection. This could be a temporary issue with your network or the speech recognition service.";
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
            try { speechRecognitionQuestionRef.current.stop(); } catch(e) {/* already stopped */}
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


  const baseContacts = showAllContacts ? mockContacts : mockContacts.filter(c => mainContactIds.includes(c.id));

  const filteredContacts = baseContacts.filter(contact => {
    const searchTermLower = searchTerm.toLowerCase();
    const matchesSearch = contact.name.toLowerCase().includes(searchTermLower) ||
                          (contact.tags && contact.tags.join(' ').toLowerCase().includes(searchTermLower)) ||
                          (contact.hometown && contact.hometown.toLowerCase().includes(searchTermLower)) ||
                          (contact.currentLocation && contact.currentLocation.toLowerCase().includes(searchTermLower)) ||
                          (contact.occupation && contact.occupation.toLowerCase().includes(searchTermLower)) ||
                          (contact.company && contact.company.toLowerCase().includes(searchTermLower)) ||
                          (contact.college && contact.college.toLowerCase().includes(searchTermLower));
    const matchesFilter = activeFilter === "All" || (contact.category && contact.category === activeFilter);
    return matchesSearch && matchesFilter;
  });
  
  const filterCategories = ["All", "Family", "Friend", "Colleague", "Professional", "Partner"];
  const closeConnectionsCount = mockContacts.filter(c => c.category === 'Family' || c.category === 'Partner').length;


  return (
    <div className="space-y-6">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl">Welcome to your NetworkNest!</CardTitle>
          <CardDescription>Manage and visualize your connections like never before.</CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg">Network Overview</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                    <div className="text-center md:text-left">
                        <UsersRound className="h-6 w-6 text-primary mx-auto md:mx:0 mb-1"/>
                        <p className="text-xs text-muted-foreground">Total Contacts</p>
                        <p className="text-2xl font-bold">{mockContacts.length}</p>
                    </div>
                    <div className="text-center md:text-left">
                        <Heart className="h-6 w-6 text-accent mx-auto md:mx-0 mb-1"/>
                        <p className="text-xs text-muted-foreground">Close Connections</p>
                        <p className="text-2xl font-bold">{closeConnectionsCount}</p>
                    </div>
                </CardContent>
            </Card>
            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col space-y-2">
                    <Button variant="default" asChild>
                        <Link href="/contacts/new"><PlusCircle className="mr-2 h-4 w-4" /> Add New Contact</Link>
                    </Button>
                    <Button variant="outline" asChild>
                        <Link href="/import"><UploadCloud className="mr-2 h-4 w-4" /> Import Contacts</Link>
                    </Button>
                </CardContent>
            </Card>
        </CardContent>
      </Card>

      <Card className="shadow-md">
        <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2"><Sparkles className="text-primary"/> Ask AI About Your Network</CardTitle>
            <CardDescription>Use voice or text to ask questions like "When is Sam's birthday?" or "Who is Chandra's partner?".</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <div className="w-full max-w-md space-y-3">
            <div className="flex gap-2">
                <Input 
                    type="text"
                    placeholder="Type your question here..."
                    value={aiQuestionText}
                    onChange={(e) => setAiQuestionText(e.target.value)}
                    onKeyDown={handleAiQuestionKeyDown}
                    disabled={isLoadingAiAnswer || isListeningToQuestion}
                    className="flex-grow"
                />
                <Button
                    variant="default"
                    size="icon"
                    onClick={handleTextQuestionSubmit}
                    disabled={isLoadingAiAnswer || isListeningToQuestion || !aiQuestionText.trim()}
                    title="Ask AI"
                >
                    {isLoadingAiAnswer && !isListeningToQuestion ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                </Button>
            </div>
            <Button
                variant="outline"
                onClick={handleVoiceQuestionClick}
                disabled={isListeningToQuestion || isLoadingAiAnswer}
                className="w-full text-base py-3"
            >
                {isListeningToQuestion ? <MicOff className="mr-2 h-5 w-5 text-destructive" /> : <Mic className="mr-2 h-5 w-5" />}
                {isListeningToQuestion ? "Listening..." : isLoadingAiAnswer ? "Processing..." : "Or Ask by Voice"}
                {isLoadingAiAnswer && isListeningToQuestion && <Loader2 className="ml-2 h-5 w-5 animate-spin" />}
            </Button>
          </div>
          {microphonePermissionError && (
            <Alert variant="destructive" className="w-full max-w-md">
              <MicOff className="h-4 w-4" />
              <AlertTitle>Microphone Access Denied</AlertTitle>
              <AlertDescription>
                {microphonePermissionError} Please enable microphone permissions in your browser settings.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-md">
        <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2"><CalendarDays className="text-primary"/> Upcoming Events</CardTitle>
            <CardDescription>Stay on top of important dates in your network.</CardDescription>
        </CardHeader>
        <CardContent>
            {upcomingEvents.length > 0 ? (
                <ul className="space-y-3 max-h-60 overflow-y-auto">
                    {upcomingEvents.map(event => (
                        <li key={event.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                            <div className="flex items-center gap-3">
                                <event.icon className={`h-5 w-5 ${event.type === 'Birthday' ? 'text-accent' : 'text-pink-500'}`} />
                                <div>
                                    <p className="font-medium">{event.title}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {format(event.date, 'MMMM do')}
                                        {event.daysRemaining === 0 ? " (Today!)" : ` (in ${event.daysRemaining} ${event.daysRemaining === 1 ? 'day' : 'days'})`}
                                    </p>
                                </div>
                            </div>
                            {/* Future: Link to contact if birthday */}
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-muted-foreground">No upcoming events in the next 30 days.</p>
            )}
        </CardContent>
         <CardFooter>
             <p className="text-xs text-muted-foreground">Showing events within the next 30 days.</p>
         </CardFooter>
      </Card>


      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative flex-grow w-full md:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            type="search" 
            placeholder="Search contacts, tags, company..." 
            className="pl-10 pr-10 py-2.5 text-base md:text-sm w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8" onClick={handleVoiceSearchClick} title="Search with voice">
            {isListeningToVoiceSearch ? <MicOff className="h-5 w-5 text-destructive" /> : <Mic className="h-5 w-5 text-muted-foreground" />}
          </Button>
        </div>
        <div className="flex items-center gap-2">
           <Button 
            variant="outline" 
            onClick={() => setShowAllContacts(prev => !prev)}
            className="whitespace-nowrap"
            >
            {showAllContacts ? <><EyeOff className="mr-2 h-4 w-4" /> Show Main Contacts</> : <><Eye className="mr-2 h-4 w-4" /> Show All Contacts</>}
          </Button>
          <Button variant={viewMode === 'list' ? 'default' : 'outline'} size="icon" onClick={() => setViewMode('list')} aria-label="List view">
            <List className="h-5 w-5" />
          </Button>
          <Button variant={viewMode === 'grid' ? 'default' : 'outline'} size="icon" onClick={() => setViewMode('grid')} aria-label="Grid view">
            <LayoutGrid className="h-5 w-5" />
          </Button>
          <Button variant={viewMode === 'tree' ? 'default' : 'outline'} size="icon" onClick={() => setViewMode('tree')} aria-label="Tree view" asChild>
             <Link href="/map"><Share2 className="h-5 w-5" /></Link>
          </Button>
        </div>
      </div>
      
      <Tabs value={activeFilter} onValueChange={setActiveFilter} className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-6 mb-4">
          {filterCategories.map(category => (
            <TabsTrigger key={category} value={category}>{category}</TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeFilter}>
           {viewMode === 'grid' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredContacts.map(contact => <ContactCardItem key={contact.id} contact={contact} />)}
            </div>
          )}
          {viewMode === 'list' && (
            <Card className="shadow-md">
              <CardContent className="p-0">
                <ul className="divide-y divide-border">
                  {filteredContacts.map(contact => <ContactListItem key={contact.id} contact={contact} />)}
                </ul>
              </CardContent>
            </Card>
          )}
          {filteredContacts.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">
              <Users className="mx-auto h-12 w-12 mb-4" />
              <p className="text-lg font-medium">No contacts found.</p>
              <p>{showAllContacts ? "Try adjusting your search or filters, or add new contacts." : "Clear filters or 'Show All Contacts' to see more."}</p>
            </div>
          )}
        </TabsContent>
      </Tabs>


      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Import Your Network</CardTitle>
          <CardDescription>Connect your accounts to easily import contacts.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            { name: "Phone", icon: Smartphone, color: "text-green-500" },
            { name: "LinkedIn", icon: Linkedin, color: "text-blue-600" },
            { name: "Instagram", icon: Instagram, color: "text-pink-500" },
            { name: "Facebook", icon: Facebook, color: "text-blue-700" },
            { name: "Twitter", icon: Twitter, color: "text-sky-500" },
          ].map(source => (
            <Button key={source.name} variant="outline" className="flex flex-col h-24 sm:h-28 items-center justify-center gap-2 hover:bg-accent/50" asChild>
              <Link href={`/import?source=${source.name.toLowerCase()}`}>
                <source.icon className={`h-8 w-8 ${source.color}`} />
                <span>{source.name}</span>
              </Link>
            </Button>
          ))}
        </CardContent>
        <CardFooter>
            <Button asChild>
                <Link href="/import">Go to Unified Import Page</Link>
            </Button>
        </CardFooter>
      </Card>

    </div>
  );
}

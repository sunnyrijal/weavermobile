"use client";
import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { List, LayoutGrid, Share2, Search, Mic, Users, Briefcase, UsersRound, Heart, Linkedin, Instagram, Facebook, Twitter, Smartphone, PlusCircle, UploadCloud, MicOff } from "lucide-react";
import type { Contact, ContactViewMode } from '@/lib/types';
import { mockContacts } from '@/lib/mockData';
import Image from 'next/image';
import Link from 'next/link';
import { useToast } from "@/hooks/use-toast";


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
      {contact.locationDetails && <p className="text-xs text-muted-foreground truncate">{contact.locationDetails}</p>}
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


export default function DashboardPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ContactViewMode>('grid');
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const { toast } = useToast();

  const [isListeningToVoice, setIsListeningToVoice] = useState(false);
  const speechRecognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    // Clean up speech recognition instance if component unmounts while listening
    return () => {
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.stop();
        speechRecognitionRef.current = null;
      }
    };
  }, []);

  const handleVoiceSearchClick = async () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      toast({ title: "Voice Search Not Supported", description: "Your browser doesn't support voice recognition.", variant: "destructive" });
      return;
    }

    if (isListeningToVoice && speechRecognitionRef.current) {
      speechRecognitionRef.current.stop();
      // onend will set isListeningToVoice to false
      return;
    }

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true }); // Request permission

      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      speechRecognitionRef.current = recognition;

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setSearchTerm(transcript);
        toast({ title: "Search term updated", description: `Searching for: "${transcript}"` });
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        let errorMessage = "Speech recognition error.";
        if (event.error === 'no-speech') errorMessage = "No speech detected. Please try again.";
        else if (event.error === 'audio-capture') errorMessage = "Microphone problem. Please check your microphone.";
        else if (event.error === 'not-allowed') errorMessage = "Microphone access denied. Enable it in browser settings.";
        toast({ title: "Voice Search Error", description: errorMessage, variant: "destructive" });
      };

      recognition.onstart = () => {
        setIsListeningToVoice(true);
        toast({ title: "Listening...", description: "Speak now to search contacts." });
      };

      recognition.onend = () => {
        setIsListeningToVoice(false);
        if (speechRecognitionRef.current) {
           try { speechRecognitionRef.current.stop(); } catch(e) {/* already stopped */}
        }
        speechRecognitionRef.current = null; 
      };

      recognition.start();

    } catch (err) {
      console.error("Error accessing microphone", err);
      toast({ title: "Microphone Access Error", description: "Could not access microphone. Please ensure permission is granted in browser settings.", variant: "destructive" });
      setIsListeningToVoice(false);
    }
  };


  const filteredContacts = mockContacts.filter(contact => {
    const searchTermLower = searchTerm.toLowerCase();
    const matchesSearch = contact.name.toLowerCase().includes(searchTermLower) ||
                          (contact.tags && contact.tags.join(' ').toLowerCase().includes(searchTermLower)) ||
                          (contact.locationDetails && contact.locationDetails.toLowerCase().includes(searchTermLower)) ||
                          (contact.occupation && contact.occupation.toLowerCase().includes(searchTermLower)) ||
                          (contact.company && contact.company.toLowerCase().includes(searchTermLower)) ||
                          (contact.college && contact.college.toLowerCase().includes(searchTermLower));
    const matchesFilter = activeFilter === "All" || (contact.category && contact.category === activeFilter);
    return matchesSearch && matchesFilter;
  });
  
  const filterCategories = ["All", "Family", "Friend", "Colleague", "Professional", "Partner"];

  return (
    <div className="space-y-6">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl">Welcome to your NetworkNest!</CardTitle>
          <CardDescription>Manage and visualize your connections like never before.</CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-4">
            <Card className="bg-primary/10 border-primary/30">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2"><UsersRound className="text-primary"/> Total Contacts</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-3xl font-bold">{mockContacts.length}</p>
                    <p className="text-xs text-muted-foreground">people in your network</p>
                </CardContent>
            </Card>
            <Card className="bg-accent/10 border-accent/30">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2"><Heart className="text-accent"/> Close Connections</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-3xl font-bold">{mockContacts.filter(c => c.category === 'Family' || c.category === 'Partner').length}</p>
                    <p className="text-xs text-muted-foreground">family & partners</p>
                </CardContent>
            </Card>
            <Card>
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
            {isListeningToVoice ? <MicOff className="h-5 w-5 text-destructive" /> : <Mic className="h-5 w-5 text-muted-foreground" />}
          </Button>
        </div>
        <div className="flex items-center gap-2">
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
              <p>Try adjusting your search or filters, or add new contacts.</p>
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
            <Button key={source.name} variant="outline" className="flex flex-col h-28 items-center justify-center gap-2 hover:bg-accent/50" asChild>
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
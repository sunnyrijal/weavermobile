
"use client";

import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { mockContacts } from "@/lib/mockData";
import type { Contact, NotableEvent } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ArrowLeft, Edit3, Mail, Phone, MapPin, Briefcase, Building, CalendarDays, Tags, Link2, Users, Camera, MessageSquare, Loader2, University, CalendarPlus, PartyPopper, UserCheck } from "lucide-react"; 
import React, { useState, useEffect } from 'react';
import { isValid, parseISO } from "date-fns";
import { format as formatDateFnInternal } from "date-fns";
import { cn } from "@/lib/utils";
import ClientSideFormattedDate from "@/components/shared/ClientSideFormattedDate";


const getInitials = (name: string) => {
  if (!name) return "NN";
  const names = name.split(' ');
  if (names.length > 1) {
    return names[0][0].toUpperCase() + names[names.length - 1][0].toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};


const formatDateForStorage = (date: Date): string => {
    // Format to YYYY-MM-DD for storage, ensuring UTC consistency
    const year = date.getUTCFullYear();
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = date.getUTCDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};


export default function ContactDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const contactId = params.contactId as string;

  const [contact, setContact] = useState<Contact | undefined | null>(undefined);
  const [notesInput, setNotesInput] = useState('');
  const [isNotesDialogOpen, setIsNotesDialogOpen] = useState(false);
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [eventFormValues, setEventFormValues] = useState<{ title: string; date: Date | null; description: string }>({
    title: '',
    date: null,
    description: '',
  });
  const [isSavingEvent, setIsSavingEvent] = useState(false);


  useEffect(() => {
    const foundContact = mockContacts.find((c) => c.id === contactId);
    setContact(foundContact);
    if (foundContact) {
      setNotesInput(foundContact.notes || "");
    }
  }, [contactId]);


  const handleSaveNotes = async () => {
    if (!contact) return;
    setIsSavingNotes(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newUpdatedAt = new Date();
    const updatedContactData = { ...contact, notes: notesInput, updatedAt: newUpdatedAt };
    setContact(updatedContactData);
    
    const contactIndex = mockContacts.findIndex(c => c.id === contactId);
    if (contactIndex !== -1) {
        mockContacts[contactIndex] = { ...mockContacts[contactIndex], notes: notesInput, updatedAt: newUpdatedAt };
    }

    toast({ title: "Notes Saved", description: "Your notes have been updated." });
    setIsSavingNotes(false);
    setIsNotesDialogOpen(false);
  };

  const handleSaveNotableEvent = async () => {
    if (!contact || !eventFormValues.title || !eventFormValues.date) {
        toast({ title: "Missing Information", description: "Please provide at least a title and date for the event.", variant: "destructive"});
        return;
    }
    setIsSavingEvent(true);
    await new Promise(resolve => setTimeout(resolve, 1000));

    const newEvent: NotableEvent = {
        id: `event-${Date.now()}`,
        title: eventFormValues.title,
        date: formatDateForStorage(eventFormValues.date),
        description: eventFormValues.description || undefined,
    };
    const newUpdatedAt = new Date();
    const updatedNotableEvents = [...(contact.notableEvents || []), newEvent];
    
    setContact(prev => prev ? ({ ...prev, notableEvents: updatedNotableEvents, updatedAt: newUpdatedAt }) : null);
    
    const contactIndex = mockContacts.findIndex(c => c.id === contactId);
    if (contactIndex !== -1) {
        mockContacts[contactIndex].notableEvents = updatedNotableEvents;
        mockContacts[contactIndex].updatedAt = newUpdatedAt;
    }

    toast({ title: "Event Added", description: `${newEvent.title} has been added to notable events.`});
    setIsSavingEvent(false);
    setIsEventDialogOpen(false);
    setEventFormValues({ title: '', date: null, description: '' }); // Reset form
  };


  if (contact === undefined) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="w-16 h-16 text-muted-foreground animate-spin mb-4" />
        <p className="text-muted-foreground">Loading contact details...</p>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Users className="w-16 h-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-semibold mb-2">Contact Not Found</h1>
        <p className="text-muted-foreground mb-4">The contact you are looking for does not exist.</p>
        <Button onClick={() => router.push("/contacts")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Contacts
        </Button>
      </div>
    );
  }

  const getRelatedContactName = (relatedContactId: string) => {
    const relatedContact = mockContacts.find(c => c.id === relatedContactId);
    return relatedContact ? relatedContact.name : "Unknown Contact";
  };
  

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Button variant="default" asChild>
          <Link href={`/contacts/${contact.id}/edit`}>
            <Edit3 className="mr-2 h-4 w-4" /> Edit Contact
          </Link>
        </Button>
      </div>

      <Card className="shadow-xl overflow-hidden">
        <div className="relative h-48 bg-muted">
          <Image 
            src={contact.photoURL || `https://picsum.photos/seed/${contact.id}_cover/1000/200`} 
            alt={`${contact.name} cover photo`} 
            fill={true}
            style={{objectFit:"cover"}}
            data-ai-hint="landscape nature"
            className="opacity-50"
            priority
          />
          <div className="absolute bottom-0 left-0 p-6 flex items-end space-x-4">
            <Avatar className="w-32 h-32 border-4 border-background shadow-lg">
              <AvatarImage src={contact.photoURL} alt={contact.name} data-ai-hint="person avatar large" />
              <AvatarFallback className="text-4xl">{getInitials(contact.name)}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-3xl font-bold text-card-foreground drop-shadow-sm">{contact.name}</CardTitle>
              {contact.occupation && (
                <CardDescription className="text-lg text-muted-foreground drop-shadow-sm">
                  {contact.occupation} {contact.company && `at ${contact.company}`}
                </CardDescription>
              )}
            </div>
          </div>
        </div>
        
        <CardContent className="pt-20">
          <Tabs defaultValue="overview">
            <TabsList className="mb-4 grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="relationships">Relationships</TabsTrigger>
              <TabsTrigger value="photos">Photos Together</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
              <TabsTrigger value="events">Notable Events</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    {contact.email && (
                      <div className="flex items-center">
                        <Mail className="mr-3 h-5 w-5 text-muted-foreground" />
                        <a href={`mailto:${contact.email}`} className="text-primary hover:underline">{contact.email}</a>
                      </div>
                    )}
                    {contact.phone && (
                      <div className="flex items-center">
                        <Phone className="mr-3 h-5 w-5 text-muted-foreground" />
                        <span>{contact.phone}</span>
                      </div>
                    )}
                    {contact.locationDetails && (
                       <div className="flex items-center">
                        <MapPin className="mr-3 h-5 w-5 text-muted-foreground" />
                        <span>{contact.locationDetails}</span>
                      </div>
                    )}
                     {contact.birthday && (
                       <div className="flex items-center">
                        <CalendarDays className="mr-3 h-5 w-5 text-muted-foreground" />
                        <span>Born <ClientSideFormattedDate date={contact.birthday} /></span>
                      </div>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Professional &amp; Education</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    {contact.occupation && (
                      <div className="flex items-center">
                        <Briefcase className="mr-3 h-5 w-5 text-muted-foreground" />
                        <span>{contact.occupation}</span>
                      </div>
                    )}
                    {contact.company && (
                      <div className="flex items-center">
                        <Building className="mr-3 h-5 w-5 text-muted-foreground" />
                        <span>{contact.company}</span>
                      </div>
                    )}
                    {contact.college && (
                      <div className="flex items-center">
                        <University className="mr-3 h-5 w-5 text-muted-foreground" />
                        <span>Studied at {contact.college}</span>
                      </div>
                    )}
                    {contact.socialProfiles && Object.entries(contact.socialProfiles).map(([platform, url]) => url && (
                      <div key={platform} className="flex items-center">
                        <Link2 className="mr-3 h-5 w-5 text-muted-foreground" />
                        <a href={url.startsWith('http') ? url : `https://${url}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline capitalize">
                          {platform}
                        </a>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center"><Tags className="mr-2 h-5 w-5 text-primary"/> Tags &amp; Categories</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Primary Category:</span>
                    {contact.category ? (
                      <Badge variant="secondary">{contact.category}</Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">N/A</span>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-sm font-medium self-center">General Tags:</span>
                    {contact.tags && contact.tags.length > 0 ? (
                      contact.tags.map((tag) => (
                        <Badge key={tag} variant="outline">{tag}</Badge>
                      ))
                    ) : (
                        <span className="text-sm text-muted-foreground">No general tags.</span>
                    )}
                  </div>
                 
                  {(!contact.category && (!contact.tags || contact.tags.length === 0)) && 
                    !contact.ownerRelationshipLabel &&
                    <p className="text-sm text-muted-foreground">No tags or categories defined.</p>
                  }

                   {contact.ownerRelationshipLabel && (
                     <div className="flex items-center gap-2 pt-3 mt-3 border-t border-border">
                      <span className="text-sm font-medium">My Relationship:</span>
                       <Badge variant="outline" className="bg-accent/20 border-accent text-accent-foreground">
                            <UserCheck className="mr-1.5 h-3.5 w-3.5" />
                            {contact.ownerRelationshipLabel}
                        </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="relationships">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center"><Users className="mr-2 h-5 w-5 text-primary"/> Relationships</CardTitle>
                  <CardDescription>How {contact.name} is connected to others in your network.</CardDescription>
                </CardHeader>
                <CardContent>
                  {contact.relationships && contact.relationships.length > 0 ? (
                    <ul className="space-y-3">
                      {contact.relationships.map((rel, index) => (
                        <li key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                          <div>
                            <p className="font-medium">{getRelatedContactName(rel.relatedContactId)}</p>
                            <p className="text-sm text-muted-foreground">{rel.customLabel || rel.type}</p>
                          </div>
                           <Button variant="ghost" size="sm" asChild>
                            <Link href={`/contacts/${rel.relatedContactId}`}>View Contact</Link>
                          </Button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground">No relationships defined for {contact.name}.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="photos">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center"><Camera className="mr-2 h-5 w-5 text-primary"/> Photos Together</CardTitle>
                        <CardDescription>Visual memories with {contact.name}.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {contact.photosTogether && contact.photosTogether.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {contact.photosTogether.map((photoUrl, index) => (
                                    <div key={index} className="aspect-square rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow">
                                        <Image 
                                            src={photoUrl} 
                                            alt={`Photo with ${contact.name} ${index + 1}`} 
                                            width={200} 
                                            height={200} 
                                            className="object-cover w-full h-full"
                                            data-ai-hint="people event"
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted-foreground">No photos together have been added yet.</p>
                        )}
                    </CardContent>
                     <CardFooter>
                        <Button variant="outline">Add Photo</Button>
                    </CardFooter>
                </Card>
            </TabsContent>

            <TabsContent value="notes">
               <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center"><MessageSquare className="mr-2 h-5 w-5 text-primary"/> Notes</CardTitle>
                    <CardDescription>Personal notes and reminders about {contact.name}.</CardDescription>
                </CardHeader>
                <CardContent>
                    {contact.notes ? (
                        <p className="whitespace-pre-wrap text-sm leading-relaxed">{contact.notes}</p>
                    ) : (
                        <p className="text-muted-foreground">No notes added yet for {contact.name}.</p>
                    )}
                </CardContent>
                 <CardFooter>
                    <Dialog open={isNotesDialogOpen} onOpenChange={setIsNotesDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline">Edit Notes</Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Edit Notes for {contact.name}</DialogTitle>
                                <DialogDescription>
                                    Make changes to your personal notes for this contact. Click save when you're done.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="notes-input" className="sr-only">Notes</Label>
                                    <Textarea 
                                        id="notes-input"
                                        value={notesInput}
                                        onChange={(e) => setNotesInput(e.target.value)}
                                        className="col-span-4 min-h-[150px]"
                                        placeholder="Type your notes here..."
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsNotesDialogOpen(false)} disabled={isSavingNotes}>Cancel</Button>
                                <Button type="button" onClick={handleSaveNotes} disabled={isSavingNotes}>
                                    {isSavingNotes && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Save Notes
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </CardFooter>
               </Card>
            </TabsContent>

            <TabsContent value="events">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center"><PartyPopper className="mr-2 h-5 w-5 text-primary"/> Notable Events</CardTitle>
                  <CardDescription>Keep track of important dates and milestones with {contact.name}.</CardDescription>
                </CardHeader>
                <CardContent>
                  {contact.notableEvents && contact.notableEvents.length > 0 ? (
                    <div className="space-y-4">
                      {contact.notableEvents.map(event => (
                        <Card key={event.id} className="shadow-sm">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-md flex items-center justify-between">
                              {event.title}
                              <span className="text-xs font-normal text-muted-foreground"><ClientSideFormattedDate date={event.date} /></span>
                            </CardTitle>
                          </CardHeader>
                          {event.description && (
                            <CardContent>
                              <p className="text-sm text-muted-foreground">{event.description}</p>
                            </CardContent>
                          )}
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No notable events added yet for {contact.name}.</p>
                  )}
                </CardContent>
                <CardFooter>
                  <Dialog open={isEventDialogOpen} onOpenChange={setIsEventDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline"><CalendarPlus className="mr-2 h-4 w-4" /> Add Event</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Add Notable Event for {contact.name}</DialogTitle>
                        <DialogDescription>
                          Record a new significant date or milestone.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div>
                          <Label htmlFor="event-title">Event Title *</Label>
                          <Input 
                            id="event-title" 
                            value={eventFormValues.title}
                            onChange={(e) => setEventFormValues(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="e.g., Anniversary, Trip, Achievement"
                          />
                        </div>
                        <div>
                          <Label htmlFor="event-date">Event Date *</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !eventFormValues.date && "text-muted-foreground"
                                )}
                              >
                                <CalendarDays className="mr-2 h-4 w-4" />
                                {eventFormValues.date ? formatDateFnInternal(eventFormValues.date, "PPP") : <span>Pick a date</span>}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={eventFormValues.date}
                                onSelect={(date) => setEventFormValues(prev => ({ ...prev, date: date || null }))}
                                initialFocus
                                disabled={(date) => date > new Date() || date < new Date("1900-01-01")} 
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div>
                          <Label htmlFor="event-description">Description (Optional)</Label>
                          <Textarea
                            id="event-description"
                            value={eventFormValues.description}
                            onChange={(e) => setEventFormValues(prev => ({...prev, description: e.target.value}))}
                            placeholder="Add any relevant details about the event."
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => {setIsEventDialogOpen(false); setEventFormValues({title: '', date: null, description: ''});}} disabled={isSavingEvent}>
                          Cancel
                        </Button>
                        <Button type="button" onClick={handleSaveNotableEvent} disabled={isSavingEvent || !eventFormValues.title || !eventFormValues.date}>
                          {isSavingEvent && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Save Event
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardFooter>
              </Card>
            </TabsContent>

          </Tabs>
        </CardContent>
        <CardFooter className="border-t pt-4 text-xs text-muted-foreground">
            <p>Contact created on: <ClientSideFormattedDate date={contact.createdAt} format="PPpp" /></p>
            <p className="ml-auto">Last updated: <ClientSideFormattedDate date={contact.updatedAt} format="PPpp" /></p>
        </CardFooter>
      </Card>
    </div>
  );
}

      

    

    
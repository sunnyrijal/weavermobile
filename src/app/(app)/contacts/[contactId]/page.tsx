"use client";

import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { mockContacts } from "@/lib/mockData";
import type { Contact } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Edit3, Mail, Phone, MapPin, Briefcase, Building, CalendarDays, Tags, Link2, Users, Camera, MessageSquare, Loader2 } from "lucide-react";
import React, { useState, useEffect } from 'react';

const getInitials = (name: string) => {
  const names = name.split(' ');
  if (names.length > 1) {
    return names[0][0].toUpperCase() + names[names.length - 1][0].toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

export default function ContactDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const contactId = params.contactId as string;

  // Local state for contact to allow "mock" updates for notes
  const [contact, setContact] = useState<Contact | undefined | null>(undefined);
  const [notesInput, setNotesInput] = useState('');
  const [isNotesDialogOpen, setIsNotesDialogOpen] = useState(false);
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  useEffect(() => {
    const foundContact = mockContacts.find((c) => c.id === contactId);
    setContact(foundContact);
    if (foundContact) {
      setNotesInput(foundContact.notes || "");
    }
  }, [contactId]);


  const [formattedBirthday, setFormattedBirthday] = useState<string | null>(null);
  const [formattedCreatedAt, setFormattedCreatedAt] = useState<string | null>(null);
  const [formattedUpdatedAt, setFormattedUpdatedAt] = useState<string | null>(null);

  useEffect(() => {
    if (contact?.birthday) {
      const date = typeof contact.birthday === 'string' ? new Date(contact.birthday + 'T00:00:00Z') : contact.birthday; // Ensure UTC interpretation
      setFormattedBirthday(date.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          timeZone: 'UTC' 
      }));
    } else {
        setFormattedBirthday('N/A');
    }

    if (contact?.createdAt) {
        const date = contact.createdAt instanceof Date ? contact.createdAt : new Date(contact.createdAt);
        setFormattedCreatedAt(date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'UTC' 
        }));
    } else {
        setFormattedCreatedAt('N/A');
    }

    if (contact?.updatedAt) {
        const date = contact.updatedAt instanceof Date ? contact.updatedAt : new Date(contact.updatedAt);
        setFormattedUpdatedAt(date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'UTC' 
        }));
    } else {
        setFormattedUpdatedAt('N/A');
    }
  }, [contact?.birthday, contact?.createdAt, contact?.updatedAt]);


  const handleSaveNotes = async () => {
    if (!contact) return;
    setIsSavingNotes(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Update mock data (this won't persist if page reloads or for other users)
    // For demonstration, update the local state of the contact
    const updatedContact = { ...contact, notes: notesInput, updatedAt: new Date() };
    setContact(updatedContact);

    // Find and update in global mockContacts array if needed for some consistency during session
    // This is a hack for mock data. In a real app, data would be refetched or managed by a state library.
    const contactIndex = mockContacts.findIndex(c => c.id === contactId);
    if (contactIndex !== -1) {
        mockContacts[contactIndex] = { ...mockContacts[contactIndex], notes: notesInput, updatedAt: new Date() };
    }

    console.log("Updated notes for contact:", contactId, "New notes:", notesInput);
    toast({ title: "Notes Saved", description: "Your notes have been updated." });
    setIsSavingNotes(false);
    setIsNotesDialogOpen(false);
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
        
        <CardContent className="pt-20"> {/* Increased padding top to avoid overlap with cover content */}
          <Tabs defaultValue="overview">
            <TabsList className="mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="relationships">Relationships</TabsTrigger>
              <TabsTrigger value="photos">Photos Together</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
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
                        <span>Born {formattedBirthday || 'N/A'}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Professional Details</CardTitle>
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
                  <CardTitle className="text-lg flex items-center"><Tags className="mr-2 h-5 w-5 text-primary"/> Tags &amp; Category</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                   {contact.category && <span className="text-sm"><strong>Category:</strong> <Badge variant="secondary">{contact.category}</Badge></span>}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {contact.tags.map((tag) => (
                      <Badge key={tag} variant="outline">{tag}</Badge>
                    ))}
                  </div>
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

          </Tabs>
        </CardContent>
        <CardFooter className="border-t pt-4 text-xs text-muted-foreground">
          <p>Contact created on: {formattedCreatedAt || 'N/A'}</p>
          <p className="ml-auto">Last updated: {formattedUpdatedAt || 'N/A'}</p>
        </CardFooter>
      </Card>
    </div>
  );
}

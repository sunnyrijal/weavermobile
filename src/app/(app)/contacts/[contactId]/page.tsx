"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
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
import { ArrowLeft, Edit3, Mail, Phone, MapPin, Briefcase, Building, CalendarDays, Tags, Link2, Users, Camera, MessageSquare, Loader2, University, CalendarPlus, PartyPopper, UserCheck, Home, UploadCloud, UserSquare2, Trash2, AlertTriangle } from "lucide-react"; 
import React, { useState, useEffect, useRef } from 'react';
import { format as formatDateFnInternal } from "date-fns";
import { cn } from "@/lib/utils";
import ClientSideFormattedDate from "@/components/shared/ClientSideFormattedDate";
import ContactRelationships from "@/components/contacts/ContactRelationships";
import ContactSocialMediaFeed from "@/components/contacts/ContactSocialMediaFeed";
import { ContactMemories } from '@/components/contacts/ContactMemories';


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

// Helper function to read file as Data URL
const readFileAsDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};


export default function ContactDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const contactId = params.contactId as string;
  const searchParams = useSearchParams();

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
  const [isPhotoDialogOpen, setIsPhotoDialogOpen] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isPhotosTogetherDialogOpen, setIsPhotosTogetherDialogOpen] = useState(false);
  const [isUploadingPhotosTogether, setIsUploadingPhotosTogether] = useState(false);
  const photosTogetherFileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState("overview");

  const [relatedContacts, setRelatedContacts] = useState<Record<string, string>>({});

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);


  useEffect(() => {
    const fetchContactDetails = async () => {
      try {
        const response = await fetch(`/api/contacts/${contactId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setContact(null);
          } else {
            throw new Error('Failed to fetch contact details');
          }
          return;
        }
        
        const data = await response.json();
        setContact(data.contact);
        setNotesInput(data.contact.notes || "");
        
        // Fetch related contact names if relationships exist
        if (data.contact.relationships && data.contact.relationships.length > 0) {
          fetchRelatedContactNames(data.contact.relationships);
        }
      } catch (error) {
        console.error('Error fetching contact details:', error);
        toast({ 
          title: "Error", 
          description: "Failed to load contact details", 
          variant: "destructive" 
        });
      }
    };

    fetchContactDetails();
    
    const tabFromQuery = searchParams.get('tab');
    if (tabFromQuery) {
      setActiveTab(tabFromQuery);
    } else {
      setActiveTab("overview"); 
    }
  }, [contactId, searchParams, toast]);


  const handleSaveNotes = async () => {
    if (!contact) return;
    setIsSavingNotes(true);
    
    try {
      const response = await fetch(`/api/contacts/${contactId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes: notesInput }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update notes');
      }
      
      const data = await response.json();
      setContact(data.contact);
      
      toast({ title: "Notes Saved", description: "Your notes have been updated." });
    } catch (error) {
      console.error('Error saving notes:', error);
      toast({ 
        title: "Error", 
        description: "Failed to save notes", 
        variant: "destructive" 
      });
    } finally {
      setIsSavingNotes(false);
      setIsNotesDialogOpen(false);
    }
  };

  const handleSaveNotableEvent = async () => {
    if (!contact || !eventFormValues.title || !eventFormValues.date) {
        toast({ title: "Missing Information", description: "Please provide at least a title and date for the event.", variant: "destructive"});
        return;
    }
    setIsSavingEvent(true);
    
    try {
      const newEvent: NotableEvent = {
        id: `event-${Date.now()}`,
        title: eventFormValues.title,
        date: formatDateForStorage(eventFormValues.date),
        description: eventFormValues.description || undefined,
      };
      
      const updatedNotableEvents = [...(contact.notableEvents || []), newEvent];
      
      const response = await fetch(`/api/contacts/${contactId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notableEvents: updatedNotableEvents }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add event');
      }
      
      const data = await response.json();
      setContact(data.contact);
      
      toast({ title: "Event Added", description: `${newEvent.title} has been added to notable events.`});
      setEventFormValues({ title: '', date: null, description: '' }); // Reset form
    } catch (error) {
      console.error('Error adding event:', error);
      toast({ 
        title: "Error", 
        description: "Failed to add event", 
        variant: "destructive" 
      });
    } finally {
      setIsSavingEvent(false);
      setIsEventDialogOpen(false);
    }
  };

  const handlePhotoUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!contact) return;
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    try {
      const photoDataUrl = await readFileAsDataURL(file);
      
      const response = await fetch(`/api/contacts/${contactId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ photoURL: photoDataUrl }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update profile photo');
      }
      
      const data = await response.json();
      setContact(data.contact);
      
      toast({ title: "Profile Photo Updated", description: "The new photo has been uploaded." });
      setIsPhotoDialogOpen(false); // Close dialog on success
    } catch (error) {
      console.error("Error uploading photo:", error);
      toast({ title: "Upload Failed", description: "Could not upload the photo.", variant: "destructive" });
    } finally {
      setIsUploadingPhoto(false);
      // Reset file input value to allow uploading the same file again if needed
      if(fileInputRef.current) fileInputRef.current.value = ""; 
    }
  };

  const handlePhotosTogetherUploadClick = () => {
    photosTogetherFileInputRef.current?.click();
  };

  const handlePhotosTogetherFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!contact) return;
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingPhotosTogether(true);
    try {
        const photoDataUrl = await readFileAsDataURL(file);
        const updatedPhotosTogether = [...(contact.photosTogether || []), photoDataUrl];

        const response = await fetch(`/api/contacts/${contactId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ photosTogether: updatedPhotosTogether }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to add photo');
        }
        
        const data = await response.json();
        setContact(data.contact);

        toast({ title: "Photo Added", description: "The photo has been added to 'Photos Together'." });
        setIsPhotosTogetherDialogOpen(false);
    } catch (error) {
        console.error("Error adding photo together:", error);
        toast({ title: "Upload Failed", description: "Could not add the photo.", variant: "destructive" });
    } finally {
        setIsUploadingPhotosTogether(false);
        if (photosTogetherFileInputRef.current) photosTogetherFileInputRef.current.value = "";
    }
  };

  // Add a function to fetch related contact names
  const fetchRelatedContactNames = async (relationships: { relatedContactId: string }[]) => {
    if (!relationships || relationships.length === 0) return;
    
    const contactIds = relationships.map(rel => rel.relatedContactId);
    const contactNames: Record<string, string> = {};
    
    await Promise.all(contactIds.map(async (id) => {
      try {
        const response = await fetch(`/api/contacts/${id}`);
        if (response.ok) {
          const data = await response.json();
          contactNames[id] = data.contact.name;
        }
      } catch (error) {
        console.error(`Error fetching contact ${id}:`, error);
      }
    }));
    
    setRelatedContacts(contactNames);
  };

  // Update the getRelatedContactName function
  const getRelatedContactName = (relatedContactId: string) => {
    return relatedContacts[relatedContactId] || "Unknown Contact";
  };

  // Add delete contact function
  const handleDeleteContact = async () => {
    if (!contact) return;
    setIsDeleting(true);
    
    try {
      const response = await fetch(`/api/contacts/${contactId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete contact');
      }
      
      toast({ 
        title: "Contact Deleted", 
        description: `${contact.name} has been removed from your contacts.` 
      });
      
      // Redirect to contacts page after successful deletion
      router.push('/contacts');
    } catch (error) {
      console.error('Error deleting contact:', error);
      toast({ 
        title: "Error", 
        description: "Failed to delete contact", 
        variant: "destructive" 
      });
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
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
        <Button onClick={() => router.push("/contacts")} className="w-full sm:w-auto">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Contacts
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-2 sm:p-0">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
        <Button variant="outline" onClick={() => router.back()} className="w-full sm:w-auto">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button variant="default" asChild className="w-full sm:w-auto">
            <Link href={`/contacts/${contact.id}/edit`}>
              <Edit3 className="mr-2 h-4 w-4" /> Edit Contact
            </Link>
          </Button>
          <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive" className="w-full sm:w-auto">
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Delete Contact
                </DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete {contact.name}? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-end mt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setIsDeleteDialogOpen(false)} 
                  disabled={isDeleting}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleDeleteContact} 
                  disabled={isDeleting}
                  className="w-full sm:w-auto"
                >
                  {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                  {isDeleting ? "Deleting..." : "Delete Contact"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="shadow-xl overflow-hidden">
        <div className="relative h-32 sm:h-48 bg-muted">
          <Image 
            src={contact.photoURL || `https://picsum.photos/seed/${contact.id}_cover/1000/200`} 
            alt={`${contact.name} cover photo`} 
            fill={true}
            style={{objectFit:"cover"}}
            data-ai-hint="landscape nature"
            className="opacity-50"
            priority={true} 
          />
          <div className="absolute bottom-0 left-0 w-full sm:w-auto p-2 sm:p-4 md:p-6 flex flex-col items-center text-center sm:flex-row sm:items-end sm:space-x-4 sm:text-left">
            <Dialog open={isPhotoDialogOpen} onOpenChange={setIsPhotoDialogOpen}>
              <DialogTrigger asChild>
                <div className="mb-1 sm:mb-0">
                    <Avatar className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 border-2 sm:border-4 border-background shadow-lg cursor-pointer hover:opacity-90 transition-opacity">
                    <AvatarImage src={contact.photoURL} alt={contact.name} data-ai-hint="person avatar large" className="object-cover"/>
                    <AvatarFallback className="text-2xl sm:text-3xl md:text-4xl">{getInitials(contact.name)}</AvatarFallback>
                    </Avatar>
                </div>
              </DialogTrigger>
              <DialogContent className="max-w-xs sm:max-w-md p-0">
                 <DialogHeader className="p-4 border-b">
                    <DialogTitle>{contact.name}'s Profile Photo</DialogTitle>
                  </DialogHeader>
                {contact.photoURL ? (
                  <div className="relative w-full aspect-square">
                    <Image
                      src={contact.photoURL}
                      alt={`${contact.name}'s profile photo - enlarged`}
                      fill
                      style={{objectFit: "contain"}}
                      data-ai-hint="person avatar large"
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-48 sm:h-64 bg-muted">
                    <p className="text-muted-foreground">No profile photo available.</p>
                  </div>
                )}
                 <DialogFooter className="p-4 border-t flex flex-col sm:flex-row justify-between gap-2 sm:justify-end">
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        style={{ display: 'none' }} 
                        accept="image/*"
                    />
                    <Button variant="outline" onClick={() => setIsPhotoDialogOpen(false)} disabled={isUploadingPhoto} className="w-full sm:w-auto">Cancel</Button>
                    <Button onClick={handlePhotoUploadClick} disabled={isUploadingPhoto} className="w-full sm:w-auto">
                        {isUploadingPhoto ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
                        Upload New Photo
                    </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <div>
              <CardTitle className="text-xl sm:text-2xl md:text-3xl font-bold text-card-foreground drop-shadow-sm">{contact.name}</CardTitle>
              {contact.occupation && (
                <CardDescription className="text-base sm:text-lg text-muted-foreground drop-shadow-sm">
                  {contact.occupation} {contact.company && !(contact.occupation?.toLowerCase().includes("student") && contact.company === contact.college) && `at ${contact.company}`}
                </CardDescription>
              )}
            </div>
          </div>
        </div>
        
        <CardContent className="pt-24 sm:pt-28 md:pt-20"> {/* Adjusted pt for stacked avatar */}
           <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue="overview">
            <TabsList className="mb-4 grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="relationships">Relationships</TabsTrigger>
              <TabsTrigger value="photos">Photos Together</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
              <TabsTrigger value="events">Notable Events</TabsTrigger>
              <TabsTrigger value="memories">Memories</TabsTrigger>
            </TabsList>

            {activeTab === "overview" && (
            <TabsContent value="overview" className="space-y-4 sm:space-y-6">
              <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-md sm:text-lg">Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                    {contact.email && (
                      <div className="flex items-center">
                        <Mail className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                        <a href={`mailto:${contact.email}`} className="text-primary hover:underline break-all">{contact.email}</a>
                      </div>
                    )}
                    {contact.phone && (
                      <div className="flex items-center">
                        <Phone className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                        <span>{contact.phone}</span>
                      </div>
                    )}
                    {contact.hometown && (
                       <div className="flex items-center">
                        <Home className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                        <span>From: {contact.hometown}</span>
                      </div>
                    )}
                    {contact.currentLocation && (
                       <div className="flex items-center">
                        <MapPin className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                        <span>Lives in: {contact.currentLocation}</span>
                      </div>
                    )}
                     {contact.birthday && (
                       <div className="flex items-center">
                        <CalendarDays className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                         <ClientSideFormattedDate date={contact.birthday} prefix="Born " />
                      </div>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-md sm:text-lg">Professional &amp; Education</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                    {contact.occupation && (
                      <div className="flex items-center">
                        <Briefcase className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                        <span>{contact.occupation}</span>
                      </div>
                    )}
                    {contact.company && !(contact.occupation?.toLowerCase().includes("student") && contact.company === contact.college) && (
                      <div className="flex items-center">
                        <Building className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                        <span>{contact.company}</span>
                      </div>
                    )}
                    {contact.college && (
                      <div className="flex items-center">
                        <University className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                        <span>{contact.college}</span>
                      </div>
                    )}
                    {contact.socialProfiles && Object.entries(contact.socialProfiles).map(([platform, url]) => url && (
                      <div key={platform} className="flex items-center">
                        <Link2 className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                        <a href={url.startsWith('http') ? url : `https://${url}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline capitalize break-all">
                          {platform}
                        </a>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-md sm:text-lg flex items-center"><Tags className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-primary"/> Tags &amp; Categories</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs sm:text-sm">
                    <div className="space-y-1 sm:space-y-2">
                        <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                            <span className="font-medium">Primary Category:</span>
                            {contact.category ? (
                            <Badge variant="secondary" className="text-xs sm:text-sm">{contact.category}</Badge>
                            ) : (
                            <span className="text-muted-foreground">N/A</span>
                            )}
                        </div>
                        
                        <div className="flex flex-wrap gap-1 sm:gap-2 items-start">
                            <span className="font-medium self-center pt-0.5">General Tags:</span>
                            {contact.tags && contact.tags.length > 0 ? (
                            contact.tags.map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs sm:text-sm">{tag}</Badge>
                            ))
                            ) : (
                                <span className="text-muted-foreground">No general tags.</span>
                            )}
                        </div>
                    </div>
                 
                  {(!contact.category && (!contact.tags || contact.tags.length === 0)) && 
                    !contact.ownerRelationshipLabel &&
                     <p className="text-muted-foreground">No tags or categories defined.</p>
                  }
                   {contact.ownerRelationshipLabel && (
                     <>
                        <Separator className="my-2 sm:my-3" />
                        <div className="flex items-center gap-1 sm:gap-2">
                        <span className="font-medium">My Relationship:</span>
                        <Badge variant="outline" className="bg-accent/20 border-accent text-accent-foreground text-xs sm:text-sm">
                                <UserCheck className="mr-1 h-3 w-3 sm:mr-1.5 sm:h-3.5 sm:w-3.5" />
                                {contact.ownerRelationshipLabel}
                            </Badge>
                        </div>
                     </>
                  )}
                </CardContent>
              </Card>
              <ContactSocialMediaFeed socialProfiles={contact.socialProfiles || {}} />
            </TabsContent>
            )}

            {activeTab === "relationships" && (
            <TabsContent value="relationships">
              <Card>
                <CardHeader>
                  <CardTitle className="text-md sm:text-lg flex items-center"><Users className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-primary"/> Relationships</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">How {contact.name} is connected to others in your network.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ContactRelationships
                    relationships={contact.relationships}
                    relatedContacts={Object.fromEntries(Object.entries(relatedContacts).map(([id, name]) => [{ id, name }]))}
                    contactName={contact.name}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            )}
            
            {activeTab === "photos" && (
            <TabsContent value="photos">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-md sm:text-lg flex items-center"><Camera className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-primary"/> Photos Together</CardTitle>
                        <CardDescription className="text-xs sm:text-sm">Visual memories with {contact.name}.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {contact.photosTogether && contact.photosTogether.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-4">
                                {contact.photosTogether.map((photoUrl, index) => (
                                  <Dialog key={index}>
                                    <DialogTrigger asChild>
                                      <div className="aspect-square rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow cursor-pointer">
                                          <Image 
                                              src={photoUrl} 
                                              alt={`Photo with ${contact.name} ${index + 1}`} 
                                              width={200} 
                                              height={200} 
                                              className="object-cover w-full h-full"
                                              data-ai-hint="people event"
                                          />
                                      </div>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-sm sm:max-w-xl p-0">
                                       <DialogHeader className="p-4 border-b">
                                          <DialogTitle>Photo with {contact.name}</DialogTitle>
                                        </DialogHeader>
                                        <div className="relative w-full aspect-video">
                                          <Image
                                            src={photoUrl}
                                            alt={`Photo with ${contact.name} ${index + 1} - enlarged`}
                                            fill
                                            style={{objectFit: "contain"}}
                                            data-ai-hint="people event"
                                          />
                                        </div>
                                    </DialogContent>
                                  </Dialog>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted-foreground text-xs sm:text-sm">No photos together have been added yet.</p>
                        )}
                    </CardContent>
                     <CardFooter>
                        <Dialog open={isPhotosTogetherDialogOpen} onOpenChange={setIsPhotosTogetherDialogOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="w-full sm:w-auto text-xs sm:text-sm h-8 sm:h-9"><UploadCloud className="mr-2 h-3 w-3 sm:h-4 sm:w-4" /> Add Photo</Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                                <DialogHeader>
                                    <DialogTitle>Add Photo with {contact.name}</DialogTitle>
                                    <DialogDescription>
                                        Select an image file to add to your shared memories.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <input
                                        type="file"
                                        ref={photosTogetherFileInputRef}
                                        onChange={handlePhotosTogetherFileChange}
                                        style={{ display: 'none' }}
                                        accept="image/*"
                                    />
                                    <Button onClick={handlePhotosTogetherUploadClick} disabled={isUploadingPhotosTogether} className="w-full text-xs sm:text-sm h-8 sm:h-9">
                                        {isUploadingPhotosTogether ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />}
                                        {isUploadingPhotosTogether ? "Uploading..." : "Select Photo from Device"}
                                    </Button>
                                </div>
                                <DialogFooter className="flex-col sm:flex-row gap-2">
                                    <Button variant="outline" onClick={() => setIsPhotosTogetherDialogOpen(false)} disabled={isUploadingPhotosTogether} className="w-full sm:w-auto text-xs sm:text-sm h-8 sm:h-9">
                                        Cancel
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </CardFooter>
                </Card>
            </TabsContent>
            )}

            {activeTab === "notes" && (
            <TabsContent value="notes">
               <Card>
                <CardHeader>
                    <CardTitle className="text-md sm:text-lg flex items-center"><MessageSquare className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-primary"/> Notes</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">Personal notes and reminders about {contact.name}.</CardDescription>
                </CardHeader>
                <CardContent>
                    {contact.notes ? (
                        <p className="whitespace-pre-wrap text-xs sm:text-sm leading-relaxed">{contact.notes}</p>
                    ) : (
                        <p className="text-muted-foreground text-xs sm:text-sm">No notes added yet for {contact.name}.</p>
                    )}
                </CardContent>
                 <CardFooter>
                    <Dialog open={isNotesDialogOpen} onOpenChange={setIsNotesDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="w-full sm:w-auto text-xs sm:text-sm h-8 sm:h-9">Edit Notes</Button>
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
                                        className="col-span-4 min-h-[100px] sm:min-h-[150px] text-xs sm:text-sm"
                                        placeholder="Type your notes here..."
                                    />
                                </div>
                            </div>
                            <DialogFooter className="flex-col sm:flex-row gap-2">
                                <Button variant="outline" onClick={() => setIsNotesDialogOpen(false)} disabled={isSavingNotes} className="w-full sm:w-auto text-xs sm:text-sm h-8 sm:h-9">Cancel</Button>
                                <Button type="button" onClick={handleSaveNotes} disabled={isSavingNotes} className="w-full sm:w-auto text-xs sm:text-sm h-8 sm:h-9">
                                    {isSavingNotes && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Save Notes
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </CardFooter>
               </Card>
            </TabsContent>
            )}

            {activeTab === "events" && (
            <TabsContent value="events">
              <Card>
                <CardHeader>
                  <CardTitle className="text-md sm:text-lg flex items-center"><PartyPopper className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-primary"/> Notable Events</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Keep track of important dates and milestones with {contact.name}.</CardDescription>
                </CardHeader>
                <CardContent>
                  {contact.notableEvents && contact.notableEvents.length > 0 ? (
                    <div className="space-y-2 sm:space-y-4">
                      {contact.notableEvents.map(event => (
                        <Card key={event.id} className="shadow-sm">
                          <CardHeader className="pb-2 flex-row items-center justify-between">
                            <CardTitle className="text-sm sm:text-md">
                              {event.title}
                            </CardTitle>
                            <ClientSideFormattedDate date={event.date} className="text-xs font-normal text-muted-foreground"/>
                          </CardHeader>
                          {event.description && (
                            <CardContent>
                              <p className="text-xs sm:text-sm text-muted-foreground">{event.description}</p>
                            </CardContent>
                          )}
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-xs sm:text-sm">No notable events added yet for {contact.name}.</p>
                  )}
                </CardContent>
                <CardFooter>
                  <Dialog open={isEventDialogOpen} onOpenChange={setIsEventDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full sm:w-auto text-xs sm:text-sm h-8 sm:h-9"><CalendarPlus className="mr-2 h-3 w-3 sm:h-4 sm:w-4" /> Add Event</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Add Notable Event for {contact.name}</DialogTitle>
                        <DialogDescription>
                          Record a new significant date or milestone.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4 text-xs sm:text-sm">
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
                                  "w-full justify-start text-left font-normal h-8 sm:h-9",
                                  !eventFormValues.date && "text-muted-foreground"
                                )}
                              >
                                <CalendarDays className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
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
                      <DialogFooter className="flex-col sm:flex-row gap-2">
                        <Button variant="outline" onClick={() => {setIsEventDialogOpen(false); setEventFormValues({title: '', date: null, description: ''});}} disabled={isSavingEvent} className="w-full sm:w-auto text-xs sm:text-sm h-8 sm:h-9">
                          Cancel
                        </Button>
                        <Button type="button" onClick={handleSaveNotableEvent} disabled={isSavingEvent || !eventFormValues.title || !eventFormValues.date} className="w-full sm:w-auto text-xs sm:text-sm h-8 sm:h-9">
                          {isSavingEvent && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Save Event
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardFooter>
              </Card>
            </TabsContent>
            )}

            {activeTab === "memories" && (
              <TabsContent value="memories">
                <ContactMemories contactId={contactId} />
              </TabsContent>
            )}
          </Tabs>
        </CardContent>
        <CardFooter className="border-t pt-2 sm:pt-4 text-xs text-muted-foreground flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2">
            <ClientSideFormattedDate date={contact.createdAt} format="PPpp" prefix="Contact created on: " />
            <ClientSideFormattedDate date={contact.updatedAt} format="PPpp" prefix="Last updated: " className="sm:ml-auto"/>
        </CardFooter>
      </Card>
    </div>
  );
}




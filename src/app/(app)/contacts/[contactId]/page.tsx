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
import { ArrowLeft, Edit3, Mail, Phone, MapPin, Briefcase, Building, CalendarDays, Tags, Link2, Users, Camera, MessageSquare, Loader2, University, CalendarPlus, PartyPopper, UserCheck, Home, UploadCloud, UserSquare2, Trash2, AlertTriangle, Save, X } from "lucide-react"; 
import React, { useState, useEffect, useRef } from 'react';
import { format as formatDateFnInternal } from "date-fns";
import { cn } from "@/lib/utils";
import ClientSideFormattedDate from "@/components/shared/ClientSideFormattedDate";
import ContactRelationships from "@/components/contacts/ContactRelationships";
import ContactSocialMediaFeed from "@/components/contacts/ContactSocialMediaFeed";
import { ContactMemories } from '@/components/contacts/ContactMemories';
import { ContactDeleteModal } from '@/components/contacts/ContactDeleteModal';



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

  // Helper function to parse basic information from notes
  const parseBasicInfoFromNotes = (notes: string) => {
    const basicInfoMatch = notes.match(/\[BASIC INFO: (.+?)\]/);
    if (!basicInfoMatch) return null;
    
    const basicInfoText = basicInfoMatch[1];
    const info: any = {};
    
    // Parse each piece of information
    const parts = basicInfoText.split(' | ');
    parts.forEach(part => {
      const [key, value] = part.split(': ');
      if (key && value) {
        switch (key.trim()) {
          case 'Height':
            info.height = value.trim();
            break;
          case 'Eye Color':
            info.eyeColor = value.trim();
            break;
          case 'Hair Color':
            info.hairColor = value.trim();
            break;
          case 'Body Type':
            info.bodyType = value.trim();
            break;
          case 'Dressing Style':
            info.dressingStyle = value.trim();
            break;
        }
      }
    });
    
    return Object.keys(info).length > 0 ? info : null;
  };

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

  const [relatedContacts, setRelatedContacts] = useState<Record<string, any>>({});
  const [contactsList, setContactsList] = useState<{ id: string; name: string; category?: string }[]>([]);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);

  const [hiddenNotesInput, setHiddenNotesInput] = useState('');
  const [isHiddenNotesDialogOpen, setIsHiddenNotesDialogOpen] = useState(false);
  const [isSavingHiddenNotes, setIsSavingHiddenNotes] = useState(false);
  const [isPasscodeDialogOpen, setIsPasscodeDialogOpen] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState('');
  const [passcodeError, setPasscodeError] = useState('');
  const [isExtractingBasicInfo, setIsExtractingBasicInfo] = useState(false);
  const [hiddenNotesUnlocked, setHiddenNotesUnlocked] = useState(false);
  
  // Inline editing states
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    nickname: '',
    email: '',
    phone: '',
    hometown: '',
    currentLocation: '',
    birthday: '',
    occupation: '',
    company: '',
    college: '',
    category: '',
    tags: [] as string[],
    ownerRelationshipLabel: '',
    height: '',
    eyeColor: '',
    hairColor: '',
    skinTone: '',
    ethnicity: '',
    bodyType: '',
    dressingStyle: '',
    facialFeatures: '',
    distinguishingFeatures: '',
    voice: '',
    accent: '',
    notes: ''
  });
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const highlight = searchParams.get('highlight');


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
      setHiddenNotesInput(data.contact.hiddenNotes || "");
      
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

  useEffect(() => {
    fetchContactDetails();
    fetchContactsList();
    
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

  const handleDeletePhoto = async (photoIndex: number) => {
    if (!contact) return;
    
    try {
      const updatedPhotosTogether = contact.photosTogether?.filter((_, index) => index !== photoIndex) || [];

      const response = await fetch(`/api/contacts/${contactId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ photosTogether: updatedPhotosTogether }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete photo');
      }
      
      const data = await response.json();
      setContact(data.contact);

      toast({ title: "Photo Deleted", description: "The photo has been removed from 'Photos Together'." });
    } catch (error) {
      console.error("Error deleting photo:", error);
      toast({ title: "Delete Failed", description: "Could not delete the photo.", variant: "destructive" });
    }
  };

  const handleSaveHiddenNotes = async () => {
    if (!contact) return;
    setIsSavingHiddenNotes(true);
    try {
      const response = await fetch(`/api/contacts/${contactId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ hiddenNotes: hiddenNotesInput }),
      });
      if (!response.ok) {
        throw new Error('Failed to update hidden notes');
      }
      const data = await response.json();
      setContact(data.contact);
      toast({ title: "Hidden Notes Saved", description: "Your hidden notes have been updated." });
    } catch (error) {
      console.error('Error saving hidden notes:', error);
      toast({ title: "Error", description: "Failed to save hidden notes", variant: "destructive" });
    } finally {
      setIsSavingHiddenNotes(false);
      setIsHiddenNotesDialogOpen(false);
    }
  };

  // Add a function to fetch related contact names
  const fetchRelatedContactNames = async (relationships: { relatedContactId: string }[]) => {
    if (!relationships || relationships.length === 0) return;
    
    const contactIds = relationships.map(rel => rel.relatedContactId);
    const contactMap: Record<string, any> = {};
    
    await Promise.all(contactIds.map(async (id) => {
      try {
        const response = await fetch(`/api/contacts/${id}`);
        if (response.ok) {
          const data = await response.json();
          contactMap[id] = {
            id: data.contact.id,
            name: data.contact.name,
            photoURL: data.contact.photoURL,
            category: data.contact.category,
          };
        }
      } catch (error) {
        console.error(`Error fetching contact ${id}:`, error);
      }
    }));
    
    setRelatedContacts(contactMap);
  };

  const fetchContactsList = async () => {
    try {
      const response = await fetch('/api/contacts?ownerId=user1');
      if (response.ok) {
        const data = await response.json();
        const contactsForRelationships = data.contacts.map((contact: any) => ({
          id: contact._id || contact.id,
          name: contact.name,
          category: contact.category
        }));
        setContactsList(contactsForRelationships);
      }
    } catch (error) {
      console.error('Error fetching contacts list:', error);
    }
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

  const handleOpenDeleteModal = () => {
    setContactToDelete(contact);
    setIsDeleteDialogOpen(true);
  };

  const handleContactDeleted = () => {
    router.push('/contacts');
  };

  const handleExtractBasicInfo = async () => {
    if (!contact) return;
    
    setIsExtractingBasicInfo(true);
    try {
      const response = await fetch('/api/contacts/extract-basic-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId: contact.id,
          ownerId: contact.ownerId
        })
      });

      const result = await response.json();
      
      if (result.success) {
        // Update the local contact state with the extracted information
        setContact(prev => prev ? { ...prev, ...result.contact } : null);
        
        toast({
          title: "Basic Information Extracted",
          description: `Successfully extracted ${Object.keys(result.extractedFields).length} basic information fields from ${contact.name}'s notes.`
        });
      } else {
        toast({
          title: "No Basic Information Found",
          description: "No basic information could be extracted from the notes.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error extracting basic information:', error);
      toast({
        title: "Error",
        description: "Failed to extract basic information.",
        variant: "destructive"
      });
    } finally {
      setIsExtractingBasicInfo(false);
    }
  };

  // Inline editing functions
  const startEditing = (section: string) => {
    if (!contact) return;
    
    setEditFormData({
      name: contact.name || '',
      nickname: contact.nickname || '',
      email: contact.email || '',
      phone: contact.phone || '',
      hometown: contact.hometown || '',
      currentLocation: contact.currentLocation || '',
      birthday: contact.birthday || '',
      occupation: contact.occupation || '',
      company: contact.company || '',
      college: contact.college || '',
      category: contact.category || '',
      tags: contact.tags || [],
      ownerRelationshipLabel: contact.ownerRelationshipLabel || '',
      height: contact.height || '',
      eyeColor: contact.eyeColor || '',
      hairColor: contact.hairColor || '',
      skinTone: contact.skinTone || '',
      ethnicity: contact.ethnicity || '',
      bodyType: contact.bodyType || '',
      dressingStyle: contact.dressingStyle || '',
      facialFeatures: contact.facialFeatures || '',
      distinguishingFeatures: contact.distinguishingFeatures || '',
      voice: contact.voice || '',
      accent: contact.accent || '',
      notes: contact.notes || ''
    });
    setEditingSection(section);
  };

  const cancelEditing = () => {
    setEditingSection(null);
    setEditFormData({
      name: '',
      nickname: '',
      email: '',
      phone: '',
      hometown: '',
      currentLocation: '',
      birthday: '',
      occupation: '',
      company: '',
      college: '',
      category: '',
      tags: [],
      ownerRelationshipLabel: '',
      height: '',
      eyeColor: '',
      hairColor: '',
      skinTone: '',
      ethnicity: '',
      bodyType: '',
      dressingStyle: '',
      facialFeatures: '',
      distinguishingFeatures: '',
      voice: '',
      accent: '',
      notes: ''
    });
  };

  const saveEdit = async () => {
    if (!contact || !editingSection) return;
    
    setIsSavingEdit(true);
    try {
      const updateData: any = {};
      
      // Map section to fields
      switch (editingSection) {
        case 'name':
          updateData.name = editFormData.name;
          updateData.nickname = editFormData.nickname;
          break;
        case 'contact':
          updateData.email = editFormData.email;
          updateData.phone = editFormData.phone;
          updateData.hometown = editFormData.hometown;
          updateData.currentLocation = editFormData.currentLocation;
          updateData.birthday = editFormData.birthday;
          break;
        case 'professional':
          updateData.occupation = editFormData.occupation;
          updateData.company = editFormData.company;
          updateData.college = editFormData.college;
          break;
        case 'basic':
          updateData.height = editFormData.height;
          updateData.eyeColor = editFormData.eyeColor;
          updateData.hairColor = editFormData.hairColor;
          updateData.skinTone = editFormData.skinTone;
          updateData.ethnicity = editFormData.ethnicity;
          updateData.bodyType = editFormData.bodyType;
          updateData.dressingStyle = editFormData.dressingStyle;
          updateData.facialFeatures = editFormData.facialFeatures;
          updateData.distinguishingFeatures = editFormData.distinguishingFeatures;
          updateData.voice = editFormData.voice;
          updateData.accent = editFormData.accent;
          break;
        case 'tags':
          updateData.category = editFormData.category;
          updateData.tags = editFormData.tags;
          updateData.ownerRelationshipLabel = editFormData.ownerRelationshipLabel;
          break;
        case 'notes':
          updateData.notes = editFormData.notes;
          break;
      }
      
      const response = await fetch(`/api/contacts/${contact.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update contact');
      }
      
      const data = await response.json();
      setContact(data.contact);
      setEditingSection(null);
      toast({ title: "Updated", description: "Contact information has been updated." });
    } catch (error) {
      console.error('Error saving edit:', error);
      toast({ 
        title: "Error", 
        description: "Failed to save changes", 
        variant: "destructive" 
      });
    } finally {
      setIsSavingEdit(false);
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
          <Button 
            variant="destructive" 
            className="w-full sm:w-auto"
            onClick={handleOpenDeleteModal}
          >
            <Trash2 className="mr-2 h-4 w-4" /> Delete
          </Button>
        </div>
      </div>

      {/* Contact Delete Modal */}
      <ContactDeleteModal
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setContactToDelete(null);
        }}
        contact={contactToDelete}
        onContactDeleted={handleContactDeleted}
      />

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
                        aria-hidden="true" 
                        tabIndex={-1}
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
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl sm:text-2xl md:text-3xl font-bold text-white drop-shadow-lg bg-black/20 px-2 py-1 rounded">
                  {editingSection === 'name' ? (
                    <div className="flex flex-col gap-2">
                      <Input
                        value={editFormData.name}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Full Name"
                        className="text-xl sm:text-2xl md:text-3xl font-bold"
                      />
                      <Input
                        value={editFormData.nickname}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, nickname: e.target.value }))}
                        placeholder="Nickname (optional)"
                        className="text-base sm:text-lg"
                      />
                    </div>
                  ) : (
                    <>
                      {contact.name}{contact.nickname ? ` (${contact.nickname})` : ''}
                    </>
                  )}
                </CardTitle>
                {editingSection === 'name' ? (
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={saveEdit} disabled={isSavingEdit}>
                      {isSavingEdit ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={cancelEditing}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => startEditing('name')}
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {contact.occupation && (
                <CardDescription className="text-base sm:text-lg text-white drop-shadow-lg bg-black/20 px-2 py-1 rounded mt-1">
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
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-md sm:text-lg">Contact Information</CardTitle>
                      {editingSection === 'contact' ? (
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={saveEdit} disabled={isSavingEdit}>
                            {isSavingEdit ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                          </Button>
                          <Button variant="ghost" size="sm" onClick={cancelEditing}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => startEditing('contact')}
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                  </CardHeader>
                  <CardContent className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                    {editingSection === 'contact' ? (
                      <>
                        <div className="flex items-center">
                          <Mail className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                          <Input
                            value={editFormData.email}
                            onChange={(e) => setEditFormData(prev => ({ ...prev, email: e.target.value }))}
                            placeholder="Email"
                            className="h-6 text-xs"
                          />
                        </div>
                        <div className="flex items-center">
                          <Phone className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                          <Input
                            value={editFormData.phone}
                            onChange={(e) => setEditFormData(prev => ({ ...prev, phone: e.target.value }))}
                            placeholder="Phone"
                            className="h-6 text-xs"
                          />
                        </div>
                        <div className="flex items-center">
                          <Home className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                          <Input
                            value={editFormData.hometown}
                            onChange={(e) => setEditFormData(prev => ({ ...prev, hometown: e.target.value }))}
                            placeholder="Hometown"
                            className="h-6 text-xs"
                          />
                        </div>
                        <div className="flex items-center">
                          <MapPin className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                          <Input
                            value={editFormData.currentLocation}
                            onChange={(e) => setEditFormData(prev => ({ ...prev, currentLocation: e.target.value }))}
                            placeholder="Current Location"
                            className="h-6 text-xs"
                          />
                        </div>
                        <div className="flex items-center">
                          <CalendarDays className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                          <Input
                            value={editFormData.birthday}
                            onChange={(e) => setEditFormData(prev => ({ ...prev, birthday: e.target.value }))}
                            placeholder="Birthday (YYYY-MM-DD)"
                            className="h-6 text-xs"
                          />
                        </div>
                      </>
                    ) : (
                      <>
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
                            <span>{contact.currentLocation}</span>
                          </div>
                        )}
                         {contact.birthday && (
                           <div className="flex items-center">
                            <CalendarDays className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                             <ClientSideFormattedDate date={contact.birthday} prefix="Born " />
                          </div>
                        )}
                        {contact.age && (
                          <div className="flex items-center">
                            <CalendarDays className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                            <span>Age: {contact.age} years old</span>
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-md sm:text-lg">Professional &amp; Education</CardTitle>
                      {editingSection === 'professional' ? (
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={saveEdit} disabled={isSavingEdit}>
                            {isSavingEdit ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                          </Button>
                          <Button variant="ghost" size="sm" onClick={cancelEditing}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button variant="ghost" size="sm" onClick={() => startEditing('professional')}>
                          <Edit3 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                    {editingSection === 'professional' ? (
                      <>
                        <div className="flex items-center">
                          <Briefcase className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                          <Input
                            value={editFormData.occupation}
                            onChange={(e) => setEditFormData(prev => ({ ...prev, occupation: e.target.value }))}
                            placeholder="Occupation"
                            className="h-6 text-xs"
                          />
                        </div>
                        <div className="flex items-center">
                          <Building className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                          <Input
                            value={editFormData.company}
                            onChange={(e) => setEditFormData(prev => ({ ...prev, company: e.target.value }))}
                            placeholder="Company"
                            className="h-6 text-xs"
                          />
                        </div>
                        <div className="flex items-center">
                          <University className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                          <Input
                            value={editFormData.college}
                            onChange={(e) => setEditFormData(prev => ({ ...prev, college: e.target.value }))}
                            placeholder="College/University"
                            className="h-6 text-xs"
                          />
                        </div>
                      </>
                    ) : (
                      <>
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
                        {contact.major && (
                          <div className="flex items-center">
                            <University className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                            <span>Major: {contact.major}</span>
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
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
              
              {/* Basic Information Section */}
              {(() => {
                const hasBasicInfo = contact.height || contact.eyeColor || contact.hairColor || contact.bodyType || contact.dressingStyle || contact.skinTone || contact.ethnicity || contact.facialFeatures || contact.distinguishingFeatures || contact.voice || contact.accent;
                
                return hasBasicInfo ? (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-md sm:text-lg flex items-center">
                        <UserSquare2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-primary"/>
                        Basic Information
                      </CardTitle>
                      {editingSection === 'basic' ? (
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={saveEdit} disabled={isSavingEdit}>
                            {isSavingEdit ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                          </Button>
                          <Button variant="ghost" size="sm" onClick={cancelEditing}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button variant="ghost" size="sm" onClick={() => startEditing('basic')}>
                          <Edit3 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                    {editingSection === 'basic' ? (
                      <>
                        <div className="flex items-center">
                          <UserSquare2 className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                          <Input
                            value={editFormData.height}
                            onChange={(e) => setEditFormData(prev => ({ ...prev, height: e.target.value }))}
                            placeholder="Height"
                            className="h-6 text-xs"
                          />
                        </div>
                        <div className="flex items-center">
                          <UserSquare2 className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                          <Input
                            value={editFormData.eyeColor}
                            onChange={(e) => setEditFormData(prev => ({ ...prev, eyeColor: e.target.value }))}
                            placeholder="Eye Color"
                            className="h-6 text-xs"
                          />
                        </div>
                        <div className="flex items-center">
                          <UserSquare2 className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                          <Input
                            value={editFormData.hairColor}
                            onChange={(e) => setEditFormData(prev => ({ ...prev, hairColor: e.target.value }))}
                            placeholder="Hair Color"
                            className="h-6 text-xs"
                          />
                        </div>
                        <div className="flex items-center">
                          <UserSquare2 className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                          <Input
                            value={editFormData.skinTone}
                            onChange={(e) => setEditFormData(prev => ({ ...prev, skinTone: e.target.value }))}
                            placeholder="Skin Tone"
                            className="h-6 text-xs"
                          />
                        </div>
                        <div className="flex items-center">
                          <UserSquare2 className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                          <Input
                            value={editFormData.bodyType}
                            onChange={(e) => setEditFormData(prev => ({ ...prev, bodyType: e.target.value }))}
                            placeholder="Body Type"
                            className="h-6 text-xs"
                          />
                        </div>
                        <div className="flex items-center">
                          <UserSquare2 className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                          <Input
                            value={editFormData.facialFeatures}
                            onChange={(e) => setEditFormData(prev => ({ ...prev, facialFeatures: e.target.value }))}
                            placeholder="Facial Features"
                            className="h-6 text-xs"
                          />
                        </div>
                        <div className="flex items-center">
                          <UserSquare2 className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                          <Input
                            value={editFormData.distinguishingFeatures}
                            onChange={(e) => setEditFormData(prev => ({ ...prev, distinguishingFeatures: e.target.value }))}
                            placeholder="Distinguishing Features"
                            className="h-6 text-xs"
                          />
                        </div>
                        <div className="flex items-center">
                          <UserSquare2 className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                          <Input
                            value={editFormData.ethnicity}
                            onChange={(e) => setEditFormData(prev => ({ ...prev, ethnicity: e.target.value }))}
                            placeholder="Ethnicity"
                            className="h-6 text-xs"
                          />
                        </div>
                        <div className="flex items-center">
                          <UserSquare2 className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                          <Input
                            value={editFormData.voice}
                            onChange={(e) => setEditFormData(prev => ({ ...prev, voice: e.target.value }))}
                            placeholder="Voice"
                            className="h-6 text-xs"
                          />
                        </div>
                        <div className="flex items-center">
                          <UserSquare2 className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                          <Input
                            value={editFormData.accent}
                            onChange={(e) => setEditFormData(prev => ({ ...prev, accent: e.target.value }))}
                            placeholder="Accent"
                            className="h-6 text-xs"
                          />
                        </div>
                        <div className="flex items-center">
                          <UserSquare2 className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                          <Input
                            value={editFormData.dressingStyle}
                            onChange={(e) => setEditFormData(prev => ({ ...prev, dressingStyle: e.target.value }))}
                            placeholder="Dressing Style"
                            className="h-6 text-xs"
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        {contact.height && (
                          <div className="flex items-center">
                            <UserSquare2 className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                            <span>Height: {contact.height}</span>
                          </div>
                        )}
                        {contact.eyeColor && (
                          <div className="flex items-center">
                            <UserSquare2 className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                            <span>Eye Color: {contact.eyeColor}</span>
                          </div>
                        )}
                        {contact.hairColor && (
                          <div className="flex items-center">
                            <UserSquare2 className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                            <span>Hair Color: {contact.hairColor}</span>
                          </div>
                        )}
                        {contact.skinTone && (
                          <div className="flex items-center">
                            <UserSquare2 className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                            <span>Skin Tone: {contact.skinTone}</span>
                          </div>
                        )}
                        {contact.bodyType && (
                          <div className="flex items-center">
                            <UserSquare2 className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                            <span>Body Type: {contact.bodyType}</span>
                          </div>
                        )}
                        {contact.facialFeatures && (
                          <div className="flex items-center">
                            <UserSquare2 className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                            <span>Facial Features: {contact.facialFeatures}</span>
                          </div>
                        )}
                        {contact.distinguishingFeatures && (
                          <div className="flex items-center">
                            <UserSquare2 className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                            <span>Distinguishing Features: {contact.distinguishingFeatures}</span>
                          </div>
                        )}
                        {contact.ethnicity && (
                          <div className="flex items-center">
                            <UserSquare2 className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                            <span>Ethnicity: {contact.ethnicity}</span>
                          </div>
                        )}
                        {contact.voice && (
                          <div className="flex items-center">
                            <UserSquare2 className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                            <span>Voice: {contact.voice}</span>
                          </div>
                        )}
                        {contact.accent && (
                          <div className="flex items-center">
                            <UserSquare2 className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                            <span>Accent: {contact.accent}</span>
                          </div>
                        )}
                        {contact.dressingStyle && (
                          <div className="flex items-center">
                            <UserSquare2 className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                            <span>Dressing Style: {contact.dressingStyle}</span>
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              ) : null;
              })()}

              {/* Extract Basic Information Button */}
              {contact.notes && !contact.height && !contact.eyeColor && !contact.hairColor && !contact.bodyType && !contact.dressingStyle && !contact.skinTone && !contact.ethnicity && !contact.facialFeatures && !contact.distinguishingFeatures && !contact.voice && !contact.accent && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-md sm:text-lg flex items-center">
                      <UserSquare2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-primary"/>
                      Extract Basic Information
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Extract height, eye color, hair color, body type, and dressing style from notes
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      onClick={handleExtractBasicInfo}
                      disabled={isExtractingBasicInfo}
                      className="w-full"
                    >
                      {isExtractingBasicInfo ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Extracting...
                        </>
                      ) : (
                        <>
                          <UserSquare2 className="mr-2 h-4 w-4" />
                          Extract from Notes
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )}
              
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-md sm:text-lg flex items-center"><Tags className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-primary"/> Tags &amp; Categories</CardTitle>
                    {editingSection === 'tags' ? (
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={saveEdit} disabled={isSavingEdit}>
                          {isSavingEdit ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={cancelEditing}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button variant="ghost" size="sm" onClick={() => startEditing('tags')}>
                        <Edit3 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-xs sm:text-sm">
                    {editingSection === 'tags' ? (
                      <>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Primary Category:</span>
                            <Input
                              value={editFormData.category}
                              onChange={(e) => setEditFormData(prev => ({ ...prev, category: e.target.value }))}
                              placeholder="Category"
                              className="h-6 text-xs w-32"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">My Relationship:</span>
                            <Input
                              value={editFormData.ownerRelationshipLabel}
                              onChange={(e) => setEditFormData(prev => ({ ...prev, ownerRelationshipLabel: e.target.value }))}
                              placeholder="Relationship"
                              className="h-6 text-xs w-32"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Tags:</span>
                            <Input
                              value={editFormData.tags.join(', ')}
                              onChange={(e) => setEditFormData(prev => ({ 
                                ...prev, 
                                tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)
                              }))}
                              placeholder="Tags (comma separated)"
                              className="h-6 text-xs"
                            />
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
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
                      </>
                    )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-md sm:text-lg flex items-center">
                      <Link2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-primary"/>
                      Social Media
                    </CardTitle>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/contacts/${contact.id}/edit`}>
                        <Edit3 className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <ContactSocialMediaFeed socialProfiles={contact.socialProfiles || {}} />
                </CardContent>
              </Card>
            </TabsContent>
            )}

            {activeTab === "relationships" && (
            <TabsContent value="relationships">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-md sm:text-lg flex items-center"><Users className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-primary"/> Relationships</CardTitle>
                      <CardDescription className="text-xs sm:text-sm">How {contact.name} is connected to others in your network.</CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/contacts/${contact.id}/edit`}>
                        <Edit3 className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <ContactRelationships
                    relationships={contact.relationships}
                    relatedContacts={relatedContacts}
                    contactName={contact.name}
                    editMode={true}
                    contactsList={contactsList}
                    onChange={async (updatedRelationships) => {
                      try {
                        // Update the contact with the new relationships
                        const response = await fetch(`/api/contacts/${contactId}`, {
                          method: 'PATCH',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({
                            relationships: updatedRelationships
                          }),
                        });
                        
                        if (response.ok) {
                          // Refresh the contact data
                          await fetchContactDetails();
                          toast({
                            title: "Relationships Updated",
                            description: "The relationships have been saved successfully.",
                          });
                        } else {
                          throw new Error('Failed to update relationships');
                        }
                      } catch (error) {
                        console.error('Error updating relationships:', error);
                        toast({
                          title: "Error",
                          description: "Failed to save relationships. Please try again.",
                          variant: "destructive"
                        });
                      }
                    }}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            )}
            
            {activeTab === "photos" && (
            <TabsContent value="photos">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-md sm:text-lg flex items-center"><Camera className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-primary"/> Photos Together</CardTitle>
                                <CardDescription className="text-xs sm:text-sm">Visual memories with {contact.name}.</CardDescription>
                            </div>
                            <Button variant="ghost" size="sm" asChild>
                                <Link href={`/contacts/${contact.id}/edit`}>
                                    <Edit3 className="h-4 w-4" />
                                </Link>
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {contact.photosTogether && contact.photosTogether.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-4">
                                {contact.photosTogether.map((photoUrl, index) => (
                                  <div key={index} className="relative group">
                                    <Dialog>
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
                                          <div className="relative w-full aspect-square">
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
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-destructive/90 hover:bg-destructive text-white"
                                      onClick={() => handleDeletePhoto(index)}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
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
                                        aria-hidden="true" 
                                        tabIndex={-1}
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
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-md sm:text-lg flex items-center"><MessageSquare className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-primary"/> Notes</CardTitle>
                            <CardDescription className="text-xs sm:text-sm">Personal notes and reminders about {contact.name}.</CardDescription>
                        </div>
                        {editingSection === 'notes' ? (
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={saveEdit} disabled={isSavingEdit}>
                              {isSavingEdit ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            </Button>
                            <Button variant="ghost" size="sm" onClick={cancelEditing}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button variant="ghost" size="sm" onClick={() => startEditing('notes')}>
                            <Edit3 className="h-4 w-4" />
                          </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    {editingSection === 'notes' ? (
                      <Textarea
                        value={editFormData.notes}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Add your notes here..."
                        className="min-h-[100px] text-xs sm:text-sm"
                      />
                    ) : (
                      <>
                        {contact.notes ? (
                            <p className="whitespace-pre-wrap text-xs sm:text-sm leading-relaxed">{contact.notes}</p>
                        ) : (
                            <p className="text-muted-foreground text-xs sm:text-sm">No notes added yet for {contact.name}.</p>
                        )}
                      </>
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
               {activeTab === "notes" && (
                <>
                  {/* Hidden Notes Section */}
                  <Card className="mb-4 mt-4">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="text-base">Hidden Notes</CardTitle>
                      <Button size="sm" variant="outline" onClick={() => setIsPasscodeDialogOpen(true)}>
                        Edit
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <div className="whitespace-pre-wrap text-muted-foreground text-sm min-h-[40px]">
                        {hiddenNotesUnlocked ? (
                          hiddenNotesInput ? hiddenNotesInput : <span className="italic text-xs">No hidden notes yet.</span>
                        ) : (
                          <span className="italic text-xs">Enter passcode to view hidden notes.</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  {/* Dialogs for Hidden Notes */}
                  <Dialog open={isPasscodeDialogOpen} onOpenChange={setIsPasscodeDialogOpen}>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Enter Passcode</DialogTitle>
                      </DialogHeader>
                      <Input
                        type="password"
                        value={passcodeInput}
                        onChange={e => setPasscodeInput(e.target.value)}
                        placeholder="Enter passcode"
                        aria-label="Passcode"
                        className="mb-2"
                      />
                      {passcodeError && <div className="text-red-500 text-xs mb-2">{passcodeError}</div>}
                      <DialogFooter>
                        <Button
                          onClick={() => {
                            if (passcodeInput === '1234') {
                              setHiddenNotesUnlocked(true);
                              setIsPasscodeDialogOpen(false);
                              setPasscodeInput('');
                              setPasscodeError('');
                              setIsHiddenNotesDialogOpen(true);
                            } else {
                              setPasscodeError('Incorrect passcode');
                            }
                          }}
                        >
                          Unlock
                        </Button>
                        <Button variant="outline" onClick={() => { setIsPasscodeDialogOpen(false); setPasscodeInput(''); setPasscodeError(''); }}>Cancel</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  <Dialog open={isHiddenNotesDialogOpen} onOpenChange={setIsHiddenNotesDialogOpen}>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Hidden Notes</DialogTitle>
                      </DialogHeader>
                      <Textarea
                        value={hiddenNotesInput}
                        onChange={e => setHiddenNotesInput(e.target.value)}
                        placeholder="Enter private notes only you can see..."
                        aria-label="Hidden notes"
                        rows={6}
                        className="mb-4"
                      />
                      <DialogFooter>
                        <Button onClick={handleSaveHiddenNotes} disabled={isSavingHiddenNotes}>
                          {isSavingHiddenNotes ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                          Save
                        </Button>
                        <Button variant="outline" onClick={() => setIsHiddenNotesDialogOpen(false)} disabled={isSavingHiddenNotes}>Cancel</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </>
              )}
            </TabsContent>
            )}

            {activeTab === "events" && (
            <TabsContent value="events">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-md sm:text-lg flex items-center"><PartyPopper className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-primary"/> Notable Events</CardTitle>
                      <CardDescription className="text-xs sm:text-sm">Keep track of important dates and milestones with {contact.name}.</CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/contacts/${contact.id}/edit`}>
                        <Edit3 className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
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
                <ContactMemories contactId={contactId} contactName={contact.name} />
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




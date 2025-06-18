"use client";

import { ContactForm, contactFormSchema } from "@/components/contacts/ContactForm";
import type { ContactFormValues } from "@/lib/types/forms";
import { useToast } from "@/hooks/use-toast";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import React, { useState, useEffect } from "react";
import type { Contact } from "@/lib/types";
import { ArrowLeft, Users, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

// Helper function to read file as Data URL
const readFileAsDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

export default function EditContactPage() {
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const contactId = params.contactId as string;
  const { currentUser } = useAuth();

  const [contact, setContact] = useState<Contact | null | undefined>(undefined); // undefined for loading state
  const [isLoading, setIsLoading] = useState(false);
  const [isFormLoading, setIsFormLoading] = useState(true);

  useEffect(() => {
    const fetchContactDetails = async () => {
      setIsFormLoading(true);
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
      } catch (error) {
        console.error('Error fetching contact details:', error);
        toast({ 
          title: "Error", 
          description: "Failed to load contact details", 
          variant: "destructive" 
        });
        setContact(null);
      } finally {
        setIsFormLoading(false);
      }
    };

    fetchContactDetails();
  }, [contactId, toast]);

  const handleSubmit = async (values: ContactFormValues) => {
    setIsLoading(true);
    if (!currentUser) {
      toast({
        title: "Error",
        description: "You must be logged in to edit a contact.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }
    if (!contact) {
      toast({
        title: "Error",
        description: "Contact not found.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    let photoUrlToStore = values.photoURL;
    if (values.photoFile) {
      try {
        photoUrlToStore = await readFileAsDataURL(values.photoFile);
      } catch (error) {
        console.error("Error converting file to data URL:", error);
        toast({
          title: "Image Upload Error",
          description: "Could not process the uploaded image. Please try again or use a URL.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
    }

    const updatedContactData = {
      ...values,
      photoURL: photoUrlToStore,
      hometown: values.hometown || undefined,
      currentLocation: values.currentLocation || undefined,
      birthday: values.birthday ? format(values.birthday, "yyyy-MM-dd") : undefined,
      college: values.college || undefined, 
      ownerRelationshipLabel: values.ownerRelationshipLabel || undefined,
      tags: values.tags ? values.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
    };
    
    // Remove photoFile from the data to be sent to API
    delete (updatedContactData as any).photoFile;

    try {
      const response = await fetch(`/api/contacts/${contactId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedContactData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update contact');
      }
      
      toast({
        title: "Contact Updated",
        description: `${values.name} has been successfully updated.`,
      });
      
      router.push(`/contacts/${contactId}`); // Redirect to contact detail page
    } catch (error) {
      console.error("Error updating contact:", error);
      toast({
        title: "Update Failed",
        description: "Could not update the contact. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isFormLoading || contact === undefined) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 p-4">
        <Skeleton className="h-8 w-1/4 mb-4" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-12 w-full mt-4" />
      </div>
    );
  }

  if (contact === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Users className="w-16 h-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-semibold mb-2">Contact Not Found</h1>
        <p className="text-muted-foreground mb-4">The contact you are looking for does not exist or cannot be edited.</p>
        <Button onClick={() => router.push("/contacts")} className="w-full sm:w-auto">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Contacts
        </Button>
      </div>
    );
  }
  
  const defaultFormValues: Partial<ContactFormValues> = {
    name: contact.name,
    email: contact.email || '',
    phone: contact.phone || '',
    occupation: contact.occupation || '',
    company: contact.company || '',
    college: contact.college || '', 
    category: contact.category as ContactFormValues['category'] || '',
    ownerRelationshipLabel: contact.ownerRelationshipLabel || '',
    hometown: contact.hometown || '',
    currentLocation: contact.currentLocation || '',
    birthday: contact.birthday ? new Date(contact.birthday + 'T00:00:00') : null, // Ensure correct date parsing for UTC
    photoURL: contact.photoURL || '',
    // photoFile should not be pre-filled from existing data for edit
    tags: contact.tags ? contact.tags.join(', ') : '',
  };


  return (
    <div className="max-w-2xl mx-auto space-y-6">
       <Button variant="outline" onClick={() => router.back()} className="mb-4 w-full sm:w-auto">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
      <ContactForm 
        onSubmit={handleSubmit} 
        defaultValues={defaultFormValues} 
        isEditMode={true}
        isLoading={isLoading}
    />
    </div>
  );
}

// Helper to format date
const format = (date: Date, formatStr: string): string => {
    if (formatStr === "yyyy-MM-dd") {
        const d = new Date(date);
        // Adjust for timezone offset to get correct UTC date
        const year = d.getUTCFullYear();
        const month = (d.getUTCMonth() + 1).toString().padStart(2, '0');
        const day = d.getUTCDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    return date.toISOString();
};


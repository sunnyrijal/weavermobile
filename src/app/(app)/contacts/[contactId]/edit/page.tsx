
"use client";

import { ContactForm, contactFormSchema } from "@/components/contacts/ContactForm";
import type { ContactFormValues } from "@/lib/types/forms";
import { useToast } from "@/hooks/use-toast";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import React, { useState, useEffect } from "react";
import { mockContacts } from "@/lib/mockData";
import type { Contact } from "@/lib/types";
import { ArrowLeft, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

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
    setIsFormLoading(true);
    // Simulate fetching contact data
    const foundContact = mockContacts.find((c) => c.id === contactId);
    if (foundContact) {
      setContact(foundContact);
    } else {
      setContact(null); // Not found
    }
    setIsFormLoading(false);
  }, [contactId]);

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

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    const updatedContactData: Contact = {
      ...contact, // Spread existing contact data
      ...values,  // Spread form values
      updatedAt: new Date(),
      birthday: values.birthday ? format(values.birthday, "yyyy-MM-dd") : undefined,
      college: values.college || undefined, 
      ownerRelationshipLabel: values.ownerRelationshipLabel || undefined,
      tags: values.tags ? values.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
    };

    console.log("Updated Contact Data:", updatedContactData);
    // In a real app, you would update this in Firestore or your backend
    // Update mockContacts array for immediate reflection
    const contactIndex = mockContacts.findIndex(c => c.id === contactId);
    if (contactIndex !== -1) {
        mockContacts[contactIndex] = updatedContactData;
    }


    toast({
      title: "Contact Updated",
      description: `${values.name} has been successfully updated.`,
    });
    setIsLoading(false);
    router.push(`/contacts/${contactId}`); // Redirect to contact detail page
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
        <Button onClick={() => router.push("/contacts")}>
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
    locationDetails: contact.locationDetails || '',
    birthday: contact.birthday ? new Date(contact.birthday + 'T00:00:00') : null, // Ensure correct date parsing for UTC
    photoURL: contact.photoURL || '',
    tags: contact.tags ? contact.tags.join(', ') : '',
  };


  return (
    <div className="max-w-2xl mx-auto space-y-6">
       <Button variant="outline" onClick={() => router.back()} className="mb-4">
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

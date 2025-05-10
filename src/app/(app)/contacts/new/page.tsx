"use client";

import { ContactForm, contactFormSchema } from "@/components/contacts/ContactForm";
import type { ContactFormValues } from "@/lib/types/forms";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import React, { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { mockContacts } from "@/lib/mockData"; // Import mockContacts to add new contact

export default function NewContactPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (values: ContactFormValues) => {
    setIsLoading(true);
    if (!currentUser) {
      toast({
        title: "Error",
        description: "You must be logged in to add a contact.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    const newContactData = {
      ...values,
      id: Date.now().toString(), // Mock ID
      ownerId: currentUser.uid,
      createdAt: new Date(),
      updatedAt: new Date(),
      birthday: values.birthday ? format(values.birthday, "yyyy-MM-dd") : undefined,
      college: values.college || undefined, // Add college
      tags: values.tags ? values.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
      socialProfiles: {},
      photosTogether: [],
      relationships: [],
    };

    console.log("New Contact Data:", newContactData);
    // In a real app, you would add this to Firestore or your backend
    // For now, add to mockContacts for demo purposes
    mockContacts.push(newContactData);


    toast({
      title: "Contact Added",
      description: `${values.name} has been successfully added to your contacts.`,
    });
    setIsLoading(false);
    router.push("/contacts"); // Redirect to contacts list
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
        <Button variant="outline" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
      <ContactForm onSubmit={handleSubmit} isLoading={isLoading} />
    </div>
  );
}

// Helper to format date, similar to how it's done in contact detail page.
// This is important if you're directly using the value for mockData-like structure.
const format = (date: Date, formatStr: string): string => {
    // Basic yyyy-MM-dd for simplicity here
    if (formatStr === "yyyy-MM-dd") {
        const d = new Date(date);
        // Adjust for timezone offset to get correct UTC date
        const year = d.getUTCFullYear();
        const month = (d.getUTCMonth() + 1).toString().padStart(2, '0');
        const day = d.getUTCDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    // For "PPP" format used by react-day-picker display
     if (formatStr === "PPP") {
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    }
    return date.toISOString(); 
};

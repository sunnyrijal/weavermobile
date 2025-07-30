import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Contact } from '@/lib/types';
import { useAuth } from '@/hooks/useAuth';

// Relationship mapping logic - maps relationship types to their inverse
const INVERSE_RELATIONSHIP_MAP: Record<string, string> = {
  "Dad": "Child",
  "Mom": "Child",
  "Parent": "Child",
  "Child": "Parent",
  "Brother": "Brother",
  "Sister": "Sister",
  "Sibling": "Sibling",
  "Partner": "Partner",
  "Spouse": "Spouse",
  "Friend": "Friend",
  "Colleague": "Colleague",
  "Cousin": "Cousin",
  "Grandparent": "Grandchild",
  "Grandchild": "Grandparent",
  "Uncle": "Niece/Nephew",
  "Aunt": "Niece/Nephew",
  "Niece": "Uncle/Aunt",
  "Nephew": "Uncle/Aunt",
  "Niece/Nephew": "Uncle/Aunt",
  "Uncle/Aunt": "Niece/Nephew",
  "Pet": "Owner",
  "Owner": "Pet",
};

// Gender-specific relationship mappings
const GENDER_RELATIONSHIP_MAP: Record<string, Record<string, string>> = {
  "Male": {
    "Child": "Son",
    "Parent": "Dad",
    "Sibling": "Brother",
  },
  "Female": {
    "Child": "Daughter",
    "Parent": "Mom",
    "Sibling": "Sister",
  }
};

interface ContactsContextValue {
  contacts: Contact[];
  isLoading: boolean;
  error: string | null;
  fetchContacts: () => Promise<void>;
  addContact: (contactData: Partial<Contact>) => Promise<Contact | null>;
  updateContact: (id: string, contactData: Partial<Contact>) => Promise<Contact | null>;
  deleteContact: (id: string) => Promise<boolean>;
  createBidirectionalRelationship: (
    contactId: string,
    relatedContactId: string,
    relationshipType: string,
    customLabel?: string
  ) => Promise<boolean>;
}

const ContactsContext = createContext<ContactsContextValue | undefined>(undefined);

interface ContactsProviderProps {
  children: React.ReactNode;
}

export function ContactsProvider({ children }: ContactsProviderProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();

  const fetchContacts = useCallback(async () => {
    if (!currentUser) {
      setError('User not authenticated');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/contacts?ownerId=${currentUser.uid}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch contacts');
      }
      
      const data = await response.json();
      setContacts(data.contacts || []);
    } catch (err) {
      console.error('Error fetching contacts:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  const createBidirectionalRelationship = useCallback(async (
    contactId: string, 
    relatedContactId: string, 
    relationshipType: string, 
    customLabel?: string
  ): Promise<boolean> => {
    if (!currentUser) {
      setError('User not authenticated');
      return false;
    }

    try {
      // First, get both contacts
      const [contact1Response, contact2Response] = await Promise.all([
        fetch(`/api/contacts/${contactId}`),
        fetch(`/api/contacts/${relatedContactId}`)
      ]);
      
      if (!contact1Response.ok || !contact2Response.ok) {
        throw new Error('Failed to fetch contact details');
      }
      
      const [contact1Data, contact2Data] = await Promise.all([
        contact1Response.json(),
        contact2Response.json()
      ]);
      
      const contact1 = contact1Data.contact;
      const contact2 = contact2Data.contact;
      
      // Determine inverse relationship type
      let inverseType = INVERSE_RELATIONSHIP_MAP[relationshipType] || "connected";
      
      // Add gender-specific relationships if applicable
      if (contact1.gender && GENDER_RELATIONSHIP_MAP[contact1.gender] && GENDER_RELATIONSHIP_MAP[contact1.gender][inverseType]) {
        inverseType = GENDER_RELATIONSHIP_MAP[contact1.gender][inverseType];
      }
      
      // Create forward relationship if it doesn't exist
      const existingRelationship = contact1.relationships?.find(
        rel => rel.relatedContactId === relatedContactId
      );
      
      if (!existingRelationship) {
        const updatedRelationships = [
          ...(contact1.relationships || []),
          {
            relatedContactId: relatedContactId,
            type: relationshipType,
            customLabel: customLabel
          }
        ];
        
        await updateContact(contactId, { relationships: updatedRelationships });
      }
      
      // Create inverse relationship if it doesn't exist
      const existingInverseRelationship = contact2.relationships?.find(
        rel => rel.relatedContactId === contactId
      );
      
      if (!existingInverseRelationship) {
        const updatedInverseRelationships = [
          ...(contact2.relationships || []),
          {
            relatedContactId: contactId,
            type: inverseType,
            customLabel: customLabel ? `${contact1.name}'s ${relationshipType}` : undefined
          }
        ];
        
        await updateContact(relatedContactId, { relationships: updatedInverseRelationships });
      }
      
      return true;
    } catch (err) {
      console.error('Error creating bidirectional relationship:', err);
      return false;
    }
  }, [currentUser]);

  const addContact = useCallback(async (contactData: Partial<Contact>): Promise<Contact | null> => {
    if (!currentUser) {
      setError('User not authenticated');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Extract any relationships defined in the new contact data
      const relationships = contactData.relationships || [];
      
      // Remove relationships from the data to be sent (we'll handle them separately)
      const dataToSend = { ...contactData };
      delete dataToSend.relationships;
      
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...dataToSend,
          ownerId: currentUser.uid,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add contact');
      }

      const data = await response.json();
      const newContact = data.contact;
      
      // Update local contacts state
      setContacts(prevContacts => [...prevContacts, newContact]);
      
      // Now handle the relationships if any were defined
      if (relationships.length > 0) {
        const updatedRelationships = [...relationships];
        
        // Add relationships and their inverses
        for (const rel of relationships) {
          if (rel.relatedContactId) {
            await createBidirectionalRelationship(
              newContact.id, 
              rel.relatedContactId, 
              rel.type, 
              rel.customLabel
            );
          }
        }
        
        // Update the contact with the relationships
        await updateContact(newContact.id, { relationships: updatedRelationships });
      }
      
      return newContact;
    } catch (err) {
      console.error('Error adding contact:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, createBidirectionalRelationship]);

  const updateContact = useCallback(async (id: string, contactData: Partial<Contact>): Promise<Contact | null> => {
    if (!currentUser) {
      setError('User not authenticated');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/contacts/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contactData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update contact');
      }

      const data = await response.json();
      
      // Update local contacts state
      setContacts(prevContacts => 
        prevContacts.map(contact => 
          contact.id === id ? data.contact : contact
        )
      );
      
      return data.contact;
    } catch (err) {
      console.error('Error updating contact:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  const deleteContact = useCallback(async (id: string): Promise<boolean> => {
    if (!currentUser) {
      setError('User not authenticated');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/contacts/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete contact');
      }
      
      // Update local contacts state
      setContacts(prevContacts => 
        prevContacts.filter(contact => contact.id !== id)
      );
      
      return true;
    } catch (err) {
      console.error('Error deleting contact:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  // Load contacts on initial render
  useEffect(() => {
    if (currentUser) {
      fetchContacts();
    }
  }, [currentUser, fetchContacts]);

  const value: ContactsContextValue = {
    contacts,
    isLoading,
    error,
    fetchContacts,
    addContact,
    updateContact,
    deleteContact,
    createBidirectionalRelationship,
  };

  return (
    <ContactsContext.Provider value={value}>
      {children}
    </ContactsContext.Provider>
  );
}

export function useContactsContext() {
  const context = useContext(ContactsContext);
  if (context === undefined) {
    throw new Error('useContactsContext must be used within a ContactsProvider');
  }
  return context;
} 
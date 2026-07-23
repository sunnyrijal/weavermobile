import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Contact } from '@/lib/types';
import { useAuth } from '@/hooks/useAuth';
import { mockContacts } from '@/lib/mockData';

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
  currentContext: 'personal' | 'company';
  setCurrentContext: (c: 'personal' | 'company') => void;
  activeCompanyTab: 'shared' | 'private';
  setActiveCompanyTab: (t: 'shared' | 'private') => void;
  joinedCompany: boolean;
  setJoinedCompany: (j: boolean) => void;
  companyName: string;
  setCompanyName: (n: string) => void;
  isMemoryModalOpen: boolean;
  setIsMemoryModalOpen: (o: boolean) => void;
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

  const [currentContext, setCurrentContextState] = useState<'personal' | 'company'>('personal');
  const [activeCompanyTab, setActiveCompanyTabState] = useState<'shared' | 'private'>('shared');
  const [joinedCompany, setJoinedCompanyState] = useState<boolean>(false);
  const [companyName, setCompanyNameState] = useState<string>('Figma');
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState<boolean>(false);

  // Load from localStorage on client mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedContext = localStorage.getItem('memore_context') as 'personal' | 'company';
      if (savedContext) setCurrentContextState(savedContext);

      const savedTab = localStorage.getItem('memore_company_tab') as 'shared' | 'private';
      if (savedTab) setActiveCompanyTabState(savedTab);

      const savedJoined = localStorage.getItem('memore_joined_company');
      if (savedJoined) setJoinedCompanyState(savedJoined === 'true');

      const savedCompName = localStorage.getItem('memore_company_name');
      if (savedCompName) setCompanyNameState(savedCompName);
    }
  }, []);

  const setCurrentContext = (context: 'personal' | 'company') => {
    setCurrentContextState(context);
    if (typeof window !== 'undefined') {
      localStorage.setItem('memore_context', context);
    }
  };

  const setActiveCompanyTab = (tab: 'shared' | 'private') => {
    setActiveCompanyTabState(tab);
    if (typeof window !== 'undefined') {
      localStorage.setItem('memore_company_tab', tab);
    }
  };

  const setJoinedCompany = (joined: boolean) => {
    setJoinedCompanyState(joined);
    if (typeof window !== 'undefined') {
      localStorage.setItem('memore_joined_company', String(joined));
    }
    // If leaving company, revert context to personal
    if (!joined) {
      setCurrentContextState('personal');
      if (typeof window !== 'undefined') {
        localStorage.setItem('memore_context', 'personal');
      }
    }
  };

  const setCompanyName = (name: string) => {
    setCompanyNameState(name);
    if (typeof window !== 'undefined') {
      localStorage.setItem('memore_company_name', name);
    }
  };

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
      let loadedContacts = data.contacts || [];
      if (loadedContacts.length === 0) {
        loadedContacts = mockContacts;
      } else {
        const hasCompanyContacts = loadedContacts.some((c: any) => c.isCompanyContact);
        if (!hasCompanyContacts) {
          loadedContacts = [...loadedContacts, ...mockContacts.filter(c => c.isCompanyContact)];
        }
      }
      setContacts(loadedContacts);
    } catch (err) {
      console.error('Error fetching contacts:', err);
      // Fallback to mock data on error so application doesn't stay blank
      setContacts(mockContacts);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  const updateContact = useCallback(async (id: string, contactData: Partial<Contact>): Promise<Contact | null> => {
    setIsLoading(true);
    setError(null);

    let updatedResult: Contact | null = null;

    try {
      const response = await fetch(`/api/contacts/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contactData),
      });

      if (response.ok) {
        const data = await response.json();
        updatedResult = data.contact;
      }
    } catch (err) {
      console.warn('API PATCH /api/contacts/[id] failed, updating local state:', err);
    }

    setContacts(prevContacts => {
      let found = false;
      const updated = prevContacts.map(contact => {
        if (contact.id === id || (contact as any)._id === id) {
          found = true;
          const merged = updatedResult || { ...contact, ...contactData, updatedAt: new Date().toISOString() };
          updatedResult = merged as Contact;
          return merged as Contact;
        }
        return contact;
      });

      if (!found && (updatedResult || contactData.name)) {
        const fallbackObj = updatedResult || {
          id,
          name: contactData.name || 'New Contact',
          category: contactData.category || 'Other',
          relationships: [],
          ...contactData,
          updatedAt: new Date().toISOString()
        };
        updatedResult = fallbackObj as Contact;
        updated.push(fallbackObj as Contact);
      }
      return updated;
    });

    setIsLoading(false);
    return updatedResult;
  }, []);

  const createBidirectionalRelationship = useCallback(async (
    contactId: string,
    relatedContactId: string,
    relationshipType: string,
    customLabel?: string,
    targetContactObj?: Contact
  ): Promise<boolean> => {
    try {
      let contact1 = contacts.find((c: any) => c.id === contactId || (c as any)._id === contactId);
      let contact2 = targetContactObj || contacts.find((c: any) => c.id === relatedContactId || (c as any)._id === relatedContactId);

      if (!contact1 || !contact2) {
        try {
          const [res1, res2] = await Promise.all([
            !contact1 ? fetch(`/api/contacts/${contactId}`) : null,
            !contact2 ? fetch(`/api/contacts/${relatedContactId}`) : null
          ]);
          if (res1 && res1.ok) { const d1 = await res1.json(); contact1 = d1.contact; }
          if (res2 && res2.ok) { const d2 = await res2.json(); contact2 = d2.contact; }
        } catch (e) {
          console.warn('Network fetch for contacts failed, using local context contacts:', e);
        }
      }

      // If contact2 is still missing, build fallback contact representation with proper name
      if (!contact2) {
        contact2 = {
          id: relatedContactId,
          name: targetContactObj?.name || 'New Contact',
          category: targetContactObj?.category || 'Other',
          relationships: []
        } as any;
      }

      if (!contact1) return false;

      let inverseType = INVERSE_RELATIONSHIP_MAP[relationshipType] || "connected";
      if (contact1.gender && GENDER_RELATIONSHIP_MAP[contact1.gender] && GENDER_RELATIONSHIP_MAP[contact1.gender][inverseType]) {
        inverseType = GENDER_RELATIONSHIP_MAP[contact1.gender][inverseType];
      }

      const rel1 = { relatedContactId, type: relationshipType, customLabel: customLabel || relationshipType };
      const rel2 = { relatedContactId: contactId, type: inverseType, customLabel: customLabel ? `${contact1.name}'s ${relationshipType}` : inverseType };

      // Update local state directly and immediately
      setContacts(prev => {
        let found2 = false;
        const updated = prev.map(c => {
          if (c.id === contactId || (c as any)._id === contactId) {
            const existing = (c.relationships || []).filter((r: any) => r.relatedContactId !== relatedContactId);
            return { ...c, relationships: [...existing, rel1] };
          }
          if (c.id === relatedContactId || (c as any)._id === relatedContactId) {
            found2 = true;
            const existing = (c.relationships || []).filter((r: any) => r.relatedContactId !== contactId);
            return { ...c, name: c.name || contact2!.name, relationships: [...existing, rel2] };
          }
          return c;
        });

        if (!found2 && contact2) {
          const existing = ((contact2 as any).relationships || []).filter((r: any) => r.relatedContactId !== contactId);
          updated.push({ ...contact2, relationships: [...existing, rel2] });
        }
        return updated;
      });

      // Non-blocking background server sync with full contact info
      Promise.all([
        updateContact(contactId, { relationships: [...((contact1.relationships || []).filter((r: any) => r.relatedContactId !== relatedContactId)), rel1] }),
        updateContact(relatedContactId, { name: contact2.name, category: contact2.category || 'Other', relationships: [...(((contact2 as any).relationships || []).filter((r: any) => r.relatedContactId !== contactId)), rel2] })
      ]).catch(e => console.warn('Background relationship sync warning:', e));

      return true;
    } catch (err) {
      console.error('Error creating bidirectional relationship:', err);
      return false;
    }
  }, [contacts, updateContact]);

  const addContact = useCallback(async (contactData: Partial<Contact>): Promise<Contact | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const relationships = contactData.relationships || [];
      const dataToSend = { ...contactData };
      delete dataToSend.relationships;

      let newContact: Contact | null = null;

      try {
        const response = await fetch('/api/contacts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...dataToSend,
            ownerId: currentUser?.uid || 'user1',
          }),
        });

        if (response.ok) {
          const data = await response.json();
          newContact = data.contact;
        }
      } catch (apiErr) {
        console.warn('API POST /api/contacts failed, creating fallback contact:', apiErr);
      }

      if (!newContact) {
        const fallbackId = `contact_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        newContact = {
          id: fallbackId,
          name: contactData.name || 'New Contact',
          category: contactData.category || 'Other',
          occupation: contactData.occupation || '',
          company: contactData.company || '',
          notes: contactData.notes || '',
          relationships: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        } as Contact;
      }

      // Update local contacts state
      setContacts(prevContacts => [...prevContacts.filter(c => c.id !== newContact!.id), newContact!]);
      
      // Handle initial relationships if any
      if (relationships.length > 0) {
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
      }
      
      return newContact;
    } catch (err: any) {
      console.error('Error adding contact:', err);
      setError(err?.message || 'Failed to add contact');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, createBidirectionalRelationship]);

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
    currentContext,
    setCurrentContext,
    activeCompanyTab,
    setActiveCompanyTab,
    joinedCompany,
    setJoinedCompany,
    companyName,
    setCompanyName,
    isMemoryModalOpen,
    setIsMemoryModalOpen,
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
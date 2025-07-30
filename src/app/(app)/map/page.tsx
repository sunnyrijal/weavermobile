"use client";

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useContacts } from '@/hooks/useContacts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronDown, ChevronRight, Plus, Users, Edit, UserCog, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Contact } from '@/lib/types';

// Helper function to compare MongoDB IDs
const isSameId = (id1: string | undefined, id2: string | undefined): boolean => {
  if (!id1 || !id2) return false;
  return id1 === id2 || id1 === id2.toString() || id1.toString() === id2;
};

// Helper function to get initials
const getInitials = (name: string) => {
  if (!name) return "NN";
  const names = name.split(' ');
  if (names.length > 1) {
    return names[0][0].toUpperCase() + names[names.length - 1][0].toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

// Helper function to get relationship type display
const getRelationshipType = (contact: Contact, centralContact: Contact): string => {
  if (isSameId(contact.id, centralContact.id)) {
    return "Self";
  }

  const relationship = centralContact.relationships?.find(
    rel => isSameId(rel.relatedContactId, contact.id)
  );

  if (relationship) {
    return relationship.customLabel || relationship.type;
  }

  return contact.category || "Other";
};

// Helper function to get relationship color
const getRelationshipColor = (type: string): string => {
  switch (type.toLowerCase()) {
    case 'partner':
    case 'spouse':
    case 'wife':
    case 'husband':
    case 'girlfriend':
    case 'boyfriend':
      return 'bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900 dark:text-pink-200 dark:border-pink-800';
    case 'parent':
    case 'mother':
    case 'father':
      return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-800';
    case 'sibling':
    case 'brother':
    case 'sister':
      return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-800';
    case 'child':
    case 'son':
    case 'daughter':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-800';
    case 'pet':
    case 'dog':
    case 'cat':
      return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900 dark:text-purple-200 dark:border-purple-800';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700';
  }
};

interface RelationshipGroup {
  type: string;
  contacts: Contact[];
  count: number;
}

export default function RelationshipMapPage() {
  const router = useRouter();
  const { contacts, isLoading, error } = useContacts();
  const [selectedContactId, setSelectedContactId] = useState<string>('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['Partner', 'Family']));

  // Set default selected contact
  React.useEffect(() => {
    if (contacts.length > 0 && !selectedContactId) {
      setSelectedContactId(contacts[0].id);
    }
  }, [contacts, selectedContactId]);

  const selectedContact = useMemo(() => 
    contacts.find(c => c.id === selectedContactId), 
    [contacts, selectedContactId]
  );

  const relationshipGroups = useMemo(() => {
    if (!selectedContact) return [];

    const groups: { [key: string]: Contact[] } = {};

    // Add the central contact itself
    groups['Self'] = [selectedContact];

    // Group related contacts by relationship type
    if (selectedContact.relationships) {
      selectedContact.relationships.forEach(rel => {
        const relatedContact = contacts.find(c => isSameId(c.id, rel.relatedContactId));
        if (relatedContact) {
          const type = rel.customLabel || rel.type;
          if (!groups[type]) {
            groups[type] = [];
          }
          groups[type].push(relatedContact);
        }
      });
    }

    // Convert to array format
    return Object.entries(groups).map(([type, contacts]) => ({
      type,
      contacts,
      count: contacts.length
    }));
  }, [selectedContact, contacts]);

  const handleContactClick = (contactId: string) => {
    router.push(`/contacts/${contactId}`);
  };

  const toggleGroup = (groupType: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupType)) {
        newSet.delete(groupType);
      } else {
        newSet.add(groupType);
      }
      return newSet;
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="w-16 h-16 text-muted-foreground animate-spin mb-4" />
        <p className="text-muted-foreground">Loading contacts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Users className="w-16 h-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-semibold mb-2">Error Loading Contacts</h1>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={() => router.push("/dashboard")}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  if (contacts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Users className="w-16 h-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-semibold mb-2">No Contacts Found</h1>
        <p className="text-muted-foreground mb-4">Add contacts to view relationships.</p>
        <Button onClick={() => router.push("/contacts/new")}>
          Add New Contact
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <CardTitle>Relationships</CardTitle>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <Edit className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <CardDescription>
            How {selectedContact?.name || 'this contact'} is connected to others in your network.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Selected Contact Display */}
      {selectedContact && (
        <Card className="bg-muted/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={selectedContact.photoURL} />
                <AvatarFallback>{getInitials(selectedContact.name)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm text-muted-foreground">Showing relations for</p>
                <p className="font-semibold text-lg">{selectedContact.name}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contact Selector */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium">View relationships for:</label>
            <Select value={selectedContactId} onValueChange={setSelectedContactId}>
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Select a contact" />
              </SelectTrigger>
              <SelectContent>
                {contacts.map(contact => (
                  <SelectItem key={contact.id} value={contact.id}>
                    <div className="flex items-center gap-2">
                      <UserCog className="h-4 w-4 text-muted-foreground" />
                      {contact.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Add Relationship Button */}
      <Card>
        <CardContent className="p-4">
          <Button className="w-full border-2 border-dashed border-orange-300 bg-white hover:bg-orange-50 text-orange-600 hover:text-orange-700">
            <Plus className="h-4 w-4 mr-2" />
            Add Relationship
          </Button>
        </CardContent>
      </Card>

      {/* Relationship Groups */}
      <div className="space-y-4">
        {relationshipGroups.map(group => {
          const isExpanded = expandedGroups.has(group.type);
          const relationshipColor = getRelationshipColor(group.type);

          return (
            <Card key={group.type} className="overflow-hidden">
              <CardContent className="p-0">
                {/* Group Header */}
                <button
                  onClick={() => toggleGroup(group.type)}
                  className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Badge className={cn("border", relationshipColor)}>
                      {group.type}
                    </Badge>
                    <span className="font-medium">({group.count})</span>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>

                {/* Group Content */}
                {isExpanded && (
                  <div className="border-t bg-muted/20">
                    {group.contacts.map(contact => {
                      const relationshipType = getRelationshipType(contact, selectedContact!);
                      const contactColor = getRelationshipColor(relationshipType);

                      return (
                        <div
                          key={contact.id}
                          className="p-4 border-b last:border-b-0 hover:bg-muted/30 transition-colors cursor-pointer"
                          onClick={() => handleContactClick(contact.id)}
                        >
                          <div className="flex items-center gap-4">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={contact.photoURL} />
                              <AvatarFallback>{getInitials(contact.name)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium">{contact.name}</span>
                                <Badge variant="outline" className={cn("text-xs", contactColor)}>
                                  {relationshipType}
                                </Badge>
                              </div>
                              <div className="text-sm text-muted-foreground space-y-1">
                                {contact.occupation && (
                                  <p>Works as {contact.occupation}</p>
                                )}
                                {contact.company && (
                                  <p>At {contact.company}</p>
                                )}
                                {contact.currentLocation && (
                                  <p>Lives in {contact.currentLocation}</p>
                                )}
                                {contact.phone && (
                                  <p>📞 {contact.phone}</p>
                                )}
                                {contact.email && (
                                  <p>📧 {contact.email}</p>
                                )}
                              </div>
                            </div>
                            <Button variant="outline" size="sm">
                              View Profile
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
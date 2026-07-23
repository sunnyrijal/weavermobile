import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface ContactDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact: { id: string; name: string; email?: string; phone?: string; photoURL?: string; ownerId: string; category?: string; relationships?: { relatedContactId: string; type: string; customLabel?: string; notes?: string }[] } | null;
  onContactDeleted: () => void;
}

interface RelatedContact {
  contact: { id: string; name: string; email?: string; phone?: string; photoURL?: string; ownerId: string; category?: string; relationships?: { relatedContactId: string; type: string; customLabel?: string; notes?: string }[] };
  relationship: string;
  isSelected: boolean;
}

export function ContactDeleteModal({ isOpen, onClose, contact, onContactDeleted }: ContactDeleteModalProps) {
  const [relatedContacts, setRelatedContacts] = useState<RelatedContact[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const { toast } = useToast();

  // Get initials for avatar
  const getInitials = (name: string) => {
    if (!name) return 'NN';
    return name
      .split(' ')
      .filter(Boolean)
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'NN';
  };

  // Load related contacts when modal opens
  useEffect(() => {
    if (isOpen && contact) {
      loadRelatedContacts();
    }
  }, [isOpen, contact]);

  const loadRelatedContacts = async () => {
    if (!contact) return;

    try {
      // Get all contacts to find relationships
      const response = await fetch(`/api/contacts?ownerId=${contact.ownerId}`);
      const data = await response.json();
      const allContacts = data.contacts;
      
      const related: RelatedContact[] = [];

      // Find contacts that have relationships with the main contact
      allContacts.forEach((otherContact: any) => {
        if (otherContact.id !== contact.id && otherContact.relationships) {
          otherContact.relationships.forEach((rel: any) => {
            if (rel.relatedContactId === contact.id) {
              related.push({
                contact: otherContact,
                relationship: rel.customLabel || rel.notes || rel.type || 'Unknown',
                isSelected: false
              });
            }
          });
        }
      });

      // Also find contacts that the main contact has relationships with
      if (contact.relationships) {
        contact.relationships.forEach((rel: any) => {
          const relatedContact = allContacts.find((c: any) => c.id === rel.relatedContactId);
          if (relatedContact) {
            related.push({
              contact: relatedContact,
              relationship: rel.customLabel || rel.notes || rel.type || 'Unknown',
              isSelected: false
            });
          }
        });
      }

      // Remove duplicates
      const uniqueRelated = related.filter((item, index, self) => 
        index === self.findIndex((t: any) => t.contact.id === item.contact.id)
      );

      setRelatedContacts(uniqueRelated);
      setSelectedContacts([]);
    } catch (error) {
      console.error('Error loading related contacts:', error);
      toast({
        title: "Error",
        description: "Failed to load related contacts",
        variant: "destructive"
      });
    }
  };

  const handleContactToggle = (contactId: string, checked: boolean) => {
    if (checked) {
      setSelectedContacts(prev => [...prev, contactId]);
    } else {
      setSelectedContacts(prev => prev.filter(id => id !== contactId));
    }
  };

  const handleSelectAll = () => {
    const allIds = relatedContacts.map(rc => rc.contact.id);
    setSelectedContacts(allIds);
  };

  const handleDeselectAll = () => {
    setSelectedContacts([]);
  };

  const handleDelete = async () => {
    if (!contact) return;

    setIsLoading(true);
    try {
      const contactsToDelete = [contact.id, ...selectedContacts];
      
      // Delete all selected contacts
      for (const contactId of contactsToDelete) {
        await fetch(`/api/contacts/${contactId}`, { method: 'DELETE' });
      }

      toast({
        title: "Success",
        description: `Deleted ${contactsToDelete.length} contact(s)`,
        variant: "default"
      });

      onContactDeleted();
      onClose();
    } catch (error) {
      console.error('Error deleting contacts:', error);
      toast({
        title: "Error",
        description: "Failed to delete contacts",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!contact) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-destructive">Delete Contact</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{contact.name}"? You can also choose to delete related contacts.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Main contact to delete */}
          <Card className="border-destructive">
            <CardHeader className="pb-3">
              <CardTitle className="text-destructive">Contact to Delete</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarImage src={contact.photoURL} />
                  <AvatarFallback>{getInitials(contact.name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="font-medium">{contact.name}</div>
                  {contact.email && <div className="text-sm text-muted-foreground">{contact.email}</div>}
                  {contact.phone && <div className="text-sm text-muted-foreground">{contact.phone}</div>}
                  {contact.category && (
                    <Badge variant="secondary" className="mt-1">{contact.category}</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Related contacts */}
          {relatedContacts.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Related Contacts</Label>
                <div className="space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAll}
                  >
                    Select All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDeselectAll}
                  >
                    Deselect All
                  </Button>
                </div>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {relatedContacts.map((related) => (
                  <Card key={related.contact.id} className="border">
                    <CardContent className="p-3">
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          id={related.contact.id}
                          checked={selectedContacts.includes(related.contact.id)}
                          onCheckedChange={(checked) => 
                            handleContactToggle(related.contact.id, checked as boolean)
                          }
                        />
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={related.contact.photoURL} />
                          <AvatarFallback>{getInitials(related.contact.name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="font-medium">{related.contact.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {related.relationship}
                          </div>
                        </div>
                        {related.contact.category && (
                          <Badge variant="outline" className="text-xs">
                            {related.contact.category}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {relatedContacts.length === 0 && (
            <div className="text-center py-4 text-muted-foreground">
              No related contacts found
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            disabled={isLoading}
          >
            {isLoading ? "Deleting..." : `Delete ${selectedContacts.length + 1} Contact(s)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface Contact {
  id: string;
  name: string;
  photoURL?: string;
  category?: string;
}

interface ContactListModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contacts: Contact[];
  title: string;
}

export default function ContactListModal({ open, onOpenChange, contacts, title }: ContactListModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {contacts.length === 0 ? (
          <div className="text-muted-foreground text-sm py-8 text-center">No contacts found.</div>
        ) : (
          <ul className="divide-y">
            {contacts.map(contact => (
              <li key={contact.id} className="flex items-center gap-3 py-3">
                <Avatar className="w-10 h-10">
                  {contact.photoURL ? (
                    <AvatarImage src={contact.photoURL} alt={contact.name} />
                  ) : (
                    <AvatarFallback>{contact.name[0]}</AvatarFallback>
                  )}
                </Avatar>
                <div className="flex-1">
                  <div className="font-medium text-sm">{contact.name}</div>
                  {contact.category && <div className="text-xs text-muted-foreground">{contact.category}</div>}
                </div>
                <Button asChild variant="ghost" size="sm" className="text-xs h-8">
                  <Link href={`/contacts/${contact.id}`}>View Profile</Link>
                </Button>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
} 
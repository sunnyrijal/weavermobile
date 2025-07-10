"use client";
import { useContacts } from "@/hooks/useContacts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";

function getMapUrl(location: string) {
  // Prefer Google Maps, fallback to Apple Maps
  const encoded = encodeURIComponent(location);
  // Google Maps search URL
  return `https://www.google.com/maps/search/?api=1&query=${encoded}`;
}

export default function RealMapPage() {
  const { contacts, isLoading } = useContacts();
  const contactsWithLocation = contacts.filter(c => c.currentLocation);

  return (
    <div className="max-w-2xl mx-auto py-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Contacts on the Map</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div>Loading...</div>
          ) : contactsWithLocation.length === 0 ? (
            <div className="text-muted-foreground">No contacts with a location found.</div>
          ) : (
            <ul className="space-y-4">
              {contactsWithLocation.map(contact => (
                <li key={contact.id} className="flex items-center gap-4 border-b pb-4 last:border-b-0 last:pb-0">
                  <Image
                    src={contact.photoURL || `https://picsum.photos/seed/${contact.id}/80/80`}
                    alt={contact.name}
                    width={60}
                    height={60}
                    className="rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <div className="font-semibold">{contact.name}</div>
                    <div className="text-sm text-muted-foreground">{contact.currentLocation}</div>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <a href={getMapUrl(contact.currentLocation!)} target="_blank" rel="noopener noreferrer">
                      View on Map
                    </a>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 
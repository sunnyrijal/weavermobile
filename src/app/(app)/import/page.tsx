
"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import type { ImportedContactPreview } from "@/lib/types";
import { UploadCloud, Smartphone, Linkedin, Instagram, Facebook, Twitter, FileText, Loader2 } from "lucide-react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import React, { useState, useEffect, useMemo } from "react";

const importSources = [
  { id: "phone", name: "Phone Contacts", icon: Smartphone, color: "text-green-500" },
  { id: "linkedin", name: "LinkedIn", icon: Linkedin, color: "text-blue-600" },
  { id: "instagram", name: "Instagram", icon: Instagram, color: "text-pink-500" },
  { id: "facebook", name: "Facebook", icon: Facebook, color: "text-blue-700" },
  { id: "twitter", name: "Twitter", icon: Twitter, color: "text-sky-500" },
  { id: "csv", name: "CSV File", icon: FileText, color: "text-gray-500" },
];

// Mock data fetching for import preview
const fetchMockImportableContacts = async (source: string): Promise<ImportedContactPreview[]> => {
  await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API delay
  if (source === "error_source") throw new Error("Failed to connect to source.");
  return Array.from({ length: Math.floor(Math.random() * 10) + 5 }).map((_, i) => ({
    sourceId: `${source}_contact_${i + 1}`,
    name: `Contact ${i + 1} from ${source.charAt(0).toUpperCase() + source.slice(1)}`,
    email: `${source.replace(/\s+/g, '').toLowerCase()}_contact${i+1}@example.com`,
    photoURL: `https://picsum.photos/seed/${source}_contact_${i+1}/40/40`,
    details: `Some detail for contact ${i+1}`,
  }));
};


export default function ImportPage() {
  const searchParams = useSearchParams();
  const initialSource = searchParams.get('source');
  
  const [selectedSource, setSelectedSource] = useState<string | null>(initialSource);
  const [isLoading, setIsLoading] = useState(false);
  const [importableContacts, setImportableContacts] = useState<ImportedContactPreview[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<Record<string, boolean>>({});
  const [importProgress, setImportProgress] = useState(0);
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();

  const currentSourceDetails = useMemo(() => importSources.find(s => s.id === selectedSource), [selectedSource]);

  useEffect(() => {
    if (initialSource) {
      handleSourceSelect(initialSource);
    }
  }, [initialSource]);

  const handleSourceSelect = async (sourceId: string) => {
    setSelectedSource(sourceId);
    setIsLoading(true);
    setImportableContacts([]);
    setSelectedContacts({});
    try {
      // In a real app, this would trigger OAuth flow then fetch contacts
      toast({ title: `Connecting to ${importSources.find(s=>s.id === sourceId)?.name}...` });
      const contacts = await fetchMockImportableContacts(sourceId);
      setImportableContacts(contacts);
      setSelectedContacts(contacts.reduce((acc, c) => ({ ...acc, [c.sourceId]: true }), {})); // Select all by default
      toast({ title: `Fetched ${contacts.length} contacts from ${importSources.find(s=>s.id === sourceId)?.name}.`, description: "Review and select contacts to import."});
    } catch (error) {
      toast({ title: "Error fetching contacts", description: (error as Error).message, variant: "destructive" });
      setSelectedSource(null); // Reset source on error
    }
    setIsLoading(false);
  };

  const handleToggleSelectAll = (checked: boolean) => {
    setSelectedContacts(importableContacts.reduce((acc, c) => ({ ...acc, [c.sourceId]: checked }), {}));
  };

  const handleImportSelected = async () => {
    const contactsToImport = importableContacts.filter(c => selectedContacts[c.sourceId]);
    if (contactsToImport.length === 0) {
      toast({ title: "No contacts selected", description: "Please select at least one contact to import.", variant: "destructive" });
      return;
    }
    
    setIsImporting(true);
    setImportProgress(0);
    
    // Simulate import process
    for (let i = 0; i < contactsToImport.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 200)); // Simulate import of one contact
      setImportProgress(((i + 1) / contactsToImport.length) * 100);
    }
    
    toast({ title: "Import Complete!", description: `${contactsToImport.length} contacts imported successfully.` });
    // Here you would call AI tagging, conflict resolution, and save to Firestore.
    // For AI tagging: const tags = await suggestTags({ profileInformation: JSON.stringify(contactToImport) });

    setIsImporting(false);
    setImportableContacts([]); // Clear list after import
    setSelectedContacts({});
    setSelectedSource(null); // Reset source selection
  };
  
  const numSelected = Object.values(selectedContacts).filter(Boolean).length;

  return (
    <div className="space-y-6">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2"><UploadCloud className="text-primary"/> Unified Contact Import</CardTitle>
          <CardDescription>Connect your accounts or upload a file to import contacts into NetworkNest.</CardDescription>
        </CardHeader>
        {!selectedSource && (
            <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {importSources.map(source => (
                <Button 
                    key={source.id} 
                    variant="outline" 
                    className="flex flex-col h-32 items-center justify-center gap-2 p-4 hover:bg-accent/50 hover:border-accent transition-all duration-200 ease-in-out transform hover:scale-105"
                    onClick={() => handleSourceSelect(source.id)}
                    disabled={isLoading}
                >
                    <source.icon className={`h-10 w-10 ${source.color}`} />
                    <span className="text-center">{source.name}</span>
                </Button>
                ))}
            </CardContent>
        )}
      </Card>

      {isLoading && selectedSource && (
        <Card className="shadow-md">
          <CardContent className="p-6 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-lg font-medium">Connecting to {currentSourceDetails?.name}...</p>
            <p className="text-muted-foreground">Please wait while we fetch your contacts.</p>
          </CardContent>
        </Card>
      )}

      {!isLoading && selectedSource && importableContacts.length > 0 && (
        <Card className="shadow-md">
          <CardHeader>
            <div className="flex justify-between items-center">
                <div>
                    <CardTitle>Review Contacts from {currentSourceDetails?.name}</CardTitle>
                    <CardDescription>Select the contacts you wish to import.</CardDescription>
                </div>
                <Button variant="ghost" onClick={() => { setSelectedSource(null); setImportableContacts([]); }}>Change Source</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4 p-3 bg-muted/50 rounded-md">
              <div className="flex items-center space-x-2">
                <Checkbox 
                    id="select-all" 
                    checked={numSelected === importableContacts.length && importableContacts.length > 0}
                    onCheckedChange={(checked) => handleToggleSelectAll(Boolean(checked))}
                />
                <Label htmlFor="select-all" className="text-sm font-medium">
                    Select All ({numSelected} / {importableContacts.length} selected)
                </Label>
              </div>
              <Button onClick={handleImportSelected} disabled={isImporting || numSelected === 0}>
                {isImporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Import Selected
              </Button>
            </div>

            {isImporting && <Progress value={importProgress} className="w-full mb-4" />}
            
            <ul className="max-h-[400px] overflow-y-auto space-y-2 pr-2">
              {importableContacts.map(contact => (
                <li key={contact.sourceId} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30">
                  <div className="flex items-center gap-3">
                    <Checkbox 
                        id={contact.sourceId} 
                        checked={selectedContacts[contact.sourceId] || false}
                        onCheckedChange={(checked) => setSelectedContacts(prev => ({ ...prev, [contact.sourceId]: Boolean(checked)}))}
                    />
                    <Label htmlFor={contact.sourceId} className="flex items-center gap-3 cursor-pointer">
                        <Image 
                            src={contact.photoURL || `https://picsum.photos/seed/${contact.sourceId}/40/40`} 
                            alt={contact.name}
                            width={40}
                            height={40}
                            className="rounded-full object-cover"
                            data-ai-hint="person avatar"
                        />
                        <div>
                            <p className="font-medium">{contact.name}</p>
                            <p className="text-xs text-muted-foreground">{contact.email || contact.details}</p>
                        </div>
                    </Label>
                  </div>
                  {/* Future: Button for AI tag suggestions or conflict resolution indicator */}
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter className="border-t pt-4">
             <p className="text-xs text-muted-foreground">
                Smart Tagging will be applied during import (e.g., "{currentSourceDetails?.name} Import"). You can customize tags later.
                Potential duplicate contacts will be flagged for review post-import (feature coming soon).
             </p>
          </CardFooter>
        </Card>
      )}
      {!isLoading && selectedSource && importableContacts.length === 0 && !isImporting && (
         <Card className="shadow-md">
            <CardContent className="p-6 text-center">
                <p className="text-lg font-medium">No contacts found in {currentSourceDetails?.name}.</p>
                <p className="text-muted-foreground mb-4">Or, there might have been an issue fetching them.</p>
                <Button onClick={() => { setSelectedSource(null); }} >Try Another Source</Button>
            </CardContent>
         </Card>
      )}
    </div>
  );
}

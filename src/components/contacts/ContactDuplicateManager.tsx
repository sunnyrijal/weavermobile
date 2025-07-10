"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Users, Merge, AlertTriangle, CheckCircle } from "lucide-react";
import { ContactMergeModal } from "./ContactMergeModal";

interface DuplicateGroup {
  group: any[];
  primaryContact: any;
  suggestedMerge: any;
}

export function ContactDuplicateManager() {
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showMergeModal, setShowMergeModal] = useState(false);

  const checkForDuplicates = async () => {
    if (!currentUser) {
      toast({ title: "Not Logged In", description: "Please log in to check for duplicates.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/contacts/duplicates?ownerId=${currentUser.uid}`);
      
      if (!response.ok) {
        throw new Error('Failed to check for duplicates');
      }

      const data = await response.json();
      setDuplicates(data.duplicates || []);
      
      if (data.duplicates.length === 0) {
        toast({ title: "No Duplicates Found", description: "All your contacts appear to be unique." });
      } else {
        toast({ 
          title: "Duplicates Found", 
          description: `Found ${data.duplicates.length} group(s) of potential duplicates.` 
        });
      }
    } catch (error) {
      console.error('Error checking for duplicates:', error);
      toast({ title: "Error", description: "Failed to check for duplicates.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMergeComplete = () => {
    setDuplicates([]);
    toast({ title: "Merge Complete", description: "Duplicate contacts have been merged successfully." });
  };

  useEffect(() => {
    // Auto-check for duplicates when component mounts
    if (currentUser) {
      checkForDuplicates();
    }
  }, [currentUser]);

  if (!currentUser) {
    return null;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Duplicate Contact Manager
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Check for and merge duplicate contacts in your network.
              </p>
              {duplicates.length > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  <span className="text-orange-600 font-medium">
                    {duplicates.length} duplicate group(s) found
                  </span>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                onClick={checkForDuplicates}
                disabled={isLoading}
                variant="outline"
              >
                {isLoading ? "Checking..." : "Check for Duplicates"}
              </Button>
              {duplicates.length > 0 && (
                <Button
                  onClick={() => setShowMergeModal(true)}
                  className="flex items-center gap-2"
                >
                  <Merge className="h-4 w-4" />
                  Merge Duplicates
                </Button>
              )}
            </div>
          </div>

          {/* Duplicate Groups Preview */}
          {duplicates.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium">Duplicate Groups:</h4>
              {duplicates.slice(0, 3).map((group, index) => (
                <Card key={index} className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{group.group.length} contacts</Badge>
                      <span className="text-sm font-medium">
                        {group.primaryContact.name}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Similar names detected
                    </div>
                  </div>
                </Card>
              ))}
              {duplicates.length > 3 && (
                <p className="text-xs text-muted-foreground text-center">
                  ... and {duplicates.length - 3} more groups
                </p>
              )}
            </div>
          )}

          {/* No Duplicates State */}
          {duplicates.length === 0 && !isLoading && (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">
                No duplicate contacts found in your network.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Merge Modal */}
      <ContactMergeModal
        isOpen={showMergeModal}
        onOpenChange={setShowMergeModal}
        duplicates={duplicates}
        onMergeComplete={handleMergeComplete}
      />
    </div>
  );
} 
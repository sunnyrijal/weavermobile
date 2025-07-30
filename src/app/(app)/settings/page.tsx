
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { 
  Settings, 
  Users, 
  Brain, 
  Database, 
  Shield, 
  Bell, 
  Palette,
  Download,
  Upload,
  Trash2,
  AlertTriangle
} from "lucide-react";
import { ContactDuplicateManager } from "@/components/contacts/ContactDuplicateManager";
import { AIAskModal } from "@/components/shared/AIAskModal";
import { VoiceMemoryInputModal } from "@/components/memory/VoiceMemoryInputModal";
import ClientSideFormattedDate from '@/components/shared/ClientSideFormattedDate';

export default function SettingsPage() {
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const [showAIAskModal, setShowAIAskModal] = useState(false);
  const [showMemoryModal, setShowMemoryModal] = useState(false);
  const [exportDate, setExportDate] = useState<string>("");

  useEffect(() => {
    setExportDate(new Date().toISOString());
  }, []);

  const handleExportData = async () => {
    if (!currentUser) {
      toast({ title: "Not Logged In", description: "Please log in to export data.", variant: "destructive" });
      return;
    }

    try {
      const response = await fetch(`/api/contacts?ownerId=${currentUser.uid}`);
      if (!response.ok) throw new Error('Failed to fetch contacts');
      
      const data = await response.json();
      const exportData = {
        contacts: data.contacts,
        exportDate: exportDate,
        version: '1.0'
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `networknest-export-${exportDate.split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({ title: "Export Successful", description: "Your data has been exported successfully." });
    } catch (error) {
      console.error('Export error:', error);
      toast({ title: "Export Failed", description: "Failed to export your data.", variant: "destructive" });
    }
  };

  const handleDeleteAccount = () => {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      toast({ title: "Account Deletion", description: "Account deletion feature not yet implemented.", variant: "destructive" });
    }
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-semibold mb-2">Not Logged In</h1>
          <p className="text-muted-foreground">Please log in to access settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your NetworkNest account and preferences.</p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="ai">AI Features</TabsTrigger>
          <TabsTrigger value="data">Data & Privacy</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Account Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <p className="text-sm text-muted-foreground">{currentUser.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Display Name</label>
                  <p className="text-sm text-muted-foreground">{currentUser.displayName || 'Not set'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Account Created</label>
                  <p className="text-sm text-muted-foreground">
                    {currentUser.createdAt ? <ClientSideFormattedDate date={currentUser.createdAt} /> : 'Unknown'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">User ID</label>
                  <p className="text-sm text-muted-foreground font-mono text-xs">{currentUser.uid}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Appearance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Customize the appearance of NetworkNest.
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Theme</span>
                  <Badge variant="secondary">System</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Default View</span>
                  <Badge variant="secondary">Grid</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contacts" className="space-y-6">
          <ContactDuplicateManager />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Data Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" className="flex items-center gap-2" onClick={handleExportData}>
                  <Download className="h-4 w-4" />
                  Export Contacts
                </Button>
                <Button variant="outline" className="flex items-center gap-2" disabled>
                  <Upload className="h-4 w-4" />
                  Import Contacts
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Export your contacts as a JSON file for backup or migration purposes.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI Features
              </CardTitle>
              <CardDescription>
                Manage AI-powered features for your contact network.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2" 
                  onClick={() => setShowAIAskModal(true)}
                >
                  <Brain className="h-4 w-4" />
                  Ask AI
                </Button>
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2" 
                  onClick={() => setShowMemoryModal(true)}
                >
                  <Brain className="h-4 w-4" />
                  Add Memory
                </Button>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Voice Recognition</span>
                  <Badge variant="secondary">Enabled</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">AI Processing</span>
                  <Badge variant="secondary">Active</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                AI Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Birthday Reminders</span>
                  <Badge variant="secondary">Enabled</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Relationship Insights</span>
                  <Badge variant="secondary">Enabled</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Contact Suggestions</span>
                  <Badge variant="secondary">Enabled</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Privacy & Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Data Encryption</span>
                  <Badge variant="secondary">Enabled</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Two-Factor Authentication</span>
                  <Badge variant="outline">Not Set</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Session Timeout</span>
                  <Badge variant="secondary">30 minutes</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <Trash2 className="h-5 w-5" />
                Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border border-destructive/20 rounded-lg bg-destructive/5">
                <h4 className="font-medium text-destructive mb-2">Delete Account</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={handleDeleteAccount}
                >
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <AIAskModal 
        isOpen={showAIAskModal} 
        onOpenChange={setShowAIAskModal} 
      />
      
      <VoiceMemoryInputModal 
        isOpen={showMemoryModal} 
        onOpenChange={setShowMemoryModal} 
      />
    </div>
  );
}

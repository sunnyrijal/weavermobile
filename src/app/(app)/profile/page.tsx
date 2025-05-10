
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { Edit3, Mail, UserCircle2 } from "lucide-react";

export default function ProfilePage() {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Loading user data...</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Please log in to view your profile.</p>
        </CardContent>
      </Card>
    );
  }
  
  const getInitials = (name: string | null | undefined) => {
    if (!name) return "NN";
    const names = name.split(' ');
    if (names.length > 1) {
      return names[0][0] + names[names.length - 1][0];
    }
    return name.substring(0, 2);
  };


  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card className="shadow-lg">
        <CardHeader className="items-center text-center">
          <Avatar className="w-24 h-24 mb-4 border-4 border-primary ring-2 ring-primary-foreground shadow-md">
            <AvatarImage src={currentUser.photoURL || ""} alt={currentUser.displayName || "User"} data-ai-hint="profile avatar large"/>
            <AvatarFallback className="text-3xl">{getInitials(currentUser.displayName)}</AvatarFallback>
          </Avatar>
          <CardTitle className="text-3xl">{currentUser.displayName || "User Name"}</CardTitle>
          <CardDescription className="text-lg">{currentUser.email}</CardDescription>
          <Button variant="outline" size="sm" className="mt-2">
            <Edit3 className="mr-2 h-4 w-4" /> Edit Profile
          </Button>
        </CardHeader>
        <Separator />
        <CardContent className="p-6 space-y-4">
          <div>
            <Label htmlFor="displayName" className="text-xs text-muted-foreground">Display Name</Label>
            <Input id="displayName" value={currentUser.displayName || ""} readOnly className="mt-1 text-base"/>
          </div>
          <div>
            <Label htmlFor="email" className="text-xs text-muted-foreground">Email Address</Label>
            <Input id="email" type="email" value={currentUser.email || ""} readOnly className="mt-1 text-base"/>
          </div>
          <div>
            <Label htmlFor="uid" className="text-xs text-muted-foreground">User ID</Label>
            <Input id="uid" value={currentUser.uid} readOnly className="mt-1 text-sm text-muted-foreground bg-muted/50"/>
          </div>
           <div>
            <Label htmlFor="createdAt" className="text-xs text-muted-foreground">Account Created</Label>
            <Input id="createdAt" value={currentUser.createdAt ? new Date(currentUser.createdAt).toLocaleDateString() : 'N/A'} readOnly className="mt-1 text-base"/>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
          <CardDescription>Manage your application settings.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="defaultView" className="text-xs text-muted-foreground">Default Contact View</Label>
            <Input id="defaultView" value={currentUser.userPreferences?.defaultView || "grid"} readOnly className="mt-1 text-base"/>
            {/* In a real app, this would be a Select component */}
          </div>
          <Button variant="secondary">Update Preferences</Button>
        </CardContent>
      </Card>
       <Card className="shadow-lg border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="destructive">Delete Account</Button>
           <p className="text-xs text-muted-foreground mt-2">This action is irreversible. All your data will be permanently lost.</p>
        </CardContent>
      </Card>
    </div>
  );
}

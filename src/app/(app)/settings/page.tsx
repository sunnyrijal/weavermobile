
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Bell, Palette, ShieldCheck, UserCircle, ListChecks } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account and application preferences.</p>
      </div>
      
      <Card className="shadow-md">
        <CardHeader>
          <UserCircle className="w-6 h-6 mb-2 text-primary" />
          <CardTitle>Account Information</CardTitle>
          <CardDescription>Update your personal details and login credentials.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="displayName">Display Name</Label>
              <Input id="displayName" defaultValue="Current User Name" />
            </div>
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" defaultValue="user@example.com" disabled />
            </div>
          </div>
          <Button>Save Account Changes</Button>
          <Separator className="my-4" />
          <div>
            <Label htmlFor="currentPassword">Change Password</Label>
            <Input id="currentPassword" type="password" placeholder="Current Password" className="mb-2"/>
            <Input id="newPassword" type="password" placeholder="New Password" className="mb-2"/>
            <Input id="confirmPassword" type="password" placeholder="Confirm New Password"/>
          </div>
          <Button variant="secondary">Update Password</Button>
        </CardContent>
      </Card>

      <Card className="shadow-md">
        <CardHeader>
          <Palette className="w-6 h-6 mb-2 text-primary" />
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Customize the look and feel of NetworkNest.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
           <div className="flex items-center justify-between">
            <Label htmlFor="darkMode">Dark Mode</Label>
            <Switch id="darkMode" /> {/* Add functionality to toggle theme */}
          </div>
          <div>
            <Label htmlFor="defaultView">Default Contact View</Label>
            <Select defaultValue="grid">
              <SelectTrigger id="defaultView">
                <SelectValue placeholder="Select default view" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="list">List View</SelectItem>
                <SelectItem value="grid">Grid View</SelectItem>
                <SelectItem value="tree">Tree View (Map)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button>Save Appearance Settings</Button>
        </CardContent>
      </Card>
      
      <Card className="shadow-md">
        <CardHeader>
          <Bell className="w-6 h-6 mb-2 text-primary" />
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Manage how you receive notifications.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox id="emailNotifications" defaultChecked />
            <Label htmlFor="emailNotifications">Email Notifications for important updates</Label>
          </div>
           <div className="flex items-center space-x-2">
            <Checkbox id="birthdayReminders" />
            <Label htmlFor="birthdayReminders">Birthday Reminders</Label>
          </div>
          <Button>Save Notification Settings</Button>
        </CardContent>
      </Card>

      <Card className="shadow-md">
        <CardHeader>
          <ListChecks className="w-6 h-6 mb-2 text-primary" />
          <CardTitle>Data Management</CardTitle>
          <CardDescription>Manage your contact data.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline">Export All Contacts (CSV)</Button>
          <Button variant="outline" className="text-destructive hover:border-destructive hover:bg-destructive/10 hover:text-destructive">
            Clear All Imported Data
          </Button>
        </CardContent>
      </Card>
      
      <Card className="shadow-md">
        <CardHeader>
          <ShieldCheck className="w-6 h-6 mb-2 text-primary" />
          <CardTitle>Privacy & Security</CardTitle>
          <CardDescription>Manage your privacy settings and account security.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline">Manage Connected Apps (OAuth)</Button>
          <Button variant="outline">View Privacy Policy</Button>
          <Button variant="outline">Two-Factor Authentication (2FA)</Button>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar, Clock, Gift, Heart, Phone, Users, Bell, Plus, Edit, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Reminder {
  id: string;
  title: string;
  date: string;
  type: 'birthday' | 'anniversary' | 'call' | 'meeting' | 'gift' | 'custom';
  description?: string;
  isCompleted: boolean;
  leadTime: number;
  notificationPreferences: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  recurring?: {
    frequency: 'yearly' | 'monthly' | 'weekly' | 'custom';
    interval?: number;
  };
  contactName: string;
  contactId: string;
}

interface Contact {
  _id: string;
  name: string;
  birthday?: string;
  anniversary?: string;
}

export function ReminderManager() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    type: 'custom' as Reminder['type'],
    description: '',
    leadTime: 1,
    notificationPreferences: {
      email: true,
      push: true,
      sms: false,
    },
    recurring: {
      frequency: 'yearly' as const,
      interval: undefined as number | undefined,
    },
    contactId: '',
  });

  useEffect(() => {
    if (currentUser?.uid) {
      fetchData();
    }
  }, [currentUser]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch reminders
      const remindersResponse = await fetch(`/api/contacts/${currentUser?.uid}/reminders?includeCompleted=true`);
      if (remindersResponse.ok) {
        const remindersData = await remindersResponse.json();
        setReminders(remindersData.reminders || []);
      }

      // Fetch contacts for dropdown
      const contactsResponse = await fetch(`/api/contacts?ownerId=${currentUser?.uid}`);
      if (contactsResponse.ok) {
        const contactsData = await contactsResponse.json();
        setContacts(contactsData.contacts || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load reminders",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`/api/contacts/${currentUser?.uid}/reminders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          date: new Date(formData.date),
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Reminder created successfully",
        });
        setIsDialogOpen(false);
        resetForm();
        fetchData();
      } else {
        throw new Error('Failed to create reminder');
      }
    } catch (error) {
      console.error('Error creating reminder:', error);
      toast({
        title: "Error",
        description: "Failed to create reminder",
        variant: "destructive"
      });
    }
  };

  const handleComplete = async (reminderId: string, contactId: string) => {
    try {
      const response = await fetch(`/api/contacts/${contactId}/reminders/${reminderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isCompleted: true }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Reminder marked as completed",
        });
        fetchData();
      }
    } catch (error) {
      console.error('Error completing reminder:', error);
      toast({
        title: "Error",
        description: "Failed to complete reminder",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (reminderId: string, contactId: string) => {
    if (!confirm('Are you sure you want to delete this reminder?')) return;
    
    try {
      const response = await fetch(`/api/contacts/${contactId}/reminders/${reminderId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Reminder deleted successfully",
        });
        fetchData();
      }
    } catch (error) {
      console.error('Error deleting reminder:', error);
      toast({
        title: "Error",
        description: "Failed to delete reminder",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      date: '',
      type: 'custom',
      description: '',
      leadTime: 1,
      notificationPreferences: {
        email: true,
        push: true,
        sms: false,
      },
      recurring: {
        frequency: 'yearly',
        interval: undefined,
      },
      contactId: '',
    });
    setEditingReminder(null);
  };

  const getReminderIcon = (type: string) => {
    switch (type) {
      case 'birthday': return <Gift className="h-4 w-4" />;
      case 'anniversary': return <Heart className="h-4 w-4" />;
      case 'call': return <Phone className="h-4 w-4" />;
      case 'meeting': return <Users className="h-4 w-4" />;
      case 'gift': return <Gift className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getUpcomingReminders = () => {
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    return reminders.filter(reminder => {
      const reminderDate = new Date(reminder.date);
      return !reminder.isCompleted && reminderDate >= today && reminderDate <= thirtyDaysFromNow;
    });
  };

  const getOverdueReminders = () => {
    const today = new Date();
    return reminders.filter(reminder => {
      const reminderDate = new Date(reminder.date);
      return !reminder.isCompleted && reminderDate < today;
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Reminder Manager</h2>
          <p className="text-muted-foreground">Manage your reminders and notifications</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Reminder
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Reminder</DialogTitle>
              <DialogDescription>
                Create a new reminder for a contact
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value as Reminder['type'] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="birthday">Birthday</SelectItem>
                      <SelectItem value="anniversary">Anniversary</SelectItem>
                      <SelectItem value="call">Call</SelectItem>
                      <SelectItem value="meeting">Meeting</SelectItem>
                      <SelectItem value="gift">Gift</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="leadTime">Lead Time (days)</Label>
                  <Input
                    id="leadTime"
                    type="number"
                    min="0"
                    value={formData.leadTime}
                    onChange={(e) => setFormData({ ...formData, leadTime: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="contact">Contact</Label>
                <Select
                  value={formData.contactId}
                  onValueChange={(value) => setFormData({ ...formData, contactId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a contact" />
                  </SelectTrigger>
                  <SelectContent>
                    {contacts.map((contact) => (
                      <SelectItem key={contact._id} value={contact._id}>
                        {contact.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional description..."
                />
              </div>

              <div className="space-y-2">
                <Label>Notifications</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="email"
                      checked={formData.notificationPreferences.email}
                      onCheckedChange={(checked) => 
                        setFormData({
                          ...formData,
                          notificationPreferences: {
                            ...formData.notificationPreferences,
                            email: checked as boolean
                          }
                        })
                      }
                    />
                    <Label htmlFor="email">Email</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="push"
                      checked={formData.notificationPreferences.push}
                      onCheckedChange={(checked) => 
                        setFormData({
                          ...formData,
                          notificationPreferences: {
                            ...formData.notificationPreferences,
                            push: checked as boolean
                          }
                        })
                      }
                    />
                    <Label htmlFor="push">Push Notification</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="sms"
                      checked={formData.notificationPreferences.sms}
                      onCheckedChange={(checked) => 
                        setFormData({
                          ...formData,
                          notificationPreferences: {
                            ...formData.notificationPreferences,
                            sms: checked as boolean
                          }
                        })
                      }
                    />
                    <Label htmlFor="sms">SMS</Label>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Reminder</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="h-5 w-5" />
              <span>Upcoming Reminders</span>
            </CardTitle>
            <CardDescription>Reminders for the next 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {getUpcomingReminders().map((reminder) => (
                <div key={reminder.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getReminderIcon(reminder.type)}
                    <div>
                      <p className="font-medium">{reminder.title}</p>
                      <p className="text-sm text-muted-foreground">{reminder.contactName}</p>
                      {reminder.description && (
                        <p className="text-xs text-muted-foreground">{reminder.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">{formatDate(reminder.date)}</Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleComplete(reminder.id, reminder.contactId)}
                    >
                      <Checkbox className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {getUpcomingReminders().length === 0 && (
                <p className="text-muted-foreground text-center py-4">No upcoming reminders</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Overdue Reminders</span>
            </CardTitle>
            <CardDescription>Reminders that are past due</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {getOverdueReminders().map((reminder) => (
                <div key={reminder.id} className="flex items-center justify-between p-3 border rounded-lg bg-red-50">
                  <div className="flex items-center space-x-3">
                    {getReminderIcon(reminder.type)}
                    <div>
                      <p className="font-medium">{reminder.title}</p>
                      <p className="text-sm text-muted-foreground">{reminder.contactName}</p>
                      {reminder.description && (
                        <p className="text-xs text-muted-foreground">{reminder.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="destructive">{formatDate(reminder.date)}</Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleComplete(reminder.id, reminder.contactId)}
                    >
                      <Checkbox className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(reminder.id, reminder.contactId)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {getOverdueReminders().length === 0 && (
                <p className="text-muted-foreground text-center py-4">No overdue reminders</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Reminders</CardTitle>
          <CardDescription>Complete list of all reminders</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {reminders.map((reminder) => (
              <div key={reminder.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  {getReminderIcon(reminder.type)}
                  <div>
                    <p className="font-medium">{reminder.title}</p>
                    <p className="text-sm text-muted-foreground">{reminder.contactName}</p>
                    {reminder.description && (
                      <p className="text-xs text-muted-foreground">{reminder.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={reminder.isCompleted ? "secondary" : "default"}>
                    {reminder.isCompleted ? "Completed" : "Pending"}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {formatDate(reminder.date)}
                  </span>
                  {!reminder.isCompleted && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleComplete(reminder.id, reminder.contactId)}
                    >
                      <Checkbox className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(reminder.id, reminder.contactId)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {reminders.length === 0 && (
              <p className="text-muted-foreground text-center py-8">No reminders found</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
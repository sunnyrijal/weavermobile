"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, Users, Gift, Phone, MapPin, Heart, Activity, Bell, FolderOpen, TrendingUp } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Reminder {
  id: string;
  title: string;
  date: string;
  type: string;
  description?: string;
  isCompleted: boolean;
  contactName: string;
  contactId: string;
}

interface Activity {
  id: string;
  type: string;
  date: string;
  duration?: number;
  notes: string;
  mood?: string;
  tags: string[];
  location?: string;
  contactName: string;
  contactId: string;
}

interface Vault {
  _id: string;
  name: string;
  description?: string;
  type: string;
  color: string;
  isDefault: boolean;
  contactCount: number;
  recentActivity: number;
}

interface RelationshipInsights {
  totalInteractions: number;
  lastContact: string | null;
  averageMood: string;
  mostCommonActivity: string;
  contactFrequency: string;
  relationshipHealth: number;
}

export function ContactDashboard() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [insights, setInsights] = useState<RelationshipInsights | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser?.uid) {
      fetchDashboardData();
    }
  }, [currentUser]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch reminders
      const remindersResponse = await fetch(`/api/contacts/${currentUser?.uid}/reminders`);
      if (remindersResponse.ok) {
        const remindersData = await remindersResponse.json();
        setReminders(remindersData.reminders || []);
      }

      // Fetch activities
      const activitiesResponse = await fetch(`/api/contacts/${currentUser?.uid}/activities?limit=10`);
      if (activitiesResponse.ok) {
        const activitiesData = await activitiesResponse.json();
        setActivities(activitiesData.activities || []);
      }

      // Fetch vaults
      const vaultsResponse = await fetch(`/api/vaults?ownerId=${currentUser?.uid}`);
      if (vaultsResponse.ok) {
        const vaultsData = await vaultsResponse.json();
        setVaults(vaultsData.vaults || []);
      }

      // Fetch insights (mock data for now)
      setInsights({
        totalInteractions: 45,
        lastContact: new Date().toISOString(),
        averageMood: 'positive',
        mostCommonActivity: 'call',
        contactFrequency: 'weekly',
        relationshipHealth: 85
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getReminderIcon = (type: string) => {
    switch (type) {
      case 'birthday': return <Gift className="h-4 w-4" />;
      case 'anniversary': return <Heart className="h-4 w-4" />;
      case 'call': return <Phone className="h-4 w-4" />;
      case 'meeting': return <Users className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'call': return <Phone className="h-4 w-4" />;
      case 'meeting': return <Users className="h-4 w-4" />;
      case 'gift': return <Gift className="h-4 w-4" />;
      case 'social': return <Heart className="h-4 w-4" />;
      case 'work': return <Activity className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getMoodColor = (mood?: string) => {
    switch (mood) {
      case 'positive': return 'text-green-600 bg-green-100';
      case 'negative': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Contact Dashboard</h1>
        <Button onClick={fetchDashboardData} variant="outline">
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="reminders">Reminders</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
          <TabsTrigger value="vaults">Vaults</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Upcoming Reminders</CardTitle>
                <Bell className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reminders.filter(r => !r.isCompleted).length}</div>
                <p className="text-xs text-muted-foreground">
                  Next 30 days
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recent Activities</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activities.length}</div>
                <p className="text-xs text-muted-foreground">
                  Last 30 days
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Vaults</CardTitle>
                <FolderOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{vaults.length}</div>
                <p className="text-xs text-muted-foreground">
                  Organized contacts
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Relationship Health</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{insights?.relationshipHealth || 0}%</div>
                <p className="text-xs text-muted-foreground">
                  Average score
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Today's Reminders</CardTitle>
                <CardDescription>Upcoming reminders for today</CardDescription>
              </CardHeader>
              <CardContent>
                {reminders.filter(r => !r.isCompleted).slice(0, 5).map((reminder) => (
                  <div key={reminder.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                    <div className="flex items-center space-x-2">
                      {getReminderIcon(reminder.type)}
                      <div>
                        <p className="font-medium">{reminder.title}</p>
                        <p className="text-sm text-muted-foreground">{reminder.contactName}</p>
                      </div>
                    </div>
                    <Badge variant="outline">{formatDate(reminder.date)}</Badge>
                  </div>
                ))}
                {reminders.filter(r => !r.isCompleted).length === 0 && (
                  <p className="text-muted-foreground text-center py-4">No reminders for today</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activities</CardTitle>
                <CardDescription>Your latest interactions</CardDescription>
              </CardHeader>
              <CardContent>
                {activities.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                    <div className="flex items-center space-x-2">
                      {getActivityIcon(activity.type)}
                      <div>
                        <p className="font-medium capitalize">{activity.type}</p>
                        <p className="text-sm text-muted-foreground">{activity.contactName}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">{formatDate(activity.date)}</p>
                      {activity.mood && (
                        <Badge className={getMoodColor(activity.mood)} variant="secondary">
                          {activity.mood}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
                {activities.length === 0 && (
                  <p className="text-muted-foreground text-center py-4">No recent activities</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reminders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Reminders</CardTitle>
              <CardDescription>Manage your reminders and notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reminders.map((reminder) => (
                  <div key={reminder.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getReminderIcon(reminder.type)}
                      <div>
                        <p className="font-medium">{reminder.title}</p>
                        <p className="text-sm text-muted-foreground">{reminder.contactName}</p>
                        {reminder.description && (
                          <p className="text-sm text-muted-foreground">{reminder.description}</p>
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
                    </div>
                  </div>
                ))}
                {reminders.length === 0 && (
                  <p className="text-muted-foreground text-center py-8">No reminders found</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Activity Log</CardTitle>
              <CardDescription>Track your interactions and relationships</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getActivityIcon(activity.type)}
                      <div>
                        <p className="font-medium capitalize">{activity.type}</p>
                        <p className="text-sm text-muted-foreground">{activity.contactName}</p>
                        <p className="text-sm">{activity.notes}</p>
                        {activity.location && (
                          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span>{activity.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">{formatDate(activity.date)}</p>
                      <p className="text-xs text-muted-foreground">{formatTime(activity.date)}</p>
                      {activity.duration && (
                        <p className="text-xs text-muted-foreground">{activity.duration} min</p>
                      )}
                      {activity.mood && (
                        <Badge className={getMoodColor(activity.mood)} variant="secondary">
                          {activity.mood}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
                {activities.length === 0 && (
                  <p className="text-muted-foreground text-center py-8">No activities found</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vaults" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contact Vaults</CardTitle>
              <CardDescription>Organize your contacts into vaults</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {vaults.map((vault) => (
                  <div key={vault._id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: vault.color }}
                        />
                        <h3 className="font-medium">{vault.name}</h3>
                        {vault.isDefault && (
                          <Badge variant="secondary">Default</Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {vault.description || `${vault.type} vault`}
                    </p>
                    <div className="flex items-center justify-between text-sm">
                      <span>{vault.contactCount} contacts</span>
                      <span>{vault.recentActivity} recent activities</span>
                    </div>
                  </div>
                ))}
                {vaults.length === 0 && (
                  <p className="text-muted-foreground text-center py-8">No vaults found</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Relationship Insights</CardTitle>
              <CardDescription>AI-powered insights about your relationships</CardDescription>
            </CardHeader>
            <CardContent>
              {insights && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Total Interactions</span>
                      <span className="text-2xl font-bold">{insights.totalInteractions}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Last Contact</span>
                      <span className="text-sm">
                        {insights.lastContact ? formatDate(insights.lastContact) : 'Never'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Average Mood</span>
                      <Badge className={getMoodColor(insights.averageMood)} variant="secondary">
                        {insights.averageMood}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Most Common Activity</span>
                      <span className="text-sm capitalize">{insights.mostCommonActivity}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Contact Frequency</span>
                      <span className="text-sm capitalize">{insights.contactFrequency}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Relationship Health</span>
                      <span className="text-2xl font-bold">{insights.relationshipHealth}%</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 
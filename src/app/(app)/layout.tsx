"use client";
import React, { useEffect, useState } from 'react'; // Added useState
import { useRouter, usePathname } from 'next/navigation'; 
import { useAuth } from '@/hooks/useAuth';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Logo } from "@/components/shared/Logo";
import { UserNav } from "@/components/layout/UserNav";
import { Home, UsersRound, Share2, UploadCloud, Settings, Bell, PlusCircle, Brain } from 'lucide-react'; // Added PlusCircle, Brain
import { Button } from "@/components/ui/button";

import Link from 'next/link';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"; 
import { VoiceMemoryInputModal } from '@/components/memory/VoiceMemoryInputModal';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { ThemeSwitcher } from '@/components/layout/ThemeSwitcher';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

const mainNavItemsDefinition = [
  { hrefInitial: "/dashboard", icon: Home, label: "Dashboard", tooltip: "Dashboard" },
  { hrefInitial: "/contacts", icon: UsersRound, label: "Contacts", tooltip: "Contacts" },
  { hrefInitial: "/map", icon: Share2, label: "Relationship Map", tooltip: "Relationship Map", id: "map-link" },
  { hrefInitial: "/import", icon: UploadCloud, label: "Import Network", tooltip: "Import Network" },
];

const bottomNavItems = [
 { href: "/settings", icon: Settings, label: "Settings", tooltip: "Settings" },
];

// Sample notification data - External social media updates
const sampleNotifications = [
  {
    id: 1,
    title: "Sam posted on Instagram",
    message: "Just finished the new project! Check out the results 🚀 #tech #innovation",
    time: "2 minutes ago",
    read: false,
    type: "instagram",
    platform: "Instagram",
    contactName: "Sam Johnson"
  },
  {
    id: 2,
    title: "Bill got promoted on LinkedIn",
    message: "Excited to share that I've been promoted to Senior Product Manager at TechCorp!",
    time: "15 minutes ago",
    read: false,
    type: "linkedin",
    platform: "LinkedIn",
    contactName: "Bill Smith"
  },
  {
    id: 3,
    title: "Alice shared on Facebook",
    message: "Amazing weekend hiking in the mountains! Nature is truly healing 🌲",
    time: "1 hour ago",
    read: true,
    type: "facebook",
    platform: "Facebook",
    contactName: "Alice Williams"
  },
  {
    id: 4,
    title: "Bruce posted on Twitter",
    message: "Just published my latest article on AI trends. Link in bio! #AI #tech",
    time: "3 hours ago",
    read: false,
    type: "twitter",
    platform: "Twitter",
    contactName: "Bruce Lipton"
  },
  {
    id: 5,
    title: "Coralie updated on LinkedIn",
    message: "Starting my new role as Software Engineer at StartupXYZ next week!",
    time: "5 hours ago",
    read: true,
    type: "linkedin",
    platform: "LinkedIn",
    contactName: "Coralie Matabaro"
  }
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth(); 
  const router = useRouter();
  const pathname = usePathname(); 
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState(false);
  const [notifications, setNotifications] = useState(sampleNotifications);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (notificationId: number) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleNotificationClick = (notification: any) => {
    markAsRead(notification.id);
    // Navigate based on notification type
    switch (notification.type) {
      case 'instagram':
        // Could open Instagram profile or post
        window.open(`https://instagram.com/${notification.contactName?.toLowerCase().replace(' ', '')}`, '_blank');
        break;
      case 'linkedin':
        // Could open LinkedIn profile
        window.open(`https://linkedin.com/in/${notification.contactName?.toLowerCase().replace(' ', '-')}`, '_blank');
        break;
      case 'facebook':
        // Could open Facebook profile
        window.open(`https://facebook.com/${notification.contactName?.toLowerCase().replace(' ', '')}`, '_blank');
        break;
      case 'twitter':
        // Could open Twitter profile
        window.open(`https://twitter.com/${notification.contactName?.toLowerCase().replace(' ', '')}`, '_blank');
        break;
      default:
        // Navigate to contacts page to find the person
        router.push('/contacts');
        break;
    }
    setIsNotificationOpen(false);
  };

  const navItems = mainNavItemsDefinition.map(item => {
    let currentHref = item.hrefInitial;
    if (item.id === "map-link") {
      const contactPageMatch = pathname.match(/^\/contacts\/([^/]+)(?:\/(edit|notes|events|relationships|photos))?$/);
      if (contactPageMatch && contactPageMatch[1]) {
        const currentContactIdOnScreen = contactPageMatch[1];
        currentHref = `/map?contactId=${currentContactIdOnScreen}`;
      }
    }
    return { ...item, href: currentHref };
  });


  return (
    <ThemeProvider>
      <header className="sticky top-0 z-30 flex h-14 items-center gap-2 sm:gap-4 border-b bg-background/80 backdrop-blur-sm px-2 sm:px-6">
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <TooltipProvider key={item.hrefInitial} delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href={item.href}>
                    <Button
                      variant={(pathname === item.hrefInitial || (item.id === "map-link" && pathname.startsWith("/map"))) ? "secondary" : "ghost"}
                      size="sm"
                      className="font-medium px-2 lg:px-3"
                    >
                      <item.icon className="h-4 w-4" />
                      <span className="ml-2 hidden lg:inline">{item.label}</span>
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="lg:hidden">
                  <p>{item.tooltip}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <ThemeSwitcher />
          <Button variant="outline" size="sm" asChild>
            <Link href="/contacts/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Contact
            </Link>
          </Button>
          <DropdownMenu open={isNotificationOpen} onOpenChange={setIsNotificationOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 sm:h-9 sm:w-9 relative">
            <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                {unreadCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Badge>
                )}
            <span className="sr-only">Notifications</span>
          </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex items-center justify-between">
                  <span>Social Updates</span>
                  {unreadCount > 0 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={markAllAsRead}
                      className="h-6 px-2 text-xs"
                    >
                      Mark all as read
                    </Button>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notifications.length === 0 ? (
                <DropdownMenuItem disabled className="text-center text-muted-foreground">
                  No social updates
                </DropdownMenuItem>
              ) : (
                <DropdownMenuGroup>
                  {notifications.map((notification) => (
                    <DropdownMenuItem 
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className="flex flex-col items-start gap-1 p-3 cursor-pointer"
                    >
                      <div className="flex items-start justify-between w-full">
                        <div className="flex flex-col gap-1">
                          <span className={`text-sm font-medium ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {notification.title}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {notification.message}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {notification.time}
                            </span>
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                              {notification.platform}
                            </span>
                          </div>
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-primary rounded-full ml-2" />
                        )}
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/settings')} className="text-center">
                Manage social connections
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {currentUser && <UserNav />}
        </div>
      </header>
      <main className="flex-1 p-2 sm:p-4 md:p-6 bg-secondary/50 relative">
        {children}
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="default"
                size="icon"
                className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-xl z-50"
                onClick={() => setIsMemoryModalOpen(true)}
              >
                <Brain className="h-7 w-7" />
                <span className="sr-only">Add Memory</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Add New Memory</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </main>
      <VoiceMemoryInputModal isOpen={isMemoryModalOpen} onOpenChange={setIsMemoryModalOpen} />
    </ThemeProvider>
  );
}


"use client";
import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation'; // Added usePathname
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
import { Home, UsersRound, GitFork, UploadCloud, Settings, FileText, Share2, Bell, MicOff } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { GlobalSearchInput } from '@/components/layout/GlobalSearchInput';
import Link from 'next/link';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"; // Added Tooltip imports

const navItems = [
  { href: "/dashboard", icon: Home, label: "Dashboard", tooltip: "Dashboard" },
  { href: "/contacts", icon: UsersRound, label: "Contacts", tooltip: "Contacts" },
  { href: "/map", icon: Share2, label: "Relationship Map", tooltip: "Relationship Map" },
  { href: "/import", icon: UploadCloud, label: "Import Network", tooltip: "Import Network" },
];

const bottomNavItems = [
 { href: "/settings", icon: Settings, label: "Settings", tooltip: "Settings" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth(); 
  const router = useRouter();
  const pathname = usePathname(); // Get current pathname for active link styling

  return (
    <SidebarProvider defaultOpen={false}> {/* Changed defaultOpen to false for desktop */}
      <Sidebar collapsible="icon" className="border-r border-sidebar-border shadow-md">
        <SidebarHeader className="p-4">
          <Logo showText={false} className="group-data-[collapsible=icon]:hidden" />
          <Logo size="sm" showText={false} className="hidden group-data-[collapsible=icon]:flex justify-center w-full" />
        </SidebarHeader>
        <SidebarContent> {/* This content is primarily for the mobile drawer now, or if desktop sidebar is expanded */}
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href} legacyBehavior passHref>
                  <SidebarMenuButton
                    tooltip={{ children: item.tooltip, side: 'right', className: 'bg-primary text-primary-foreground' }}
                    isActive={pathname === item.href}
                    className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground"
                  >
                    <item.icon className="shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="mt-auto">
           <SidebarMenu>
            {bottomNavItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                 <Link href={item.href} legacyBehavior passHref>
                    <SidebarMenuButton
                        tooltip={{ children: item.tooltip, side: 'right', className: 'bg-primary text-primary-foreground' }}
                        isActive={pathname === item.href}
                        className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground"
                    >
                        <item.icon className="shrink-0" />
                        <span className="truncate">{item.label}</span>
                    </SidebarMenuButton>
                 </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 sm:px-6">
          <SidebarTrigger className="md:hidden" /> {/* Mobile trigger for sidebar */}
          
          {/* Desktop Navigation - items moved here */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <TooltipProvider key={item.href} delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link href={item.href}>
                      <Button
                        variant={pathname === item.href ? "secondary" : "ghost"}
                        size="sm"
                        className="font-medium px-3" 
                      >
                        <item.icon className="h-4 w-4" />
                        <span className="ml-2 hidden lg:inline">{item.label}</span>
                      </Button>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="lg:hidden"> {/* Show tooltip only if label is hidden */}
                    <p>{item.tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </nav>
          
          {/* Spacer removed, ml-auto on the next div will push it to the right */}
          <div className="ml-auto flex items-center gap-2"> {/* Group for items on the right */}
            <GlobalSearchInput />
            <Button variant="ghost" size="icon" className="rounded-full">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <span className="sr-only">Notifications</span>
            </Button>
            {currentUser && <UserNav />}
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 bg-secondary/50">
            {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}


"use client";
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import { Home, UsersRound, GitFork, UploadCloud, Settings, FileText, Share2, Bell } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import Link from 'next/link';

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
  const { currentUser } = useAuth(); // currentUser will be the mock user
  const router = useRouter();

  // Removed useEffect that redirects to /login, as login is now bypassed.
  // Removed loading skeleton as currentUser is immediately available.
  
  return (
    <SidebarProvider defaultOpen>
      <Sidebar collapsible="icon" className="border-r border-sidebar-border shadow-md">
        <SidebarHeader className="p-4">
          <Logo showText={false} className="group-data-[collapsible=icon]:hidden" />
          <Logo size="sm" showText={false} className="hidden group-data-[collapsible=icon]:flex justify-center w-full" />
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href} legacyBehavior passHref>
                  <SidebarMenuButton
                    tooltip={{ children: item.tooltip, side: 'right', className: 'bg-primary text-primary-foreground' }}
                    isActive={router.pathname === item.href}
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
                        isActive={router.pathname === item.href}
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
          <SidebarTrigger className="md:hidden" />
          <div className="flex-1">
             {/* Optional: Breadcrumbs or Page Title */}
          </div>
          <div className="relative flex-1 md:grow-0">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search contacts, tags..."
              className="w-full rounded-lg bg-muted pl-8 md:w-[200px] lg:w-[320px] focus-visible:ring-accent"
            />
          </div>
          <Button variant="ghost" size="icon" className="rounded-full">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <span className="sr-only">Notifications</span>
          </Button>
          {currentUser && <UserNav />} {/* UserNav still relies on currentUser from context */}
        </header>
        <main className="flex-1 p-4 sm:p-6 bg-secondary/50">
            {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}



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
import { GlobalSearchInput } from '@/components/layout/GlobalSearchInput';
import Link from 'next/link';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"; 
import { VoiceMemoryInputModal } from '@/components/memory/VoiceMemoryInputModal'; // Added

const mainNavItemsDefinition = [
  { hrefInitial: "/dashboard", icon: Home, label: "Dashboard", tooltip: "Dashboard" },
  { hrefInitial: "/contacts", icon: UsersRound, label: "Contacts", tooltip: "Contacts" },
  { hrefInitial: "/map", icon: Share2, label: "Relationship Map", tooltip: "Relationship Map", id: "map-link" },
  { hrefInitial: "/import", icon: UploadCloud, label: "Import Network", tooltip: "Import Network" },
];

const bottomNavItems = [
 { href: "/settings", icon: Settings, label: "Settings", tooltip: "Settings" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth(); 
  const router = useRouter();
  const pathname = usePathname(); 
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState(false); // Added state for modal

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
    <SidebarProvider defaultOpen={false}> 
      <Sidebar collapsible="icon" className="border-r border-sidebar-border shadow-md">
        <SidebarHeader className="p-4">
          <Logo showText={false} className="group-data-[collapsible=icon]:hidden" />
          <Logo size="sm" showText={false} className="hidden group-data-[collapsible=icon]:flex justify-center w-full" />
        </SidebarHeader>
        <SidebarContent> 
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.hrefInitial}>
                <Link href={item.href} legacyBehavior passHref>
                  <SidebarMenuButton
                    tooltip={{ children: item.tooltip, side: 'right', className: 'bg-primary text-primary-foreground' }}
                    isActive={pathname === item.hrefInitial || (item.id === "map-link" && pathname.startsWith("/map"))} 
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
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 sm:gap-4 border-b bg-background/80 backdrop-blur-sm px-2 sm:px-6">
          <SidebarTrigger className="md:hidden" /> 
          
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
            <GlobalSearchInput />
            <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 sm:h-9 sm:w-9">
              <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
              <span className="sr-only">Notifications</span>
            </Button>
            {currentUser && <UserNav />}
          </div>
        </header>
        <main className="flex-1 p-2 sm:p-4 md:p-6 bg-secondary/50 relative"> {/* Added relative for FAB positioning */}
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
                    <Brain className="h-7 w-7"/>
                    <span className="sr-only">Add Memory</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p>Add New Memory</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
        </main>
      </SidebarInset>
      <VoiceMemoryInputModal isOpen={isMemoryModalOpen} onOpenChange={setIsMemoryModalOpen} /> {/* Added Modal */}
    </SidebarProvider>
  );
}

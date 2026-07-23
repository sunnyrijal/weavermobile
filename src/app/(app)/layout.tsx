"use client";
import React, { useEffect, useState } from 'react'; // Added useState
import { useRouter, usePathname } from 'next/navigation'; 
import { useAuth } from '@/hooks/useAuth';
import { useContactsContext } from '@/contexts/ContactsContext';
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
import { Home, UsersRound, Share2, UploadCloud, Settings, Bell, PlusCircle, Brain, Briefcase, Heart, Monitor, Smartphone } from 'lucide-react'; // Added Monitor, Smartphone
import { Button } from "@/components/ui/button";

import Link from 'next/link';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"; 
import { VoiceMemoryInputModal } from '@/components/memory/VoiceMemoryInputModal';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { ThemeSwitcher } from '@/components/layout/ThemeSwitcher';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
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

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isMemoryModalOpen, setIsMemoryModalOpen } = useContactsContext();

  return (
    <ThemeProvider>
      <div className="flex flex-col min-h-screen bg-[#FAF7F4] dark:bg-background max-w-xl mx-auto border-x border-[rgba(26,15,6,0.06)] shadow-sm pb-20 w-full relative">
        <main className="flex-1 w-full">
          {children}
        </main>
        <MobileBottomNav />
      </div>
      <VoiceMemoryInputModal 
        isOpen={isMemoryModalOpen} 
        onOpenChange={setIsMemoryModalOpen} 
      />
    </ThemeProvider>
  );
}

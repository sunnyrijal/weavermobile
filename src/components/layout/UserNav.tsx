"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { signOutUser } from "@/lib/actions/authActions";
import { LogOut, User as UserIcon, Settings, CreditCard } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

export function UserNav() {
  const { currentUser, setCurrentUser } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleSignOut = async () => {
    const result = await signOutUser();
    if (result.success) {
      setCurrentUser(null); // Update context
      localStorage.removeItem('mockCurrentUser'); // Clear mock persistence
      toast({ title: "Signed Out", description: "You have been successfully signed out." });
      router.push("/login");
    } else {
      toast({ title: "Sign Out Failed", description: result.error || "Could not sign out.", variant: "destructive" });
    }
  };

  if (!currentUser) {
    return null; // Or a login button if appropriate for the context
  }

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "NN"; // NetworkNest initials
    const names = name.split(' ');
    if (names.length > 1) {
      return names[0][0] + names[names.length - 1][0];
    }
    return name.substring(0, 2);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-9 w-9 rounded-full">
          <Avatar className="h-9 w-9">
            <AvatarImage src={currentUser.photoURL || ""} alt={currentUser.displayName || "User"} data-ai-hint="profile avatar" />
            <AvatarFallback>{getInitials(currentUser.displayName)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex items-center gap-3 mb-2">
            <Avatar className="h-12 w-12">
              <AvatarImage src={currentUser.photoURL || ""} alt={currentUser.displayName || "User"} />
              <AvatarFallback>{getInitials(currentUser.displayName)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">
                {currentUser.displayName || "User"}
              </p>
              <p className="text-xs leading-none text-muted-foreground">
                {currentUser.email}
              </p>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => router.push('/profile')} className="py-2">
            <UserIcon className="mr-3 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push('/billing')} className="py-2">
            <CreditCard className="mr-3 h-4 w-4" />
            <span>Billing</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push('/settings')} className="py-2">
            <Settings className="mr-3 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive py-2">
          <LogOut className="mr-3 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}


"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Skeleton } from "@/components/ui/skeleton";
// useAuth is no longer needed here as we are bypassing login
// import { useAuth } from '@/hooks/useAuth'; 

export default function HomePage() {
  // const { currentUser, loading } = useAuth(); // Not needed for bypassed login
  const router = useRouter();

  useEffect(() => {
    // Directly redirect to dashboard as login is bypassed
    router.replace('/dashboard');
  }, [router]);

  // Display a loading state or a full-page skeleton while redirecting.
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="space-y-4 p-8">
        <Skeleton className="h-12 w-48" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-3/4" />
        <p className="text-muted-foreground">Redirecting to your dashboard...</p>
      </div>
    </div>
  );
}


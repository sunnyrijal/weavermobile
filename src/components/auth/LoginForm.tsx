
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { loginUser, signInWithGoogle, signInWithApple } from "@/lib/actions/authActions";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});

export function LoginForm() {
  const { toast } = useToast();
  const { setCurrentUser } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    const result = await loginUser(values);
    if (result.success && result.user) {
      setCurrentUser(result.user);
      toast({ title: "Login Successful", description: "Welcome back!" });
      router.push("/dashboard");
    } else {
      toast({
        title: "Login Failed",
        description: result.error || "An unexpected error occurred.",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  }

  async function handleGoogleSignIn() {
    setIsGoogleLoading(true);
    const result = await signInWithGoogle();
    if (result.success && result.user) {
      setCurrentUser(result.user);
      toast({ title: "Google Sign-In Successful", description: "Welcome!" });
      router.push("/dashboard");
    } else {
      toast({
        title: "Google Sign-In Failed",
        description: result.error || "An unexpected error occurred.",
        variant: "destructive",
      });
    }
    setIsGoogleLoading(false);
  }
  
  async function handleAppleSignIn() {
    setIsAppleLoading(true);
    const result = await signInWithApple();
    if (result.success && result.user) {
      setCurrentUser(result.user);
      toast({ title: "Apple Sign-In Successful", description: "Welcome!" });
      router.push("/dashboard");
    } else {
      toast({
        title: "Apple Sign-In Failed",
        description: result.error || "An unexpected error occurred.",
        variant: "destructive",
      });
    }
    setIsAppleLoading(false);
  }

  return (
    <>
      <h2 className="text-2xl font-semibold text-center mb-6 text-foreground">Login to NetworkNest</h2>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="you@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Login
          </Button>
        </form>
      </Form>
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>
      <div className="space-y-3">
        <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isGoogleLoading}>
           {isGoogleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <svg role="img" viewBox="0 0 24 24" className="mr-2 h-4 w-4"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" ></path><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" ></path><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"></path><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" ></path><path fill="none" d="M1 1h22v22H1z"></path></svg>}
          Google
        </Button>
        <Button variant="outline" className="w-full" onClick={handleAppleSignIn} disabled={isAppleLoading}>
           {isAppleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <svg role="img" viewBox="0 0 24 24" className="mr-2 h-4 w-4"><path fill="currentColor" d="M12.026 2.668C10.37.645 7.166.52 5.506 2.583c-1.804 2.25-2.13 5.458-.88 7.407 1.173 1.827 3.01 2.906 4.938 2.848.062-.003.17-.012.27-.012.128-.006.237.003.352.003 1.658 0 3.342-1.07 4.675-2.794.54-.704.94-1.544 1.223-2.425a1.11 1.11 0 0 0 .062-1.09c-.01-.03-.018-.057-.028-.083a9.14 9.14 0 0 0-1.895-2.672c-.586-.633-1.13-1.14-1.73-1.556ZM9.613 14.03c-1.11-.03-2.203-.6-3.022-1.595C5.48 11.25 5.15 9.15 6.19 7.7c.54-.777 1.336-1.328 2.242-1.474.93-.15 1.862.22 2.594.89s1.086 1.525.97 2.514C11.84 11.04 11.01 13.97 9.614 14.03Zm8.493-5.88A3.22 3.22 0 0 0 19.65 6.2c-1.078-.086-2.13.458-2.714 1.11-.614.682-1.035 1.573-1.013 2.54.235 2.155 2.127 3.13 3.343 2.25.23-.17.39-.39.5-.64.15-.33.22-.68.23-1.03.02-.7-.18-1.37-.506-1.9Z" ></path></svg>}
          Apple
        </Button>
      </div>
      <p className="mt-6 text-center text-sm">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-medium text-primary hover:underline">
          Sign up
        </Link>
      </p>
    </>
  );
}

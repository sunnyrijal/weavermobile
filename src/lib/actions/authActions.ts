
"use server";

import type { UserProfile } from '@/lib/types';
import { z } from 'zod';

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const SignupSchema = z.object({
  displayName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

export async function loginUser(values: z.infer<typeof LoginSchema>): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1000));

  if (values.email === "user@example.com" && values.password === "password") {
    const user: UserProfile = {
      uid: "mock-user-uid",
      email: values.email,
      displayName: "Mock User",
      photoURL: "https://picsum.photos/seed/mockuser/200/200",
      createdAt: new Date(),
      userPreferences: { defaultView: 'grid' },
    };
    return { success: true, user };
  }
  return { success: false, error: "Invalid email or password." };
}

export async function signupUser(values: z.infer<typeof SignupSchema>): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Simulate email already in use
  if (values.email === "existing@example.com") {
    return { success: false, error: "Email already in use." };
  }

  const user: UserProfile = {
    uid: `mock-uid-${Date.now()}`,
    email: values.email,
    displayName: values.displayName,
    photoURL: `https://picsum.photos/seed/${values.displayName}/200/200`,
    createdAt: new Date(),
    userPreferences: { defaultView: 'grid' },
  };
  return { success: true, user };
}

export async function signOutUser(): Promise<{ success: boolean; error?: string }> {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 500));
  // In a real app, this would call Firebase signOut
  return { success: true };
}

export async function signInWithGoogle(): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const user: UserProfile = {
      uid: "mock-google-uid",
      email: "googleuser@example.com",
      displayName: "Google User",
      photoURL: "https://picsum.photos/seed/googleuser/200/200",
      createdAt: new Date(),
      userPreferences: { defaultView: 'grid' },
    };
    return { success: true, user };
}

export async function signInWithApple(): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const user: UserProfile = {
      uid: "mock-apple-uid",
      email: "appleuser@example.com",
      displayName: "Apple User",
      photoURL: "https://picsum.photos/seed/appleuser/200/200",
      createdAt: new Date(),
      userPreferences: { defaultView: 'grid' },
    };
    return { success: true, user };
}

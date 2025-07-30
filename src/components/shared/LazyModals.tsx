import React, { Suspense, lazy } from 'react';
import { Loader2 } from 'lucide-react';

// Lazy load heavy modals
const ContactMergeModal = lazy(() => import('@/components/contacts/ContactMergeModal').then(module => ({ default: module.ContactMergeModal })));
const EventGiftSuggestionModal = lazy(() => import('@/components/contacts/EventGiftSuggestionModal').then(module => ({ default: module.EventGiftSuggestionModal })));
const VoiceMemoryInputModal = lazy(() => import('@/components/memory/VoiceMemoryInputModal').then(module => ({ default: module.VoiceMemoryInputModal })));
const AIAskModal = lazy(() => import('@/components/shared/AIAskModal').then(module => ({ default: module.AIAskModal })));

// Loading fallback component
const ModalLoadingFallback = () => (
  <div className="flex items-center justify-center p-8">
    <Loader2 className="h-6 w-6 animate-spin" />
    <span className="ml-2">Loading...</span>
  </div>
);

// Lazy ContactMergeModal wrapper
export const LazyContactMergeModal = (props: any) => (
  <Suspense fallback={<ModalLoadingFallback />}>
    <ContactMergeModal {...props} />
  </Suspense>
);

// Lazy EventGiftSuggestionModal wrapper
export const LazyEventGiftSuggestionModal = (props: any) => (
  <Suspense fallback={<ModalLoadingFallback />}>
    <EventGiftSuggestionModal {...props} />
  </Suspense>
);

// Lazy VoiceMemoryInputModal wrapper
export const LazyVoiceMemoryInputModal = (props: any) => (
  <Suspense fallback={<ModalLoadingFallback />}>
    <VoiceMemoryInputModal {...props} />
  </Suspense>
);

// Lazy AIAskModal wrapper
export const LazyAIAskModal = (props: any) => (
  <Suspense fallback={<ModalLoadingFallback />}>
    <AIAskModal {...props} />
  </Suspense>
); 
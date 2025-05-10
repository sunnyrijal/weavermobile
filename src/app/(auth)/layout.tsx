
import { Logo } from '@/components/shared/Logo';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-secondary p-4">
      <div className="mb-8">
        <Logo size="lg" />
      </div>
      <div className="w-full max-w-md bg-card p-6 sm:p-8 rounded-xl shadow-2xl">
        {children}
      </div>
       <p className="mt-8 text-center text-sm text-muted-foreground">
        Welcome to NetworkNest. Your personal relationship manager.
      </p>
    </div>
  );
}

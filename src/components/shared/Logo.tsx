
import { Bird } from 'lucide-react';
import Link from 'next/link';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showText?: boolean;
}

export function Logo({ size = 'md', className, showText = true }: LogoProps) {
  const sizeClasses = {
    sm: { icon: 'h-6 w-6', text: 'text-lg' },
    md: { icon: 'h-8 w-8', text: 'text-2xl' },
    lg: { icon: 'h-10 w-10', text: 'text-3xl' },
  };

  return (
    <Link href="/dashboard" className={`flex items-center gap-2 text-primary ${className}`}>
      <Bird className={`${sizeClasses[size].icon} text-accent`} />
      {showText && <span className={`font-bold ${sizeClasses[size].text} font-heading`}>NetworkNest</span>}
    </Link>
  );
}

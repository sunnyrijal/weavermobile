
import { Bird } from 'lucide-react';
import Link from 'next/link';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showText?: boolean;
}

export function Logo({ size = 'md', className, showText = true }: LogoProps) {
  const sizeClasses = {
    sm: { icon: 'h-7 w-7', text: 'text-lg' }, // Increased sm icon size
    md: { icon: 'h-9 w-9', text: 'text-2xl' }, // Increased md icon size
    lg: { icon: 'h-12 w-12', text: 'text-3xl' }, // Increased lg icon size
  };

  return (
    <Link href="/dashboard" className={`flex items-center gap-2 text-primary ${className}`}>
      <Bird className={`${sizeClasses[size].icon} text-accent`} />
      {showText && <span className={`font-bold ${sizeClasses[size].text} font-heading`}>NetworkNest</span>}
    </Link>
  );
}


    
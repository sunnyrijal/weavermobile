"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, UsersRound, Plus, Share2, BookOpen } from 'lucide-react';

export default function MobileBottomNav() {
  const pathname = usePathname();

  const items = [
    { href: '/dashboard', label: 'Home', icon: Home },
    { href: '/contacts', label: 'People', icon: UsersRound },
    { href: '/contacts/new', label: 'Add', icon: Plus, isPrimary: true },
    { href: '/map', label: 'Network', icon: Share2 },
    { href: '/journal', label: 'Journal', icon: BookOpen },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom))' }}
    >
      <ul className="grid grid-cols-5 items-center text-xs">
        {items.map((item) => {
          const isActive = pathname === item.href || (item.href === '/map' && pathname.startsWith('/map'));
          const Icon = item.icon;
          return (
            <li key={item.href} className="relative">
              <Link
                href={item.href}
                className={
                  item.isPrimary
                    ? "flex items-center justify-center -mt-6"
                    : "flex flex-col items-center justify-center py-2"
                }
              >
                {item.isPrimary ? (
                  <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
                    <Icon className="h-6 w-6" />
                  </span>
                ) : (
                  <>
                    <Icon className={`h-5 w-5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className={`mt-1 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>{item.label}</span>
                  </>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}







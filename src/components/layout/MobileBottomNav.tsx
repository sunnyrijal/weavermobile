"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Mic, Network, User } from 'lucide-react';
import { useContactsContext } from '@/contexts/ContactsContext';

export default function MobileBottomNav({ isSimulated = false }: { isSimulated?: boolean }) {
  const pathname = usePathname();
  const { setIsMemoryModalOpen } = useContactsContext();

  const items = [
    { href: '/dashboard', label: 'Home', icon: Home },
    { href: '/contacts?focus=search', label: 'Search', icon: Search },
    { href: '#', label: 'Recap', icon: Mic, isPrimary: true },
    { href: '/map', label: 'Network', icon: Network },
    { href: '/profile', label: 'Profile', icon: User },
  ];

  return (
    <nav
      className={isSimulated
        ? "absolute bottom-0 left-0 right-0 z-40 border-t border-[rgba(26,15,6,0.08)] bg-[#FAF7F4]/95 backdrop-blur-md py-1.5 px-2"
        : "fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-xl z-40 border-t border-[rgba(26,15,6,0.08)] bg-[#FAF7F4]/90 backdrop-blur-md"
      }
      style={isSimulated ? {} : { paddingBottom: 'calc(env(safe-area-inset-bottom))' }}
    >
      <ul className="grid grid-cols-5 items-end text-xs">
        {items.map((item, idx) => {
          const isActive = 
            (item.href === '/dashboard' && pathname === '/dashboard') ||
            (item.href.startsWith('/contacts') && pathname.startsWith('/contacts')) ||
            (item.href === '/map' && pathname.startsWith('/map')) ||
            (item.href === '/profile' && pathname.startsWith('/profile'));

          const Icon = item.icon;

          if (item.isPrimary) {
            return (
              <li key={idx} className="relative flex flex-col items-center justify-center">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setIsMemoryModalOpen(true);
                  }}
                  className="flex flex-col items-center justify-center -mt-6 focus:outline-none group"
                  aria-label="Add recap"
                >
                  <span 
                    className="inline-flex h-14 w-14 items-center justify-center rounded-full text-white shadow-xl group-active:scale-95 transition-transform duration-200"
                    style={{ background: '#C4622D', boxShadow: '0 8px 24px rgba(196, 98, 45, 0.35)' }}
                  >
                    <Icon className="h-6 w-6" strokeWidth={2.2} />
                  </span>
                  <span className="mt-1 text-[10px] font-medium text-[#C4622D]">Recap</span>
                </button>
              </li>
            );
          }

          return (
            <li key={item.href} className="relative">
              <Link
                href={item.href}
                className="flex flex-col items-center justify-center py-1.5 transition-colors"
              >
                <Icon 
                  className={`h-5 w-5 ${isActive ? 'text-[#C4622D]' : 'text-[#B0A090]'}`} 
                  strokeWidth={isActive ? 2.5 : 1.8}
                />
                <span className={`mt-1 text-[10px] ${isActive ? 'text-[#C4622D] font-semibold' : 'text-[#B0A090]'}`}>
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}







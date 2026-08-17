'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Package, UserCircle, BarChart2, MoreHorizontal,
  Home, QrCode, Activity, User, Target
} from 'lucide-react';
import { cn } from '../../lib/utils';
import useAuthStore from '../../lib/authStore';

const adminBottomNav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/goals', label: 'Goals', icon: Target },
  { href: '/products', label: 'Inventory', icon: Package },
  { href: '/attendance', label: 'Attendance', icon: UserCircle },
  { href: '/notifications', label: 'More', icon: MoreHorizontal },
];

const workerBottomNav = [
  { href: '/worker', label: 'Home', icon: Home },
  { href: '/goals', label: 'Goals', icon: Target },
  { href: '/worker/scan', label: 'Scan', icon: QrCode },
  { href: '/attendance', label: 'Attendance', icon: UserCircle },
  { href: '/profile', label: 'Profile', icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuthStore();

  const items = user?.role === 'worker' ? workerBottomNav : adminBottomNav;

  return (
    <nav className="bottom-nav safe-area-pb">
      {items.map((item) => {
        const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn('bottom-nav-item', isActive && 'active')}
          >
            <item.icon
              className={cn('w-5 h-5 transition-all duration-150', isActive && 'text-brand-700 scale-110')}
            />
            <span className={cn(isActive ? 'text-brand-700 font-bold' : 'text-gray-400')}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

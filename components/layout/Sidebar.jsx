'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Package, QrCode, ArrowDownToLine, ArrowUpFromLine,
  ArrowLeftRight, Warehouse, Settings2, AlertTriangle, RotateCcw,
  ClipboardList, Users, Truck, UserCheck, BanknoteIcon, BarChart2,
  Bell, ShieldCheck, LogOut, Zap, ChevronRight, UserCircle, Receipt, Target
} from 'lucide-react';
import useAuthStore from '../../lib/authStore';
import { useRouter } from 'next/navigation';
import { cn } from '../../lib/utils';
import { useState, useEffect } from 'react';
import { goalsApi } from '../../lib/api';

const adminNavItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, section: 'main' },
  { href: '/goals', label: 'Timeline & Goals', icon: Target, section: 'main' },
  { href: '/products', label: 'Products', icon: Package, section: 'inventory' },
  { href: '/qr-codes', label: 'QR Codes', icon: QrCode, section: 'inventory' },
  { href: '/stock/incoming', label: 'Incoming', icon: ArrowDownToLine, section: 'inventory' },
  { href: '/stock/outgoing', label: 'Outgoing', icon: ArrowUpFromLine, section: 'inventory' },
  { href: '/stock/transfers', label: 'Transfers', icon: ArrowLeftRight, section: 'inventory' },
  { href: '/warehouses', label: 'Warehouses', icon: Warehouse, section: 'inventory' },
  { href: '/stock/adjustments', label: 'Adjustments', icon: Settings2, section: 'inventory' },
  { href: '/stock/damaged', label: 'Damaged Stock', icon: AlertTriangle, section: 'inventory' },
  { href: '/returns', label: 'Returns', icon: RotateCcw, section: 'inventory' },
  { href: '/audits', label: 'Audits', icon: ClipboardList, section: 'inventory' },
  { href: '/suppliers', label: 'Suppliers', icon: Truck, section: 'parties' },
  { href: '/customers', label: 'Customers', icon: UserCheck, section: 'parties' },
  { href: '/attendance', label: 'Attendance', icon: UserCircle, section: 'hr' },
  { href: '/salary', label: 'Salary Slips', icon: BanknoteIcon, section: 'hr' },
  { href: '/reports', label: 'Reports', icon: BarChart2, section: 'admin' },
  { href: '/users', label: 'Users & Roles', icon: ShieldCheck, section: 'admin' },
  { href: '/notifications', label: 'Notifications', icon: Bell, section: 'admin' },
];

const managerNavItems = adminNavItems.filter(
  (i) => !['users'].some((x) => i.href.includes(x))
);

const sectionLabels = {
  main: '',
  inventory: 'Inventory',
  parties: 'Parties',
  hr: 'HR',
  admin: 'Admin',
};

export default function Sidebar({ onClose }) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [urgentGoalsCount, setUrgentGoalsCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const checkAlerts = async () => {
      try {
        const res = await goalsApi.getAlerts();
        setUrgentGoalsCount(res.data.count || 0);
      } catch {}
    };
    checkAlerts();
    const interval = setInterval(checkAlerts, 20000);
    return () => clearInterval(interval);
  }, [user]);

  const navItems =
    user?.role === 'owner_admin' ? adminNavItems
    : user?.role === 'manager' ? managerNavItems
    : user?.role === 'accountant'
      ? adminNavItems.filter((i) => ['/dashboard', '/goals', '/reports', '/salary', '/suppliers', '/customers', '/notifications'].some(p => i.href === p))
    : user?.role === 'supervisor'
      ? adminNavItems.filter((i) => !['qr-codes', 'users'].some((x) => i.href.includes(x)))
    : adminNavItems.filter((i) => ['/dashboard', '/goals', '/attendance', '/salary', '/notifications'].some(p => i.href === p));

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  // Group by section
  const sections = {};
  navItems.forEach((item) => {
    if (!sections[item.section]) sections[item.section] = [];
    sections[item.section].push(item);
  });

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-100 w-64">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-100">
        <div className="w-9 h-9 rounded-xl bg-brand-700 flex items-center justify-center shrink-0">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
          <div className="font-bold text-sm text-gray-900 truncate">Deshmukh Electronics</div>
          <div className="text-xs text-gray-400">Warehouse App</div>
        </div>
        {onClose && (
          <button onClick={onClose} className="ml-auto btn-ghost btn-icon p-1 min-h-0">
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1 scrollbar-hide">
        {Object.entries(sections).map(([section, items]) => (
          <div key={section}>
            {sectionLabels[section] && (
              <div className="px-4 pt-4 pb-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                {sectionLabels[section]}
              </div>
            )}
            {items.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn('sidebar-link flex items-center justify-between', isActive && 'active')}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <item.icon className="link-icon shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.href === '/goals' && urgentGoalsCount > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full animate-pulse shrink-0">
                      {urgentGoalsCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User profile + logout */}
      <div className="border-t border-gray-100 p-3">
        <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
          <div className="w-9 h-9 rounded-xl bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-sm shrink-0">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-gray-900 truncate">{user?.name}</div>
            <div className="text-xs text-gray-400 truncate capitalize">{user?.designation || user?.role}</div>
          </div>
          <button
            onClick={handleLogout}
            className="btn-ghost btn-icon min-h-0 p-2 text-gray-400 hover:text-red-500"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

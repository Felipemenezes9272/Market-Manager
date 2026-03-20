import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  DollarSign, 
  Settings,
  ShieldCheck,
  Store
} from 'lucide-react';
import { cn } from '../utils';
import { User } from '../types';

interface MobileNavProps {
  user: User | null;
}

export default function MobileNav({ user }: MobileNavProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Início', icon: LayoutDashboard, path: '/' },
    { id: 'pos', label: 'PDV', icon: ShoppingCart, path: '/pos' },
    { id: 'products', label: 'Produtos', icon: Package, path: '/products' },
    { id: 'bills', label: 'Financeiro', icon: DollarSign, path: '/financial' },
    { id: 'settings', label: 'Ajustes', icon: Settings, path: '/settings' },
  ];

  const adminItems = [
    { id: 'tenants', label: 'Lojas', icon: Store, path: '/admin/tenants' },
    { id: 'users_admin', label: 'Usuários', icon: ShieldCheck, path: '/admin/users' },
    { id: 'settings_admin', label: 'Ajustes', icon: Settings, path: '/settings' },
  ];

  const displayItems = user?.is_super_admin ? adminItems : menuItems;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-2 py-2 flex items-center justify-around z-50 pb-safe">
      {displayItems.map((item) => (
        <NavLink
          key={item.id}
          to={item.path}
          className={({ isActive }) => cn(
            "flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all",
            isActive 
              ? (user?.is_super_admin ? "text-purple-600 bg-purple-50 dark:bg-purple-500/10" : "text-amber-600 bg-amber-50 dark:bg-amber-500/10")
              : "text-slate-500"
          )}
        >
          <item.icon size={20} />
          <span className="text-[10px] font-bold uppercase tracking-tighter">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

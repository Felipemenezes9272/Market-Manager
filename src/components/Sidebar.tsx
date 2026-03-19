import React from 'react';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  Truck, 
  FileText, 
  Settings, 
  LogOut, 
  History,
  AlertTriangle,
  DollarSign,
  ShieldCheck,
  Store
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '../utils';
import { User } from '../types';

interface SidebarProps {
  user: User | null;
  onLogout: () => void;
}

export default function Sidebar({ user, onLogout }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { id: 'pos', label: 'Venda (PDV)', icon: ShoppingCart, path: '/pos' },
    { id: 'products', label: 'Produtos', icon: Package, path: '/products' },
    { id: 'expiry', label: 'Validade', icon: AlertTriangle, path: '/expiry' },
    { id: 'sales_history', label: 'Vendas', icon: History, path: '/sales' },
    { id: 'customers', label: 'Clientes', icon: Users, path: '/customers' },
    { id: 'suppliers', label: 'Fornecedores', icon: Truck, path: '/suppliers' },
    { id: 'bills', label: 'Financeiro', icon: DollarSign, path: '/financial' },
    { id: 'reports', label: 'Relatórios', icon: FileText, path: '/reports' },
    { id: 'settings', label: 'Configurações', icon: Settings, path: '/settings' },
  ];

  const adminItems = [
    { id: 'tenants', label: 'Lojas (SaaS)', icon: Store, path: '/admin/tenants' },
    { id: 'users_admin', label: 'Usuários', icon: ShieldCheck, path: '/admin/users' },
    { id: 'settings_admin', label: 'Configurações', icon: Settings, path: '/settings' },
  ];

  const isAdminRoute = window.location.pathname.startsWith('/admin') || (user?.is_super_admin && window.location.pathname === '/settings');

  const displayItems = user?.is_super_admin ? adminItems : menuItems;

  return (
    <aside className="w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-screen sticky top-0">
      <div className="p-8 flex-1 overflow-y-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-all",
            user?.is_super_admin ? "bg-purple-600 shadow-purple-600/20" : "bg-amber-600 shadow-amber-600/20"
          )}>
            {user?.is_super_admin ? <ShieldCheck className="text-white" size={24} /> : <Store className="text-white" size={24} />}
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              {user?.is_super_admin ? 'ADMIN' : 'MARKET'}
            </h1>
            <p className={cn(
              "text-[10px] font-bold uppercase tracking-widest",
              user?.is_super_admin ? "text-purple-600" : "text-amber-600"
            )}>
              {user?.is_super_admin ? 'Painel SaaS' : 'Manager'}
            </p>
          </div>
        </div>

        <nav className="space-y-1">
          {displayItems.map((item) => (
            <NavLink
              key={item.id}
              to={item.path}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all group",
                isActive 
                  ? (user?.is_super_admin ? "bg-purple-50 dark:bg-purple-500/10 text-purple-600" : "bg-amber-50 dark:bg-amber-500/10 text-amber-600")
                  : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              {({ isActive }) => (
                <>
                  <item.icon size={20} className={cn(
                    "transition-transform group-hover:scale-110",
                    isActive 
                      ? (user?.is_super_admin ? "text-purple-600" : "text-amber-600")
                      : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"
                  )} />
                  <span className="text-sm">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="mt-auto p-8 border-t border-slate-100 dark:border-slate-800">
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all group"
        >
          <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm">Sair do Sistema</span>
        </button>
      </div>
    </aside>
  );
}

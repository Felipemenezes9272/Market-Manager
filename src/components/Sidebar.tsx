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
  ];

  return (
    <aside className="w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-screen sticky top-0">
      <div className="p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-amber-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-600/20">
            <Store className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">MARKET</h1>
            <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Manager</p>
          </div>
        </div>

        <nav className="space-y-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.id}
              to={item.path}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all group",
                isActive 
                  ? "bg-amber-50 dark:bg-amber-500/10 text-amber-600" 
                  : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              <item.icon size={20} className={cn(
                "transition-transform group-hover:scale-110",
                "text-slate-400 group-hover:text-amber-600"
              )} />
              <span className="text-sm">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {user?.is_super_admin && (
          <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 px-4">Administração</p>
            <nav className="space-y-1">
              {adminItems.map((item) => (
                <NavLink
                  key={item.id}
                  to={item.path}
                  className={({ isActive }) => cn(
                    "flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all group",
                    isActive 
                      ? "bg-purple-50 dark:bg-purple-500/10 text-purple-600" 
                      : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                  )}
                >
                  <item.icon size={20} className="text-slate-400 group-hover:text-purple-600" />
                  <span className="text-sm">{item.label}</span>
                </NavLink>
              ))}
            </nav>
          </div>
        )}
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

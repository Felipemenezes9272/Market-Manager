import React from 'react';
import { 
  Search, 
  Bell, 
  User as UserIcon, 
  ChevronDown,
  Sun,
  Moon,
  Monitor
} from 'lucide-react';
import { cn } from '../utils';
import { User } from '../types';

interface HeaderProps {
  user: User | null;
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

export default function Header({ user, theme, setTheme }: HeaderProps) {
  return (
    <header className="h-20 lg:h-24 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sm:px-8 lg:px-12 sticky top-0 z-40">
      <div className="flex-1 max-w-xl relative group hidden sm:block">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-600 transition-colors" size={20} />
        <input 
          type="text" 
          placeholder="Buscar..." 
          className="w-full pl-12 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl outline-none font-bold text-slate-700 dark:text-white focus:ring-2 ring-amber-500/20 transition-all"
        />
      </div>

      <div className="flex items-center gap-2 sm:gap-6 ml-auto sm:ml-0">
        <div className="flex items-center bg-slate-50 dark:bg-slate-800 p-1 rounded-xl border border-slate-100 dark:border-slate-700 scale-90 sm:scale-100">
          <button 
            onClick={() => setTheme('light')}
            className={cn("p-2 rounded-lg transition-all", theme === 'light' ? "bg-white dark:bg-slate-700 shadow-sm text-amber-600" : "text-slate-400")}
          >
            <Sun size={18} />
          </button>
          <button 
            onClick={() => setTheme('dark')}
            className={cn("p-2 rounded-lg transition-all", theme === 'dark' ? "bg-white dark:bg-slate-700 shadow-sm text-amber-600" : "text-slate-400")}
          >
            <Moon size={18} />
          </button>
          <button 
            onClick={() => setTheme('system')}
            className={cn("p-2 rounded-lg transition-all", theme === 'system' ? "bg-white dark:bg-slate-700 shadow-sm text-amber-600" : "text-slate-400")}
          >
            <Monitor size={18} />
          </button>
        </div>

        <button className="relative p-3 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-amber-600 rounded-2xl transition-all">
          <Bell size={20} />
          <span className="absolute top-3 right-3 w-2 h-2 bg-rose-500 rounded-full border-2 border-white dark:border-slate-800" />
        </button>

        <div className="flex items-center gap-4 pl-6 border-l border-slate-100 dark:border-slate-800">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{user?.name}</p>
            <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">{user?.role}</p>
          </div>
          <button className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 hover:text-amber-600 transition-all border border-slate-200 dark:border-slate-700">
            <UserIcon size={24} />
          </button>
        </div>
      </div>
    </header>
  );
}

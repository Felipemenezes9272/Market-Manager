import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { User } from '../types';

interface LayoutProps {
  user: User | null;
  onLogout: () => void;
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

export default function Layout({ user, onLogout, theme, setTheme }: LayoutProps) {
  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <Sidebar user={user} onLogout={onLogout} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header user={user} theme={theme} setTheme={setTheme} />
        <main className="flex-1 p-12 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

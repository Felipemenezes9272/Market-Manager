import React, { useState } from 'react';
import { 
  User as UserIcon, 
  Lock, 
  ArrowRight,
  Store,
  ShieldCheck
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../utils';

interface LoginProps {
  onLogin: (username: string, password: string) => Promise<void>;
  isLoading: boolean;
}

export default function Login({ onLogin, isLoading }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await onLogin(username, password);
    } catch (err: any) {
      setError(err.message || 'Falha na autenticação');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      {/* Immersive Supermarket Background - High Quality & Reliable */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: "url('https://images.unsplash.com/photo-1604719312566-8912e9227c6a?q=80&w=1920&auto=format&fit=crop')",
        }}
      >
        {/* Dark Overlay with subtle blur for depth */}
        <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-[2px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-[3rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] border border-white/20 dark:border-slate-800/50 overflow-hidden">
          <div className="p-12 text-center relative overflow-hidden">
            {/* Subtle pattern overlay */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none" />
            
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="w-40 h-40 flex items-center justify-center mx-auto mb-6 relative z-10"
            >
              {/* Vectorized Logo - Using a high-quality SVG for reliability */}
              <div className="w-full h-full flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#d97706" />
                      <stop offset="100%" stopColor="#b45309" />
                    </linearGradient>
                  </defs>
                  <path d="M20 30 L80 30 L75 70 L25 70 Z" fill="url(#logoGradient)" />
                  <path d="M35 30 L35 20 C35 15 40 10 50 10 C60 10 65 15 65 20 L65 30" fill="none" stroke="#d97706" strokeWidth="4" strokeLinecap="round" />
                  <rect x="30" y="40" width="40" height="4" rx="2" fill="white" opacity="0.3" />
                  <rect x="30" y="50" width="40" height="4" rx="2" fill="white" opacity="0.3" />
                  <rect x="30" y="60" width="40" height="4" rx="2" fill="white" opacity="0.3" />
                </svg>
              </div>
            </motion.div>
            
            <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter relative z-10">
              Market<span className="text-amber-600">Manager</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-bold mt-2 relative z-10 uppercase text-[10px] tracking-[0.3em]">
              Gestão Inteligente de Varejo
            </p>
          </div>

          <form onSubmit={handleSubmit} className="px-12 pb-12 space-y-6 relative z-10">
            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-rose-50 dark:bg-rose-500/10 text-rose-500 p-4 rounded-2xl text-sm font-bold border border-rose-100 dark:border-rose-500/20 flex items-center gap-3"
              >
                <ShieldCheck size={18} />
                {error}
              </motion.div>
            )}

            <div className="space-y-4">
              <div className="relative group">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-600 transition-colors" size={20} />
                <input 
                  type="text" 
                  placeholder="Usuário" 
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl outline-none font-bold text-slate-700 dark:text-white focus:ring-2 ring-amber-500/20 transition-all"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>

              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-600 transition-colors" size={20} />
                <input 
                  type="password" 
                  placeholder="Senha" 
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl outline-none font-bold text-slate-700 dark:text-white focus:ring-2 ring-amber-500/20 transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full py-5 bg-amber-600 text-white font-black rounded-2xl shadow-xl shadow-amber-600/20 hover:bg-amber-700 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:shadow-none"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  ACESSAR PAINEL
                  <ArrowRight size={20} />
                </>
              )}
            </button>

            <div className="text-center">
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Esqueceu sua senha? <span className="text-amber-600 cursor-pointer hover:underline">Recuperar</span></p>
            </div>
          </form>
        </div>
        
        <p className="text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-8">
          &copy; 2024 Market Manager. Todos os direitos reservados.
        </p>
      </motion.div>
    </div>
  );
}

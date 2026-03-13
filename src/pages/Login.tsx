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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-amber-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-600/10 blur-[120px] rounded-full" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="p-12 text-center bg-amber-600 relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
            <motion.div 
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center mx-auto mb-6 rotate-12 relative z-10"
            >
              <Store className="text-white" size={48} />
            </motion.div>
            <h1 className="text-3xl font-black text-white uppercase tracking-tight relative z-10">Market Manager</h1>
            <p className="text-amber-100 font-bold mt-2 relative z-10 uppercase text-[10px] tracking-[0.2em]">Sistema de Gestão Profissional</p>
          </div>

          <form onSubmit={handleSubmit} className="p-12 space-y-6">
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

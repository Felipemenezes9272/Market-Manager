import React from 'react';
import { 
  TrendingUp, 
  Package, 
  AlertTriangle, 
  DollarSign,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { cn } from '../utils';

interface DashboardProps {
  stats: any;
  dashboardConfig: any;
  aiInsights: string;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  cashSession: any;
  onOpenCash: (val: number) => Promise<void>;
  onCloseCash: (id: number, val: number) => Promise<void>;
}

export default function DashboardView({ 
  stats, 
  dashboardConfig, 
  aiInsights, 
  onAnalyze, 
  isAnalyzing,
  cashSession,
  onOpenCash,
  onCloseCash
}: DashboardProps) {
  const [showOpenModal, setShowOpenModal] = React.useState(false);
  const [showCloseModal, setShowCloseModal] = React.useState(false);
  const [cashValue, setCashValue] = React.useState('0');

  const statCards = [
    { 
      id: 'showSalesToday', 
      label: 'Vendas Hoje', 
      value: `R$ ${(stats?.todayRevenue || 0).toFixed(2)}`, 
      icon: DollarSign, 
      color: 'bg-emerald-500', 
      trend: '+12.5%' 
    },
    { 
      id: 'showProfitToday', 
      label: 'Lucro Hoje', 
      value: `R$ ${(stats?.todayProfit || 0).toFixed(2)}`, 
      icon: TrendingUp, 
      color: 'bg-emerald-600', 
      trend: 'margem bruta' 
    },
    { 
      id: 'showPendingBills', 
      label: 'Contas a Pagar', 
      value: `R$ ${(stats?.totalPendingBills || 0).toFixed(2)}`, 
      icon: TrendingUp, 
      color: 'bg-rose-500', 
      trend: 'pendentes' 
    },
    { 
      id: 'showLowStock', 
      label: 'Estoque Baixo', 
      value: `${stats?.lowStockCount || 0} itens`, 
      icon: Package, 
      color: 'bg-amber-500', 
      trend: 'Reposição necessária' 
    },
    { 
      id: 'showExpiryAlerts', 
      label: 'Vencimento Próximo', 
      value: `${stats?.expiryAlertsCount || 0} lotes`, 
      icon: AlertTriangle, 
      color: 'bg-orange-500', 
      trend: 'Próximos 30 dias' 
    },
  ];

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Olá, Bem-vindo de volta!</h2>
          <p className="text-slate-500 font-medium mt-1">Aqui está o que está acontecendo no seu mercado hoje.</p>
        </div>
        <button 
          onClick={onAnalyze}
          disabled={isAnalyzing}
          className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-4 rounded-2xl font-black flex items-center gap-3 shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50"
        >
          <Sparkles size={20} className={cn(isAnalyzing && "animate-pulse")} />
          {isAnalyzing ? 'ANALISANDO...' : 'INSIGHTS IA'}
        </button>
      </div>

      {/* Cash Session Status */}
      <div className={cn(
        "p-8 rounded-[2.5rem] border flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm",
        cashSession ? "bg-emerald-50 border-emerald-100 dark:bg-emerald-500/5 dark:border-emerald-500/20" : "bg-rose-50 border-rose-100 dark:bg-rose-500/5 dark:border-rose-500/20"
      )}>
        <div className="flex items-center gap-6 text-center md:text-left">
          <div className={cn(
            "w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg",
            cashSession ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
          )}>
            <DollarSign size={32} />
          </div>
          <div>
            <h3 className={cn("text-xl font-black uppercase tracking-tight", cashSession ? "text-emerald-900 dark:text-emerald-400" : "text-rose-900 dark:text-rose-400")}>
              Status do Caixa: {cashSession ? 'ABERTO' : 'FECHADO'}
            </h3>
            <p className={cn("font-bold text-sm", cashSession ? "text-emerald-600/70" : "text-rose-600/70")}>
              {cashSession ? `Aberto desde ${new Date(cashSession.opened_at).toLocaleTimeString()}` : 'Abra o caixa para começar a vender'}
            </p>
          </div>
        </div>
        <button 
          onClick={() => cashSession ? setShowCloseModal(true) : setShowOpenModal(true)}
          className={cn(
            "px-10 py-4 rounded-2xl font-black shadow-xl transition-all hover:scale-105",
            cashSession ? "bg-rose-600 text-white shadow-rose-600/20" : "bg-emerald-600 text-white shadow-emerald-600/20"
          )}
        >
          {cashSession ? 'FECHAR CAIXA' : 'ABRIR CAIXA'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {statCards.filter(card => dashboardConfig[card.id]).map((card, i) => (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all group"
          >
            <div className="flex justify-between items-start mb-6">
              <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg", card.color)}>
                <card.icon size={28} />
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{card.trend}</span>
            </div>
            <h3 className="text-slate-500 font-bold text-sm uppercase tracking-widest mb-1">{card.label}</h3>
            <p className="text-3xl font-black text-slate-900 dark:text-white">{card.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-10">
            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Desempenho de Vendas</h3>
            <select className="bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-2 text-xs font-bold outline-none">
              <option>Últimos 7 dias</option>
              <option>Últimos 30 dias</option>
            </select>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.salesTrend || []}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d97706" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#d97706" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600, fill: '#94a3b8' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600, fill: '#94a3b8' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontWeight: 800, color: '#d97706' }}
                />
                <Area type="monotone" dataKey="sales" stroke="#d97706" strokeWidth={4} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-8">Top Produtos</h3>
          <div className="space-y-6">
            {(stats?.topProducts || []).map((product: any, i: number) => (
              <div key={i} className="flex items-center gap-4 group cursor-pointer">
                <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center font-black text-slate-400 group-hover:bg-amber-500 group-hover:text-white transition-all">
                  0{i + 1}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-900 dark:text-white group-hover:text-amber-600 transition-colors">{product.name}</p>
                  <p className="text-xs text-slate-400 font-bold uppercase">{product.total_sold} unidades vendidas</p>
                </div>
                <ChevronRight size={16} className="text-slate-300" />
              </div>
            ))}
          </div>
          <button className="w-full mt-10 py-4 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-black rounded-2xl hover:bg-slate-100 transition-all uppercase text-xs tracking-widest">
            Ver Relatório Completo
          </button>
        </div>
      </div>

      {aiInsights && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-slate-900 text-white p-12 rounded-[3.5rem] shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 blur-[100px] rounded-full -mr-32 -mt-32 blur-3xl" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Sparkles size={24} className="text-slate-900" />
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tight">Análise Estratégica IA</h3>
            </div>
            <div className="prose prose-invert max-w-none">
              <p className="text-lg leading-relaxed text-slate-300 font-medium whitespace-pre-wrap">
                {aiInsights}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Modals */}
      {showOpenModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] shadow-2xl max-w-md w-full">
            <h3 className="text-2xl font-black mb-6">Abrir Caixa</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Fundo de Caixa Inicial</label>
                <input 
                  type="number" 
                  value={cashValue}
                  onChange={(e) => setCashValue(e.target.value)}
                  className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none font-bold focus:ring-2 ring-emerald-500/20" 
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button onClick={() => setShowOpenModal(false)} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-white font-black rounded-2xl">CANCELAR</button>
                <button onClick={async () => { await onOpenCash(Number(cashValue)); setShowOpenModal(false); }} className="flex-1 py-4 bg-emerald-600 text-white font-black rounded-2xl shadow-xl shadow-emerald-600/20">ABRIR CAIXA</button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {showCloseModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] shadow-2xl max-w-md w-full">
            <h3 className="text-2xl font-black mb-6">Fechar Caixa</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Valor Final em Dinheiro</label>
                <input 
                  type="number" 
                  value={cashValue}
                  onChange={(e) => setCashValue(e.target.value)}
                  className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none font-bold focus:ring-2 ring-rose-500/20" 
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button onClick={() => setShowCloseModal(false)} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-white font-black rounded-2xl">CANCELAR</button>
                <button onClick={async () => { await onCloseCash(cashSession.id, Number(cashValue)); setShowCloseModal(false); }} className="flex-1 py-4 bg-rose-600 text-white font-black rounded-2xl shadow-xl shadow-rose-600/20">FECHAR CAIXA</button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

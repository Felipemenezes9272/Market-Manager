import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Calendar, 
  Filter, 
  ChevronRight, 
  TrendingUp, 
  TrendingDown, 
  Package, 
  Users, 
  Truck, 
  DollarSign,
  PieChart,
  BarChart,
  ArrowRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { cn } from '../utils';

interface ReportsProps {
  sales: any[];
  products: any[];
  customers: any[];
  bills: any[];
}

export default function Reports({ sales, products, customers, bills }: ReportsProps) {
  const [dateRange, setDateRange] = useState('month');

  const reportTypes = [
    {
      id: 'sales',
      title: 'Relatório de Vendas',
      description: 'Análise detalhada de faturamento, ticket médio e produtos mais vendidos.',
      icon: DollarSign,
      color: 'bg-emerald-100 text-emerald-600',
      stats: 'R$ ' + sales.reduce((sum, s) => sum + Number(s.total_amount), 0).toFixed(2)
    },
    {
      id: 'inventory',
      title: 'Relatório de Estoque',
      description: 'Posição atual de estoque, produtos com giro baixo e necessidade de reposição.',
      icon: Package,
      color: 'bg-amber-100 text-amber-600',
      stats: products.length + ' itens ativos'
    },
    {
      id: 'customers',
      title: 'Relatório de Clientes',
      description: 'Ranking de melhores clientes, frequência de compra e análise de fidelidade.',
      icon: Users,
      color: 'bg-indigo-100 text-indigo-600',
      stats: customers.length + ' cadastrados'
    },
    {
      id: 'financial',
      title: 'Relatório Financeiro',
      description: 'Fluxo de caixa, contas pagas vs pendentes e análise de despesas.',
      icon: FileText,
      color: 'bg-rose-100 text-rose-600',
      stats: bills.length + ' lançamentos'
    }
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Centro de Relatórios</h2>
          <p className="text-slate-500 font-medium mt-1">Gere insights e documentos para tomada de decisão.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 flex gap-1">
            {['week', 'month', 'year'].map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-black uppercase transition-all",
                  dateRange === range 
                    ? "bg-amber-600 text-white shadow-lg shadow-amber-600/20" 
                    : "text-slate-400 hover:text-slate-600"
                )}
              >
                {range === 'week' ? 'Semana' : range === 'month' ? 'Mês' : 'Ano'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {reportTypes.map((report, idx) => (
          <motion.div
            key={report.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all group"
          >
            <div className="flex items-start justify-between mb-8">
              <div className={cn("p-4 rounded-[1.5rem]", report.color)}>
                <report.icon size={32} />
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Resumo Atual</p>
                <p className="text-xl font-black text-slate-900 dark:text-white">{report.stats}</p>
              </div>
            </div>

            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">{report.title}</h3>
            <p className="text-slate-500 font-medium mb-8 leading-relaxed">{report.description}</p>

            <div className="flex flex-col sm:flex-row gap-4">
              <button className="flex-1 bg-amber-600 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 shadow-lg shadow-amber-600/20 hover:bg-amber-700 transition-all">
                <Download size={18} /> GERAR PDF
              </button>
              <button className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-slate-200 transition-all">
                <BarChart size={18} /> VER DETALHES
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-amber-600 rounded-[3rem] p-12 text-white relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="max-w-xl">
            <h3 className="text-4xl font-black mb-4">Análise de IA Personalizada</h3>
            <p className="text-amber-100 text-lg font-medium">
              Nossa inteligência artificial analisa seus dados em tempo real para sugerir estratégias de precificação, reposição de estoque e promoções.
            </p>
          </div>
          <button className="bg-white text-amber-600 px-10 py-5 rounded-2xl font-black text-lg shadow-2xl hover:scale-105 transition-all flex items-center gap-3">
            SOLICITAR INSIGHTS <ArrowRight size={24} />
          </button>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-400/20 rounded-full -ml-24 -mb-24 blur-2xl" />
      </div>
    </div>
  );
}

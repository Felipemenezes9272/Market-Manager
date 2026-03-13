import React, { useState } from 'react';
import { 
  BarChart3, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  TrendingDown, 
  TrendingUp,
  History,
  X,
  ChevronRight,
  ReceiptText,
  Repeat,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { cn } from '../utils';

interface FinancialProps {
  bills: any[];
  suppliers: any[];
  onAddBill: (data: any) => Promise<void>;
  onPayBill: (id: number) => Promise<void>;
  onDeleteBill: (id: number) => Promise<void>;
  addToast: (msg: string, type?: any) => void;
}

export default function Financial({ 
  bills, 
  suppliers, 
  onAddBill, 
  onPayBill, 
  onDeleteBill,
  addToast
}: FinancialProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [showModal, setShowModal] = useState(false);

  const filteredBills = bills.filter(b => {
    const matchesSearch = b.description.toLowerCase().includes(search.toLowerCase()) || b.supplier_name?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'Todos' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPending = bills
    .filter(b => b.status === 'Pendente')
    .reduce((sum, b) => sum + Number(b.amount), 0);

  const totalPaid = bills
    .filter(b => b.status === 'Pago')
    .reduce((sum, b) => sum + Number(b.amount), 0);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    
    try {
      await onAddBill(data);
      addToast("Conta cadastrada com sucesso!", "success");
      setShowModal(false);
    } catch (err) {
      addToast("Erro ao salvar conta", "error");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Gestão Financeira</h2>
          <p className="text-slate-500 font-medium mt-1">Controle suas contas a pagar, pagas e recorrentes.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-amber-600 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 shadow-xl shadow-amber-600/20 hover:shadow-2xl hover:scale-[1.02] transition-all"
        >
          <Plus size={24} /> NOVA CONTA
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-rose-100 dark:bg-rose-500/10 text-rose-600 rounded-2xl">
              <TrendingDown size={24} />
            </div>
            <h3 className="text-slate-500 dark:text-slate-400 font-bold text-sm uppercase tracking-widest">Total Pendente</h3>
          </div>
          <p className="text-3xl font-black text-rose-600">R$ {totalPending.toFixed(2)}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 rounded-2xl">
              <TrendingUp size={24} />
            </div>
            <h3 className="text-slate-500 dark:text-slate-400 font-bold text-sm uppercase tracking-widest">Total Pago</h3>
          </div>
          <p className="text-3xl font-black text-emerald-600">R$ {totalPaid.toFixed(2)}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-amber-100 dark:bg-amber-500/10 text-amber-600 rounded-2xl">
              <BarChart3 size={24} />
            </div>
            <h3 className="text-slate-500 dark:text-slate-400 font-bold text-sm uppercase tracking-widest">Fluxo Mensal</h3>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white">R$ {(totalPending + totalPaid).toFixed(2)}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Buscar por descrição ou fornecedor..." 
            className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl outline-none font-bold text-slate-700 dark:text-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-4">
          <select 
            className="px-6 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl outline-none font-bold text-slate-700 dark:text-white appearance-none"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="Todos">Todos Status</option>
            <option value="Pendente">Pendentes</option>
            <option value="Pago">Pagos</option>
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50">
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Descrição</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fornecedor</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Vencimento</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredBills.map(bill => (
                <tr key={bill.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-2 rounded-lg",
                        bill.is_recurring ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-400"
                      )}>
                        {bill.is_recurring ? <Repeat size={16} /> : <ReceiptText size={16} />}
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white">{bill.description}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="font-medium text-slate-500 dark:text-slate-400">{bill.supplier_name || 'N/A'}</span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium">
                      <Calendar size={14} />
                      {format(new Date(bill.due_date), 'dd/MM/yyyy')}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="font-black text-slate-900 dark:text-white">R$ {Number(bill.amount).toFixed(2)}</span>
                  </td>
                  <td className="px-8 py-6">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                      bill.status === 'Pago' ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
                    )}>
                      {bill.status}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {bill.status === 'Pendente' && (
                        <button 
                          onClick={() => onPayBill(bill.id)}
                          className="p-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
                        >
                          <CheckCircle2 size={18} />
                        </button>
                      )}
                      <button 
                        onClick={() => onDeleteBill(bill.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white dark:bg-slate-900 rounded-[3rem] max-w-lg w-full shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">Nova Conta a Pagar</h3>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                  <X size={24} />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Descrição</label>
                  <input name="description" required className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none font-bold focus:ring-2 ring-amber-500/20" />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Valor</label>
                    <input name="amount" type="number" step="0.01" required className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none font-bold focus:ring-2 ring-amber-500/20" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Vencimento</label>
                    <input name="due_date" type="date" required className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none font-bold focus:ring-2 ring-amber-500/20" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Categoria</label>
                    <input name="category" required className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none font-bold focus:ring-2 ring-amber-500/20" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Fornecedor</label>
                    <select name="supplier_id" className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none font-bold focus:ring-2 ring-amber-500/20">
                      <option value="">Nenhum</option>
                      {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                  <input type="checkbox" name="is_recurring" id="recurring" className="w-5 h-5 rounded border-slate-300 text-amber-600 focus:ring-amber-500" />
                  <label htmlFor="recurring" className="text-sm font-bold text-slate-700 dark:text-slate-200">Conta Recorrente (Mensal)</label>
                </div>
                
                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-white font-black rounded-2xl hover:bg-slate-200 transition-all">
                    CANCELAR
                  </button>
                  <button type="submit" className="flex-1 py-4 bg-amber-600 text-white font-black rounded-2xl shadow-xl shadow-amber-600/20 hover:bg-amber-700 transition-all">
                    SALVAR CONTA
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

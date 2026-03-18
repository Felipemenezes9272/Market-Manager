import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  CreditCard, 
  ChevronRight, 
  Download,
  Eye,
  X,
  Receipt
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { cn } from '../utils';
import { apiFetch } from '../api';

interface SalesProps {
  sales: any[];
  addToast: (msg: string, type?: any) => void;
}

export default function Sales({ sales, addToast }: SalesProps) {
  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('Todos');
  const [selectedSale, setSelectedSale] = useState<any>(null);

  const handleSelectSale = async (sale: any) => {
    setSelectedSale(sale);
    try {
      const fullSale = await apiFetch(`/api/sales/${sale.id}`);
      setSelectedSale(fullSale);
    } catch (err) {
      console.error("Error fetching full sale details:", err);
      addToast("Erro ao carregar itens da venda", "error");
    }
  };

  const formatPaymentMethod = (method: any) => {
    if (!method) return '-';
    
    // Handle array directly
    if (Array.isArray(method)) {
      const methods = method.map((p: any) => p.method || p).filter(Boolean);
      return [...new Set(methods)].join(' / ');
    }
    
    // Handle string (could be JSON or plain text)
    if (typeof method === 'string') {
      if (method.startsWith('[') || method.startsWith('{')) {
        try {
          const parsed = JSON.parse(method);
          if (Array.isArray(parsed)) {
            const methods = parsed.map((p: any) => p.method || p).filter(Boolean);
            return [...new Set(methods)].join(' / ');
          }
          if (typeof parsed === 'object' && parsed !== null) {
            return parsed.method || JSON.stringify(parsed);
          }
        } catch (e) {
          return method;
        }
      }
      return method;
    }
    
    return String(method);
  };

  const generateReport = () => {
    try {
      const headers = ['ID', 'Data', 'Horário', 'Cliente', 'Total', 'Pagamento'];
      const rows = filteredSales.map(s => {
        const date = new Date(s.created_at);
        return [
          `#${s.id}`,
          format(date, 'dd/MM/yyyy'),
          format(date, 'HH:mm:ss'),
          s.customer_name || 'Consumidor Final',
          `R$ ${Number(s.total_amount).toFixed(2)}`,
          formatPaymentMethod(s.payment_method)
        ];
      });

      const csvContent = [
        headers.join(','),
        ...rows.map(r => r.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `relatorio_vendas_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      addToast("Relatório gerado com sucesso!", "success");
    } catch (err) {
      addToast("Erro ao gerar relatório", "error");
    }
  };

  const filteredSales = sales.filter(s => {
    const matchesSearch = s.id.toString().includes(search) || s.customer_name?.toLowerCase().includes(search.toLowerCase());
    const matchesPayment = paymentFilter === 'Todos' || s.payment_method === paymentFilter;
    return matchesSearch && matchesPayment;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Histórico de Vendas</h2>
          <p className="text-slate-500 font-medium mt-1">Visualize e gerencie todas as transações realizadas.</p>
        </div>
        <button 
          onClick={generateReport}
          className="bg-white dark:bg-slate-900 text-slate-700 dark:text-white px-8 py-4 rounded-2xl font-black border border-slate-200 dark:border-slate-800 flex items-center gap-3 hover:bg-slate-50 transition-all"
        >
          <Download size={20} /> RELATÓRIO DE VENDAS
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Buscar por ID da venda ou cliente..." 
            className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl outline-none font-bold text-slate-700 dark:text-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-4">
          <select 
            className="px-6 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl outline-none font-bold text-slate-700 dark:text-white appearance-none"
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
          >
            <option value="Todos">Todos Pagamentos</option>
            <option value="Dinheiro">Dinheiro</option>
            <option value="Cartão de Crédito">Cartão de Crédito</option>
            <option value="Cartão de Débito">Cartão de Débito</option>
            <option value="PIX">PIX</option>
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50">
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">ID / Data</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Itens</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Pagamento</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredSales.map(sale => (
                <tr key={sale.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="font-black text-slate-900 dark:text-white">#{sale.id}</span>
                      <span className="text-xs font-bold text-slate-400">{format(new Date(sale.created_at), 'dd/MM/yy HH:mm')}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-bold">
                      <User size={16} className="text-amber-600" />
                      {sale.customer_name || 'Consumidor Final'}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="font-bold text-slate-500 dark:text-slate-400">{sale.items?.length || 0} produtos</span>
                  </td>
                  <td className="px-8 py-6">
                    <span className="font-black text-amber-600">R$ {Number(sale.total_amount).toFixed(2)}</span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium">
                      <CreditCard size={14} />
                      {formatPaymentMethod(sale.payment_method)}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <button 
                      onClick={() => handleSelectSale(sale)}
                      className="p-2 text-slate-400 hover:text-amber-600 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Eye size={20} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {selectedSale && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white dark:bg-slate-900 rounded-[3rem] max-w-2xl w-full shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white">Detalhes da Venda #{selectedSale.id}</h3>
                  <p className="text-slate-500 font-bold">{format(new Date(selectedSale.created_at), 'dd/MM/yyyy HH:mm')}</p>
                </div>
                <button onClick={() => setSelectedSale(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-8 space-y-8">
                <div className="grid grid-cols-2 gap-8">
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Cliente</p>
                    <p className="font-black text-slate-900 dark:text-white">{selectedSale.customer_name || 'Consumidor Final'}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Pagamento</p>
                    <p className="font-black text-slate-900 dark:text-white">{formatPaymentMethod(selectedSale.payment_method)}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest">Itens da Venda</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                    {selectedSale.items?.map((item: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{item.product_name}</p>
                          <p className="text-xs font-bold text-slate-400">{item.quantity}x R$ {Number(item.unit_price).toFixed(2)}</p>
                        </div>
                        <p className="font-black text-slate-900 dark:text-white">R$ {(item.quantity * item.unit_price).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-8 border-t border-slate-100 dark:divide-slate-800 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total da Venda</p>
                    <p className="text-4xl font-black text-amber-600">R$ {Number(selectedSale.total_amount).toFixed(2)}</p>
                  </div>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => {
                        const event = new CustomEvent('edit-sale', { detail: selectedSale });
                        window.dispatchEvent(event);
                        setSelectedSale(null);
                      }}
                      className="flex-1 bg-amber-600 text-white px-8 py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-amber-700 transition-all"
                    >
                      <Receipt size={20} /> EDITAR VENDA
                    </button>
                    <button 
                      onClick={() => {
                        const event = new CustomEvent('print-receipt', { detail: selectedSale });
                        window.dispatchEvent(event);
                        addToast("Enviando para impressão...", "success");
                      }}
                      className="flex-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:scale-105 transition-all"
                    >
                      <Receipt size={20} /> REIMPRIMIR CUPOM
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

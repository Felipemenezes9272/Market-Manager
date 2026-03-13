import React, { useState } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit3, 
  Trash2, 
  AlertTriangle,
  Barcode,
  Image as ImageIcon,
  ChevronRight,
  TrendingUp,
  History,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils';

interface ProductsProps {
  products: any[];
  suppliers: any[];
  onAddProduct: (data: any) => Promise<void>;
  onUpdateProduct: (id: number, data: any) => Promise<void>;
  onDeleteProduct: (id: number) => Promise<void>;
  addToast: (msg: string, type?: any) => void;
}

export default function Products({ 
  products, 
  suppliers, 
  onAddProduct, 
  onUpdateProduct, 
  onDeleteProduct,
  addToast
}: ProductsProps) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Todos');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  const categories = ['Todos', ...Array.from(new Set(products.map(p => p.category)))];

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.barcode?.includes(search);
    const matchesCategory = categoryFilter === 'Todos' || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    
    try {
      if (editingProduct) {
        await onUpdateProduct(editingProduct.id, data);
        addToast("Produto atualizado com sucesso!", "success");
      } else {
        await onAddProduct(data);
        addToast("Produto cadastrado com sucesso!", "success");
      }
      setShowModal(false);
      setEditingProduct(null);
    } catch (err) {
      addToast("Erro ao salvar produto", "error");
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Gestão de Estoque</h2>
          <p className="text-slate-500 font-medium mt-1">Gerencie seus produtos, preços e níveis de estoque.</p>
        </div>
        <button 
          onClick={() => { setEditingProduct(null); setShowModal(true); }}
          className="bg-amber-600 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 shadow-xl shadow-amber-600/20 hover:shadow-2xl hover:scale-[1.02] transition-all"
        >
          <Plus size={24} /> NOVO PRODUTO
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Buscar por nome, código de barras..." 
            className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl outline-none font-bold text-slate-700 dark:text-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <select 
              className="pl-12 pr-8 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl outline-none font-bold text-slate-700 dark:text-white appearance-none"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
        {filteredProducts.map(product => (
          <motion.div
            key={product.id}
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all group overflow-hidden"
          >
            <div className="aspect-[4/3] bg-slate-100 dark:bg-slate-800 relative overflow-hidden">
              {product.image_url ? (
                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package size={64} className="text-slate-300 dark:text-slate-700" />
                </div>
              )}
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => { setEditingProduct(product); setShowModal(true); }}
                  className="p-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-xl text-amber-600 shadow-lg hover:scale-110 transition-transform"
                >
                  <Edit3 size={18} />
                </button>
                <button 
                  onClick={() => onDeleteProduct(product.id)}
                  className="p-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-xl text-rose-600 shadow-lg hover:scale-110 transition-transform"
                >
                  <Trash2 size={18} />
                </button>
              </div>
              {product.stock_quantity <= product.min_stock_level && (
                <div className="absolute top-4 left-4 bg-rose-500 text-white px-3 py-1 rounded-lg text-[10px] font-black flex items-center gap-1">
                  <AlertTriangle size={12} /> ESTOQUE BAIXO
                </div>
              )}
            </div>
            
            <div className="p-6">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">{product.category}</span>
                  <h4 className="text-lg font-black text-slate-900 dark:text-white line-clamp-1">{product.name}</h4>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Preço Venda</p>
                  <p className="text-lg font-black text-amber-600">R$ {product.price.toFixed(2)}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Estoque</p>
                  <p className={cn(
                    "text-lg font-black",
                    product.stock_quantity <= product.min_stock_level ? "text-rose-600" : "text-emerald-600"
                  )}>
                    {product.stock_quantity} <span className="text-xs">un</span>
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-400">
                  <Barcode size={14} />
                  <span className="text-xs font-bold">{product.barcode || 'Sem código'}</span>
                </div>
                <button className="text-slate-400 hover:text-amber-600 transition-colors">
                  <History size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Product Modal */}
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
              className="bg-white dark:bg-slate-900 rounded-[3rem] max-w-2xl w-full shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                  {editingProduct ? 'Editar Produto' : 'Novo Produto'}
                </h3>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                  <X size={24} />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Nome do Produto</label>
                    <input name="name" defaultValue={editingProduct?.name} required className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none font-bold focus:ring-2 ring-amber-500/20" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Código de Barras</label>
                    <input name="barcode" defaultValue={editingProduct?.barcode} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none font-bold focus:ring-2 ring-amber-500/20" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Categoria</label>
                    <input name="category" defaultValue={editingProduct?.category} required className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none font-bold focus:ring-2 ring-amber-500/20" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Fornecedor</label>
                    <select name="supplier_id" defaultValue={editingProduct?.supplier_id} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none font-bold focus:ring-2 ring-amber-500/20">
                      <option value="">Selecione um fornecedor</option>
                      {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Preço de Custo</label>
                    <input name="cost_price" type="number" step="0.01" defaultValue={editingProduct?.cost_price} required className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none font-bold focus:ring-2 ring-amber-500/20" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Preço de Venda</label>
                    <input name="price" type="number" step="0.01" defaultValue={editingProduct?.price} required className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none font-bold focus:ring-2 ring-amber-500/20" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Estoque Inicial</label>
                    <input name="stock_quantity" type="number" defaultValue={editingProduct?.stock_quantity || 0} required className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none font-bold focus:ring-2 ring-amber-500/20" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Estoque Mínimo</label>
                    <input name="min_stock_level" type="number" defaultValue={editingProduct?.min_stock_level || 5} required className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none font-bold focus:ring-2 ring-amber-500/20" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">URL da Imagem</label>
                  <input name="image_url" defaultValue={editingProduct?.image_url} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none font-bold focus:ring-2 ring-amber-500/20" placeholder="https://exemplo.com/imagem.jpg" />
                </div>
                
                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-white font-black rounded-2xl hover:bg-slate-200 transition-all">
                    CANCELAR
                  </button>
                  <button type="submit" className="flex-1 py-4 bg-amber-600 text-white font-black rounded-2xl shadow-xl shadow-amber-600/20 hover:bg-amber-700 transition-all">
                    SALVAR PRODUTO
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

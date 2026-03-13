import React, { useState, useEffect, useRef } from 'react';
import { 
  ShoppingCart, 
  Search, 
  Trash2, 
  Plus, 
  Minus, 
  CreditCard, 
  Banknote, 
  QrCode, 
  User as UserIcon,
  Barcode,
  Camera,
  X,
  CheckCircle2,
  Printer,
  MessageCircle,
  Package
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils';
import { Product, Customer, CashSession } from '../types';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface POSProps {
  products: Product[];
  customers: Customer[];
  cashSession: CashSession | null;
  onCheckout: (paymentMethod: string, cart: any[], customerId: number | null, discount: number) => Promise<void>;
  addToast: (msg: string, type?: any) => void;
}

export default function POS({ products, customers, cashSession, onCheckout, addToast }: POSProps) {
  const [cart, setCart] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [discount, setDiscount] = useState(0);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.barcode?.includes(search)
  );

  const addToCart = (product: Product) => {
    if (product.stock_quantity <= 0) {
      addToast("Produto sem estoque!", "warning");
      return;
    }
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const finalTotal = Math.max(0, subtotal - discount);

  const handleCheckout = async (paymentMethod: string) => {
    try {
      await onCheckout(paymentMethod, cart, selectedCustomer?.id || null, discount);
      setCart([]);
      setSelectedCustomer(null);
      setDiscount(0);
      setIsCheckoutOpen(false);
    } catch (err) {
      // Error handled by parent
    }
  };

  useEffect(() => {
    if (isScannerOpen) {
      scannerRef.current = new Html5QrcodeScanner("reader", { fps: 10, qrbox: 250 }, false);
      scannerRef.current.render((decodedText) => {
        const product = products.find(p => p.barcode === decodedText);
        if (product) {
          addToCart(product);
          addToast(`${product.name} adicionado!`, "success");
          setIsScannerOpen(false);
        } else {
          addToast("Produto não encontrado!", "error");
        }
      }, (err) => {});
    } else {
      if (scannerRef.current) {
        scannerRef.current.clear();
      }
    }
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear();
      }
    };
  }, [isScannerOpen, products]);

  if (!cashSession) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
        <div className="w-24 h-24 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center">
          <Banknote size={48} />
        </div>
        <div>
          <h2 className="text-3xl font-black text-slate-900">Caixa Fechado</h2>
          <p className="text-slate-500 max-w-md mx-auto mt-2">Você precisa abrir o caixa para realizar vendas. Vá para o Dashboard ou clique no botão abaixo.</p>
        </div>
        <button className="px-8 py-4 bg-amber-600 text-white font-black rounded-2xl shadow-xl hover:scale-105 transition-all">
          ABRIR CAIXA AGORA
        </button>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-12rem)] flex gap-8">
      {/* Products Section */}
      <div className="flex-1 flex flex-col gap-6 min-w-0">
        <div className="flex gap-4">
          <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-600 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Buscar por nome ou código de barras..." 
              className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none font-bold text-slate-700 dark:text-white focus:ring-2 ring-amber-500/20 transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setIsScannerOpen(true)}
            className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 hover:text-amber-600 hover:border-amber-500 transition-all shadow-sm"
          >
            <Camera size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map(product => (
              <motion.button
                key={product.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => addToCart(product)}
                className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all text-left flex flex-col h-full group"
              >
                <div className="aspect-square bg-slate-50 dark:bg-slate-800 rounded-2xl mb-4 overflow-hidden relative">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <Package size={32} />
                    </div>
                  )}
                  {product.stock_quantity <= 5 && (
                    <div className="absolute top-2 right-2 bg-rose-500 text-white px-2 py-0.5 rounded-lg text-[8px] font-black">
                      {product.stock_quantity} UN
                    </div>
                  )}
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm line-clamp-2 mb-2">{product.name}</h4>
                <div className="mt-auto flex items-center justify-between">
                  <span className="text-lg font-black text-amber-600">R$ {product.price.toFixed(2)}</span>
                  <div className="w-8 h-8 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-400 group-hover:bg-amber-500 group-hover:text-white transition-all">
                    <Plus size={16} />
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Cart Section */}
      <div className="w-96 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-xl font-black flex items-center gap-2">
            <ShoppingCart size={24} className="text-amber-600" />
            Carrinho
          </h3>
          <span className="bg-amber-100 text-amber-600 px-3 py-1 rounded-full text-xs font-black">
            {cart.reduce((s, i) => s + i.quantity, 0)} ITENS
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 space-y-4">
              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center">
                <ShoppingCart size={32} />
              </div>
              <p className="font-bold text-sm uppercase tracking-widest">Carrinho Vazio</p>
            </div>
          ) : (
            cart.map(item => (
              <motion.div 
                key={item.id}
                layout
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-4 group"
              >
                <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-xl flex-shrink-0 overflow-hidden">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <Package size={20} />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-slate-900 dark:text-white truncate">{item.name}</p>
                  <p className="text-xs font-black text-amber-600">R$ {item.price.toFixed(2)}</p>
                </div>
                <div className="flex items-center bg-slate-50 dark:bg-slate-800 rounded-xl p-1">
                  <button onClick={() => updateQuantity(item.id, -1)} className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-amber-600"><Minus size={14} /></button>
                  <span className="w-8 text-center text-xs font-black">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, 1)} className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-amber-600"><Plus size={14} /></button>
                </div>
                <button onClick={() => removeFromCart(item.id)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={18} /></button>
              </motion.div>
            ))
          )}
        </div>

        <div className="p-8 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 space-y-6">
          <div className="space-y-3">
            <div className="flex justify-between text-sm font-bold text-slate-500">
              <span>Subtotal</span>
              <span>R$ {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-rose-500">
              <span>Desconto</span>
              <div className="flex items-center gap-2">
                <span>- R$</span>
                <input 
                  type="number" 
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  className="w-20 bg-transparent border-b border-rose-200 text-right focus:outline-none font-black"
                />
              </div>
            </div>
            <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <span className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Total</span>
              <span className="text-3xl font-black text-amber-600">R$ {finalTotal.toFixed(2)}</span>
            </div>
          </div>

          <div className="space-y-3">
            <select 
              className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold outline-none"
              onChange={(e) => setSelectedCustomer(customers.find(c => c.id === Number(e.target.value)) || null)}
              value={selectedCustomer?.id || ""}
            >
              <option value="">Consumidor Final</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <button 
              disabled={cart.length === 0}
              onClick={() => setIsCheckoutOpen(true)}
              className="w-full py-4 bg-amber-600 text-white font-black rounded-2xl shadow-xl shadow-amber-600/20 hover:bg-amber-700 transition-all disabled:opacity-50 disabled:shadow-none"
            >
              FINALIZAR VENDA
            </button>
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      <AnimatePresence>
        {isCheckoutOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCheckoutOpen(false)} className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden">
              <div className="p-10 text-center bg-amber-600 text-white">
                <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-6 rotate-12">
                  <CheckCircle2 size={40} />
                </div>
                <h3 className="text-3xl font-black uppercase tracking-tight">Pagamento</h3>
                <p className="opacity-80 font-bold mt-1">Selecione o método desejado</p>
              </div>

              <div className="p-10 space-y-8">
                <div className="text-center">
                  <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Total a Pagar</span>
                  <div className="text-5xl font-black text-slate-900 dark:text-white mt-2">R$ {finalTotal.toFixed(2)}</div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {[
                    { id: 'Dinheiro', icon: Banknote, label: 'Dinheiro' },
                    { id: 'PIX', icon: QrCode, label: 'PIX' },
                    { id: 'Crédito', icon: CreditCard, label: 'Crédito' },
                    { id: 'Débito', icon: CreditCard, label: 'Débito' }
                  ].map(method => (
                    <button 
                      key={method.id}
                      onClick={() => handleCheckout(method.id)}
                      className="flex flex-col items-center gap-3 p-6 rounded-3xl border-2 border-slate-100 dark:border-slate-800 hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-all group"
                    >
                      <method.icon size={32} className="text-slate-400 group-hover:text-amber-600 transition-colors" />
                      <span className="font-black text-[10px] uppercase tracking-widest text-slate-500 group-hover:text-amber-600">{method.label}</span>
                    </button>
                  ))}
                </div>

                <button 
                  onClick={() => setIsCheckoutOpen(false)}
                  className="w-full py-4 text-slate-400 font-black hover:text-slate-600 transition-colors uppercase text-xs tracking-widest"
                >
                  Cancelar Operação
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Scanner Modal */}
      <AnimatePresence>
        {isScannerOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsScannerOpen(false)} className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden">
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <h3 className="text-xl font-black flex items-center gap-3">
                  <Camera size={24} className="text-amber-600" />
                  Escanear Código
                </h3>
                <button onClick={() => setIsScannerOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                  <X size={24} className="text-slate-400" />
                </button>
              </div>
              <div className="p-8">
                <div id="reader" className="w-full overflow-hidden rounded-[2rem] border-4 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"></div>
                <p className="text-center text-sm font-bold text-slate-500 mt-6">
                  Aponte a câmera para o código de barras do produto.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

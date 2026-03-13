import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { GoogleGenAI } from "@google/genai";
import { apiFetch } from './api';
import { 
  Product, 
  Customer, 
  Supplier, 
  Sale, 
  Bill, 
  User, 
  Tenant, 
  CashSession 
} from './types';

// Components
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import ToastContainer from './components/Toast';

// Pages
import Login from './pages/Login';
import DashboardView from './components/DashboardView';
import POS from './pages/POS';
import Products from './pages/Products';
import Customers from './pages/Customers';
import Suppliers from './pages/Suppliers';
import Financial from './pages/Financial';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Inventory from './pages/Inventory';
import Sales from './pages/Sales';
import AdminTenants from './pages/AdminTenants';
import AdminUsers from './pages/AdminUsers';

export default function App() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('user');
    if (!saved || saved === 'undefined') return null;
    try {
      return JSON.parse(saved);
    } catch (e) {
      return null;
    }
  });
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => {
    return (localStorage.getItem('theme') as any) || 'system';
  });

  // Data State
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [inventoryLogs, setInventoryLogs] = useState<any[]>([]);
  const [cashSession, setCashSession] = useState<CashSession | null>(null);
  const [settings, setSettings] = useState<any>({});
  const [toasts, setToasts] = useState<any[]>([]);

  // AI State
  const [aiInsights, setAiInsights] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.toggle('dark', systemTheme === 'dark');
    } else {
      root.classList.toggle('dark', theme === 'dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    if (user) {
      fetchAllData();
    }
    setIsAuthReady(true);
  }, [user]);

  const fetchAllData = async () => {
    try {
      const [
        productsData, 
        customersData, 
        suppliersData, 
        salesData, 
        billsData, 
        cashSessionData,
        settingsData,
        logsData
      ] = await Promise.all([
        apiFetch('/api/products'),
        apiFetch('/api/customers'),
        apiFetch('/api/suppliers'),
        apiFetch('/api/sales'),
        apiFetch('/api/bills'),
        apiFetch('/api/cash-session'),
        apiFetch('/api/settings'),
        apiFetch('/api/inventory-logs')
      ]);

      setProducts(productsData);
      setCustomers(customersData);
      setSuppliers(suppliersData);
      setSales(salesData);
      setBills(billsData);
      setCashSession(cashSessionData);
      setSettings(settingsData);
      setInventoryLogs(logsData);

      if (user?.is_super_admin) {
        const [tenantsData, usersData] = await Promise.all([
          apiFetch('/api/admin/tenants'),
          apiFetch('/api/admin/users')
        ]);
        setTenants(tenantsData);
        setUsers(usersData);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  const handleLogin = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const data = await apiFetch('/api/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      });
      setUser(data);
      localStorage.setItem('user', JSON.stringify(data));
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    navigate('/login');
  };

  const addToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const analyzeBusiness = async () => {
    setIsAnalyzing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      
      const prompt = `
        Analise os seguintes dados do meu mercado e forneça 3 insights estratégicos curtos e acionáveis:
        - Vendas Totais: R$ ${sales.reduce((sum, s) => sum + Number(s.total_amount), 0).toFixed(2)}
        - Produtos com estoque baixo: ${products.filter(p => p.stock_quantity <= p.min_stock_level).length}
        - Contas pendentes: R$ ${bills.filter(b => b.status === 'Pendente').reduce((sum, b) => sum + Number(b.amount), 0).toFixed(2)}
        - Top 3 Produtos: ${products.sort((a, b) => b.stock_quantity - a.stock_quantity).slice(0, 3).map(p => p.name).join(', ')}
      `;

      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt
      });
      setAiInsights(result.text || '');
    } catch (err) {
      console.error('AI Analysis failed:', err);
      addToast("Falha na análise de IA", "error");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCheckout = async (paymentMethod: string, cart: any[], customerId: number | null, discount: number) => {
    try {
      const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0) - discount;
      await apiFetch('/api/sales', {
        method: 'POST',
        body: JSON.stringify({
          customer_id: customerId,
          total_amount: totalAmount,
          discount,
          payment_method: paymentMethod,
          items: cart.map(item => ({
            product_id: item.id,
            quantity: item.quantity,
            unit_price: item.price,
            discount: 0
          }))
        })
      });
      addToast("Venda realizada com sucesso!", "success");
      fetchAllData();
    } catch (err) {
      addToast("Erro ao processar venda", "error");
      throw err;
    }
  };

  // CRUD Handlers
  const crudHandlers = {
    products: {
      add: async (data: any) => { await apiFetch('/api/products', { method: 'POST', body: JSON.stringify(data) }); fetchAllData(); },
      update: async (id: number, data: any) => { await apiFetch(`/api/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }); fetchAllData(); },
      delete: async (id: number) => { await apiFetch(`/api/products/${id}`, { method: 'DELETE' }); fetchAllData(); }
    },
    customers: {
      add: async (data: any) => { await apiFetch('/api/customers', { method: 'POST', body: JSON.stringify(data) }); fetchAllData(); },
      update: async (id: number, data: any) => { await apiFetch(`/api/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) }); fetchAllData(); },
      delete: async (id: number) => { await apiFetch(`/api/customers/${id}`, { method: 'DELETE' }); fetchAllData(); }
    },
    suppliers: {
      add: async (data: any) => { await apiFetch('/api/suppliers', { method: 'POST', body: JSON.stringify(data) }); fetchAllData(); },
      update: async (id: number, data: any) => { await apiFetch(`/api/suppliers/${id}`, { method: 'PUT', body: JSON.stringify(data) }); fetchAllData(); },
      delete: async (id: number) => { await apiFetch(`/api/suppliers/${id}`, { method: 'DELETE' }); fetchAllData(); }
    },
    bills: {
      add: async (data: any) => { await apiFetch('/api/bills', { method: 'POST', body: JSON.stringify(data) }); fetchAllData(); },
      pay: async (id: number) => { await apiFetch(`/api/bills/${id}/pay`, { method: 'POST' }); fetchAllData(); },
      delete: async (id: number) => { await apiFetch(`/api/bills/${id}`, { method: 'DELETE' }); fetchAllData(); }
    },
    admin: {
      tenants: {
        add: async (data: any) => { await apiFetch('/api/admin/tenants', { method: 'POST', body: JSON.stringify(data) }); fetchAllData(); },
        update: async (id: number, data: any) => { await apiFetch(`/api/admin/tenants/${id}`, { method: 'PUT', body: JSON.stringify(data) }); fetchAllData(); },
        delete: async (id: number) => { await apiFetch(`/api/admin/tenants/${id}`, { method: 'DELETE' }); fetchAllData(); }
      },
      users: {
        add: async (data: any) => { await apiFetch('/api/admin/users', { method: 'POST', body: JSON.stringify(data) }); fetchAllData(); },
        update: async (id: number, data: any) => { await apiFetch(`/api/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }); fetchAllData(); },
        delete: async (id: number) => { await apiFetch(`/api/admin/users/${id}`, { method: 'DELETE' }); fetchAllData(); }
      }
    }
  };

  const dashboardStats = {
    todayRevenue: sales.filter(s => new Date(s.created_at).toDateString() === new Date().toDateString()).reduce((sum, s) => sum + Number(s.total_amount), 0),
    totalRevenue: bills.filter(b => b.status === 'Pendente').reduce((sum, b) => sum + Number(b.amount), 0),
    lowStockCount: products.filter(p => p.stock_quantity <= p.min_stock_level).length,
    topProducts: products.sort((a, b) => b.stock_quantity - a.stock_quantity).slice(0, 5)
  };

  const dashboardConfig = settings.dashboard_config || {
    showSalesToday: true,
    showPendingBills: true,
    showLowStock: true,
    showExpiryAlerts: true
  };

  return (
    <>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login onLogin={handleLogin} isLoading={isLoading} />} />
        
        <Route element={<ProtectedRoute user={user} isAuthReady={isAuthReady} />}>
          <Route element={<Layout user={user} onLogout={handleLogout} theme={theme} setTheme={setTheme} />}>
            <Route path="/" element={
              <DashboardView 
                stats={dashboardStats} 
                dashboardConfig={dashboardConfig} 
                aiInsights={aiInsights} 
                onAnalyze={analyzeBusiness} 
                isAnalyzing={isAnalyzing} 
              />
            } />
            <Route path="/pos" element={<POS products={products} customers={customers} cashSession={cashSession} onCheckout={handleCheckout} addToast={addToast} />} />
            <Route path="/products" element={<Products products={products} suppliers={suppliers} onAddProduct={crudHandlers.products.add} onUpdateProduct={crudHandlers.products.update} onDeleteProduct={crudHandlers.products.delete} addToast={addToast} />} />
            <Route path="/customers" element={<Customers customers={customers} onAddCustomer={crudHandlers.customers.add} onUpdateCustomer={crudHandlers.customers.update} onDeleteCustomer={crudHandlers.customers.delete} addToast={addToast} />} />
            <Route path="/suppliers" element={<Suppliers suppliers={suppliers} onAddSupplier={crudHandlers.suppliers.add} onUpdateSupplier={crudHandlers.suppliers.update} onDeleteSupplier={crudHandlers.suppliers.delete} addToast={addToast} />} />
            <Route path="/financial" element={<Financial bills={bills} suppliers={suppliers} onAddBill={crudHandlers.bills.add} onPayBill={crudHandlers.bills.pay} onDeleteBill={crudHandlers.bills.delete} addToast={addToast} />} />
            <Route path="/reports" element={<Reports sales={sales} products={products} customers={customers} bills={bills} />} />
            <Route path="/settings" element={<Settings settings={settings} onUpdateSettings={async (data) => { await apiFetch('/api/settings', { method: 'POST', body: JSON.stringify(data) }); fetchAllData(); }} addToast={addToast} />} />
            <Route path="/inventory" element={<Inventory logs={inventoryLogs} products={products} />} />
            <Route path="/sales" element={<Sales sales={sales} />} />
            
            {/* Admin Routes */}
            <Route element={<ProtectedRoute user={user} isAuthReady={isAuthReady} requiredAdmin />}>
              <Route path="/admin/tenants" element={<AdminTenants tenants={tenants} onAddTenant={crudHandlers.admin.tenants.add} onUpdateTenant={crudHandlers.admin.tenants.update} onDeleteTenant={crudHandlers.admin.tenants.delete} addToast={addToast} />} />
              <Route path="/admin/users" element={<AdminUsers users={users} tenants={tenants} onAddUser={crudHandlers.admin.users.add} onUpdateUser={crudHandlers.admin.users.update} onDeleteUser={crudHandlers.admin.users.delete} addToast={addToast} />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      
      <ToastContainer toasts={toasts} onRemove={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />
    </>
  );
}

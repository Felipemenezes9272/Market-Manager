import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  User, 
  Store, 
  Shield, 
  Bell, 
  Palette, 
  Database, 
  Globe, 
  Save, 
  ChevronRight,
  Moon,
  Sun,
  Monitor,
  Cloud,
  Eye,
  EyeOff
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../utils';
import ConfirmationModal from '../components/ConfirmationModal';

interface SettingsProps {
  user: any;
  settings: any;
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  onUpdateSettings: (data: any) => Promise<void>;
  addToast: (msg: string, type?: any) => void;
}

export default function Settings({ user, settings, theme, setTheme, onUpdateSettings, addToast }: SettingsProps) {
  const isSuperAdmin = user?.is_super_admin;
  const [activeTab, setActiveTab] = useState(isSuperAdmin ? 'saas' : 'general');
  const [selectedTheme, setSelectedTheme] = useState(settings?.theme || theme || 'system');
  const [selectedColor, setSelectedColor] = useState(settings?.primary_color || '#d97706');
  const [selectedFontSize, setSelectedFontSize] = useState(settings?.font_size || 'medium');
  const [selectedDensity, setSelectedDensity] = useState(settings?.interface_density || 'comfortable');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [dashboardConfig, setDashboardConfig] = useState(settings?.dashboard_config || {
    showSalesToday: true,
    showProfitToday: true,
    showPendingBills: true,
    showLowStock: true,
    showExpiryAlerts: true
  });
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [showOpenAIKey, setShowOpenAIKey] = useState(false);

  // Sync local state with props when they change
  React.useEffect(() => {
    if (settings?.theme) setSelectedTheme(settings.theme);
    if (settings?.primary_color) setSelectedColor(settings.primary_color);
    if (settings?.font_size) setSelectedFontSize(settings.font_size);
    if (settings?.interface_density) setSelectedDensity(settings.interface_density);
    if (settings?.dashboard_config) {
      try {
        setDashboardConfig(typeof settings.dashboard_config === 'string' 
          ? JSON.parse(settings.dashboard_config) 
          : settings.dashboard_config);
      } catch (e) {
        console.error("Failed to parse dashboard config", e);
      }
    }
  }, [settings]);

  const storeTabs = [
    { id: 'general', label: 'Geral', icon: Store },
    { id: 'profile', label: 'Perfil', icon: User },
    { id: 'pos', label: 'PDV', icon: SettingsIcon },
    { id: 'security', label: 'Segurança', icon: Shield },
    { id: 'notifications', label: 'Notificações', icon: Bell },
    { id: 'appearance', label: 'Aparência', icon: Palette },
    { id: 'dashboard', label: 'Dashboard', icon: Monitor },
    { id: 'privacy', label: 'Privacidade', icon: Shield },
    { id: 'system', label: 'Sistema', icon: Database }
  ];

  const adminTabs = [
    { id: 'saas', label: 'SaaS Global', icon: Globe },
    { id: 'ai', label: 'Integração IA', icon: Cloud },
    { id: 'profile', label: 'Meu Perfil', icon: User },
    { id: 'appearance', label: 'Aparência', icon: Palette },
    { id: 'system_admin', label: 'Manutenção', icon: Database }
  ];

  const tabs = isSuperAdmin ? adminTabs : storeTabs;

  const handleLGPDRequest = async (type: 'export' | 'delete') => {
    try {
      const response = await fetch('/api/lgpd/request-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      });
      const data = await response.json();
      if (response.ok) {
        addToast(data.message, "success");
      } else {
        addToast(data.error || "Erro ao processar solicitação", "error");
      }
    } catch (err) {
      addToast("Erro de conexão", "error");
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    
    // Add theme and color to data
    data.theme = selectedTheme;
    data.primary_color = selectedColor;
    data.font_size = selectedFontSize;
    data.interface_density = selectedDensity;
    data.dashboard_config = JSON.stringify(dashboardConfig);
    
    try {
      await onUpdateSettings(data);
      addToast("Configurações salvas com sucesso!", "success");
    } catch (err) {
      addToast("Erro ao salvar configurações", "error");
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Configurações</h2>
        <p className="text-slate-500 font-medium mt-1">Personalize o sistema de acordo com as necessidades do seu mercado.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Tabs Sidebar */}
        <div className="lg:w-72 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black transition-all",
                activeTab === tab.id 
                  ? "bg-amber-600 text-white shadow-xl shadow-amber-600/20" 
                  : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              )}
            >
              <tab.icon size={20} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm"
          >
            <form onSubmit={handleSubmit} className="space-y-8">
              {activeTab === 'saas' && (
                <div className="space-y-8">
                  <div className="p-6 bg-purple-50 dark:bg-purple-500/5 rounded-3xl border border-purple-100 dark:border-purple-500/10 flex items-start gap-4">
                    <Globe className="text-purple-600 mt-1" size={24} />
                    <div>
                      <h4 className="font-black text-purple-900 dark:text-purple-100">Configurações Globais do SaaS</h4>
                      <p className="text-sm font-medium text-purple-700 dark:text-purple-300 mt-1">
                        Estas configurações afetam todas as lojas e usuários do sistema.
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Nome da Plataforma</label>
                      <input name="platform_name" defaultValue="Market Manager SaaS" className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none font-bold focus:ring-2 ring-purple-500/20" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Versão do Sistema</label>
                      <input name="version" defaultValue="v2.5.0-stable" disabled className="w-full px-6 py-4 bg-slate-100 dark:bg-slate-800/50 rounded-2xl outline-none font-bold text-slate-400 cursor-not-allowed" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Modo de Manutenção</label>
                      <select name="maintenance_mode" className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none font-bold focus:ring-2 ring-purple-500/20">
                        <option value="off">Desativado</option>
                        <option value="on">Ativado (Apenas Super Admins)</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Novos Registros</label>
                      <select name="allow_registration" className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none font-bold focus:ring-2 ring-purple-500/20">
                        <option value="true">Permitir</option>
                        <option value="false">Bloquear</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'ai' && (
                <div className="space-y-8">
                  <div className="p-6 bg-indigo-50 dark:bg-indigo-500/5 rounded-3xl border border-indigo-100 dark:border-indigo-500/10 flex items-start gap-4">
                    <Cloud className="text-indigo-600 mt-1" size={24} />
                    <div>
                      <h4 className="font-black text-indigo-900 dark:text-indigo-100">Configurações de Inteligência Artificial</h4>
                      <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300 mt-1">
                        Configure as chaves de API globais para habilitar recursos de IA em todas as contas.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Provedor de IA Padrão</label>
                      <select name="ai_provider" defaultValue={settings?.ai_provider || 'gemini'} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none font-bold focus:ring-2 ring-indigo-500/20">
                        <option value="gemini">Google Gemini</option>
                        <option value="openai">OpenAI (ChatGPT)</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Chave API Gemini</label>
                      <div className="relative">
                        <input 
                          key={settings?.gemini_api_key ? 'has-key' : 'no-key'}
                          type={showGeminiKey ? "text" : "password"} 
                          name="gemini_api_key" 
                          defaultValue={settings?.gemini_api_key} 
                          placeholder="••••••••••••••••"
                          className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none font-bold focus:ring-2 ring-indigo-500/20 pr-14" 
                        />
                        <button
                          type="button"
                          onClick={() => setShowGeminiKey(!showGeminiKey)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
                        >
                          {showGeminiKey ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1 ml-2">
                        Obtenha sua chave em <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">Google AI Studio</a>
                      </p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Chave API OpenAI</label>
                      <div className="relative">
                        <input 
                          key={settings?.openai_api_key ? 'has-key-oa' : 'no-key-oa'}
                          type={showOpenAIKey ? "text" : "password"} 
                          name="openai_api_key" 
                          defaultValue={settings?.openai_api_key} 
                          placeholder="••••••••••••••••"
                          className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none font-bold focus:ring-2 ring-indigo-500/20 pr-14" 
                        />
                        <button
                          type="button"
                          onClick={() => setShowOpenAIKey(!showOpenAIKey)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
                        >
                          {showOpenAIKey ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1 ml-2">
                        Obtenha sua chave em <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">OpenAI Dashboard</a>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'system_admin' && (
                <div className="space-y-8">
                  <div className="p-6 bg-rose-50 dark:bg-rose-500/5 rounded-3xl border border-rose-100 dark:border-rose-500/10 flex items-start gap-4">
                    <Database className="text-rose-600 mt-1" size={24} />
                    <div>
                      <h4 className="font-black text-rose-900 dark:text-rose-100">Ferramentas de Manutenção</h4>
                      <p className="text-sm font-medium text-rose-700 dark:text-rose-300 mt-1">
                        Ações críticas de banco de dados e limpeza de logs.
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <button type="button" className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-left hover:border-rose-500 transition-all group">
                      <h5 className="font-black text-slate-900 dark:text-white group-hover:text-rose-600 transition-colors">Limpar Logs Antigos</h5>
                      <p className="text-xs text-slate-500 font-medium mt-1">Remove logs de sistema com mais de 90 dias.</p>
                    </button>
                    <button type="button" className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-left hover:border-amber-500 transition-all group">
                      <h5 className="font-black text-slate-900 dark:text-white group-hover:text-amber-600 transition-colors">Otimizar Banco de Dados</h5>
                      <p className="text-xs text-slate-500 font-medium mt-1">Executa VACUUM e ANALYZE nas tabelas principais.</p>
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'pos' && (
                <div className="space-y-8">
                  <div className="p-6 bg-blue-50 dark:bg-blue-500/5 rounded-3xl border border-blue-100 dark:border-blue-500/10 flex items-start gap-4">
                    <SettingsIcon className="text-blue-600 mt-1" size={24} />
                    <div>
                      <h4 className="font-black text-blue-900 dark:text-blue-100">Configurações do PDV</h4>
                      <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mt-1">
                        Personalize o comportamento do caixa para maior produtividade.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Comportamento de Venda</h5>
                      <div className="space-y-4">
                        {[
                          { id: 'pos_auto_focus', label: 'Focar busca automaticamente' },
                          { id: 'pos_auto_finalize', label: 'Finalizar venda após pagamento' },
                          { id: 'pos_auto_drawer', label: 'Abrir gaveta automaticamente' },
                          { id: 'pos_confirm_cancel', label: 'Confirmar antes de cancelar venda' }
                        ].map((setting) => (
                          <label key={setting.id} className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-all">
                            <input 
                              type="checkbox" 
                              name={setting.id} 
                              defaultChecked={settings?.[setting.id] === 'true'} 
                              className="w-5 h-5 rounded-lg border-2 border-slate-300 text-amber-600 focus:ring-amber-500" 
                            />
                            <span className="font-bold text-slate-700 dark:text-slate-200">{setting.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-6">
                      <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Preferências e Performance</h5>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Forma de Pagamento Padrão</label>
                          <select name="pos_default_payment" defaultValue={settings?.pos_default_payment || 'money'} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none font-bold focus:ring-2 ring-blue-500/20">
                            <option value="money">Dinheiro</option>
                            <option value="pix">PIX</option>
                            <option value="card">Cartão de Crédito/Débito</option>
                          </select>
                        </div>
                        {[
                          { id: 'pos_auto_print', label: 'Impressão automática de cupom' },
                          { id: 'pos_show_change', label: 'Exibir troco em destaque' },
                          { id: 'pos_fast_mode', label: 'Modo rápido (menos validações)' },
                          { id: 'pos_shortcuts_enabled', label: 'Ativar atalhos de teclado' }
                        ].map((setting) => (
                          <label key={setting.id} className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-all">
                            <input 
                              type="checkbox" 
                              name={setting.id} 
                              defaultChecked={settings?.[setting.id] === 'true'} 
                              className="w-5 h-5 rounded-lg border-2 border-slate-300 text-amber-600 focus:ring-amber-500" 
                            />
                            <span className="font-bold text-slate-700 dark:text-slate-200">{setting.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'general' && (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Nome do Mercado</label>
                      <input name="market_name" defaultValue={settings?.market_name} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none font-bold focus:ring-2 ring-amber-500/20" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">CNPJ</label>
                      <input name="cnpj" defaultValue={settings?.cnpj} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none font-bold focus:ring-2 ring-amber-500/20" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">E-mail de Contato</label>
                      <input name="contact_email" defaultValue={settings?.contact_email} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none font-bold focus:ring-2 ring-amber-500/20" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Telefone</label>
                      <input name="phone" defaultValue={settings?.phone} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none font-bold focus:ring-2 ring-amber-500/20" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Endereço Completo</label>
                    <textarea name="address" defaultValue={settings?.address} rows={3} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none font-bold focus:ring-2 ring-amber-500/20 resize-none" />
                  </div>
                </div>
              )}

              {activeTab === 'appearance' && (
                <div className="space-y-8">
                  <div className="space-y-4">
                    <h4 className="text-lg font-black text-slate-900 dark:text-white">Tema do Sistema</h4>
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { id: 'light', label: 'Claro', icon: Sun },
                        { id: 'dark', label: 'Escuro', icon: Moon },
                        { id: 'system', label: 'Sistema', icon: Monitor }
                      ].map((themeOption) => (
                        <button
                          key={themeOption.id}
                          type="button"
                          onClick={() => {
                            setSelectedTheme(themeOption.id as any);
                            setTheme(themeOption.id as any);
                          }}
                          className={cn(
                            "flex flex-col items-center gap-3 p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl border-2 transition-all",
                            selectedTheme === themeOption.id ? "border-amber-500 bg-amber-50 dark:bg-amber-500/10" : "border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                          )}
                        >
                          <themeOption.icon size={24} className={cn(selectedTheme === themeOption.id ? "text-amber-600" : "text-slate-400")} />
                          <span className={cn("font-bold text-sm", selectedTheme === themeOption.id ? "text-amber-600" : "text-slate-500")}>{themeOption.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-lg font-black text-slate-900 dark:text-white">Cor Primária</h4>
                    <div className="flex gap-4">
                      {['#d97706', '#059669', '#2563eb', '#7c3aed', '#db2777'].map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => {
                            setSelectedColor(color);
                            document.documentElement.style.setProperty('--primary-color', color);
                            document.documentElement.style.setProperty('--primary-hover', color + 'dd');
                          }}
                          style={{ backgroundColor: color }}
                          className={cn(
                            "w-12 h-12 rounded-full border-4 shadow-lg hover:scale-110 transition-transform",
                            selectedColor === color ? "border-slate-900 dark:border-white" : "border-white dark:border-slate-900"
                          )}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <h4 className="text-lg font-black text-slate-900 dark:text-white">Tamanho da Fonte</h4>
                      <div className="flex gap-2">
                        {['small', 'medium', 'large'].map((size) => (
                          <button
                            key={size}
                            type="button"
                            onClick={() => {
                              setSelectedFontSize(size);
                              const sizes: any = { small: '14px', medium: '16px', large: '18px' };
                              document.documentElement.style.setProperty('--font-base-size', sizes[size]);
                            }}
                            className={cn(
                              "flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all border-2",
                              selectedFontSize === size 
                                ? "bg-amber-600 text-white border-amber-600 shadow-lg shadow-amber-600/20" 
                                : "bg-slate-50 dark:bg-slate-800 text-slate-500 border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                            )}
                          >
                            {size === 'small' ? 'Pequeno' : size === 'medium' ? 'Médio' : 'Grande'}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-lg font-black text-slate-900 dark:text-white">Densidade da Interface</h4>
                      <div className="flex gap-2">
                        {['compact', 'comfortable'].map((density) => (
                          <button
                            key={density}
                            type="button"
                            onClick={() => {
                              setSelectedDensity(density);
                              document.documentElement.classList.toggle('density-compact', density === 'compact');
                            }}
                            className={cn(
                              "flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all border-2",
                              selectedDensity === density 
                                ? "bg-amber-600 text-white border-amber-600 shadow-lg shadow-amber-600/20" 
                                : "bg-slate-50 dark:bg-slate-800 text-slate-500 border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                            )}
                          >
                            {density === 'compact' ? 'Compacta' : 'Confortável'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'dashboard' && (
                <div className="space-y-8">
                  <div className="p-6 bg-amber-50 dark:bg-amber-500/5 rounded-3xl border border-amber-100 dark:border-amber-500/10 flex items-start gap-4">
                    <Monitor className="text-amber-600 mt-1" size={24} />
                    <div>
                      <h4 className="font-black text-amber-900 dark:text-amber-100">Visibilidade do Dashboard</h4>
                      <p className="text-sm font-medium text-amber-700 dark:text-amber-300 mt-1">
                        Escolha quais cartões de estatísticas deseja visualizar na sua tela inicial.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                      { id: 'showSalesToday', label: 'Vendas Hoje' },
                      { id: 'showProfitToday', label: 'Lucro Hoje' },
                      { id: 'showPendingBills', label: 'Contas a Pagar' },
                      { id: 'showLowStock', label: 'Estoque Baixo' },
                      { id: 'showExpiryAlerts', label: 'Vencimento Próximo' }
                    ].map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700">
                        <span className="font-bold text-slate-700 dark:text-slate-300">{item.label}</span>
                        <button 
                          type="button"
                          onClick={() => setDashboardConfig({ ...dashboardConfig, [item.id]: !dashboardConfig[item.id as keyof typeof dashboardConfig] })}
                          className={cn(
                            "w-14 h-8 rounded-full transition-all relative",
                            dashboardConfig[item.id as keyof typeof dashboardConfig] ? "bg-amber-600" : "bg-slate-300"
                          )}
                        >
                          <div className={cn(
                            "absolute top-1 w-6 h-6 bg-white rounded-full transition-all",
                            dashboardConfig[item.id as keyof typeof dashboardConfig] ? "left-7" : "left-1"
                          )} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'privacy' && (
                <div className="space-y-8">
                  <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700">
                    <h4 className="font-black text-slate-900 dark:text-white mb-2">Seus Dados e LGPD</h4>
                    <p className="text-sm text-slate-500 font-medium">
                      Em conformidade com a Lei Geral de Proteção de Dados (LGPD), você tem o direito de acessar, exportar ou solicitar a exclusão de seus dados pessoais.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-600">
                        <Save size={24} />
                      </div>
                      <h5 className="font-black text-slate-900 dark:text-white">Exportar Meus Dados</h5>
                      <p className="text-xs text-slate-500 font-medium">Receba uma cópia completa de todos os seus dados armazenados em nosso sistema em formato JSON.</p>
                      <button 
                        type="button"
                        onClick={() => handleLGPDRequest('export')}
                        className="w-full py-3 bg-blue-600 text-white rounded-xl font-black text-xs hover:bg-blue-700 transition-all"
                      >
                        SOLICITAR EXPORTAÇÃO
                      </button>
                    </div>

                    <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
                      <div className="w-12 h-12 bg-red-100 dark:bg-red-500/10 rounded-2xl flex items-center justify-center text-red-600">
                        <Shield size={24} />
                      </div>
                      <h5 className="font-black text-slate-900 dark:text-white">Excluir Minha Conta</h5>
                      <p className="text-xs text-slate-500 font-medium">Solicite a exclusão permanente de todos os seus dados. Esta ação é irreversível.</p>
                      <button 
                        type="button"
                        onClick={() => setShowConfirmDelete(true)}
                        className="w-full py-3 bg-red-600 text-white rounded-xl font-black text-xs hover:bg-red-700 transition-all"
                      >
                        SOLICITAR EXCLUSÃO
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'system' && (
                <div className="space-y-8">
                  <div className="p-6 bg-amber-50 dark:bg-amber-500/5 rounded-3xl border border-amber-100 dark:border-amber-500/10 flex items-start gap-4">
                    <Cloud className="text-amber-600 mt-1" size={24} />
                    <div>
                      <h4 className="font-black text-amber-900 dark:text-amber-100">Backup Automático</h4>
                      <p className="text-sm font-medium text-amber-700 dark:text-amber-300 mt-1">
                        Seus dados estão sendo sincronizados em tempo real com a nuvem. O último backup foi realizado há 5 minutos.
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Moeda Padrão</label>
                      <select name="currency" defaultValue={settings?.currency || 'BRL'} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none font-bold focus:ring-2 ring-amber-500/20">
                        <option value="BRL">Real (R$)</option>
                        <option value="USD">Dólar ($)</option>
                        <option value="EUR">Euro (€)</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Fuso Horário</label>
                      <select name="timezone" defaultValue={settings?.timezone || 'America/Sao_Paulo'} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none font-bold focus:ring-2 ring-amber-500/20">
                        <option value="America/Sao_Paulo">Brasília (GMT-3)</option>
                        <option value="UTC">UTC</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-8 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button type="submit" className="bg-amber-600 text-white px-10 py-4 rounded-2xl font-black flex items-center gap-3 shadow-xl shadow-amber-600/20 hover:bg-amber-700 transition-all">
                  <Save size={20} /> SALVAR ALTERAÇÕES
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
      <ConfirmationModal
        isOpen={showConfirmDelete}
        onClose={() => setShowConfirmDelete(false)}
        onConfirm={() => handleLGPDRequest('delete')}
        title="Excluir Minha Conta?"
        message="Tem certeza que deseja solicitar a exclusão de seus dados? Esta ação é irreversível e você perderá acesso ao sistema."
        confirmText="SIM, EXCLUIR"
        cancelText="NÃO, MANTER"
        type="danger"
      />
    </div>
  );
}

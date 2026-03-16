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
  Cloud
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../utils';

interface SettingsProps {
  settings: any;
  onUpdateSettings: (data: any) => Promise<void>;
  addToast: (msg: string, type?: any) => void;
}

export default function Settings({ settings, onUpdateSettings, addToast }: SettingsProps) {
  const [activeTab, setActiveTab] = useState('general');
  const [selectedTheme, setSelectedTheme] = useState(settings?.theme || 'system');
  const [selectedColor, setSelectedColor] = useState(settings?.primary_color || '#d97706');

  const tabs = [
    { id: 'general', label: 'Geral', icon: Store },
    { id: 'profile', label: 'Perfil', icon: User },
    { id: 'security', label: 'Segurança', icon: Shield },
    { id: 'notifications', label: 'Notificações', icon: Bell },
    { id: 'appearance', label: 'Aparência', icon: Palette },
    { id: 'system', label: 'Sistema', icon: Database }
  ];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    
    // Add theme and color to data
    data.theme = selectedTheme;
    data.primary_color = selectedColor;
    
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
                      ].map((theme) => (
                        <button
                          key={theme.id}
                          type="button"
                          onClick={() => setSelectedTheme(theme.id)}
                          className={cn(
                            "flex flex-col items-center gap-3 p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl border-2 transition-all",
                            selectedTheme === theme.id ? "border-amber-500 bg-amber-50 dark:bg-amber-500/10" : "border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                          )}
                        >
                          <theme.icon size={24} className={cn(selectedTheme === theme.id ? "text-amber-600" : "text-slate-400")} />
                          <span className={cn("font-bold text-sm", selectedTheme === theme.id ? "text-amber-600" : "text-slate-500")}>{theme.label}</span>
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
                          onClick={() => setSelectedColor(color)}
                          style={{ backgroundColor: color }}
                          className={cn(
                            "w-12 h-12 rounded-full border-4 shadow-lg hover:scale-110 transition-transform",
                            selectedColor === color ? "border-slate-900 dark:border-white" : "border-white dark:border-slate-900"
                          )}
                        />
                      ))}
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
    </div>
  );
}

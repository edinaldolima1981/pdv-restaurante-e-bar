import React from 'react';
import { 
  LayoutDashboard, 
  Table as TableIcon, 
  UtensilsCrossed, 
  LogOut,
  ShoppingBag,
  DollarSign,
  Users,
  UserCog,
  BarChart3,
  Database,
  LogIn
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import { User } from 'firebase/auth';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onSeedData: () => void;
  onLogin: () => void;
  user: User | null;
}

const MENU_ITEMS = [
  { id: 'dashboard', label: 'PDV Principal', icon: LayoutDashboard },
  { id: 'active_orders', label: 'Pedidos Ativos', icon: ShoppingBag },
  { id: 'cash', label: 'Caixa', icon: DollarSign },
  { id: 'customers', label: 'Clientes', icon: Users },
  { id: 'menu', label: 'Cardápio', icon: UtensilsCrossed },
  { id: 'tables', label: 'Mesas', icon: TableIcon },
  { id: 'staff', label: 'Colaboradores', icon: UserCog },
  { id: 'reports', label: 'Relatórios', icon: BarChart3 },
];

export function Sidebar({ activeTab, setActiveTab, onSeedData, onLogin, user }: SidebarProps) {
  return (
    <div className="w-72 bg-[#003087] text-white/70 flex flex-col h-screen shadow-xl z-20">
      <div className="p-8 flex items-center gap-4 text-white">
        <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/20">
          <UtensilsCrossed className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="font-black text-2xl tracking-tighter leading-none">LUXE</h1>
          <p className="text-[10px] font-bold tracking-[0.2em] text-white/50 uppercase mt-1">Ponto de Venda</p>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1 mt-6">
        {MENU_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group relative",
              activeTab === item.id 
                ? "bg-white/15 text-white shadow-lg" 
                : "hover:bg-white/5 hover:text-white"
            )}
          >
            <item.icon className={cn(
              "w-5 h-5 transition-transform duration-300",
              activeTab === item.id ? "scale-110" : "group-hover:scale-110"
            )} />
            <span className="font-semibold text-sm">{item.label}</span>
            {activeTab === item.id && (
              <motion.div 
                layoutId="active-pill"
                className="absolute left-0 w-1 h-6 bg-white rounded-r-full"
              />
            )}
          </button>
        ))}
      </nav>

      <div className="p-6 space-y-4">
        <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/10">
          {user ? (
            <>
              <img src={user.photoURL || ''} alt={user.displayName || ''} className="w-10 h-10 rounded-full border-2 border-white/20" />
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-white truncate">{user.displayName || 'Usuário'}</p>
                <p className="text-[10px] text-white/40 uppercase font-bold">Administrador</p>
              </div>
            </>
          ) : (
            <button 
              onClick={onLogin}
              className="w-full flex items-center justify-center gap-2 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all font-bold text-sm text-white"
            >
              <LogIn className="w-4 h-4" />
              Fazer Login
            </button>
          )}
        </div>
        
        <button 
          onClick={() => {
            if (confirm('Deseja carregar os dados iniciais de teste no Firebase?')) {
              onSeedData();
            }
          }}
          className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-white/50 hover:bg-blue-500/20 hover:text-blue-400 transition-all font-bold text-sm"
        >
          <Database className="w-5 h-5" />
          Carregar Dados Iniciais
        </button>
        
        <button className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-white/50 hover:bg-red-500/20 hover:text-red-400 transition-all font-bold text-sm">
          <LogOut className="w-5 h-5" />
          Sair do Sistema
        </button>
      </div>
    </div>
  );
}

import React from 'react';
import { 
  LayoutDashboard, 
  Table as TableIcon, 
  UtensilsCrossed, 
  LogOut,
  ShoppingBag,
  Users,
  UserCog,
  BarChart3,
  LogIn,
  ArrowRight as ArrowRightIcon,
  Package,
  ChefHat,
  Wallet,
  Truck,
  Settings,
  Store
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import { AppSettings } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogin: () => void;
  onLogout: () => void;
  user: { id: string, email: string, role: string } | null;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  settings: AppSettings;
}

const MENU_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'grocery', label: 'Mercearia', icon: Store, module: 'grocery' },
  { id: 'active_orders', label: 'Pedidos Ativos', icon: ShoppingBag, module: 'restaurant' },
  { id: 'kds', label: 'Cozinha (KDS)', icon: ChefHat, module: 'restaurant' },
  { id: 'tables', label: 'Mapa de Mesas', icon: TableIcon, module: 'restaurant' },
  { id: 'menu', label: 'Cardápio', icon: UtensilsCrossed },
  { id: 'inventory', label: 'Estoque', icon: Package },
  { id: 'financial', label: 'Financeiro', icon: Wallet },
  { id: 'crm', label: 'Clientes (CRM)', icon: Users },
  { id: 'staff', label: 'Equipe', icon: UserCog },
  { id: 'reports', label: 'Relatórios', icon: BarChart3 },
  { id: 'delivery', label: 'Delivery', icon: Truck, module: 'restaurant' },
  { id: 'settings', label: 'Configurações', icon: Settings },
];

export function Sidebar({ activeTab, setActiveTab, onLogin, onLogout, user, isCollapsed, setIsCollapsed, settings }: SidebarProps) {
  const filteredItems = MENU_ITEMS.filter(item => {
    if (item.module === 'restaurant') return settings.restaurantModule;
    if (item.module === 'grocery') return settings.groceryModule;
    return true;
  });

  return (
    <div className={cn(
      "bg-[#003087] text-white/70 flex flex-col h-screen shadow-xl z-20 transition-all duration-500 ease-in-out relative",
      isCollapsed ? "w-24" : "w-72"
    )}>
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-4 top-10 w-8 h-8 bg-white rounded-full flex items-center justify-center text-[#003087] shadow-xl border border-slate-100 z-30 hover:scale-110 transition-transform"
      >
        <motion.div
          animate={{ rotate: isCollapsed ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <ArrowRightIcon className="w-4 h-4" />
        </motion.div>
      </button>

      <div className={cn("p-8 flex items-center gap-4 text-white overflow-hidden", isCollapsed && "p-6 justify-center")}>
        <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/20 shrink-0">
          <UtensilsCrossed className="w-7 h-7 text-white" />
        </div>
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="whitespace-nowrap"
          >
            <h1 className="font-black text-2xl tracking-tighter leading-none">ANOTA FÁCIL</h1>
            <p className="text-[10px] font-bold tracking-[0.2em] text-white/50 uppercase mt-1">PDV Inteligente</p>
          </motion.div>
        )}
      </div>

      <nav className="flex-1 px-4 space-y-1 mt-6 overflow-y-auto no-scrollbar">
        {filteredItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            title={isCollapsed ? item.label : ''}
            className={cn(
              "w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group relative",
              isCollapsed && "justify-center px-0",
              activeTab === item.id 
                ? "bg-white/15 text-white shadow-lg" 
                : "hover:bg-white/5 hover:text-white"
            )}
          >
            <item.icon className={cn(
              "w-5 h-5 transition-transform duration-300 shrink-0",
              activeTab === item.id ? "scale-110" : "group-hover:scale-110"
            )} />
            {!isCollapsed && (
              <motion.span 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="font-semibold text-sm whitespace-nowrap"
              >
                {item.label}
              </motion.span>
            )}
            {activeTab === item.id && (
              <motion.div 
                layoutId="active-pill"
                className="absolute left-0 w-1 h-6 bg-white rounded-r-full"
              />
            )}
          </button>
        ))}
      </nav>

      <div className={cn("p-6 space-y-4", isCollapsed && "p-4")}>
        <div className={cn("flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/10 overflow-hidden", isCollapsed && "p-2 justify-center")}>
          {user ? (
            <>
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold shrink-0">
                {user.email[0].toUpperCase()}
              </div>
              {!isCollapsed && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="overflow-hidden"
                >
                  <p className="text-sm font-bold text-white truncate">{user.email.split('@')[0]}</p>
                  <p className="text-[10px] text-white/40 uppercase font-bold">{user.role}</p>
                </motion.div>
              )}
            </>
          ) : (
            <button 
              onClick={onLogin}
              className={cn(
                "w-full flex items-center justify-center gap-2 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all font-bold text-sm text-white",
                isCollapsed && "p-2"
              )}
            >
              <LogIn className="w-4 h-4" />
              {!isCollapsed && "Fazer Login"}
            </button>
          )}
        </div>
        
        {!isCollapsed ? (
          <>
            <button 
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-white/50 hover:bg-red-500/20 hover:text-red-400 transition-all font-bold text-sm"
            >
              <LogOut className="w-5 h-5" />
              Sair do Sistema
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <button 
              onClick={onLogout}
              title="Sair"
              className="p-4 text-white/50 hover:bg-red-500/20 hover:text-red-400 rounded-2xl transition-all"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import { 
  LayoutDashboard, 
  ShoppingBag, 
  UtensilsCrossed, 
  Users, 
  LogOut, 
  Wallet,
  BarChart3,
  Grid2X2,
  UserRound
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: LayoutProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const navItems = [
    { href: "/", icon: LayoutDashboard, label: "PDV Principal" },
    { href: "/orders", icon: ShoppingBag, label: "Pedidos Ativos" },
    { href: "/cash", icon: Wallet, label: "Caixa" },
    { href: "/customers", icon: UserRound, label: "Clientes" },
    ...(user?.role === "admin" ? [
      { href: "/menu", icon: UtensilsCrossed, label: "Cardápio" },
      { href: "/tables", icon: Grid2X2, label: "Mesas" },
      { href: "/users", icon: Users, label: "Colaboradores" },
      { href: "/reports", icon: BarChart3, label: "Relatórios" },
    ] : []),
  ];

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {/* Sidebar — deep blue gradient */}
      <motion.aside 
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="w-64 sidebar-nav z-20 flex flex-col justify-between rounded-r-3xl shadow-2xl shadow-blue-900/30"
      >
        <div className="p-6">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10 px-2">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center shadow-lg">
              <UtensilsCrossed className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-display font-bold text-xl leading-none text-white tracking-wide">LUXE</h1>
              <p className="text-[10px] text-blue-200 uppercase tracking-widest font-semibold">Point of Sale</p>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = location === item.href;
              return (
                <Link key={item.href} href={item.href} className="block">
                  <div className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group cursor-pointer",
                    isActive 
                      ? "bg-white/20 text-white shadow-lg" 
                      : "text-blue-200 hover:bg-white/10 hover:text-white"
                  )}>
                    <item.icon className={cn(
                      "w-5 h-5 transition-transform duration-200",
                      isActive ? "text-white" : "group-hover:scale-110"
                    )} />
                    <span className="font-medium text-sm">{item.label}</span>
                    {isActive && (
                      <motion.div 
                        layoutId="activeNav"
                        className="absolute left-0 w-1 h-8 bg-white rounded-r-full opacity-80"
                      />
                    )}
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Footer */}
        <div className="p-6 border-t border-white/10">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center border border-white/20">
              <span className="font-bold text-sm text-white">
                {user?.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-blue-300 capitalize">{user?.role === "admin" ? "Administrador" : "Colaborador"}</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-blue-200 hover:bg-white/10 hover:text-white rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sair do Sistema
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 relative overflow-y-auto bg-background">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="h-full p-8"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}

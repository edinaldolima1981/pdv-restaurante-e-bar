import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Timer
} from 'lucide-react';
import { Order, OrderItem, Category } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface KDSProps {
  orders: Order[];
  categories: Category[];
  onUpdateItemStatus: (orderId: string, itemId: string, status: OrderItem['status']) => void;
  onCompleteOrder: (orderId: string) => void;
}

export function KDS({ 
  orders, 
  categories, 
  onUpdateItemStatus, 
  onCompleteOrder
}: KDSProps) {
  const [activeTab, setActiveTab] = useState<'pending' | 'preparing' | 'ready'>('pending');

  // Helper to check if a category is kitchen
  const isKitchenCategory = (categoryId?: string) => {
    if (!categoryId) return true; // Default to kitchen if unknown for safety
    const category = categories.find(c => c.id === categoryId);
    return !category || category.type === 'kitchen' || !category.type; // Default to kitchen if type not set
  };

  interface GroupedOrder {
    id: string;
    tableId: string;
    tableNumber: string | number;
    accountId: string;
    customerName: string;
    createdAt: string | number | Date;
    items: (OrderItem & { orderId: string })[];
    orderIds: string[];
  }

  const groupedOrders = orders.reduce((acc, order) => {
    const kitchenItems = order.items.filter(item => isKitchenCategory(item.categoryId));
    if (kitchenItems.length === 0) return acc;

    // Determine the group status based on items
    // If any item is in the current tab's status, include it
    const relevantItems = kitchenItems.filter(item => {
      if (activeTab === 'pending') return item.status === 'pending';
      if (activeTab === 'preparing') return item.status === 'preparing';
      if (activeTab === 'ready') return item.status === 'delivered';
      return false;
    }).map(item => ({ ...item, orderId: order.id }));

    if (relevantItems.length === 0) return acc;

    const key = `${order.tableId}-${order.accountId}`;
    if (!acc[key]) {
      acc[key] = {
        id: order.id, // Use the first order's ID as the group ID
        tableId: order.tableId || '',
        tableNumber: order.tableNumber || order.tableId || '',
        accountId: order.accountId,
        customerName: order.customerName || 'Cliente',
        createdAt: order.createdAt,
        items: [...relevantItems],
        orderIds: [order.id]
      };
    } else {
      acc[key].items.push(...relevantItems);
      if (!acc[key].orderIds.includes(order.id)) {
        acc[key].orderIds.push(order.id);
      }
      // Keep the oldest createdAt for the group
      const currentOldest = acc[key].createdAt;
      const newTime = order.createdAt;
      
      const parseDate = (d: string | number | Date | { toDate: () => Date } | null | undefined) => {
        if (!d) return new Date(0);
        return (d && typeof d === 'object' && 'toDate' in d) 
          ? (d as { toDate: () => Date }).toDate() 
          : new Date(d as string | number | Date);
      };

      if (parseDate(newTime).getTime() < parseDate(currentOldest).getTime()) {
        acc[key].createdAt = order.createdAt;
      }
    }
    return acc;
  }, {} as Record<string, GroupedOrder>);

  const pendingOrders = Object.values(groupedOrders);
  
  const getElapsedTime = (createdAt: string | number | Date) => {
    if (!createdAt) return 0;
    const date = (createdAt && typeof createdAt === 'object' && 'toDate' in createdAt) 
      ? (createdAt as { toDate: () => Date }).toDate() 
      : new Date(createdAt);
    
    if (isNaN(date.getTime())) return 0;
    
    const diff = Math.floor((new Date().getTime() - date.getTime()) / 60000);
    return Math.max(0, diff);
  };

  return (
    <div className="h-full flex flex-col space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-4">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <div>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-800 tracking-tighter uppercase">Cozinha (KDS)</h2>
            <p className="text-slate-500 font-bold text-sm sm:text-lg mt-1 sm:mt-2">Gestão em tempo real da produção.</p>
          </div>
        </div>
        <div className="flex gap-2 bg-slate-100 p-1.5 rounded-[2rem]">
          {(['pending', 'preparing', 'ready'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-8 py-3 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest transition-all",
                activeTab === tab 
                  ? "bg-white text-[#003087] shadow-lg shadow-slate-900/5" 
                  : "text-slate-400 hover:text-slate-600"
              )}
            >
              {tab === 'pending' ? 'Pendentes' : tab === 'preparing' ? 'Em Preparo' : 'Prontos'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 overflow-y-auto pb-12 custom-scrollbar">
        <AnimatePresence mode="popLayout">
          {pendingOrders.map(group => {
            const isNew = getElapsedTime(group.createdAt) <= 2;
            const isLate = getElapsedTime(group.createdAt) > 15;

            return (
              <motion.div 
                key={`${group.tableId}-${group.accountId}`}
                layout
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ 
                  opacity: 1, 
                  scale: 1, 
                  y: 0,
                  boxShadow: isNew 
                    ? "0 0 0 4px rgba(59, 130, 246, 0.2), 0 10px 15px -3px rgba(0, 0, 0, 0.1)" 
                    : "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
                }}
                exit={{ opacity: 0, scale: 0.8, y: -20 }}
                className={cn(
                  "bg-white border rounded-[2.5rem] flex flex-col overflow-hidden h-fit transition-colors duration-500",
                  isNew ? "border-blue-400 ring-4 ring-blue-400/10" : "border-slate-200",
                  isLate ? "border-red-300" : ""
                )}
              >
                <div className={cn(
                  "p-6 flex items-center justify-between relative",
                  isNew ? "bg-blue-50/50" : isLate ? "bg-red-50" : "bg-slate-50"
                )}>
                  {isNew && (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="absolute -top-2 -left-2 bg-blue-600 text-white text-[9px] font-black px-3 py-1 rounded-full shadow-lg z-10 uppercase tracking-widest flex items-center gap-1"
                    >
                      <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                      Novo Pedido
                    </motion.div>
                  )}
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mesa {group.tableNumber}</p>
                    <p className="font-black text-slate-800 leading-tight">{group.customerName}</p>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-full shadow-sm">
                    <Timer className={cn(
                      "w-4 h-4",
                      isLate ? "text-red-500 animate-pulse" : "text-slate-400"
                    )} />
                    <span className="text-xs font-black text-slate-700">{getElapsedTime(group.createdAt)} min</span>
                  </div>
                </div>

              <div className="p-6 space-y-4 flex-1">
                {group.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between group gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black shrink-0",
                        item.status === 'preparing' ? "bg-blue-100 text-blue-600" :
                        item.status === 'delivered' ? "bg-emerald-100 text-emerald-600" :
                        "bg-slate-100 text-slate-400"
                      )}>
                        {item.quantity}x
                      </div>
                      <div className="min-w-0">
                        <p className={cn(
                          "font-bold text-sm leading-tight",
                          item.status === 'delivered' ? "text-slate-300 line-through" : "text-slate-700"
                        )}>
                          {item.name}
                        </p>
                        {item.notes && <p className="text-[10px] text-red-500 font-bold uppercase truncate">{item.notes}</p>}
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => {
                        const nextStatus = item.status === 'pending' ? 'preparing' : 
                                         item.status === 'preparing' ? 'delivered' : 'closed';
                        onUpdateItemStatus(item.orderId, item.id, nextStatus as OrderItem['status']);
                      }}
                      className={cn(
                        "px-3 py-2 rounded-xl transition-all shrink-0 text-[9px] font-black uppercase tracking-widest",
                        item.status === 'pending' ? "bg-amber-500 text-white hover:bg-amber-600 shadow-sm" :
                        item.status === 'preparing' ? "bg-blue-600 text-white hover:bg-blue-700 shadow-sm" :
                        item.status === 'delivered' ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm" :
                        "bg-slate-50 text-slate-400 hover:bg-slate-100"
                      )}
                    >
                      {item.status === 'pending' ? 'Fazer Agora' : 
                       item.status === 'preparing' ? 'Pronto' : 
                       item.status === 'delivered' ? 'Entregue' : 'OK'}
                    </button>
                  </div>
                ))}
              </div>

              <div className="p-6 bg-slate-50/50 border-t border-slate-100">
                <button 
                  onClick={() => {
                    group.orderIds.forEach((orderId: string) => onCompleteOrder(orderId));
                  }}
                  className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Finalizar Tudo
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { 
  CheckCircle2, 
  ChevronRight, 
  Timer
} from 'lucide-react';
import { Order, OrderItem } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface KDSProps {
  orders: Order[];
  onUpdateItemStatus: (orderId: string, itemId: string, status: OrderItem['status']) => void;
  onCompleteOrder: (orderId: string) => void;
}

export function KDS({ orders, onUpdateItemStatus, onCompleteOrder }: KDSProps) {
  const [activeTab, setActiveTab] = useState<'pending' | 'preparing' | 'ready'>('pending');

  const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'preparing');
  
  const getElapsedTime = (createdAt: string | number | Date) => {
    const date = (createdAt && typeof createdAt === 'object' && 'toDate' in createdAt) 
      ? (createdAt as { toDate: () => Date }).toDate() 
      : new Date(createdAt);
    const diff = Math.floor((new Date().getTime() - date.getTime()) / 60000);
    return diff;
  };

  return (
    <div className="h-full flex flex-col space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-4">
        <div>
          <h2 className="text-3xl sm:text-5xl font-black text-slate-800 tracking-tighter uppercase">Cozinha (KDS)</h2>
          <p className="text-slate-500 font-bold text-sm sm:text-lg mt-1 sm:mt-2">Gestão em tempo real da produção.</p>
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
          {pendingOrders.map(order => (
            <motion.div 
              key={order.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white border border-slate-200 rounded-[2.5rem] flex flex-col shadow-sm overflow-hidden h-fit"
            >
              <div className={cn(
                "p-6 flex items-center justify-between",
                getElapsedTime(order.createdAt) > 15 ? "bg-red-50" : "bg-slate-50"
              )}>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mesa {order.tableId}</p>
                  <p className="font-black text-slate-800">Pedido #{order.id.slice(-4)}</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-full shadow-sm">
                  <Timer className={cn(
                    "w-4 h-4",
                    getElapsedTime(order.createdAt) > 15 ? "text-red-500 animate-pulse" : "text-slate-400"
                  )} />
                  <span className="text-xs font-black text-slate-700">{getElapsedTime(order.createdAt)} min</span>
                </div>
              </div>

              <div className="p-6 space-y-4 flex-1">
                {order.items.map(item => (
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
                          "font-bold text-sm truncate",
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
                                         item.status === 'preparing' ? 'delivered' : 'pending';
                        onUpdateItemStatus(order.id, item.id, nextStatus as OrderItem['status']);
                      }}
                      className={cn(
                        "p-2 rounded-xl transition-all shrink-0",
                        item.status === 'preparing' ? "bg-blue-600 text-white" :
                        item.status === 'delivered' ? "bg-emerald-600 text-white" :
                        "bg-slate-50 text-slate-400 hover:bg-slate-100"
                      )}
                    >
                      {item.status === 'delivered' ? <CheckCircle2 className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                  </div>
                ))}
              </div>

              <div className="p-6 bg-slate-50/50 border-t border-slate-100">
                <button 
                  onClick={() => onCompleteOrder(order.id)}
                  className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Finalizar Pedido
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

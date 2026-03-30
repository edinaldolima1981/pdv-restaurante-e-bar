import React from 'react';
import { 
  Truck, 
  Clock, 
  MapPin, 
  Plus,
  Navigation
} from 'lucide-react';
import { Order } from '../types';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface DeliveryManagerProps {
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, status: Order['status']) => void;
}

export function DeliveryManager({ orders, onUpdateOrderStatus }: DeliveryManagerProps) {
  const deliveryOrders = orders.filter(o => o.type === 'delivery' && o.status !== 'closed');

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-4">
        <div>
          <h2 className="text-3xl sm:text-5xl font-black text-slate-800 tracking-tighter uppercase">Gestão de Delivery</h2>
          <p className="text-slate-500 font-bold text-sm sm:text-lg mt-1 sm:mt-2">Acompanhe suas entregas em tempo real.</p>
        </div>
        <div className="flex gap-4">
          <button className="flex items-center gap-3 px-8 py-5 bg-[#003087] text-white rounded-[2rem] font-black text-sm uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-900/20">
            <Plus className="w-5 h-5" />
            Novo Delivery
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {deliveryOrders.map(order => (
          <motion.div 
            key={order.id}
            layout
            className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm space-y-6"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pedido #{order.id.slice(-4)}</p>
                <p className="font-black text-slate-800 text-lg">R$ {order.total.toFixed(2)}</p>
              </div>
              <span className={cn(
                "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                order.status === 'pending' ? "bg-amber-100 text-amber-600" :
                order.status === 'preparing' ? "bg-blue-100 text-blue-600" :
                "bg-emerald-100 text-emerald-600"
              )}>
                {order.status === 'pending' ? 'Pendente' : 
                 order.status === 'preparing' ? 'Em Preparo' : 'Em Rota'}
              </span>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-slate-400 shrink-0 mt-1" />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Endereço</p>
                  <p className="text-sm font-bold text-slate-600 leading-tight">{order.deliveryAddress || 'Não informado'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tempo Decorrido</p>
                  <p className="text-sm font-bold text-slate-600">25 min</p>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-50 flex gap-3">
              <button className="flex-1 py-4 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-100 transition-all">
                <Navigation className="w-5 h-5 mx-auto" />
              </button>
              <button 
                onClick={() => onUpdateOrderStatus(order.id, 'delivered')}
                className="flex-[2] py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-900/20"
              >
                Entregue
              </button>
            </div>
          </motion.div>
        ))}

        {deliveryOrders.length === 0 && (
          <div className="col-span-full py-20 bg-slate-50 border border-dashed border-slate-200 rounded-[3rem] flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm">
              <Truck className="w-8 h-8 text-slate-200" />
            </div>
            <div>
              <p className="font-black text-slate-400 uppercase text-xs tracking-widest">Nenhuma entrega ativa</p>
              <p className="text-slate-400 text-sm mt-2">Os pedidos de delivery aparecerão aqui.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

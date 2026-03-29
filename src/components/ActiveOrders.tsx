import React from 'react';
import { Table, Customer } from '../types';
import { Clock, CheckCircle2, UtensilsCrossed } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';

interface ActiveOrdersProps {
  tables: Table[];
  customers: Customer[];
  onDeliverItem: (tableId: string, accountId: string, itemId: string) => void;
}

export function ActiveOrders({ tables, customers, onDeliverItem }: ActiveOrdersProps) {
  const activeOrders = tables.flatMap(table => 
    table.accounts.flatMap(account => 
      account.items
        .filter(item => item.status === 'pending' || item.status === 'preparing')
        .map(item => ({
          ...item,
          tableId: table.id,
          tableNumber: table.number,
          accountId: account.id,
          customerName: account.customerId === 'avulso' 
            ? (account.guestName || 'Avulso') 
            : customers.find(c => c.id === account.customerId)?.name || 'Desconhecido'
        }))
    )
  );

  if (activeOrders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-center">
        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
          <UtensilsCrossed className="w-12 h-12 text-slate-300" />
        </div>
        <h3 className="text-xl font-black text-slate-700 mb-2">Sem Pedidos Pendentes</h3>
        <p className="text-slate-400 font-medium max-w-xs">Todos os pedidos foram entregues ou a cozinha está vazia.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase">Pedidos Ativos</h2>
          <p className="text-slate-400 font-bold text-sm uppercase tracking-widest mt-1">Acompanhamento em tempo real da cozinha</p>
        </div>
        <div className="bg-blue-600 text-white px-6 py-2 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-blue-900/20">
          {activeOrders.length} Pendentes
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeOrders.map((order, index) => (
          <div key={`${order.tableId}-${order.accountId}-${order.productId}-${index}`} className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 hover:shadow-xl transition-all group">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-900/20">
                  {order.tableNumber}
                </div>
                <div>
                  <p className="text-xs font-black text-blue-600 uppercase tracking-widest">Mesa {order.tableNumber}</p>
                  <p className="font-bold text-slate-800 truncate max-w-[150px]">{order.customerName}</p>
                </div>
              </div>
              <div className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl border",
                order.status === 'pending' ? "text-amber-500 bg-amber-50 border-amber-100" : "text-blue-500 bg-blue-50 border-blue-100"
              )}>
                <Clock className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">
                  {order.status === 'pending' ? 'Pendente' : 'Preparando'}
                </span>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div>
                  <p className="text-sm font-black text-slate-800">{order.name}</p>
                  <p className="text-xs text-slate-400 font-bold mt-1">{order.quantity}x {formatCurrency(order.price)}</p>
                </div>
                <p className="text-sm font-black text-blue-600">{formatCurrency(order.price * order.quantity)}</p>
              </div>
            </div>

            <button 
              onClick={() => onDeliverItem(order.tableId, order.accountId, order.id || order.productId)}
              className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-900/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              Marcar como Entregue
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

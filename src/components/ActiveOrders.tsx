import React from 'react';
import { Table, Customer } from '../types';
import { CheckCircle2, UtensilsCrossed } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';

interface ActiveOrdersProps {
  tables: Table[];
  customers: Customer[];
  onDeliverItem: (tableId: string, accountId: string, itemId: string) => void;
}

export function ActiveOrders({ 
  tables, 
  customers, 
  onDeliverItem
}: ActiveOrdersProps) {
  const groupedOrders = tables.flatMap(table => 
    table.accounts.flatMap(account => {
      const pendingItems = account.items.filter(item => item.status === 'pending' || item.status === 'preparing');
      if (pendingItems.length === 0) return [];
      
      return [{
        tableId: table.id,
        tableNumber: table.number,
        accountId: account.id,
        customerName: account.customerId === 'avulso' 
          ? (account.guestName || 'Avulso') 
          : customers.find(c => c.id === account.customerId)?.name || 'Desconhecido',
        items: pendingItems
      }];
    })
  );

  const totalPendingItems = groupedOrders.reduce((acc, group) => acc + group.items.length, 0);

  if (groupedOrders.length === 0) {
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
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase">Pedidos Ativos</h2>
            <p className="text-slate-400 font-bold text-sm uppercase tracking-widest mt-1">Acompanhamento em tempo real da cozinha</p>
          </div>
        </div>
        <div className="bg-blue-600 text-white px-6 py-2 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-blue-900/20">
          {totalPendingItems} Itens Pendentes
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groupedOrders.map((group) => (
          <div key={`${group.tableId}-${group.accountId}`} className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 hover:shadow-xl transition-all group">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-900/20">
                  {group.tableNumber}
                </div>
                <div>
                  <p className="text-xs font-black text-blue-600 uppercase tracking-widest">Mesa {group.tableNumber}</p>
                  <p className="font-bold text-slate-800 leading-tight">{group.customerName}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              {group.items.map((item) => (
                <div key={item.id || item.productId} className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-black text-slate-800">{item.name}</p>
                      <div className={cn(
                        "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest",
                        item.status === 'pending' ? "bg-amber-100 text-amber-600" : "bg-blue-100 text-blue-600"
                      )}>
                        {item.status === 'pending' ? 'Pendente' : 'Preparando'}
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 font-bold mt-1">{item.quantity}x {formatCurrency(item.price)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-black text-blue-600">{formatCurrency(item.price * item.quantity)}</p>
                    <button 
                      onClick={() => onDeliverItem(group.tableId, group.accountId, item.id || item.productId)}
                      className="p-2 bg-emerald-500 text-white rounded-xl hover:scale-110 transition-all shadow-sm"
                      title="Entregar item"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button 
              onClick={() => {
                group.items.forEach(item => onDeliverItem(group.tableId, group.accountId, item.id || item.productId));
              }}
              className="w-full py-4 bg-slate-800 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-slate-900/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              Entregar Todos os Itens
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

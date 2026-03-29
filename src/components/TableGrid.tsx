import React from 'react';
import { Clock, QrCode, Plus, Table as TableIcon } from 'lucide-react';
import { Table, TableStatus, Customer } from '../types';
import { cn } from '../lib/utils';

interface TableGridProps {
  tables: Table[];
  customers: Customer[];
  onSelectTable: (table: Table) => void;
  onShowQRCode: (table: Table) => void;
  onAddTable: () => void;
}

const STATUS_COLORS: Record<TableStatus, string> = {
  available: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  occupied: 'bg-blue-50 text-blue-600 border-blue-100',
  reserved: 'bg-purple-50 text-purple-600 border-purple-100',
  cleaning: 'bg-slate-50 text-slate-400 border-slate-100',
};

const STATUS_LABELS: Record<TableStatus, string> = {
  available: 'Livre',
  occupied: 'Ocupada',
  reserved: 'Reservada',
  cleaning: 'Limpeza',
};

export function TableGrid({ tables, customers, onSelectTable, onShowQRCode, onAddTable }: TableGridProps) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase">Mesas</h2>
          <p className="text-slate-500 font-medium">Gerencie a ocupação e pedidos das mesas em tempo real.</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden md:flex gap-6 mr-4">
            {Object.entries(STATUS_LABELS).map(([status, label]) => (
              <div key={status} className="flex items-center gap-2">
                <div className={cn("w-3 h-3 rounded-full", STATUS_COLORS[status as TableStatus].split(' ')[0])} />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</span>
              </div>
            ))}
          </div>
          <button 
            onClick={onAddTable}
            className="bg-[#003087] text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-blue-900/20 hover:scale-105 transition-all"
          >
            <Plus className="w-4 h-4" />
            Criar Mesa
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6">
        {tables.length === 0 ? (
          <div className="col-span-full py-20 bg-white border border-dashed border-slate-300 rounded-[3rem] flex flex-col items-center justify-center text-slate-400 space-y-4">
            <TableIcon className="w-12 h-12 opacity-20" />
            <p className="font-bold uppercase tracking-widest text-sm">Nenhuma mesa cadastrada</p>
            <button 
              onClick={onAddTable}
              className="mt-4 bg-[#003087] text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center gap-3 shadow-2xl shadow-blue-900/20 hover:scale-105 transition-all"
            >
              <Plus className="w-5 h-5" />
              Criar Primeira Mesa
            </button>
          </div>
        ) : (
          tables.map((table) => {
            return (
              <div
                key={table.id}
                onClick={() => onSelectTable(table)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectTable(table);
                  }
                }}
                className={cn(
                  "bg-white p-4 sm:p-6 rounded-[2rem] sm:rounded-[2.5rem] border-2 transition-all duration-300 text-left relative group hover:shadow-2xl min-h-[280px] sm:min-h-[320px] flex flex-col cursor-pointer",
                  table.status === 'occupied' 
                    ? "border-4 border-blue-600 shadow-xl shadow-blue-900/10" 
                    : "border-2 border-slate-100 hover:border-slate-200 shadow-sm",
                  table.hasPendingOrder && "border-red-500 shadow-[0_0_40px_rgba(239,68,68,0.4)] ring-8 ring-red-500/20 animate-[pulse_1s_infinite]"
                )}
              >
              <div className="flex justify-between items-start mb-4 gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="text-xl sm:text-2xl font-black text-slate-800 truncate">Mesa {table.number}</h3>
                  <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{table.capacity} lugares</p>
                </div>
                <div className={cn(
                  "px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl text-[9px] sm:text-[11px] font-black uppercase tracking-widest border shrink-0 shadow-sm",
                  table.hasPendingOrder ? "bg-red-600 text-white border-red-700 shadow-lg shadow-red-900/30 scale-110" : STATUS_COLORS[table.status]
                )}>
                  {table.hasPendingOrder ? 'PEDIDO PENDENTE' : STATUS_LABELS[table.status]}
                </div>
              </div>

              {table.status === 'occupied' && table.accounts.length > 0 && (
                <div className="space-y-2 mb-4 max-h-[120px] overflow-y-auto pr-2 custom-scrollbar">
                  {table.accounts.map(account => {
                    const customer = customers.find(c => c.id === account.customerId);
                    return (
                      <div 
                        key={account.id} 
                        className={cn(
                          "p-3 rounded-xl border transition-all",
                          account.hasPendingOrder 
                            ? "bg-red-600 border-red-400 text-white shadow-lg shadow-red-900/20" 
                            : "bg-blue-600 border-blue-400 text-white shadow-md shadow-blue-900/10"
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-black truncate">{customer?.name || 'Cliente'}</p>
                          {account.hasPendingOrder && (
                            <span className="w-2 h-2 bg-white rounded-full animate-pulse shrink-0" />
                          )}
                        </div>
                        <p className="text-[8px] font-bold opacity-70 uppercase tracking-widest mt-0.5">
                          {account.items.length} itens • {new Date(account.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex items-center justify-between mt-auto">
                <div className="flex -space-x-2">
                  {[...Array(table.capacity)].map((_, i) => (
                    <div 
                      key={i} 
                      className={cn(
                        "w-8 h-8 rounded-full border-2 border-white flex items-center justify-center shadow-sm",
                        table.status === 'occupied' ? "bg-blue-200" : "bg-slate-100"
                      )}
                    >
                      <div className={cn(
                        "w-2.5 h-2.5 rounded-full",
                        table.status === 'occupied' ? "bg-blue-500" : "bg-slate-300"
                      )} />
                    </div>
                  ))}
                </div>
                
                {table.status === 'occupied' && (
                  <div className="flex items-center gap-2 text-blue-600 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="text-[11px] font-black uppercase tracking-widest">45 min</span>
                  </div>
                )}
              </div>

              {table.hasPendingOrder && (
                <div className="absolute inset-0 rounded-[2.5rem] border-4 border-red-500 animate-[pulse_1s_infinite] pointer-events-none z-10" />
              )}

              <div className="absolute top-4 right-4 flex gap-2">
                <button 
                  onClick={(e) => { e.stopPropagation(); onShowQRCode(table); }}
                  className="p-2 bg-white/90 backdrop-blur-sm text-slate-400 hover:text-blue-600 rounded-xl shadow-sm transition-all border border-slate-100"
                  title="Ver QR Code da Mesa"
                >
                  <QrCode className="w-4 h-4" />
                </button>
                {table.status === 'occupied' && (
                  <div className={cn(
                    "w-3 h-3 rounded-full animate-ping",
                    table.hasPendingOrder ? "bg-red-600" : "bg-blue-600"
                  )} />
                )}
              </div>
            </div>
          );
        })
        )}
      </div>
    </div>
  );
}

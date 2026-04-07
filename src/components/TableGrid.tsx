import React from 'react';
import { QrCode, Plus, Table as TableIcon, Timer, ChevronRight } from 'lucide-react';
import { Table, TableStatus, Customer } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface TableGridProps {
  tables: Table[];
  customers: Customer[];
  onSelectTable: (table: Table) => void;
  onShowQRCode: (table: Table) => void;
  onAddTable: () => void;
}

type TableFilter = 'all' | 'customers' | 'guests';

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
  const [filter, setFilter] = React.useState<TableFilter>('all');

  const filteredTables = React.useMemo(() => {
    if (filter === 'all') return tables;
    return tables.filter(table => {
      if (table.status !== 'occupied') return false;
      if (filter === 'customers') {
        return table.accounts.some(acc => acc.customerId !== 'avulso');
      }
      if (filter === 'guests') {
        return table.accounts.some(acc => acc.customerId === 'avulso');
      }
      return true;
    });
  }, [tables, filter]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase">Mesas</h2>
          <p className="text-slate-500 font-medium">Gerencie a ocupação e pedidos das mesas em tempo real.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="bg-slate-100 p-1.5 rounded-2xl flex items-center gap-1">
            <button 
              onClick={() => setFilter('all')}
              className={cn(
                "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                filter === 'all' ? "bg-white text-slate-800 shadow-sm" : "text-slate-400 hover:text-slate-600"
              )}
            >
              Todos
            </button>
            <button 
              onClick={() => setFilter('customers')}
              className={cn(
                "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                filter === 'customers' ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
              )}
            >
              Clientes
            </button>
            <button 
              onClick={() => setFilter('guests')}
              className={cn(
                "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                filter === 'guests' ? "bg-white text-amber-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
              )}
            >
              Avulsos
            </button>
          </div>
          
          <div className="h-8 w-px bg-slate-200 hidden md:block mx-2" />

          <button 
            onClick={onAddTable}
            className="bg-[#003087] text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-blue-900/20 hover:scale-105 transition-all"
          >
            <Plus className="w-4 h-4" />
            Criar Mesa
          </button>
        </div>
      </div>

      <div className="flex items-center gap-6 overflow-x-auto pb-2 no-scrollbar">
        {Object.entries(STATUS_LABELS).map(([status, label]) => (
          <div key={status} className="flex items-center gap-2 shrink-0">
            <div className={cn("w-3 h-3 rounded-full", STATUS_COLORS[status as TableStatus].split(' ')[0])} />
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredTables.length === 0 ? (
            <motion.div 
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-full py-20 bg-white border border-dashed border-slate-300 rounded-[2.5rem] flex flex-col items-center justify-center text-slate-400 space-y-4"
            >
              <TableIcon className="w-12 h-12 opacity-20" />
              <p className="font-bold uppercase tracking-widest text-sm">
                {filter === 'all' ? 'Nenhuma mesa cadastrada' : 
                 filter === 'customers' ? 'Nenhuma mesa com clientes cadastrados' : 
                 'Nenhuma mesa com clientes avulsos'}
              </p>
              {filter === 'all' && (
                <button 
                  onClick={onAddTable}
                  className="mt-4 bg-[#003087] text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center gap-3 shadow-2xl shadow-blue-900/20 hover:scale-105 transition-all"
                >
                  <Plus className="w-5 h-5" />
                  Criar Primeira Mesa
                </button>
              )}
            </motion.div>
          ) : (
            filteredTables.map((table) => {
              const isOccupied = table.status === 'occupied';
              const hasPending = table.hasPendingOrder;
              const hasGuests = table.accounts.some(acc => acc.customerId === 'avulso');
              
              return (
                <motion.div
                  key={table.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  onClick={() => onSelectTable(table)}
                  className={cn(
                    "bg-white border border-slate-200 rounded-[2.5rem] flex flex-col shadow-sm overflow-hidden transition-all duration-300 cursor-pointer group hover:shadow-2xl hover:border-blue-200 h-fit",
                    hasPending && "border-red-500 shadow-[0_0_40px_rgba(239,68,68,0.1)]"
                  )}
                >
                  {/* Header - Exact KDS Style */}
                  <div className={cn(
                    "p-6 flex items-center justify-between",
                    hasPending ? "bg-red-50" : 
                    isOccupied ? "bg-blue-50" : "bg-slate-50"
                  )}>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Capacidade {table.capacity}</p>
                        {hasGuests && (
                          <span className="px-1.5 py-0.5 bg-amber-100 text-amber-600 rounded-md text-[7px] font-black uppercase tracking-widest flex items-center gap-1">
                            <QrCode className="w-2.5 h-2.5" />
                            Avulso
                          </span>
                        )}
                      </div>
                      <h3 className="font-black text-xl text-slate-800">Mesa {table.number}</h3>
                    </div>
                    
                    {isOccupied ? (
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-full shadow-sm">
                        <Timer className={cn(
                          "w-4 h-4",
                          hasPending ? "text-red-500 animate-pulse" : "text-blue-500"
                        )} />
                        <span className="text-xs font-black text-slate-700">45 min</span>
                      </div>
                    ) : (
                      <div className={cn(
                        "px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm flex items-center gap-1.5 bg-white",
                        table.status === 'reserved' ? "text-purple-600 border-purple-100" : "text-slate-400 border-slate-100"
                      )}>
                        <div className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          table.status === 'reserved' ? "bg-purple-500" : "bg-slate-300"
                        )} />
                        {STATUS_LABELS[table.status]}
                      </div>
                    )}
                  </div>

                  {/* Body - KDS Item List Style */}
                  <div className="p-6 space-y-4 flex-1">
                    {isOccupied && table.accounts.length > 0 ? (
                      table.accounts.map(account => {
                        const customer = customers.find(c => c.id === account.customerId);
                        return (
                          <div key={account.id} className="flex items-center justify-between group/item">
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black",
                                account.hasPendingOrder ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"
                              )}>
                                {account.items.length}x
                              </div>
                              <div>
                                <p className="font-bold text-sm text-slate-700 truncate max-w-[150px]">
                                  {customer?.name || account.guestName || 'Cliente'}
                                </p>
                                <div className="flex items-center gap-2">
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    {new Date(account.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                  {account.customerId === 'avulso' && (
                                    <span className="px-1.5 py-0.5 bg-amber-100 text-amber-600 rounded text-[7px] font-black uppercase tracking-widest">
                                      Avulso
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-300 group-hover/item:text-blue-500 transition-colors" />
                          </div>
                        );
                      })
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-3 py-12">
                        <div className="w-16 h-16 rounded-[2rem] bg-slate-50 flex items-center justify-center">
                          <TableIcon className="w-8 h-8 opacity-20" />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-50">
                          {table.status === 'available' ? 'Mesa Disponível' : 
                           table.status === 'reserved' ? 'Mesa Reservada' : 'Em Limpeza'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Footer - KDS Action Button Style */}
                  <div className="p-6 bg-slate-50/50 border-t border-slate-100 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex -space-x-2">
                        {[...Array(Math.min(4, table.capacity))].map((_, i) => (
                          <div 
                            key={i} 
                            className={cn(
                              "w-8 h-8 rounded-full border-2 border-white flex items-center justify-center shadow-sm",
                              isOccupied ? "bg-blue-100" : "bg-slate-100"
                            )}
                          >
                            <div className={cn(
                              "w-2.5 h-2.5 rounded-full",
                              isOccupied ? "bg-blue-500" : "bg-slate-300"
                            )} />
                          </div>
                        ))}
                        {table.capacity > 4 && (
                          <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center shadow-sm">
                            <span className="text-[10px] font-black text-slate-400">+{table.capacity - 4}</span>
                          </div>
                        )}
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); onShowQRCode(table); }}
                        className="p-3 bg-white text-slate-400 hover:text-blue-600 rounded-2xl shadow-sm transition-all border border-slate-100 hover:scale-110"
                      >
                        <QrCode className="w-5 h-5" />
                      </button>
                    </div>

                    <button 
                      className={cn(
                        "w-full py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg",
                        isOccupied 
                          ? "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-900/20" 
                          : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-900/20"
                      )}
                    >
                      {isOccupied ? 'Gerenciar Mesa' : 'Abrir Mesa'}
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

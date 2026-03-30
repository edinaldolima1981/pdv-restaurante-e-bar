import React, { useState } from 'react';
import { X, Plus, Trash2, CreditCard, Receipt as ReceiptIcon, Users, UserPlus, Printer, CheckCircle2, Merge } from 'lucide-react';
import { Table, Customer, OrderItem } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface TableDetailsProps {
  table: Table;
  customers: Customer[];
  selectedAccountId: string | null;
  onSelectAccount: (accountId: string) => void;
  onClose: () => void;
  onAddMore: () => void;
  onCloseAccount: (tableId: string, accountId: string) => void;
  onRemoveItem: (tableId: string, accountId: string, itemId: string) => void;
  onDeliverItem: (tableId: string, accountId: string, itemId: string) => void;
  onAddAccount: () => void;
  onCloseAllAccounts?: (tableId: string) => void;
  onPrintReceipt?: (items: OrderItem[], customer: Customer | null, guestName?: string) => void;
  onConfirmOrder?: (tableId: string, accountId: string, itemIds: string[]) => void;
  onMergeTable?: (sourceTableId: string) => void;
}

export function TableDetails({ 
  table, 
  customers, 
  selectedAccountId, 
  onSelectAccount, 
  onClose, 
  onAddMore, 
  onCloseAccount, 
  onRemoveItem, 
  onDeliverItem,
  onAddAccount,
  onCloseAllAccounts,
  onPrintReceipt,
  onConfirmOrder,
  onMergeTable
}: TableDetailsProps) {
  const [splitCount, setSplitCount] = useState(1);
  const [isSplitting, setIsSplitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'customers' | 'guests' | 'table'>('customers');

  // Reset split state when switching tabs
  React.useEffect(() => {
    setIsSplitting(false);
    setSplitCount(1);
  }, [activeTab]);

  const registeredAccounts = table.accounts.filter(acc => acc.customerId !== 'avulso');
  const guestAccounts = table.accounts.filter(acc => acc.customerId === 'avulso');

  const selectedAccount = table.accounts.find(acc => 
    acc.id === selectedAccountId && (
      (activeTab === 'customers' && acc.customerId !== 'avulso') ||
      (activeTab === 'guests' && acc.customerId === 'avulso')
    )
  ) || (activeTab === 'customers' ? (registeredAccounts.length > 0 ? registeredAccounts[0] : null) : activeTab === 'guests' ? (guestAccounts.length > 0 ? guestAccounts[0] : null) : null);
  
  const items = selectedAccount?.items || [];
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const serviceTax = subtotal * 0.1;
  const total = subtotal + serviceTax;

  const tableSubtotal = table.accounts.reduce((sum, acc) => sum + acc.items.reduce((accSum, item) => accSum + (item.price * item.quantity), 0), 0);
  const tableServiceTax = tableSubtotal * 0.1;
  const tableTotal = tableSubtotal + tableServiceTax;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white border border-slate-200 w-full max-w-5xl h-full sm:max-h-[95vh] rounded-none sm:rounded-[3rem] overflow-hidden flex flex-col shadow-2xl shadow-slate-900/20"
      >
        <div className="p-3 sm:p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="w-8 h-8 sm:w-14 sm:h-14 bg-blue-600 rounded-lg sm:rounded-[1.25rem] flex items-center justify-center text-white font-black text-sm sm:text-2xl shadow-lg shadow-blue-900/20">
              {table.number}
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-2xl font-black text-slate-800 tracking-tight uppercase truncate max-w-[240px] sm:max-w-none">
                Mesa {table.number}
                {activeTab !== 'table' && selectedAccount && (
                  <span className="text-blue-600 ml-1 sm:ml-2">
                    - {selectedAccount.customerId === 'avulso' ? (selectedAccount.guestName || 'Avulso') : (customers.find(c => c.id === selectedAccount.customerId)?.name || 'Cliente')}
                  </span>
                )}
              </h2>
              <p className="text-slate-400 font-bold text-[7px] sm:text-xs uppercase tracking-widest mt-0.5 sm:mt-1">Gerenciamento de Contas</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 sm:p-3 hover:bg-slate-200 rounded-lg sm:rounded-2xl text-slate-400 transition-colors">
            <X className="w-4 h-4 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-3 sm:px-8 pt-1 sm:pt-4 bg-white flex items-center gap-1 border-b border-slate-100 overflow-x-auto no-scrollbar">
          <button 
            onClick={() => setActiveTab('customers')}
            className={cn(
              "px-3 sm:px-6 py-2 sm:py-3 rounded-t-lg sm:rounded-t-2xl font-black text-[7px] sm:text-[10px] uppercase tracking-widest transition-all border-b-2 sm:border-b-4 whitespace-nowrap",
              activeTab === 'customers' ? "text-blue-600 border-blue-600 bg-blue-50/50" : "text-slate-400 border-transparent hover:text-slate-600"
            )}
          >
            Clientes ({registeredAccounts.length})
          </button>
          <button 
            onClick={() => setActiveTab('guests')}
            className={cn(
              "px-3 sm:px-6 py-2 sm:py-3 rounded-t-lg sm:rounded-t-2xl font-black text-[7px] sm:text-[10px] uppercase tracking-widest transition-all border-b-2 sm:border-b-4 whitespace-nowrap",
              activeTab === 'guests' ? "text-amber-600 border-amber-600 bg-amber-50/50" : "text-slate-400 border-transparent hover:text-slate-600"
            )}
          >
            Avulsos ({guestAccounts.length})
          </button>
          <button 
            onClick={() => setActiveTab('table')}
            className={cn(
              "px-3 sm:px-6 py-2 sm:py-3 rounded-t-lg sm:rounded-t-2xl font-black text-[7px] sm:text-[10px] uppercase tracking-widest transition-all border-b-2 sm:border-b-4 whitespace-nowrap",
              activeTab === 'table' ? "text-emerald-600 border-emerald-600 bg-emerald-50/50" : "text-slate-400 border-transparent hover:text-slate-600"
            )}
          >
            Mesa Completa
          </button>
        </div>

        {activeTab !== 'table' && (
          <div className="px-4 sm:px-8 py-3 sm:py-4 bg-white border-b border-slate-100 flex items-center gap-2 sm:gap-3 overflow-x-auto no-scrollbar">
            {(activeTab === 'customers' ? registeredAccounts : guestAccounts).map((acc) => {
              const isActive = selectedAccountId === acc.id;
              return (
                <button
                  key={acc.id}
                  onClick={() => onSelectAccount(acc.id)}
                  className={cn(
                    "px-4 py-2 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shrink-0 border-2",
                    isActive 
                      ? (activeTab === 'customers' ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-900/20" : "bg-amber-600 border-amber-600 text-white shadow-lg shadow-amber-900/20")
                      : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
                  )}
                >
                  {acc.customerId === 'avulso' ? (acc.guestName || 'Avulso') : (customers.find(c => c.id === acc.customerId)?.name || 'Cliente')}
                </button>
              );
            })}
            <button 
              onClick={onAddAccount}
              className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-colors border border-emerald-100 shrink-0"
              title="Adicionar Cliente à Mesa"
            >
              <UserPlus className="w-5 h-5" />
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-3 sm:space-y-4 custom-scrollbar bg-white">
          {activeTab === 'table' ? (
            <div className="space-y-6 sm:space-y-8">
              <div className="flex justify-between items-end border-b border-slate-100 pb-4 sm:pb-6">
                <div>
                  <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs sm:text-sm">Resumo da Mesa</h3>
                  <p className="text-[8px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 sm:mt-1">Visão geral de todos os consumos</p>
                </div>
                <span className="px-3 py-1.5 sm:px-4 sm:py-2 bg-emerald-100 text-emerald-600 rounded-xl sm:rounded-2xl text-[8px] sm:text-[10px] font-black uppercase tracking-widest border border-emerald-200 shadow-sm">
                  {table.accounts.length} Contas
                </span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {table.accounts.map(acc => {
                  const accSubtotal = acc.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                  const accTotal = accSubtotal * 1.1;
                  const isGuest = acc.customerId === 'avulso';
                  const name = isGuest ? (acc.guestName || 'Avulso') : (customers.find(c => c.id === acc.customerId)?.name || 'Cliente');
                  const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                  const hasPending = acc.items.some(i => i.status === 'pending');

                  return (
                    <div key={acc.id} className="flex flex-col p-4 sm:p-5 bg-slate-50 rounded-2xl sm:rounded-[2rem] border border-slate-100 hover:border-slate-200 transition-all group relative overflow-hidden">
                      {hasPending && (
                        <div className="absolute top-0 right-0 px-2 py-0.5 sm:px-3 sm:py-1 bg-amber-500 text-white text-[7px] sm:text-[8px] font-black uppercase tracking-tighter rounded-bl-lg sm:rounded-bl-xl">
                          Pendente
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                        <div className={cn(
                          "w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center text-white font-black text-[10px] sm:text-xs shadow-sm",
                          isGuest ? "bg-amber-500" : "bg-blue-600"
                        )}>
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-slate-800 text-xs sm:text-sm truncate pr-4">
                            {name}
                          </p>
                          <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5">
                            <span className={cn(
                              "text-[7px] sm:text-[8px] font-black uppercase tracking-widest px-1 py-0.5 rounded-md",
                              isGuest ? "bg-amber-100 text-amber-600" : "bg-blue-100 text-blue-600"
                            )}>
                              {isGuest ? 'Avulso' : 'Cliente'}
                            </span>
                            <span className="text-[8px] sm:text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                              {acc.items.length} itens
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-auto pt-3 sm:pt-4 border-t border-slate-200/50 flex justify-between items-center">
                        <span className="text-[8px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-widest">Total</span>
                        <span className="font-black text-slate-800 text-sm sm:text-base">{formatCurrency(accTotal)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="bg-emerald-50 border border-emerald-100 p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] space-y-4 sm:space-y-6 shadow-inner">
                <div className="space-y-1.5 sm:space-y-2">
                  <div className="flex justify-between items-center text-emerald-600/60 font-bold text-[8px] sm:text-[10px] uppercase tracking-[0.2em]">
                    <span>Subtotal da Mesa</span>
                    <span>{formatCurrency(tableSubtotal)}</span>
                  </div>
                  <div className="flex justify-between items-center text-emerald-600/60 font-bold text-[8px] sm:text-[10px] uppercase tracking-[0.2em]">
                    <span>Taxa de Serviço (10%)</span>
                    <span>{formatCurrency(tableServiceTax)}</span>
                  </div>
                </div>
                
                <div className="pt-4 sm:pt-6 border-t border-emerald-200/50 flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-emerald-800 font-black text-[10px] sm:text-xs uppercase tracking-[0.2em]">Total Geral</span>
                    <span className="text-[7px] sm:text-[9px] text-emerald-600/70 font-bold uppercase tracking-widest mt-0.5 sm:mt-1">Soma de todas as contas</span>
                  </div>
                  <span className="text-2xl sm:text-4xl font-black text-emerald-700 tracking-tighter">{formatCurrency(tableTotal)}</span>
                </div>
              </div>
            </div>
          ) : !selectedAccount ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-4 py-8 sm:py-12">
              <ReceiptIcon className="w-12 h-12 sm:w-16 sm:h-16 opacity-20" />
              <p className="text-[10px] sm:text-sm font-bold uppercase tracking-widest">
                {activeTab === 'customers' ? 'Nenhum cliente cadastrado' : 'Nenhum cliente avulso'}
              </p>
            </div>
          ) : items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-4 py-8 sm:py-12">
              <ReceiptIcon className="w-12 h-12 sm:w-16 sm:h-16 opacity-20" />
              <p className="text-[10px] sm:text-sm font-bold uppercase tracking-widest">Nenhum item consumido ainda</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3">
              {items.map((item) => (
                <div key={item.id || item.productId} className="flex justify-between items-center bg-slate-50 p-3 sm:p-4 rounded-2xl sm:rounded-3xl border border-slate-100 group">
                  <div className="flex items-center gap-2 sm:gap-4">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-lg sm:rounded-xl flex items-center justify-center text-slate-400 font-black text-xs sm:text-sm border border-slate-100">
                      {item.quantity}x
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <p className="text-xs sm:text-sm font-black text-slate-800 truncate max-w-[120px] sm:max-w-none">{item.name}</p>
                        {item.status === 'awaiting_confirmation' ? (
                          <span className="px-1.5 py-0.5 bg-red-100 text-red-600 rounded-full text-[7px] sm:text-[10px] font-black uppercase tracking-wider animate-pulse">
                            Confirmação
                          </span>
                        ) : item.status === 'pending' ? (
                          <span className="px-1.5 py-0.5 bg-amber-100 text-amber-600 rounded-full text-[7px] sm:text-[10px] font-black uppercase tracking-wider animate-pulse">
                            Pendente
                          </span>
                        ) : item.status === 'preparing' ? (
                          <span className="px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded-full text-[7px] sm:text-[10px] font-black uppercase tracking-wider animate-pulse">
                            Preparando
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 bg-green-100 text-green-600 rounded-full text-[7px] sm:text-[10px] font-black uppercase tracking-wider">
                            Entregue
                          </span>
                        )}
                      </div>
                      <p className="text-[9px] sm:text-xs text-slate-400 font-bold mt-0.5">
                        {formatCurrency(item.price)} cada
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 sm:gap-6">
                    <p className="text-sm sm:text-base font-black text-slate-800">
                      {formatCurrency(item.price * item.quantity)}
                    </p>
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      {item.status === 'awaiting_confirmation' && (
                        <button 
                          onClick={() => onConfirmOrder?.(table.id, selectedAccount.id, [item.id!])}
                          className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg font-black text-[8px] sm:text-[10px] uppercase tracking-widest transition-all shadow-sm"
                        >
                          OK
                        </button>
                      )}
                      {(item.status === 'pending' || item.status === 'preparing') && (
                        <button 
                          onClick={() => onDeliverItem(table.id, selectedAccount.id, item.id!)}
                          className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg font-black text-[8px] sm:text-[10px] uppercase tracking-widest transition-all shadow-sm"
                        >
                          OK
                        </button>
                      )}
                      <button 
                        onClick={() => onRemoveItem(table.id, selectedAccount.id, item.id || item.productId)}
                        className="p-1.5 text-slate-300 hover:text-red-500 transition-colors opacity-100 sm:opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-3.5 h-3.5 sm:w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              {items.some(i => i.status === 'awaiting_confirmation' || i.status === 'pending' || i.status === 'preparing') && (
                <button 
                  onClick={() => {
                    const itemIds = items
                      .filter(i => i.status === 'awaiting_confirmation' || i.status === 'pending' || i.status === 'preparing')
                      .map(i => i.id!);
                    onConfirmOrder?.(table.id, selectedAccount.id, itemIds);
                  }}
                  className="col-span-full mt-4 py-4 bg-emerald-500 text-white rounded-2xl sm:rounded-3xl font-black text-[10px] sm:text-xs uppercase tracking-widest shadow-lg shadow-emerald-900/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Confirmar Tudo como Entregue
                </button>
              )}
            </div>
          )}
        </div>

        {activeTab !== 'table' && selectedAccount && (
          <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-100 space-y-4 sm:space-y-6">
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <button 
                onClick={onAddMore}
                className="flex items-center justify-center gap-2 sm:gap-3 py-3 sm:py-4 bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-xs uppercase tracking-widest transition-all shadow-sm"
              >
                <Plus className="w-3.5 h-3.5 sm:w-4 h-4" />
                Adicionar Itens
              </button>
              <button 
                onClick={() => setIsSplitting(!isSplitting)}
                className="flex items-center justify-center gap-2 sm:gap-3 py-3 sm:py-4 bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-xs uppercase tracking-widest transition-all shadow-sm"
              >
                <Users className="w-3.5 h-3.5 sm:w-4 h-4" />
                Dividir
              </button>
            </div>

            <AnimatePresence>
              {isSplitting && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="bg-blue-50 border border-blue-100 p-4 sm:p-6 rounded-2xl sm:rounded-3xl space-y-3 sm:space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] sm:text-xs font-black text-blue-600 uppercase tracking-widest">Dividir por quantas pessoas?</span>
                      <div className="flex items-center gap-3 sm:gap-4">
                        <button 
                          onClick={() => setSplitCount(Math.max(1, splitCount - 1))}
                          className="w-7 h-7 sm:w-8 sm:h-8 bg-white rounded-lg flex items-center justify-center text-blue-600 shadow-sm"
                        >
                          <Plus className="w-3.5 h-3.5 sm:w-4 h-4 rotate-45" />
                        </button>
                        <span className="text-base sm:text-lg font-black text-blue-900">{splitCount}</span>
                        <button 
                          onClick={() => setSplitCount(splitCount + 1)}
                          className="w-7 h-7 sm:w-8 sm:h-8 bg-white rounded-lg flex items-center justify-center text-blue-600 shadow-sm"
                        >
                          <Plus className="w-3.5 h-3.5 sm:w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="pt-3 sm:pt-4 border-t border-blue-200/50 flex justify-between items-center">
                      <span className="text-xs sm:text-sm font-bold text-blue-800">Valor por pessoa:</span>
                      <span className="text-lg sm:text-xl font-black text-blue-600">{formatCurrency(total / splitCount)}</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-1">
              <div className="flex justify-between items-center text-slate-400 font-bold text-[10px] sm:text-xs uppercase tracking-widest">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between items-center text-slate-400 font-bold text-[10px] sm:text-xs uppercase tracking-widest">
                <span>Taxa (10%)</span>
                <span>{formatCurrency(serviceTax)}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                <span className="text-base sm:text-xl font-black text-slate-800 uppercase tracking-tight">Total</span>
                <span className={cn("text-xl sm:text-3xl font-black", activeTab === 'customers' ? "text-blue-600" : "text-amber-600")}>{formatCurrency(total)}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:gap-4">
              <div className="flex gap-2">
                <button 
                  onClick={() => onCloseAccount(table.id, selectedAccount.id)}
                  disabled={items.length === 0}
                  className={cn(
                    "flex-1 py-4 sm:py-6 text-white rounded-xl sm:rounded-[1.5rem] font-black text-[10px] sm:text-sm uppercase tracking-[0.1em] sm:tracking-[0.2em] transition-all shadow-xl flex items-center justify-center gap-2 sm:gap-3",
                    activeTab === 'customers' ? "bg-[#003087] hover:bg-blue-700 shadow-blue-900/20" : "bg-amber-600 hover:bg-amber-700 shadow-amber-900/20",
                    items.length === 0 && "bg-slate-200 text-slate-400 shadow-none cursor-not-allowed"
                  )}
                >
                  <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="truncate">Pagar Individual</span>
                </button>
                <button 
                  onClick={() => onPrintReceipt?.(items, customers.find(c => c.id === selectedAccount.customerId) || null, selectedAccount.guestName)}
                  disabled={items.length === 0}
                  className="px-4 sm:px-6 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl sm:rounded-[1.5rem] transition-all flex items-center justify-center shadow-sm"
                  title="Imprimir Recibo"
                >
                  <Printer className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'table' && (
          <div className="p-4 sm:p-8 bg-slate-50 border-t border-slate-100 space-y-3 sm:space-y-4">
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              <button 
                onClick={() => setIsSplitting(!isSplitting)}
                className="flex items-center justify-center gap-2 sm:gap-3 py-3 sm:py-4 bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-xs uppercase tracking-widest transition-all shadow-sm"
              >
                <Users className="w-3.5 h-3.5 sm:w-4 h-4" />
                Dividir
              </button>
              <button 
                onClick={() => onMergeTable?.(table.id)}
                className="flex items-center justify-center gap-2 sm:gap-3 py-3 sm:py-4 bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-xs uppercase tracking-widest transition-all shadow-sm"
              >
                <Merge className="w-3.5 h-3.5 sm:w-4 h-4" />
                Juntar
              </button>
              <button 
                onClick={() => {
                  const allItems = table.accounts.flatMap(acc => acc.items);
                  onPrintReceipt?.(allItems, null);
                }}
                className="flex items-center justify-center gap-2 sm:gap-3 py-3 sm:py-4 bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-xs uppercase tracking-widest transition-all shadow-sm"
              >
                <Printer className="w-3.5 h-3.5 sm:w-4 h-4" />
                Recibo
              </button>
            </div>

            <AnimatePresence>
              {isSplitting && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="bg-emerald-50 border border-emerald-100 p-4 sm:p-6 rounded-2xl sm:rounded-3xl space-y-3 sm:space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] sm:text-xs font-black text-emerald-600 uppercase tracking-widest">Dividir mesa por quantas pessoas?</span>
                      <div className="flex items-center gap-3 sm:gap-4">
                        <button 
                          onClick={() => setSplitCount(Math.max(1, splitCount - 1))}
                          className="w-7 h-7 sm:w-8 sm:h-8 bg-white rounded-lg flex items-center justify-center text-emerald-600 shadow-sm"
                        >
                          <Plus className="w-3.5 h-3.5 sm:w-4 h-4 rotate-45" />
                        </button>
                        <span className="text-base sm:text-lg font-black text-emerald-900">{splitCount}</span>
                        <button 
                          onClick={() => setSplitCount(splitCount + 1)}
                          className="w-7 h-7 sm:w-8 sm:h-8 bg-white rounded-lg flex items-center justify-center text-emerald-600 shadow-sm"
                        >
                          <Plus className="w-3.5 h-3.5 sm:w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="pt-3 sm:pt-4 border-t border-emerald-200/50 flex justify-between items-center">
                      <span className="text-xs sm:text-sm font-bold text-emerald-800">Valor por pessoa:</span>
                      <span className="text-lg sm:text-xl font-black text-emerald-600">{formatCurrency(tableTotal / splitCount)}</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <button 
              onClick={() => onCloseAllAccounts?.(table.id)}
              className="w-full py-4 sm:py-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl sm:rounded-[1.5rem] font-black text-[10px] sm:text-sm uppercase tracking-[0.1em] sm:tracking-[0.2em] transition-all shadow-xl shadow-emerald-900/20 flex flex-col items-center justify-center"
            >
              <div className="flex items-center gap-2 sm:gap-3">
                <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />
                Pagar Tudo
              </div>
              <span className="text-[8px] sm:text-[10px] opacity-80 mt-0.5 sm:mt-1">Total: {formatCurrency(tableTotal)}</span>
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

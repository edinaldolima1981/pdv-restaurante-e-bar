import React, { useState } from 'react';
import { 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight, 
  Plus, 
  Search,
  Wallet,
  CreditCard,
  Download
} from 'lucide-react';
import { Transaction } from '../types';
import { cn, formatCurrency } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface FinancialModuleProps {
  transactions: Transaction[];
  onAddTransaction: (transaction: Omit<Transaction, 'id'>) => void;
}

export function FinancialModule({ transactions, onAddTransaction }: FinancialModuleProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newTransaction, setNewTransaction] = useState<Omit<Transaction, 'id'>>({
    date: new Date().toISOString().split('T')[0],
    type: 'income',
    category: 'sales',
    amount: 0,
    description: '',
    paymentMethod: 'cash',
    status: 'completed'
  });

  const totalIncome = transactions.filter(t => t.type === 'income' && t.status === 'completed').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense' && t.status === 'completed').reduce((sum, t) => sum + t.amount, 0);
  const balance = totalIncome - totalExpense;

  const filteredTransactions = transactions.filter(t => 
    t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.category.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleAdd = () => {
    if (newTransaction.amount > 0 && newTransaction.description) {
      onAddTransaction(newTransaction);
      setIsAdding(false);
      setNewTransaction({
        date: new Date().toISOString().split('T')[0],
        type: 'income',
        category: 'sales',
        amount: 0,
        description: '',
        paymentMethod: 'cash',
        status: 'completed'
      });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-4">
        <div>
          <h2 className="text-3xl sm:text-5xl font-black text-slate-800 tracking-tighter uppercase">Gestão Financeira</h2>
          <p className="text-slate-500 font-bold text-sm sm:text-lg mt-1 sm:mt-2">Controle seu fluxo de caixa e lucratividade.</p>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-4">
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-3 px-8 py-5 bg-[#003087] text-white rounded-[2rem] font-black text-sm uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-900/20"
          >
            <Plus className="w-5 h-5" />
            Lançamento
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center">
              <ArrowUpRight className="w-6 h-6 text-emerald-600" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600/60">Entradas</span>
          </div>
          <p className="text-3xl font-black text-slate-800 tracking-tight">{formatCurrency(totalIncome)}</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase mt-1 tracking-widest">Total acumulado</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center">
              <ArrowDownRight className="w-6 h-6 text-red-600" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-red-600/60">Saídas</span>
          </div>
          <p className="text-3xl font-black text-slate-800 tracking-tight">{formatCurrency(totalExpense)}</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase mt-1 tracking-widest">Total acumulado</p>
        </div>

        <div className="bg-[#003087] rounded-[2.5rem] p-8 shadow-xl shadow-blue-900/20">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Saldo Atual</span>
          </div>
          <p className="text-3xl font-black text-white tracking-tight">{formatCurrency(balance)}</p>
          <p className="text-[10px] font-bold text-white/40 uppercase mt-1 tracking-widest">Disponível em caixa</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Extrato de Transações</h3>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="text"
                placeholder="Buscar lançamento..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 font-bold text-slate-600"
              />
            </div>
            <button className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-100 transition-all">
              <Download className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Data</th>
                <th className="text-left py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Descrição</th>
                <th className="text-left py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Categoria</th>
                <th className="text-left py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Método</th>
                <th className="text-right py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredTransactions.map(transaction => (
                <tr key={transaction.id} className="group hover:bg-slate-50/50 transition-all">
                  <td className="py-4">
                    <p className="font-bold text-slate-400 text-xs">{new Date(transaction.date).toLocaleDateString('pt-BR')}</p>
                  </td>
                  <td className="py-4">
                    <p className="font-black text-slate-700 text-sm">{transaction.description}</p>
                  </td>
                  <td className="py-4">
                    <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[9px] font-black uppercase tracking-widest">
                      {transaction.category}
                    </span>
                  </td>
                  <td className="py-4">
                    <div className="flex items-center gap-2 text-slate-400">
                      {transaction.paymentMethod === 'card' ? <CreditCard className="w-4 h-4" /> : <DollarSign className="w-4 h-4" />}
                      <span className="text-[10px] font-bold uppercase">{transaction.paymentMethod}</span>
                    </div>
                  </td>
                  <td className="py-4 text-right">
                    <p className={cn(
                      "font-black text-sm",
                      transaction.type === 'income' ? "text-emerald-600" : "text-red-600"
                    )}>
                      {transaction.type === 'income' ? '+' : '-'} {formatCurrency(transaction.amount)}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-[3rem] p-10 w-full max-w-xl shadow-2xl"
            >
              <h3 className="text-3xl font-black text-slate-800 mb-8 uppercase tracking-tight">Novo Lançamento</h3>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setNewTransaction({...newTransaction, type: 'income'})}
                    className={cn(
                      "py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border-2",
                      newTransaction.type === 'income' 
                        ? "bg-emerald-600 border-emerald-600 text-white" 
                        : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
                    )}
                  >
                    Receita
                  </button>
                  <button
                    onClick={() => setNewTransaction({...newTransaction, type: 'expense'})}
                    className={cn(
                      "py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border-2",
                      newTransaction.type === 'expense' 
                        ? "bg-red-600 border-red-600 text-white" 
                        : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
                    )}
                  >
                    Despesa
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Descrição</label>
                  <input 
                    type="text"
                    value={newTransaction.description}
                    onChange={(e) => setNewTransaction({...newTransaction, description: e.target.value})}
                    className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 font-bold text-slate-700"
                    placeholder="Ex: Compra de insumos, Pagamento aluguel..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Valor</label>
                    <input 
                      type="number"
                      value={newTransaction.amount}
                      onChange={(e) => setNewTransaction({...newTransaction, amount: parseFloat(e.target.value)})}
                      className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 font-black text-slate-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Data</label>
                    <input 
                      type="date"
                      value={newTransaction.date}
                      onChange={(e) => setNewTransaction({...newTransaction, date: e.target.value})}
                      className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 font-bold text-slate-700"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Categoria</label>
                    <select 
                      value={newTransaction.category}
                      onChange={(e) => setNewTransaction({...newTransaction, category: e.target.value})}
                      className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 font-bold text-slate-700 appearance-none"
                    >
                      <option value="sales">Vendas</option>
                      <option value="purchase">Compras</option>
                      <option value="salary">Salários</option>
                      <option value="rent">Aluguel</option>
                      <option value="other">Outros</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Pagamento</label>
                    <select 
                      value={newTransaction.paymentMethod}
                      onChange={(e) => setNewTransaction({...newTransaction, paymentMethod: e.target.value as 'cash' | 'card' | 'pix' | 'other'})}
                      className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 font-bold text-slate-700 appearance-none"
                    >
                      <option value="cash">Dinheiro</option>
                      <option value="card">Cartão</option>
                      <option value="pix">PIX</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-4 pt-6">
                  <button 
                    onClick={() => setIsAdding(false)}
                    className="flex-1 py-5 bg-slate-100 text-slate-500 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-200 transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleAdd}
                    className="flex-1 py-5 bg-blue-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-900/20"
                  >
                    Salvar Lançamento
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

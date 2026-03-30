import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  Star, 
  TrendingUp, 
  Gift,
  Filter
} from 'lucide-react';
import { Customer } from '../types';
import { cn, formatCurrency } from '../lib/utils';
import { motion } from 'motion/react';

interface CRMProps {
  customers: Customer[];
}

export function CRM({ customers }: CRMProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone?.includes(searchQuery)
  );

  const topCustomers = [...customers].sort((a, b) => (b.totalSpent || 0) - (a.totalSpent || 0)).slice(0, 5);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-4">
        <div>
          <h2 className="text-3xl sm:text-5xl font-black text-slate-800 tracking-tighter uppercase">CRM de Clientes</h2>
          <p className="text-slate-500 font-bold text-sm sm:text-lg mt-1 sm:mt-2">Fidelize e conheça melhor seu público.</p>
        </div>
        <div className="flex gap-4">
          <button 
            className="flex items-center gap-3 px-8 py-5 bg-[#003087] text-white rounded-[2rem] font-black text-sm uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-900/20"
          >
            <Plus className="w-5 h-5" />
            Novo Cliente
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
            <div className="flex items-center gap-4 mb-8">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Buscar cliente por nome, email ou telefone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 font-bold text-slate-600"
                />
              </div>
              <button className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-100 transition-all">
                <Filter className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredCustomers.map(customer => (
                <motion.div 
                  key={customer.id}
                  layout
                  onClick={() => setSelectedCustomer(customer)}
                  className={cn(
                    "p-6 rounded-[2rem] border-2 transition-all cursor-pointer group",
                    selectedCustomer?.id === customer.id 
                      ? "bg-blue-50 border-blue-600 shadow-lg shadow-blue-900/5" 
                      : "bg-white border-slate-100 hover:border-slate-200"
                  )}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center font-black text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600 transition-all">
                      {customer.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-black text-slate-700 text-sm">{customer.name}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">{customer.phone || 'Sem telefone'}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Gasto</p>
                      <p className="font-black text-slate-700 text-xs">{formatCurrency(customer.totalSpent || 0)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                      <span className="text-[10px] font-black text-slate-700">{customer.points || 0} pts</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
            <h3 className="text-xl font-black text-slate-800 mb-6 uppercase tracking-tight">Top Clientes</h3>
            <div className="space-y-4">
              {topCustomers.map((customer, index) => (
                <div key={customer.id} className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-2xl transition-all">
                  <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center font-black text-xs">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-slate-700 text-xs truncate">{customer.name}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">{formatCurrency(customer.totalSpent || 0)}</p>
                  </div>
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#003087] rounded-[2.5rem] p-8 shadow-xl shadow-blue-900/20 text-white">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-4">
              <Gift className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black mb-2 uppercase tracking-tight">Programa de Fidelidade</h3>
            <p className="text-white/60 text-sm font-bold mb-6">Configure recompensas e níveis para seus clientes mais fiéis.</p>
            <button className="w-full py-4 bg-white text-[#003087] rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-50 transition-all">
              Configurar Regras
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

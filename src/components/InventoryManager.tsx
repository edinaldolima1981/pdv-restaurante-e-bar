import React, { useState } from 'react';
import { 
  Package, 
  AlertTriangle, 
  Plus, 
  Search,
  History,
  Filter
} from 'lucide-react';
import { Product } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface InventoryManagerProps {
  products: Product[];
  onUpdateStock: (productId: string, quantity: number, type: 'in' | 'out' | 'adjustment', reason: string) => void;
}

export function InventoryManager({ products, onUpdateStock }: InventoryManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adjustmentQty, setAdjustmentQty] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [adjustmentType, setAdjustmentType] = useState<'in' | 'out' | 'adjustment'>('in');

  const lowStockProducts = products.filter(p => p.trackStock && p.stock <= p.minStock);
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAdjust = () => {
    if (selectedProduct && adjustmentQty) {
      onUpdateStock(
        selectedProduct.id, 
        parseFloat(adjustmentQty), 
        adjustmentType, 
        adjustmentReason || 'Ajuste manual'
      );
      setSelectedProduct(null);
      setAdjustmentQty('');
      setAdjustmentReason('');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-4">
        <div>
          <h2 className="text-3xl sm:text-5xl font-black text-slate-800 tracking-tighter uppercase">Estoque Inteligente</h2>
          <p className="text-slate-500 font-bold text-sm sm:text-lg mt-1 sm:mt-2">Controle total de insumos e produtos.</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-amber-50 border border-amber-100 rounded-2xl px-6 py-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-amber-600/60">Alerta de Estoque</p>
              <p className="text-2xl font-black text-amber-700">{lowStockProducts.length} <span className="text-sm font-bold">itens baixos</span></p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
            <div className="flex items-center gap-4 mb-8">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Buscar produto no estoque..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 font-bold text-slate-600"
                />
              </div>
              <button className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-100 transition-all">
                <Filter className="w-6 h-6" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Produto</th>
                    <th className="text-left py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Status</th>
                    <th className="text-right py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Qtd Atual</th>
                    <th className="text-right py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Mínimo</th>
                    <th className="text-right py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredProducts.map(product => (
                    <tr key={product.id} className="group hover:bg-slate-50/50 transition-all">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center overflow-hidden">
                            {product.image ? (
                              <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                              <Package className="w-5 h-5 text-slate-400" />
                            )}
                          </div>
                          <div>
                            <p className="font-black text-slate-700 text-sm">{product.name}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">{product.unit}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                          product.stock <= 0 ? "bg-red-100 text-red-600" :
                          product.stock <= product.minStock ? "bg-amber-100 text-amber-600" :
                          "bg-emerald-100 text-emerald-600"
                        )}>
                          {product.stock <= 0 ? 'Esgotado' : 
                           product.stock <= product.minStock ? 'Baixo' : 'Ok'}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <p className={cn(
                          "font-black text-lg",
                          product.stock <= product.minStock ? "text-amber-600" : "text-slate-700"
                        )}>
                          {product.stock}
                        </p>
                      </td>
                      <td className="py-4 text-right">
                        <p className="font-bold text-slate-400 text-sm">{product.minStock}</p>
                      </td>
                      <td className="py-4 text-right">
                        <button 
                          onClick={() => setSelectedProduct(product)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <AnimatePresence mode="wait">
            {selectedProduct ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm sticky top-8"
              >
                <h3 className="text-xl font-black text-slate-800 mb-6 uppercase tracking-tight">Ajustar Estoque</h3>
                <div className="space-y-6">
                  <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                      <Package className="w-6 h-6 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Produto Selecionado</p>
                      <p className="font-black text-slate-700">{selectedProduct.name}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {(['in', 'out', 'adjustment'] as const).map(type => (
                      <button
                        key={type}
                        onClick={() => setAdjustmentType(type)}
                        className={cn(
                          "py-3 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all border-2",
                          adjustmentType === type 
                            ? "bg-blue-600 border-blue-600 text-white" 
                            : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
                        )}
                      >
                        {type === 'in' ? 'Entrada' : type === 'out' ? 'Saída' : 'Ajuste'}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Quantidade ({selectedProduct.unit})</label>
                    <input 
                      type="number"
                      value={adjustmentQty}
                      onChange={(e) => setAdjustmentQty(e.target.value)}
                      className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 font-black text-slate-700"
                      placeholder="0.00"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Motivo / Observação</label>
                    <textarea 
                      value={adjustmentReason}
                      onChange={(e) => setAdjustmentReason(e.target.value)}
                      className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 font-bold text-slate-700 min-h-[100px]"
                      placeholder="Ex: Compra de insumos, Desperdício..."
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button 
                      onClick={() => setSelectedProduct(null)}
                      className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
                    >
                      Cancelar
                    </button>
                    <button 
                      onClick={handleAdjust}
                      className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-900/20"
                    >
                      Confirmar
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="bg-slate-50 border border-dashed border-slate-200 rounded-[2.5rem] p-12 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                  <History className="w-8 h-8 text-slate-300" />
                </div>
                <div>
                  <p className="font-black text-slate-400 uppercase text-xs tracking-widest">Histórico Rápido</p>
                  <p className="text-slate-400 text-sm mt-2">Selecione um produto para ver o histórico ou realizar ajustes.</p>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

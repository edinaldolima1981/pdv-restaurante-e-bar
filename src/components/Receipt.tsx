import React from 'react';
import { Printer, X, Receipt as ReceiptIcon } from 'lucide-react';
import { OrderItem, Customer } from '../types';
import { formatCurrency } from '../lib/utils';
import { motion } from 'motion/react';

interface ReceiptProps {
  items: OrderItem[];
  customer?: Customer | null;
  guestName?: string;
  tableNumber: number;
  onClose: () => void;
}

export function Receipt({ items, customer, guestName, tableNumber, onClose }: ReceiptProps) {
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const serviceTax = subtotal * 0.1;
  const total = subtotal + serviceTax;
  const date = new Date().toLocaleString('pt-BR');

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm print:p-0 print:bg-white print:backdrop-blur-none">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-md rounded-[2rem] overflow-hidden shadow-2xl print:shadow-none print:max-w-none print:rounded-none"
      >
        <div className="p-6 border-b border-slate-100 flex justify-between items-center print:hidden">
          <div className="flex items-center gap-3">
            <ReceiptIcon className="w-5 h-5 text-blue-600" />
            <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm">Recibo de Consumo</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 space-y-8 print:p-4">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">RESTAURANTE PDV</h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">CNPJ: 00.000.000/0001-00</p>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Rua do Sabor, 123 - Centro</p>
          </div>

          <div className="border-y border-dashed border-slate-200 py-4 space-y-1">
            <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              <span>Mesa: {tableNumber}</span>
              <span>Data: {date}</span>
            </div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Cliente: {customer ? customer.name : (guestName || 'AVULSO')}
            </div>
            {customer?.cpf && (
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                CPF: {customer.cpf}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-12 gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">
              <span className="col-span-6">Item</span>
              <span className="col-span-2 text-center">Qtd</span>
              <span className="col-span-4 text-right">Total</span>
            </div>
            {items.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 text-xs font-bold text-slate-700">
                <span className="col-span-6 uppercase">{item.name}</span>
                <span className="col-span-2 text-center">{item.quantity}</span>
                <span className="col-span-4 text-right">{formatCurrency(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-dashed border-slate-200 pt-4 space-y-2">
            <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-widest">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-widest">
              <span>Taxa de Serviço (10%)</span>
              <span>{formatCurrency(serviceTax)}</span>
            </div>
            <div className="flex justify-between text-lg font-black text-slate-800 uppercase tracking-tighter pt-2 border-t border-slate-100">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>

          <div className="text-center pt-8 space-y-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Obrigado pela preferência!</p>
            <div className="w-full h-12 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100">
              <span className="text-[10px] font-black text-slate-300 tracking-[0.5em]">|||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||</span>
            </div>
          </div>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 print:hidden">
          <button 
            onClick={handlePrint}
            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-900/20 flex items-center justify-center gap-3 hover:scale-105 transition-all"
          >
            <Printer className="w-5 h-5" />
            Imprimir Recibo
          </button>
        </div>
      </motion.div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:hidden {
            display: none !important;
          }
          .fixed.inset-0 {
            position: static !important;
            display: block !important;
            background: none !important;
            padding: 0 !important;
          }
          .print\\:p-0 {
            padding: 0 !important;
          }
          .bg-white.w-full.max-w-md {
            visibility: visible;
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            max-width: none !important;
            margin: 0;
            padding: 0;
            box-shadow: none !important;
          }
          .bg-white.w-full.max-w-md * {
            visibility: visible;
          }
        }
      `}} />
    </div>
  );
}

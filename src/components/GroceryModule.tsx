import React, { useState } from 'react';
import { Search, Plus, Minus, ShoppingCart, X, CreditCard, QrCode, DollarSign, Receipt as ReceiptIcon } from 'lucide-react';
import { Product, OrderItem, Category } from '../types';
import { cn, formatCurrency } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';

interface GroceryModuleProps {
  products: Product[];
  categories: Category[];
  onCompleteSale: (items: OrderItem[], paymentMethod: string) => void;
}

export function GroceryModule({ products, categories, onCompleteSale }: GroceryModuleProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>('card');
  const [saleId, setSaleId] = useState('');

  const groceryCategories = categories.filter(c => c.type === 'grocery');
  const displayCategories = groceryCategories.length > 0 ? groceryCategories : categories;

  const handleOpenPayment = () => {
    setSaleId(`GROCERY-SALE-${Date.now()}`);
    setIsPaymentModalOpen(true);
  };

  const filteredProducts = products.filter(p => {
    const category = categories.find(c => c.id === p.categoryId);
    // If we have grocery categories, only show products from them
    if (groceryCategories.length > 0 && category?.type !== 'grocery') return false;
    
    const matchesCategory = selectedCategory === 'all' || p.categoryId === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        return prev.map(item => 
          item.productId === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prev, { 
        id: Math.random().toString(36).substr(2, 9),
        productId: product.id, 
        categoryId: product.categoryId,
        name: product.name, 
        price: product.price, 
        quantity: 1,
        status: 'closed',
        timestamp: new Date().toISOString()
      }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === productId);
      if (existing?.quantity === 1) {
        return prev.filter(item => item.productId !== productId);
      }
      return prev.map(item => 
        item.productId === productId 
          ? { ...item, quantity: item.quantity - 1 } 
          : item
      );
    });
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleFinishSale = () => {
    onCompleteSale(cart, paymentMethod);
    setCart([]);
    setIsPaymentModalOpen(false);
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden bg-slate-50">
      {/* Left: Product Catalog */}
      <div className="flex-1 flex flex-col overflow-hidden border-r border-slate-200">
        <div className="p-6 bg-white border-b border-slate-200 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase">Mercearia</h2>
              <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Venda Rápida / Balcão</p>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="text"
                placeholder="Buscar produto..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-300"
              />
            </div>
          </div>

          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={cn(
                "px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap",
                selectedCategory === 'all' 
                  ? "bg-[#003087] text-white shadow-lg shadow-blue-900/20" 
                  : "bg-slate-100 text-slate-400 hover:bg-slate-200"
              )}
            >
              Todos
            </button>
            {displayCategories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  "px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap",
                  selectedCategory === cat.id 
                    ? "bg-[#003087] text-white shadow-lg shadow-blue-900/20" 
                    : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 custom-scrollbar">
          {filteredProducts.map(product => {
            const inCart = cart.find(item => item.productId === product.id);
            return (
              <div 
                key={product.id}
                onClick={() => addToCart(product)}
                className="bg-white border border-slate-100 rounded-[2rem] p-5 flex flex-col gap-5 group hover:border-blue-200 hover:shadow-xl hover:shadow-blue-900/5 transition-all cursor-pointer relative"
              >
                <div className="aspect-square rounded-[1.5rem] overflow-hidden bg-slate-50 relative">
                  <img 
                    src={product.image} 
                    alt={product.name} 
                    className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                  />
                  {inCart && (
                    <div className="absolute top-3 right-3 bg-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-black text-sm shadow-lg animate-in zoom-in duration-300">
                      {inCart.quantity}
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="font-black text-slate-800 text-lg leading-tight line-clamp-2">{product.name}</h4>
                  <p className="text-blue-600 font-black text-2xl mt-1">{formatCurrency(product.price)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right: Checkout */}
      <div className="w-full lg:w-[450px] bg-white flex flex-col border-l border-slate-200 shadow-2xl">
        <div className="p-8 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3 tracking-tight uppercase">
            <ShoppingCart className="w-8 h-8 text-blue-600" />
            Carrinho
            {cart.length > 0 && (
              <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs">
                {cart.reduce((s, i) => s + i.quantity, 0)}
              </span>
            )}
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-4 custom-scrollbar">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-6">
              <div className="w-32 h-32 bg-slate-50 rounded-full flex items-center justify-center border-4 border-dashed border-slate-100">
                <ShoppingCart className="w-16 h-16 opacity-10" />
              </div>
              <p className="text-sm font-black uppercase tracking-[0.2em]">Carrinho Vazio</p>
            </div>
          ) : (
            cart.map(item => (
              <motion.div 
                key={item.productId}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex justify-between items-center bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm group"
              >
                <div className="flex-1 min-w-0 mr-4">
                  <p className="text-lg font-black text-slate-800 truncate">{item.name}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-3 bg-slate-100 rounded-xl p-1">
                      <button 
                        onClick={() => removeFromCart(item.productId)}
                        className="w-8 h-8 flex items-center justify-center bg-white text-slate-400 hover:text-red-500 rounded-lg transition-colors shadow-sm"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-6 text-center font-black text-slate-700 text-sm">{item.quantity}</span>
                      <button 
                        onClick={() => addToCart(products.find(p => p.id === item.productId)!)}
                        className="w-8 h-8 flex items-center justify-center bg-white text-slate-400 hover:text-blue-600 rounded-lg transition-colors shadow-sm"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <span className="text-slate-400 font-bold text-sm">x {formatCurrency(item.price)}</span>
                  </div>
                </div>
                <p className="text-xl font-black text-blue-600">
                  {formatCurrency(item.price * item.quantity)}
                </p>
              </motion.div>
            ))
          )}
        </div>

        <div className="p-8 border-t border-slate-100 bg-slate-50/50 space-y-6">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">Subtotal</span>
              <span className="text-slate-800 font-black text-lg">{formatCurrency(cartTotal)}</span>
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-slate-200">
              <span className="text-xl font-black text-slate-800 uppercase tracking-tight">Total</span>
              <span className="text-4xl font-black text-blue-600">{formatCurrency(cartTotal)}</span>
            </div>
          </div>

          <button 
            disabled={cart.length === 0}
            onClick={handleOpenPayment}
            className="w-full py-6 bg-[#003087] hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] transition-all shadow-2xl shadow-blue-900/20 active:scale-95"
          >
            Finalizar Venda
          </button>
        </div>
      </div>

      {/* Payment Modal */}
      <AnimatePresence>
        {isPaymentModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-[3rem] w-full max-w-md p-10 shadow-2xl overflow-hidden relative"
            >
              <button 
                onClick={() => setIsPaymentModalOpen(false)}
                className="absolute top-8 right-8 p-3 hover:bg-slate-100 rounded-2xl text-slate-400 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="text-center mb-10">
                <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">Pagamento</h3>
                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-2">Escolha o método de pagamento</p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-10">
                {[
                  { id: 'card', label: 'Cartão', icon: CreditCard },
                  { id: 'pix', label: 'PIX', icon: QrCode },
                  { id: 'cash', label: 'Dinheiro', icon: DollarSign },
                  { id: 'other', label: 'Outros', icon: ReceiptIcon }
                ].map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id)}
                    className={cn(
                      "p-8 rounded-[2rem] border-4 flex flex-col items-center gap-4 transition-all",
                      paymentMethod === method.id 
                        ? "bg-blue-50 border-blue-600 text-blue-600 shadow-xl shadow-blue-900/10" 
                        : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
                    )}
                  >
                    <method.icon className="w-10 h-10" />
                    <span className="font-black text-xs uppercase tracking-widest">{method.label}</span>
                  </button>
                ))}
              </div>

              {paymentMethod === 'pix' && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center gap-6 mb-10 p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100"
                >
                  <div className="p-6 bg-white rounded-3xl shadow-sm border border-slate-100">
                    <QRCodeSVG 
                      value={`${saleId}-${cartTotal}`} 
                      size={180}
                    />
                  </div>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Escaneie para pagar</p>
                </motion.div>
              )}

              <div className="space-y-6">
                <div className="flex justify-between items-center px-4">
                  <span className="text-slate-400 font-bold text-sm uppercase tracking-widest">Total a Pagar</span>
                  <span className="text-4xl font-black text-slate-800">
                    {formatCurrency(cartTotal)}
                  </span>
                </div>

                <button 
                  onClick={handleFinishSale}
                  className="w-full py-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-emerald-900/20 transition-all active:scale-95"
                >
                  Confirmar Venda
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Product, Category, OrderItem } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, Plus, Minus, CheckCircle2, UtensilsCrossed, ChevronRight } from 'lucide-react';

interface CustomerMenuProps {
  categories: Category[];
  products: Product[];
  onSubmitOrder: (tableId: string, items: OrderItem[]) => void;
}

export function CustomerMenu({ categories, products, onSubmitOrder }: CustomerMenuProps) {
  const { tableId } = useParams<{ tableId: string }>();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const filteredProducts = selectedCategory === 'all' 
    ? products 
    : products.filter(p => p.categoryId === selectedCategory);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === productId);
      if (existing?.quantity === 1) {
        return prev.filter(item => item.product.id !== productId);
      }
      return prev.map(item => 
        item.product.id === productId 
          ? { ...item, quantity: item.quantity - 1 } 
          : item
      );
    });
  };

  const total = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  const handleSubmit = () => {
    if (!tableId || cart.length === 0) return;
    
    const orderItems: OrderItem[] = cart.map(item => ({
      id: Math.random().toString(36).substring(2, 9),
      productId: item.product.id,
      name: item.product.name,
      price: item.product.price,
      quantity: item.quantity,
      status: 'awaiting_confirmation',
      timestamp: new Date().toISOString()
    }));

    onSubmitOrder(tableId, orderItems);
    setIsSubmitted(true);
    setCart([]);
    setIsCartOpen(false);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 text-center">
        <motion.div 
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-8"
        >
          <CheckCircle2 className="w-12 h-12" />
        </motion.div>
        <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tight mb-4">Pedido Enviado!</h1>
        <p className="text-slate-500 font-medium mb-8">
          Seu pedido foi enviado para a mesa {tableId}. <br />
          Um garçom virá em breve para confirmar.
        </p>
        <button 
          onClick={() => setIsSubmitted(false)}
          className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-blue-900/20"
        >
          Fazer mais pedidos
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 p-6 sticky top-0 z-30">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-black text-slate-800 uppercase tracking-tight">Cardápio Digital</h1>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Mesa {tableId}</p>
          </div>
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-900/20">
            <UtensilsCrossed className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="px-6 py-4 flex gap-3 overflow-x-auto custom-scrollbar bg-white border-b border-slate-100 sticky top-[88px] z-20">
        <button
          onClick={() => setSelectedCategory('all')}
          className={cn(
            "px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all border-2 shrink-0",
            selectedCategory === 'all' 
              ? "bg-blue-600 border-blue-600 text-white shadow-md" 
              : "bg-white border-slate-100 text-slate-400"
          )}
        >
          Todos
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={cn(
              "px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all border-2 shrink-0",
              selectedCategory === cat.id 
                ? "bg-blue-600 border-blue-600 text-white shadow-md" 
                : "bg-white border-slate-100 text-slate-400"
            )}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Products */}
      <div className="p-6 grid grid-cols-1 gap-4">
        {filteredProducts.map(product => {
          const cartItem = cart.find(item => item.product.id === product.id);
          return (
            <motion.div 
              layout
              key={product.id}
              className="bg-white p-4 rounded-3xl border border-slate-100 flex items-center gap-4 shadow-sm"
            >
              {product.image ? (
                <img 
                  src={product.image} 
                  alt={product.name} 
                  className="w-20 h-20 rounded-2xl object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300">
                  <ShoppingBag className="w-8 h-8" />
                </div>
              )}
              <div className="flex-1">
                <h3 className="font-black text-slate-800 text-sm uppercase tracking-tight">{product.name}</h3>
                <p className="text-blue-600 font-black text-base mt-1">{formatCurrency(product.price)}</p>
              </div>
              <div className="flex items-center gap-3">
                {cartItem && (
                  <>
                    <button 
                      onClick={() => removeFromCart(product.id)}
                      className="w-8 h-8 bg-slate-100 text-slate-600 rounded-lg flex items-center justify-center"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="font-black text-slate-800 w-4 text-center">{cartItem.quantity}</span>
                  </>
                )}
                <button 
                  onClick={() => addToCart(product)}
                  className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center shadow-md shadow-blue-900/20"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Cart Bar */}
      <AnimatePresence>
        {cart.length > 0 && (
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-8 left-6 right-6 z-40"
          >
            <button 
              onClick={() => setIsCartOpen(true)}
              className="w-full bg-blue-600 text-white p-6 rounded-[2rem] shadow-2xl shadow-blue-900/40 flex justify-between items-center"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Ver Sacola</p>
                  <p className="font-black text-lg">{cart.length} {cart.length === 1 ? 'item' : 'itens'}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <p className="font-black text-xl">{formatCurrency(total)}</p>
                <ChevronRight className="w-6 h-6" />
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart Modal */}
      <AnimatePresence>
        {isCartOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="bg-white w-full max-w-lg rounded-t-[3rem] p-8 space-y-8"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Sua Sacola</h2>
                <button onClick={() => setIsCartOpen(false)} className="p-2 bg-slate-100 rounded-xl text-slate-400">
                  <Minus className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4 max-h-[40vh] overflow-y-auto custom-scrollbar">
                {cart.map(item => (
                  <div key={item.product.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div>
                      <p className="font-black text-slate-800 text-sm uppercase tracking-tight">{item.product.name}</p>
                      <p className="text-xs text-slate-400 font-bold mt-1">{item.quantity}x {formatCurrency(item.product.price)}</p>
                    </div>
                    <p className="font-black text-slate-800">{formatCurrency(item.product.price * item.quantity)}</p>
                  </div>
                ))}
              </div>

              <div className="pt-6 border-t border-slate-100 space-y-6">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-black text-xs uppercase tracking-widest">Total do Pedido</span>
                  <span className="text-3xl font-black text-blue-600">{formatCurrency(total)}</span>
                </div>
                <button 
                  onClick={handleSubmit}
                  className="w-full py-6 bg-blue-600 text-white rounded-[1.5rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-blue-900/20"
                >
                  Confirmar e Enviar Pedido
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

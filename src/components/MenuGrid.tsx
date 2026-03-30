import React, { useState } from 'react';
import { Search, Plus, Minus, ShoppingCart, X, Edit, Trash2 } from 'lucide-react';
import { Product, OrderItem, Category } from '../types';
import { cn, formatCurrency } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface MenuGridProps {
  onAddOrder: (items: OrderItem[]) => void;
  onClose: () => void;
  tableName: string;
  products: Product[];
  categories: Category[];
  onEditProduct?: (product: Product) => void;
  onDeleteProduct?: (id: string) => void;
  guestName?: string | null;
  onChangeGuestName?: () => void;
  currentItems?: OrderItem[];
  showCloseButton?: boolean;
}

export function MenuGrid({ 
  onAddOrder, 
  onClose, 
  tableName, 
  products, 
  categories, 
  onEditProduct, 
  onDeleteProduct, 
  guestName, 
  onChangeGuestName, 
  currentItems = [],
  showCloseButton = true
}: MenuGridProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [isCartExpanded, setIsCartExpanded] = useState(false);
  const [activeCartTab, setActiveCartTab] = useState<'new' | 'history'>('new');

  const filteredProducts = products.filter(p => {
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
        name: product.name, 
        price: product.price, 
        quantity: 1,
        status: 'pending',
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white border border-slate-200 w-full max-w-7xl h-full lg:h-[95vh] rounded-none lg:rounded-[3rem] overflow-hidden flex flex-col lg:flex-row shadow-2xl shadow-slate-900/20"
      >
        {/* Left: Menu */}
        <div className="flex-1 flex flex-col border-r border-slate-100 overflow-hidden relative">
          <div className="p-3 sm:p-8 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50/50 gap-3 sm:gap-4">
            <div className="flex justify-between items-start w-full sm:w-auto">
              <div>
                <h2 className="text-lg sm:text-3xl font-black text-slate-800 tracking-tight uppercase">Cardápio</h2>
                <div className="flex items-center gap-2 mt-0.5 sm:mt-1">
                  <p className="text-slate-400 font-bold text-[8px] sm:text-sm uppercase tracking-widest">Mesa: {tableName}</p>
                  {guestName && (
                    <>
                      <span className="text-slate-300">•</span>
                      <p className="text-blue-600 font-bold text-[8px] sm:text-sm uppercase tracking-widest">{guestName}</p>
                      <button 
                        onClick={onChangeGuestName}
                        className="ml-1 p-1 hover:bg-blue-50 text-blue-400 hover:text-blue-600 rounded-lg transition-colors"
                        title="Trocar Nome"
                      >
                        <Edit className="w-3 h-3" />
                      </button>
                    </>
                  )}
                </div>
              </div>
              {showCloseButton && (
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 sm:hidden"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-5 sm:h-5 text-slate-400" />
              <input 
                type="text"
                placeholder="Buscar produto..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg sm:rounded-2xl pl-9 sm:pl-12 pr-4 sm:pr-6 py-2.5 sm:py-4 text-[10px] sm:text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all w-full sm:w-72 placeholder:text-slate-300"
              />
            </div>
          </div>

          <div className="flex gap-2 sm:gap-3 p-3 sm:p-6 overflow-x-auto no-scrollbar bg-white shrink-0">
            <button
              onClick={() => setSelectedCategory('all')}
              className={cn(
                "px-4 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap",
                selectedCategory === 'all' 
                  ? "bg-[#003087] text-white shadow-lg shadow-blue-900/20" 
                  : "bg-slate-100 text-slate-400 hover:bg-slate-200"
              )}
            >
              Todos
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  "px-4 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap",
                  selectedCategory === cat.id 
                    ? "bg-[#003087] text-white shadow-lg shadow-blue-900/20" 
                    : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-2 sm:p-8 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2 sm:gap-6 bg-slate-50/30 custom-scrollbar pb-32 lg:pb-8">
            {filteredProducts.map(product => {
              const inCart = cart.find(item => item.productId === product.id);
              return (
                <div 
                  key={product.id}
                  className="bg-white border border-slate-100 rounded-xl sm:rounded-[2rem] p-2 sm:p-5 flex flex-row sm:flex-col gap-2.5 sm:gap-5 group hover:border-blue-200 hover:shadow-xl hover:shadow-blue-900/5 transition-all"
                >
                  <div className="w-16 h-16 sm:w-full sm:aspect-square rounded-lg sm:rounded-[1.5rem] overflow-hidden bg-slate-100 relative shrink-0">
                    <img 
                      src={product.image} 
                      alt={product.name} 
                      className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-700"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-0.5 right-0.5 sm:hidden">
                      {inCart && (
                        <div className="bg-blue-600 text-white w-4 h-4 rounded-full flex items-center justify-center font-black text-[7px] shadow-lg">
                          {inCart.quantity}
                        </div>
                      )}
                    </div>
                    <div className="absolute top-2 right-2 hidden sm:flex flex-col gap-1.5">
                      {inCart && (
                        <div className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shadow-lg">
                          {inCart.quantity}
                        </div>
                      )}
                      {onEditProduct && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); onEditProduct(product); }}
                          className="bg-white/90 backdrop-blur-sm text-slate-600 w-8 h-8 rounded-full flex items-center justify-center shadow-lg hover:bg-blue-600 hover:text-white transition-all"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {onDeleteProduct && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); onDeleteProduct(product.id); }}
                          className="bg-white/90 backdrop-blur-sm text-slate-600 w-8 h-8 rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 hover:text-white transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col justify-between min-w-0 py-0.5">
                    <div>
                      <h4 className="font-black text-slate-800 text-xs sm:text-lg leading-tight line-clamp-2">{product.name}</h4>
                      <p className="text-blue-600 font-black text-sm sm:text-2xl mt-0.5 sm:mt-1">{formatCurrency(product.price)}</p>
                    </div>
                    
                    <div className="flex items-center justify-between mt-1.5 sm:mt-0">
                      {inCart ? (
                        <div className="flex items-center gap-1.5 sm:gap-4 bg-slate-100 rounded-lg sm:rounded-2xl p-0.5 sm:p-1 w-full sm:w-auto">
                          <button 
                            onClick={() => removeFromCart(product.id)}
                            className="w-7 h-7 sm:w-10 sm:h-10 flex items-center justify-center bg-white hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-md sm:rounded-xl transition-colors shadow-sm"
                          >
                            <Minus className="w-2.5 h-2.5 sm:w-4 h-4" />
                          </button>
                          <span className="flex-1 sm:flex-none sm:w-8 text-center font-black text-slate-700 text-[10px] sm:text-base">
                            {inCart.quantity}
                          </span>
                          <button 
                            onClick={() => addToCart(product)}
                            className="w-7 h-7 sm:w-10 sm:h-10 flex items-center justify-center bg-white hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-md sm:rounded-xl transition-colors shadow-sm"
                          >
                            <Plus className="w-2.5 h-2.5 sm:w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => addToCart(product)}
                          className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-1.5 sm:py-4 bg-slate-100 hover:bg-[#003087] text-slate-500 hover:text-white rounded-lg sm:rounded-2xl transition-all font-black text-[8px] sm:text-xs uppercase tracking-widest group/btn"
                        >
                          <Plus className="w-2.5 h-2.5 sm:w-4 h-4 group-hover/btn:scale-125 transition-transform" />
                          Adicionar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Cart Summary */}
        <div className={cn(
          "w-full lg:w-[400px] bg-slate-50 flex flex-col border-t lg:border-t-0 lg:border-l border-slate-100 shrink-0 transition-all duration-500",
          "fixed lg:relative bottom-0 left-0 right-0 z-50 lg:z-0",
          isCartExpanded ? "h-[90vh] lg:h-auto" : "h-[70px] lg:h-auto"
        )}>
          <div 
            className="p-4 sm:p-8 border-b border-slate-100 flex flex-col gap-4 bg-white shrink-0 cursor-pointer lg:cursor-default shadow-sm lg:shadow-none"
            onClick={() => {
              if (window.innerWidth < 1024) {
                setIsCartExpanded(!isCartExpanded);
              }
            }}
          >
            <div className="flex justify-between items-center">
              <h3 className="text-sm sm:text-xl font-black text-slate-800 flex items-center gap-2 sm:gap-3 tracking-tight">
                <ShoppingCart className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600" />
                Pedido
                {cart.length > 0 && (
                  <span className="bg-blue-600 text-white px-2 py-0.5 rounded-full text-[10px] sm:text-xs">
                    {cart.reduce((s, i) => s + i.quantity, 0)}
                  </span>
                )}
              </h3>
              <div className="flex items-center gap-3">
                {cart.length > 0 && !isCartExpanded && (
                  <span className="lg:hidden text-blue-600 font-black text-sm">{formatCurrency(cartTotal * 1.1)}</span>
                )}
                <div className="lg:hidden">
                  {isCartExpanded ? (
                    <X className="w-5 h-5 text-slate-400" />
                  ) : (
                    <div className="w-8 h-1 bg-slate-200 rounded-full" />
                  )}
                </div>
                {showCloseButton && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); onClose(); }} 
                    className="p-2 sm:p-3 hover:bg-slate-100 rounded-lg sm:rounded-2xl text-slate-400 transition-colors hidden sm:block"
                  >
                    <X className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  setActiveCartTab('new');
                  if (window.innerWidth < 1024) setIsCartExpanded(true);
                }}
                className={cn(
                  "flex-1 py-2 text-[8px] sm:text-[10px] font-black uppercase tracking-widest rounded-lg transition-all",
                  activeCartTab === 'new' ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                )}
              >
                Novo Pedido
              </button>
              <button 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  setActiveCartTab('history');
                  if (window.innerWidth < 1024) setIsCartExpanded(true);
                }}
                className={cn(
                  "flex-1 py-2 text-[8px] sm:text-[10px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-2",
                  activeCartTab === 'history' ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                )}
              >
                Meus Pedidos
                {currentItems.length > 0 && (
                  <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                )}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-3 sm:space-y-6 custom-scrollbar">
            <AnimatePresence initial={false} mode="wait">
              {activeCartTab === 'new' ? (
                cart.length === 0 ? (
                  <motion.div 
                    key="empty-cart"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="h-full flex flex-col items-center justify-center text-slate-300 space-y-4 py-6 sm:py-12"
                  >
                    <div className="w-12 h-12 sm:w-24 sm:h-24 bg-white rounded-full flex items-center justify-center shadow-sm">
                      <ShoppingCart className="w-6 h-6 sm:w-12 sm:h-12 opacity-20" />
                    </div>
                    <p className="text-[10px] sm:text-sm font-bold uppercase tracking-widest">Nenhum item</p>
                  </motion.div>
                ) : (
                  cart.map(item => (
                    <motion.div 
                      key={item.productId}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="flex justify-between items-center bg-white p-3 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm"
                    >
                      <div className="min-w-0 flex-1 mr-2">
                        <p className="text-xs sm:text-sm font-black text-slate-800 truncate">{item.name}</p>
                        <p className="text-[10px] sm:text-xs text-slate-400 font-bold mt-0.5">
                          {item.quantity}x {formatCurrency(item.price)}
                        </p>
                      </div>
                      <p className="text-xs sm:text-base font-black text-blue-600 shrink-0">
                        {formatCurrency(item.price * item.quantity)}
                      </p>
                    </motion.div>
                  ))
                )
              ) : (
                currentItems.length === 0 ? (
                  <motion.div 
                    key="empty-history"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="h-full flex flex-col items-center justify-center text-slate-300 space-y-4 py-6 sm:py-12"
                  >
                    <div className="w-12 h-12 sm:w-24 sm:h-24 bg-white rounded-full flex items-center justify-center shadow-sm">
                      <ShoppingCart className="w-6 h-6 sm:w-12 sm:h-12 opacity-20" />
                    </div>
                    <p className="text-[10px] sm:text-sm font-bold uppercase tracking-widest">Nenhum pedido realizado</p>
                  </motion.div>
                ) : (
                  <div className="space-y-3">
                    {currentItems.map((item, idx) => (
                      <motion.div 
                        key={item.id || idx}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-white p-3 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs sm:text-sm font-black text-slate-800 truncate">{item.name}</p>
                            <p className="text-[10px] sm:text-xs text-slate-400 font-bold">
                              {item.quantity}x {formatCurrency(item.price)}
                            </p>
                          </div>
                          <p className="text-xs sm:text-base font-black text-slate-800">
                            {formatCurrency(item.price * item.quantity)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {item.status === 'awaiting_confirmation' ? (
                            <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-[7px] sm:text-[9px] font-black uppercase tracking-widest animate-pulse">
                              Aguardando Confirmação
                            </span>
                          ) : item.status === 'pending' ? (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-600 rounded-full text-[7px] sm:text-[9px] font-black uppercase tracking-widest animate-pulse">
                              Pendente
                            </span>
                          ) : item.status === 'preparing' ? (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full text-[7px] sm:text-[9px] font-black uppercase tracking-widest animate-pulse">
                              Preparando
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-600 rounded-full text-[7px] sm:text-[9px] font-black uppercase tracking-widest">
                              Entregue
                            </span>
                          )}
                        </div>
                      </motion.div>
                    ))}
                    <div className="pt-4 mt-4 border-t border-slate-200">
                      <div className="flex justify-between items-center text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                        <span>Total Consumido</span>
                        <span className="text-slate-800 font-black">{formatCurrency(currentItems.reduce((s, i) => s + (i.price * i.quantity), 0) * 1.1)}</span>
                      </div>
                    </div>
                  </div>
                )
              )}
            </AnimatePresence>
          </div>

          <div className="p-4 sm:p-8 border-t border-slate-100 bg-white space-y-3 sm:space-y-5 shrink-0 pb-8 sm:pb-8">
            {activeCartTab === 'new' ? (
              <>
                <div className="hidden sm:block space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Subtotal</span>
                    <span className="text-slate-800 font-black text-xs">{formatCurrency(cartTotal)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Taxa (10%)</span>
                    <span className="text-slate-800 font-black text-xs">{formatCurrency(cartTotal * 0.1)}</span>
                  </div>
                </div>
                <div className="pt-2 sm:pt-6 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-sm sm:text-xl font-black text-slate-800 uppercase tracking-tight">Total</span>
                  <span className="text-lg sm:text-3xl font-black text-blue-600">{formatCurrency(cartTotal * 1.1)}</span>
                </div>
                <button 
                  disabled={cart.length === 0}
                  onClick={() => {
                    onAddOrder(cart);
                    setCart([]);
                    setActiveCartTab('history');
                  }}
                  className="w-full py-4 sm:py-6 bg-[#003087] hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-300 text-white rounded-xl sm:rounded-[1.5rem] font-black text-xs sm:text-sm uppercase tracking-[0.1em] sm:tracking-[0.2em] transition-all shadow-xl shadow-blue-900/20 active:scale-95"
                >
                  Confirmar Pedido
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm sm:text-xl font-black text-slate-800 uppercase tracking-tight">Total Geral</span>
                  <span className="text-lg sm:text-3xl font-black text-blue-600">
                    {formatCurrency(currentItems.reduce((s, i) => s + (i.price * i.quantity), 0) * 1.1)}
                  </span>
                </div>
                <button 
                  onClick={() => {
                    setActiveCartTab('new');
                    setIsCartExpanded(false);
                  }}
                  className="w-full py-4 sm:py-6 bg-white border-2 border-slate-100 text-slate-600 rounded-xl sm:rounded-[1.5rem] font-black text-xs sm:text-sm uppercase tracking-widest transition-all hover:bg-slate-50"
                >
                  Fazer Novo Pedido
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

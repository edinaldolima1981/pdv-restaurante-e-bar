import { useState } from "react";
import { AppLayout } from "@/components/layout";
import { useAuthRequest } from "@/hooks/use-auth";
import {
  useListTables,
  useListOrders,
  useCreateOrder,
  useAddOrderItem,
  useUpdateOrder,
  useListCategories,
  useListProducts,
  Product
} from "@workspace/api-client-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Receipt, Banknote, CreditCard, QrCode, Minus, UtensilsCrossed, ChevronRight } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function PDV() {
  const req = useAuthRequest();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
  const [isPayOpen, setIsPayOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [itemQtys, setItemQtys] = useState<Record<number, number>>({});

  const { data: tables = [] } = useListTables({ request: req });
  const { data: openOrders = [] } = useListOrders({ status: "open" }, { request: req });
  const { data: categories = [] } = useListCategories({ request: req });
  const { data: products = [] } = useListProducts({ request: req });

  const createOrder = useCreateOrder({
    request: req,
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
        queryClient.invalidateQueries({ queryKey: ["/api/tables"] });
        toast({ title: "Mesa aberta!" });
      }
    }
  });

  const addItem = useAddOrderItem({
    request: req,
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      }
    }
  });

  const payOrder = useUpdateOrder({
    request: req,
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
        queryClient.invalidateQueries({ queryKey: ["/api/tables"] });
        setIsPayOpen(false);
        setSelectedTableId(null);
        toast({ title: "Conta paga com sucesso!" });
      }
    }
  });

  const activeOrder = openOrders.find(o => o.tableId === selectedTableId);
  const selectedTable = tables.find(t => t.id === selectedTableId);
  const filteredProducts = selectedCategory
    ? products.filter(p => p.categoryId === selectedCategory)
    : products;

  const handleSelectTable = (tableId: number) => {
    setSelectedTableId(tableId);
    const existing = openOrders.find(o => o.tableId === tableId);
    if (!existing) {
      createOrder.mutate({ data: { tableId } });
    }
  };

  const getQty = (productId: number) => itemQtys[productId] ?? 1;

  const handleAddProduct = (product: Product) => {
    if (!activeOrder) return;
    const qty = getQty(product.id);
    addItem.mutate({
      id: activeOrder.id,
      data: { productId: product.id, quantity: qty }
    });
    toast({ title: `${product.name} x${qty} adicionado` });
  };

  const handlePayment = (method: string) => {
    if (!activeOrder) return;
    payOrder.mutate({ id: activeOrder.id, data: { status: "paid", paymentMethod: method } });
  };

  return (
    <AppLayout>
      <div className="flex h-[calc(100vh-4rem)] gap-0 -mx-8 -mt-8">

        {/* ── Col 1: Table list ── */}
        <div className="w-56 shrink-0 flex flex-col border-r border-slate-200 bg-blue-50/60 h-full overflow-hidden">
          <div className="px-4 pt-4 pb-3 border-b border-slate-200">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Mesas</p>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {tables.map(table => {
              const hasOrder = openOrders.some(o => o.tableId === table.id);
              const isSelected = selectedTableId === table.id;
              return (
                <motion.button
                  key={table.id}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleSelectTable(table.id)}
                  className={`w-full flex items-center justify-between px-3 py-3 rounded-xl border-2 transition-all text-left ${
                    isSelected
                      ? "bg-primary border-primary text-white shadow-md"
                      : hasOrder
                      ? "bg-amber-50 border-amber-300 text-slate-800 hover:border-amber-400"
                      : "bg-white border-slate-200 text-slate-700 hover:border-primary/40 hover:bg-blue-50"
                  }`}
                >
                  <div>
                    <p className={`font-bold text-lg leading-tight ${isSelected ? "text-white" : "text-slate-800"}`}>
                      Mesa {table.number}
                    </p>
                    <p className={`text-xs ${isSelected ? "text-blue-100" : "text-muted-foreground"}`}>
                      {table.capacity} lugares
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {hasOrder && !isSelected && (
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    )}
                    {isSelected && <ChevronRight className="w-4 h-4 text-white/70" />}
                    {!hasOrder && !isSelected && (
                      <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">Livre</span>
                    )}
                    {hasOrder && !isSelected && (
                      <span className="text-[10px] font-medium text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full">Ocupada</span>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* ── Col 2: Product catalog ── */}
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
          {selectedTableId ? (
            <>
              {/* Category filter bar */}
              <div className="shrink-0 flex gap-2 px-5 py-3 border-b border-slate-200 bg-white overflow-x-auto">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                    !selectedCategory ? "bg-primary text-white shadow" : "bg-blue-50 text-muted-foreground hover:bg-blue-100"
                  }`}
                >
                  Todos
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`shrink-0 flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                      selectedCategory === cat.id ? "bg-primary text-white shadow" : "bg-blue-50 text-muted-foreground hover:bg-blue-100"
                    }`}
                  >
                    <span>{cat.emoji}</span>
                    {cat.name}
                  </button>
                ))}
              </div>

              {/* Product grid */}
              <div className="flex-1 overflow-y-auto p-5">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  <AnimatePresence>
                    {filteredProducts.map(product => (
                      <motion.div
                        key={product.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between cursor-pointer hover:border-primary/60 hover:shadow-md transition-all group"
                        onClick={() => handleAddProduct(product)}
                      >
                        <div>
                          <p className="text-lg mb-1">{(categories.find(c => c.id === product.categoryId))?.emoji ?? "🍽️"}</p>
                          <h4 className="font-semibold text-sm text-slate-800 leading-tight group-hover:text-primary transition-colors line-clamp-2">
                            {product.name}
                          </h4>
                          {product.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{product.description}</p>
                          )}
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                          <span className="font-bold text-primary text-sm">{formatCurrency(product.price)}</span>
                          <div className="flex items-center gap-1 bg-blue-50 rounded-lg px-1 py-0.5" onClick={e => e.stopPropagation()}>
                            <button
                              className="w-5 h-5 flex items-center justify-center text-slate-600 hover:text-primary"
                              onClick={() => setItemQtys(prev => ({ ...prev, [product.id]: Math.max(1, getQty(product.id) - 1) }))}
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs font-bold text-slate-800 w-4 text-center">{getQty(product.id)}</span>
                            <button
                              className="w-5 h-5 flex items-center justify-center text-slate-600 hover:text-primary"
                              onClick={() => setItemQtys(prev => ({ ...prev, [product.id]: getQty(product.id) + 1 }))}
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        <button
                          className="mt-2 w-full py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary hover:text-white transition-all"
                          onClick={e => { e.stopPropagation(); handleAddProduct(product); }}
                        >
                          + Adicionar
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {filteredProducts.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 text-muted-foreground">
                      <UtensilsCrossed className="w-12 h-12 opacity-20 mb-3" />
                      <p>Nenhum produto nesta categoria.</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-4">
              <UtensilsCrossed className="w-16 h-16 opacity-20" />
              <div className="text-center">
                <p className="font-semibold text-slate-600">Selecione uma mesa</p>
                <p className="text-sm">para iniciar ou continuar um pedido</p>
              </div>
            </div>
          )}
        </div>

        {/* ── Col 3: Order panel ── */}
        <div className="w-80 shrink-0 flex flex-col border-l border-slate-200 bg-white h-full overflow-hidden">
          {selectedTable ? (
            <>
              {/* Header */}
              <div className="px-5 py-4 border-b border-slate-100 bg-primary/5 shrink-0">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-display font-bold text-lg text-slate-800">Mesa {selectedTable.number}</h3>
                    {activeOrder
                      ? <p className="text-xs text-muted-foreground">Pedido #{activeOrder.id} · {activeOrder.items.length} itens</p>
                      : <p className="text-xs text-amber-600">Abrindo pedido…</p>
                    }
                  </div>
                  <Badge variant={openOrders.some(o => o.tableId === selectedTableId) ? "warning" : "success"}>
                    {openOrders.some(o => o.tableId === selectedTableId) ? "Ocupada" : "Livre"}
                  </Badge>
                </div>
              </div>

              {/* Items list */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {activeOrder?.items.map(item => (
                  <div key={item.id} className="flex items-start justify-between bg-blue-50/70 rounded-xl px-3 py-2.5 border border-slate-100">
                    <div className="flex-1 mr-2">
                      <p className="text-sm font-medium text-slate-800 leading-tight">{item.productName}</p>
                      <p className="text-xs text-muted-foreground">{item.quantity}x {formatCurrency(item.unitPrice)}</p>
                    </div>
                    <p className="font-bold text-sm text-primary shrink-0">{formatCurrency(item.totalPrice)}</p>
                  </div>
                ))}
                {(!activeOrder || activeOrder.items.length === 0) && (
                  <div className="flex flex-col items-center justify-center py-16 text-muted-foreground text-sm text-center gap-2">
                    <UtensilsCrossed className="w-8 h-8 opacity-20" />
                    <p>Clique nos produtos ao lado para adicionar ao pedido</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="shrink-0 border-t border-slate-200 p-4 bg-slate-50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">Total</span>
                  <span className="text-2xl font-bold text-slate-800">{formatCurrency(activeOrder?.total ?? 0)}</span>
                </div>
                <Button
                  className="w-full"
                  disabled={!activeOrder || activeOrder.items.length === 0}
                  onClick={() => setIsPayOpen(true)}
                >
                  <Receipt className="w-4 h-4 mr-2" />
                  Finalizar e Pagar
                </Button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-6 text-center gap-3">
              <Receipt className="w-10 h-10 opacity-20" />
              <p className="text-sm">O pedido aparece aqui depois de selecionar uma mesa.</p>
            </div>
          )}
        </div>

      </div>

      {/* Payment Modal */}
      <Dialog open={isPayOpen} onOpenChange={setIsPayOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Finalizar Pagamento</DialogTitle>
          </DialogHeader>
          <div className="py-6 text-center">
            <p className="text-sm text-muted-foreground mb-1">Mesa {selectedTable?.number} · Total a pagar</p>
            <p className="text-5xl font-display font-bold text-slate-800">{formatCurrency(activeOrder?.total ?? 0)}</p>
          </div>
          <div className="grid grid-cols-3 gap-3 pb-2">
            <button
              onClick={() => handlePayment("dinheiro")}
              className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 transition-all group"
            >
              <Banknote className="w-7 h-7 text-emerald-500" />
              <span className="text-xs font-semibold text-slate-700">Dinheiro</span>
            </button>
            <button
              onClick={() => handlePayment("cartao")}
              className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-all group"
            >
              <CreditCard className="w-7 h-7 text-blue-500" />
              <span className="text-xs font-semibold text-slate-700">Cartão</span>
            </button>
            <button
              onClick={() => handlePayment("pix")}
              className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-slate-200 hover:border-teal-400 hover:bg-teal-50 transition-all group"
            >
              <QrCode className="w-7 h-7 text-teal-500" />
              <span className="text-xs font-semibold text-slate-700">PIX</span>
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

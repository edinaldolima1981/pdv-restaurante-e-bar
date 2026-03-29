import { useState } from "react";
import { AppLayout } from "@/components/layout";
import { useAuthRequest } from "@/hooks/use-auth";
import {
  useListProducts,
  useListCategories,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { Plus, Trash2, Edit2, Tag, Package } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

type Tab = "produtos" | "categorias";

const EMOJI_OPTIONS = ["🍽️","🥗","🍕","🍔","🥩","🍣","🍜","🍰","🥤","☕","🍺","🧃","🌮","🥐","🍦"];
const COLOR_OPTIONS = ["#f97316","#10b981","#3b82f6","#ec4899","#ef4444","#8b5cf6","#f59e0b","#06b6d4","#84cc16","#6366f1"];

export default function Menu() {
  const req = useAuthRequest();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [tab, setTab] = useState<Tab>("produtos");
  const [filterCat, setFilterCat] = useState<number | null>(null);

  const { data: products = [] } = useListProducts({ request: req });
  const { data: categories = [] } = useListCategories({ request: req });

  const [isProductOpen, setIsProductOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [pForm, setPForm] = useState({ name: "", price: "", categoryId: "", description: "", available: true });

  const [isCatOpen, setIsCatOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<any>(null);
  const [cForm, setCForm] = useState({ name: "", color: "#f97316", icon: "🍽️" });

  const createProduct = useCreateProduct({ request: req, mutation: { onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/products"] }); setIsProductOpen(false); toast({ title: "Produto criado!" }); }, onError: () => toast({ variant: "destructive", title: "Erro ao criar produto" }) } });
  const updateProduct = useUpdateProduct({ request: req, mutation: { onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/products"] }); setIsProductOpen(false); toast({ title: "Produto atualizado!" }); }, onError: () => toast({ variant: "destructive", title: "Erro ao atualizar produto" }) } });
  const deleteProduct = useDeleteProduct({ request: req, mutation: { onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/products"] }); toast({ title: "Produto removido!" }); } } });

  const createCat = useCreateCategory({ request: req, mutation: { onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/categories"] }); setIsCatOpen(false); toast({ title: "Categoria criada!" }); }, onError: () => toast({ variant: "destructive", title: "Erro ao criar categoria" }) } });
  const updateCat = useUpdateCategory({ request: req, mutation: { onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/categories"] }); setIsCatOpen(false); toast({ title: "Categoria atualizada!" }); }, onError: () => toast({ variant: "destructive", title: "Erro ao atualizar" }) } });
  const deleteCat = useDeleteCategory({ request: req, mutation: { onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/categories"] }); toast({ title: "Categoria removida!" }); } } });

  const openNewProduct = () => { setEditingProduct(null); setPForm({ name: "", price: "", categoryId: "", description: "", available: true }); setIsProductOpen(true); };
  const openEditProduct = (p: any) => { setEditingProduct(p); setPForm({ name: p.name, price: String(p.price), categoryId: p.categoryId ? String(p.categoryId) : "", description: p.description || "", available: p.available }); setIsProductOpen(true); };
  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { name: pForm.name, price: parseFloat(pForm.price), categoryId: pForm.categoryId ? parseInt(pForm.categoryId) : undefined, description: pForm.description, available: pForm.available };
    editingProduct ? updateProduct.mutate({ id: editingProduct.id, data }) : createProduct.mutate({ data });
  };

  const openNewCat = () => { setEditingCat(null); setCForm({ name: "", color: "#f97316", icon: "🍽️" }); setIsCatOpen(true); };
  const openEditCat = (c: any) => { setEditingCat(c); setCForm({ name: c.name, color: c.color || "#f97316", icon: c.icon || "🍽️" }); setIsCatOpen(true); };
  const handleCatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    editingCat ? updateCat.mutate({ id: editingCat.id, data: cForm }) : createCat.mutate({ data: cForm });
  };

  const filteredProducts = filterCat ? products.filter(p => p.categoryId === filterCat) : products;

  return (
    <AppLayout>
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-800 mb-2">Cardápio</h1>
          <p className="text-muted-foreground">Gerencie categorias e produtos do seu restaurante.</p>
        </div>
        <Button onClick={tab === "produtos" ? openNewProduct : openNewCat}>
          <Plus className="w-5 h-5 mr-2" />
          {tab === "produtos" ? "Novo Produto" : "Nova Categoria"}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 p-1 bg-blue-50 rounded-2xl w-fit">
        {([["produtos", Package, "Produtos"], ["categorias", Tag, "Categorias"]] as const).map(([key, Icon, label]) => (
          <button key={key} onClick={() => setTab(key)} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === key ? "bg-primary text-white shadow" : "text-muted-foreground hover:text-foreground"}`}>
            <Icon className="w-4 h-4" /> {label} ({key === "produtos" ? products.length : categories.length})
          </button>
        ))}
      </div>

      {/* Products Tab */}
      {tab === "produtos" && (
        <>
          <div className="flex gap-2 flex-wrap mb-6">
            <button onClick={() => setFilterCat(null)} className={`px-4 py-1.5 rounded-full text-sm transition-all ${!filterCat ? "bg-primary text-white" : "bg-blue-50 text-muted-foreground hover:bg-blue-100/60"}`}>Todos</button>
            {categories.map(cat => (
              <button key={cat.id} onClick={() => setFilterCat(cat.id)} className={`px-4 py-1.5 rounded-full text-sm transition-all ${filterCat === cat.id ? "bg-primary text-white" : "bg-blue-50 text-muted-foreground hover:bg-blue-100/60"}`}>
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>

          {filteredProducts.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <Package className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg mb-4">Nenhum produto encontrado.</p>
              <Button onClick={openNewProduct}><Plus className="w-4 h-4 mr-2" /> Adicionar Produto</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map(product => (
                <Card key={product.id} className="overflow-hidden group cursor-pointer hover:border-primary/30 transition-all" onClick={() => openEditProduct(product)}>
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-base text-slate-800 leading-tight flex-1 mr-2">{product.name}</h3>
                      <span className="font-bold text-primary whitespace-nowrap">{formatCurrency(product.price)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-4 line-clamp-2 min-h-[2.5rem]">{product.description || "—"}</p>
                    <div className="flex justify-between items-center pt-3 border-t border-slate-200">
                      <span className="text-xs bg-blue-50 px-2 py-1 rounded-md text-muted-foreground">{product.categoryName || "Sem categoria"}</span>
                      <div className="flex items-center gap-1">
                        <Badge variant={product.available ? "success" : "secondary"} className="text-xs">{product.available ? "Ativo" : "Inativo"}</Badge>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-blue-400 hover:bg-blue-500/10" onClick={e => { e.stopPropagation(); openEditProduct(product); }}><Edit2 className="w-3 h-3" /></Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-red-400 hover:bg-red-500/10" onClick={e => { e.stopPropagation(); if (confirm(`Remover "${product.name}"?`)) deleteProduct.mutate({ id: product.id }); }}><Trash2 className="w-3 h-3" /></Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Categories Tab */}
      {tab === "categorias" && (
        <>
          {categories.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <Tag className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg mb-4">Nenhuma categoria cadastrada.</p>
              <Button onClick={openNewCat}><Plus className="w-4 h-4 mr-2" /> Criar Categoria</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {categories.map(cat => {
                const count = products.filter(p => p.categoryId === cat.id).length;
                return (
                  <Card key={cat.id} className="overflow-hidden group cursor-pointer hover:border-primary/30 transition-all" onClick={() => openEditCat(cat)}>
                    <div className="p-6">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0" style={{ backgroundColor: (cat.color || "#f97316") + "25", border: `2px solid ${cat.color || "#f97316"}50` }}>
                          {cat.icon || "🍽️"}
                        </div>
                        <div>
                          <h3 className="font-bold text-xl text-slate-800">{cat.name}</h3>
                          <p className="text-sm text-muted-foreground">{count} produto{count !== 1 ? "s" : ""}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color || "#f97316" }} />
                          <span className="text-xs text-muted-foreground font-mono">{cat.color || "#f97316"}</span>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-400 hover:bg-blue-500/10" onClick={e => { e.stopPropagation(); openEditCat(cat); }}><Edit2 className="w-3.5 h-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:bg-red-500/10" onClick={e => { e.stopPropagation(); if (confirm(`Remover "${cat.name}"?`)) deleteCat.mutate({ id: cat.id }); }}><Trash2 className="w-3.5 h-3.5" /></Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Product Dialog */}
      <Dialog open={isProductOpen} onOpenChange={setIsProductOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingProduct ? "Editar Produto" : "Novo Produto"}</DialogTitle></DialogHeader>
          <form onSubmit={handleProductSubmit} className="space-y-4 pt-2">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Nome *</label>
              <Input required value={pForm.name} onChange={e => setPForm({ ...pForm, name: e.target.value })} placeholder="Ex: Filé ao Molho" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">Preço (R$) *</label>
                <Input type="number" step="0.01" min="0" required value={pForm.price} onChange={e => setPForm({ ...pForm, price: e.target.value })} placeholder="0,00" />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">Categoria</label>
                <select className="flex h-12 w-full rounded-xl border border-slate-200 bg-blue-50/80 px-4 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/50" value={pForm.categoryId} onChange={e => setPForm({ ...pForm, categoryId: e.target.value })}>
                  <option value="" className="bg-card">Sem categoria</option>
                  {categories.map(c => <option key={c.id} value={c.id} className="bg-card">{c.icon} {c.name}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Descrição</label>
              <Input value={pForm.description} onChange={e => setPForm({ ...pForm, description: e.target.value })} placeholder="Ingredientes, detalhes..." />
            </div>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setPForm({ ...pForm, available: !pForm.available })} className={`relative w-12 h-6 rounded-full transition-colors shrink-0 ${pForm.available ? "bg-primary" : "bg-blue-100"}`}>
                <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${pForm.available ? "left-7" : "left-1"}`} />
              </button>
              <span className="text-sm text-muted-foreground">{pForm.available ? "Ativo — aparece no PDV" : "Inativo — não aparece no PDV"}</span>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setIsProductOpen(false)}>Cancelar</Button>
              <Button type="submit" className="flex-1" disabled={createProduct.isPending || updateProduct.isPending}>
                {createProduct.isPending || updateProduct.isPending ? "Salvando..." : editingProduct ? "Salvar Alterações" : "Criar Produto"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Category Dialog */}
      <Dialog open={isCatOpen} onOpenChange={setIsCatOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingCat ? "Editar Categoria" : "Nova Categoria"}</DialogTitle></DialogHeader>
          <form onSubmit={handleCatSubmit} className="space-y-4 pt-2">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Nome *</label>
              <Input required value={cForm.name} onChange={e => setCForm({ ...cForm, name: e.target.value })} placeholder="Ex: Bebidas, Entradas..." />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Ícone</label>
              <div className="flex gap-2 flex-wrap">
                {EMOJI_OPTIONS.map(emoji => (
                  <button key={emoji} type="button" onClick={() => setCForm({ ...cForm, icon: emoji })} className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${cForm.icon === emoji ? "bg-primary/30 ring-2 ring-primary" : "bg-blue-50 hover:bg-blue-100/60"}`}>{emoji}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Cor</label>
              <div className="flex gap-2 flex-wrap">
                {COLOR_OPTIONS.map(color => (
                  <button key={color} type="button" onClick={() => setCForm({ ...cForm, color })} className={`w-8 h-8 rounded-lg transition-all ${cForm.color === color ? "ring-2 ring-white ring-offset-2 ring-offset-background scale-110" : "hover:scale-105"}`} style={{ backgroundColor: color }} />
                ))}
              </div>
            </div>
            <div className="bg-blue-50/80 rounded-xl p-4 border border-slate-200 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0" style={{ backgroundColor: cForm.color + "25", border: `2px solid ${cForm.color}50` }}>{cForm.icon}</div>
              <span className="font-medium text-slate-800">{cForm.name || "Prévia da categoria"}</span>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setIsCatOpen(false)}>Cancelar</Button>
              <Button type="submit" className="flex-1" disabled={createCat.isPending || updateCat.isPending}>
                {createCat.isPending || updateCat.isPending ? "Salvando..." : editingCat ? "Salvar Alterações" : "Criar Categoria"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

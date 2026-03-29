import { useState } from "react";
import { AppLayout } from "@/components/layout";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Edit2, Phone, Mail, User, Search, StickyNote } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

function useCustomers(token: string | null) {
  return useQuery({
    queryKey: ["/api/customers"],
    enabled: !!token,
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/customers`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Erro ao carregar clientes");
      return res.json() as Promise<any[]>;
    },
  });
}

export default function Customers() {
  const { token } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: customers = [], isLoading } = useCustomers(token);

  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: "", phone: "", email: "", notes: "" });

  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  const saveMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const url = editing ? `${BASE}/api/customers/${editing.id}` : `${BASE}/api/customers`;
      const res = await fetch(url, { method: editing ? "PUT" : "POST", headers, body: JSON.stringify(data) });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Erro"); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      setIsOpen(false);
      toast({ title: editing ? "Cliente atualizado!" : "Cliente cadastrado!" });
    },
    onError: (err: any) => toast({ variant: "destructive", title: err.message }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await fetch(`${BASE}/api/customers/${id}`, { method: "DELETE", headers });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      toast({ title: "Cliente removido!" });
    },
  });

  const openNew = () => { setEditing(null); setForm({ name: "", phone: "", email: "", notes: "" }); setIsOpen(true); };
  const openEdit = (c: any) => { setEditing(c); setForm({ name: c.name, phone: c.phone || "", email: c.email || "", notes: c.notes || "" }); setIsOpen(true); };

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); saveMutation.mutate(form); };

  const filtered = customers.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-800 mb-2">Clientes</h1>
          <p className="text-muted-foreground">Cadastre e gerencie seus clientes.</p>
        </div>
        <Button onClick={openNew}><Plus className="w-5 h-5 mr-2" /> Novo Cliente</Button>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          className="pl-11"
          placeholder="Buscar por nome, telefone ou e-mail..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-muted-foreground">Carregando...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <User className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <p className="text-lg mb-4">{search ? "Nenhum cliente encontrado." : "Nenhum cliente cadastrado ainda."}</p>
          {!search && <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" /> Cadastrar Primeiro Cliente</Button>}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(c => (
            <Card key={c.id} className="overflow-hidden group cursor-pointer hover:border-primary/30 transition-all" onClick={() => openEdit(c)}>
              <div className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    <span className="font-bold text-primary text-lg">{c.name?.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-800 truncate">{c.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {new Date(c.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5 text-sm">
                  {c.phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{c.phone}</span>
                    </div>
                  )}
                  {c.email && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{c.email}</span>
                    </div>
                  )}
                  {c.notes && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <StickyNote className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate text-xs">{c.notes}</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-1 mt-4 pt-3 border-t border-slate-200 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-400 hover:bg-blue-500/10" onClick={e => { e.stopPropagation(); openEdit(c); }}><Edit2 className="w-3.5 h-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:bg-red-500/10" onClick={e => { e.stopPropagation(); if (confirm(`Remover "${c.name}"?`)) deleteMutation.mutate(c.id); }}><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Editar Cliente" : "Novo Cliente"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Nome Completo *</label>
              <Input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="João da Silva" />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Telefone / WhatsApp</label>
              <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="(11) 99999-9999" />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">E-mail</label>
              <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="cliente@email.com" />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Observações</label>
              <Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Preferências, alergias, etc..." />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setIsOpen(false)}>Cancelar</Button>
              <Button type="submit" className="flex-1" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Salvando..." : editing ? "Salvar Alterações" : "Cadastrar Cliente"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

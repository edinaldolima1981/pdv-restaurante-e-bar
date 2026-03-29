import { useState } from "react";
import { AppLayout } from "@/components/layout";
import { useAuthRequest } from "@/hooks/use-auth";
import { useListUsers, useCreateUser, useDeleteUser } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Plus, Trash2, UserCog } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export default function Users() {
  const req = useAuthRequest();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: users = [] } = useListUsers({ request: req });
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", username: "", password: "", role: "employee" as "admin"|"employee" });

  const createUser = useCreateUser({
    request: req,
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/users"] });
        setIsAddOpen(false);
        setFormData({ name: "", username: "", password: "", role: "employee" });
        toast({ title: "Usuário criado!" });
      },
      onError: (err: any) => {
        toast({ variant: "destructive", title: "Erro", description: err.response?.data?.error || "Erro ao criar" });
      }
    }
  });

  const deleteUser = useDeleteUser({
    request: req,
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/users"] });
        toast({ title: "Usuário removido!" });
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createUser.mutate({ data: formData });
  };

  return (
    <AppLayout>
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-800 mb-2">Equipe</h1>
          <p className="text-muted-foreground">Gerencie acessos ao sistema.</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)}>
          <Plus className="w-5 h-5 mr-2" /> Novo Usuário
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map(user => (
          <Card key={user.id} className="flex flex-col">
            <div className="p-6 flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center border border-slate-200">
                  <UserCog className="w-6 h-6 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-800">{user.name}</h3>
                  <p className="text-sm text-muted-foreground">@{user.username}</p>
                </div>
              </div>
              <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="capitalize">
                {user.role}
              </Badge>
            </div>
            <div className="p-4 border-t border-slate-200 bg-black/10 flex justify-end">
               <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300 hover:bg-red-500/10" onClick={() => deleteUser.mutate({ id: user.id })}>
                <Trash2 className="w-4 h-4 mr-2" /> Remover
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Usuário</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Nome Completo</label>
              <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Nome de Usuário (Login)</label>
              <Input required value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Senha</label>
              <Input type="password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Perfil</label>
              <select 
                className="flex h-12 w-full rounded-xl border border-slate-200 bg-blue-50/80 px-4 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/50"
                value={formData.role}
                onChange={e => setFormData({...formData, role: e.target.value as "admin"|"employee"})}
              >
                <option value="employee" className="bg-card">Colaborador</option>
                <option value="admin" className="bg-card">Administrador</option>
              </select>
            </div>
            <Button type="submit" className="w-full mt-4" disabled={createUser.isPending}>
              {createUser.isPending ? "Salvando..." : "Criar Usuário"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

import { useState } from "react";
import { AppLayout } from "@/components/layout";
import { useAuthRequest } from "@/hooks/use-auth";
import { useListTables, useCreateTable, useDeleteTable } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Plus, Trash2, Users } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export default function Tables() {
  const req = useAuthRequest();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: tables = [] } = useListTables({ request: req });
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formData, setFormData] = useState({ number: "", capacity: "" });

  const createTable = useCreateTable({
    request: req,
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/tables"] });
        setIsAddOpen(false);
        setFormData({ number: "", capacity: "" });
        toast({ title: "Mesa criada!" });
      }
    }
  });

  const deleteTable = useDeleteTable({
    request: req,
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/tables"] });
        toast({ title: "Mesa removida!" });
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTable.mutate({
      data: {
        number: parseInt(formData.number),
        capacity: parseInt(formData.capacity) || 4,
      }
    });
  };

  return (
    <AppLayout>
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-800 mb-2">Mesas</h1>
          <p className="text-muted-foreground">Gerencie o salão e a capacidade.</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)}>
          <Plus className="w-5 h-5 mr-2" /> Nova Mesa
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {tables.map(table => (
          <Card key={table.id} className="flex flex-col items-center justify-center p-6 relative group text-center">
            <span className="text-4xl font-display font-bold text-slate-800 mb-2">{table.number}</span>
            <div className="flex items-center text-muted-foreground text-sm">
              <Users className="w-4 h-4 mr-1" /> {table.capacity}
            </div>
            <div className="mt-4">
              {table.status === 'available' ? <Badge variant="success">Livre</Badge> : <Badge variant="warning">Ocupada</Badge>}
            </div>
            
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:bg-red-500/20" onClick={() => deleteTable.mutate({ id: table.id })}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Mesa</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Número da Mesa</label>
              <Input type="number" required value={formData.number} onChange={e => setFormData({...formData, number: e.target.value})} />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Capacidade (Pessoas)</label>
              <Input type="number" required value={formData.capacity} onChange={e => setFormData({...formData, capacity: e.target.value})} />
            </div>
            <Button type="submit" className="w-full mt-4" disabled={createTable.isPending}>
              {createTable.isPending ? "Salvando..." : "Criar Mesa"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

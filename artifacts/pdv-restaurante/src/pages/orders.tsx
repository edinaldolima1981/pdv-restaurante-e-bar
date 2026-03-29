import { AppLayout } from "@/components/layout";
import { useAuthRequest } from "@/hooks/use-auth";
import { useListOrders, useUpdateOrder } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Clock } from "lucide-react";

export default function Orders() {
  const req = useAuthRequest();
  const queryClient = useQueryClient();
  const { data: orders = [], isLoading } = useListOrders(undefined, { request: req });

  const updateStatus = useUpdateOrder({
    request: req,
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      }
    }
  });

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'open': return <Badge variant="warning">Aberto</Badge>;
      case 'preparing': return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Preparando</Badge>;
      case 'ready': return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">Pronto</Badge>;
      case 'paid': return <Badge variant="success">Pago</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-slate-800 mb-2">Gestão de Pedidos</h1>
        <p className="text-muted-foreground">Visualize e gerencie todos os pedidos do sistema.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {orders.map(order => (
          <Card key={order.id} className="flex flex-col">
            <div className="p-5 border-b border-slate-200 flex justify-between items-start">
              <div>
                <h3 className="font-bold text-lg text-slate-800">Mesa {order.tableName || order.tableId}</h3>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <Clock className="w-3 h-3" /> {formatDate(order.createdAt)}
                </p>
              </div>
              {getStatusBadge(order.status)}
            </div>
            
            <CardContent className="p-5 flex-1 bg-black/10">
              <div className="space-y-2 mb-4">
                {order.items.map(item => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-slate-800">{item.quantity}x {item.productName}</span>
                    <span className="text-muted-foreground">{formatCurrency(item.totalPrice)}</span>
                  </div>
                ))}
              </div>
              <div className="pt-4 border-t border-slate-200 flex justify-between items-center font-bold">
                <span>Total</span>
                <span className="text-primary text-lg">{formatCurrency(order.total)}</span>
              </div>
            </CardContent>

            {order.status !== 'paid' && order.status !== 'cancelled' && (
              <div className="p-4 border-t border-slate-200 bg-card/50 flex gap-2">
                {order.status === 'open' && (
                  <Button size="sm" className="w-full" onClick={() => updateStatus.mutate({ id: order.id, data: { status: 'preparing' }})}>
                    Preparar
                  </Button>
                )}
                {order.status === 'preparing' && (
                  <Button size="sm" className="w-full bg-purple-600 hover:bg-purple-700" onClick={() => updateStatus.mutate({ id: order.id, data: { status: 'ready' }})}>
                    <CheckCircle2 className="w-4 h-4 mr-2" /> Marcar Pronto
                  </Button>
                )}
              </div>
            )}
          </Card>
        ))}
      </div>
    </AppLayout>
  );
}

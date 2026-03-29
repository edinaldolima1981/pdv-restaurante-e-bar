import { useState } from "react";
import { AppLayout } from "@/components/layout";
import { useAuthRequest } from "@/hooks/use-auth";
import { 
  useGetCurrentCashSession, 
  useOpenCashSession, 
  useCloseCashSession,
  useListCashSessions
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Wallet, TrendingUp, Receipt, History } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Cash() {
  const req = useAuthRequest();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: currentSession, isLoading } = useGetCurrentCashSession({ 
    request: req,
    query: { retry: false } // Avoid retrying on 404 when closed
  });
  
  const { data: history = [] } = useListCashSessions({ request: req });

  const [isOpenModalOpen, setIsOpenModalOpen] = useState(false);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [amount, setAmount] = useState("");

  const openSession = useOpenCashSession({
    request: req,
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/cash/sessions/current"] });
        setIsOpenModalOpen(false);
        setAmount("");
        toast({ title: "Caixa Aberto!" });
      }
    }
  });

  const closeSession = useCloseCashSession({
    request: req,
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/cash/sessions/current"] });
        queryClient.invalidateQueries({ queryKey: ["/api/cash/sessions"] });
        setIsCloseModalOpen(false);
        setAmount("");
        toast({ title: "Caixa Fechado!" });
      }
    }
  });

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-slate-800 mb-2">Controle de Caixa</h1>
        <p className="text-muted-foreground">Gerencie aberturas, fechamentos e fluxo financeiro.</p>
      </div>

      {!isLoading && (
        <Card className="mb-10 border-primary/20 bg-gradient-to-br from-card to-primary/5">
          <div className="p-8 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-6">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg ${currentSession ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                <Wallet className="w-10 h-10" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-800 mb-1">
                  Status: {currentSession ? 'Caixa Aberto' : 'Caixa Fechado'}
                </h2>
                {currentSession && (
                  <p className="text-muted-foreground">Aberto em: {formatDate(currentSession.openedAt)}</p>
                )}
              </div>
            </div>

            {currentSession ? (
              <div className="flex gap-8 text-right">
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Fundo Inicial</p>
                  <p className="text-xl font-bold">{formatCurrency(currentSession.openingBalance)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Vendas (Sessão)</p>
                  <p className="text-xl font-bold text-primary">{formatCurrency(currentSession.totalSales)}</p>
                </div>
                <Button size="lg" variant="destructive" onClick={() => setIsCloseModalOpen(true)}>Fechar Caixa</Button>
              </div>
            ) : (
              <Button size="lg" onClick={() => setIsOpenModalOpen(true)}>Abrir Caixa</Button>
            )}
          </div>
        </Card>
      )}

      <h3 className="text-xl font-display font-bold text-slate-800 mb-4 flex items-center gap-2">
        <History className="w-5 h-5" /> Histórico de Sessões
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {history.filter(s => s.status === 'closed').map(session => (
          <Card key={session.id} className="bg-blue-50/80">
            <CardContent className="p-5">
              <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-200">
                <Badge variant="secondary">Fechado</Badge>
                <span className="text-xs text-muted-foreground">{formatDate(session.openedAt)}</span>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Vendas:</span>
                  <span className="font-bold text-slate-800">{formatCurrency(session.totalSales)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pedidos:</span>
                  <span className="font-bold text-slate-800">{session.totalOrders}</span>
                </div>
                <div className="flex justify-between pt-3 border-t border-slate-200">
                  <span className="text-muted-foreground">Saldo Final:</span>
                  <span className="font-bold text-emerald-400">{formatCurrency(session.closingBalance || 0)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isOpenModalOpen} onOpenChange={setIsOpenModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Abrir Caixa</DialogTitle>
          </DialogHeader>
          <div className="pt-4 space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Fundo de Troco (R$)</label>
              <Input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" />
            </div>
            <Button className="w-full" onClick={() => openSession.mutate({ data: { openingBalance: parseFloat(amount || "0") }})}>
              Confirmar Abertura
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isCloseModalOpen} onOpenChange={setIsCloseModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fechar Caixa</DialogTitle>
          </DialogHeader>
          <div className="pt-4 space-y-4">
            <div className="bg-blue-50/80 p-4 rounded-xl border border-slate-200 mb-4">
              <p className="text-center text-muted-foreground text-sm mb-1">Total em Vendas Calculado</p>
              <p className="text-center text-3xl font-bold text-primary">{formatCurrency(currentSession?.totalSales || 0)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Valor Físico em Caixa (R$)</label>
              <Input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" />
            </div>
            <Button variant="destructive" className="w-full" onClick={() => {
              if (currentSession) closeSession.mutate({ id: currentSession.id, data: { closingBalance: parseFloat(amount || "0") }});
            }}>
              Confirmar Fechamento
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

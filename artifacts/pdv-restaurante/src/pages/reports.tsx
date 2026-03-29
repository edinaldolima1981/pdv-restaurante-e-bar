import { AppLayout } from "@/components/layout";
import { useAuthRequest } from "@/hooks/use-auth";
import { useListCashSessions } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line 
} from 'recharts';

export default function Reports() {
  const req = useAuthRequest();
  const { data: sessions = [] } = useListCashSessions({ request: req });

  // Prepare data for charts
  const closedSessions = sessions.filter(s => s.status === 'closed').slice(-7).reverse();
  
  const chartData = closedSessions.map(s => ({
    name: new Date(s.openedAt).toLocaleDateString('pt-BR', { weekday: 'short' }),
    vendas: s.totalSales,
    pedidos: s.totalOrders
  }));

  const totalSalesAllTime = closedSessions.reduce((acc, s) => acc + s.totalSales, 0);
  const totalOrdersAllTime = closedSessions.reduce((acc, s) => acc + s.totalOrders, 0);

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-slate-800 mb-2">Relatórios Analíticos</h1>
        <p className="text-muted-foreground">Acompanhe o desempenho do seu restaurante.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-primary/20 to-transparent border-primary/20">
          <CardContent className="p-6">
            <p className="text-primary font-medium mb-1">Faturamento Histórico</p>
            <h2 className="text-4xl font-bold text-slate-800">{formatCurrency(totalSalesAllTime)}</h2>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground font-medium mb-1">Total de Pedidos</p>
            <h2 className="text-4xl font-bold text-slate-800">{totalOrdersAllTime}</h2>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground font-medium mb-1">Ticket Médio Geral</p>
            <h2 className="text-4xl font-bold text-slate-800">
              {totalOrdersAllTime > 0 ? formatCurrency(totalSalesAllTime / totalOrdersAllTime) : 'R$ 0,00'}
            </h2>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Evolução de Vendas (Últimos 7 Caixas)</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="name" stroke="#ffffff50" axisLine={false} tickLine={false} />
                <YAxis stroke="#ffffff50" axisLine={false} tickLine={false} tickFormatter={(value) => `R$${value}`} />
                <Tooltip 
                  cursor={{fill: '#ffffff10'}}
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '12px' }}
                />
                <Bar dataKey="vendas" fill="#f97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Volume de Pedidos (Últimos 7 Caixas)</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="name" stroke="#ffffff50" axisLine={false} tickLine={false} />
                <YAxis stroke="#ffffff50" axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '12px' }}
                />
                <Line type="monotone" dataKey="pedidos" stroke="#3b82f6" strokeWidth={3} dot={{r: 4, fill: '#3b82f6', strokeWidth: 2}} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

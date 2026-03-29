import React from 'react';
import { 
  TrendingUp, 
  Users, 
  ShoppingBag, 
  DollarSign,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { cn, formatCurrency } from '../lib/utils';
import { Order, Customer } from '../types';

interface DashboardProps {
  orders: Order[];
  customers: Customer[];
}

export function Dashboard({ orders, customers }: DashboardProps) {
  // Calculate stats
  const today = new Date().toISOString().split('T')[0];
  
  const todayOrders = orders.filter(o => {
    const orderDate = o.createdAt?.toDate ? o.createdAt.toDate().toISOString().split('T')[0] : 
                     (typeof o.createdAt === 'string' ? o.createdAt.split('T')[0] : '');
    return orderDate === today;
  });

  const totalSales = todayOrders.reduce((sum, o) => sum + o.total, 0);
  const totalOrders = todayOrders.length;
  const totalCustomers = customers.length;
  const averageTicket = totalOrders > 0 ? totalSales / totalOrders : 0;

  // Calculate sales by hour
  const salesByHour: { [key: string]: number } = {};
  todayOrders.forEach(o => {
    const date = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt as string);
    const hour = `${date.getHours().toString().padStart(2, '0')}:00`;
    salesByHour[hour] = (salesByHour[hour] || 0) + o.total;
  });

  const chartData = Object.entries(salesByHour)
    .map(([hour, sales]) => ({ hour, sales }))
    .sort((a, b) => a.hour.localeCompare(b.hour));

  // Calculate top products
  const productSales: { [key: string]: { name: string, quantity: number, total: number } } = {};
  orders.forEach(o => {
    o.items.forEach(item => {
      if (!productSales[item.productId]) {
        productSales[item.productId] = { name: item.name, quantity: 0, total: 0 };
      }
      productSales[item.productId].quantity += item.quantity;
      productSales[item.productId].total += item.price * item.quantity;
    });
  });

  const topProducts = Object.values(productSales)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  // If no data for today, show some empty state or default hours
  const displayData = chartData.length > 0 ? chartData : [
    { hour: '11:00', sales: 0 },
    { hour: '12:00', sales: 0 },
    { hour: '13:00', sales: 0 },
    { hour: '18:00', sales: 0 },
    { hour: '19:00', sales: 0 },
    { hour: '20:00', sales: 0 },
  ];

  // Mix de Vendas (Mocked for now as we don't have category in orders easily without joining)
  const PIE_DATA = [
    { name: 'Comidas', value: 65, color: '#3b82f6' },
    { name: 'Bebidas', value: 25, color: '#60a5fa' },
    { name: 'Sobremesas', value: 10, color: '#93c5fd' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase">Visão Geral</h2>
          <p className="text-slate-500 font-medium">Acompanhe o desempenho do seu restaurante hoje.</p>
        </div>
        <div className="flex gap-2">
          <div className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-400 uppercase tracking-widest shadow-sm">
            Hoje
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Vendas Totais" 
          value={formatCurrency(totalSales)} 
          trend="+12.5%" 
          icon={DollarSign} 
          positive 
        />
        <StatCard 
          title="Pedidos Realizados" 
          value={totalOrders.toString()} 
          trend="+5.2%" 
          icon={ShoppingBag} 
          positive 
        />
        <StatCard 
          title="Clientes Cadastrados" 
          value={totalCustomers.toString()} 
          trend="+2.1%" 
          icon={Users} 
          positive 
        />
        <StatCard 
          title="Ticket Médio" 
          value={formatCurrency(averageTicket)} 
          trend="+8.4%" 
          icon={TrendingUp} 
          positive 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
          <h3 className="text-xl font-black text-slate-800 mb-8 uppercase tracking-tight">Vendas por Horário</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={displayData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis 
                  dataKey="hour" 
                  stroke="#94a3b8" 
                  fontSize={10} 
                  fontWeight={700}
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={10} 
                  fontWeight={700}
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(value) => `R$${value}`}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#003087', fontWeight: 800 }}
                />
                <Bar dataKey="sales" fill="#003087" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
          <h3 className="text-xl font-black text-slate-800 mb-8 uppercase tracking-tight">Mix de Vendas</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={PIE_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {PIE_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-4 mt-8">
            {PIE_DATA.map((item) => (
              <div key={item.name} className="flex justify-between items-center bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: item.color }} />
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{item.name}</span>
                </div>
                <span className="text-sm font-black text-slate-800">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
        <h3 className="text-xl font-black text-slate-800 mb-8 uppercase tracking-tight">Produtos Mais Vendidos</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {topProducts.length > 0 ? topProducts.map((product, index) => (
            <div key={product.name} className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex flex-col items-center text-center space-y-4 hover:border-blue-200 hover:bg-blue-50/30 transition-all group">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 font-black text-lg shadow-sm group-hover:scale-110 transition-transform">
                #{index + 1}
              </div>
              <div className="space-y-1">
                <h4 className="font-black text-slate-800 text-sm line-clamp-1">{product.name}</h4>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{product.quantity} unidades</p>
              </div>
              <div className="pt-4 border-t border-slate-200/50 w-full">
                <p className="text-blue-600 font-black text-sm">{formatCurrency(product.total)}</p>
              </div>
            </div>
          )) : (
            <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-300 space-y-4">
              <ShoppingBag className="w-12 h-12 opacity-20" />
              <p className="text-xs font-bold uppercase tracking-widest">Nenhum dado de venda disponível</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  trend: string;
  icon: React.ElementType;
  positive: boolean;
}

function StatCard({ title, value, trend, icon: Icon, positive }: StatCardProps) {
  return (
    <div className="bg-white border border-slate-200 p-8 rounded-[2.5rem] space-y-6 shadow-sm hover:shadow-md transition-all group">
      <div className="flex justify-between items-start">
        <div className="p-4 bg-slate-50 rounded-2xl group-hover:bg-blue-50 transition-colors">
          <Icon className="w-6 h-6 text-blue-600" />
        </div>
        <div className={cn(
          "flex items-center text-[10px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest",
          positive ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
        )}>
          {positive ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
          {trend}
        </div>
      </div>
      <div>
        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{title}</p>
        <h4 className="text-3xl font-black text-slate-800 mt-2 tracking-tight">{value}</h4>
      </div>
    </div>
  );
}

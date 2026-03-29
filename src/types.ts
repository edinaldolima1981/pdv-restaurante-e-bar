export type TableStatus = 'available' | 'occupied' | 'reserved' | 'cleaning';
export type PaymentStatus = 'pending' | 'paid';
export type OrderStatus = 'pending' | 'preparing' | 'delivered' | 'cancelled' | 'closed';

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  cpf?: string;
  rg?: string;
  address?: string;
  birthday?: string;
  observation?: string;
  points?: number;
  lastVisit?: string;
}

export interface Staff {
  id: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  cpf: string;
  rg: string;
  registration: string;
  salary: number;
  commission: number;
  address: string;
  status: 'active' | 'inactive';
  startDate: string;
}

export interface TableAccount {
  id: string;
  customerId: string;
  guestName?: string | null;
  items: OrderItem[];
  hasPendingOrder: boolean;
  openedAt: string;
  paymentStatus: PaymentStatus;
}

export interface Table {
  id: string;
  number: number;
  capacity: number;
  status: TableStatus;
  accounts: TableAccount[];
  hasPendingOrder: boolean;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  categoryId: string;
  image?: string;
  description?: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  status: 'awaiting_confirmation' | 'pending' | 'preparing' | 'delivered';
  timestamp: string;
}

export interface Order {
  id: string;
  tableId: string;
  customerId: string;
  items: OrderItem[];
  status: OrderStatus;
  total: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createdAt: any;
}

export interface DailyStats {
  totalSales: number;
  totalOrders: number;
  averageTicket: number;
  salesByCategory: { name: string; value: number }[];
  hourlySales: { hour: string; sales: number }[];
}

export interface Transaction {
  id: string;
  date: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
}

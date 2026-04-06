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
  visitCount?: number;
  totalSpent?: number;
  loyaltyLevel?: 'bronze' | 'silver' | 'gold' | 'platinum';
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
  permissions?: string[]; // e.g., ['admin', 'sales', 'inventory', 'financial']
}

export interface TableAccount {
  id: string;
  customerId: string;
  guestName?: string | null;
  items: OrderItem[];
  hasPendingOrder: boolean;
  openedAt: string;
  paymentStatus: PaymentStatus;
  paymentMethod?: 'cash' | 'card' | 'pix' | 'other';
  discount?: number;
  tax?: number;
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
  type?: 'kitchen' | 'bar' | 'grocery';
}

export interface Product {
  id: string;
  name: string;
  price: number;
  costPrice?: number;
  categoryId: string;
  image?: string;
  description?: string;
  stock: number;
  minStock: number;
  unit: string; // 'un', 'kg', 'lt', etc.
  trackStock: boolean;
}

export interface OrderItem {
  id: string;
  productId: string;
  categoryId?: string;
  name: string;
  price: number;
  quantity: number;
  status: 'awaiting_confirmation' | 'pending' | 'preparing' | 'delivered' | 'cancelled' | 'closed';
  timestamp: string;
  notes?: string;
}

export interface Order {
  id: string;
  tableId?: string;
  customerId: string;
  items: OrderItem[];
  status: OrderStatus;
  total: number;
  subtotal: number;
  discount: number;
  tax: number;
  paymentMethod: 'cash' | 'card' | 'pix' | 'other';
  type: 'dine_in' | 'delivery' | 'takeaway';
  deliveryAddress?: string;
  deliveryFee?: number;
  createdAt: string | number | Date;
  closedAt?: string | number | Date;
}

export interface DailyStats {
  totalSales: number;
  totalOrders: number;
  averageTicket: number;
  salesByCategory: { name: string; value: number }[];
  hourlySales: { hour: string; sales: number }[];
  profit: number;
}

export interface Transaction {
  id: string;
  date: string;
  type: 'income' | 'expense';
  category: string; // 'sales', 'purchase', 'salary', 'rent', 'other'
  amount: number;
  description: string;
  paymentMethod: 'cash' | 'card' | 'pix' | 'other';
  status: 'pending' | 'completed' | 'cancelled';
}

export interface InventoryLog {
  id: string;
  productId: string;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  reason: string;
  date: string;
  userId: string;
}

export interface AppSettings {
  id: string;
  restaurantModule: boolean;
  groceryModule: boolean;
  appName: string;
}

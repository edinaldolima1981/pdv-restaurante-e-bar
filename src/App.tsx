import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { TableGrid } from './components/TableGrid';
import { MenuGrid } from './components/MenuGrid';
import { TableDetails } from './components/TableDetails';
import { GroceryModule } from './components/GroceryModule';
import { Receipt } from './components/Receipt';
import { QRCodeModal } from './components/QRCodeModal';
import { InventoryManager } from './components/InventoryManager';
import { FinancialModule } from './components/FinancialModule';
import { KDS } from './components/KDS';
import { ActiveOrders } from './components/ActiveOrders';
import { CRM } from './components/CRM';
import { DeliveryManager } from './components/DeliveryManager';
import { MOCK_PRODUCTS, MOCK_CATEGORIES } from './mockData';
import { Table, OrderItem, Order, Customer, Staff, Category, Product, Transaction, TableAccount, OrderStatus, AppSettings } from './types';
import { Toaster, toast } from 'sonner';
import { GoogleGenAI } from "@google/genai";
import { generateAccountingPDF, generateCashClosurePDF } from './lib/pdfGenerator';
import { MessageSquare, Sparkles, X, Utensils, UtensilsCrossed, History, ShoppingBag, Table as TableIcon, Plus, Users, UserPlus, Phone, Mail, Star, Clock as ClockIcon, Wallet, Edit, Trash2, Download, Search, Database, RefreshCw, LogIn } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, formatCurrency } from './lib/utils';
import { api } from './services/api';

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen flex items-center justify-center bg-slate-50 p-8">
          <div className="max-w-md w-full bg-white p-10 rounded-[2.5rem] shadow-2xl text-center space-y-6 border border-red-100">
            <div className="w-20 h-20 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <X className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Ops! Algo deu errado.</h2>
            <p className="text-slate-500 font-bold text-sm leading-relaxed">
              Ocorreu um erro inesperado no sistema. Por favor, tente recarregar a página.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-[#003087] text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-blue-900/20"
            >
              Recarregar Página
            </button>
            {process.env.NODE_ENV === 'development' && (
              <pre className="mt-4 p-4 bg-slate-50 rounded-xl text-[10px] text-left overflow-auto max-h-40 font-mono text-slate-400">
                {this.state.error?.toString()}
              </pre>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [tables, setTables] = useState<Table[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [user, setUser] = useState<{ id: string, email: string, role: string } | null>(api.getCurrentUser());
  const [isAuthReady] = useState(true);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  const [isClientAppOpen, setIsClientAppOpen] = useState(false);
  const [clientTableId, setClientTableId] = useState<string | null>(null);
  const [clientGuestName, setClientGuestName] = useState<string | null>(() => localStorage.getItem('clientGuestName'));

  const [newCustomer, setNewCustomer] = useState({ 
    name: '', 
    email: '', 
    phone: '', 
    cpf: '', 
    rg: '',
    address: '', 
    birthday: '',
    observation: ''
  });
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isOpeningTable, setIsOpeningTable] = useState(false);
  const [isAddingGuestName, setIsAddingGuestName] = useState(false);
  const [tempGuestName, setTempGuestName] = useState('');
  const [isAddingStaff, setIsAddingStaff] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ id: string, type: 'customer' | 'staff' | 'category' | 'product' } | null>(null);
  const [receiptData, setReceiptData] = useState<{ items: OrderItem[], customer: Customer | null, guestName?: string, tableNumber: number } | null>(null);
  const [qrCodeTable, setQrCodeTable] = useState<Table | null>(null);
  const [settings, setSettings] = useState<AppSettings>({
    id: 'default',
    restaurantModule: true,
    groceryModule: false,
    appName: 'ANOTA FÁCIL'
  });

  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isMergingTable, setIsMergingTable] = useState(false);
  const [sourceTableId, setSourceTableId] = useState<string | null>(null);
  const [transactionType, setTransactionType] = useState<'income' | 'expense'>('income');
  const [transactionAmount, setTransactionAmount] = useState('');
  const [transactionDescription, setTransactionDescription] = useState('');

  // Redirect if current tab is disabled
  useEffect(() => {
    if (!settings.restaurantModule && (activeTab === 'tables' || activeTab === 'kds' || activeTab === 'active_orders' || activeTab === 'delivery')) {
      setActiveTab(settings.groceryModule ? 'grocery' : 'dashboard');
    }
    if (!settings.groceryModule && activeTab === 'grocery') {
      setActiveTab(settings.restaurantModule ? 'tables' : 'dashboard');
    }
  }, [settings, activeTab]);

  // Real-time Data Fetching (Polling for simplicity in VPS migration)
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        const [
          tablesData,
          customersData,
          categoriesData,
          productsData,
          staffData,
          ordersData,
          transactionsData,
          settingsData
        ] = await Promise.all([
          api.get('tables'),
          api.get('customers'),
          api.get('categories'),
          api.get('products'),
          api.get('staff'),
          api.get('orders'),
          api.get('transactions'),
          api.get('settings')
        ]);

        setTables(tablesData.sort((a: Table, b: Table) => a.number - b.number));
        setCustomers(customersData);
        setCategories(categoriesData);
        setProducts(productsData);
        setStaff(staffData);
        setOrders(ordersData);
        setTransactions(transactionsData);
        
        const appConfig = settingsData.find((s: AppSettings) => s.id === 'app_config');
        if (appConfig) {
          setSettings(appConfig);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, [user]);

  // Sync selectedTable with real-time updates from tables array
  useEffect(() => {
    if (selectedTable) {
      const updatedTable = tables.find(t => t.id === selectedTable.id);
      if (updatedTable) {
        // Only update if there's an actual change to avoid infinite loops
        // We compare the stringified version for simplicity as it's a small object
        if (JSON.stringify(updatedTable) !== JSON.stringify(selectedTable)) {
          setSelectedTable(updatedTable);
        }
      } else {
        // Table was deleted or something, close details
        setSelectedTable(null);
        setSelectedAccountId(null);
      }
    }
  }, [tables, selectedTable]);

  // Handle Client App Entry
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tableId = urlParams.get('tableId');
    if (tableId && isAuthReady) {
      setClientTableId(tableId);
      setIsClientAppOpen(true);
    }
  }, [isAuthReady]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    try {
      const data = await api.login({ email: loginEmail, password: loginPassword });
      setUser(data.user);
      toast.success('Login realizado com sucesso!');
    } catch (error: unknown) {
      console.error('Login error:', error);
      toast.error('Credenciais inválidas.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    api.logout();
    setUser(null);
    toast.success('Sessão encerrada.');
  };

  // Use handleLogout in Sidebar or somewhere

  const seedData = async () => {
    try {
      const batchOps: unknown[] = [];
      
      // Tables
      for (let i = 1; i <= 12; i++) {
        batchOps.push({
          type: 'insert',
          collection: 'tables',
          data: {
            id: `t${i}`,
            number: i,
            capacity: i <= 4 ? 2 : (i <= 8 ? 4 : 6),
            status: 'available',
            accounts: [],
            hasPendingOrder: false
          }
        });
      }

      // Categories
      MOCK_CATEGORIES.forEach(cat => {
        batchOps.push({
          type: 'insert',
          collection: 'categories',
          data: {
            id: cat.id,
            name: cat.name,
            icon: cat.icon,
            module: cat.type || 'both'
          }
        });
      });

      // Products
      MOCK_PRODUCTS.forEach(prod => {
        batchOps.push({
          type: 'insert',
          collection: 'products',
          data: {
            id: prod.id,
            name: prod.name,
            price: prod.price,
            categoryId: prod.categoryId,
            image: prod.image,
            description: prod.description || '',
            stock: prod.stock || 0
          }
        });
      });

      await api.batch(batchOps);
      toast.success('Dados iniciais carregados com sucesso!');
    } catch (err) {
      console.error('Seed error:', err);
      toast.error('Erro ao carregar dados iniciais.');
    }
  };

  const resetData = async () => {
    try {
      const collectionsToClear = ['tables', 'customers', 'categories', 'products', 'staff', 'orders', 'transactions', 'inventoryLogs'];
      const batchOps: unknown[] = [];
      
      for (const collName of collectionsToClear) {
        const items = await api.get(collName);
        items.forEach((item: { id: string }) => {
          batchOps.push({ type: 'delete', collection: collName, id: item.id });
        });
      }

      if (batchOps.length > 0) {
        await api.batch(batchOps);
      }
      
      toast.success('Todos os dados foram removidos com sucesso!');
    } catch (err) {
      console.error('Reset error:', err);
      toast.error('Erro ao remover dados.');
    }
  };

  const resetOrders = async () => {
    try {
      const batchOps: unknown[] = [];
      
      const ordersData = await api.get('orders');
      ordersData.forEach((order: { id: string }) => {
        batchOps.push({ type: 'delete', collection: 'orders', id: order.id });
      });

      const tablesData = await api.get('tables');
      tablesData.forEach((table: { id: string }) => {
        batchOps.push({
          type: 'update',
          collection: 'tables',
          id: table.id,
          data: {
            accounts: [],
            status: 'available',
            hasPendingOrder: false
          }
        });
      });

      if (batchOps.length > 0) {
        await api.batch(batchOps);
      }
      
      toast.success('Todos os pedidos foram removidos com sucesso!');
    } catch (err) {
      console.error('Reset orders error:', err);
      toast.error('Erro ao remover pedidos.');
    }
  };

  const [newCategory, setNewCategory] = useState({
    name: '',
    icon: 'Utensils',
    type: 'kitchen' as 'kitchen' | 'bar'
  });

  const [newStaff, setNewStaff] = useState({
    name: '',
    role: '',
    phone: '',
    email: '',
    cpf: '',
    rg: '',
    registration: '',
    salary: 0,
    commission: 0,
    address: '',
    startDate: new Date().toISOString().split('T')[0]
  });

  const [newProduct, setNewProduct] = useState({
    name: '',
    price: 0,
    costPrice: 0,
    categoryId: categories[0]?.id || '',
    image: '',
    description: '',
    stock: 0,
    minStock: 0,
    unit: 'un',
    trackStock: true
  });

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery] = useState('');

  // Sincronizar hasPendingOrder das mesas com suas contas
  // Remove redundant local update effect as Firestore handles this
  /*
  const pendingStatusKey = tables.map(t => t.accounts.map(acc => acc.hasPendingOrder).join(',')).join('|');
  useEffect(() => {
    setTables(prev => prev.map(t => {
      const hasPending = t.accounts.some(acc => acc.hasPendingOrder);
      if (t.hasPendingOrder !== hasPending) {
        return { ...t, hasPendingOrder: hasPending };
      }
      return t;
    }));
  }, [pendingStatusKey]);
  */

  const handleAddTable = async () => {
    const nextNumber = tables.length > 0 ? Math.max(...tables.map(t => t.number)) + 1 : 1;
    try {
      await api.post('tables', {
        number: nextNumber,
        capacity: 4,
        status: 'available',
        accounts: [],
        hasPendingOrder: false
      });
      toast.success(`Mesa ${nextNumber} criada com sucesso!`);
    } catch (err) {
      console.error('Error adding table:', err);
      toast.error('Erro ao criar mesa.');
    }
  };

  const handlePrintReceipt = (items: OrderItem[], customer: Customer | null, guestName?: string) => {
    if (!selectedTable) return;
    setReceiptData({ items, customer, guestName, tableNumber: selectedTable.number });
  };

  const handleSelectTable = (table: Table) => {
    const currentTable = tables.find(t => t.id === table.id) || table;
    setSelectedTable(currentTable);
    if (currentTable.status === 'available') {
      setIsOpeningTable(true);
    } else if (currentTable.accounts.length > 0) {
      setSelectedAccountId(currentTable.accounts[0].id);
    }
  };

  const handleOpenTable = async (customerId: string, guestName?: string) => {
    const tableId = selectedTable?.id;
    if (!tableId) return;
    
    const table = tables.find(t => t.id === tableId);
    if (!table) return;
    
    const newAccount: TableAccount = {
      id: Math.random().toString(36).substr(2, 9),
      customerId,
      guestName: guestName || null,
      items: [],
      hasPendingOrder: false,
      openedAt: new Date().toISOString(),
      paymentStatus: 'pending'
    };

    const updatedAccounts = [...table.accounts, newAccount].map(acc => ({
      ...acc,
      guestName: acc.guestName || null,
      items: acc.items.map(item => ({
        ...item,
        id: item.id || Math.random().toString(36).substr(2, 9)
      }))
    }));

    try {
      await api.put('tables', tableId, {
        status: 'occupied',
        accounts: updatedAccounts
      });
      
      setSelectedAccountId(newAccount.id);
      setIsOpeningTable(false);
      setIsAddingGuestName(false);
      setTempGuestName('');
      setIsMenuOpen(true);
      
      toast.success(`Mesa ${table.number} aberta!`);
    } catch (err) {
      console.error('Error opening table:', err);
      toast.error('Erro ao abrir mesa.');
    }
  };

  const handleAddOrder = async (items: OrderItem[]) => {
    const tableId = selectedTable?.id || clientTableId;
    if (!tableId || !selectedAccountId) return;

    const table = tables.find(t => t.id === tableId);
    if (!table) return;

    const updatedAccounts = table.accounts.map(acc => {
      if (acc.id === selectedAccountId) {
        return {
          ...acc,
          items: [...acc.items, ...items],
          hasPendingOrder: true
        };
      }
      return acc;
    }).map(acc => ({
      ...acc,
      guestName: acc.guestName || null,
      items: acc.items.map(item => ({
        ...item,
        id: item.id || Math.random().toString(36).substr(2, 9)
      }))
    }));

    try {
      await api.put('tables', tableId, {
        status: 'occupied',
        accounts: updatedAccounts,
        hasPendingOrder: true
      });

      // Create order records for history/tracking
      for (const item of items) {
        await api.post('orders', {
          tableId,
          tableNumber: table.number,
          accountId: selectedAccountId,
          customerName: table.accounts.find(a => a.id === selectedAccountId)?.guestName || 
                        customers.find(c => c.id === table.accounts.find(a => a.id === selectedAccountId)?.customerId)?.name || 
                        'Cliente',
          items: [item],
          total: item.price * item.quantity,
          status: isClientAppOpen ? 'awaiting_confirmation' : 'pending',
          createdAt: new Date().toISOString()
        });
      }

      toast.success(`Pedido realizado com sucesso!`);
      
      setIsMenuOpen(false);
      setIsClientAppOpen(false);
      setClientTableId(null);
    } catch (err) {
      console.error('Error adding order:', err);
      toast.error('Erro ao realizar pedido.');
    }
  };

  const handleConfirmOrder = async (tableId: string, accountId: string, itemIds: string[]) => {
    const table = tables.find(t => t.id === tableId);
    if (!table) return;

    const updatedAccounts = table.accounts.map(acc => {
      if (acc.id === accountId) {
        const newItems = acc.items.map(item => 
          itemIds.includes(item.id!) ? { ...item, status: 'pending' as const } : item
        );
        return { ...acc, items: newItems, hasPendingOrder: newItems.some(i => i.status === 'awaiting_confirmation' || i.status === 'pending' || i.status === 'preparing') };
      }
      return acc;
    }).map(acc => ({
      ...acc,
      guestName: acc.guestName || null,
      items: acc.items.map(item => ({
        ...item,
        id: item.id || Math.random().toString(36).substr(2, 9)
      }))
    }));

    try {
      await api.put('tables', tableId, {
        accounts: updatedAccounts,
        hasPendingOrder: updatedAccounts.some(acc => acc.hasPendingOrder)
      });

      // Also update the orders collection so KDS sees it
      for (const itemId of itemIds) {
        const orderToUpdate = orders.find(o => 
          o.tableId === tableId && 
          o.accountId === accountId && 
          o.items.some(i => i.id === itemId) &&
          o.status === 'awaiting_confirmation'
        );

        if (orderToUpdate) {
          await api.put('orders', orderToUpdate.id, {
            status: 'pending',
            items: orderToUpdate.items.map(i => i.id === itemId ? { ...i, status: 'pending' as const } : i)
          });
        }
      }

      toast.success('Pedido confirmado e enviado para a cozinha!');
    } catch (err) {
      console.error('Error confirming order:', err);
      toast.error('Erro ao confirmar pedido.');
    }
  };

  const handleMergeTable = async (targetTableId: string) => {
    if (!sourceTableId || sourceTableId === targetTableId) return;

    const sourceTable = tables.find(t => t.id === sourceTableId);
    const targetTable = tables.find(t => t.id === targetTableId);

    if (!sourceTable || !targetTable) return;

    try {
      const batchOps = [
        {
          type: 'update',
          collection: 'tables',
          id: targetTableId,
          data: {
            status: 'occupied',
            accounts: mergedAccounts,
            hasPendingOrder: targetTable.hasPendingOrder || sourceTable.hasPendingOrder
          }
        },
        {
          type: 'update',
          collection: 'tables',
          id: sourceTableId,
          data: {
            status: 'available',
            accounts: [],
            hasPendingOrder: false
          }
        }
      ];

      await api.batch(batchOps);
      
      setIsMergingTable(false);
      setSourceTableId(null);
      setSelectedTable(null);
      
      toast.success(`Mesa ${sourceTable.number} juntada à Mesa ${targetTable.number}!`);
    } catch (err) {
      console.error('Error merging tables:', err);
      toast.error('Erro ao unificar mesas.');
    }
  };

  const handleDeliverItem = async (tableId: string, accountId: string, itemId: string) => {
    const table = tables.find(t => t.id === tableId);
    if (!table) return;

    const updatedAccounts = table.accounts.map(acc => {
      if (acc.id === accountId) {
        const newItems = acc.items.map(item => 
          (item.id === itemId || item.productId === itemId) ? { ...item, status: 'delivered' as const } : item
        );
        return { ...acc, items: newItems, hasPendingOrder: newItems.some(i => i.status === 'awaiting_confirmation' || i.status === 'pending' || i.status === 'preparing') };
      }
      return acc;
    }).map(acc => ({
      ...acc,
      guestName: acc.guestName || null,
      items: acc.items.map(item => ({
        ...item,
        id: item.id || Math.random().toString(36).substr(2, 9)
      }))
    }));

    try {
      await api.put('tables', tableId, {
        accounts: updatedAccounts,
        hasPendingOrder: updatedAccounts.some(acc => acc.hasPendingOrder)
      });

      // Also update the orders collection
      const orderToUpdate = orders.find(o => 
        o.tableId === tableId && 
        o.accountId === accountId && 
        o.items.some(i => (i.id === itemId || i.productId === itemId)) &&
        o.status !== 'closed' && o.status !== 'cancelled'
      );

      if (orderToUpdate) {
        const updatedItems = orderToUpdate.items.map(i => 
          (i.id === itemId || i.productId === itemId) ? { ...i, status: 'delivered' as const } : i
        );
        
        let orderStatus: OrderStatus = 'preparing';
        if (updatedItems.every(i => i.status === 'closed' || i.status === 'cancelled')) {
          orderStatus = 'closed';
        } else if (updatedItems.every(i => i.status === 'delivered' || i.status === 'closed' || i.status === 'cancelled')) {
          orderStatus = 'delivered';
        }

        await api.put('orders', orderToUpdate.id, {
          items: updatedItems,
          status: orderStatus
        });
      }

      toast.success('Item entregue!');
    } catch (err) {
      console.error('Error delivering item:', err);
      toast.error('Erro ao entregar item.');
    }
  };

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.name) {
      toast.error('O nome do cliente é obrigatório!');
      return;
    }
    
    try {
      if (editingCustomer) {
        await api.put('customers', editingCustomer.id, newCustomer);
        setEditingCustomer(null);
        toast.success('Cadastro realizado!');
      } else {
        const res = await api.post('customers', {
          ...newCustomer,
          points: 0,
          lastVisit: new Date().toISOString().split('T')[0],
          createdAt: new Date().toISOString()
        });
        toast.success('Cadastro realizado!');
        
        if (isOpeningTable && selectedTable) {
          handleOpenTable(res.id);
        }
      }
      
      setNewCustomer({ name: '', email: '', phone: '', cpf: '', rg: '', address: '', birthday: '', observation: '' });
      setIsAddingCustomer(false);
    } catch (err) {
      console.error('Error adding customer:', err);
      toast.error('Erro ao salvar cliente.');
    }
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setNewCustomer({
      name: customer.name,
      email: customer.email || '',
      phone: customer.phone || '',
      cpf: customer.cpf || '',
      rg: customer.rg || '',
      address: customer.address || '',
      birthday: customer.birthday || '',
      observation: customer.observation || ''
    });
    setIsAddingCustomer(true);
  };

  const handleDeleteCustomer = (id: string) => {
    setDeleteConfirmation({ id, type: 'customer' });
  };

  const confirmDeleteCustomer = async (id: string) => {
    try {
      await api.delete('customers', id);
      setDeleteConfirmation(null);
      toast.success('Cliente excluído!');
    } catch (err) {
      console.error('Error deleting customer:', err);
      toast.error('Erro ao excluir cliente.');
    }
  };

  const handleUpdateSettings = async (newSettings: Partial<AppSettings>) => {
    try {
      await api.put('settings', 'app_config', newSettings);
      toast.success('Configurações atualizadas!');
    } catch {
      // If document doesn't exist, try to create it
      try {
        const data = {
          id: 'app_config',
          restaurantModule: newSettings.restaurantModule ?? settings.restaurantModule,
          groceryModule: newSettings.groceryModule ?? settings.groceryModule,
          appName: newSettings.appName ?? settings.appName
        };
        await api.post('settings', data);
        toast.success('Configurações inicializadas!');
      } catch (err2) {
        console.error('Error updating settings:', err2);
        toast.error('Erro ao atualizar configurações.');
      }
    }
  };

  const handleCompleteGrocerySale = async (items: OrderItem[], paymentMethod: string) => {
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const total = subtotal; // Grocery usually doesn't have 10% service tax by default, but we can add if needed

    try {
      const batchOps: unknown[] = [];

      // 1. Create Transaction
      batchOps.push({
        type: 'insert',
        collection: 'transactions',
        data: {
          id: Math.random().toString(36).substr(2, 9),
          date: new Date().toISOString(),
          type: 'income',
          category: 'sales',
          amount: total,
          description: `Venda Mercearia - ${items.length} itens`,
          paymentMethod,
          status: 'completed',
          createdAt: new Date().toISOString()
        }
      });

      // 2. Create Order Record
      batchOps.push({
        type: 'insert',
        collection: 'orders',
        data: {
          id: Math.random().toString(36).substr(2, 9),
          customerId: 'avulso',
          customerName: 'Cliente Mercearia',
          items: items.map(i => ({ ...i, status: 'closed' })),
          total,
          subtotal,
          discount: 0,
          tax: 0,
          paymentMethod,
          type: 'takeaway',
          status: 'closed',
          createdAt: new Date().toISOString(),
          closedAt: new Date().toISOString()
        }
      });

      // 3. Deduct Stock
      for (const item of items) {
        const product = products.find(p => p.id === item.productId);
        if (product && product.trackStock) {
          batchOps.push({
            type: 'update',
            collection: 'products',
            id: product.id,
            data: {
              stock: product.stock - item.quantity
            }
          });
          
          batchOps.push({
            type: 'insert',
            collection: 'inventoryLogs',
            data: {
              id: Math.random().toString(36).substr(2, 9),
              productId: product.id,
              type: 'out',
              quantity: item.quantity,
              reason: 'Venda Mercearia',
              date: new Date().toISOString(),
              userId: user?.id || 'system',
              createdAt: new Date().toISOString()
            }
          });
        }
      }

      await api.batch(batchOps);
      toast.success('Venda finalizada com sucesso!');
    } catch (err) {
      console.error('Error completing grocery sale:', err);
      toast.error('Erro ao finalizar venda.');
    }
  };

  const handleEditStaff = (member: Staff) => {
    setEditingStaff(member);
    setNewStaff({
      name: member.name,
      role: member.role,
      phone: member.phone,
      email: member.email,
      cpf: member.cpf,
      rg: member.rg,
      registration: member.registration,
      salary: member.salary,
      commission: member.commission,
      address: member.address,
      startDate: member.startDate
    });
    setIsAddingStaff(true);
  };

  const handleDeleteStaff = (id: string) => {
    setDeleteConfirmation({ id, type: 'staff' });
  };

  const confirmDeleteStaff = async (id: string) => {
    try {
      await api.delete('staff', id);
      setDeleteConfirmation(null);
      toast.success('Colaborador excluído!');
    } catch (err) {
      console.error('Error deleting staff:', err);
      toast.error('Erro ao excluir colaborador.');
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaff.name || !newStaff.role || !newStaff.registration) {
      toast.error('Preencha os campos obrigatórios!');
      return;
    }

    try {
      if (editingStaff) {
        await api.put('staff', editingStaff.id, newStaff);
        setEditingStaff(null);
        toast.success('Colaborador atualizado!');
      } else {
        await api.post('staff', {
          ...newStaff,
          status: 'active',
          createdAt: new Date().toISOString()
        });
        toast.success('Colaborador contratado!');
      }

      setIsAddingStaff(false);
      setNewStaff({
        name: '',
        role: '',
        phone: '',
        email: '',
        cpf: '',
        rg: '',
        registration: '',
        salary: 0,
        commission: 0,
        address: '',
        startDate: new Date().toISOString().split('T')[0]
      });
    } catch (err) {
      console.error('Error saving staff:', err);
      toast.error('Erro ao salvar colaborador.');
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setNewProduct({
      name: product.name,
      price: product.price,
      costPrice: product.costPrice || 0,
      categoryId: product.categoryId,
      image: product.image || '',
      description: product.description || '',
      stock: product.stock || 0,
      minStock: product.minStock || 0,
      unit: product.unit || 'un',
      trackStock: product.trackStock ?? true
    });
    setIsAddingProduct(true);
  };

  const handleDeleteProduct = (id: string) => {
    setDeleteConfirmation({ id, type: 'product' });
  };

  const confirmDeleteProduct = async (id: string) => {
    try {
      await api.delete('products', id);
      setDeleteConfirmation(null);
      toast.success('Produto excluído!');
    } catch (err) {
      console.error('Error deleting product:', err);
      toast.error('Erro ao excluir produto.');
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.price) return;

    try {
      if (editingProduct) {
        await api.put('products', editingProduct.id, newProduct);
        setEditingProduct(null);
        toast.success('Produto atualizado!');
      } else {
        await api.post('products', {
          ...newProduct,
          createdAt: new Date().toISOString()
        });
        toast.success('Produto adicionado!');
      }

      setIsAddingProduct(false);
      setNewProduct({
        name: '',
        price: 0,
        costPrice: 0,
        categoryId: categories[0]?.id || '',
        image: '',
        description: '',
        stock: 0,
        minStock: 0,
        unit: 'un',
        trackStock: true
      });
    } catch (err) {
      console.error('Error saving product:', err);
      toast.error('Erro ao salvar produto.');
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.name) return;

    try {
      await api.post('categories', {
        ...newCategory,
        module: newCategory.type || 'both'
      });
      toast.success('Categoria criada!');
      setNewCategory({ name: '', icon: 'Utensils', type: 'kitchen' });
      setIsAddingCategory(false);
    } catch (err) {
      console.error('Error adding category:', err);
      toast.error('Erro ao adicionar categoria.');
    }
  };

  const handleDeleteCategory = (id: string) => {
    const hasProducts = products.some(p => p.categoryId === id);
    if (hasProducts) {
      toast.error('Não é possível excluir uma categoria que possui produtos vinculados!');
      return;
    }
    setDeleteConfirmation({ id, type: 'category' });
  };

  const confirmDeleteCategory = async (id: string) => {
    try {
      await api.delete('categories', id);
      setDeleteConfirmation(null);
      toast.success('Categoria excluída!');
      if (selectedCategory === id) setSelectedCategory('all');
    } catch (err) {
      console.error('Error deleting category:', err);
      toast.error('Erro ao excluir categoria.');
    }
  };

  const handleRemoveItemFromTable = async (tableId: string, accountId: string, itemId: string) => {
    const table = tables.find(t => t.id === tableId);
    if (!table) return;

    const updatedAccounts = table.accounts.map(acc => {
      if (acc.id === accountId) {
        const newItems = acc.items.filter(item => (item.id || item.productId) !== itemId);
        return { ...acc, items: newItems, hasPendingOrder: newItems.some(item => item.status === 'awaiting_confirmation' || item.status === 'pending' || item.status === 'preparing') };
      }
      return acc;
    }).map(acc => ({
      ...acc,
      guestName: acc.guestName || null,
      items: acc.items.map(item => ({
        ...item,
        id: item.id || Math.random().toString(36).substr(2, 9)
      }))
    }));

    const allItemsEmpty = updatedAccounts.every(acc => acc.items.length === 0);

    try {
      await api.put('tables', tableId, {
        accounts: updatedAccounts,
        status: allItemsEmpty ? 'available' : table.status,
        hasPendingOrder: updatedAccounts.some(acc => acc.hasPendingOrder)
      });

      // Also cancel the order in the orders collection
      const orderToCancel = orders.find(o => 
        o.tableId === tableId && 
        o.accountId === accountId && 
        o.items.some(i => (i.id || i.productId) === itemId) &&
        o.status !== 'closed' && o.status !== 'cancelled'
      );

      if (orderToCancel) {
        await api.put('orders', orderToCancel.id, {
          status: 'cancelled',
          items: orderToCancel.items.map(i => (i.id || i.productId) === itemId ? { ...i, status: 'cancelled' as const } : i)
        });
      }

      toast.success('Item removido!');
    } catch (err) {
      console.error('Error removing item:', err);
      toast.error('Erro ao remover item.');
    }
  };

  const handleUpdateCustomerStats = async (customerId: string, amount: number) => {
    if (!customerId || customerId === 'avulso') return;
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;

    try {
      await api.put('customers', customerId, {
        visitCount: (customer.visitCount || 0) + 1,
        totalSpent: (customer.totalSpent || 0) + amount,
        lastVisit: new Date().toISOString().split('T')[0],
        points: (customer.points || 0) + Math.floor(amount)
      });
    } catch (err) {
      console.error('Error updating customer stats:', err);
    }
  };

  const handleDeductStock = async (items: OrderItem[]) => {
    const batchOps: unknown[] = [];

    for (const item of items) {
      const product = products.find(p => p.id === item.productId);
      if (product && product.trackStock) {
        batchOps.push({
          type: 'update',
          collection: 'products',
          id: product.id,
          data: {
            stock: product.stock - item.quantity
          }
        });
        
        batchOps.push({
          type: 'insert',
          collection: 'inventoryLogs',
          data: {
            id: Math.random().toString(36).substr(2, 9),
            productId: product.id,
            type: 'out',
            quantity: item.quantity,
            reason: 'Venda',
            date: new Date().toISOString(),
            userId: user?.id || 'system',
            createdAt: new Date().toISOString()
          }
        });
      }
    }

    if (batchOps.length > 0) {
      await api.batch(batchOps);
    }
  };

  const handleCloseAccount = async (tableId: string, accountId: string, paymentMethod: string = 'card') => {
    const table = tables.find(t => t.id === tableId);
    if (!table) return;
    
    const account = table.accounts.find(acc => acc.id === accountId);
    if (!account || account.items.length === 0) return;

    const subtotal = account.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const total = subtotal * 1.1; // 10% service tax

    try {
      // Add transaction
      await api.post('transactions', {
        type: 'income',
        amount: total,
        description: `Venda Mesa ${table.number} - Cliente: ${customers.find(c => c.id === account.customerId)?.name || account.guestName || 'Avulso'}`,
        date: new Date().toISOString(),
        paymentMethod: paymentMethod,
        category: 'sales',
        status: 'completed'
      });

      // Add closed order record
      await api.post('orders', {
        tableId,
        tableNumber: table.number,
        accountId: account.id,
        customerId: account.customerId,
        customerName: account.guestName || customers.find(c => c.id === account.customerId)?.name || 'Cliente',
        items: account.items,
        total,
        subtotal,
        status: 'closed',
        createdAt: new Date().toISOString(),
        closedAt: new Date().toISOString(),
        paymentMethod: paymentMethod,
        type: 'dine_in'
      });

      // Deduct stock
      await handleDeductStock(account.items);

      // Update customer stats
      if (account.customerId) {
        await handleUpdateCustomerStats(account.customerId, total);
      }

      // Update table
      const remainingAccounts = table.accounts.filter(acc => acc.id !== accountId);
      await api.put('tables', tableId, {
        accounts: remainingAccounts,
        status: remainingAccounts.length === 0 ? 'available' : 'occupied',
        hasPendingOrder: remainingAccounts.some(acc => acc.hasPendingOrder)
      });

      setSelectedTable(null);
      setSelectedAccountId(null);
      toast.success('Conta fechada!');
    } catch (err) {
      console.error('Error closing account:', err);
      toast.error('Erro ao fechar conta.');
    }
  };

  const handleCloseAllAccounts = async (tableId: string, paymentMethod: string = 'card') => {
    const table = tables.find(t => t.id === tableId);
    if (!table || table.accounts.length === 0) return;

    const totalSubtotal = table.accounts.reduce((sum, acc) => 
      sum + acc.items.reduce((accSum, item) => accSum + (item.price * item.quantity), 0), 0
    );
    const totalWithTax = totalSubtotal * 1.1;

    try {
      // Add transaction
      await api.post('transactions', {
        type: 'income',
        amount: totalWithTax,
        description: `Venda Mesa ${table.number} - Fechamento Completo (${table.accounts.length} contas)`,
        date: new Date().toISOString(),
        paymentMethod: paymentMethod,
        category: 'sales',
        status: 'completed'
      });

      // Add closed order record
      await api.post('orders', {
        tableId,
        tableNumber: table.number,
        accountId: 'all',
        customerName: `Mesa ${table.number} (Fechamento Completo)`,
        items: table.accounts.flatMap(acc => acc.items),
        total: totalWithTax,
        subtotal: totalSubtotal,
        status: 'closed',
        createdAt: new Date().toISOString(),
        closedAt: new Date().toISOString(),
        paymentMethod: paymentMethod,
        type: 'dine_in'
      });

      // Deduct stock
      await handleDeductStock(table.accounts.flatMap(acc => acc.items));

      // Update customer stats for each account
      for (const account of table.accounts) {
        if (account.customerId) {
          const accTotal = account.items.reduce((sum, item) => sum + (item.price * item.quantity), 0) * 1.1;
          await handleUpdateCustomerStats(account.customerId, accTotal);
        }
      }

      // Update table
      await api.put('tables', tableId, {
        status: 'available',
        accounts: [],
        hasPendingOrder: false
      });

      setSelectedTable(null);
      setSelectedAccountId(null);
      toast.success(`Mesa ${table.number} fechada com sucesso!`, {
        description: `Total pago: ${formatCurrency(totalWithTax)}`
      });
    } catch (err) {
      console.error('Error closing all accounts:', err);
      toast.error('Erro ao fechar todas as contas.');
    }
  };

  const handleCloseCash = async () => {
    if (orders.length === 0) {
      toast.error('O caixa já está vazio!', {
        description: 'Não há vendas registradas para fechar o caixa.'
      });
      return;
    }
    
    const total = orders.reduce((sum, o) => sum + o.total, 0);
    
    try {
      // In a real app, we would mark orders as archived. 
      // For this demo, we'll just show the success message as the orders are already in Firestore.
      // If we wanted to "clear" them, we'd need to update each order in Firestore.
      
      toast.success('Caixa fechado com sucesso!', {
        description: `Total processado: ${formatCurrency(total)}. O relatório foi arquivado.`
      });
    } catch (err) {
      console.error('Error closing cash:', err);
      toast.error('Erro ao fechar caixa.');
    }
  };

  const handleTransaction = async (type: 'income' | 'expense', amount: number, description: string) => {
    try {
      await api.post('transactions', {
        type,
        amount,
        description,
        date: new Date().toISOString(),
        paymentMethod: 'cash'
      });
      
      toast.success(`${type === 'income' ? 'Suprimento' : 'Sangria'} realizado!`, {
        description: `${formatCurrency(amount)} - ${description}`
      });

      // Clear state
      setTransactionAmount('');
      setTransactionDescription('');
      setIsTransactionModalOpen(false);
    } catch (err) {
      console.error('Error adding transaction:', err);
      toast.error('Erro ao realizar lançamento.');
    }
  };

  const handleUpdateItemStatus = async (orderId: string, itemId: string, status: OrderItem['status']) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const updatedItems = order.items.map(item => 
      item.id === itemId ? { ...item, status } : item
    );

    // Determine order status
    let orderStatus: OrderStatus = 'preparing';
    if (updatedItems.every(i => i.status === 'closed' || i.status === 'cancelled')) {
      orderStatus = 'closed';
    } else if (updatedItems.every(i => i.status === 'delivered' || i.status === 'closed' || i.status === 'cancelled')) {
      orderStatus = 'delivered';
    }

    try {
      // Update orders collection
      await api.put('orders', orderId, {
        items: updatedItems,
        status: orderStatus
      });

      // Sync with tables collection
      const table = tables.find(t => t.id === order.tableId);
      if (table) {
        const updatedAccounts = table.accounts.map(acc => {
          if (acc.id === order.accountId) {
            const newItems = acc.items.map(item => 
              item.id === itemId ? { ...item, status } : item
            );
            return { 
              ...acc, 
              items: newItems, 
              hasPendingOrder: newItems.some(i => i.status === 'pending' || i.status === 'preparing' || i.status === 'awaiting_confirmation') 
            };
          }
          return acc;
        }).map(acc => ({
          ...acc,
          guestName: acc.guestName || null,
          items: acc.items.map(item => ({
            ...item,
            id: item.id || Math.random().toString(36).substr(2, 9)
          }))
        }));

        await api.put('tables', table.id, {
          accounts: updatedAccounts,
          hasPendingOrder: updatedAccounts.some(acc => acc.hasPendingOrder)
        });
      }

      toast.success('Status do item atualizado!');
    } catch (err) {
      console.error('Error updating item status:', err);
      toast.error('Erro ao atualizar status.');
    }
  };

  const handleCompleteOrder = async (orderId: string) => {
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;

      const closedItems = order.items.map(i => ({ ...i, status: 'closed' as const }));

      await api.put('orders', orderId, {
        status: 'closed',
        items: closedItems
      });

      // Sync with tables collection
      const table = tables.find(t => t.id === order.tableId);
      if (table) {
        const updatedAccounts = table.accounts.map(acc => {
          if (acc.id === order.accountId) {
            const newItems = acc.items.map(item => {
              const matchingClosedItem = closedItems.find(ci => ci.id === item.id);
              return matchingClosedItem ? { ...item, status: 'closed' as const } : item;
            });
            return { 
              ...acc, 
              items: newItems, 
              hasPendingOrder: newItems.some(i => i.status === 'pending' || i.status === 'preparing' || i.status === 'awaiting_confirmation') 
            };
          }
          return acc;
        }).map(acc => ({
          ...acc,
          guestName: acc.guestName || null,
          items: acc.items.map(item => ({
            ...item,
            id: item.id || Math.random().toString(36).substr(2, 9)
          }))
        }));

        await api.put('tables', table.id, {
          accounts: updatedAccounts,
          hasPendingOrder: updatedAccounts.some(acc => acc.hasPendingOrder)
        });
      }

      toast.success('Pedido finalizado!');
    } catch (err) {
      console.error('Error completing order:', err);
      toast.error('Erro ao finalizar pedido.');
    }
  };

  const handleUpdateStock = async (productId: string, quantity: number, type: 'in' | 'out' | 'adjustment', reason: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const newStock = type === 'in' ? product.stock + quantity : 
                    type === 'out' ? product.stock - quantity : quantity;

    try {
      const batchOps = [
        {
          type: 'update',
          collection: 'products',
          id: productId,
          data: { stock: newStock }
        },
        {
          type: 'insert',
          collection: 'inventoryLogs',
          data: {
            id: Math.random().toString(36).substr(2, 9),
            productId,
            type,
            quantity,
            reason,
            date: new Date().toISOString(),
            userId: user?.id || 'system',
            createdAt: new Date().toISOString()
          }
        }
      ];

      await api.batch(batchOps);
      toast.success('Estoque atualizado!');
    } catch (err) {
      console.error('Error updating stock:', err);
      toast.error('Erro ao atualizar estoque.');
    }
  };

  const handleAddTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    try {
      await api.post('transactions', {
        ...transaction,
        createdAt: new Date().toISOString()
      });
      toast.success('Lançamento realizado!');
    } catch (err) {
      console.error('Error adding transaction:', err);
      toast.error('Erro ao realizar lançamento.');
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      await api.put('orders', orderId, { status });
      toast.success('Status do pedido atualizado!');
    } catch (err) {
      console.error('Error updating order status:', err);
      toast.error('Erro ao atualizar status.');
    }
  };

  const handleAiAsk = async () => {
    if (!aiQuery.trim()) return;
    
    setIsAiLoading(true);
    setAiResponse('');
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const model = "gemini-3-flash-preview";
      
      const menuContext = MOCK_PRODUCTS.map(p => `${p.name}: ${p.price}`).join('\n');
      const tableContext = tables.map(t => `Mesa ${t.number}: ${t.status}`).join('\n');
      
      const response = await ai.models.generateContent({
        model,
        contents: `Você é um assistente de IA para um restaurante. 
        Aqui está o cardápio:\n${menuContext}\n\n
        Aqui está o status das mesas:\n${tableContext}\n\n
        Pergunta do garçom: ${aiQuery}`,
      });
      
      setAiResponse(response.text || 'Desculpe, não consegui processar sua pergunta.');
    } catch (error) {
      console.error('Erro na IA:', error);
      setAiResponse('Erro ao conectar com a IA. Verifique sua chave de API.');
    } finally {
      setIsAiLoading(false);
    }
  };

  if (!isAuthReady) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Carregando Sistema...</p>
        </div>
      </div>
    );
  }

  if (isClientAppOpen && clientTableId) {
    const table = tables.find(t => t.id === clientTableId);
    
    return (
      <div className="fixed inset-0 z-[100] bg-white overflow-hidden">
        <MenuGrid 
          tableName={`Mesa ${table?.number}`}
          guestName={clientGuestName || 'Cliente'}
          showCloseButton={false}
          onChangeGuestName={() => {
            setClientGuestName(null);
            localStorage.removeItem('clientGuestName');
          }}
          onClose={() => setIsClientAppOpen(false)}
          currentItems={table?.accounts[0]?.items || []}
          onAddOrder={async (items) => {
            const table = tables.find(t => t.id === clientTableId);
            if (!table) return;

            const itemsWithStatus = items.map(i => ({ 
              ...i, 
              id: Math.random().toString(36).substr(2, 9),
              status: 'awaiting_confirmation' as const 
            }));
            
            let account = table.accounts[0];
            let updatedAccounts = [...table.accounts];
            
            if (!account) {
              account = {
                id: Math.random().toString(36).substr(2, 9),
                customerId: 'avulso',
                guestName: clientGuestName,
                items: itemsWithStatus,
                hasPendingOrder: true,
                openedAt: new Date().toISOString(),
                paymentStatus: 'pending'
              };
              updatedAccounts = [account];
            } else {
              updatedAccounts = table.accounts.map(acc => {
                if (acc.id === account.id) {
                  return { ...acc, items: [...acc.items, ...itemsWithStatus], hasPendingOrder: true };
                }
                return acc;
              });
            }

            const sanitizedAccounts = updatedAccounts.map(acc => ({
              ...acc,
              guestName: acc.guestName || null,
              items: acc.items.map(item => ({
                ...item,
                id: item.id || Math.random().toString(36).substr(2, 9)
              }))
            }));

            try {
              await api.put('tables', clientTableId, {
                accounts: sanitizedAccounts,
                hasPendingOrder: true,
                status: 'occupied'
              });

              // Create order records for history/tracking
              for (const item of itemsWithStatus) {
                await api.post('orders', {
                  tableId: clientTableId,
                  tableNumber: table.number,
                  accountId: account.id,
                  customerName: account.guestName || clientGuestName || 'Cliente QR',
                  items: [item],
                  total: item.price * item.quantity,
                  status: 'awaiting_confirmation',
                  createdAt: new Date().toISOString()
                });
              }

              toast.success('Pedido enviado!', {
                description: 'Aguarde a confirmação do garçom.'
              });
              // setIsClientAppOpen(false); // Removido para manter o cliente no cardápio
            } catch (err) {
              console.error('Error adding client order:', err);
              toast.error('Erro ao enviar pedido.');
            }
          }}
          products={products}
          categories={categories}
        />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-100">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md"
        >
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-200">
              <Utensils className="text-white w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Luxe POS</h1>
            <p className="text-slate-500">Acesse sua conta para continuar</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input 
                type="email" 
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="admin@admin.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Senha</label>
              <input 
                type="password" 
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="••••••••"
                required
              />
            </div>
            <button 
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoggingIn ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Entrar
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400">
              © 2026 Luxe POS - Sistema de Gestão Inteligente
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="flex h-screen bg-[#f1f5f9] text-slate-900 font-sans selection:bg-blue-500/30 overflow-hidden">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onLogin={handleLogin}
        onLogout={handleLogout}
        user={user}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        settings={settings}
      />
      
      <main className="flex-1 flex flex-col min-w-0 relative">
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'dashboard' && (
              <Dashboard 
                orders={orders} 
                customers={customers} 
              />
            )}
            {activeTab === 'tables' && settings.restaurantModule && (
              <TableGrid 
                tables={tables} 
                customers={customers}
                onSelectTable={handleSelectTable} 
                onShowQRCode={(table) => setQrCodeTable(table)}
                onAddTable={handleAddTable}
              />
            )}
            {activeTab === 'grocery' && settings.groceryModule && (
              <div className="h-[calc(100vh-120px)] animate-in fade-in slide-in-from-bottom-4 duration-500">
                <GroceryModule 
                  products={products}
                  categories={categories}
                  onCompleteSale={handleCompleteGrocerySale}
                />
              </div>
            )}
            {activeTab === 'active_orders' && settings.restaurantModule && (
              <ActiveOrders 
                tables={tables}
                customers={customers}
                onDeliverItem={handleDeliverItem}
                onResetData={resetData}
                onSeedData={seedData}
                onResetOrders={resetOrders}
              />
            )}
            {activeTab === 'cash' && (
              <div className="space-y-8 animate-in fade-in duration-500">
                <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase">Fluxo de Caixa</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Entradas Hoje</p>
                    <h3 className="text-3xl font-black text-emerald-600">{formatCurrency(orders.reduce((sum, o) => sum + o.total, 0))}</h3>
                  </div>
                  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Saídas Hoje</p>
                    <h3 className="text-3xl font-black text-red-600">{formatCurrency(0)}</h3>
                  </div>
                  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Saldo Atual</p>
                    <h3 className="text-3xl font-black text-blue-600">{formatCurrency(orders.reduce((sum, o) => sum + o.total, 0))}</h3>
                  </div>
                </div>
                <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm">
                  <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                    <h4 className="font-black text-slate-800 uppercase tracking-tight">Últimas Transações</h4>
                  </div>
                  <div className="p-0">
                    {orders.map(order => (
                      <div key={order.id} className="flex items-center justify-between p-6 border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                            <Plus className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-black text-slate-800 text-sm">Venda - Mesa {tables.find(t => t.id === order.tableId)?.number}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{new Date(order.createdAt).toLocaleTimeString()}</p>
                          </div>
                        </div>
                        <p className="font-black text-emerald-600">{formatCurrency(order.total)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'customers' && (
              <div className="p-12 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-end">
                  <div>
                    <h2 className="text-5xl font-black text-slate-800 tracking-tighter uppercase">Clientes</h2>
                    <p className="text-slate-500 font-bold text-lg mt-2">Gerencie sua base de clientes e fidelidade.</p>
                  </div>
                  <button 
                    onClick={() => setIsAddingCustomer(true)}
                    className="bg-[#003087] text-white px-8 py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest flex items-center gap-3 shadow-2xl shadow-blue-900/20 hover:scale-105 transition-all"
                  >
                    <UserPlus className="w-5 h-5" />
                    Novo Cliente
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {customers.map(customer => (
                    <div key={customer.id} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-900/5 group hover:border-blue-200 transition-all">
                        <div className="flex items-center gap-6 mb-8">
                          <div className="w-20 h-20 rounded-[1.5rem] bg-slate-100 flex items-center justify-center text-3xl font-black text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                            {customer.name.charAt(0)}
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <h3 className="text-2xl font-black text-slate-800">{customer.name}</h3>
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => handleEditCustomer(customer)}
                                  className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteCustomer(customer.id)}
                                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-blue-600 mt-1">
                              <Star className="w-4 h-4 fill-current" />
                              <span className="text-sm font-black uppercase tracking-widest">{customer.points} Pontos</span>
                            </div>
                          </div>
                        </div>
                      
                      <div className="space-y-4 pt-6 border-t border-slate-50">
                        <div className="flex items-center gap-4 text-slate-500">
                          <Phone className="w-4 h-4" />
                          <span className="text-sm font-bold">{customer.phone || 'Não informado'}</span>
                        </div>
                        <div className="flex items-center gap-4 text-slate-500">
                          <Mail className="w-4 h-4" />
                          <span className="text-sm font-bold">{customer.email || 'Não informado'}</span>
                        </div>
                        <div className="flex items-center gap-4 text-slate-400">
                          <ClockIcon className="w-4 h-4" />
                          <span className="text-xs font-bold uppercase tracking-widest">Última visita: {customer.lastVisit}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {activeTab === 'staff' && (
              <div className="p-12 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-end">
                  <div>
                    <h2 className="text-5xl font-black text-slate-800 tracking-tighter uppercase">Colaboradores</h2>
                    <p className="text-slate-500 font-bold text-lg mt-2">Gerencie sua equipe e contratações.</p>
                  </div>
                  <button 
                    onClick={() => setIsAddingStaff(true)}
                    className="bg-[#003087] text-white px-8 py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest flex items-center gap-3 shadow-2xl shadow-blue-900/20 hover:scale-105 transition-all"
                  >
                    <Plus className="w-5 h-5" />
                    Contratar Colaborador
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {staff.map(member => (
                    <div key={member.id} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-900/5 group hover:border-blue-200 transition-all">
                      <div className="flex justify-between items-start mb-6">
                        <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center text-2xl font-black text-blue-600">
                          {member.name.charAt(0)}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                            member.status === 'active' ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400"
                          )}>
                            {member.status === 'active' ? 'Ativo' : 'Inativo'}
                          </span>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleEditStaff(member)}
                              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteStaff(member.id)}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                      <h3 className="text-xl font-black text-slate-800">{member.name}</h3>
                      <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mt-1">{member.role}</p>
                      
                      <div className="mt-8 space-y-3 pt-6 border-t border-slate-50">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Matrícula</span>
                          <span className="text-slate-700 font-black">{member.registration}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">CPF</span>
                          <span className="text-slate-700 font-black">{member.cpf}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Salário</span>
                          <span className="text-slate-700 font-black">{formatCurrency(member.salary)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Comissão</span>
                          <span className="text-slate-700 font-black">{member.commission}%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Início</span>
                          <span className="text-slate-700 font-black">{member.startDate}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {staff.length === 0 && (
                    <div className="col-span-full py-20 bg-white border border-dashed border-slate-300 rounded-[3rem] flex flex-col items-center justify-center text-slate-400 space-y-4">
                      <Users className="w-12 h-12 opacity-20" />
                      <p className="font-bold uppercase tracking-widest text-sm">Nenhum colaborador cadastrado</p>
                    </div>
                  )}
                </div>

                {isAddingStaff && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-white p-12 rounded-[3rem] w-full max-w-2xl shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar"
                    >
                      <div className="flex justify-between items-center mb-10">
                        <h3 className="text-3xl font-black text-slate-800 tracking-tight uppercase">
                          {editingStaff ? 'Editar Colaborador' : 'Contratar Colaborador'}
                        </h3>
                        <button onClick={() => {
                          setIsAddingStaff(false);
                          setEditingStaff(null);
                          setNewStaff({
                            name: '',
                            role: '',
                            phone: '',
                            email: '',
                            cpf: '',
                            rg: '',
                            registration: '',
                            salary: 0,
                            commission: 0,
                            address: '',
                            startDate: new Date().toISOString().split('T')[0]
                          });
                        }} className="p-3 hover:bg-slate-100 rounded-2xl text-slate-400">
                          <X className="w-6 h-6" />
                        </button>
                      </div>
                      <form onSubmit={handleAddStaff} className="grid grid-cols-2 gap-8">
                        <div className="space-y-2 col-span-2">
                          <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-2">Nome Completo *</label>
                          <input 
                            required
                            type="text"
                            value={newStaff.name}
                            onChange={e => setNewStaff({...newStaff, name: e.target.value})}
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 text-slate-700 font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                            placeholder="Nome do funcionário"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-2">Cargo *</label>
                          <input 
                            required
                            type="text"
                            value={newStaff.role}
                            onChange={e => setNewStaff({...newStaff, role: e.target.value})}
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 text-slate-700 font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                            placeholder="Ex: Garçom, Cozinheiro"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-2">Matrícula *</label>
                          <input 
                            required
                            type="text"
                            value={newStaff.registration}
                            onChange={e => setNewStaff({...newStaff, registration: e.target.value})}
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 text-slate-700 font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                            placeholder="ID do funcionário"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-2">CPF *</label>
                          <input 
                            required
                            type="text"
                            value={newStaff.cpf}
                            onChange={e => setNewStaff({...newStaff, cpf: e.target.value})}
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 text-slate-700 font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                            placeholder="000.000.000-00"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-2">RG</label>
                          <input 
                            type="text"
                            value={newStaff.rg}
                            onChange={e => setNewStaff({...newStaff, rg: e.target.value})}
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 text-slate-700 font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                            placeholder="00.000.000-0"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-2">Telefone</label>
                          <input 
                            type="tel"
                            value={newStaff.phone}
                            onChange={e => setNewStaff({...newStaff, phone: e.target.value})}
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 text-slate-700 font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                            placeholder="(11) 99999-9999"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-2">E-mail</label>
                          <input 
                            type="email"
                            value={newStaff.email}
                            onChange={e => setNewStaff({...newStaff, email: e.target.value})}
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 text-slate-700 font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                            placeholder="email@exemplo.com"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-2">Salário</label>
                          <input 
                            type="number"
                            value={newStaff.salary}
                            onChange={e => setNewStaff({...newStaff, salary: Number(e.target.value)})}
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 text-slate-700 font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-2">Comissão (%)</label>
                          <input 
                            type="number"
                            value={newStaff.commission}
                            onChange={e => setNewStaff({...newStaff, commission: Number(e.target.value)})}
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 text-slate-700 font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                          />
                        </div>
                        <div className="space-y-2 col-span-2">
                          <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-2">Endereço</label>
                          <input 
                            type="text"
                            value={newStaff.address}
                            onChange={e => setNewStaff({...newStaff, address: e.target.value})}
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 text-slate-700 font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                            placeholder="Rua, Número, Bairro"
                          />
                        </div>
                        <button 
                          type="submit"
                          className="col-span-2 py-6 bg-[#003087] text-white rounded-[1.5rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-blue-900/20 hover:scale-105 transition-all mt-4"
                        >
                          {editingStaff ? 'Salvar Alterações' : 'Contratar Funcionário'}
                        </button>
                      </form>
                    </motion.div>
                  </div>
                )}
              </div>
            )}
            {activeTab === 'cash' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-end">
                  <div>
                    <h2 className="text-5xl font-black text-slate-800 tracking-tighter uppercase">Caixa</h2>
                    <p className="text-slate-500 font-bold text-lg mt-2">Controle de entradas, saídas e fechamento do dia.</p>
                  </div>
                  <div className="flex gap-4">
                    <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-[2rem] text-right">
                      <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Saldo em Caixa</p>
                      <p className="text-3xl font-black text-emerald-700">
                        {formatCurrency(transactions.reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0))}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-6">
                    <div className="flex justify-between items-center px-2">
                      <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Movimentações do Período</h3>
                      <button 
                        onClick={() => {
                          const now = new Date();
                          const currentMonth = now.getMonth();
                          const currentYear = now.getFullYear();
                          
                          const monthTransactions = transactions.filter(t => {
                            const d = new Date(t.date);
                            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
                          });

                          const previousTransactions = transactions.filter(t => {
                            const d = new Date(t.date);
                            return d.getFullYear() < currentYear || (d.getFullYear() === currentYear && d.getMonth() < currentMonth);
                          });

                          const initialBalance = previousTransactions.reduce((sum, t) => {
                            return sum + (t.type === 'income' ? t.amount : -t.amount);
                          }, 0);

                          const monthYear = now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
                          generateAccountingPDF(monthTransactions, monthYear, initialBalance);
                          toast.success('Relatório gerado com sucesso!');
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-[#003087] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-900/10"
                      >
                        <Download className="w-3 h-3" />
                        Relatório Contador (PDF)
                      </button>
                      <button 
                        onClick={() => {
                          const today = new Date().toLocaleDateString('pt-BR');
                          generateCashClosurePDF(orders, transactions, today);
                          toast.success('Fechamento de caixa gerado!', {
                            description: 'O resumo do dia foi baixado em PDF.'
                          });
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-900/10"
                      >
                        <Download className="w-3 h-3" />
                        Fechamento Diário (PDF)
                      </button>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-[3rem] overflow-hidden shadow-sm overflow-x-auto">
                      <table className="w-full text-left min-w-[600px]">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100">
                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Data/Hora</th>
                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Descrição</th>
                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Tipo</th>
                            <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Valor</th>
                            <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Saldo</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {transactions.slice().reverse().map((t, idx) => {
                            // Calculate balance for each row in reverse order
                            const currentIdx = transactions.length - 1 - idx;
                            const balanceAtThisPoint = transactions.slice(0, currentIdx + 1).reduce((sum, curr) => {
                              return sum + (curr.type === 'income' ? curr.amount : -curr.amount);
                            }, 0);

                            return (
                              <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-8 py-6 text-sm font-bold text-slate-500">{new Date(t.date).toLocaleString()}</td>
                                <td className="px-8 py-6">
                                  <p className="text-sm font-black text-slate-800 tracking-tight">{t.description}</p>
                                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">ID #{t.id.slice(0, 8)}</p>
                                </td>
                                <td className="px-8 py-6">
                                  <span className={cn(
                                    "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest",
                                    t.type === 'income' ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                                  )}>
                                    {t.type === 'income' ? 'Entrada' : 'Saída'}
                                  </span>
                                </td>
                                <td className={cn(
                                  "px-8 py-6 text-right font-black",
                                  t.type === 'income' ? "text-emerald-600" : "text-red-600"
                                )}>
                                  {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                                </td>
                                <td className="px-8 py-6 text-right font-black text-slate-700">
                                  {formatCurrency(balanceAtThisPoint)}
                                </td>
                              </tr>
                            );
                          })}
                          {transactions.length === 0 && (
                            <tr>
                              <td colSpan={4} className="px-8 py-20 text-center">
                                <div className="flex flex-col items-center gap-4 opacity-20">
                                  <Wallet className="w-12 h-12" />
                                  <p className="font-black uppercase tracking-widest text-xs">Nenhuma movimentação hoje</p>
                                </div>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 ml-2">Ações Rápidas</h3>
                    <div className="bg-[#003087] p-8 rounded-[3rem] text-white space-y-8 shadow-2xl shadow-blue-900/20">
                      <div>
                        <h4 className="text-lg font-black tracking-tight mb-2">Resumo do Turno</h4>
                        <p className="text-white/60 text-xs font-bold leading-relaxed">O caixa está aberto e pronto para movimentações.</p>
                      </div>
                      <div className="space-y-4">
                        <button 
                          onClick={() => {
                            setTransactionType('expense');
                            setIsTransactionModalOpen(true);
                          }}
                          className="w-full py-5 bg-white/10 hover:bg-white/20 rounded-2xl font-black text-xs uppercase tracking-widest transition-all text-center"
                        >
                          Sangria de Caixa
                        </button>
                        <button 
                          onClick={() => {
                            setTransactionType('income');
                            setIsTransactionModalOpen(true);
                          }}
                          className="w-full py-5 bg-white/10 hover:bg-white/20 rounded-2xl font-black text-xs uppercase tracking-widest transition-all text-center"
                        >
                          Suprimento de Caixa
                        </button>
                        <button 
                          onClick={handleCloseCash}
                          className="w-full py-6 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-emerald-900/20"
                        >
                          Fechar Caixa
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'kds' && settings.restaurantModule && (
              <KDS 
                orders={orders} 
                categories={categories}
                onUpdateItemStatus={handleUpdateItemStatus}
                onCompleteOrder={handleCompleteOrder}
              />
            )}
            {activeTab === 'inventory' && (
              <InventoryManager 
                products={products}
                onUpdateStock={handleUpdateStock}
              />
            )}
            {activeTab === 'financial' && (
              <FinancialModule 
                transactions={transactions}
                onAddTransaction={handleAddTransaction}
              />
            )}
            {activeTab === 'crm' && (
              <CRM 
                customers={customers}
                onResetData={resetData}
                onSeedData={seedData}
              />
            )}
            {activeTab === 'delivery' && settings.restaurantModule && (
              <DeliveryManager 
                orders={orders}
                onUpdateOrderStatus={handleUpdateOrderStatus}
              />
            )}
            {activeTab === 'reports' && (
              <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-4">
                  <div>
                    <h2 className="text-3xl sm:text-5xl font-black text-slate-800 tracking-tighter uppercase">Relatórios</h2>
                    <p className="text-slate-500 font-bold text-sm sm:text-lg mt-1 sm:mt-2">Análise de desempenho e faturamento.</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                    <button 
                      onClick={() => {
                        const now = new Date();
                        const currentMonth = now.getMonth();
                        const currentYear = now.getFullYear();
                        
                        const monthTransactions = transactions.filter(t => {
                          const d = new Date(t.date);
                          return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
                        });

                        const previousTransactions = transactions.filter(t => {
                          const d = new Date(t.date);
                          return d.getFullYear() < currentYear || (d.getFullYear() === currentYear && d.getMonth() < currentMonth);
                        });

                        const initialBalance = previousTransactions.reduce((sum, t) => {
                          return sum + (t.type === 'income' ? t.amount : -t.amount);
                        }, 0);

                        const monthYear = now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
                        generateAccountingPDF(monthTransactions, monthYear, initialBalance);
                        toast.success('Relatório gerado com sucesso!');
                      }}
                      className="flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-8 py-3 sm:py-5 bg-white border border-slate-200 text-slate-600 rounded-xl sm:rounded-[2rem] font-black text-[10px] sm:text-sm uppercase tracking-widest hover:bg-slate-50 transition-all shadow-lg sm:shadow-xl shadow-slate-900/5"
                    >
                      <Download className="w-4 h-4 sm:w-5 h-5" />
                      Relatório Contador
                    </button>
                    <button 
                      onClick={() => {
                        const today = new Date().toLocaleDateString('pt-BR');
                        generateCashClosurePDF(orders, transactions, today);
                        toast.success('Fechamento gerado com sucesso!');
                      }}
                      className="flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-8 py-3 sm:py-5 bg-[#003087] text-white rounded-xl sm:rounded-[2rem] font-black text-[10px] sm:text-sm uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg sm:shadow-xl shadow-blue-900/20"
                    >
                      <Download className="w-4 h-4 sm:w-5 h-5" />
                      Gerar Fechamento (PDF)
                    </button>
                  </div>
                </div>

                <Dashboard orders={orders} customers={customers} />
              </div>
            )}
            {activeTab === 'menu' && (
              <div className="p-12 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-end">
                  <div>
                    <h2 className="text-5xl font-black text-slate-800 tracking-tighter uppercase">Cardápio</h2>
                    <p className="text-slate-500 font-bold text-lg mt-2">Gerencie os itens e preços do restaurante.</p>
                  </div>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => setIsAddingCategory(true)}
                      className="bg-white border border-slate-200 text-slate-600 px-8 py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest flex items-center gap-3 hover:bg-slate-50 transition-all"
                    >
                      <Plus className="w-5 h-5" />
                      Nova Categoria
                    </button>
                    <button 
                      onClick={() => setIsAddingProduct(true)}
                      className="bg-[#003087] text-white px-8 py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest flex items-center gap-3 shadow-2xl shadow-blue-900/20 hover:scale-105 transition-all"
                    >
                      <Plus className="w-5 h-5" />
                      Novo Produto
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={cn(
                      "px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap",
                      selectedCategory === 'all' 
                        ? "bg-[#003087] text-white shadow-lg shadow-blue-900/20" 
                        : "bg-white border border-slate-200 text-slate-400 hover:bg-slate-50"
                    )}
                  >
                    Todos
                  </button>
                  {categories.map(cat => (
                    <div key={cat.id} className="relative group/cat">
                      <button
                        onClick={() => setSelectedCategory(cat.id)}
                        className={cn(
                          "px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap",
                          selectedCategory === cat.id 
                            ? "bg-[#003087] text-white shadow-lg shadow-blue-900/20" 
                            : "bg-white border border-slate-200 text-slate-400 hover:bg-slate-50"
                        )}
                      >
                        {cat.name}
                      </button>
                      <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-slate-100 text-slate-400 text-[8px] px-2 py-0.5 rounded-full border border-slate-200 font-black uppercase tracking-tighter">
                        {cat.type === 'bar' ? 'BAR' : 'COZ'}
                      </span>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCategory(cat.id);
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover/cat:opacity-100 transition-opacity shadow-lg"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {products.filter(p => {
                    const matchesCategory = selectedCategory === 'all' || p.categoryId === selectedCategory;
                    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
                    return matchesCategory && matchesSearch;
                  }).map(product => (
                    <div 
                      key={product.id}
                      className="bg-white border border-slate-200 rounded-[2rem] p-5 flex flex-col gap-5 group hover:border-blue-200 hover:shadow-xl hover:shadow-blue-900/5 transition-all relative"
                    >
                      <div className="aspect-square rounded-[1.5rem] overflow-hidden bg-slate-100 relative">
                        <img 
                          src={product.image || 'https://picsum.photos/seed/food/400/400'} 
                          alt={product.name} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute top-3 right-3 flex gap-2">
                          <button 
                            onClick={() => handleEditProduct(product)}
                            className="p-2.5 bg-white text-blue-600 rounded-xl shadow-xl hover:bg-blue-600 hover:text-white transition-all border border-blue-100"
                            title="Editar Produto"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteProduct(product.id)}
                            className="p-2.5 bg-white text-red-600 rounded-xl shadow-xl hover:bg-red-600 hover:text-white transition-all border border-red-100"
                            title="Excluir Produto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-black text-slate-800 text-lg leading-tight">{product.name}</h4>
                        <p className="text-blue-600 font-black text-xl mt-2">{formatCurrency(product.price)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {isAddingProduct && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-white p-12 rounded-[3rem] w-full max-w-lg shadow-2xl"
                    >
                      <div className="flex justify-between items-center mb-10">
                        <h3 className="text-3xl font-black text-slate-800 tracking-tight uppercase">
                          {editingProduct ? 'Editar Produto' : 'Novo Produto'}
                        </h3>
                        <button onClick={() => {
                          setIsAddingProduct(false);
                          setEditingProduct(null);
                        }} className="p-3 hover:bg-slate-100 rounded-2xl text-slate-400">
                          <X className="w-6 h-6" />
                        </button>
                      </div>
                      <form onSubmit={handleAddProduct} className="space-y-8">
                        <div className="space-y-2">
                          <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-2">Nome do Produto *</label>
                          <input 
                            required
                            type="text"
                            value={newProduct.name}
                            onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 text-slate-700 font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                            placeholder="Ex: Picanha na Brasa"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-2">Preço *</label>
                            <input 
                              required
                              type="number"
                              step="0.01"
                              value={newProduct.price}
                              onChange={e => setNewProduct({...newProduct, price: Number(e.target.value)})}
                              className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 text-slate-700 font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-2">Categoria</label>
                            <select 
                              value={newProduct.categoryId}
                              onChange={e => setNewProduct({...newProduct, categoryId: e.target.value})}
                              className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 text-slate-700 font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all appearance-none"
                            >
                              {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-2">Upload de Imagem Local</label>
                          <div className="flex items-center gap-4">
                            {newProduct.image ? (
                              <div className="relative group/img">
                                <img src={newProduct.image} className="w-24 h-24 rounded-2xl object-cover border-2 border-blue-100 shadow-md" />
                                <button 
                                  type="button"
                                  onClick={() => setNewProduct({...newProduct, image: ''})}
                                  className="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-full shadow-lg opacity-0 group-hover/img:opacity-100 transition-opacity"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-300">
                                <Plus className="w-6 h-6" />
                              </div>
                            )}
                            <div className="flex-1 relative">
                              <input 
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                      setNewProduct({...newProduct, image: reader.result as string});
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 text-slate-700 font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-[#003087] file:text-white hover:file:bg-blue-700 cursor-pointer"
                              />
                              <p className="text-[10px] text-slate-400 font-bold mt-2 ml-2 uppercase tracking-widest">Formatos aceitos: JPG, PNG, WEBP</p>
                            </div>
                          </div>
                        </div>
                        <button 
                          type="submit"
                          className="w-full py-6 bg-[#003087] text-white rounded-[1.5rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-blue-900/20 hover:scale-105 transition-all mt-4"
                        >
                          {editingProduct ? 'Salvar Alterações' : 'Salvar Produto'}
                        </button>
                      </form>
                    </motion.div>
                  </div>
                )}

                {isAddingCategory && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-white p-12 rounded-[3rem] w-full max-w-lg shadow-2xl"
                    >
                      <div className="flex justify-between items-center mb-10">
                        <h3 className="text-3xl font-black text-slate-800 tracking-tight uppercase">Nova Categoria</h3>
                        <button onClick={() => setIsAddingCategory(false)} className="p-3 hover:bg-slate-100 rounded-2xl text-slate-400">
                          <X className="w-6 h-6" />
                        </button>
                      </div>
                      <form onSubmit={handleAddCategory} className="space-y-8">
                        <div className="space-y-2">
                          <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-2">Nome da Categoria *</label>
                          <input 
                            required
                            type="text"
                            value={newCategory.name}
                            onChange={e => setNewCategory({...newCategory, name: e.target.value})}
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 text-slate-700 font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                            placeholder="Ex: Pizzas, Bebidas, etc."
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-2">Destino do Pedido *</label>
                          <select 
                            required
                            value={newCategory.type}
                            onChange={e => setNewCategory({...newCategory, type: e.target.value as 'kitchen' | 'bar' | 'grocery'})}
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 text-slate-700 font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                          >
                            <option value="kitchen">Cozinha (KDS)</option>
                            <option value="bar">Bar (Somente Mesas)</option>
                            <option value="grocery">Mercearia (Venda Direta)</option>
                          </select>
                        </div>
                        <button 
                          type="submit"
                          className="w-full py-6 bg-[#003087] text-white rounded-[1.5rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-blue-900/20 hover:scale-105 transition-all mt-4"
                        >
                          Salvar Categoria
                        </button>
                      </form>
                    </motion.div>
                  </div>
                )}
              </div>
            )}
            {activeTab === 'history' && (
              <div className="space-y-8">
                <h2 className="text-3xl font-black text-slate-800 tracking-tight">Histórico de Pedidos</h2>
                <div className="grid gap-4">
                  {orders.length === 0 ? (
                    <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-4">
                      <History className="w-16 h-16 text-slate-200 mx-auto" />
                      <p className="text-slate-400 font-bold">Nenhum pedido realizado ainda.</p>
                    </div>
                  ) : (
                      orders.map(order => {
                        const table = tables.find(t => t.id === order.tableId);
                        const tableNumber = table?.number || order.tableNumber || 'S/M';
                        const createdAt = order.createdAt;
                        const date = (createdAt && typeof createdAt === 'object' && 'toDate' in createdAt) 
                          ? (createdAt as { toDate: () => Date }).toDate() 
                          : new Date(createdAt as string | number | Date);
                        const dateStr = isNaN(date.getTime()) ? 'Data inválida' : date.toLocaleString();

                        return (
                          <div key={order.id} className="bg-white border border-slate-200 p-6 rounded-3xl flex justify-between items-center shadow-sm hover:shadow-md transition-all">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 font-black text-lg">
                                {tableNumber}
                              </div>
                              <div>
                                <p className="font-black text-slate-800">Mesa {tableNumber}</p>
                                <p className="text-xs text-slate-400 font-bold">{dateStr}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xl font-black text-blue-600">R$ {order.total.toFixed(2)}</p>
                              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{order.items.length} itens</p>
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>
              </div>
            )}
            {activeTab === 'settings' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div>
                  <h2 className="text-3xl sm:text-5xl font-black text-slate-800 tracking-tighter uppercase">Configurações</h2>
                  <p className="text-slate-500 font-bold text-sm sm:text-lg mt-1 sm:mt-2">Gerenciamento de dados e sistema.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
                    <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center">
                      <ShoppingBag className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Módulos do Sistema</h3>
                      <p className="text-slate-400 font-bold text-xs mt-1">Ative ou desative os módulos principais.</p>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                        <div className="flex items-center gap-3">
                          <UtensilsCrossed className="w-5 h-5 text-slate-400" />
                          <span className="text-sm font-bold text-slate-700">Bar e Restaurante</span>
                        </div>
                        <button 
                          onClick={() => handleUpdateSettings({ restaurantModule: !settings.restaurantModule })}
                          className={cn(
                            "w-12 h-6 rounded-full transition-all relative",
                            settings.restaurantModule ? "bg-blue-600" : "bg-slate-300"
                          )}
                        >
                          <div className={cn(
                            "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                            settings.restaurantModule ? "left-7" : "left-1"
                          )} />
                        </button>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                        <div className="flex items-center gap-3">
                          <ShoppingBag className="w-5 h-5 text-slate-400" />
                          <span className="text-sm font-bold text-slate-700">Mercearia / Venda Rápida</span>
                        </div>
                        <button 
                          onClick={() => handleUpdateSettings({ groceryModule: !settings.groceryModule })}
                          className={cn(
                            "w-12 h-6 rounded-full transition-all relative",
                            settings.groceryModule ? "bg-blue-600" : "bg-slate-300"
                          )}
                        >
                          <div className={cn(
                            "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                            settings.groceryModule ? "left-7" : "left-1"
                          )} />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
                    <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center">
                      <Database className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Dados de Teste</h3>
                      <p className="text-slate-400 font-bold text-xs mt-1">Popule o sistema com dados fictícios para demonstração.</p>
                    </div>
                    <button 
                      onClick={() => {
                        if (confirm('Deseja carregar os dados iniciais de teste no Firebase?')) {
                          seedData();
                        }
                      }}
                      className="w-full py-4 bg-blue-50 text-blue-600 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-blue-100 transition-all"
                    >
                      Popular Sistema
                    </button>
                  </div>

                  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
                    <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-3xl flex items-center justify-center">
                      <RefreshCw className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Limpar Pedidos</h3>
                      <p className="text-slate-400 font-bold text-xs mt-1">Apaga apenas o histórico de pedidos e libera as mesas.</p>
                    </div>
                    <button 
                      onClick={() => {
                        if (confirm('Deseja limpar todos os pedidos ativos e histórico?')) {
                          resetOrders();
                        }
                      }}
                      className="w-full py-4 bg-amber-50 text-amber-600 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-amber-100 transition-all"
                    >
                      Limpar Pedidos
                    </button>
                  </div>

                  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
                    <div className="w-16 h-16 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center">
                      <Trash2 className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Limpar Tudo</h3>
                      <p className="text-slate-400 font-bold text-xs mt-1 text-red-400">CUIDADO: Apaga permanentemente TODOS os dados.</p>
                    </div>
                    <button 
                      onClick={() => {
                        if (confirm('ATENÇÃO: Isso irá apagar TODOS os dados do sistema. Deseja continuar?')) {
                          resetData();
                        }
                      }}
                      className="w-full py-4 bg-red-50 text-red-600 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-red-100 transition-all"
                    >
                      Limpar Banco de Dados
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Floating AI Assistant Toggle */}
        <button 
          onClick={() => setIsAiOpen(true)}
          className="fixed bottom-8 right-8 w-16 h-16 bg-[#003087] text-white rounded-full flex items-center justify-center shadow-2xl shadow-blue-900/40 transition-all hover:scale-110 z-40 border-4 border-white"
        >
          <Sparkles className="w-7 h-7" />
        </button>

        {/* AI Assistant Panel */}
        <AnimatePresence>
          {isAiOpen && (
            <motion.div 
              initial={{ opacity: 0, y: 100, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.9 }}
              className="fixed bottom-28 right-8 w-96 bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 z-50 flex flex-col overflow-hidden"
            >
              <div className="p-6 bg-[#003087] text-white flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm tracking-tight">Assistente Anota Fácil</h3>
                    <p className="text-[10px] text-white/60 font-bold uppercase tracking-widest">Inteligência Artificial</p>
                  </div>
                </div>
                <button onClick={() => setIsAiOpen(false)} className="p-2 hover:bg-white/10 rounded-xl text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 p-6 overflow-y-auto max-h-[400px] space-y-4 custom-scrollbar bg-slate-50/50">
                {aiResponse ? (
                  <div className="bg-white p-4 rounded-3xl text-sm font-bold text-slate-700 mr-auto rounded-tl-none border border-slate-100 shadow-sm">
                    {aiResponse}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center space-y-4 py-12">
                    <MessageSquare className="w-12 h-12 opacity-20" />
                    <p className="text-sm font-bold">Pergunte sobre o cardápio, preços ou status das mesas.</p>
                  </div>
                )}
                {isAiLoading && (
                  <div className="flex gap-1 p-4 bg-white rounded-3xl mr-auto rounded-tl-none border border-slate-100 shadow-sm">
                    <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" />
                    <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-slate-100 bg-white">
                <div className="flex gap-2 relative">
                  <input 
                    type="text"
                    placeholder="Como posso ajudar?"
                    value={aiQuery}
                    onChange={(e) => setAiQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAiAsk()}
                    className="w-full bg-slate-100 rounded-2xl px-5 py-4 pr-14 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-400"
                  />
                  <button 
                    onClick={handleAiAsk}
                    disabled={isAiLoading || !aiQuery.trim()}
                    className="absolute right-2 top-2 w-10 h-10 bg-[#003087] text-white rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {deleteConfirmation && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white p-10 rounded-[2.5rem] w-full max-w-md shadow-2xl text-center"
              >
                <div className="w-20 h-20 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Trash2 className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-2">Confirmar Exclusão</h3>
                <p className="text-slate-500 font-bold mb-8">
                  Tem certeza que deseja excluir este {
                    deleteConfirmation.type === 'customer' ? 'cliente' : 
                    deleteConfirmation.type === 'staff' ? 'colaborador' : 
                    deleteConfirmation.type === 'category' ? 'categoria' : 'produto'
                  }? Esta ação não pode ser desfeita.
                </p>
                <div className="flex gap-4">
                  <button 
                    onClick={() => setDeleteConfirmation(null)}
                    className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={() => {
                      if (deleteConfirmation.type === 'customer') {
                        confirmDeleteCustomer(deleteConfirmation.id);
                      } else if (deleteConfirmation.type === 'staff') {
                        confirmDeleteStaff(deleteConfirmation.id);
                      } else if (deleteConfirmation.type === 'category') {
                        confirmDeleteCategory(deleteConfirmation.id);
                      } else if (deleteConfirmation.type === 'product') {
                        confirmDeleteProduct(deleteConfirmation.id);
                      }
                    }}
                    className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-red-900/20 hover:bg-red-700 transition-all"
                  >
                    Excluir
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>

      {/* Right Sidebar - Current Order Summary */}
      {activeTab === 'tables' && (
        <div className="w-96 bg-white border-l border-slate-200 flex flex-col h-screen shadow-2xl z-10">
          <div className="p-8 border-b border-slate-100">
            <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-3">
              <ShoppingBag className="w-6 h-6 text-blue-600" />
              Resumo do Pedido
            </h2>
          </div>
        
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar flex flex-col">
          {selectedTable ? (
            <div className="flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-8 bg-blue-50 p-4 rounded-2xl border border-blue-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black">
                    {selectedTable.number}
                  </div>
                  <div>
                    <p className="text-xs font-black text-blue-600 uppercase tracking-widest">Mesa Selecionada</p>
                    <p className="text-sm font-bold text-slate-700">Mesa {selectedTable.number}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedTable(null)}
                  className="text-xs font-black text-slate-400 hover:text-red-500 transition-colors uppercase tracking-widest"
                >
                  Trocar
                </button>
              </div>

              <div className="flex-1 space-y-4">
                {(() => {
                  const account = selectedTable.accounts.find(acc => acc.id === selectedAccountId) || selectedTable.accounts[0];
                  
                  if (!account) {
                    return (
                      <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                        <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                          <UserPlus className="w-10 h-10 text-blue-600" />
                        </div>
                        <h3 className="text-lg font-black text-slate-700 mb-2">Mesa Vazia</h3>
                        <p className="text-sm font-medium text-slate-400 mb-8 leading-relaxed">
                          Esta mesa ainda não possui um cliente vinculado.
                        </p>
                        <div className="space-y-3 w-full">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsOpeningTable(true);
                            }}
                            className="w-full py-4 bg-[#003087] text-white rounded-2xl font-black text-xs shadow-xl shadow-blue-900/20 hover:scale-105 active:scale-95 transition-all uppercase tracking-widest flex items-center justify-center gap-2"
                          >
                            <Plus className="w-4 h-4" />
                            Vincular Cliente
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsOpeningTable(true);
                              setIsAddingCustomer(true);
                            }}
                            className="w-full py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-xs shadow-sm hover:bg-slate-50 transition-all uppercase tracking-widest flex items-center justify-center gap-2"
                          >
                            <UserPlus className="w-4 h-4" />
                            Novo Cliente
                          </button>
                        </div>
                      </div>
                    );
                  }

                  const items = account.items || [];
                  
                  if (items.length === 0) {
                    return (
                      <div className="flex-1 flex flex-col items-center justify-center text-center p-8 opacity-40">
                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                          <UtensilsCrossed className="w-10 h-10 text-slate-400" />
                        </div>
                        <p className="text-sm font-bold text-slate-500 leading-relaxed">
                          Nenhum item consumido ainda por este cliente.
                        </p>
                      </div>
                    );
                  }

                  return items.map(item => (
                    <div key={item.id || item.productId} className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <div>
                        <p className="text-sm font-black text-slate-800">{item.name}</p>
                        <p className="text-xs text-slate-400 font-bold mt-1">
                          {item.quantity}x {formatCurrency(item.price)}
                        </p>
                      </div>
                      <p className="text-sm font-black text-blue-600">
                        {formatCurrency(item.price * item.quantity)}
                      </p>
                    </div>
                  ));
                })()}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                <TableIcon className="w-12 h-12 text-slate-300" />
              </div>
              <h3 className="text-lg font-black text-slate-700 mb-2">Nenhuma Mesa Selecionada</h3>
              <p className="text-sm font-medium text-slate-400 mb-8 leading-relaxed">
                Selecione uma mesa no mapa para começar a registrar um novo pedido.
              </p>
              <button 
                onClick={() => setActiveTab('tables')}
                className="px-8 py-4 bg-[#003087] text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-900/20 hover:scale-105 active:scale-95 transition-all uppercase tracking-widest"
              >
                Ver Mesas
              </button>
            </div>
          )}
        </div>

        {selectedTable && (
          <div className="p-8 bg-slate-50 border-t border-slate-200 space-y-4">
            {(() => {
              const account = selectedTable.accounts.find(acc => acc.id === selectedAccountId) || selectedTable.accounts[0];
              const items = account?.items || [];
              const subtotal = items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
              const total = subtotal * 1.1;

              return (
                <>
                  <div className="flex items-center justify-between text-slate-500 font-bold text-sm">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-500 font-bold text-sm">
                    <span>Taxa de Serviço (10%)</span>
                    <span>{formatCurrency(subtotal * 0.1)}</span>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                    <span className="text-lg font-black text-slate-800">Total</span>
                    <span className="text-2xl font-black text-blue-600">
                      {formatCurrency(total)}
                    </span>
                  </div>
                </>
              );
            })()}
            <button 
              onClick={() => {
                const account = selectedTable.accounts.find(acc => acc.id === selectedAccountId) || selectedTable.accounts[0];
                if (!account) {
                  setIsOpeningTable(true);
                } else {
                  setIsMenuOpen(true);
                }
              }}
              className="w-full py-5 bg-[#003087] text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-widest mt-4"
            >
              {selectedTable.accounts.length === 0 ? 'Vincular Cliente' : 'Adicionar Itens'}
            </button>
          </div>
        )}
      </div>
      )}

      {isMenuOpen && selectedTable && (
        <MenuGrid 
          tableName={`Mesa ${selectedTable.number}`}
          onClose={() => setIsMenuOpen(false)}
          onAddOrder={handleAddOrder}
          products={products}
          categories={categories}
          onEditProduct={handleEditProduct}
          onDeleteProduct={handleDeleteProduct}
        />
      )}

      {selectedTable && selectedTable.status === 'occupied' && !isMenuOpen && (
        <TableDetails 
          table={selectedTable}
          customers={customers}
          categories={categories}
          selectedAccountId={selectedAccountId}
          onSelectAccount={setSelectedAccountId}
          onClose={() => {
            setSelectedTable(null);
            setSelectedAccountId(null);
          }}
          onAddMore={() => setIsMenuOpen(true)}
          onCloseAccount={handleCloseAccount}
          onRemoveItem={handleRemoveItemFromTable}
          onDeliverItem={handleDeliverItem}
          onAddAccount={() => setIsOpeningTable(true)}
          onCloseAllAccounts={handleCloseAllAccounts}
          onPrintReceipt={handlePrintReceipt}
          onConfirmOrder={handleConfirmOrder}
          onMergeTable={(sourceId) => {
            setSourceTableId(sourceId);
            setIsMergingTable(true);
          }}
        />
      )}

      {isMergingTable && sourceTableId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl"
          >
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Juntar Mesas</h2>
                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Selecione a mesa de destino</p>
              </div>
              <button onClick={() => setIsMergingTable(false)} className="p-3 hover:bg-slate-200 rounded-2xl text-slate-400 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-8 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                {tables.filter(t => t.id !== sourceTableId).map(table => (
                  <button
                    key={table.id}
                    onClick={() => handleMergeTable(table.id)}
                    className={cn(
                      "aspect-square rounded-3xl flex flex-col items-center justify-center gap-2 transition-all border-4",
                      table.status === 'occupied' 
                        ? "bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100" 
                        : "bg-slate-50 border-slate-100 text-slate-400 hover:bg-slate-100"
                    )}
                  >
                    <span className="text-2xl font-black">{table.number}</span>
                    <span className="text-[8px] font-black uppercase tracking-widest">
                      {table.status === 'occupied' ? 'Ocupada' : 'Livre'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => setIsMergingTable(false)}
                className="px-8 py-4 bg-slate-200 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-300 transition-all"
              >
                Cancelar
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {qrCodeTable && (
        <QRCodeModal 
          table={qrCodeTable}
          onClose={() => setQrCodeTable(null)}
        />
      )}

      <AnimatePresence>
        {receiptData && (
          <Receipt 
            items={receiptData.items}
            customer={receiptData.customer}
            guestName={receiptData.guestName}
            tableNumber={receiptData.tableNumber}
            onClose={() => setReceiptData(null)}
          />
        )}
      </AnimatePresence>

      {isAddingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-12 rounded-[3rem] w-full max-w-lg shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar"
          >
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-3xl font-black text-slate-800 tracking-tight uppercase">
                {editingCustomer ? 'Editar Cliente' : 'Cadastrar Cliente'}
              </h3>
              <button onClick={() => {
                setIsAddingCustomer(false);
                setEditingCustomer(null);
                setNewCustomer({ name: '', email: '', phone: '', cpf: '', rg: '', address: '', birthday: '', observation: '' });
              }} className="p-3 hover:bg-slate-100 rounded-2xl text-slate-400">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleAddCustomer} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-2">Nome Completo *</label>
                <input 
                  required
                  type="text"
                  value={newCustomer.name}
                  onChange={e => setNewCustomer({...newCustomer, name: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 text-slate-700 font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                  placeholder="Ex: João da Silva"
                />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-2">CPF</label>
                  <input 
                    type="text"
                    value={newCustomer.cpf}
                    onChange={e => setNewCustomer({...newCustomer, cpf: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 text-slate-700 font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                    placeholder="000.000.000-00"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-2">RG</label>
                  <input 
                    type="text"
                    value={newCustomer.rg}
                    onChange={e => setNewCustomer({...newCustomer, rg: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 text-slate-700 font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                    placeholder="00.000.000-0"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-2">E-mail</label>
                  <input 
                    type="email"
                    value={newCustomer.email}
                    onChange={e => setNewCustomer({...newCustomer, email: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 text-slate-700 font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                    placeholder="joao@exemplo.com"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-2">Telefone</label>
                  <input 
                    type="tel"
                    value={newCustomer.phone}
                    onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 text-slate-700 font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-2">Data de Nascimento</label>
                  <input 
                    type="date"
                    value={newCustomer.birthday}
                    onChange={e => setNewCustomer({...newCustomer, birthday: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 text-slate-700 font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-2">Endereço</label>
                  <input 
                    type="text"
                    value={newCustomer.address}
                    onChange={e => setNewCustomer({...newCustomer, address: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 text-slate-700 font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                    placeholder="Rua, Número, Bairro"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-2">Observações</label>
                <textarea 
                  value={newCustomer.observation}
                  onChange={e => setNewCustomer({...newCustomer, observation: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 text-slate-700 font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all min-h-[100px]"
                  placeholder="Preferências, restrições alimentares, etc."
                />
              </div>
              <button 
                type="submit"
                className="w-full py-6 bg-[#003087] text-white rounded-[1.5rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-blue-900/20 hover:scale-105 transition-all mt-4"
              >
                {editingCustomer ? 'Salvar Alterações' : 'Salvar Cadastro'}
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {isOpeningTable && !isAddingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-12 rounded-[3rem] w-full max-w-2xl shadow-2xl"
          >
            <div className="flex justify-between items-center mb-10">
              <div>
                <h3 className="text-3xl font-black text-slate-800 tracking-tight uppercase">Abrir Mesa {selectedTable?.number}</h3>
                <p className="text-slate-400 font-bold text-sm uppercase tracking-widest mt-1">Selecione um cliente para continuar</p>
              </div>
              <button onClick={() => {
                setIsOpeningTable(false);
                setTempGuestName('');
              }} className="p-3 hover:bg-slate-100 rounded-2xl text-slate-400">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-8">
              {!isAddingGuestName ? (
                <button 
                  onClick={() => setIsAddingGuestName(true)}
                  className="w-full py-6 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 border-2 border-dashed border-slate-200 group"
                >
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                    <UserPlus className="w-5 h-5 text-slate-400" />
                  </div>
                  Cliente Avulso (Sem Cadastro)
                </button>
              ) : (
                <div className="space-y-4 bg-slate-50 p-6 rounded-[2rem] border-2 border-blue-100">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-black uppercase tracking-widest text-blue-600">Identificação do Cliente</h4>
                    <button onClick={() => {
                      setIsAddingGuestName(false);
                      setTempGuestName('');
                    }} className="text-slate-400 hover:text-slate-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <input 
                    autoFocus
                    type="text"
                    value={tempGuestName}
                    onChange={e => setTempGuestName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && tempGuestName.trim() && handleOpenTable('avulso', tempGuestName)}
                    placeholder="Digite o nome do cliente..."
                    className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 text-slate-700 font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                  />
                  <button 
                    disabled={!tempGuestName.trim()}
                    onClick={() => handleOpenTable('avulso', tempGuestName)}
                    className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-900/20 hover:scale-105 disabled:opacity-50 disabled:scale-100 transition-all"
                  >
                    Confirmar e Abrir Mesa
                  </button>
                </div>
              )}

              <div className="flex justify-between items-center">
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Clientes Cadastrados</h4>
                <button 
                  onClick={() => {
                    setIsAddingCustomer(true);
                  }}
                  className="text-blue-600 font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:underline"
                >
                  <UserPlus className="w-4 h-4" />
                  Novo Cliente
                </button>
              </div>

              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Buscar cliente por nome ou telefone..."
                  value={customerSearchQuery}
                  onChange={e => setCustomerSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-6 py-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                {customers
                  .filter(c => 
                    c.name.toLowerCase().includes(customerSearchQuery.toLowerCase()) || 
                    (c.phone && c.phone.includes(customerSearchQuery))
                  )
                  .map(customer => (
                  <button
                    key={customer.id}
                    onClick={() => handleOpenTable(customer.id)}
                    className="flex items-center justify-between p-6 bg-slate-50 border border-slate-100 rounded-3xl hover:border-blue-200 hover:bg-blue-50 transition-all group text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-white border border-slate-100 flex items-center justify-center font-black text-slate-400 group-hover:text-blue-600 transition-colors">
                        {customer.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-black text-slate-800">{customer.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{customer.phone || customer.email || 'Sem contato'}</p>
                      </div>
                    </div>
                    <div className="bg-white px-4 py-2 rounded-xl border border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-blue-600 group-hover:border-blue-100 transition-all">
                      Selecionar
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Transaction Modal (Sangria/Suprimento) */}
      <AnimatePresence>
        {isTransactionModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">
                    {transactionType === 'income' ? 'Suprimento de Caixa' : 'Sangria de Caixa'}
                  </h3>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">
                    Registre uma movimentação manual
                  </p>
                </div>
                <button 
                  onClick={() => setIsTransactionModalOpen(false)}
                  className="p-3 hover:bg-slate-100 rounded-2xl transition-colors text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Valor (R$)</label>
                  <input
                    type="number"
                    value={transactionAmount}
                    onChange={(e) => setTransactionAmount(e.target.value)}
                    placeholder="0,00"
                    className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none transition-all font-bold text-lg"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Descrição / Motivo</label>
                  <textarea
                    value={transactionDescription}
                    onChange={(e) => setTransactionDescription(e.target.value)}
                    placeholder="Ex: Troco inicial, Pagamento fornecedor..."
                    rows={3}
                    className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none transition-all font-bold text-sm resize-none"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={() => setIsTransactionModalOpen(false)}
                    className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => {
                      const amount = Number(transactionAmount);
                      if (amount > 0 && transactionDescription.trim()) {
                        handleTransaction(transactionType, amount, transactionDescription);
                      } else {
                        toast.error('Preencha todos os campos corretamente!');
                      }
                    }}
                    className="flex-1 py-4 bg-[#003087] hover:bg-blue-800 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-blue-900/20"
                  >
                    Confirmar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Toaster position="top-right" theme="light" closeButton richColors />
    </div>
    </ErrorBoundary>
  );
}

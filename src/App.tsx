import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { TableGrid } from './components/TableGrid';
import { MenuGrid } from './components/MenuGrid';
import { TableDetails } from './components/TableDetails';
import { Receipt } from './components/Receipt';
import { QRCodeModal } from './components/QRCodeModal';
import { MOCK_PRODUCTS, MOCK_CATEGORIES, MOCK_CUSTOMERS } from './mockData';
import { Table, OrderItem, Order, Customer, Staff, Category, Product, Transaction, TableAccount } from './types';
import { Toaster, toast } from 'sonner';
import { GoogleGenAI } from "@google/genai";
import { generateAccountingPDF } from './lib/pdfGenerator';
import { MessageSquare, Sparkles, X, UtensilsCrossed, History, ShoppingBag, Table as TableIcon, Plus, Users, BarChart3, UserPlus, Phone, Mail, Star, Clock as ClockIcon, CheckCircle2, Wallet, TrendingUp, Edit, Trash2, Download, Search, User as UserIcon, ArrowRight as ArrowRightIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, formatCurrency } from './lib/utils';
import { db, auth, handleFirestoreError, OperationType } from './firebase';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
  serverTimestamp,
  writeBatch,
  DocumentReference
} from 'firebase/firestore';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signInAnonymously,
  User
} from 'firebase/auth';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [tables, setTables] = useState<Table[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
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
  const [clientTempName, setClientTempName] = useState('');

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

  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<'income' | 'expense'>('income');
  const [transactionAmount, setTransactionAmount] = useState('');
  const [transactionDescription, setTransactionDescription] = useState('');

  // Firebase Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
      
      // Auto-login anonymously if no user is present to ensure data can be saved
      if (!currentUser) {
        const hasWarned = sessionStorage.getItem('anon_auth_warned');
        signInAnonymously(auth).catch(err => {
          console.error('Erro no login anônimo:', err);
          if (err.code === 'auth/admin-restricted-operation' && !hasWarned) {
            toast.error('Login anônimo desativado!', {
              description: 'Ative "Anonymous" no Firebase Console (Authentication > Sign-in method).'
            });
            sessionStorage.setItem('anon_auth_warned', 'true');
          } else if (err.code !== 'auth/admin-restricted-operation') {
            toast.error('Erro ao realizar login automático. Verifique sua conexão.');
          }
        });
      }
    });
    return () => unsubscribe();
  }, []);

  // Real-time Data Fetching
  useEffect(() => {
    if (!isAuthReady) return;

    const unsubTables = onSnapshot(collection(db, 'tables'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Table));
      setTables(data.sort((a, b) => a.number - b.number));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'tables'));

    const unsubCustomers = onSnapshot(collection(db, 'customers'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer));
      setCustomers(data);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'customers'));

    const unsubCategories = onSnapshot(collection(db, 'categories'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
      setCategories(data);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'categories'));

    const unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(data);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'products'));

    const unsubStaff = onSnapshot(collection(db, 'staff'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Staff));
      setStaff(data);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'staff'));

    const unsubOrders = onSnapshot(query(collection(db, 'orders'), orderBy('createdAt', 'desc')), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      setOrders(data);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'orders'));

    const unsubTransactions = onSnapshot(query(collection(db, 'transactions'), orderBy('date', 'desc')), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
      setTransactions(data);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'transactions'));

    return () => {
      unsubTables();
      unsubCustomers();
      unsubCategories();
      unsubProducts();
      unsubStaff();
      unsubOrders();
      unsubTransactions();
    };
  }, [isAuthReady, user, setTables, setCustomers, setCategories, setProducts, setStaff, setOrders, setTransactions]);

  // Handle Client App Entry
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tableId = urlParams.get('tableId');
    if (tableId && isAuthReady) {
      if (!user) {
        signInAnonymously(auth).catch(err => console.error('Anon login error:', err));
      }
      setClientTableId(tableId);
      setIsClientAppOpen(true);
    }
  }, [isAuthReady, user]);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast.success('Login realizado com sucesso!');
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Erro ao realizar login.');
    }
  };

  const seedData = async () => {
    try {
      const batch = writeBatch(db);
      
      // Tables
      for (let i = 1; i <= 12; i++) {
        const tableRef = doc(collection(db, 'tables'));
        batch.set(tableRef, {
          number: i,
          capacity: i <= 4 ? 2 : (i <= 8 ? 4 : 6),
          status: 'available',
          accounts: [],
          hasPendingOrder: false
        });
      }

      // Categories
      const categoryRefs: { [key: string]: DocumentReference } = {};
      for (const cat of MOCK_CATEGORIES) {
        const catRef = doc(collection(db, 'categories'));
        batch.set(catRef, { name: cat.name, icon: cat.icon });
        categoryRefs[cat.id] = catRef;
      }

      // Products
      for (const prod of MOCK_PRODUCTS) {
        const prodRef = doc(collection(db, 'products'));
        batch.set(prodRef, {
          name: prod.name,
          price: prod.price,
          categoryId: categoryRefs[prod.categoryId]?.id || prod.categoryId,
          image: prod.image
        });
      }

      // Customers
      for (const cust of MOCK_CUSTOMERS) {
        const custRef = doc(collection(db, 'customers'));
        batch.set(custRef, {
          ...cust,
          points: cust.points || 0,
          lastVisit: cust.lastVisit || new Date().toISOString().split('T')[0],
          createdAt: serverTimestamp()
        });
      }

      // Staff
      const mockStaff = [
        { name: 'Carlos Garçom', role: 'waiter', phone: '11911111111', email: 'carlos@luxe.com', registration: 'W001', salary: 2500, status: 'active' },
        { name: 'Ana Gerente', role: 'manager', phone: '11922222222', email: 'ana@luxe.com', registration: 'M001', salary: 5000, status: 'active' },
        { name: 'Roberto Chef', role: 'chef', phone: '11933333333', email: 'roberto@luxe.com', registration: 'C001', salary: 4500, status: 'active' },
      ];
      for (const member of mockStaff) {
        const staffRef = doc(collection(db, 'staff'));
        batch.set(staffRef, {
          ...member,
          createdAt: serverTimestamp()
        });
      }

      await batch.commit();
      toast.success('Dados iniciais carregados com sucesso!');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'seed');
    }
  };

  const [newCategory, setNewCategory] = useState({
    name: '',
    icon: 'Utensils'
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
    categoryId: categories[0]?.id || '',
    image: ''
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
      await addDoc(collection(db, 'tables'), {
        number: nextNumber,
        capacity: 4,
        status: 'available',
        accounts: [],
        hasPendingOrder: false
      });
      toast.success(`Mesa ${nextNumber} criada com sucesso!`);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'tables');
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
    if (!selectedTable) return;
    
    const newAccount: TableAccount = {
      id: Math.random().toString(36).substr(2, 9),
      customerId,
      guestName: guestName || null,
      items: [],
      hasPendingOrder: false,
      openedAt: new Date().toISOString(),
      paymentStatus: 'pending'
    };

    const updatedAccounts = [...selectedTable.accounts, newAccount].map(acc => ({
      ...acc,
      guestName: acc.guestName || null,
      items: acc.items.map(item => ({
        ...item,
        id: item.id || Math.random().toString(36).substr(2, 9)
      }))
    }));

    try {
      await updateDoc(doc(db, 'tables', selectedTable.id), {
        status: 'occupied',
        accounts: updatedAccounts
      });
      
      setSelectedAccountId(newAccount.id);
      setIsOpeningTable(false);
      setIsAddingGuestName(false);
      setTempGuestName('');
      setIsMenuOpen(true);
      
      toast.success(`Mesa ${selectedTable.number} aberta!`);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'tables');
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
      await updateDoc(doc(db, 'tables', tableId), {
        status: 'occupied',
        accounts: updatedAccounts,
        hasPendingOrder: true
      });

      // Create order records for history/tracking
      for (const item of items) {
        await addDoc(collection(db, 'orders'), {
          tableId,
          tableNumber: table.number,
          accountId: selectedAccountId,
          customerName: table.accounts.find(a => a.id === selectedAccountId)?.guestName || 
                        customers.find(c => c.id === table.accounts.find(a => a.id === selectedAccountId)?.customerId)?.name || 
                        'Cliente',
          items: [item],
          total: item.price * item.quantity,
          status: isClientAppOpen ? 'awaiting_confirmation' : 'pending',
          createdAt: serverTimestamp()
        });
      }

      toast.success(`Pedido realizado com sucesso!`);
      
      setIsMenuOpen(false);
      setIsClientAppOpen(false);
      setClientTableId(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'tables');
    }
  };

  const handleConfirmOrder = async (tableId: string, accountId: string, itemIds: string[]) => {
    const table = tables.find(t => t.id === tableId);
    if (!table) return;

    const updatedAccounts = table.accounts.map(acc => {
      if (acc.id === accountId) {
        const newItems = acc.items.map(item => 
          itemIds.includes(item.id!) ? { ...item, status: 'delivered' as const } : item
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
      await updateDoc(doc(db, 'tables', tableId), {
        accounts: updatedAccounts,
        hasPendingOrder: updatedAccounts.some(acc => acc.hasPendingOrder)
      });
      toast.success('Pedido confirmado!');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'tables');
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
      await updateDoc(doc(db, 'tables', tableId), {
        accounts: updatedAccounts,
        hasPendingOrder: updatedAccounts.some(acc => acc.hasPendingOrder)
      });
      toast.success('Item entregue!');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'tables');
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
        await updateDoc(doc(db, 'customers', editingCustomer.id), newCustomer);
        setEditingCustomer(null);
        toast.success('Cadastro realizado!');
      } else {
        const docRef = await addDoc(collection(db, 'customers'), {
          ...newCustomer,
          points: 0,
          lastVisit: new Date().toISOString().split('T')[0],
          createdAt: serverTimestamp()
        });
        toast.success('Cadastro realizado!');
        
        if (isOpeningTable && selectedTable) {
          handleOpenTable(docRef.id);
        }
      }
      
      setNewCustomer({ name: '', email: '', phone: '', cpf: '', rg: '', address: '', birthday: '', observation: '' });
      setIsAddingCustomer(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'customers');
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
      await deleteDoc(doc(db, 'customers', id));
      setDeleteConfirmation(null);
      toast.success('Cliente excluído!');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'customers');
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
      await deleteDoc(doc(db, 'staff', id));
      setDeleteConfirmation(null);
      toast.success('Colaborador excluído!');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'staff');
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
        await updateDoc(doc(db, 'staff', editingStaff.id), newStaff);
        setEditingStaff(null);
        toast.success('Colaborador atualizado!');
      } else {
        await addDoc(collection(db, 'staff'), {
          ...newStaff,
          status: 'active',
          createdAt: serverTimestamp()
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
      handleFirestoreError(err, OperationType.WRITE, 'staff');
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setNewProduct({
      name: product.name,
      price: product.price,
      categoryId: product.categoryId,
      image: product.image || ''
    });
    setIsAddingProduct(true);
  };

  const handleDeleteProduct = (id: string) => {
    setDeleteConfirmation({ id, type: 'product' });
  };

  const confirmDeleteProduct = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'products', id));
      setDeleteConfirmation(null);
      toast.success('Produto excluído!');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'products');
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.price) return;

    try {
      if (editingProduct) {
        await updateDoc(doc(db, 'products', editingProduct.id), newProduct);
        setEditingProduct(null);
        toast.success('Produto atualizado!');
      } else {
        await addDoc(collection(db, 'products'), {
          ...newProduct,
          createdAt: serverTimestamp()
        });
        toast.success('Produto adicionado!');
      }

      setIsAddingProduct(false);
      setNewProduct({
        name: '',
        price: 0,
        categoryId: categories[0]?.id || '',
        image: ''
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'products');
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.name) return;

    try {
      await addDoc(collection(db, 'categories'), {
        ...newCategory,
        createdAt: serverTimestamp()
      });
      toast.success('Categoria criada!');
      setNewCategory({ name: '', icon: 'Utensils' });
      setIsAddingCategory(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'categories');
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
      await deleteDoc(doc(db, 'categories', id));
      setDeleteConfirmation(null);
      toast.success('Categoria excluída!');
      if (selectedCategory === id) setSelectedCategory('all');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'categories');
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
      await updateDoc(doc(db, 'tables', tableId), {
        accounts: updatedAccounts,
        status: allItemsEmpty ? 'available' : table.status,
        hasPendingOrder: updatedAccounts.some(acc => acc.hasPendingOrder)
      });
      toast.success('Item removido!');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'tables');
    }
  };

  const handleCloseAccount = async (tableId: string, accountId: string) => {
    const table = tables.find(t => t.id === tableId);
    if (!table) return;
    
    const account = table.accounts.find(acc => acc.id === accountId);
    if (!account || account.items.length === 0) return;

    const subtotal = account.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const total = subtotal * 1.1; // 10% service tax

    try {
      // Add transaction
      await addDoc(collection(db, 'transactions'), {
        type: 'income',
        amount: total,
        description: `Venda Mesa ${table.number} - Cliente: ${customers.find(c => c.id === account.customerId)?.name || account.guestName || 'Avulso'}`,
        date: new Date().toISOString(),
        paymentMethod: 'card'
      });

      // Add closed order record
      await addDoc(collection(db, 'orders'), {
        tableId,
        tableNumber: table.number,
        accountId: account.id,
        customerName: account.guestName || customers.find(c => c.id === account.customerId)?.name || 'Cliente',
        items: account.items,
        total,
        status: 'closed',
        createdAt: serverTimestamp()
      });

      // Update table
      const remainingAccounts = table.accounts.filter(acc => acc.id !== accountId);
      await updateDoc(doc(db, 'tables', tableId), {
        accounts: remainingAccounts,
        status: remainingAccounts.length === 0 ? 'available' : 'occupied',
        hasPendingOrder: remainingAccounts.some(acc => acc.hasPendingOrder)
      });

      setSelectedTable(null);
      setSelectedAccountId(null);
      toast.success('Conta fechada!');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'tables');
    }
  };

  const handleCloseAllAccounts = async (tableId: string) => {
    const table = tables.find(t => t.id === tableId);
    if (!table || table.accounts.length === 0) return;

    const totalSubtotal = table.accounts.reduce((sum, acc) => 
      sum + acc.items.reduce((accSum, item) => accSum + (item.price * item.quantity), 0), 0
    );
    const totalWithTax = totalSubtotal * 1.1;

    try {
      // Add transaction
      await addDoc(collection(db, 'transactions'), {
        type: 'income',
        amount: totalWithTax,
        description: `Venda Mesa ${table.number} - Fechamento Completo (${table.accounts.length} contas)`,
        date: new Date().toISOString(),
        paymentMethod: 'card'
      });

      // Add closed order record
      await addDoc(collection(db, 'orders'), {
        tableId,
        tableNumber: table.number,
        accountId: 'all',
        customerName: `Mesa ${table.number} (Fechamento Completo)`,
        items: table.accounts.flatMap(acc => acc.items),
        total: totalWithTax,
        status: 'closed',
        createdAt: serverTimestamp()
      });

      // Update table
      await updateDoc(doc(db, 'tables', tableId), {
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
      handleFirestoreError(err, OperationType.WRITE, 'tables');
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
      handleFirestoreError(err, OperationType.WRITE, 'orders');
    }
  };

  const handleTransaction = async (type: 'income' | 'expense', amount: number, description: string) => {
    try {
      await addDoc(collection(db, 'transactions'), {
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
      handleFirestoreError(err, OperationType.WRITE, 'transactions');
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
    
    if (!clientGuestName) {
      return (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
          <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-8">
            <UserIcon className="w-12 h-12 text-blue-600" />
          </div>
          <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tight mb-4">Bem-vindo!</h2>
          <p className="text-slate-500 font-bold max-w-xs leading-relaxed mb-8">
            Você está na <span className="text-blue-600">Mesa {table?.number}</span>. Informe seu nome para acessar o cardápio.
          </p>
          
          <div className="w-full max-w-xs mb-8">
            <input 
              type="text"
              placeholder="Seu Nome"
              value={clientTempName}
              onChange={(e) => setClientTempName(e.target.value)}
              className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-lg font-bold text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>

          <div className="flex flex-col gap-4 w-full max-w-xs">
            <button 
              onClick={() => {
                if (clientTempName.trim()) {
                  setClientGuestName(clientTempName.trim());
                  localStorage.setItem('clientGuestName', clientTempName.trim());
                } else {
                  toast.error('Por favor, informe seu nome.');
                }
              }}
              className="w-full py-4 bg-[#003087] text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-blue-900/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
            >
              Acessar Cardápio
              <ArrowRightIcon className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setIsClientAppOpen(false)}
              className="text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-600 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="fixed inset-0 z-[100] bg-white overflow-hidden">
        <MenuGrid 
          tableName={`Mesa ${table?.number}`}
          guestName={clientGuestName}
          onChangeGuestName={() => {
            setClientGuestName(null);
            localStorage.removeItem('clientGuestName');
            setClientTempName('');
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
              await updateDoc(doc(db, 'tables', clientTableId), {
                accounts: sanitizedAccounts,
                hasPendingOrder: true,
                status: 'occupied'
              });

              // Create order records for history/tracking
              for (const item of itemsWithStatus) {
                await addDoc(collection(db, 'orders'), {
                  tableId: clientTableId,
                  tableNumber: table.number,
                  accountId: account.id,
                  customerName: account.guestName || clientGuestName || 'Cliente QR',
                  items: [item],
                  total: item.price * item.quantity,
                  status: 'awaiting_confirmation',
                  createdAt: serverTimestamp()
                });
              }

              toast.success('Pedido enviado!', {
                description: 'Aguarde a confirmação do garçom.'
              });
              // setIsClientAppOpen(false); // Removido para manter o cliente no cardápio
            } catch (err) {
              handleFirestoreError(err, OperationType.WRITE, 'tables');
            }
          }}
          products={products}
          categories={categories}
        />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#f1f5f9] text-slate-900 font-sans selection:bg-blue-500/30 overflow-hidden">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onSeedData={seedData}
        onLogin={handleLogin}
        user={user}
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
            {activeTab === 'tables' && (
              <TableGrid 
                tables={tables} 
                customers={customers}
                onSelectTable={handleSelectTable} 
                onShowQRCode={(table) => setQrCodeTable(table)}
                onAddTable={handleAddTable}
              />
            )}
            {activeTab === 'active_orders' && (
              <div className="p-12 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-end">
                  <div>
                    <h2 className="text-5xl font-black text-slate-800 tracking-tighter uppercase">Pedidos Ativos</h2>
                    <p className="text-slate-500 font-bold text-lg mt-2">Acompanhe e entregue os pedidos pendentes.</p>
                  </div>
                  <div className="bg-white px-8 py-5 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Pendente</p>
                      <p className="text-2xl font-black text-slate-800">
                        {tables.reduce((sum, t) => sum + t.accounts.reduce((accSum, acc) => accSum + acc.items.filter(i => i.status === 'pending').length, 0), 0)} Itens
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
                      <ClockIcon className="w-6 h-6" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {tables.flatMap(t => t.accounts.filter(acc => acc.hasPendingOrder).map(acc => ({ table: t, account: acc }))).map(({ table, account }) => (
                    <div key={account.id} className="bg-white p-8 rounded-[3rem] border-2 border-red-100 shadow-xl shadow-red-900/5 animate-pulse">
                      <div className="flex justify-between items-center mb-8">
                        <div>
                          <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tight">Mesa {table.number}</h3>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                            {customers.find(c => c.id === account.customerId)?.name}
                          </p>
                        </div>
                        <div className="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest">
                          {account.items.filter(i => i.status === 'pending' || i.status === 'awaiting_confirmation').length} Pendentes
                        </div>
                      </div>

                      <div className="space-y-4">
                        {account.items.filter(i => i.status === 'pending' || i.status === 'awaiting_confirmation').map(item => (
                          <div key={item.id} className="flex justify-between items-center bg-slate-50 p-5 rounded-2xl border border-slate-100">
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-black text-slate-800">{item.name}</p>
                                {item.status === 'awaiting_confirmation' && (
                                  <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-[8px] font-black uppercase tracking-widest animate-pulse">
                                    Aguardando Confirmação
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Qtd: {item.quantity}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              {item.status === 'awaiting_confirmation' && (
                                <button 
                                  onClick={() => handleConfirmOrder(table.id, account.id, [item.id!])}
                                  className="bg-blue-600 text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-900/20 hover:scale-105 transition-all"
                                >
                                  OK
                                </button>
                              )}
                              <button 
                                onClick={() => handleDeliverItem(table.id, account.id, item.id!)}
                                className={cn(
                                  "p-3 rounded-xl shadow-lg transition-all",
                                  item.status === 'awaiting_confirmation' 
                                    ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none" 
                                    : "bg-emerald-500 text-white shadow-emerald-500/20 hover:scale-110"
                                )}
                                disabled={item.status === 'awaiting_confirmation'}
                                title={item.status === 'awaiting_confirmation' ? "Aguardando confirmação" : "Marcar como entregue"}
                              >
                                <CheckCircle2 className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <button 
                        onClick={() => {
                          const itemIds = account.items
                            .filter(i => i.status === 'awaiting_confirmation' || i.status === 'pending')
                            .map(i => i.id!);
                          handleConfirmOrder(table.id, account.id, itemIds);
                        }}
                        className="w-full mt-8 py-4 bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-900/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Confirmar Tudo como Entregue
                      </button>
                    </div>
                  ))}
                  {tables.every(t => t.accounts.every(acc => !acc.hasPendingOrder)) && (
                    <div className="col-span-full py-20 bg-white border border-dashed border-slate-300 rounded-[3rem] flex flex-col items-center justify-center text-slate-400 space-y-4">
                      <ShoppingBag className="w-12 h-12 opacity-20" />
                      <p className="font-bold uppercase tracking-widest text-sm">Nenhum pedido pendente no momento</p>
                    </div>
                  )}
                </div>
              </div>
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
                          const monthYear = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
                          generateAccountingPDF(transactions, monthYear);
                          toast.success('Relatório gerado com sucesso!', {
                            description: 'O PDF foi baixado para o seu dispositivo.'
                          });
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-[#003087] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-900/10"
                      >
                        <Download className="w-3 h-3" />
                        Relatório Contador (PDF)
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
            {activeTab === 'reports' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-end">
                  <div>
                    <h2 className="text-5xl font-black text-slate-800 tracking-tighter uppercase">Relatórios</h2>
                    <p className="text-slate-500 font-bold text-lg mt-2">Análise de desempenho e faturamento.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                    <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-6">
                      <TrendingUp className="w-6 h-6" />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Faturamento Total</p>
                    <p className="text-2xl font-black text-slate-800">{formatCurrency(orders.reduce((sum, o) => sum + o.total, 0))}</p>
                    <div className="mt-4 flex items-center gap-2 text-emerald-500">
                      <TrendingUp className="w-3 h-3" />
                      <span className="text-[10px] font-black uppercase tracking-widest">+12.5% vs ontem</span>
                    </div>
                  </div>

                  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                    <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600 mb-6">
                      <ShoppingBag className="w-6 h-6" />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pedidos Realizados</p>
                    <p className="text-2xl font-black text-slate-800">{orders.length}</p>
                    <div className="mt-4 flex items-center gap-2 text-emerald-500">
                      <TrendingUp className="w-3 h-3" />
                      <span className="text-[10px] font-black uppercase tracking-widest">+4 novos</span>
                    </div>
                  </div>

                  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                    <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 mb-6">
                      <Users className="w-6 h-6" />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Novos Clientes</p>
                    <p className="text-2xl font-black text-slate-800">{customers.length}</p>
                    <div className="mt-4 flex items-center gap-2 text-emerald-500">
                      <TrendingUp className="w-3 h-3" />
                      <span className="text-[10px] font-black uppercase tracking-widest">+2 hoje</span>
                    </div>
                  </div>

                  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                    <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-6">
                      <UtensilsCrossed className="w-6 h-6" />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ticket Médio</p>
                    <p className="text-2xl font-black text-slate-800">
                      {formatCurrency(orders.length > 0 ? orders.reduce((sum, o) => sum + o.total, 0) / orders.length : 0)}
                    </p>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-[3rem] p-12 flex flex-col items-center justify-center text-slate-400 space-y-6 min-h-[400px]">
                  <BarChart3 className="w-20 h-20 opacity-10" />
                  <div className="text-center space-y-2">
                    <p className="font-black uppercase tracking-widest text-sm text-slate-600">Gráficos de Desempenho</p>
                    <p className="text-xs font-medium max-w-xs leading-relaxed">Os gráficos de faturamento por hora e produtos mais vendidos serão exibidos aqui conforme os dados forem acumulados.</p>
                  </div>
                </div>
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
                    orders.map(order => (
                      <div key={order.id} className="bg-white border border-slate-200 p-6 rounded-3xl flex justify-between items-center shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 font-black text-lg">
                            {tables.find(t => t.id === order.tableId)?.number}
                          </div>
                          <div>
                            <p className="font-black text-slate-800">Mesa {tables.find(t => t.id === order.tableId)?.number}</p>
                            <p className="text-xs text-slate-400 font-bold">{new Date(order.createdAt).toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-black text-blue-600">R$ {order.total.toFixed(2)}</p>
                          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{order.items.length} itens</p>
                        </div>
                      </div>
                    ))
                  )}
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
                    <h3 className="font-black text-sm tracking-tight">Assistente LUXE</h3>
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
        />
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
                    setIsOpeningTable(false);
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
  );
}

import { Table, Product, Category, Customer } from './types';

export const MOCK_CATEGORIES: Category[] = [
  { id: '1', name: 'Bebidas', icon: 'Beer', type: 'bar' },
  { id: '2', name: 'Pratos Principais', icon: 'Utensils', type: 'kitchen' },
  { id: '3', name: 'Entradas', icon: 'Soup', type: 'kitchen' },
  { id: '4', name: 'Sobremesas', icon: 'IceCream', type: 'kitchen' },
  { id: '5', name: 'Vinhos', icon: 'Wine', type: 'bar' },
];

export const MOCK_PRODUCTS: Product[] = [
  { id: '1', name: 'Coca-Cola 350ml', price: 6.50, categoryId: '1', image: 'https://picsum.photos/seed/coke/200/200', stock: 50, minStock: 10, unit: 'un', trackStock: true },
  { id: '2', name: 'Suco de Laranja', price: 9.00, categoryId: '1', image: 'https://picsum.photos/seed/orange/200/200', stock: 20, minStock: 5, unit: 'un', trackStock: true },
  { id: '3', name: 'Picanha na Brasa', price: 89.90, categoryId: '2', image: 'https://picsum.photos/seed/steak/200/200', stock: 15, minStock: 3, unit: 'kg', trackStock: true },
  { id: '4', name: 'Filé de Frango Grelhado', price: 45.00, categoryId: '2', image: 'https://picsum.photos/seed/chicken/200/200', stock: 20, minStock: 5, unit: 'kg', trackStock: true },
  { id: '5', name: 'Batata Frita Especial', price: 32.00, categoryId: '3', image: 'https://picsum.photos/seed/fries/200/200', stock: 30, minStock: 10, unit: 'kg', trackStock: true },
  { id: '6', name: 'Bruschetta Italiana', price: 28.00, categoryId: '3', image: 'https://picsum.photos/seed/bruschetta/200/200', stock: 25, minStock: 5, unit: 'un', trackStock: true },
  { id: '7', name: 'Petit Gâteau', price: 24.00, categoryId: '4', image: 'https://picsum.photos/seed/cake/200/200', stock: 12, minStock: 4, unit: 'un', trackStock: true },
  { id: '8', name: 'Pudim de Leite', price: 15.00, categoryId: '4', image: 'https://picsum.photos/seed/pudding/200/200', stock: 10, minStock: 3, unit: 'un', trackStock: true },
  { id: '9', name: 'Vinho Tinto Reserva', price: 120.00, categoryId: '5', image: 'https://picsum.photos/seed/wine/200/200', stock: 8, minStock: 2, unit: 'un', trackStock: true },
];

export const MOCK_CUSTOMERS: Customer[] = [
  { id: '1', name: 'João Silva', email: 'joao@example.com', phone: '11999999999', points: 150, lastVisit: '2026-03-25' },
  { id: '2', name: 'Maria Oliveira', email: 'maria@example.com', phone: '11888888888', points: 320, lastVisit: '2026-03-24' },
  { id: '3', name: 'Pedro Santos', email: 'pedro@example.com', phone: '11777777777', points: 45, lastVisit: '2026-03-26' },
];

export const MOCK_TABLES: Table[] = Array.from({ length: 12 }, (_, i) => ({
  id: `${i + 1}`,
  number: i + 1,
  capacity: i % 3 === 0 ? 4 : 2,
  status: i === 5 ? 'reserved' : 'available',
  hasPendingOrder: false,
  accounts: [],
}));

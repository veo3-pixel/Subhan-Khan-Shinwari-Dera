
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import LoginView from './components/LoginView';
import POSView from './components/POSView';
import KitchenView from './components/KitchenView';
import DashboardView from './components/DashboardView';
import InventoryView from './components/InventoryView';
import ExpenseView from './components/ExpenseView';
import ReportsView from './components/ReportsView';
import MenuView from './components/MenuView';
import SettingsView from './components/SettingsView';
import { ReceiptModal } from './components/ReceiptModal';
import { 
  Order, 
  OrderStatus, 
  PaymentMethod, 
  CartItem, 
  InventoryItem, 
  MenuItem, 
  OrderType, 
  Purchase, 
  PurchaseItem,
  StockTransaction, 
  TransactionType, 
  Expense, 
  User, 
  Customer,
  SystemSettings,
  PrinterConfig
} from './types';
import { PersistenceService } from './services/persistenceService';
import { RefreshCw, Check } from 'lucide-react';

type PrintMode = 'RECEIPT' | 'KOT';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState('pos');
  const [orders, setOrders] = useState<Order[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  
  // Reactive Global Settings
  const [settings, setSettings] = useState<SystemSettings>(PersistenceService.getSettings());
  const [printerConfig, setPrinterConfig] = useState<PrinterConfig>(PersistenceService.getPrinterConfig());
  
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error' | 'offline'>('idle');
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [previewOrder, setPreviewOrder] = useState<Order | null>(null);
  const [printMode, setPrintMode] = useState<PrintMode>('RECEIPT');

  useEffect(() => {
    loadLocalData();
    if(settings.sync?.enabled && settings.sync.dropbox.accessToken && navigator.onLine) performSync('PULL');
  }, []);

  const loadLocalData = () => {
    setOrders(PersistenceService.getOrders());
    setInventory(PersistenceService.getInventory());
    setMenuItems(PersistenceService.getMenu());
    setCategories(PersistenceService.getCategories());
    setPurchases(PersistenceService.getPurchases());
    setTransactions(PersistenceService.getTransactions());
    setExpenses(PersistenceService.getExpenses());
    setUsers(PersistenceService.getUsers());
    setCustomers(PersistenceService.getCustomers());
    setSettings(PersistenceService.getSettings());
    setPrinterConfig(PersistenceService.getPrinterConfig());
  };

  const performSync = async (mode: 'PUSH' | 'PULL') => {
      const token = settings.sync?.dropbox.accessToken?.trim();
      if(!settings.sync?.enabled || !token || !navigator.onLine) return;
      setIsSyncing(true);
      try {
          if (mode === 'PULL') {
              const response = await fetch('https://content.dropboxapi.com/2/files/download', {
                  method: 'POST',
                  headers: { 'Authorization': `Bearer ${token}`, 'Dropbox-API-Arg': JSON.stringify({ path: '/shinwari_pos_db.json' }) }
              });
              if (response.ok) {
                  const cloudData = await response.json();
                  PersistenceService.saveAllData(cloudData);
                  loadLocalData();
                  setSyncStatus('success');
              }
          }
      } catch (err) { setSyncStatus('error'); } 
      finally { setIsSyncing(false); setTimeout(() => setSyncStatus('idle'), 5000); }
  };

  const handleUpdateSettings = (newSettings: SystemSettings) => {
      setSettings(newSettings);
      PersistenceService.saveSettings(newSettings);
  };

  const handleUpdatePrinterConfig = (newConfig: PrinterConfig) => {
      setPrinterConfig(newConfig);
      PersistenceService.savePrinterConfig(newConfig);
  };

  const handlePurchase = (supplier: string, items: PurchaseItem[]) => {
      const newPurchase: Purchase = {
          id: Math.random().toString(36).substr(2, 9).toUpperCase(),
          date: new Date(),
          supplier,
          items,
          totalCost: items.reduce((sum, i) => sum + i.cost, 0)
      };

      const updatedPurchases = [newPurchase, ...purchases];
      setPurchases(updatedPurchases);
      PersistenceService.savePurchases(updatedPurchases);

      const updatedInventory = [...inventory];
      const newTransactions = [...transactions];

      items.forEach(pItem => {
          const invIdx = updatedInventory.findIndex(i => i.id === pItem.inventoryItemId);
          if (invIdx >= 0) {
              updatedInventory[invIdx].quantity += pItem.quantity;
              // Update avg cost price
              if (pItem.quantity > 0) {
                updatedInventory[invIdx].costPrice = pItem.cost / pItem.quantity;
              }
              
              newTransactions.push({
                  id: Math.random().toString(36).substr(2, 9).toUpperCase(),
                  inventoryItemId: pItem.inventoryItemId,
                  type: TransactionType.PURCHASE,
                  quantityChange: pItem.quantity,
                  date: new Date(),
                  referenceId: newPurchase.id
              });
          }
      });

      setInventory(updatedInventory);
      PersistenceService.saveInventory(updatedInventory);
      setTransactions(newTransactions);
      PersistenceService.saveTransactions(newTransactions);
  };

  const handleAdjustStock = (itemId: string, newQty: number, reason: string) => {
      const updatedInventory = inventory.map(item => {
          if (item.id === itemId) {
              const diff = newQty - item.quantity;
              const newTxn: StockTransaction = {
                  id: Math.random().toString(36).substr(2, 9).toUpperCase(),
                  inventoryItemId: itemId,
                  type: TransactionType.ADJUSTMENT,
                  quantityChange: diff,
                  date: new Date(),
                  reason
              };
              const updatedTxns = [newTxn, ...transactions];
              setTransactions(updatedTxns);
              PersistenceService.saveTransactions(updatedTxns);
              return { ...item, quantity: newQty };
          }
          return item;
      });
      setInventory(updatedInventory);
      PersistenceService.saveInventory(updatedInventory);
  };

  const handleUpdateMenu = (items: MenuItem[]) => { setMenuItems(items); PersistenceService.saveMenu(items); };
  const handleAddCategory = (name: string) => { if (!categories.includes(name)) { const n = [...categories, name]; setCategories(n); PersistenceService.saveCategories(n); } };
  const handleUpdateCategory = (oldName: string, newName: string) => {
    const updatedCats = categories.map(c => c === oldName ? newName : c);
    setCategories(updatedCats);
    PersistenceService.saveCategories(updatedCats);
    const updatedMenu = menuItems.map(m => m.category === oldName ? { ...m, category: newName } : m);
    handleUpdateMenu(updatedMenu);
  };

  const handlePlaceOrder = (items: CartItem[], total: number, type: OrderType, details: any, method: PaymentMethod): Order => {
    const seqNum = PersistenceService.getNextOrderNumber();
    const newOrder: Order = {
      id: Math.random().toString(36).substr(2, 9).toUpperCase(),
      orderNumber: seqNum,
      type, items, total, status: OrderStatus.PENDING, timestamp: new Date(),
      paymentMethod: method, cashierName: currentUser?.name || 'Admin', ...details
    };
    const updated = [newOrder, ...orders];
    setOrders(updated);
    PersistenceService.saveOrders(updated);
    setCart([]); setPreviewOrder(newOrder); setPrintMode('RECEIPT');
    return newOrder;
  };

  const handleUpdateOrder = (items: CartItem[], total: number, type: OrderType, details: any, method: PaymentMethod): Order => {
    const existing = orders.find(o => o.id === currentOrderId);
    if (!existing) throw new Error("Order not found");
    const updatedOrder = { ...existing, items, total, status: OrderStatus.PENDING, paymentMethod: method, ...details } as Order;
    const updated = orders.map(o => o.id === currentOrderId ? updatedOrder : o);
    setOrders(updated); PersistenceService.saveOrders(updated); setCurrentOrderId(null); setCart([]); setPreviewOrder(updatedOrder);
    return updatedOrder;
  };

  if (!currentUser) return <LoginView users={users} onLogin={setCurrentUser} />;

  const renderContent = () => {
    switch (activeTab) {
      case 'pos': return <POSView settings={settings} menuItems={menuItems} cart={cart} setCart={setCart} currentOrderId={currentOrderId} customers={customers} categories={categories} onPlaceOrder={handlePlaceOrder} onUpdateOrder={handleUpdateOrder} onCancelEdit={() => setCurrentOrderId(null)} onPrintReceipt={(o) => { setPreviewOrder(o); setPrintMode('RECEIPT'); }} />;
      case 'kitchen': return <KitchenView orders={orders} updateOrderStatus={(id, s) => { const u = orders.map(o => o.id === id ? {...o, status: s} : o); setOrders(u); PersistenceService.saveOrders(u); }} onEditOrder={(o) => { setCart(o.items); setCurrentOrderId(o.id); setActiveTab('pos'); }} onPrintKOT={(o) => { setPreviewOrder(o); setPrintMode('KOT'); }} />;
      case 'dashboard': return <DashboardView settings={settings} currentUser={currentUser} orders={orders} purchases={purchases} expenses={expenses} onPrintReceipt={(o) => { setPreviewOrder(o); setPrintMode('RECEIPT'); }} />;
      case 'menu': return <MenuView currentUser={currentUser} menuItems={menuItems} inventory={inventory} categories={categories} onUpdateMenu={handleUpdateMenu} onAddCategory={handleAddCategory} onUpdateCategory={handleUpdateCategory} />;
      case 'inventory': return <InventoryView inventory={inventory} purchases={purchases} transactions={transactions} onAddInventoryItem={(i) => { const n = [...inventory, i]; setInventory(n); PersistenceService.saveInventory(n); }} onUpdateInventoryItem={(i) => { const n = inventory.map(x => x.id === i.id ? i : x); setInventory(n); PersistenceService.saveInventory(n); }} onPurchase={handlePurchase} onAdjustStock={handleAdjustStock} />;
      case 'expenses': return <ExpenseView currentUser={currentUser} expenses={expenses} onAddExpense={(e) => { const n = [e, ...expenses]; setExpenses(n); PersistenceService.saveExpenses(n); }} onDeleteExpense={(id) => { const n = expenses.filter(x => x.id !== id); setExpenses(n); PersistenceService.saveExpenses(n); }} />;
      case 'reports': return <ReportsView currentUser={currentUser} orders={orders} expenses={expenses} purchases={purchases} />;
      case 'settings': return <SettingsView currentUser={currentUser} settings={settings} printerConfig={printerConfig} onUpdateSettings={handleUpdateSettings} onUpdatePrinterConfig={handleUpdatePrinterConfig} />;
      default: return <div className="p-10 text-center text-gray-400">Select a module from the sidebar.</div>;
    }
  };

  return (
    <div className="flex h-screen w-full bg-surface overflow-hidden relative font-sans">
      {syncStatus !== 'idle' && (
          <div className="absolute top-4 right-4 z-[200] bg-secondary text-white px-3 py-1 rounded-full shadow-lg flex items-center gap-2 text-[10px] font-bold">
              {isSyncing ? <RefreshCw size={12} className="animate-spin"/> : <Check size={12}/>}
              {isSyncing ? 'Syncing...' : 'System Ready'}
          </div>
      )}
      {previewOrder && <ReceiptModal settings={settings} printerConfig={printerConfig} order={previewOrder} mode={printMode} onClose={() => setPreviewOrder(null)} />}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} currentUser={currentUser} onLogout={() => setCurrentUser(null)} />
      <main className="flex-1 h-full overflow-hidden relative">{renderContent()}</main>
    </div>
  );
};

export default App;

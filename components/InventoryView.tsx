
import React, { useState, useEffect } from 'react';
import { InventoryItem, Purchase, PurchaseItem, StockTransaction, TransactionType } from '../types';
import { 
    AlertTriangle, Package, ShoppingCart, History, Plus, Save, Minus, 
    Truck, X, Trash2, Edit2, LayoutGrid, Tag, ChevronRight, Search 
} from 'lucide-react';
import { PersistenceService } from '../services/persistenceService';

interface InventoryViewProps {
  inventory: InventoryItem[];
  purchases: Purchase[];
  transactions: StockTransaction[];
  onAddInventoryItem: (item: InventoryItem) => void;
  onUpdateInventoryItem: (item: InventoryItem) => void;
  onPurchase: (supplier: string, items: PurchaseItem[]) => void;
  onAdjustStock: (itemId: string, newQuantity: number, reason: string) => void;
}

const InventoryView: React.FC<InventoryViewProps> = ({ 
    inventory, purchases, transactions, onAddInventoryItem, onUpdateInventoryItem, onPurchase, onAdjustStock 
}) => {
  const [activeTab, setActiveTab] = useState<'STOCK' | 'PURCHASE' | 'HISTORY'>('STOCK');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [categories, setCategories] = useState<string[]>([]);
  
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [newItem, setNewItem] = useState<Partial<InventoryItem>>({ name: '', unit: 'kg', threshold: 5, quantity: 0, category: 'Other' });
  
  const [supplier, setSupplier] = useState('');
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([]);
  const [adjustingItemId, setAdjustingItemId] = useState<string | null>(null);
  const [adjustQty, setAdjustQty] = useState<string>('');
  const [showCatManager, setShowCatManager] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  useEffect(() => {
    setCategories(PersistenceService.getInventoryCategories());
  }, []);

  const handleAddItem = () => {
      if(newItem.name && newItem.unit) {
          onAddInventoryItem({
              id: Math.random().toString(36).substr(2, 9).toUpperCase(),
              name: newItem.name,
              unit: newItem.unit,
              threshold: newItem.threshold || 5,
              quantity: newItem.quantity || 0,
              costPrice: 0,
              category: newItem.category || 'Other'
          });
          setIsAddingItem(false);
          setNewItem({ name: '', unit: 'kg', threshold: 5, quantity: 0, category: 'Other' });
      }
  };

  const filteredInventory = inventory.filter(i => selectedCategory === 'All' || i.category === selectedCategory);

  const addCategory = () => {
      if (newCatName && !categories.includes(newCatName)) {
          const updated = [...categories, newCatName];
          setCategories(updated);
          PersistenceService.saveInventoryCategories(updated);
          setNewCatName('');
      }
  };

  return (
    <div className="p-6 h-full flex flex-col bg-surface overflow-hidden">
      <div className="flex justify-between items-center mb-6">
        <div>
           <h1 className="text-2xl font-bold text-gray-800">Inventory Management</h1>
           <span className="font-urdu text-lg text-gray-500">اسٹاک اور خریداری</span>
        </div>
        
        <div className="flex bg-white rounded-xl p-1 shadow-sm border">
            <button onClick={() => setActiveTab('STOCK')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'STOCK' ? 'bg-secondary text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>
                <Package size={16} /> Stock
            </button>
            <button onClick={() => setActiveTab('PURCHASE')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'PURCHASE' ? 'bg-secondary text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>
                <ShoppingCart size={16} /> Purchases
            </button>
            <button onClick={() => setActiveTab('HISTORY')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'HISTORY' ? 'bg-secondary text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>
                <History size={16} /> History
            </button>
        </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        {activeTab === 'STOCK' && (
            <div className="w-48 shrink-0 bg-white rounded-3xl p-4 shadow-sm border border-gray-100 flex flex-col gap-2 overflow-y-auto no-scrollbar">
                <h3 className="text-[10px] font-black uppercase text-gray-400 mb-2 px-2 flex items-center justify-between">
                    Categories
                    <button onClick={() => setShowCatManager(true)} className="text-primary hover:bg-red-50 p-1 rounded"><Plus size={14}/></button>
                </h3>
                <button onClick={() => setSelectedCategory('All')} className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${selectedCategory === 'All' ? 'bg-primary text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>
                    All Items <ChevronRight size={12}/>
                </button>
                {categories.map(cat => (
                    <button key={cat} onClick={() => setSelectedCategory(cat)} className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${selectedCategory === cat ? 'bg-primary text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>
                        {cat} <ChevronRight size={12}/>
                    </button>
                ))}
            </div>
        )}

        <div className="flex-1 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          {activeTab === 'STOCK' && (
              <div className="flex flex-col h-full">
                  <div className="p-4 border-b flex justify-between items-center bg-gray-50/50">
                      <h3 className="font-bold text-gray-700">{selectedCategory} Stock</h3>
                      <button onClick={() => setIsAddingItem(true)} className="bg-primary text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg flex items-center gap-2">
                          <Plus size={14} /> New Inventory Item
                      </button>
                  </div>
                  <div className="flex-1 overflow-y-auto no-scrollbar">
                      <table className="w-full text-left">
                          <thead className="bg-white border-b sticky top-0 z-10">
                              <tr>
                                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase">Item Name</th>
                                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase">Category</th>
                                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase">Quantity</th>
                                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase">Status</th>
                                  <th className="px-6 py-4 text-right"></th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                              {filteredInventory.map(item => (
                                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                      <td className="px-6 py-4 font-bold text-gray-800">{item.name}</td>
                                      <td className="px-6 py-4"><span className="px-2 py-0.5 rounded-full bg-gray-100 text-[10px] font-bold text-gray-500">{item.category}</span></td>
                                      <td className="px-6 py-4 font-black text-slate-700">{item.quantity} {item.unit}</td>
                                      <td className="px-6 py-4">
                                          {item.quantity <= item.threshold ? (
                                              <span className="px-2 py-1 rounded-lg bg-red-100 text-red-700 text-[10px] font-bold">LOW STOCK</span>
                                          ) : (
                                              <span className="px-2 py-1 rounded-lg bg-green-100 text-green-700 text-[10px] font-bold">STABLE</span>
                                          )}
                                      </td>
                                      <td className="px-6 py-4 text-right">
                                          <button onClick={() => setEditingItem(item)} className="p-2 text-gray-400 hover:text-primary"><Edit2 size={16}/></button>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </div>
          )}

          {/* ... Rest of Inventory Sections (Purchase, History) ... */}
        </div>
      </div>

      {/* NEW ITEM MODAL with Category Selection */}
      {isAddingItem && (
        <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-up">
                <div className="p-6 border-b bg-gray-50 flex justify-between items-center">
                    <h3 className="font-bold text-xl">New Raw Material</h3>
                    <button onClick={() => setIsAddingItem(false)} className="p-2 hover:bg-gray-200 rounded-full"><X size={20}/></button>
                </div>
                <div className="p-8 space-y-4">
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Item Name</label>
                        <input className="w-full border-2 border-gray-100 rounded-xl p-3 outline-none focus:border-primary font-bold" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Category</label>
                        <select className="w-full border-2 border-gray-100 rounded-xl p-3 font-bold" value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})}>
                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Unit</label>
                            <input className="w-full border-2 border-gray-100 rounded-xl p-3 font-bold" value={newItem.unit} onChange={e => setNewItem({...newItem, unit: e.target.value})} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Alert Level</label>
                            <input type="number" className="w-full border-2 border-gray-100 rounded-xl p-3 font-bold" value={newItem.threshold} onChange={e => setNewItem({...newItem, threshold: Number(e.target.value)})} />
                        </div>
                    </div>
                </div>
                <div className="p-6 bg-gray-50 border-t flex justify-end gap-3">
                    <button onClick={() => setIsAddingItem(false)} className="px-6 py-3 font-bold text-gray-500">Cancel</button>
                    <button onClick={handleAddItem} className="px-8 py-3 bg-primary text-white rounded-2xl font-bold shadow-xl shadow-red-100">Save Item</button>
                </div>
            </div>
        </div>
      )}

      {/* CATEGORY MANAGER MODAL */}
      {showCatManager && (
          <div className="fixed inset-0 z-[130] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
                  <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                      <h3 className="font-bold flex items-center gap-2"><Tag size={16}/> Inventory Categories</h3>
                      <button onClick={() => setShowCatManager(false)}><X size={20}/></button>
                  </div>
                  <div className="p-6 space-y-4">
                      <div className="flex gap-2">
                          <input className="flex-1 border rounded-xl px-4 py-2 text-sm font-bold" placeholder="New category..." value={newCatName} onChange={e => setNewCatName(e.target.value)} />
                          <button onClick={addCategory} className="bg-primary text-white px-4 rounded-xl font-bold text-sm">Add</button>
                      </div>
                      <div className="max-h-60 overflow-y-auto space-y-2">
                          {categories.map(c => (
                              <div key={c} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                                  <span className="text-sm font-bold">{c}</span>
                                  <button onClick={() => { 
                                      const u = categories.filter(x => x !== c);
                                      setCategories(u);
                                      PersistenceService.saveInventoryCategories(u);
                                  }} className="text-red-400 hover:text-red-600"><Trash2 size={16}/></button>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default InventoryView;

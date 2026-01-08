
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, Grid, Plus, Minus, Trash2, CreditCard, Banknote, Smartphone, Printer, X, Check, 
  Utensils, ShoppingBag, Bike, Scale, PauseCircle, PlayCircle, Percent, ShoppingCart, Hash,
  Flame, Soup, Coffee, GlassWater, CircleDot, LayoutGrid, UtensilsCrossed, ChevronDown, ChevronRight
} from 'lucide-react';
import { MenuItem, CartItem, Order, PaymentMethod, Addon, OrderType, Variation, OrderStatus, SystemSettings, Customer } from '../types';
import { PersistenceService } from '../services/persistenceService';

interface POSViewProps {
  settings: SystemSettings;
  menuItems: MenuItem[];
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  currentOrderId: string | null;
  customers?: Customer[];
  categories: string[];
  onPlaceOrder: (items: CartItem[], total: number, type: OrderType, details: any, paymentMethod: PaymentMethod) => Order;
  onUpdateOrder: (items: CartItem[], total: number, type: OrderType, details: any, paymentMethod: PaymentMethod) => Order;
  onCancelEdit: () => void;
  onPrintReceipt: (order: Order) => void;
}

const POSView: React.FC<POSViewProps> = ({ 
    settings, menuItems, cart, setCart, currentOrderId, customers = [], categories, onPlaceOrder, onUpdateOrder, onCancelEdit, onPrintReceipt 
}) => {
  const [orderType, setOrderType] = useState<OrderType>(OrderType.DINE_IN);
  const [tableNumber, setTableNumber] = useState('1');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [kitchenNote, setKitchenNote] = useState('');
  
  const [discountType, setDiscountType] = useState<'PERCENT' | 'FIXED'>('PERCENT');
  const [discountValue, setDiscountValue] = useState<number>(0);

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [nextOrderNum, setNextOrderNum] = useState(PersistenceService.peekNextOrderNumber());
  
  const [selectionItem, setSelectionItem] = useState<MenuItem | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<Addon[]>([]);
  const [selectedVariation, setSelectedVariation] = useState<Variation | null>(null);

  useEffect(() => {
      setNextOrderNum(PersistenceService.peekNextOrderNumber());
  }, [currentOrderId]);

  const subtotal = cart.reduce((sum, item) => {
      const basePrice = item.selectedVariation ? item.selectedVariation.price : item.price;
      const addonCost = (item.selectedAddons || []).reduce((aSum, a) => aSum + a.price, 0);
      return sum + ((basePrice + addonCost) * item.quantity);
  }, 0);

  const discountAmount = discountType === 'PERCENT' ? (subtotal * (discountValue / 100)) : discountValue;
  const discountedSubtotal = Math.max(0, subtotal - discountAmount);
  const tax = discountedSubtotal * (settings.taxRate / 100); 
  const serviceCharge = orderType === OrderType.DINE_IN ? discountedSubtotal * (settings.serviceChargeRate / 100) : 0;
  const total = discountedSubtotal + tax + serviceCharge;

  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      if (!item.available) return false;
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.urduName?.includes(searchQuery);
      return matchesCategory && matchesSearch;
    });
  }, [menuItems, selectedCategory, searchQuery]);

  const initiateAddToCart = (item: MenuItem) => {
      if ((item.variations && item.variations.length > 0) || (item.addons && item.addons.length > 0)) {
          setSelectionItem(item);
          setSelectedAddons([]);
          setSelectedVariation(item.variations && item.variations.length > 0 ? item.variations[0] : null);
      } else {
          addToCart(item, [], undefined);
      }
  };

  const addToCart = (item: MenuItem, addons: Addon[], variation?: Variation) => {
    setCart(prev => {
      const addonKey = addons.map(a => a.name).sort().join('|');
      const variationId = variation ? variation.id : 'base';
      const existingIndex = prev.findIndex(i => {
          const iAddonKey = (i.selectedAddons || []).map(a => a.name).sort().join('|');
          const iVariationId = i.selectedVariation ? i.selectedVariation.id : 'base';
          return i.id === item.id && iAddonKey === addonKey && iVariationId === variationId;
      });
      if (existingIndex >= 0) {
        const newCart = [...prev];
        newCart[existingIndex].quantity += 1;
        return newCart;
      }
      return [...prev, { ...item, quantity: 1, selectedAddons: addons, selectedVariation: variation }];
    });
    setSelectionItem(null);
  };

  const handleCheckout = (method: PaymentMethod) => {
    const details = {
        tableNumber: orderType === OrderType.DINE_IN ? tableNumber : undefined,
        customerName, customerPhone,
        deliveryAddress: orderType === OrderType.DELIVERY ? deliveryAddress : undefined,
        kitchenNote, subtotal, taxAmount: tax, discountAmount, serviceChargeAmount: serviceCharge,
    };
    if (currentOrderId) {
        onUpdateOrder(cart, total, orderType, details, method);
    } else {
        onPlaceOrder(cart, total, orderType, details, method);
        setNextOrderNum(PersistenceService.peekNextOrderNumber());
    }
    resetPos();
  };

  const resetPos = () => {
    setIsCheckingOut(false);
    setKitchenNote('');
    setCustomerName('');
    setCustomerPhone('');
    setDeliveryAddress('');
    setCart([]);
    setDiscountValue(0);
    if(onCancelEdit) onCancelEdit();
  };

  const getCategoryIcon = (cat: string) => {
      const c = cat.toLowerCase();
      if (c === 'all') return <LayoutGrid size={28} />;
      if (c.includes('karahi')) return <Flame size={28} />;
      if (c.includes('handi') || c.includes('salan')) return <Soup size={28} />;
      if (c.includes('bbq')) return <UtensilsCrossed size={28} />;
      if (c.includes('fry') || c.includes('roast')) return <Utensils size={28} />;
      if (c.includes('breakfast') || c.includes('nashta')) return <Coffee size={28} />;
      if (c.includes('bread') || c.includes('roti') || c.includes('naan')) return <CircleDot size={28} />;
      if (c.includes('drink') || c.includes('beverage')) return <GlassWater size={28} />;
      return <Utensils size={28} />;
  };

  return (
    <div className="flex flex-col lg:flex-row h-full overflow-hidden bg-surface relative">
      {/* Selection Modal */}
      {selectionItem && (
          <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl animate-fade-in flex flex-col max-h-[90vh]">
                  <div className="flex justify-between items-start mb-4">
                      <div>
                        <h2 className="text-xl font-bold text-gray-800">{selectionItem.name}</h2>
                        <p className="text-sm text-gray-500 font-urdu">{selectionItem.urduName}</p>
                      </div>
                      <button onClick={() => setSelectionItem(null)} className="p-2 hover:bg-gray-100 rounded-full"><X size={24} /></button>
                  </div>
                  <div className="flex-1 overflow-y-auto pr-2 space-y-6">
                    {selectionItem.variations && selectionItem.variations.length > 0 && (
                        <div>
                            <p className="font-bold text-gray-700 mb-2 text-sm uppercase">Select Size:</p>
                            <div className="grid grid-cols-2 gap-3">
                                {selectionItem.variations.map((v) => (
                                    <button key={v.id} onClick={() => setSelectedVariation(v)} className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center ${selectedVariation?.id === v.id ? 'border-primary bg-red-50 text-primary' : 'border-gray-200 text-gray-600'}`}>
                                        <span className="font-bold">{v.name}</span>
                                        <span className="mt-1 font-mono font-bold">Rs. {v.price}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    {selectionItem.addons && selectionItem.addons.length > 0 && (
                        <div>
                            <p className="font-bold text-gray-700 mb-2 text-sm uppercase">Add-ons:</p>
                            <div className="space-y-2">
                                {selectionItem.addons.map((addon, idx) => {
                                    const isSelected = selectedAddons.some(a => a.name === addon.name);
                                    return (
                                        <div key={idx} onClick={() => isSelected ? setSelectedAddons(selectedAddons.filter(a => a.name !== addon.name)) : setSelectedAddons([...selectedAddons, addon])} className={`flex justify-between items-center p-3 rounded-lg border cursor-pointer ${isSelected ? 'border-primary bg-red-50 text-primary' : 'border-gray-200'}`}>
                                            <span className="font-medium">{addon.name}</span>
                                            <span className="text-sm font-bold">+ Rs. {addon.price}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                  </div>
                  <button onClick={() => addToCart(selectionItem, selectedAddons, selectedVariation || undefined)} className="w-full mt-6 py-4 bg-primary text-white rounded-xl font-bold shadow-lg">
                      Add to Order (Rs. {((selectedVariation ? selectedVariation.price : selectionItem.price) + selectedAddons.reduce((s, a) => s + a.price, 0))})
                  </button>
              </div>
          </div>
      )}

      {/* Main Terminal Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header */}
        <div className="bg-white p-4 shadow-sm z-10 flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-800">POS Terminal</h1>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Next: #{nextOrderNum}</span>
            </div>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input type="text" placeholder="Search menu / تلاش کریں..." className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-full focus:outline-none text-sm font-urdu" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
        </div>
        
        <div className="flex flex-1 overflow-hidden">
            {/* Category Sidebar - "Scroll Down" feature implemented here */}
            <div className="w-32 bg-white border-r flex flex-col overflow-y-auto no-scrollbar py-4 shrink-0 shadow-[4px_0_10px_rgba(0,0,0,0.02)]">
                {['All', ...categories].map(cat => {
                    const isSelected = selectedCategory === cat;
                    return (
                        <button 
                            key={cat} 
                            onClick={() => setSelectedCategory(cat)} 
                            className={`w-full py-4 px-2 flex flex-col items-center gap-2 transition-all relative ${isSelected ? 'text-primary' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            {isSelected && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-primary rounded-r-full" />}
                            <div className={`p-3 rounded-2xl transition-all ${isSelected ? 'bg-primary text-white shadow-lg' : 'bg-gray-50'}`}>
                                {getCategoryIcon(cat)}
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-tighter text-center leading-tight line-clamp-1">{cat}</span>
                        </button>
                    );
                })}
            </div>

            {/* Main Item Grid */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 auto-rows-max bg-surface">
                {filteredItems.map(item => (
                    <div 
                        key={item.id} 
                        onClick={() => initiateAddToCart(item)}
                        className="bg-white rounded-3xl shadow-sm hover:shadow-2xl transition-all cursor-pointer overflow-hidden group flex flex-col border-2 border-transparent hover:border-primary/20 h-fit"
                    >
                        <div className="aspect-[4/3] overflow-hidden relative">
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                            <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1.5 rounded-xl">
                                Rs. {item.price}
                            </div>
                        </div>
                        <div className="p-4 flex flex-col gap-1">
                            <h3 className="font-bold text-gray-800 text-sm md:text-base leading-tight truncate">{item.name}</h3>
                            <p className="font-urdu text-primary text-sm font-bold text-right leading-none">{item.urduName}</p>
                        </div>
                    </div>
                ))}

                {filteredItems.length === 0 && (
                    <div className="col-span-full py-20 flex flex-col items-center justify-center text-gray-300">
                        <Utensils size={64} className="mb-4 opacity-10" />
                        <p className="font-bold text-sm uppercase tracking-widest">No items found</p>
                    </div>
                )}
            </div>
        </div>
      </div>

      {/* Right Cart Panel */}
      <div className="w-full lg:w-[400px] bg-white border-l border-gray-200 flex flex-col h-[50vh] lg:h-full shadow-2xl relative z-40">
        <div className="flex p-2 gap-2 bg-gray-50 border-b shrink-0">
            {[
                { type: OrderType.DINE_IN, icon: Utensils, label: 'Dine-In' },
                { type: OrderType.TAKEAWAY, icon: ShoppingBag, label: 'Take' },
                { type: OrderType.DELIVERY, icon: Bike, label: 'Deliv' },
            ].map(t => (
                <button key={t.type} onClick={() => setOrderType(t.type)} className={`flex-1 flex flex-col items-center py-3 rounded-xl transition-all ${orderType === t.type ? 'bg-white shadow-md text-primary font-bold' : 'text-gray-400 hover:bg-gray-100'}`}>
                    <t.icon size={22} className="mb-1" />
                    <span className="text-[10px] font-bold uppercase">{t.label}</span>
                </button>
            ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="flex justify-between items-center border-b pb-2">
            <h2 className="font-bold text-gray-800 flex items-center gap-2">
               <ShoppingCart size={18} />
               {currentOrderId ? `Editing #${currentOrderId.slice(-4)}` : 'Cart'}
            </h2>
            {cart.length > 0 && <button onClick={() => setCart([])} className="text-xs text-red-500 font-bold hover:underline">Clear</button>}
          </div>

          <div className="space-y-4">
              {cart.map((item, index) => (
                <div key={`${item.id}-${index}`} className="flex gap-3 border-b border-gray-100 pb-3 group">
                    <div className="flex-1">
                        <h4 className="font-bold text-gray-800 text-sm">{item.name}</h4>
                        <div className="text-xs font-bold text-gray-400 mt-0.5">Rs. {((item.selectedVariation?.price || item.price) + (item.selectedAddons?.reduce((s,a)=>s+a.price, 0) || 0)) * item.quantity}</div>
                        <div className="flex items-center mt-2 gap-3">
                            <button onClick={() => setCart(prev => prev.map((it, idx) => idx === index ? {...it, quantity: Math.max(1, it.quantity - 1)} : it))} className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center"><Minus size={14}/></button>
                            <span className="text-sm font-bold w-6 text-center">{item.quantity}</span>
                            <button onClick={() => setCart(prev => prev.map((it, idx) => idx === index ? {...it, quantity: it.quantity + 1} : it))} className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center"><Plus size={14}/></button>
                        </div>
                    </div>
                    <button onClick={() => setCart(prev => prev.filter((_, idx) => idx !== index))} className="text-gray-300 hover:text-red-500 p-2"><Trash2 size={18}/></button>
                </div>
              ))}
          </div>
        </div>

        <div className="p-4 bg-gray-50 border-t border-gray-200 shrink-0">
          <div className="space-y-1 mb-4">
            <div className="flex justify-between text-xs font-bold text-gray-500"><span>Subtotal</span><span>Rs. {subtotal.toFixed(0)}</span></div>
            <div className="flex justify-between text-lg font-black text-primary border-t pt-2 mt-2"><span>TOTAL</span><span>Rs. {total.toFixed(0)}</span></div>
          </div>
          <button disabled={cart.length === 0} onClick={() => setIsCheckingOut(true)} className="w-full py-4 bg-primary text-white rounded-2xl font-bold shadow-lg disabled:bg-gray-300 flex justify-center items-center gap-2">
              <Printer size={20} /> Checkout
          </button>
        </div>
      </div>

      {/* Payment Overlay */}
      {isCheckingOut && (
          <div className="absolute inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl w-full max-w-sm p-8 shadow-2xl animate-scale-up">
                  <h3 className="text-2xl font-bold text-center mb-6">Confirm Payment</h3>
                  <div className="space-y-3">
                      <button onClick={() => handleCheckout(PaymentMethod.CASH)} className="w-full py-4 bg-green-600 text-white rounded-2xl font-bold flex items-center justify-center gap-3 shadow-lg shadow-green-200">
                          <Banknote size={24}/> Cash Payment
                      </button>
                      <button onClick={() => handleCheckout(PaymentMethod.CARD)} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold flex items-center justify-center gap-3 shadow-lg shadow-blue-200">
                          <CreditCard size={24}/> Card Payment
                      </button>
                      <button onClick={() => setIsCheckingOut(false)} className="w-full py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-2xl mt-2">Cancel</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default POSView;

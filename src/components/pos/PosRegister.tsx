import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Minus,
  Trash2, 
  ShoppingBag, 
  Sparkles, 
  Utensils, 
  ChevronRight, 
  Flame, 
  Leaf,
  User,
  Hash,
  X,
  Percent,
  MessageSquare,
  ArrowRight,
  SlidersHorizontal,
  RotateCcw
} from 'lucide-react';
import { MenuItem, CartItem, OrderType, Order, AppCustomizationSettings } from '../../types';
import { CustomOrderModal } from './CustomOrderModal';
import { PaymentModal } from './PaymentModal';
import { RoastupPotatoIcon } from '../brand/RoastupBrand';
import { sound } from '../../utils/sound';

interface PosRegisterProps {
  menuItems: MenuItem[];
  onOrderCreated: (order: Order) => void;
  customization?: AppCustomizationSettings;
  onOpenStudio?: () => void;
}

export const PosRegister: React.FC<PosRegisterProps> = ({
  menuItems,
  onOrderCreated,
  customization,
  onOpenStudio
}) => {
  // Dynamically compute categories from both customization and active menu items
  const categories = Array.from(
    new Set([
      ...(customization?.categoryOrder && customization.categoryOrder.length > 0 ? customization.categoryOrder : []),
      ...menuItems.map(i => i.category)
    ])
  ).filter(Boolean);

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dietaryFilter, setDietaryFilter] = useState<'all' | 'vegetarian' | 'spicy' | 'signature'>('all');
  const [mobileView, setMobileView] = useState<'menu' | 'ticket'>('menu');
  
  // Customization modal state
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<OrderType>('takeaway');
  const [customerName, setCustomerName] = useState<string>('');
  const [tableNumber, setTableNumber] = useState<string>('');
  const [orderNote, setOrderNote] = useState<string>('');
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [showNoteInput, setShowNoteInput] = useState<boolean>(false);
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);

  // Sync cart to server for Customer-Facing Display (CFD)
  useEffect(() => {
    const rawTotal = cart.reduce((acc, i) => acc + i.totalPrice, 0);
    const discountedTotal = Math.max(0, rawTotal * (1 - discountPercent / 100));
    const tax = Math.round((discountedTotal * 0.20 / 1.20) * 100) / 100;
    
    fetch('/api/orders/current-active', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: cart,
        subtotal: discountedTotal - tax,
        tax,
        total: discountedTotal,
        orderType,
        customerGreeting: customerName ? `Hello ${customerName}!` : 'Welcome to ROASTIES!'
      })
    }).catch(() => {});
  }, [cart, orderType, customerName, discountPercent]);

  // Filter items
  const filteredItems = menuItems.filter(item => {
    const matchCat = selectedCategory === 'all' || item.category === selectedCategory;
    const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchDiet = true;
    if (dietaryFilter === 'vegetarian') {
      matchDiet = !!item.tags?.includes('vegetarian');
    } else if (dietaryFilter === 'spicy') {
      matchDiet = !!item.tags?.includes('spicy');
    } else if (dietaryFilter === 'signature') {
      matchDiet = !!item.tags?.includes('signature');
    }

    return matchCat && matchSearch && matchDiet;
  });

  // Fast tap handler: if item has no modifiers and only 1 variation, add straight away!
  const handleItemClick = (item: MenuItem) => {
    const hasModifiers = item.modifierSets && item.modifierSets.length > 0;
    const hasMultipleVariations = item.variations && item.variations.length > 1;

    if (!hasModifiers && !hasMultipleVariations) {
      // Direct quick-add (e.g. drinks, sides, sauces)
      const standardVar = item.variations[0] || { id: 'std', name: 'Standard', sku: 'ROAST-STD', price: item.defaultPrice };
      const cartItemId = `${item.id}-${standardVar.id}-${Date.now()}`;
      
      const newItem: CartItem = {
        cartItemId,
        menuItemId: item.id,
        name: item.name,
        category: item.category,
        variation: standardVar,
        quantity: 1,
        unitPrice: standardVar.price,
        totalPrice: standardVar.price,
        selectedModifiers: [],
        specialRemovals: [],
        specialAdditions: []
      };

      setCart(prev => {
        // If same basic item already in cart without customizations, increment quantity
        const existingIdx = prev.findIndex(c => 
          c.menuItemId === item.id && 
          c.variation.id === standardVar.id && 
          (!c.specialRemovals || c.specialRemovals.length === 0) &&
          (!c.specialAdditions || c.specialAdditions.length === 0) &&
          (!c.selectedModifiers || c.selectedModifiers.length === 0)
        );

        if (existingIdx >= 0) {
          const updated = [...prev];
          const curr = updated[existingIdx];
          const newQty = curr.quantity + 1;
          updated[existingIdx] = {
            ...curr,
            quantity: newQty,
            totalPrice: Math.round(newQty * curr.unitPrice * 100) / 100
          };
          return updated;
        }
        return [...prev, newItem];
      });

      sound.playRegisterDing();
    } else {
      // Needs modal customization
      setCustomizingItem(item);
    }
  };

  // Add customized item from modal
  const handleAddCustomizedItem = (customizedItem: CartItem) => {
    setCart(prev => [...prev, customizedItem]);
    setCustomizingItem(null);
    sound.playRegisterDing();
  };

  // Stepper adjustments
  const updateItemQuantity = (cartItemId: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.cartItemId === cartItemId) {
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;
          const singleItemCost = item.totalPrice / item.quantity;
          return {
            ...item,
            quantity: newQty,
            totalPrice: Math.round(newQty * singleItemCost * 100) / 100
          };
        }
        return item;
      }).filter(Boolean) as CartItem[];
    });
  };

  const removeItem = (cartItemId: string) => {
    setCart(prev => prev.filter(i => i.cartItemId !== cartItemId));
  };

  const clearCart = () => {
    setCart([]);
    setDiscountPercent(0);
    setOrderNote('');
  };

  // Calculations
  const rawSubtotal = cart.reduce((acc, i) => acc + i.totalPrice, 0);
  const discountAmount = Math.round(rawSubtotal * (discountPercent / 100) * 100) / 100;
  const grandTotal = Math.max(0, rawSubtotal - discountAmount);
  const taxAmount = Math.round((grandTotal * 0.20 / 1.20) * 100) / 100;
  const netSubtotal = Math.round((grandTotal - taxAmount) * 100) / 100;

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#FBFBFA] dark:bg-stone-950 text-stone-900 dark:text-stone-100 overflow-hidden font-sans">
      {/* Mobile Screen Segmented Switcher (Only visible on screens under 768px) */}
      <div className="md:hidden flex items-center bg-stone-100 dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 p-2 gap-2 shrink-0">
        <button
          onClick={() => setMobileView('menu')}
          className={`flex-1 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            mobileView === 'menu'
              ? 'bg-white dark:bg-stone-800 text-stone-950 dark:text-white shadow-xs'
              : 'text-stone-500 hover:text-stone-900'
          }`}
        >
          <Utensils className="w-3.5 h-3.5" />
          <span>Menu Catalog ({filteredItems.length})</span>
        </button>
        <button
          onClick={() => setMobileView('ticket')}
          className={`flex-1 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            mobileView === 'ticket'
              ? 'bg-amber-400 text-stone-950 shadow-xs'
              : 'bg-stone-200/70 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Ticket ({cart.length}) • £{grandTotal.toFixed(2)}</span>
        </button>
      </div>

      {/* Main Split Layout: Side-by-side on all screens >= md (768px+), or active mobile tab */}
      <div className="flex-1 min-h-0 flex flex-row overflow-hidden">
        {/* LEFT / CENTER: MENU CATALOG */}
        <div className={`${mobileView === 'menu' ? 'flex' : 'hidden'} md:flex flex-1 min-h-0 flex-col min-w-0 overflow-hidden border-r border-stone-200 dark:border-stone-800`}>
          {/* Top Controls Bar: Search & Category Navigation */}
          <div className="p-4 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 flex flex-col gap-3 shadow-2xs">
          {/* Search and Fast Filters */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Search crispy potatoes, roti wraps, sides..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 bg-stone-100 dark:bg-stone-800 border-none rounded-2xl text-xs font-semibold placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-amber-400 dark:text-white"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Dietary quick filter chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              {[
                { id: 'all', label: 'All Items' },
                { id: 'signature', label: '★ Signature' },
                { id: 'vegetarian', label: '🌱 Veg' },
                { id: 'spicy', label: '🌶️ Spicy' }
              ].map(d => (
                <button
                  key={d.id}
                  onClick={() => setDietaryFilter(d.id as any)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    dietaryFilter === d.id
                      ? 'bg-amber-400 text-stone-950 shadow-xs'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Horizontal Category Selector Pills */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-0.5">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 ${
                selectedCategory === 'all'
                  ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-950 shadow-2xs'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
              }`}
            >
              All Items ({menuItems.length})
            </button>
            {categories.map(cat => {
              const count = menuItems.filter(i => i.category === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                    selectedCategory === cat
                      ? 'bg-amber-400 text-stone-950 shadow-2xs'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
                  }`}
                >
                  <span>{cat}</span>
                  <span className="text-[10px] opacity-70 font-mono">({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Menu Items Grid */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6">
          {filteredItems.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center text-stone-400">
              <Utensils className="w-10 h-10 mb-2 opacity-30 text-stone-400" />
              <p className="font-bold text-sm text-stone-700 dark:text-stone-300">No menu items match your search</p>
              <p className="text-xs text-stone-500 mt-1">Try clearing filters or selecting another category</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredItems.map(item => {
                const minPrice = Math.min(...item.variations.map(v => v.price));
                const maxPrice = Math.max(...item.variations.map(v => v.price));
                const priceLabel = item.variations.length > 1 && minPrice !== maxPrice
                  ? `£${minPrice.toFixed(2)} - £${maxPrice.toFixed(2)}`
                  : `£${item.defaultPrice.toFixed(2)}`;

                const hasModifiers = item.modifierSets && item.modifierSets.length > 0;
                const hasMultipleVariations = item.variations && item.variations.length > 1;

                return (
                  <div
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className="group bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-amber-400 dark:hover:border-amber-400 rounded-3xl overflow-hidden flex flex-col justify-between cursor-pointer transition-all shadow-xs hover:shadow-md select-none relative"
                  >
                    {/* Visual Banner Header */}
                    <div className="h-32 w-full bg-stone-100 dark:bg-stone-800 relative overflow-hidden shrink-0 border-b border-stone-100 dark:border-stone-800">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-amber-50 dark:from-stone-800 via-stone-100 dark:via-stone-900 to-amber-100/60 flex items-center justify-center">
                          <RoastupPotatoIcon size="md" className="opacity-40 group-hover:scale-110 transition-transform" />
                        </div>
                      )}

                      {/* Price Badge Overlay */}
                      <div className="absolute top-2.5 right-2.5 bg-white/95 dark:bg-stone-900/95 backdrop-blur-xs font-black text-xs text-stone-950 dark:text-white px-2.5 py-1 rounded-xl shadow-xs border border-stone-200 dark:border-stone-700 font-mono">
                        {priceLabel}
                      </div>

                      {/* Dietary Badges Overlay */}
                      <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1">
                        {item.tags?.includes('signature') && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-amber-400 text-stone-950 shadow-2xs">
                            ★ Signature
                          </span>
                        )}
                        {item.tags?.includes('spicy') && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-rose-600 text-white shadow-2xs">
                            🌶️ Spicy
                          </span>
                        )}
                        {item.tags?.includes('vegetarian') && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-emerald-600 text-white shadow-2xs">
                            🌱 Veg
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="font-black text-sm text-stone-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors line-clamp-1">
                          {item.name}
                        </h4>
                        <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 line-clamp-2 leading-relaxed h-8">
                          {item.description}
                        </p>
                      </div>

                      {/* Action footer */}
                      <div className="mt-3 pt-2.5 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs">
                        <span className="text-[11px] font-medium text-stone-400 truncate max-w-[140px]">
                          {hasMultipleVariations 
                            ? `${item.variations.length} sizes`
                            : 'Standard'}
                        </span>

                        <div className="flex items-center gap-1 bg-amber-400 group-hover:bg-amber-500 text-stone-950 font-black text-xs px-2.5 py-1 rounded-xl transition-colors shadow-2xs">
                          <span>{hasModifiers || hasMultipleVariations ? 'Options' : '+ Add'}</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: VITA MOJO INSPIRED LIVE TICKET TAPE */}
      <div className={`${mobileView === 'ticket' ? 'flex' : 'hidden'} md:flex w-full md:w-80 lg:w-96 shrink-0 h-full bg-white dark:bg-stone-900 flex-col border-stone-200 dark:border-stone-800 shadow-xs`}>
        {/* Ticket Header & Order Type Segmented Switch */}
        <div className="p-4 border-b border-stone-200 dark:border-stone-800 space-y-3 bg-stone-50/50 dark:bg-stone-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-amber-500" />
              <span className="font-black text-sm text-stone-900 dark:text-white uppercase tracking-wider">
                Current Ticket
              </span>
            </div>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-stone-400 hover:text-rose-600 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                title="Clear Ticket"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            )}
          </div>

          {/* Dining Mode Toggle (Takeaway vs Dine In) */}
          <div className="grid grid-cols-2 p-1 bg-stone-200/70 dark:bg-stone-800 rounded-2xl">
            <button
              onClick={() => setOrderType('takeaway')}
              className={`py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                orderType === 'takeaway'
                  ? 'bg-white dark:bg-stone-900 text-stone-950 dark:text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-400'
              }`}
            >
              🛍️ Takeaway Box
            </button>
            <button
              onClick={() => setOrderType('dine_in')}
              className={`py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                orderType === 'dine_in'
                  ? 'bg-white dark:bg-stone-900 text-stone-950 dark:text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-400'
              }`}
            >
              🍽️ Dine In Tray
            </button>
          </div>

          {/* Customer / Table Details */}
          <div className="grid grid-cols-2 gap-2">
            <div className="relative">
              <User className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Guest Name"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-semibold text-stone-900 dark:text-white focus:outline-hidden focus:border-amber-400"
              />
            </div>
            {orderType === 'dine_in' ? (
              <div className="relative">
                <Hash className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  placeholder="Table #"
                  value={tableNumber}
                  onChange={e => setTableNumber(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-semibold text-stone-900 dark:text-white focus:outline-hidden focus:border-amber-400"
                />
              </div>
            ) : (
              <div className="text-right flex items-center justify-end px-2 text-[11px] font-bold text-stone-400">
                Collection # Auto
              </div>
            )}
          </div>
        </div>

        {/* Ticket Items List */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center text-stone-400 space-y-2">
              <ShoppingBag className="w-8 h-8 opacity-30 text-stone-400" />
              <p className="font-bold text-xs text-stone-600 dark:text-stone-400">Ticket is empty</p>
              <p className="text-[11px] text-stone-400">Tap menu items on the left to add</p>
            </div>
          ) : (
            cart.map(item => (
              <div 
                key={item.cartItemId}
                className="p-3 bg-stone-50 dark:bg-stone-800/60 rounded-2xl border border-stone-200/80 dark:border-stone-700/80 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-black text-xs text-stone-900 dark:text-white truncate">
                        {item.name}
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800 shrink-0">
                        {item.variation.name}
                      </span>
                    </div>

                    {/* Customizer Notes / Modifiers */}
                    {item.specialRemovals && item.specialRemovals.length > 0 && (
                      <p className="text-[10px] font-bold text-rose-600 mt-0.5">
                        NO: {item.specialRemovals.join(', ')}
                      </p>
                    )}
                    {item.specialAdditions && item.specialAdditions.length > 0 && (
                      <p className="text-[10px] font-bold text-emerald-600 mt-0.5">
                        EXTRA: {item.specialAdditions.join(', ')}
                      </p>
                    )}
                    {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                      <p className="text-[10px] text-stone-500 dark:text-stone-400 mt-0.5">
                        {item.selectedModifiers.map(m => `+ ${m.optionName}`).join(', ')}
                      </p>
                    )}
                  </div>

                  <span className="font-black font-mono text-xs text-stone-900 dark:text-white shrink-0">
                    £{item.totalPrice.toFixed(2)}
                  </span>
                </div>

                {/* Stepper & Line Delete */}
                <div className="flex items-center justify-between pt-1 border-t border-stone-200/60 dark:border-stone-700/60 text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateItemQuantity(item.cartItemId, -1)}
                      className="w-6 h-6 rounded-lg bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 flex items-center justify-center font-bold hover:bg-stone-100 cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="font-black font-mono w-4 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateItemQuantity(item.cartItemId, 1)}
                      className="w-6 h-6 rounded-lg bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 flex items-center justify-center font-bold hover:bg-stone-100 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <button
                    onClick={() => removeItem(item.cartItemId)}
                    className="text-stone-400 hover:text-rose-600 transition-colors cursor-pointer"
                    title="Remove item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Fast Action Buttons: Discount & Note */}
        {cart.length > 0 && (
          <div className="px-4 py-2 bg-stone-50 dark:bg-stone-800/40 border-t border-stone-200 dark:border-stone-800 flex items-center gap-2">
            <button
              onClick={() => setDiscountPercent(prev => prev === 0 ? 10 : prev === 10 ? 20 : 0)}
              className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-bold border flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                discountPercent > 0 
                  ? 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-200' 
                  : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700'
              }`}
            >
              <Percent className="w-3 h-3" />
              <span>{discountPercent > 0 ? `${discountPercent}% Off` : 'Discount'}</span>
            </button>

            <button
              onClick={() => setShowNoteInput(!showNoteInput)}
              className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-bold border flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                orderNote 
                  ? 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-200' 
                  : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700'
              }`}
            >
              <MessageSquare className="w-3 h-3" />
              <span>{orderNote ? 'Note Added' : 'Kitchen Note'}</span>
            </button>
          </div>
        )}

        {/* Note Input dropdown if opened */}
        {showNoteInput && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border-t border-amber-200 dark:border-amber-800 flex items-center gap-2">
            <input
              type="text"
              placeholder="e.g. Allergies: Celiac, Extra cutlery, Box separate"
              value={orderNote}
              onChange={e => setOrderNote(e.target.value)}
              className="flex-1 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-1.5 text-xs text-stone-900 dark:text-white"
            />
            <button
              onClick={() => setShowNoteInput(false)}
              className="px-2.5 py-1.5 rounded-xl bg-amber-400 text-stone-950 text-xs font-bold cursor-pointer"
            >
              Done
            </button>
          </div>
        )}

        {/* Totals & Charge Button */}
        <div className="p-4 border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 space-y-3">
          <div className="space-y-1.5 text-xs text-stone-500 dark:text-stone-400">
            <div className="flex justify-between">
              <span>Subtotal (Net):</span>
              <span className="font-mono">£{netSubtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>VAT (20%):</span>
              <span className="font-mono">£{taxAmount.toFixed(2)}</span>
            </div>
            {discountPercent > 0 && (
              <div className="flex justify-between text-amber-600 dark:text-amber-400 font-bold">
                <span>Discount ({discountPercent}%):</span>
                <span className="font-mono">-£{discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-black text-stone-900 dark:text-white pt-2 border-t border-stone-200 dark:border-stone-800">
              <span>Total Due:</span>
              <span className="font-mono text-xl text-stone-900 dark:text-white">£{grandTotal.toFixed(2)}</span>
            </div>
          </div>

          <button
            disabled={cart.length === 0}
            onClick={() => setShowPaymentModal(true)}
            className="w-full py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-500 disabled:opacity-40 text-stone-950 font-black text-sm transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Charge £{grandTotal.toFixed(2)}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      </div>

      {/* Customization Modal */}
      {customizingItem && (
        <CustomOrderModal
          item={customizingItem}
          onClose={() => setCustomizingItem(null)}
          onAddToCart={handleAddCustomizedItem}
        />
      )}

      {/* Payment Checkout Modal */}
      {showPaymentModal && (
        <PaymentModal
          items={cart}
          subtotal={netSubtotal}
          tax={taxAmount}
          total={grandTotal}
          orderType={orderType}
          customerName={customerName}
          tableNumber={tableNumber}
          customization={customization}
          onClose={() => setShowPaymentModal(false)}
          onPaymentComplete={(createdOrder) => {
            onOrderCreated(createdOrder);
            setCart([]);
            setCustomerName('');
            setTableNumber('');
            setDiscountPercent(0);
            setOrderNote('');
            setShowPaymentModal(false);
          }}
        />
      )}
    </div>
  );
};

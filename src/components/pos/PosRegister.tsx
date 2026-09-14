import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Trash2, 
  ShoppingBag, 
  Sparkles, 
  Utensils, 
  Tag, 
  Check, 
  ChevronRight, 
  Flame, 
  Leaf,
  UtensilsCrossed,
  User,
  Hash,
  Sliders,
  X
} from 'lucide-react';
import { MenuItem, CartItem, OrderType, Order, AppCustomizationSettings } from '../../types';
import { CustomOrderModal } from './CustomOrderModal';
import { PaymentModal } from './PaymentModal';
import { RoastupPotatoIcon } from '../brand/RoastupBrand';

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
  const categories = customization?.categoryOrder && customization.categoryOrder.length > 0
    ? customization.categoryOrder
    : [
        'Loaded Roast Potatoes',
        'Roti Roast Potato Wraps',
        'Sides',
        'Sauces & Dips',
        'Meal Deals',
        'Drinks',
        'Build Your Own'
      ];

  const [selectedCategory, setSelectedCategory] = useState<string>(categories[0] || 'Loaded Roast Potatoes');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dietaryFilter, setDietaryFilter] = useState<'all' | 'vegetarian' | 'spicy' | 'signature'>('all');
  
  // Customization modal state
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<OrderType>('takeaway');
  const [customerName, setCustomerName] = useState<string>('');
  const [tableNumber, setTableNumber] = useState<string>('');
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);

  // Sync cart to server for Customer-Facing Display (CFD)
  useEffect(() => {
    const sub = cart.reduce((acc, i) => acc + i.totalPrice, 0);
    const tax = Math.round((sub * 0.20 / 1.20) * 100) / 100;
    
    fetch('/api/orders/current-active', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: cart,
        subtotal: sub - tax,
        tax,
        total: sub,
        orderType,
        customerGreeting: customerName ? `Hello ${customerName}!` : 'Welcome to ROASTUP!'
      })
    }).catch(() => {});
  }, [cart, orderType, customerName]);

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

  // Cart actions
  const handleAddToCart = (item: CartItem) => {
    setCart(prev => [...prev, item]);
  };

  const handleUpdateQuantity = (cartItemId: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.cartItemId === cartItemId) {
          const newQ = Math.max(0, item.quantity + delta);
          return {
            ...item,
            quantity: newQ,
            totalPrice: newQ * item.unitPrice
          };
        }
        return item;
      }).filter(item => item.quantity > 0);
    });
  };

  const handleRemoveCartItem = (cartItemId: string) => {
    setCart(prev => prev.filter(i => i.cartItemId !== cartItemId));
  };

  const handleClearCart = () => {
    if (cart.length > 0 && confirm('Clear current order?')) {
      setCart([]);
      setCustomerName('');
      setTableNumber('');
    }
  };

  // Totals
  const rawTotal = cart.reduce((acc, item) => acc + item.totalPrice, 0);
  const tax = Math.round((rawTotal * 0.20 / 1.20) * 100) / 100;
  const subtotal = rawTotal - tax;
  const grandTotal = rawTotal;

  return (
    <div className={`flex-1 flex flex-col lg:flex-row overflow-hidden bg-[#FBFBFA] text-stone-900 font-style-${customization?.fontFamily || 'sans'} scale-${customization?.fontSizeScale || 'normal'}`}>
      {/* LEFT / CENTER: MENU CATALOG */}
      <div className="flex-1 flex flex-col overflow-hidden border-r border-stone-200">
        {/* Unified Top Controls: Category Tabs & Search/Dietary bar */}
        <div className="bg-white border-b border-stone-200 shadow-2xs">
          {/* Upper control row: Search, Dietary Filters, and Studio Link */}
          <div className="px-4 py-2.5 flex flex-col sm:flex-row gap-2.5 items-center justify-between border-b border-stone-100">
            {/* Search bar */}
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search roast potatoes, wraps, dips..."
                className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-9 pr-8 py-1.5 text-xs text-stone-900 placeholder-stone-400 focus:outline-hidden focus:border-amber-400 focus:bg-white transition-colors"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Dietary quick filter chips */}
            <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto scrollbar-none">
              <button
                onClick={() => setDietaryFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  dietaryFilter === 'all'
                    ? 'bg-stone-900 text-amber-400 shadow-2xs font-extrabold'
                    : 'bg-stone-100 text-stone-600 hover:text-stone-900 hover:bg-stone-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setDietaryFilter('vegetarian')}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  dietaryFilter === 'vegetarian'
                    ? 'bg-emerald-600 text-white shadow-2xs font-extrabold'
                    : 'bg-stone-100 text-stone-600 hover:text-emerald-700 hover:bg-emerald-50'
                }`}
              >
                <Leaf className="w-3.5 h-3.5" />
                <span>Veg</span>
              </button>
              <button
                onClick={() => setDietaryFilter('spicy')}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  dietaryFilter === 'spicy'
                    ? 'bg-rose-600 text-white shadow-2xs font-extrabold'
                    : 'bg-stone-100 text-stone-600 hover:text-rose-700 hover:bg-rose-50'
                }`}
              >
                <Flame className="w-3.5 h-3.5" />
                <span>Spicy</span>
              </button>
              <button
                onClick={() => setDietaryFilter('signature')}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  dietaryFilter === 'signature'
                    ? 'bg-amber-400 text-stone-950 shadow-2xs font-extrabold'
                    : 'bg-stone-100 text-stone-600 hover:text-amber-800 hover:bg-amber-50'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Signatures</span>
              </button>

              {onOpenStudio && (
                <button
                  onClick={onOpenStudio}
                  className="ml-auto sm:ml-2 flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 shrink-0 transition-colors"
                  title="Customize dishes and categories"
                >
                  <Sliders className="w-3.5 h-3.5 text-amber-700" />
                  <span className="hidden sm:inline">Edit Menu</span>
                </button>
              )}
            </div>
          </div>

          {/* Lower row: Category scroll pills */}
          <div className="px-4 py-2 flex items-center gap-1.5 overflow-x-auto scrollbar-none bg-stone-50/50">
            {categories.map(cat => {
              const isSelected = selectedCategory === cat;
              const countInCat = menuItems.filter(i => i.category === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-400 text-stone-950 shadow-xs font-black'
                      : 'bg-white text-stone-600 hover:text-stone-950 hover:bg-stone-100 border border-stone-200/80'
                  }`}
                >
                  <span>{cat}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isSelected ? 'bg-stone-950 text-amber-400 font-black' : 'bg-stone-100 text-stone-500'
                  }`}>
                    {countInCat}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Menu Items Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {filteredItems.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center text-stone-400">
              <Utensils className="w-10 h-10 mb-2 opacity-30 text-stone-400" />
              <p className="font-semibold text-sm text-stone-700">No items found</p>
              <p className="text-xs text-stone-500 mt-1">Try adjusting your search query or dietary filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredItems.map(item => {
                const minPrice = Math.min(...item.variations.map(v => v.price));
                const maxPrice = Math.max(...item.variations.map(v => v.price));
                const priceLabel = item.variations.length > 1 && minPrice !== maxPrice
                  ? `£${minPrice.toFixed(2)} - £${maxPrice.toFixed(2)}`
                  : `£${item.defaultPrice.toFixed(2)}`;

                return (
                  <div
                    key={item.id}
                    onClick={() => setCustomizingItem(item)}
                    className="group relative bg-white hover:bg-stone-50/90 border border-stone-200 hover:border-amber-400 rounded-2xl overflow-hidden flex flex-col justify-between cursor-pointer transition-all shadow-2xs hover:shadow-md select-none"
                  >
                    {/* Visual Banner Header */}
                    <div className="h-32 w-full bg-stone-100 relative overflow-hidden shrink-0 border-b border-stone-100">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-amber-50 via-stone-100 to-amber-100/60 flex items-center justify-center">
                          <RoastupPotatoIcon size="md" className="opacity-40 group-hover:scale-110 transition-transform" />
                        </div>
                      )}

                      {/* Price Badge Overlay */}
                      <div className="absolute top-2.5 right-2.5 bg-white/95 backdrop-blur-xs font-black text-xs text-stone-950 px-2.5 py-1 rounded-xl shadow-xs border border-stone-200/80">
                        {priceLabel}
                      </div>

                      {/* Dietary Badges Overlay */}
                      <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1">
                        {item.tags?.includes('signature') && (
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-lg bg-amber-400 text-stone-950 shadow-2xs">
                            ★ Signature
                          </span>
                        )}
                        {item.tags?.includes('spicy') && (
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-lg bg-rose-600 text-white shadow-2xs">
                            🌶️ Spicy
                          </span>
                        )}
                        {item.tags?.includes('vegetarian') && (
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-lg bg-emerald-600 text-white shadow-2xs">
                            🌱 Veg
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card Content Body */}
                    <div className="p-3.5 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="font-extrabold text-sm text-stone-900 group-hover:text-amber-800 transition-colors line-clamp-1">
                          {item.name}
                        </h4>
                        <p className="text-xs text-stone-500 mt-1 line-clamp-2 leading-relaxed h-8">
                          {item.description}
                        </p>
                      </div>

                      {/* Variations / Action Footer */}
                      <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between text-xs">
                        <span className="text-[11px] font-medium text-stone-400 truncate max-w-[150px]">
                          {item.variations.length > 1 
                            ? item.variations.map(v => v.name).join(' • ')
                            : 'Standard Portion'}
                        </span>

                        <div className="flex items-center gap-1 bg-amber-400 group-hover:bg-amber-500 text-stone-950 font-black text-xs px-2.5 py-1 rounded-xl transition-colors shadow-2xs">
                          <span>Customize</span>
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

      {/* RIGHT: ACTIVE ORDER / CART SIDEBAR */}
      <div className="w-full lg:w-96 bg-white flex flex-col border-t lg:border-t-0 border-stone-200 shadow-xs">
        {/* Cart Header */}
        <div className="p-3.5 border-b border-stone-200 bg-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-100 text-amber-900">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <span className="font-extrabold text-sm text-stone-900">Current Ticket</span>
              <span className="text-xs text-stone-400 font-semibold ml-1.5">
                ({cart.reduce((s, i) => s + i.quantity, 0)} items)
              </span>
            </div>
          </div>

          {cart.length > 0 && (
            <button
              onClick={handleClearCart}
              className="text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-rose-50 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>

        {/* Order Details: Dine In / Takeaway, Customer Name */}
        <div className="p-3 border-b border-stone-200 bg-stone-50/70 space-y-2.5">
          {/* Clean Segmented Toggle */}
          <div className="grid grid-cols-2 gap-1.5 bg-stone-200/60 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setOrderType('takeaway')}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                orderType === 'takeaway'
                  ? 'bg-amber-400 text-stone-950 shadow-xs font-black'
                  : 'text-stone-600 hover:text-stone-950'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Takeaway Box</span>
            </button>
            <button
              type="button"
              onClick={() => setOrderType('dine_in')}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                orderType === 'dine_in'
                  ? 'bg-amber-400 text-stone-950 shadow-xs font-black'
                  : 'text-stone-600 hover:text-stone-950'
              }`}
            >
              <UtensilsCrossed className="w-3.5 h-3.5" />
              <span>Dine In Bowl</span>
            </button>
          </div>

          {/* Customer & Table Inputs with Icons */}
          <div className="grid grid-cols-2 gap-2">
            <div className="relative">
              <User className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Customer Name"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                className="w-full bg-white border border-stone-200 rounded-xl pl-8 pr-2.5 py-1.5 text-xs text-stone-900 placeholder-stone-400 focus:outline-hidden focus:border-amber-400 transition-colors"
              />
            </div>
            <div className="relative">
              <Hash className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Table / Buzzer"
                value={tableNumber}
                onChange={e => setTableNumber(e.target.value)}
                className="w-full bg-white border border-stone-200 rounded-xl pl-8 pr-2.5 py-1.5 text-xs text-stone-900 placeholder-stone-400 focus:outline-hidden focus:border-amber-400 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {cart.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-center text-stone-400">
              <ShoppingBag className="w-8 h-8 mb-2 opacity-30 text-stone-400" />
              <p className="font-semibold text-xs text-stone-700">Order is empty</p>
              <p className="text-[11px] text-stone-400 mt-0.5">Select items to add to current order</p>
            </div>
          ) : (
            cart.map(item => (
              <div 
                key={item.cartItemId} 
                className="bg-stone-50/80 border border-stone-200/80 rounded-xl p-2.5 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-xs text-stone-900 truncate">{item.name}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 font-bold border border-amber-200 shrink-0">
                        {item.variation.name}
                      </span>
                    </div>

                    {/* Modifiers & additions */}
                    {((item.selectedModifiers && item.selectedModifiers.length > 0) || 
                      (item.specialRemovals && item.specialRemovals.length > 0) || 
                      (item.specialAdditions && item.specialAdditions.length > 0)) && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {item.specialRemovals?.map(r => (
                          <span key={r} className="text-[10px] text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded font-semibold">
                            NO {r}
                          </span>
                        ))}
                        {item.selectedModifiers?.map(m => (
                          <span key={m.optionId} className="text-[10px] text-stone-700 bg-white border border-stone-200 px-1.5 py-0.2 rounded">
                            +{m.optionName} {m.priceDelta > 0 ? `(£${m.priceDelta.toFixed(2)})` : ''}
                          </span>
                        ))}
                        {item.specialAdditions?.map(a => (
                          <span key={a} className="text-[10px] text-amber-900 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded font-semibold">
                            +{a}
                          </span>
                        ))}
                      </div>
                    )}

                    {item.customNotes && (
                      <p className="text-[10px] text-amber-700 italic mt-1 bg-amber-50/60 px-1.5 py-0.5 rounded border border-amber-200/60">
                        &ldquo;{item.customNotes}&rdquo;
                      </p>
                    )}
                  </div>

                  <span className="font-black text-xs text-stone-900 shrink-0">
                    £{item.totalPrice.toFixed(2)}
                  </span>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-stone-200/60">
                  <span className="text-[10px] font-semibold text-stone-400">
                    £{item.unitPrice.toFixed(2)} each
                  </span>
                  
                  <div className="flex items-center gap-1.5 bg-white border border-stone-200 rounded-lg p-0.5 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => handleUpdateQuantity(item.cartItemId, -1)}
                      className="p-1 rounded-md text-stone-500 hover:text-stone-900 hover:bg-stone-100"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                    <span className="w-5 text-center text-xs font-bold text-stone-900">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleUpdateQuantity(item.cartItemId, 1)}
                      className="p-1 rounded-md text-stone-500 hover:text-stone-900 hover:bg-stone-100"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Totals and Checkout CTA */}
        <div className="p-4 border-t border-stone-200 bg-white space-y-3">
          <div className="space-y-1.5 text-xs text-stone-500 bg-stone-50 p-3 rounded-xl border border-stone-100">
            <div className="flex justify-between">
              <span>Subtotal (Net)</span>
              <span className="text-stone-800 font-semibold">£{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>VAT (20% included)</span>
              <span className="text-stone-800 font-semibold">£{tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm font-black text-stone-900 pt-1.5 border-t border-stone-200">
              <span>Total Due</span>
              <span className="text-amber-600 text-base font-black">£{grandTotal.toFixed(2)}</span>
            </div>
          </div>

          <button
            id="pos-pay-now-btn"
            disabled={cart.length === 0}
            onClick={() => setShowPaymentModal(true)}
            className="w-full py-3 px-4 rounded-xl bg-amber-400 hover:bg-amber-500 disabled:opacity-40 disabled:hover:bg-amber-400 text-stone-950 font-black text-sm shadow-xs transition-all flex items-center justify-between cursor-pointer active:scale-[0.99]"
          >
            <span>Process Payment</span>
            <span className="bg-stone-950/10 px-2 py-0.5 rounded-lg font-mono text-xs">
              £{grandTotal.toFixed(2)}
            </span>
          </button>
        </div>
      </div>

      {/* CUSTOM TOPPING / MODIFIER MODAL */}
      {customizingItem && (
        <CustomOrderModal
          item={customizingItem}
          onClose={() => setCustomizingItem(null)}
          onAddToCart={handleAddToCart}
        />
      )}

      {/* PAYMENT & CARD CHECKOUT MODAL */}
      {showPaymentModal && (
        <PaymentModal
          items={cart}
          subtotal={subtotal}
          tax={tax}
          total={grandTotal}
          orderType={orderType}
          customerName={customerName}
          tableNumber={tableNumber}
          onClose={() => setShowPaymentModal(false)}
          onPaymentComplete={order => {
            setCart([]);
            setCustomerName('');
            setTableNumber('');
            onOrderCreated(order);
          }}
        />
      )}
    </div>
  );
};

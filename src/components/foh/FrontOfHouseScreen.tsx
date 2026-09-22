import React, { useState, useEffect } from 'react';
import { 
  GlassWater, 
  CheckCircle2, 
  Clock, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Package, 
  Flame, 
  Sparkles,
  ShoppingBag,
  Check,
  Coffee,
  CheckCheck,
  Smartphone
} from 'lucide-react';
import { Order, OrderStatus } from '../../types';
import { sound } from '../../utils/sound';
import { getOrderPlacedTime, getOrderDueTime, getOrderDueStatus } from '../../utils/orderTime';

interface FrontOfHouseScreenProps {
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
  onBumpStation?: (orderId: string, station: 'foh' | 'kitchen') => void;
  onBumpFoh?: (orderId: string) => void;
}

export const FrontOfHouseScreen: React.FC<FrontOfHouseScreenProps> = ({
  orders,
  onUpdateOrderStatus,
  onBumpStation,
  onBumpFoh
}) => {
  const [filterMode, setFilterMode] = useState<'drinks_sauces' | 'all' | 'ready_for_handover'>('drinks_sauces');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [completedItems, setCompletedItems] = useState<Record<string, boolean>>({});

  // Live timer tick
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Helper to check if an item is a drink or sauce
  const isDrinkOrSauce = (category: string, name: string) => {
    const cat = (category || '').toLowerCase();
    const nm = (name || '').toLowerCase();
    return (
      cat.includes('drink') ||
      cat.includes('beverage') ||
      cat.includes('sauce') ||
      cat.includes('dip') ||
      nm.includes('coke') ||
      nm.includes('fanta') ||
      nm.includes('sprite') ||
      nm.includes('water') ||
      nm.includes('can') ||
      nm.includes('mayo') ||
      nm.includes('gravy') ||
      nm.includes('dip') ||
      nm.includes('sauce') ||
      nm.includes('shake')
    );
  };

  // Filter orders relevant for FOH
  const activeOrders = orders.filter(o => o.status === 'pending' || o.status === 'preparing' || o.status === 'ready');

  const fohOrders = activeOrders.filter(order => {
    if (filterMode === 'ready_for_handover') {
      return order.status === 'ready';
    }
    if (filterMode === 'all') {
      return true;
    }
    // 'drinks_sauces': only orders that contain drinks, sauces, or are ready to pack
    const hasDrinksOrSauces = order.items.some(item => isDrinkOrSauce(item.category, item.name));
    return hasDrinksOrSauces || order.status === 'ready';
  });

  // Calculate live aggregate drink & sauce counts needed
  const drinkCounts: Record<string, number> = {};
  const sauceCounts: Record<string, number> = {};

  activeOrders.forEach(order => {
    order.items.forEach(item => {
      const cat = (item.category || '').toLowerCase();
      const nm = item.name;
      if (cat.includes('drink') || nm.toLowerCase().includes('coke') || nm.toLowerCase().includes('water')) {
        drinkCounts[nm] = (drinkCounts[nm] || 0) + item.quantity;
      } else if (cat.includes('sauce') || cat.includes('dip') || nm.toLowerCase().includes('mayo') || nm.toLowerCase().includes('gravy')) {
        sauceCounts[nm] = (sauceCounts[nm] || 0) + item.quantity;
      }
    });
  });

  const getElapsedMinutes = (timestamp: string) => {
    const diff = Math.floor((currentTime.getTime() - new Date(timestamp).getTime()) / 60000);
    return Math.max(0, diff);
  };

  const toggleItemDone = (key: string) => {
    setCompletedItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleBumpFohAction = (order: Order) => {
    if (order.status !== 'ready') {
      if (soundEnabled) sound.playOrderReadyBell();
    } else {
      if (soundEnabled) sound.playClick();
    }
    if (onBumpFoh) {
      onBumpFoh(order.id);
    } else if (onBumpStation) {
      onBumpStation(order.id, 'foh');
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#F8F9FA] dark:bg-stone-950 text-stone-900 dark:text-stone-100 overflow-hidden select-none">
      {/* Top Bar */}
      <div className="px-5 py-3 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 flex flex-wrap items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500 text-white flex items-center justify-center font-black shadow-xs">
            <GlassWater className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold tracking-tight text-stone-900 dark:text-white">
                Front of House &amp; Drinks Station
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-950 text-cyan-900 dark:text-cyan-200 font-black border border-cyan-300 dark:border-cyan-800">
                {fohOrders.length} Tickets
              </span>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">
              Dispense drinks, portion cold sauces, and bag finished orders
            </p>
          </div>
        </div>

        {/* Filter modes */}
        <div className="flex items-center gap-1.5 bg-stone-100 dark:bg-stone-800 p-1 rounded-2xl border border-stone-200 dark:border-stone-700 text-xs">
          <button
            onClick={() => setFilterMode('drinks_sauces')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              filterMode === 'drinks_sauces' 
                ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-xs' 
                : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            Drinks &amp; Sauces
          </button>
          <button
            onClick={() => setFilterMode('ready_for_handover')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              filterMode === 'ready_for_handover' 
                ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-xs' 
                : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            Ready to Bag / Handover ({orders.filter(o => o.status === 'ready').length})
          </button>
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              filterMode === 'all' 
                ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-xs' 
                : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            All Tickets ({activeOrders.length})
          </button>
        </div>

        {/* Audio and Clock */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-2xl border transition-colors cursor-pointer ${
              soundEnabled 
                ? 'bg-cyan-100 dark:bg-cyan-950 border-cyan-300 dark:border-cyan-800 text-cyan-900 dark:text-cyan-200' 
                : 'bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-400'
            }`}
            title="Audio alerts"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          <div className="px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 font-mono text-xs font-black">
            {currentTime.toLocaleTimeString('en-GB')}
          </div>
        </div>
      </div>

      {/* Aggregate Batch Counter Bar (Drinks & Sauces in queue) */}
      {(Object.keys(drinkCounts).length > 0 || Object.keys(sauceCounts).length > 0) && (
        <div className="bg-cyan-50 dark:bg-cyan-950/40 border-b border-cyan-200 dark:border-cyan-900/60 px-5 py-2 flex items-center gap-4 overflow-x-auto scrollbar-none text-xs">
          <span className="font-black uppercase tracking-wider text-[10px] text-cyan-800 dark:text-cyan-300 shrink-0 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Queue Pre-Pour:
          </span>

          {Object.entries(drinkCounts).map(([name, count]) => (
            <div key={name} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-stone-900 border border-cyan-200 dark:border-cyan-800 shrink-0 shadow-2xs">
              <Coffee className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
              <span className="font-bold text-stone-800 dark:text-stone-200">{name}:</span>
              <span className="font-mono font-black text-cyan-700 dark:text-cyan-300">{count}</span>
            </div>
          ))}

          {Object.entries(sauceCounts).map(([name, count]) => (
            <div key={name} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-stone-900 border border-amber-200 dark:border-amber-800 shrink-0 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="font-bold text-stone-800 dark:text-stone-200">{name}:</span>
              <span className="font-mono font-black text-amber-700 dark:text-amber-300">{count}</span>
            </div>
          ))}
        </div>
      )}

      {/* FOH Ticket Grid */}
      <div className="flex-1 p-5 overflow-y-auto">
        {fohOrders.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
            <div className="w-16 h-16 rounded-3xl bg-cyan-100 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
              <CheckCheck className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-stone-900 dark:text-white">All Front of House Orders Clear</h2>
            <p className="text-xs text-stone-500 max-w-sm">
              No pending drinks, dips, or packing tasks right now. New orders from the POS register will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {fohOrders.map(order => {
              const minutes = getElapsedMinutes(order.timestamp);
              const isKitchenDone = !!order.kitchenBumped;
              const isReady = order.status === 'ready';
              const drinksAndSauces = order.items.filter(i => isDrinkOrSauce(i.category, i.name));
              const kitchenItems = order.items.filter(i => !isDrinkOrSauce(i.category, i.name));
              const placedTime = getOrderPlacedTime(order);
              const dueTime = getOrderDueTime(order);
              const dueStatus = getOrderDueStatus(order, currentTime);

              return (
                <div 
                  key={order.id}
                  className={`rounded-3xl border flex flex-col justify-between overflow-hidden shadow-sm transition-all ${
                    isKitchenDone || isReady
                      ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-2 border-emerald-500 ring-2 ring-emerald-400/40 shadow-md' 
                      : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800'
                  }`}
                >
                  {/* Ticket Header */}
                  <div className={`p-3.5 border-b flex items-center justify-between ${
                    isKitchenDone || isReady
                      ? 'bg-emerald-600 text-white border-emerald-700' 
                      : 'bg-stone-50 dark:bg-stone-800/80 border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100'
                  }`}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xl font-black font-mono tracking-tight px-2 py-0.5 rounded-lg border ${
                        isKitchenDone || isReady 
                          ? 'bg-emerald-700/60 border-emerald-500 text-white' 
                          : 'bg-amber-100 dark:bg-amber-950 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-400'
                      }`}>
                        {order.ticketNumber || `A-${order.orderNumber}`}
                      </span>
                      <span className="text-xs font-mono opacity-80">#{order.orderNumber}</span>
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                        order.type === 'takeaway' 
                          ? 'bg-stone-900 text-amber-400 dark:bg-white dark:text-stone-950' 
                          : 'bg-white/20 text-white border border-white/30'
                      }`}>
                        {order.type === 'takeaway' ? 'Takeaway Bag' : 'Dine In Tray'}
                      </span>
                      {order.isPreOrder && (
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-purple-600 text-white border border-purple-400">
                          ★ Pre-Order
                        </span>
                      )}
                      {order.source === 'online_customer_app' && (
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-blue-500 text-white border border-blue-400 flex items-center gap-1">
                          <Smartphone className="w-2.5 h-2.5" />
                          Online
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-xs font-mono font-bold">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{minutes}m</span>
                    </div>
                  </div>

                  {/* Order Timing Bar: Placed Time & Target Due Time */}
                  <div className="px-3.5 py-1.5 bg-stone-100/70 dark:bg-stone-800/50 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1 font-mono text-stone-600 dark:text-stone-300">
                      <span className="text-[10px] font-sans font-bold uppercase text-stone-400">Placed:</span>
                      <span className="font-bold text-stone-800 dark:text-stone-200">{placedTime}</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-mono">
                      <span className="text-[10px] font-sans font-bold uppercase text-amber-600 dark:text-amber-400">Due:</span>
                      <span className={`font-black ${dueStatus.isOverdue ? 'text-rose-600 dark:text-rose-400' : 'text-amber-900 dark:text-amber-300'}`}>
                        {dueTime}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-md border font-sans ${dueStatus.badgeClass}`}>
                        {dueStatus.label}
                      </span>
                    </div>
                  </div>

                  {/* Customer / Table Info */}
                  {(order.customerName || order.tableNumber) && (
                    <div className="px-3.5 py-1 bg-stone-50 dark:bg-stone-800/30 border-b border-stone-100 dark:border-stone-800 text-[11px] text-stone-600 dark:text-stone-300 flex items-center justify-between">
                      {order.customerName && <span className="font-bold">Guest: {order.customerName}</span>}
                      {order.tableNumber && <span className="font-bold text-amber-700 dark:text-amber-400">Table {order.tableNumber}</span>}
                    </div>
                  )}

                  {/* Ticket Body */}
                  <div className="p-4 space-y-3 flex-1 overflow-y-auto max-h-72">
                    {/* Kitchen Status Pill - Lights up Green when kitchen completed */}
                    <div className={`px-2.5 py-2 rounded-xl border text-[11px] font-bold flex items-center justify-between ${
                      isKitchenDone || isReady
                        ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-950 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700 font-black' 
                        : 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                    }`}>
                      <div className="flex items-center gap-1.5">
                        {isKitchenDone || isReady ? (
                          <>
                            <Check className="w-4 h-4 text-emerald-700 dark:text-emerald-300" />
                            <span>✓ Hot Food Cooked &amp; Ready from Kitchen</span>
                          </>
                        ) : (
                          <>
                            <Flame className="w-4 h-4 text-amber-500 animate-pulse" />
                            <span>Kitchen is Cooking Hot Food...</span>
                          </>
                        )}
                      </div>
                      {kitchenItems.length > 0 && (
                        <span className="font-mono text-[10px] opacity-75">
                          {kitchenItems.length} items
                        </span>
                      )}
                    </div>

                    {/* FOH Action Items (Drinks & Sauces highlighted) */}
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-wider text-cyan-700 dark:text-cyan-400 mb-1.5 flex items-center gap-1">
                        <GlassWater className="w-3 h-3" />
                        <span>Drinks &amp; Sauces to Dispense:</span>
                      </div>

                      {drinksAndSauces.length === 0 ? (
                        <div className="text-xs text-stone-400 italic p-1.5 bg-stone-50 dark:bg-stone-800/40 rounded-lg">
                          No cold drinks or dipping pots on this order
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          {drinksAndSauces.map((item, idx) => {
                            const itemKey = `${order.id}-${item.cartItemId}-${idx}`;
                            const isDone = !!completedItems[itemKey];

                            return (
                              <div
                                key={itemKey}
                                onClick={() => toggleItemDone(itemKey)}
                                className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                                  isDone
                                    ? 'bg-stone-100 dark:bg-stone-800/50 text-stone-400 border-dashed line-through opacity-60'
                                    : 'bg-cyan-50/50 dark:bg-cyan-950/30 border-cyan-200 dark:border-cyan-800 hover:border-cyan-400 text-stone-900 dark:text-stone-100 font-bold'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <div className={`w-4 h-4 rounded-md flex items-center justify-center border ${
                                    isDone ? 'bg-cyan-500 border-cyan-500 text-white' : 'border-stone-300 dark:border-stone-600'
                                  }`}>
                                    {isDone && <Check className="w-3 h-3" />}
                                  </div>
                                  <span className="text-xs">
                                    {item.quantity}x {item.name}
                                  </span>
                                </div>
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-stone-500">
                                  {item.variation.name}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Kitchen Items Summary (Collapsible or compact overview) */}
                    {kitchenItems.length > 0 && (
                      <div className="pt-2 border-t border-stone-100 dark:border-stone-800 text-[11px] text-stone-500 dark:text-stone-400 space-y-1">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-stone-400">Hot Items with Kitchen:</span>
                        {kitchenItems.map((ki, i) => (
                          <div key={i} className="flex items-center justify-between">
                            <span>{ki.quantity}x {ki.name}</span>
                            <span className="text-[10px] text-stone-400">({ki.variation.name})</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Pre-Order / Customer Instructions */}
                    {(order.notes || order.customerNotes) && (
                      <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-950 dark:text-amber-100 font-medium">
                        <div className="text-[10px] font-black uppercase text-amber-800 dark:text-amber-300">Ticket Notes:</div>
                        <div className="font-mono text-stone-900 dark:text-stone-100">{order.notes || order.customerNotes}</div>
                      </div>
                    )}
                  </div>

                  {/* Footer Bump Bar - Only FOH can perform final bump to mark ready for pickup */}
                  <div className="p-3 border-t border-stone-100 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-800/50">
                    <button
                      onClick={() => handleBumpFohAction(order)}
                      className={`w-full py-3 px-4 rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-[0.98] ${
                        isReady
                          ? 'bg-stone-900 hover:bg-stone-800 text-white dark:bg-white dark:text-stone-950'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white ring-2 ring-emerald-400/50'
                      }`}
                    >
                      {isReady ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>COMPLETE HANDOVER (HANDED TO CUSTOMER)</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>BUMP ORDER (MARK READY FOR PICKUP)</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

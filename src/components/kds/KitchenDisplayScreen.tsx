import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  CheckCircle2, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  ChefHat, 
  AlertTriangle,
  Flame,
  Check,
  Package,
  Layers,
  Sparkles,
  Filter
} from 'lucide-react';
import { Order, OrderStatus } from '../../types';
import { sound } from '../../utils/sound';

interface KitchenDisplayScreenProps {
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
  onBumpStation?: (orderId: string, station: 'foh' | 'kitchen') => void;
  onBumpKitchen?: (orderId: string, unbump?: boolean) => void;
}

export const KitchenDisplayScreen: React.FC<KitchenDisplayScreenProps> = ({
  orders,
  onUpdateOrderStatus,
  onBumpStation,
  onBumpKitchen
}) => {
  const [filter, setFilter] = useState<'active' | 'pending' | 'preparing' | 'bumped'>('active');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [showRecallModal, setShowRecallModal] = useState<boolean>(false);
  const [hideDrinksAndSauces, setHideDrinksAndSauces] = useState<boolean>(true);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  // Live clock tick
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Helper to test if item is drink or sauce
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
      nm.includes('mayo') ||
      nm.includes('gravy')
    );
  };

  // Bumped orders: orders that have been bumped off the kitchen screen (or already handed over)
  const bumpedOrders = orders.filter(o => o.kitchenBumped || o.status === 'ready' || o.status === 'completed');

  // Active kitchen orders awaiting cooking / fulfillment on the hot food line
  const kitchenActive = orders.filter(o => !o.kitchenBumped && (o.status === 'pending' || o.status === 'preparing'));
  const kitchenPending = orders.filter(o => !o.kitchenBumped && o.status === 'pending');
  const kitchenCooking = orders.filter(o => !o.kitchenBumped && o.status === 'preparing');

  // Filter orders shown in the grid based on current tab selection
  const activeOrders = orders.filter(o => {
    if (filter === 'active') {
      return !o.kitchenBumped && (o.status === 'pending' || o.status === 'preparing');
    }
    if (filter === 'pending') {
      return !o.kitchenBumped && o.status === 'pending';
    }
    if (filter === 'preparing') {
      return !o.kitchenBumped && o.status === 'preparing';
    }
    if (filter === 'bumped') {
      return o.kitchenBumped || o.status === 'ready' || o.status === 'completed';
    }
    return !o.kitchenBumped && (o.status === 'pending' || o.status === 'preparing');
  });

  // Elapsed minutes helper
  const getElapsedMinutes = (timestamp: string) => {
    const diff = Math.floor((currentTime.getTime() - new Date(timestamp).getTime()) / 60000);
    return Math.max(0, diff);
  };

  const getTimerBadgeStyle = (minutes: number) => {
    if (minutes >= 10) {
      return 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800 animate-pulse font-black';
    }
    if (minutes >= 5) {
      return 'bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border-amber-300 dark:border-amber-800 font-bold';
    }
    return 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 font-semibold';
  };

  // Batch production aggregators (only count orders currently cooking on the hot line)
  const batchCounts: Record<string, number> = {
    'Roast Potato Portions': 0,
    'Roti Wraps': 0,
    'Sides / Yorkshires': 0
  };

  kitchenActive.forEach(order => {
    order.items.forEach(item => {
      const cat = item.category || '';
      if (cat.includes('Potato') || cat.includes('Loaded') || cat.includes('Build')) {
        batchCounts['Roast Potato Portions'] += item.quantity;
      } else if (cat.includes('Wrap') || cat.includes('Roti')) {
        batchCounts['Roti Wraps'] += item.quantity;
      } else if (cat.includes('Side') || item.name.toLowerCase().includes('yorkshire')) {
        batchCounts['Sides / Yorkshires'] += item.quantity;
      }
    });
  });

  const toggleItemDone = (key: string) => {
    setCheckedItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleKitchenBump = (order: Order) => {
    if (soundEnabled) sound.playOrderReadyBell();
    if (onBumpKitchen) {
      onBumpKitchen(order.id, false);
    } else if (onBumpStation) {
      onBumpStation(order.id, 'kitchen');
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#FBFBFA] dark:bg-stone-950 text-stone-900 dark:text-stone-100 overflow-hidden select-none font-sans">
      {/* KDS Header Bar */}
      <div className="px-5 py-3 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 flex flex-wrap items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-400 text-stone-950 flex items-center justify-center font-black shadow-xs">
            <ChefHat className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold tracking-tight text-stone-900 dark:text-white">Kitchen Display System</h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 font-bold border border-amber-300/60 dark:border-amber-800">
                {kitchenActive.length} Active Tickets
              </span>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">Station: Hot Food Line, Spud Fryers &amp; Wraps</p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-stone-100 dark:bg-stone-800 p-1 rounded-2xl border border-stone-200 dark:border-stone-700 text-xs">
          <button
            onClick={() => setFilter('active')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
              filter === 'active' ? 'bg-white dark:bg-stone-900 text-stone-950 dark:text-white shadow-xs' : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            All Active ({kitchenActive.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
              filter === 'pending' ? 'bg-white dark:bg-stone-900 text-stone-950 dark:text-white shadow-xs' : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            Pending ({kitchenPending.length})
          </button>
          <button
            onClick={() => setFilter('preparing')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
              filter === 'preparing' ? 'bg-white dark:bg-stone-900 text-stone-950 dark:text-white shadow-xs' : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            Cooking ({kitchenCooking.length})
          </button>
          <button
            onClick={() => setFilter('bumped')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
              filter === 'bumped' ? 'bg-white dark:bg-stone-900 text-stone-950 dark:text-white shadow-xs' : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            Bumped / Handed Over ({bumpedOrders.length})
          </button>
        </div>

        {/* Action buttons & Drink Filter Toggle */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setHideDrinksAndSauces(!hideDrinksAndSauces)}
            className={`px-3 py-1.5 rounded-2xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              hideDrinksAndSauces 
                ? 'bg-amber-100 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                : 'bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300'
            }`}
            title="Toggle hiding drinks and cold dips on KDS (they appear on FOH screen)"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>{hideDrinksAndSauces ? 'Hot Line Only (FOH handles drinks)' : 'Showing All Items'}</span>
          </button>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-2xl border transition-colors cursor-pointer ${
              soundEnabled ? 'bg-amber-100 dark:bg-amber-950 border-amber-300 text-amber-900 dark:text-amber-200' : 'bg-stone-100 dark:bg-stone-800 border-stone-200 text-stone-400'
            }`}
            title={soundEnabled ? 'Mute Kitchen Chime' : 'Enable Kitchen Chime'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setShowRecallModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-bold text-stone-700 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Recall ({bumpedOrders.length})</span>
          </button>

          <div className="px-3 py-2 rounded-2xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-mono font-bold">
            {currentTime.toLocaleTimeString('en-GB')}
          </div>
        </div>
      </div>

      {/* Batch Preparation Status Bar */}
      <div className="bg-amber-500/10 dark:bg-amber-950/40 border-b border-amber-200/60 dark:border-amber-900/60 px-5 py-2 flex items-center gap-6 overflow-x-auto scrollbar-none text-xs">
        <span className="font-black uppercase tracking-wider text-[10px] text-amber-900 dark:text-amber-300 flex items-center gap-1.5 shrink-0">
          <Flame className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          Batch Quantities Cooking:
        </span>
        {Object.entries(batchCounts).map(([label, count]) => (
          <div key={label} className="flex items-center gap-2 bg-white dark:bg-stone-900 px-3 py-1 rounded-xl border border-amber-200 dark:border-amber-800 shadow-2xs shrink-0">
            <span className="font-bold text-stone-700 dark:text-stone-300">{label}:</span>
            <span className="font-mono font-black text-amber-600 dark:text-amber-400 text-sm">{count}</span>
          </div>
        ))}
      </div>

      {/* Active Order Tickets Grid */}
      <div className="flex-1 p-5 overflow-y-auto">
        {activeOrders.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
            <div className="w-16 h-16 rounded-3xl bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-stone-900 dark:text-white">Kitchen Order Queue is Clear</h2>
            <p className="text-xs text-stone-500 max-w-sm">
              All tickets have been cooked and bumped. New orders from the counter or online register will appear immediately.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {activeOrders.map(order => {
              const minutes = getElapsedMinutes(order.timestamp);
              const timerStyle = getTimerBadgeStyle(minutes);
              
              // Filter items if hiding drinks & sauces
              const visibleItems = hideDrinksAndSauces
                ? order.items.filter(i => !isDrinkOrSauce(i.category, i.name))
                : order.items;

              const hiddenDrinksCount = order.items.length - visibleItems.length;

              return (
                <div
                  key={order.id}
                  className={`bg-white dark:bg-stone-900 rounded-3xl border flex flex-col justify-between overflow-hidden shadow-sm transition-all ${
                    order.status === 'ready' 
                      ? 'border-emerald-400 ring-2 ring-emerald-400/30' 
                      : order.status === 'preparing' 
                      ? 'border-amber-300 dark:border-amber-800' 
                      : 'border-stone-200 dark:border-stone-800'
                  }`}
                >
                  {/* Ticket Header */}
                  <div className="p-3.5 bg-stone-50 dark:bg-stone-800/80 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-black font-mono tracking-tight text-stone-900 dark:text-white">
                        #{order.orderNumber}
                      </span>
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                        order.type === 'takeaway' ? 'bg-stone-900 text-amber-400 dark:bg-white dark:text-stone-950' : 'bg-amber-100 text-amber-950 border border-amber-300'
                      }`}>
                        {order.type === 'takeaway' ? 'Takeaway' : 'Dine In'}
                      </span>
                    </div>

                    <div className={`px-2 py-0.5 rounded-lg border text-xs font-mono flex items-center gap-1 ${timerStyle}`}>
                      <Clock className="w-3.5 h-3.5" />
                      <span>{minutes}m</span>
                    </div>
                  </div>

                  {/* Customer / Table Info */}
                  <div className="px-4 py-2 bg-stone-100/50 dark:bg-stone-800/30 border-b border-stone-100 dark:border-stone-800 text-[11px] text-stone-500 dark:text-stone-400 flex items-center justify-between">
                    <div>
                      {order.customerName && <span className="font-bold text-stone-800 dark:text-stone-200 mr-2">Guest: {order.customerName}</span>}
                      {order.tableNumber && <span className="font-bold text-amber-700 dark:text-amber-400">Table {order.tableNumber}</span>}
                    </div>
                    <span className="font-mono text-[10px]">{new Date(order.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  {/* Ticket Items */}
                  <div className="p-4 space-y-3 flex-1 overflow-y-auto max-h-72">
                    {visibleItems.length === 0 ? (
                      <div className="p-3 rounded-xl bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800 text-xs text-cyan-800 dark:text-cyan-300 font-bold text-center">
                        Drinks &amp; Sauces only — routed to Front of House Station
                      </div>
                    ) : (
                      visibleItems.map((item, idx) => {
                        const itemKey = `${order.id}-${item.cartItemId}-${idx}`;
                        const isDone = !!checkedItems[itemKey];

                        return (
                          <div 
                            key={itemKey}
                            onClick={() => toggleItemDone(itemKey)}
                            className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                              isDone 
                                ? 'bg-stone-100 dark:bg-stone-800/40 border-stone-200 dark:border-stone-700 text-stone-400 line-through opacity-60' 
                                : 'bg-stone-50 dark:bg-stone-800/60 border-stone-200 dark:border-stone-700 hover:border-amber-400'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <div className={`w-4 h-4 rounded-md flex items-center justify-center border ${
                                  isDone ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-stone-300 dark:border-stone-600'
                                }`}>
                                  {isDone && <Check className="w-3 h-3" />}
                                </div>
                                <span className="font-black text-sm text-stone-900 dark:text-white">
                                  {item.quantity}x {item.name}
                                </span>
                              </div>
                              <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300">
                                {item.variation.name}
                              </span>
                            </div>

                            {/* Modifiers and special instructions */}
                            {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                              <div className="mt-1.5 pl-6 text-xs text-stone-600 dark:text-stone-300 space-y-0.5 font-medium">
                                {item.selectedModifiers.map((mod, mIdx) => (
                                  <div key={mIdx} className="flex items-center gap-1">
                                    <span className="text-amber-500 font-bold">+</span>
                                    <span>{mod.optionName}</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Special removals (Red) */}
                            {item.specialRemovals && item.specialRemovals.length > 0 && (
                              <div className="mt-1 pl-6 text-xs text-rose-600 dark:text-rose-400 font-extrabold flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3 shrink-0" />
                                <span>NO: {item.specialRemovals.join(', ')}</span>
                              </div>
                            )}

                            {/* Special additions (Green) */}
                            {item.specialAdditions && item.specialAdditions.length > 0 && (
                              <div className="mt-1 pl-6 text-xs text-emerald-600 dark:text-emerald-400 font-extrabold flex items-center gap-1">
                                <Check className="w-3 h-3 shrink-0" />
                                <span>EXTRA: {item.specialAdditions.join(', ')}</span>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}

                    {hiddenDrinksCount > 0 && hideDrinksAndSauces && (
                      <div className="text-[11px] font-bold text-cyan-700 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/30 px-2.5 py-1.5 rounded-xl border border-cyan-200 dark:border-cyan-800">
                        + {hiddenDrinksCount} cold drink(s)/sauce(s) on FOH Station
                      </div>
                    )}

                    {order.customerNotes && (
                      <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 font-medium">
                        <span className="font-bold">Note: </span>
                        {order.customerNotes}
                      </div>
                    )}
                  </div>

                  {/* Bump Status Action Bar */}
                  <div className="p-3 border-t border-stone-100 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-800/40">
                    <button
                      onClick={() => handleKitchenBump(order)}
                      className="w-full py-3 px-4 rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs bg-amber-400 hover:bg-amber-500 active:scale-[0.98] text-stone-950"
                    >
                      <Check className="w-4 h-4 text-stone-950" />
                      <span>BUMP ORDER (FOOD READY FOR FOH)</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recall Bumped Orders Modal */}
      {showRecallModal && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-amber-500" />
                <h3 className="font-extrabold text-stone-900 dark:text-white">Recall Bumped Kitchen Orders</h3>
              </div>
              <button
                onClick={() => setShowRecallModal(false)}
                className="text-stone-400 hover:text-stone-700 dark:hover:text-white text-xs font-bold px-2 py-1 cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-2 flex-1">
              {bumpedOrders.length === 0 ? (
                <div className="text-center py-8 text-stone-400 text-xs">No orders have been bumped yet.</div>
              ) : (
                bumpedOrders.slice(-10).reverse().map(order => (
                  <div key={order.id} className="p-3 bg-stone-50 dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 flex items-center justify-between">
                    <div>
                      <span className="font-mono font-black text-sm mr-2">#{order.orderNumber}</span>
                      <span className="text-xs text-stone-500">
                        {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        if (onBumpKitchen) onBumpKitchen(order.id, true);
                        onUpdateOrderStatus(order.id, 'preparing');
                        setShowRecallModal(false);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-stone-950 font-bold text-xs cursor-pointer shadow-xs"
                    >
                      Recall to Kitchen
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

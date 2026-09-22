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
  Filter,
  Smartphone,
  Sun,
  Coffee,
  Moon,
  FileText,
  CalendarClock
} from 'lucide-react';
import { Order, OrderStatus } from '../../types';
import { sound } from '../../utils/sound';
import { 
  getOrderPlacedTime, 
  getOrderDueTime, 
  getOrderDueStatus, 
  resolveOrderDueIso,
  resolveTimeOfDay,
  formatTimeOfDayLabel
} from '../../utils/orderTime';

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
  const [timeOfDayFilter, setTimeOfDayFilter] = useState<'all' | 'lunch' | 'afternoon' | 'dinner'>('all');
  const [sortBy, setSortBy] = useState<'due_at' | 'placed_time'>('due_at');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [showRecallModal, setShowRecallModal] = useState<boolean>(false);
  const [showBatchModal, setShowBatchModal] = useState<boolean>(false);
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

  // Helper to get service period for an order
  const getOrderServicePeriod = (o: Order): 'lunch' | 'afternoon' | 'dinner' => {
    if (o.timeOfDay === 'lunch' || o.timeOfDay === 'afternoon' || o.timeOfDay === 'dinner') {
      return o.timeOfDay;
    }
    return resolveTimeOfDay(resolveOrderDueIso(o));
  };

  // Bumped orders: orders that have been bumped off the kitchen screen (or already handed over)
  const bumpedOrders = orders.filter(o => o.kitchenBumped || o.status === 'ready' || o.status === 'completed');

  // Active kitchen orders awaiting cooking / fulfillment on the hot food line
  const kitchenActive = orders.filter(o => !o.kitchenBumped && (o.status === 'pending' || o.status === 'preparing'));
  const kitchenPending = orders.filter(o => !o.kitchenBumped && o.status === 'pending');
  const kitchenCooking = orders.filter(o => !o.kitchenBumped && o.status === 'preparing');

  // Service period counts for active orders
  const lunchActiveCount = kitchenActive.filter(o => getOrderServicePeriod(o) === 'lunch').length;
  const afternoonActiveCount = kitchenActive.filter(o => getOrderServicePeriod(o) === 'afternoon').length;
  const dinnerActiveCount = kitchenActive.filter(o => getOrderServicePeriod(o) === 'dinner').length;

  // Filter orders shown in the grid based on current tab selection & service period
  const filteredOrders = orders.filter(o => {
    // Time of day filter
    if (timeOfDayFilter !== 'all') {
      const period = getOrderServicePeriod(o);
      if (period !== timeOfDayFilter) return false;
    }

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

  // Sort tickets: dueAt ascending by default so impending pre-orders rise to top!
  const activeOrders = [...filteredOrders].sort((a, b) => {
    if (sortBy === 'due_at') {
      const dueA = new Date(resolveOrderDueIso(a)).getTime();
      const dueB = new Date(resolveOrderDueIso(b)).getTime();
      return dueA - dueB;
    }
    const placeA = new Date(a.placedAt || a.timestamp).getTime();
    const placeB = new Date(b.placedAt || b.timestamp).getTime();
    return placeA - placeB;
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

  // Batch production aggregators for currently active tickets matching the service period
  const batchCounts: Record<string, number> = {
    'Roast Potato Portions': 0,
    'Roti Wraps': 0,
    'Sides / Yorkshires': 0
  };

  const itemDetailedCounts: Record<string, number> = {};

  const batchScopeOrders = kitchenActive.filter(o => 
    timeOfDayFilter === 'all' || getOrderServicePeriod(o) === timeOfDayFilter
  );

  batchScopeOrders.forEach(order => {
    order.items.forEach(item => {
      const cat = item.category || '';
      if (cat.includes('Potato') || cat.includes('Loaded') || cat.includes('Build')) {
        batchCounts['Roast Potato Portions'] += item.quantity;
      } else if (cat.includes('Wrap') || cat.includes('Roti')) {
        batchCounts['Roti Wraps'] += item.quantity;
      } else if (cat.includes('Side') || item.name.toLowerCase().includes('yorkshire')) {
        batchCounts['Sides / Yorkshires'] += item.quantity;
      }

      const itemKey = `${item.name} (${item.variation.name})`;
      itemDetailedCounts[itemKey] = (itemDetailedCounts[itemKey] || 0) + item.quantity;
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
            Bumped ({bumpedOrders.length})
          </button>
        </div>

        {/* Action buttons & Sort & Drink Filter Toggle */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Sort selector: dueAt ascending */}
          <div className="flex items-center bg-stone-100 dark:bg-stone-800 p-1 rounded-2xl border border-stone-200 dark:border-stone-700 text-xs">
            <span className="text-[10px] font-bold text-stone-400 uppercase px-2">Sort:</span>
            <button
              onClick={() => setSortBy('due_at')}
              className={`px-2.5 py-1 rounded-xl font-bold cursor-pointer transition-all ${
                sortBy === 'due_at'
                  ? 'bg-amber-400 text-stone-950 font-black shadow-2xs'
                  : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100'
              }`}
              title="Sort tickets by dueAt ascending (earliest due & impending pre-orders first)"
            >
              Due Time (Ascending)
            </button>
            <button
              onClick={() => setSortBy('placed_time')}
              className={`px-2.5 py-1 rounded-xl font-bold cursor-pointer transition-all ${
                sortBy === 'placed_time'
                  ? 'bg-amber-400 text-stone-950 font-black shadow-2xs'
                  : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100'
              }`}
            >
              Placed Time
            </button>
          </div>

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
            <span>{hideDrinksAndSauces ? 'Hot Line Only' : 'All Items'}</span>
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

      {/* Service Period Transition Bar (Filter by Time of Day: lunch | afternoon | dinner) */}
      <div className="bg-stone-100 dark:bg-stone-900/90 border-b border-stone-200 dark:border-stone-800 px-5 py-2 flex items-center justify-between gap-4 overflow-x-auto">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-black uppercase text-stone-400 dark:text-stone-500 tracking-wider mr-1">
            Service Period:
          </span>
          <button
            onClick={() => setTimeOfDayFilter('all')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              timeOfDayFilter === 'all'
                ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-950 shadow-xs'
                : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 border border-stone-200 dark:border-stone-700'
            }`}
          >
            All Services ({kitchenActive.length})
          </button>
          <button
            onClick={() => setTimeOfDayFilter('lunch')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              timeOfDayFilter === 'lunch'
                ? 'bg-amber-400 text-stone-950 font-black shadow-xs'
                : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 border border-stone-200 dark:border-stone-700'
            }`}
          >
            <Sun className="w-3.5 h-3.5 text-amber-500" />
            <span>Lunch ({lunchActiveCount})</span>
          </button>
          <button
            onClick={() => setTimeOfDayFilter('afternoon')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              timeOfDayFilter === 'afternoon'
                ? 'bg-orange-400 text-stone-950 font-black shadow-xs'
                : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 border border-stone-200 dark:border-stone-700'
            }`}
          >
            <Coffee className="w-3.5 h-3.5 text-orange-500" />
            <span>Afternoon ({afternoonActiveCount})</span>
          </button>
          <button
            onClick={() => setTimeOfDayFilter('dinner')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              timeOfDayFilter === 'dinner'
                ? 'bg-indigo-500 text-white font-black shadow-xs'
                : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 border border-stone-200 dark:border-stone-700'
            }`}
          >
            <Moon className="w-3.5 h-3.5 text-indigo-400" />
            <span>Dinner ({dinnerActiveCount})</span>
          </button>
        </div>

        {/* Batch Prep Trigger */}
        <button
          onClick={() => setShowBatchModal(true)}
          className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 text-xs font-black hover:bg-amber-100 transition-colors cursor-pointer shrink-0"
        >
          <Flame className="w-3.5 h-3.5 text-amber-500" />
          <span>Batch Prep Matrix ({Object.keys(itemDetailedCounts).length} items)</span>
        </button>
      </div>

      {/* Batch Preparation Status Bar */}
      <div className="bg-amber-500/10 dark:bg-amber-950/40 border-b border-amber-200/60 dark:border-amber-900/60 px-5 py-2 flex items-center gap-6 overflow-x-auto scrollbar-none text-xs">
        <span className="font-black uppercase tracking-wider text-[10px] text-amber-900 dark:text-amber-300 flex items-center gap-1.5 shrink-0">
          <Flame className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          Batch Quantities Cooking {timeOfDayFilter !== 'all' ? `(${timeOfDayFilter.toUpperCase()})` : ''}:
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
              const placedTime = getOrderPlacedTime(order);
              const dueTime = getOrderDueTime(order);
              const dueStatus = getOrderDueStatus(order, currentTime);
              
              // Filter items if hiding drinks & sauces
              const visibleItems = hideDrinksAndSauces
                ? order.items.filter(i => !isDrinkOrSauce(i.category, i.name))
                : order.items;

              const hiddenDrinksCount = order.items.length - visibleItems.length;

              const ticketNum = order.ticketNumber || `A-${order.orderNumber}`;
              const orderPeriod = getOrderServicePeriod(order);
              const isImpendingFryerAlert = order.isPreOrder && (dueStatus.status === 'fryer_prep' || (dueStatus.diffMinutes <= 20 && dueStatus.diffMinutes >= 0));

              return (
                <div
                  key={order.id}
                  className={`bg-white dark:bg-stone-900 rounded-3xl border flex flex-col justify-between overflow-hidden shadow-sm transition-all ${
                    order.status === 'ready' 
                      ? 'border-emerald-400 ring-2 ring-emerald-400/30' 
                      : isImpendingFryerAlert
                      ? 'border-amber-500 ring-2 ring-amber-400/50 shadow-md'
                      : dueStatus.isOverdue
                      ? 'border-rose-500 ring-2 ring-rose-400/40'
                      : order.status === 'preparing' 
                      ? 'border-amber-300 dark:border-amber-800' 
                      : 'border-stone-200 dark:border-stone-800'
                  }`}
                >
                  {/* Ticket Header with ticketNumber and Pre-Order indicators */}
                  <div className="p-3 bg-stone-50 dark:bg-stone-800/80 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                      <span className="text-xl font-black font-mono tracking-tight text-amber-600 dark:text-amber-400 bg-amber-100/80 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-800 px-2 py-0.5 rounded-lg shrink-0">
                        {ticketNum}
                      </span>
                      <span className="text-xs font-mono font-bold text-stone-500 dark:text-stone-400 shrink-0">
                        #{order.orderNumber}
                      </span>
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md shrink-0 ${
                        order.type === 'takeaway' ? 'bg-stone-900 text-amber-400 dark:bg-white dark:text-stone-950' : 'bg-amber-100 text-amber-950 border border-amber-300'
                      }`}>
                        {order.type === 'takeaway' ? 'Takeaway' : 'Dine In'}
                      </span>
                      {order.isPreOrder && (
                        <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950 text-purple-900 dark:text-purple-300 border border-purple-300 dark:border-purple-800 shrink-0 flex items-center gap-1">
                          <CalendarClock className="w-2.5 h-2.5" />
                          Pre-Order
                        </span>
                      )}
                      <span className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded-md border shrink-0 ${
                        orderPeriod === 'lunch'
                          ? 'bg-amber-50 text-amber-800 border-amber-300'
                          : orderPeriod === 'afternoon'
                          ? 'bg-orange-50 text-orange-800 border-orange-300'
                          : 'bg-indigo-50 text-indigo-800 border-indigo-300'
                      }`}>
                        {orderPeriod === 'lunch' ? '☀️ Lunch' : orderPeriod === 'afternoon' ? '☕ Afternoon' : '🌙 Dinner'}
                      </span>
                    </div>

                    <div className={`px-2 py-0.5 rounded-lg border text-xs font-mono flex items-center gap-1 shrink-0 ${dueStatus.badgeClass}`}>
                      <Clock className="w-3.5 h-3.5 shrink-0" />
                      <span>{dueStatus.label}</span>
                    </div>
                  </div>

                  {/* Pre-Order Impending Fryer Alert Banner (15-20m prep window) */}
                  {order.isPreOrder && (
                    <>
                      {dueStatus.isOverdue ? (
                        <div className="bg-rose-600 text-white px-3 py-1.5 flex items-center justify-between text-xs font-black animate-pulse">
                          <div className="flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            <span>OVERDUE PRE-ORDER ({Math.abs(dueStatus.diffMinutes)}m LATE)</span>
                          </div>
                          <span className="font-mono bg-white text-rose-700 px-1.5 py-0.2 rounded text-[10px] font-black">EXPEDITE</span>
                        </div>
                      ) : isImpendingFryerAlert ? (
                        <div className="bg-amber-400 dark:bg-amber-500 text-stone-950 px-3 py-1.5 flex items-center justify-between text-xs font-black border-y border-amber-500">
                          <div className="flex items-center gap-1.5">
                            <Flame className="w-4 h-4 fill-stone-950 animate-bounce shrink-0" />
                            <span>ALERT FRYER: DROP ROASTIES (15–20m WINDOW)</span>
                          </div>
                          <span className="font-mono bg-stone-950 text-amber-400 px-1.5 py-0.5 rounded text-[10px] font-black">
                            {dueStatus.diffMinutes > 0 ? `T-${dueStatus.diffMinutes}m` : 'NOW'}
                          </span>
                        </div>
                      ) : (
                        <div className="bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 px-3 py-1 flex items-center justify-between text-[11px] font-bold border-b border-blue-200 dark:border-blue-800">
                          <div className="flex items-center gap-1">
                            <CalendarClock className="w-3 h-3 text-blue-500 shrink-0" />
                            <span>Pre-Order: Hold prep until T-20m</span>
                          </div>
                          <span className="font-mono text-[10px] bg-blue-100 dark:bg-blue-900 px-1.5 py-0.2 rounded">
                            {order.pickupTime || `Due at ${dueTime}`}
                          </span>
                        </div>
                      )}
                    </>
                  )}

                  {/* Order Timing Bar: Placed Time & Target Due Time */}
                  <div className="px-3.5 py-1.5 bg-stone-100/70 dark:bg-stone-800/40 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1 font-mono text-stone-600 dark:text-stone-300">
                      <span className="text-[10px] font-sans font-bold uppercase text-stone-400">Placed:</span>
                      <span className="font-bold text-stone-800 dark:text-stone-200">{placedTime}</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-mono">
                      <span className="text-[10px] font-sans font-bold uppercase text-amber-600 dark:text-amber-400">Due:</span>
                      <span className={`font-black ${dueStatus.isOverdue ? 'text-rose-600 dark:text-rose-400' : 'text-amber-900 dark:text-amber-300'}`}>
                        {dueTime}
                      </span>
                    </div>
                  </div>

                  {/* Customer / Table Info & Elapsed timer */}
                  <div className="px-3.5 py-1.5 bg-stone-50/70 dark:bg-stone-800/20 border-b border-stone-100 dark:border-stone-800 text-[11px] text-stone-500 dark:text-stone-400 flex items-center justify-between">
                    <div className="truncate">
                      {order.customerName && <span className="font-bold text-stone-800 dark:text-stone-200 mr-2">Guest: {order.customerName}</span>}
                      {order.tableNumber && <span className="font-bold text-amber-700 dark:text-amber-400">Table {order.tableNumber}</span>}
                      {!order.customerName && !order.tableNumber && <span className="text-stone-400">Standard Ticket</span>}
                    </div>
                    <span className="text-[10px] font-mono text-stone-400 shrink-0">Cooking: {minutes}m</span>
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

                    {(order.notes || order.customerNotes) && (
                      <div className="p-2.5 rounded-2xl bg-amber-50/90 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-700 text-xs text-amber-950 dark:text-amber-100 font-medium space-y-1">
                        <div className="flex items-center gap-1 text-[10px] font-black uppercase text-amber-800 dark:text-amber-300 tracking-wider">
                          <FileText className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                          <span>Kitchen Ticket Instructions:</span>
                        </div>
                        <div className="font-mono font-bold text-stone-900 dark:text-stone-100 whitespace-pre-wrap">
                          {order.notes || order.customerNotes}
                        </div>
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
                      <span className="font-mono font-black text-sm mr-2">
                        {order.ticketNumber || `A-${order.orderNumber}`}
                      </span>
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

      {/* Batch Preparation Matrix Modal */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50 dark:bg-stone-800/80">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-500" />
                <div>
                  <h3 className="font-black text-stone-900 dark:text-white">Batch Prep &amp; Transition Matrix</h3>
                  <p className="text-xs text-stone-500">
                    Aggregated cook volume for {timeOfDayFilter === 'all' ? 'All Current Tickets' : `${timeOfDayFilter.toUpperCase()} Service`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowBatchModal(false)}
                className="text-stone-400 hover:text-stone-700 dark:hover:text-white text-xs font-bold px-3 py-1.5 rounded-xl bg-stone-200 dark:bg-stone-800 cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-5 flex-1">
              {/* Category totals */}
              <div>
                <h4 className="text-xs font-black uppercase text-stone-400 tracking-wider mb-2">
                  Station Batch Aggregates
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {Object.entries(batchCounts).map(([label, count]) => (
                    <div key={label} className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
                      <div className="text-[10px] font-bold text-amber-800 dark:text-amber-400 uppercase">{label}</div>
                      <div className="text-2xl font-black font-mono text-stone-900 dark:text-white mt-0.5">{count}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Item details */}
              <div>
                <h4 className="text-xs font-black uppercase text-stone-400 tracking-wider mb-2">
                  Line Items Cooking ({Object.keys(itemDetailedCounts).length} unique recipes)
                </h4>
                <div className="space-y-1.5">
                  {Object.entries(itemDetailedCounts).map(([name, qty]) => (
                    <div key={name} className="flex items-center justify-between p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 text-xs">
                      <span className="font-bold text-stone-800 dark:text-stone-200">{name}</span>
                      <span className="font-mono font-black text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-md bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700">
                        {qty}x
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

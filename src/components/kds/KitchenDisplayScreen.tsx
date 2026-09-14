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
  Package
} from 'lucide-react';
import { Order, OrderStatus } from '../../types';
import { sound } from '../../utils/sound';

interface KitchenDisplayScreenProps {
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
}

export const KitchenDisplayScreen: React.FC<KitchenDisplayScreenProps> = ({
  orders,
  onUpdateOrderStatus
}) => {
  const [filter, setFilter] = useState<'active' | 'pending' | 'preparing' | 'ready'>('active');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [showRecallModal, setShowRecallModal] = useState<boolean>(false);

  // Live clock tick
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Filter orders
  const activeOrders = orders.filter(o => {
    if (filter === 'active') return o.status === 'pending' || o.status === 'preparing' || o.status === 'ready';
    return o.status === filter;
  });

  const bumpedOrders = orders.filter(o => o.status === 'completed');

  // Elapsed minutes helper
  const getElapsedMinutes = (timestamp: string) => {
    const diff = Math.floor((currentTime.getTime() - new Date(timestamp).getTime()) / 60000);
    return Math.max(0, diff);
  };

  const getTimerBadgeStyle = (minutes: number) => {
    if (minutes >= 10) {
      return 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse font-black';
    }
    if (minutes >= 5) {
      return 'bg-amber-50 text-amber-900 border-amber-300 font-bold';
    }
    return 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold';
  };

  const handleNextStatus = (order: Order) => {
    if (order.status === 'pending') {
      onUpdateOrderStatus(order.id, 'preparing');
    } else if (order.status === 'preparing') {
      if (soundEnabled) sound.playOrderReadyBell();
      onUpdateOrderStatus(order.id, 'ready');
    } else if (order.status === 'ready') {
      onUpdateOrderStatus(order.id, 'completed');
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#FBFBFA] text-stone-900 overflow-hidden select-none">
      {/* KDS Header Bar */}
      <div className="px-5 py-3 border-b border-stone-200 bg-white flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-400 text-stone-950 flex items-center justify-center font-black shadow-xs">
            <ChefHat className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold tracking-tight text-stone-900">Kitchen Display System</h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold border border-amber-300/60">
                {activeOrders.length} Active Tickets
              </span>
            </div>
            <p className="text-xs text-stone-500 font-medium">Station: Roast Potato Line &amp; Fryer</p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-stone-100/80 p-1 rounded-2xl border border-stone-200 text-xs">
          <button
            onClick={() => setFilter('active')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
              filter === 'active' ? 'bg-white text-stone-950 shadow-xs ring-1 ring-stone-200' : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            All Active ({orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled').length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
              filter === 'pending' ? 'bg-white text-stone-950 shadow-xs ring-1 ring-stone-200' : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            Pending ({orders.filter(o => o.status === 'pending').length})
          </button>
          <button
            onClick={() => setFilter('preparing')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
              filter === 'preparing' ? 'bg-white text-stone-950 shadow-xs ring-1 ring-stone-200' : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            Cooking ({orders.filter(o => o.status === 'preparing').length})
          </button>
          <button
            onClick={() => setFilter('ready')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
              filter === 'ready' ? 'bg-white text-stone-950 shadow-xs ring-1 ring-stone-200' : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            Ready ({orders.filter(o => o.status === 'ready').length})
          </button>
        </div>

        {/* Clock & Action buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-2xl border transition-colors cursor-pointer ${
              soundEnabled ? 'bg-amber-100 border-amber-300 text-amber-900' : 'bg-stone-100 border-stone-200 text-stone-400'
            }`}
            title={soundEnabled ? 'Mute Kitchen Chime' : 'Enable Kitchen Chime'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setShowRecallModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-white hover:bg-stone-50 border border-stone-200 text-xs font-bold text-stone-700 transition-colors cursor-pointer shadow-2xs"
          >
            <RotateCcw className="w-3.5 h-3.5 text-stone-500" />
            <span>Recall Bumped</span>
          </button>

          <div className="font-mono text-xs font-black bg-stone-100 px-3 py-2 rounded-2xl border border-stone-200 text-stone-800">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
        </div>
      </div>

      {/* Ticket Grid */}
      <div className="flex-1 overflow-y-auto p-5">
        {activeOrders.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-stone-400">
            <CheckCircle2 className="w-16 h-16 mb-3 text-amber-500/40" />
            <h3 className="text-lg font-bold text-stone-700">Kitchen Line Clear</h3>
            <p className="text-xs text-stone-400 mt-1">All orders bumped and handed over. Awaiting new orders from POS...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {activeOrders.map(order => {
              const minutesElapsed = getElapsedMinutes(order.timestamp);
              const timerStyle = getTimerBadgeStyle(minutesElapsed);

              return (
                <div
                  key={order.id}
                  className={`flex flex-col justify-between rounded-3xl border transition-all shadow-sm overflow-hidden ${
                    order.status === 'ready'
                      ? 'border-emerald-300 bg-emerald-50/20 ring-1 ring-emerald-300'
                      : order.status === 'preparing'
                        ? 'border-amber-300 bg-white ring-1 ring-amber-300'
                        : 'border-stone-200 bg-white'
                  }`}
                >
                  {/* Ticket Header */}
                  <div className="p-3.5 border-b border-stone-100 bg-stone-50/60 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-black text-stone-900">#{order.orderNumber}</span>
                        <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                          order.type === 'takeaway' 
                            ? 'bg-amber-100 text-amber-900 border border-amber-200' 
                            : 'bg-stone-200 text-stone-700 border border-stone-300'
                        }`}>
                          {order.type === 'takeaway' ? 'Takeaway' : 'Dine In'}
                        </span>
                      </div>
                      {order.customerName && (
                        <p className="text-xs font-semibold text-stone-500 mt-0.5">
                          Cust: {order.customerName} {order.tableNumber ? `(Tbl ${order.tableNumber})` : ''}
                        </p>
                      )}
                    </div>

                    <div className={`px-2.5 py-1 rounded-xl border text-xs font-mono flex items-center gap-1 ${timerStyle}`}>
                      <Clock className="w-3.5 h-3.5" />
                      <span>{minutesElapsed}m</span>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="p-3.5 space-y-3 flex-1 overflow-y-auto max-h-72">
                    {order.items.map(item => (
                      <div key={item.cartItemId} className="border-b border-stone-100 pb-2.5 last:border-none last:pb-0">
                        <div className="flex items-start gap-2">
                          <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-900 font-black text-xs flex items-center justify-center shrink-0">
                            {item.quantity}x
                          </span>
                          <div className="flex-1">
                            <div className="flex items-baseline justify-between">
                              <span className="font-extrabold text-sm text-stone-900">{item.name}</span>
                              <span className="text-xs font-semibold text-stone-500 ml-1">
                                [{item.variation.name}]
                              </span>
                            </div>

                            {/* Prominent High-Visibility Allergen / Removal Badges */}
                            {item.specialRemovals && item.specialRemovals.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {item.specialRemovals.map(r => (
                                  <span key={r} className="text-[11px] font-black px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
                                    ⚠️ {r}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Added Modifiers / Extras */}
                            {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                              <div className="mt-1 space-y-0.5">
                                {item.selectedModifiers.map(m => (
                                  <p key={m.optionId} className="text-xs text-stone-600 font-medium">
                                    • {m.optionName}
                                  </p>
                                ))}
                              </div>
                            )}

                            {/* Kitchen Additions */}
                            {item.specialAdditions && item.specialAdditions.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {item.specialAdditions.map(a => (
                                  <span key={a} className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300/50">
                                    ★ {a}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Kitchen Notes */}
                            {item.customNotes && (
                              <p className="text-[11px] font-semibold text-amber-950 mt-1 bg-amber-50 p-2 rounded-xl border border-amber-200">
                                Note: {item.customNotes}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Bump Bar Actions */}
                  <div className="p-3 border-t border-stone-100 bg-stone-50/40">
                    <button
                      type="button"
                      onClick={() => handleNextStatus(order)}
                      className={`w-full py-2.5 px-3 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer ${
                        order.status === 'pending'
                          ? 'bg-amber-400 hover:bg-amber-500 text-stone-950'
                          : order.status === 'preparing'
                            ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                            : 'bg-stone-800 hover:bg-stone-900 text-white'
                      }`}
                    >
                      {order.status === 'pending' && (
                        <>
                          <Flame className="w-4 h-4" />
                          <span>Start Cooking</span>
                        </>
                      )}
                      {order.status === 'preparing' && (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Mark Ready (Call Cust.)</span>
                        </>
                      )}
                      {order.status === 'ready' && (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Bump (Handed to Cust)</span>
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

      {/* Recall Bumped Orders Modal */}
      {showRecallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white border border-stone-200 rounded-3xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden text-stone-900 shadow-2xl">
            <div className="p-4 border-b border-stone-100 flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-stone-900">Recently Bumped Orders</h3>
              <button
                onClick={() => setShowRecallModal(false)}
                className="text-stone-400 hover:text-stone-900 text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-2 flex-1">
              {bumpedOrders.length === 0 ? (
                <p className="text-xs text-stone-400 text-center py-6">No recently completed orders to recall.</p>
              ) : (
                bumpedOrders.slice(0, 10).map(order => (
                  <div key={order.id} className="p-3 bg-stone-50 rounded-2xl border border-stone-200 flex items-center justify-between">
                    <div>
                      <span className="font-black text-sm text-stone-900">#{order.orderNumber}</span>
                      <span className="text-xs text-stone-500 ml-2">({order.items.length} items)</span>
                      <p className="text-[11px] text-stone-500">
                        {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        onUpdateOrderStatus(order.id, 'preparing');
                        setShowRecallModal(false);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-stone-950 text-xs font-black flex items-center gap-1 cursor-pointer shadow-2xs"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Recall</span>
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

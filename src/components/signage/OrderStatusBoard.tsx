import React, { useEffect } from 'react';
import { Radio, Flame, CheckCircle2, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { Order } from '../../types';
import { sound } from '../../utils/sound';

interface OrderStatusBoardProps {
  orders: Order[];
}

export const OrderStatusBoard: React.FC<OrderStatusBoardProps> = ({ orders }) => {
  const [soundMuted, setSoundMuted] = React.useState<boolean>(false);
  const [lastReadyOrder, setLastReadyOrder] = React.useState<number | null>(null);

  // Filter orders
  const preparingOrders = orders.filter(o => o.status === 'pending' || o.status === 'preparing');
  const readyOrders = orders.filter(o => o.status === 'ready');

  // Trigger bell chime when a new order becomes ready
  useEffect(() => {
    if (readyOrders.length > 0) {
      const newestReady = readyOrders[0].orderNumber;
      if (newestReady !== lastReadyOrder) {
        if (!soundMuted) {
          sound.playOrderReadyBell();
        }
        setLastReadyOrder(newestReady);
      }
    }
  }, [readyOrders, lastReadyOrder, soundMuted]);

  return (
    <div className="flex-1 flex flex-col bg-[#FBFBFA] text-stone-900 overflow-hidden select-none">
      {/* Header Bar */}
      <div className="px-6 py-3.5 bg-white border-b border-stone-200 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-400 text-stone-950 flex items-center justify-center font-black text-lg shadow-xs">
            🥔
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-stone-900 uppercase">Order Collection Display</h1>
            <p className="text-xs text-stone-500 font-medium">Please watch your ticket number on screen</p>
          </div>
        </div>

        <button
          onClick={() => setSoundMuted(!soundMuted)}
          className={`px-3 py-2 rounded-2xl border text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-2xs ${
            !soundMuted ? 'bg-amber-100 border-amber-300 text-amber-900' : 'bg-stone-100 border-stone-200 text-stone-500'
          }`}
        >
          {!soundMuted ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          <span>{!soundMuted ? 'Audio Chime ON' : 'Muted'}</span>
        </button>
      </div>

      {/* Two Column Board: Preparing vs Ready */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 p-6 gap-6 overflow-hidden">
        {/* LEFT: PREPARING NOW */}
        <div className="flex flex-col bg-white rounded-3xl border border-stone-200 p-6 overflow-hidden shadow-sm">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center">
                <Flame className="w-5 h-5 animate-pulse" />
              </div>
              <h2 className="text-xl font-black uppercase tracking-wider text-stone-900">
                Cooking &amp; Preparing
              </h2>
            </div>
            <span className="text-xs font-mono font-bold text-stone-500 bg-stone-100 px-2.5 py-1 rounded-full">
              {preparingOrders.length} in progress
            </span>
          </div>

          <div className="flex-1 overflow-y-auto pr-2">
            {preparingOrders.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-stone-400 text-xs">
                No orders currently in the kitchen
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {preparingOrders.map(order => (
                  <div
                    key={order.id}
                    className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex flex-col items-center justify-center shadow-2xs"
                  >
                    <span className="text-3xl lg:text-4xl font-black text-stone-900 font-mono tracking-tight">
                      #{order.orderNumber}
                    </span>
                    <span className="text-[11px] font-extrabold text-amber-900 bg-amber-100 border border-amber-200/60 px-2 py-0.5 rounded-md mt-1.5 uppercase">
                      {order.type === 'takeaway' ? 'Takeaway' : 'Dine In'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: READY FOR PICKUP */}
        <div className="flex flex-col bg-white rounded-3xl border-2 border-amber-400 p-6 overflow-hidden shadow-md">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-400 text-stone-950 flex items-center justify-center font-black">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-black uppercase tracking-wider text-stone-900">
                Ready For Pickup
              </h2>
            </div>
            <span className="text-xs font-mono font-black text-amber-900 bg-amber-100 border border-amber-300 px-2.5 py-1 rounded-full">
              {readyOrders.length} ready to collect
            </span>
          </div>

          <div className="flex-1 overflow-y-auto pr-2">
            {readyOrders.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-stone-400 text-xs">
                Orders will appear here as soon as the kitchen calls them
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {readyOrders.map(order => (
                  <div
                    key={order.id}
                    className="p-5 rounded-3xl bg-amber-400 text-stone-950 flex flex-col items-center justify-center shadow-md animate-in zoom-in-95 duration-200"
                  >
                    <span className="text-4xl lg:text-5xl font-black font-mono tracking-tight">
                      #{order.orderNumber}
                    </span>
                    <span className="text-xs font-black uppercase tracking-wider mt-2 bg-stone-950 text-white px-2.5 py-1 rounded-lg">
                      Collect at Counter
                    </span>
                    {order.customerName && (
                      <span className="text-xs font-black mt-1.5 text-stone-950">
                        {order.customerName}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

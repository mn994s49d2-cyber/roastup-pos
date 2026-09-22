import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize, 
  ArrowLeft,
  Clock,
  Sparkles
} from 'lucide-react';
import { Order } from '../../types';
import { sound } from '../../utils/sound';
import { RoastupLogo, RoastupPotatoIcon } from '../brand/RoastupBrand';
import { getOrderPlacedTime, getOrderDueTime } from '../../utils/orderTime';

interface OrderStatusBoardProps {
  orders: Order[];
  standaloneTvMode?: boolean;
  onExit?: () => void;
}

export const OrderStatusBoard: React.FC<OrderStatusBoardProps> = ({ 
  orders,
  onExit
}) => {
  const [soundMuted, setSoundMuted] = useState<boolean>(false);
  const [lastReadyOrder, setLastReadyOrder] = useState<number | null>(null);
  const [showControls, setShowControls] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Filter orders
  const preparingOrders = orders.filter(o => o.status === 'pending' || o.status === 'preparing');
  const readyOrders = orders.filter(o => o.status === 'ready');

  // Trigger bell chime (NO VOCAL CALLOUT as user explicitly disliked it)
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

  // Auto-hide floating controls after 3.5 seconds of mouse inactivity
  useEffect(() => {
    let timeout: any;
    const handleMouseMove = () => {
      setShowControls(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => setShowControls(false), 3500);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(timeout);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div className="h-screen max-h-screen w-screen flex flex-col bg-[#FBFBFA] dark:bg-stone-950 text-stone-900 dark:text-stone-100 overflow-hidden select-none font-sans relative">
      {/* PURE PICKUP BOARD (Zero top menu clutter, high-visibility dual-column QSR board) */}
      <div className="flex-1 min-h-0 flex flex-col justify-between overflow-hidden p-6 md:p-8">
        {/* Header with ROASTUP Mascot and Collection Guidance */}
        <div className="flex items-center justify-between border-b-2 border-stone-900 dark:border-stone-100 pb-4 mb-6 shrink-0">
          <div className="flex items-center gap-3.5">
            <RoastupPotatoIcon size="lg" className="ring-2 ring-amber-400/50 shadow-xs" />
            <div>
              <div className="flex items-center gap-2.5">
                <RoastupLogo size="md" />
                <span className="text-[10px] px-2.5 py-0.5 rounded-md bg-stone-900 text-amber-400 dark:bg-white dark:text-stone-950 font-black tracking-widest uppercase">
                  Order Collection Display
                </span>
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 font-extrabold uppercase tracking-widest mt-0.5">
                Please collect your tray or takeaway box when your ticket appears under Ready
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-stone-500 dark:text-stone-400 text-xs font-mono font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>LIVE ORDERS</span>
          </div>
        </div>

        {/* Dual-Column High Visibility Order Number Matrix */}
        <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 overflow-hidden">
          {/* LEFT COLUMN: PREPARING IN THE KITCHEN */}
          <div className="bg-white dark:bg-stone-900/90 rounded-3xl border-2 border-amber-200 dark:border-stone-800 p-6 flex flex-col shadow-xs overflow-hidden min-h-0">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-stone-200 dark:border-stone-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-400 flex items-center justify-center font-black">
                  <Clock className="w-4 h-4 animate-spin-slow" />
                </div>
                <div>
                  <h2 className="text-xl font-black tracking-tight text-stone-900 dark:text-white uppercase">
                    Preparing
                  </h2>
                  <p className="text-xs text-stone-500">In the kitchen &amp; fryer</p>
                </div>
              </div>
              <span className="text-xs font-black px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 font-mono">
                {preparingOrders.length} In Progress
              </span>
            </div>

            {/* Preparing Order Numbers Grid */}
            <div className="flex-1 min-h-0 overflow-y-auto pr-1">
              {preparingOrders.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-stone-400 p-8">
                  <span className="text-3xl mb-2">🥔</span>
                  <p className="font-bold text-sm text-stone-600 dark:text-stone-300">All caught up!</p>
                  <p className="text-xs text-stone-500">Fresh spuds ready on the next order</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {preparingOrders.map(order => (
                    <div
                      key={order.id}
                      className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-stone-800/60 border border-amber-200 dark:border-stone-700 flex flex-col items-center justify-center text-center shadow-2xs"
                    >
                      <span className="text-3xl lg:text-4xl font-black font-mono tracking-tight text-stone-900 dark:text-white">
                        #{order.orderNumber}
                      </span>
                      <span className="text-[10px] font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider mt-1">
                        {order.type === 'dine_in' ? '🍽️ Dine In' : '🛍️ Takeaway'}
                      </span>
                      <div className="mt-2 pt-1.5 border-t border-amber-200/60 dark:border-stone-700/60 w-full flex items-center justify-center gap-2 text-[10px] font-mono text-stone-600 dark:text-stone-300">
                        <span>Placed <strong className="text-stone-800 dark:text-stone-200">{getOrderPlacedTime(order)}</strong></span>
                        <span className="text-stone-400">•</span>
                        <span>Due <strong className="text-amber-800 dark:text-amber-300 font-black">{getOrderDueTime(order)}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: READY FOR COLLECTION */}
          <div className="bg-white dark:bg-stone-900/90 rounded-3xl border-2 border-emerald-300 dark:border-emerald-800/60 p-6 flex flex-col shadow-xs overflow-hidden min-h-0">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-stone-200 dark:border-stone-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-400 flex items-center justify-center font-black">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xl font-black tracking-tight text-emerald-900 dark:text-emerald-400 uppercase">
                    Ready for Collection
                  </h2>
                  <p className="text-xs text-stone-500">Please collect at the counter</p>
                </div>
              </div>
              <span className="text-xs font-black px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-300 font-mono">
                {readyOrders.length} Ready
              </span>
            </div>

            {/* Ready Order Numbers Grid */}
            <div className="flex-1 min-h-0 overflow-y-auto pr-1">
              {readyOrders.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-stone-400 p-8">
                  <Sparkles className="w-8 h-8 text-stone-300 dark:text-stone-700 mb-2" />
                  <p className="font-bold text-sm text-stone-600 dark:text-stone-300">No collections ready right now</p>
                  <p className="text-xs text-stone-500">Orders will appear here as soon as they are bagged</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                  {readyOrders.map(order => {
                    const isNewest = order.orderNumber === lastReadyOrder;
                    return (
                      <div
                        key={order.id}
                        className={`p-4 rounded-2xl flex flex-col items-center justify-center text-center transition-all ${
                          isNewest
                            ? 'bg-emerald-500 text-stone-950 ring-4 ring-emerald-300 dark:ring-emerald-700 shadow-lg scale-105'
                            : 'bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-300 dark:border-emerald-700 text-stone-900 dark:text-white shadow-xs'
                        }`}
                      >
                        <span className="text-3xl lg:text-4xl font-black font-mono tracking-tight">
                          #{order.orderNumber}
                        </span>
                        <span className={`text-[10px] font-black uppercase tracking-wider mt-1 px-2 py-0.5 rounded-full ${
                          isNewest ? 'bg-stone-950 text-emerald-300' : 'bg-emerald-200/80 dark:bg-emerald-900/80 text-emerald-950 dark:text-emerald-200'
                        }`}>
                          {order.type === 'dine_in' ? '🍽️ Dine In' : '🛍️ Takeaway'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer info ticker */}
        <div className="mt-4 py-2 px-4 rounded-xl bg-stone-100 dark:bg-stone-900 text-stone-600 dark:text-stone-400 text-xs flex items-center justify-between border border-stone-200 dark:border-stone-800 shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-stone-900 dark:text-white">ROASTUP Counter Pickup:</span>
            <span>Show your order ticket or receipt number at the collection hatch.</span>
          </div>
          <span className="font-mono font-bold text-[11px] text-amber-600 dark:text-amber-400">
            Maris Piper Spuds Freshly Roasted
          </span>
        </div>
      </div>

      {/* DISCREET FLOATING CONTROL BAR (Reveals on mouse movement) */}
      <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-stone-900/90 dark:bg-stone-800/90 backdrop-blur-md p-1.5 rounded-2xl shadow-xl border border-stone-700 transition-all duration-300 ${
        showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      }`}>
        {onExit && (
          <button
            onClick={onExit}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors cursor-pointer"
            title="Exit Pickup Board & Back to POS"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to POS</span>
          </button>
        )}

        <button
          onClick={() => setSoundMuted(!soundMuted)}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
            !soundMuted ? 'bg-amber-400 text-stone-950 font-black' : 'bg-white/10 text-stone-400 hover:text-white'
          }`}
          title="Toggle Collection Chime Sound"
        >
          {!soundMuted ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          <span>{!soundMuted ? 'Chime ON' : 'Chime Muted'}</span>
        </button>

        <button
          onClick={toggleFullscreen}
          className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors cursor-pointer"
          title="Toggle Fullscreen"
        >
          {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
};

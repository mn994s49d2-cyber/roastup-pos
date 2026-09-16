import React, { useState, useEffect } from 'react';
import { 
  TabletSmartphone, 
  CreditCard, 
  Sparkles, 
  CheckCircle2, 
  Smartphone,
  Maximize, 
  Minimize, 
  ShoppingBag,
  ArrowLeft
} from 'lucide-react';
import { CartItem } from '../../types';
import { RoastupLogo, RoastupPotatoIcon } from '../brand/RoastupBrand';

interface CfdState {
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  orderType: string;
  customerGreeting?: string;
  lastCompletedOrderNumber?: number;
}

interface CustomerFacingDisplayProps {
  standaloneTvMode?: boolean;
  onExit?: () => void;
}

export const CustomerFacingDisplay: React.FC<CustomerFacingDisplayProps> = ({
  onExit
}) => {
  const [cfdData, setCfdData] = useState<CfdState>({
    items: [],
    subtotal: 0,
    tax: 0,
    total: 0,
    orderType: 'takeaway',
    customerGreeting: 'Welcome to ROASTIES!'
  });

  const [selectedTip, setSelectedTip] = useState<number | null>(null);
  const [showControls, setShowControls] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Poll active cart from server
  useEffect(() => {
    const fetchCurrent = async () => {
      try {
        const res = await fetch('/api/cfd/cart');
        if (res.ok) {
          const data = await res.json();
          setCfdData(data);
        }
      } catch {}
    };

    fetchCurrent();
    const interval = setInterval(fetchCurrent, 1000);
    return () => clearInterval(interval);
  }, []);

  // Auto-hide floating controls after 3.5s
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

  const finalTotal = cfdData.total + (selectedTip || 0);

  return (
    <div className="h-screen max-h-screen w-screen flex flex-col bg-[#FBFBFA] dark:bg-stone-950 text-stone-900 dark:text-stone-100 overflow-hidden select-none font-sans relative">
      {/* Top Banner Header */}
      <div className="px-8 py-4 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between shadow-2xs shrink-0">
        <div className="flex items-center gap-3.5">
          <RoastupPotatoIcon size="lg" className="ring-2 ring-amber-400/50 shadow-xs" />
          <div>
            <div className="flex items-center gap-2">
              <RoastupLogo size="md" />
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-stone-900 text-amber-400 dark:bg-white dark:text-stone-950 font-black tracking-widest uppercase">
                Customer Terminal
              </span>
            </div>
            <p className="text-[11px] text-stone-500 font-bold uppercase tracking-wider mt-0.5">
              100% British Maris Piper Potatoes • Freshly Roasted
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs font-black uppercase text-amber-600 dark:text-amber-400 block tracking-widest">
            {cfdData.orderType === 'dine_in' ? '🍽️ Dine In Tray' : '🛍️ Takeaway Box'}
          </span>
          <span className="text-base font-extrabold text-stone-900 dark:text-white">
            {cfdData.customerGreeting || 'Welcome to ROASTUP!'}
          </span>
        </div>
      </div>

      {/* Main CFD Body */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 md:p-8 overflow-hidden">
        {/* Left Tape: Live Itemized Cart */}
        <div className="lg:col-span-7 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-6 flex flex-col justify-between shadow-xs overflow-hidden min-h-0">
          <div className="border-b border-stone-100 dark:border-stone-800 pb-3 mb-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-amber-500" />
              <span className="font-black text-sm uppercase tracking-wider text-stone-900 dark:text-white">
                Your Order Summary
              </span>
            </div>
            <span className="text-xs font-bold text-stone-400">
              {cfdData.items.length} {cfdData.items.length === 1 ? 'item' : 'items'}
            </span>
          </div>

          {/* Cart items scrollable list */}
          <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-2">
            {cfdData.items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-stone-400 p-8 space-y-2">
                <RoastupPotatoIcon size="lg" className="opacity-30 mb-1" />
                <p className="font-bold text-sm text-stone-700 dark:text-stone-300">Ready to Take Your Order</p>
                <p className="text-xs text-stone-500">Items added at the register will appear here instantly</p>
              </div>
            ) : (
              cfdData.items.map(item => (
                <div 
                  key={item.cartItemId}
                  className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/70 dark:border-stone-700/70 flex items-center justify-between gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-sm text-amber-600 dark:text-amber-400">
                        {item.quantity}×
                      </span>
                      <h4 className="font-black text-sm text-stone-900 dark:text-white truncate">
                        {item.name}
                      </h4>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200">
                        {item.variation.name}
                      </span>
                    </div>

                    {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                      <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                        {item.selectedModifiers.map(m => `+ ${m.optionName}`).join(', ')}
                      </p>
                    )}
                    {item.specialAdditions && item.specialAdditions.length > 0 && (
                      <p className="text-[11px] font-bold text-emerald-600 mt-0.5">
                        EXTRA: {item.specialAdditions.join(', ')}
                      </p>
                    )}
                    {item.specialRemovals && item.specialRemovals.length > 0 && (
                      <p className="text-[11px] font-bold text-rose-600 mt-0.5">
                        NO: {item.specialRemovals.join(', ')}
                      </p>
                    )}
                  </div>

                  <span className="font-mono font-black text-sm text-stone-900 dark:text-white shrink-0">
                    £{item.totalPrice.toFixed(2)}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Subtotal & Total Breakout */}
          <div className="border-t border-stone-200 dark:border-stone-800 pt-4 mt-4 space-y-1.5 shrink-0">
            <div className="flex items-center justify-between text-xs text-stone-500">
              <span>Subtotal</span>
              <span className="font-mono font-bold">£{cfdData.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-stone-500">
              <span>VAT Included (20%)</span>
              <span className="font-mono font-bold">£{cfdData.tax.toFixed(2)}</span>
            </div>
            {selectedTip !== null && selectedTip > 0 && (
              <div className="flex items-center justify-between text-xs text-amber-600 font-bold">
                <span>Team Tip Added</span>
                <span className="font-mono">£{selectedTip.toFixed(2)}</span>
              </div>
            )}
            <div className="flex items-center justify-between pt-2 border-t border-stone-200 dark:border-stone-800">
              <span className="text-base font-black text-stone-900 dark:text-white uppercase tracking-tight">
                Total Due
              </span>
              <span className="text-3xl font-black font-mono text-stone-950 dark:text-white">
                £{finalTotal.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Right Tape: Tap & Pay Instructions & Tip Prompt */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-5 overflow-hidden min-h-0">
          {/* Tip prompt */}
          {cfdData.items.length > 0 && (
            <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-5 shadow-xs shrink-0">
              <span className="text-[10px] font-black uppercase tracking-wider text-stone-400 block mb-1">
                Optional Kitchen &amp; Counter Tip
              </span>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {[
                  { label: 'No Tip', val: 0 },
                  { label: '£0.50', val: 0.50 },
                  { label: '£1.00', val: 1.00 },
                  { label: '£2.00', val: 2.00 }
                ].map(tip => (
                  <button
                    key={tip.label}
                    onClick={() => setSelectedTip(tip.val)}
                    className={`py-2 px-1 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      selectedTip === tip.val
                        ? 'bg-amber-400 text-stone-950 shadow-xs'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
                    }`}
                  >
                    {tip.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Payment Prompt Card */}
          <div className="flex-1 bg-stone-900 text-white rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden shadow-xl border border-stone-800 min-h-0">
            <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />

            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-400/20 px-3 py-1 rounded-full border border-amber-400/30">
                Contactless Payment
              </span>
              <h3 className="text-2xl font-black tracking-tight mt-4">
                Tap Card, Phone or Watch
              </h3>
              <p className="text-xs text-stone-400 mt-1">
                Hold your device near the card reader terminal to complete payment.
              </p>
            </div>

            {/* Visual NFC Card Reader graphic */}
            <div className="my-4 flex flex-col items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-amber-400/20 border-2 border-amber-400 flex items-center justify-center animate-pulse">
                <Smartphone className="w-8 h-8 text-amber-400" />
              </div>
              <span className="text-xs font-mono font-bold text-amber-400 mt-2.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Reader Ready
              </span>
            </div>

            <div className="border-t border-stone-800 pt-3 flex items-center justify-between text-xs text-stone-400">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-stone-300" />
                <span>Apple Pay / Google Pay / Chip &amp; PIN</span>
              </div>
            </div>
          </div>
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
            title="Exit Customer Screen & Back to POS"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to POS</span>
          </button>
        )}

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

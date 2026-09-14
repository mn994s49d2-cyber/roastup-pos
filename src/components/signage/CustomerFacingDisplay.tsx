import React, { useState, useEffect } from 'react';
import { TabletSmartphone, CreditCard, Sparkles, CheckCircle2, Smartphone } from 'lucide-react';
import { CartItem } from '../../types';
import { RoastupIcon } from '../brand/RoastupBrand';

interface CfdState {
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  orderType: string;
  customerGreeting?: string;
  lastCompletedOrderNumber?: number;
}

export const CustomerFacingDisplay: React.FC = () => {
  const [cfdData, setCfdData] = useState<CfdState>({
    items: [],
    subtotal: 0,
    tax: 0,
    total: 0,
    orderType: 'takeaway',
    customerGreeting: 'Welcome to ROASTUP!'
  });

  // Poll current active cart from server
  useEffect(() => {
    const fetchCurrent = async () => {
      try {
        const res = await fetch('/api/orders/current-active');
        if (res.ok) {
          const data = await res.json();
          setCfdData(data);
        }
      } catch {}
    };

    fetchCurrent();
    const interval = setInterval(fetchCurrent, 1200);
    return () => clearInterval(interval);
  }, []);

  const hasItems = cfdData.items && cfdData.items.length > 0;

  return (
    <div className="flex-1 flex flex-col bg-[#FBFBFA] text-stone-900 overflow-hidden select-none">
      {/* Top Banner */}
      <div className="px-6 py-4 bg-white border-b border-stone-200 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <RoastupIcon className="w-10 h-10 rounded-2xl" />
          <div>
            <h1 className="text-xl font-black text-stone-900 tracking-tight">ROASTUP</h1>
            <p className="text-[11px] text-stone-500 font-bold uppercase tracking-wider">Crispy Roast Potatoes</p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs font-bold px-3.5 py-1.5 rounded-full bg-amber-400/20 text-stone-950 border border-amber-400/40">
            {cfdData.orderType === 'dine_in' ? 'Dine In' : 'Takeaway Box'}
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-6 lg:p-8 flex flex-col lg:flex-row gap-6 overflow-hidden">
        {/* LEFT: Live Cart Breakdown */}
        <div className="flex-1 bg-white rounded-3xl border border-stone-200 p-6 flex flex-col justify-between overflow-hidden shadow-xs">
          <div>
            <div className="border-b border-stone-100 pb-3 mb-4 flex items-center justify-between">
              <h2 className="text-base font-extrabold text-stone-900">Your Order</h2>
              <span className="text-xs text-stone-500 font-mono font-bold">
                {cfdData.items?.reduce((s, i) => s + i.quantity, 0) || 0} item(s)
              </span>
            </div>

            {!hasItems ? (
              <div className="py-16 text-center space-y-3">
                <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-900 mx-auto flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-amber-500" />
                </div>
                <h3 className="text-xl font-black text-stone-900">{cfdData.customerGreeting || 'Welcome to ROASTUP!'}</h3>
                <p className="text-xs text-stone-500 max-w-sm mx-auto font-medium">
                  Your order items will appear here as our cashier rings them in.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[calc(100vh-340px)] overflow-y-auto pr-2">
                {cfdData.items.map(item => (
                  <div key={item.cartItemId} className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200/80 flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-stone-900">{item.quantity}x {item.name}</span>
                        <span className="text-xs px-2.5 py-0.5 rounded-lg bg-amber-100 text-stone-950 font-bold border border-amber-200">
                          {item.variation.name}
                        </span>
                      </div>
                      {item.specialRemovals && item.specialRemovals.length > 0 && (
                        <p className="text-xs text-rose-600 font-bold mt-0.5">
                          {item.specialRemovals.join(', ')}
                        </p>
                      )}
                      {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                        <p className="text-xs text-stone-500 font-medium mt-0.5">
                          {item.selectedModifiers.map(m => m.optionName).join(', ')}
                        </p>
                      )}
                    </div>
                    <span className="font-black text-sm text-stone-900 font-mono">
                      £{item.totalPrice.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Subtotals */}
          {hasItems && (
            <div className="border-t border-stone-100 pt-4 space-y-1.5 text-xs text-stone-600 font-medium">
              <div className="flex justify-between">
                <span>Subtotal (Net)</span>
                <span className="font-mono">£{cfdData.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>VAT (20%)</span>
                <span className="font-mono">£{cfdData.tax.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Payment Prompt & Totals */}
        <div className="w-full lg:w-96 flex flex-col gap-4 shrink-0">
          <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-xs flex flex-col justify-between flex-1">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-stone-500">
                Amount to Pay
              </span>
              <div className="mt-2 p-6 rounded-3xl bg-stone-50 border border-stone-200 text-center">
                <span className="text-4xl lg:text-5xl font-black text-stone-900 font-mono">
                  £{cfdData.total ? cfdData.total.toFixed(2) : '0.00'}
                </span>
                <p className="text-[11px] text-stone-500 mt-1 font-medium">Includes all taxes &amp; toppings</p>
              </div>

              {/* Payment methods prompt */}
              <div className="mt-6 p-5 rounded-3xl bg-amber-50 border border-amber-200/80 text-center space-y-2.5">
                <div className="w-12 h-12 rounded-2xl bg-amber-400 text-stone-950 mx-auto flex items-center justify-center font-bold shadow-2xs">
                  <Smartphone className="w-6 h-6" />
                </div>
                <p className="text-xs font-black text-stone-900 uppercase tracking-wider">
                  Contactless &amp; Card Payments
                </p>
                <p className="text-xs text-stone-600 leading-relaxed font-medium">
                  Tap your phone or contactless debit/credit card on the reader when prompted.
                </p>
              </div>
            </div>

            <div className="text-center pt-4 border-t border-stone-100 text-[11px] text-stone-500">
              Receipts can be printed or sent digitally upon request.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

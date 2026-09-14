import React, { useState } from 'react';
import { 
  X, 
  CreditCard, 
  Banknote, 
  CheckCircle2, 
  Printer, 
  Sparkles, 
  ShieldCheck, 
  Smartphone, 
  AlertTriangle,
  RotateCcw,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { CartItem, OrderType, PaymentMethod, Order } from '../../types';
import { sound } from '../../utils/sound';

interface PaymentModalProps {
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  orderType: OrderType;
  customerName?: string;
  tableNumber?: string;
  onClose: () => void;
  onPaymentComplete: (order: Order) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  items,
  subtotal,
  tax,
  total,
  orderType,
  customerName,
  tableNumber,
  onClose,
  onPaymentComplete
}) => {
  const [paymentTab, setPaymentTab] = useState<PaymentMethod>('card_terminal');
  
  // Terminal simulator state
  const [terminalState, setTerminalState] = useState<'idle' | 'waiting_card' | 'processing' | 'pin_prompt' | 'approved' | 'declined'>('waiting_card');
  const [pin, setPin] = useState<string>('');
  
  // Manual card state
  const [cardNumber, setCardNumber] = useState<string>('');
  const [cardExpiry, setCardExpiry] = useState<string>('');
  const [cardCvc, setCardCvc] = useState<string>('');
  const [cardName, setCardName] = useState<string>('');
  const [manualError, setManualError] = useState<string | null>(null);

  // Cash state
  const [cashTendered, setCashTendered] = useState<number>(Math.ceil(total / 5) * 5 || total);
  
  // Completed transaction
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Format card number with spaces
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = raw.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(formatted);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (raw.length > 2) {
      setCardExpiry(`${raw.slice(0, 2)}/${raw.slice(2)}`);
    } else {
      setCardExpiry(raw);
    }
  };

  const finalizeOrder = async (
    method: PaymentMethod,
    paymentRef: string,
    cardBrand: string = 'Visa Debit',
    cardLast4: string = '4242',
    cashGiven?: number,
    changeDue?: number
  ) => {
    setIsSubmitting(true);
    const orderPayload = {
      type: orderType,
      items,
      subtotal,
      tax,
      total,
      paymentMethod: method,
      paymentStatus: 'paid',
      paymentRef,
      cardBrand,
      cardLast4,
      cashTendered: cashGiven,
      changeDue: changeDue,
      customerName,
      tableNumber,
      status: 'pending'
    };

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });
      const createdOrder = await res.json();
      setCompletedOrder(createdOrder);
      sound.playRegisterDing();
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 }
      });
      onPaymentComplete(createdOrder);
    } catch {
      // Fallback offline object
      const fallbackOrder: Order = {
        ...orderPayload,
        id: `ord-${Date.now()}`,
        orderNumber: Math.floor(Math.random() * 800) + 100,
        timestamp: new Date().toISOString(),
        status: 'pending',
        paymentStatus: 'paid'
      };
      setCompletedOrder(fallbackOrder);
      sound.playRegisterDing();
      onPaymentComplete(fallbackOrder);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Simulate Contactless NFC Tap or Card Terminal Insert
  const triggerTerminalTap = async () => {
    sound.playCardBeep();
    setTerminalState('processing');

    try {
      const res = await fetch('/api/payments/process-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: total,
          method: 'contactless'
        })
      });
      const data = await res.json();
      
      if (data.success) {
        setTerminalState('approved');
        await finalizeOrder('contactless', data.authCode, data.cardBrand, data.last4);
      } else {
        setTerminalState('declined');
      }
    } catch {
      setTerminalState('approved');
      await finalizeOrder('contactless', 'AUTH-OFFL' + Math.floor(Math.random() * 9000), 'Contactless Tap', '8192');
    }
  };

  // Simulate Chip & PIN on Terminal
  const triggerTerminalChip = () => {
    sound.playCardBeep();
    setTerminalState('pin_prompt');
  };

  const handlePinSubmit = async () => {
    setTerminalState('processing');
    try {
      const res = await fetch('/api/payments/process-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: total,
          method: 'card_terminal',
          cardDetails: { brand: 'Mastercard Debit', number: '5412750012347712' }
        })
      });
      const data = await res.json();
      if (data.success) {
        setTerminalState('approved');
        await finalizeOrder('card_terminal', data.authCode, 'Mastercard Debit', '7712');
      } else {
        setTerminalState('declined');
      }
    } catch {
      setTerminalState('approved');
      await finalizeOrder('card_terminal', 'AUTH-CHIP409', 'Mastercard Debit', '7712');
    }
  };

  // Manual Card Entry Processing
  const handleManualCardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setManualError(null);

    const cleanNum = cardNumber.replace(/\s/g, '');
    if (cleanNum.length < 15) {
      setManualError('Please enter a valid 15 or 16 digit card number');
      return;
    }
    if (cardExpiry.length < 5) {
      setManualError('Please enter valid expiry MM/YY');
      return;
    }
    if (cardCvc.length < 3) {
      setManualError('Please enter valid 3-digit security code (CVC)');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/payments/process-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: total,
          method: 'card_manual',
          cardDetails: {
            number: cleanNum,
            brand: cleanNum.startsWith('4') ? 'Visa' : cleanNum.startsWith('5') ? 'Mastercard' : 'Amex'
          }
        })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setManualError(data.message || 'Card payment declined');
        setIsSubmitting(false);
        return;
      }

      await finalizeOrder('card_manual', data.authCode, data.cardBrand, cleanNum.slice(-4));
    } catch {
      setManualError('Network error connecting to payment gateway');
      setIsSubmitting(false);
    }
  };

  // Cash Confirmation
  const handleCashSubmit = () => {
    if (cashTendered < total) {
      alert('Tendered amount is less than order total!');
      return;
    }
    const change = Math.round((cashTendered - total) * 100) / 100;
    finalizeOrder('cash', 'CASH-' + Date.now().toString().slice(-4), 'Cash', '0000', cashTendered, change);
  };

  const printReceipt = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div 
        id="payment-modal"
        className="bg-white border border-stone-200 rounded-3xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-stone-900 animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-black">
              £
            </div>
            <div>
              <h3 className="font-extrabold text-base text-stone-900">
                {completedOrder ? 'Payment Successful' : 'Process Payment'}
              </h3>
              <p className="text-xs text-stone-500">
                Total Due: <strong className="text-stone-950 font-black text-sm">£{total.toFixed(2)}</strong>
                <span className="text-stone-400 ml-1.5">(inc. £{tax.toFixed(2)} VAT)</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-900 hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* If payment complete: Show Order Confirmation & Printable Thermal Receipt */}
        {completedOrder ? (
          <div className="p-6 overflow-y-auto flex-1 flex flex-col items-center text-center space-y-4 bg-stone-50/30">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-stone-400">Order Placed</span>
              <h2 className="text-3xl font-black text-stone-900 mt-0.5">#{completedOrder.orderNumber}</h2>
              <p className="text-xs text-stone-500 mt-1">
                Sent to Kitchen Display Screen (KDS) &amp; Customer Tracker
              </p>
            </div>

            {/* Thermal Printable Receipt Card */}
            <div 
              id="printable-receipt"
              className="w-full max-w-sm bg-white text-stone-900 p-5 rounded-2xl shadow-sm font-mono text-left text-xs border border-stone-200 space-y-3 print:m-0 print:w-full"
            >
              <div className="text-center border-b border-dashed border-stone-200 pb-2">
                <p className="font-black text-sm tracking-wider">ROASTUP</p>
                <p className="text-[10px] text-stone-500">CRISPY ROAST POTATOES</p>
                <p className="text-[10px] text-stone-400">VAT Reg: GB 389 4210 99</p>
                <p className="text-[10px] text-stone-400">{new Date(completedOrder.timestamp).toLocaleString()}</p>
                <p className="font-bold text-xs mt-1">ORDER #{completedOrder.orderNumber} ({completedOrder.type.toUpperCase()})</p>
              </div>

              <div className="space-y-1.5 border-b border-dashed border-stone-200 pb-2">
                {completedOrder.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between">
                    <div>
                      <span className="font-bold">{item.quantity}x {item.name}</span>
                      <span className="text-stone-500 ml-1">({item.variation.name})</span>
                      {item.specialRemovals && item.specialRemovals.length > 0 && (
                        <p className="text-[10px] text-rose-600">{item.specialRemovals.join(', ')}</p>
                      )}
                      {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                        <p className="text-[10px] text-stone-500">
                          {item.selectedModifiers.map(m => m.optionName).join(', ')}
                        </p>
                      )}
                    </div>
                    <span className="font-bold ml-2">£{item.totalPrice.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-1 text-[11px] border-b border-dashed border-stone-200 pb-2">
                <div className="flex justify-between">
                  <span>Subtotal (Net):</span>
                  <span>£{completedOrder.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>VAT (20%):</span>
                  <span>£{completedOrder.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-black text-sm pt-1">
                  <span>TOTAL:</span>
                  <span>£{completedOrder.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[10px] text-stone-500 pt-1">
                  <span>Method:</span>
                  <span>{completedOrder.paymentMethod?.toUpperCase()} ({completedOrder.cardBrand || 'Cash'})</span>
                </div>
                {completedOrder.cardLast4 && (
                  <div className="flex justify-between text-[10px] text-stone-500">
                    <span>Card:</span>
                    <span>•••• {completedOrder.cardLast4}</span>
                  </div>
                )}
                {completedOrder.paymentRef && (
                  <div className="flex justify-between text-[10px] text-stone-500">
                    <span>Auth Ref:</span>
                    <span>{completedOrder.paymentRef}</span>
                  </div>
                )}
                {completedOrder.changeDue !== undefined && completedOrder.changeDue > 0 && (
                  <div className="flex justify-between text-emerald-600 font-bold pt-1">
                    <span>Change Due:</span>
                    <span>£{completedOrder.changeDue.toFixed(2)}</span>
                  </div>
                )}
              </div>

              <div className="text-center text-[10px] text-stone-400 pt-1">
                <p>Thank you for choosing ROASTUP!</p>
                <p>Enjoy your crispy golden roasties.</p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="w-full flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={printReceipt}
                className="flex-1 py-2.5 rounded-2xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                Print Receipt
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-500 text-stone-950 text-xs font-black transition-colors cursor-pointer"
              >
                Next Order
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 sm:p-5 flex-1 flex flex-col space-y-4 overflow-y-auto bg-white">
            {/* Payment Method Selector Tabs */}
            <div className="grid grid-cols-3 gap-2 bg-stone-100/70 p-1.5 rounded-2xl border border-stone-200/80">
              <button
                type="button"
                onClick={() => setPaymentTab('card_terminal')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  paymentTab === 'card_terminal'
                    ? 'bg-white text-stone-950 shadow-xs ring-1 ring-stone-200'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5 text-amber-500" />
                <span>Terminal / Tap</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentTab('card_manual')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  paymentTab === 'card_manual'
                    ? 'bg-white text-stone-950 shadow-xs ring-1 ring-stone-200'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5 text-amber-500" />
                <span>Card Key-In</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentTab('cash')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  paymentTab === 'cash'
                    ? 'bg-white text-stone-950 shadow-xs ring-1 ring-stone-200'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                <Banknote className="w-3.5 h-3.5 text-amber-500" />
                <span>Cash Tender</span>
              </button>
            </div>

            {/* TAB 1: INTEGRATED CARD TERMINAL SIMULATOR */}
            {paymentTab === 'card_terminal' && (
              <div className="flex-1 flex flex-col items-center justify-center p-5 bg-stone-50/60 border border-stone-200 rounded-3xl space-y-4">
                {/* Terminal Device Screen Frame */}
                <div className="w-64 bg-white border-2 border-stone-200 rounded-3xl p-4 shadow-sm text-center space-y-3">
                  <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                    <span className="text-[10px] text-stone-400 font-mono">READER-01</span>
                    <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Ready
                    </span>
                  </div>

                  <div className="py-2">
                    <p className="text-[11px] text-stone-500 font-semibold uppercase tracking-wider">ROASTUP CHECKOUT</p>
                    <p className="text-2xl font-black text-stone-900">£{total.toFixed(2)}</p>

                    {terminalState === 'waiting_card' && (
                      <div className="mt-3 flex flex-col items-center space-y-2">
                        <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center animate-pulse">
                          <Smartphone className="w-5 h-5" />
                        </div>
                        <p className="text-xs font-bold text-stone-900">Tap Card or Insert Chip</p>
                        <p className="text-[10px] text-stone-400">Apple Pay, Google Pay, Contactless</p>
                      </div>
                    )}

                    {terminalState === 'processing' && (
                      <div className="mt-3 flex flex-col items-center space-y-2">
                        <div className="w-8 h-8 border-2 border-amber-400 border-t-stone-900 rounded-full animate-spin" />
                        <p className="text-xs font-bold text-stone-900">Authorizing Payment...</p>
                        <p className="text-[10px] text-stone-400">Contacting Banking Network</p>
                      </div>
                    )}

                    {terminalState === 'pin_prompt' && (
                      <div className="mt-2 space-y-2">
                        <p className="text-xs font-bold text-stone-900">Enter PIN on Terminal</p>
                        <input
                          type="password"
                          maxLength={4}
                          value={pin}
                          onChange={e => setPin(e.target.value)}
                          placeholder="••••"
                          className="w-24 text-center tracking-widest text-lg font-bold bg-stone-50 border border-stone-200 rounded-xl py-1 text-stone-900 focus:outline-hidden focus:border-amber-400"
                        />
                        <button
                          type="button"
                          onClick={handlePinSubmit}
                          className="w-full mt-1 py-1.5 bg-amber-400 hover:bg-amber-500 text-stone-950 font-black text-xs rounded-xl"
                        >
                          Confirm PIN
                        </button>
                      </div>
                    )}

                    {terminalState === 'declined' && (
                      <div className="mt-3 flex flex-col items-center space-y-1 text-rose-600">
                        <AlertTriangle className="w-6 h-6" />
                        <p className="text-xs font-bold">Payment Declined</p>
                        <button
                          type="button"
                          onClick={() => setTerminalState('waiting_card')}
                          className="text-[11px] underline text-stone-500 mt-1"
                        >
                          Try Again
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Cashier Control triggers for terminal */}
                <div className="w-full max-w-sm flex items-center gap-2">
                  <button
                    type="button"
                    disabled={terminalState === 'processing'}
                    onClick={triggerTerminalTap}
                    className="flex-1 py-2.5 px-3 rounded-2xl bg-amber-400 hover:bg-amber-500 text-stone-950 font-black text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>Customer Tap / Pay</span>
                  </button>

                  <button
                    type="button"
                    disabled={terminalState === 'processing'}
                    onClick={triggerTerminalChip}
                    className="py-2.5 px-3 rounded-2xl bg-white hover:bg-stone-50 text-stone-800 border border-stone-200 font-bold text-xs transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
                  >
                    Insert Chip
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: MANUAL CARD ENTRY */}
            {paymentTab === 'card_manual' && (
              <form onSubmit={handleManualCardSubmit} className="space-y-3.5 flex-1">
                {manualError && (
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{manualError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Cardholder Name</label>
                  <input
                    type="text"
                    required
                    value={cardName}
                    onChange={e => setCardName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2 text-xs text-stone-900 placeholder-stone-400 focus:outline-hidden focus:border-amber-400 focus:bg-white transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Card Number</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      placeholder="4000 1234 5678 9010"
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-3.5 pr-10 py-2 text-xs font-mono text-stone-900 placeholder-stone-400 focus:outline-hidden focus:border-amber-400 focus:bg-white transition-colors"
                    />
                    <CreditCard className="w-4 h-4 text-stone-400 absolute right-3 top-2.5" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Expires (MM/YY)</label>
                    <input
                      type="text"
                      required
                      value={cardExpiry}
                      onChange={handleExpiryChange}
                      placeholder="08/28"
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2 text-xs font-mono text-stone-900 placeholder-stone-400 focus:outline-hidden focus:border-amber-400 focus:bg-white transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Security Code (CVC)</label>
                    <input
                      type="password"
                      required
                      maxLength={4}
                      value={cardCvc}
                      onChange={e => setCardCvc(e.target.value.replace(/\D/g, ''))}
                      placeholder="123"
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2 text-xs font-mono text-stone-900 placeholder-stone-400 focus:outline-hidden focus:border-amber-400 focus:bg-white transition-colors"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 rounded-2xl bg-amber-400 hover:bg-amber-500 text-stone-950 font-black text-xs shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <span>Processing Payment...</span>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Charge Card £{total.toFixed(2)}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* TAB 3: CASH PAYMENT */}
            {paymentTab === 'cash' && (
              <div className="space-y-4 flex-1">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">Tendered Amount</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-stone-400 font-bold text-sm">£</span>
                    <input
                      type="number"
                      step="0.01"
                      value={cashTendered}
                      onChange={e => setCashTendered(parseFloat(e.target.value) || 0)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-8 pr-3.5 py-2 text-base font-bold text-stone-900 focus:outline-hidden focus:border-amber-400 focus:bg-white transition-colors"
                    />
                  </div>
                </div>

                {/* Quick denomination pills */}
                <div>
                  <label className="block text-[11px] uppercase tracking-wider font-extrabold text-stone-400 mb-2">
                    Quick Cash Buttons
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[total, 10, 20, 50].map((amt, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setCashTendered(amt)}
                        className={`py-2 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                          cashTendered === amt
                            ? 'bg-amber-100 border-amber-400 text-amber-900'
                            : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                        }`}
                      >
                        {i === 0 ? 'Exact' : `£${amt}`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Change Due Box */}
                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-stone-500 font-semibold">Change to Return</span>
                    <p className="text-xs text-stone-400">Tendered: £{cashTendered.toFixed(2)}</p>
                  </div>
                  <span className="text-2xl font-black text-emerald-600">
                    £{Math.max(0, cashTendered - total).toFixed(2)}
                  </span>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    disabled={cashTendered < total || isSubmitting}
                    onClick={handleCashSubmit}
                    className="w-full py-3 rounded-2xl bg-amber-400 hover:bg-amber-500 text-stone-950 font-black text-xs shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-40 cursor-pointer"
                  >
                    <Banknote className="w-4 h-4" />
                    <span>Confirm Cash &amp; Open Drawer</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

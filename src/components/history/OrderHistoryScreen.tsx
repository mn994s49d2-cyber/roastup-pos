import React, { useState } from 'react';
import { 
  Search, 
  Receipt, 
  Printer, 
  RotateCcw, 
  Filter, 
  Calendar, 
  CreditCard, 
  Banknote, 
  CheckCircle2, 
  AlertCircle,
  Clock, 
  TrendingUp, 
  ShoppingBag,
  ArrowDownLeft,
  X,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { Order, OrderStatus, PrinterConfig, AppCustomizationSettings } from '../../types';
import { hardware } from '../../utils/hardware';

interface OrderHistoryScreenProps {
  orders: Order[];
  onUpdateOrderStatus?: (orderId: string, status: OrderStatus) => void;
  onRefundOrder?: (orderId: string, reason?: string) => void;
  printerConfig?: PrinterConfig;
  customization?: AppCustomizationSettings;
}

export const OrderHistoryScreen: React.FC<OrderHistoryScreenProps> = ({
  orders,
  onUpdateOrderStatus,
  onRefundOrder,
  printerConfig,
  customization
}) => {
  const activePrinterConfig = printerConfig || customization?.printer;
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'completed' | 'refunded' | 'preparing'>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showRefundModal, setShowRefundModal] = useState<boolean>(false);
  const [refundReason, setRefundReason] = useState<string>('Customer request / cancellation');
  const [printFeedback, setPrintFeedback] = useState<string | null>(null);

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const matchSearch = 
      order.orderNumber.toString().includes(searchQuery) ||
      (order.customerName && order.customerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (order.paymentRef && order.paymentRef.toLowerCase().includes(searchQuery.toLowerCase())) ||
      order.items.some(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()));

    let matchStatus = true;
    if (statusFilter === 'paid') {
      matchStatus = order.paymentStatus === 'paid';
    } else if (statusFilter === 'completed') {
      matchStatus = order.status === 'completed';
    } else if (statusFilter === 'refunded') {
      matchStatus = order.paymentStatus === 'refunded';
    } else if (statusFilter === 'preparing') {
      matchStatus = order.status === 'preparing' || order.status === 'pending';
    }

    return matchSearch && matchStatus;
  });

  // Calculate metrics
  const totalSales = orders
    .filter(o => o.paymentStatus === 'paid')
    .reduce((acc, o) => acc + o.total, 0);

  const totalRefunds = orders
    .filter(o => o.paymentStatus === 'refunded')
    .reduce((acc, o) => acc + o.total, 0);

  const orderCount = orders.length;
  const avgOrderValue = orderCount > 0 ? (totalSales / (orders.filter(o => o.paymentStatus === 'paid').length || 1)) : 0;

  const handlePrint = async (order: Order) => {
    setPrintFeedback('Sending receipt to printer...');
    const res = await hardware.printOrderReceipt(order, activePrinterConfig);
    setPrintFeedback(res.message);
    setTimeout(() => setPrintFeedback(null), 3500);
  };

  const handleConfirmRefund = () => {
    if (!selectedOrder) return;
    if (onRefundOrder) {
      onRefundOrder(selectedOrder.id, refundReason);
    }
    setShowRefundModal(false);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#FBFBFA] dark:bg-stone-950 text-stone-900 dark:text-stone-100 overflow-hidden font-sans">
      {/* Top Header */}
      <div className="px-6 py-4 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 flex flex-wrap items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-400 text-stone-950 flex items-center justify-center font-black shadow-xs">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-stone-900 dark:text-white">Order History &amp; Audit Log</h1>
            <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">Review past receipts, reprint tickets, and issue refunds</p>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by order #, item, or guest..."
              className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl pl-9 pr-4 py-2 text-xs text-stone-900 dark:text-white placeholder-stone-400 focus:outline-hidden focus:border-amber-400"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800 p-1 rounded-xl border border-stone-200 dark:border-stone-700 text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                statusFilter === 'all' ? 'bg-white dark:bg-stone-900 text-stone-950 dark:text-white shadow-2xs' : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                statusFilter === 'completed' ? 'bg-white dark:bg-stone-900 text-stone-950 dark:text-white shadow-2xs' : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              Completed
            </button>
            <button
              onClick={() => setStatusFilter('preparing')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                statusFilter === 'preparing' ? 'bg-white dark:bg-stone-900 text-stone-950 dark:text-white shadow-2xs' : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setStatusFilter('refunded')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                statusFilter === 'refunded' ? 'bg-white dark:bg-stone-900 text-rose-600 dark:text-rose-400 shadow-2xs' : 'text-stone-500 hover:text-rose-600'
              }`}
            >
              Refunded
            </button>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="px-6 py-4 grid grid-cols-2 lg:grid-cols-4 gap-4 bg-white dark:bg-stone-900/60 border-b border-stone-200 dark:border-stone-800">
        <div className="p-3.5 bg-stone-50 dark:bg-stone-800/60 rounded-2xl border border-stone-200/80 dark:border-stone-700 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-stone-400">Total Net Sales</p>
            <p className="text-xl font-black text-stone-900 dark:text-white mt-0.5">£{totalSales.toFixed(2)}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 flex items-center justify-center font-bold">
            £
          </div>
        </div>

        <div className="p-3.5 bg-stone-50 dark:bg-stone-800/60 rounded-2xl border border-stone-200/80 dark:border-stone-700 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-stone-400">Orders Processed</p>
            <p className="text-xl font-black text-stone-900 dark:text-white mt-0.5">{orderCount}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-900 dark:text-blue-300 flex items-center justify-center font-bold">
            <ShoppingBag className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3.5 bg-stone-50 dark:bg-stone-800/60 rounded-2xl border border-stone-200/80 dark:border-stone-700 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-stone-400">Average Basket</p>
            <p className="text-xl font-black text-stone-900 dark:text-white mt-0.5">£{avgOrderValue.toFixed(2)}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-300 flex items-center justify-center font-bold">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3.5 bg-stone-50 dark:bg-stone-800/60 rounded-2xl border border-stone-200/80 dark:border-stone-700 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-stone-400">Refunds Issued</p>
            <p className="text-xl font-black text-rose-600 dark:text-rose-400 mt-0.5">£{totalRefunds.toFixed(2)}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-900 dark:text-rose-300 flex items-center justify-center font-bold">
            <ArrowDownLeft className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Main Content Area: Table of Orders + Detail Drawer */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Orders Table */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredOrders.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 space-y-2 text-stone-400">
              <Receipt className="w-10 h-10 stroke-1" />
              <p className="font-bold text-sm">No orders matching your criteria</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-stone-100 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-800/50 text-[11px] font-extrabold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                    <th className="py-3.5 px-4">Order #</th>
                    <th className="py-3.5 px-4">Time &amp; Type</th>
                    <th className="py-3.5 px-4">Customer</th>
                    <th className="py-3.5 px-4">Items Summary</th>
                    <th className="py-3.5 px-4">Payment</th>
                    <th className="py-3.5 px-4 text-right">Total</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                  {filteredOrders.map(order => {
                    const isSelected = selectedOrder?.id === order.id;
                    const isRefunded = order.paymentStatus === 'refunded';

                    return (
                      <tr
                        key={order.id}
                        onClick={() => setSelectedOrder(order)}
                        className={`hover:bg-amber-50/40 dark:hover:bg-amber-950/20 transition-colors cursor-pointer ${
                          isSelected ? 'bg-amber-50/80 dark:bg-amber-950/40' : ''
                        }`}
                      >
                        <td className="py-3.5 px-4 font-black font-mono text-sm text-stone-900 dark:text-white">
                          #{order.orderNumber}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-stone-800 dark:text-stone-200">
                            {new Date(order.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <span className="text-[10px] text-stone-400 uppercase font-semibold">
                            {order.type === 'takeaway' ? 'Takeaway' : `Dine In ${order.tableNumber ? `(T${order.tableNumber})` : ''}`}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-stone-800 dark:text-stone-200">
                          {order.customerName || 'Walk-in Guest'}
                        </td>
                        <td className="py-3.5 px-4 max-w-xs truncate text-stone-600 dark:text-stone-400 font-medium">
                          {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 font-bold">
                            {order.paymentMethod === 'cash' ? (
                              <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <CreditCard className="w-3.5 h-3.5 text-amber-600" />
                            )}
                            <span className="capitalize">{order.cardBrand || order.paymentMethod || 'Card'}</span>
                          </div>
                          {order.cardLast4 && (
                            <span className="text-[10px] font-mono text-stone-400">****{order.cardLast4}</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right font-black font-mono text-sm text-stone-900 dark:text-white">
                          £{order.total.toFixed(2)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
                            isRefunded
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              : order.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : order.status === 'ready'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}>
                            {isRefunded ? 'Refunded' : order.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                            <button
                              onClick={() => handlePrint(order)}
                              title="Print thermal receipt"
                              className="p-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setSelectedOrder(order)}
                              className="p-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700"
                            >
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Selected Order Detail Sidebar / Receipt Preview */}
        {selectedOrder && (
          <div className="w-full lg:w-96 bg-white dark:bg-stone-900 border-l border-stone-200 dark:border-stone-800 flex flex-col justify-between overflow-y-auto p-6 shadow-md">
            <div>
              <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-4 mb-4">
                <div>
                  <span className="text-xs font-mono font-bold text-stone-400">TICKET DETAILS</span>
                  <h3 className="text-2xl font-black font-mono text-stone-900 dark:text-white">
                    #{selectedOrder.orderNumber}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {printFeedback && (
                <div className="mb-4 p-2.5 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 text-xs font-bold text-center">
                  {printFeedback}
                </div>
              )}

              {/* Order Meta */}
              <div className="p-3 bg-stone-50 dark:bg-stone-800/60 rounded-2xl border border-stone-200/80 dark:border-stone-700 space-y-2 text-xs mb-4">
                <div className="flex justify-between">
                  <span className="text-stone-400">Date &amp; Time:</span>
                  <span className="font-bold">{new Date(selectedOrder.timestamp).toLocaleString('en-GB')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Dining Type:</span>
                  <span className="font-bold uppercase">
                    {selectedOrder.type === 'takeaway' ? 'Takeaway' : `Dine In (Table ${selectedOrder.tableNumber || '-'})`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Customer:</span>
                  <span className="font-bold">{selectedOrder.customerName || 'Walk-in Guest'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Payment:</span>
                  <span className="font-bold capitalize">{selectedOrder.paymentMethod || 'Card'} ({selectedOrder.paymentStatus})</span>
                </div>
                {selectedOrder.paymentRef && (
                  <div className="flex justify-between text-[10px]">
                    <span className="text-stone-400">Ref / Tx ID:</span>
                    <span className="font-mono">{selectedOrder.paymentRef}</span>
                  </div>
                )}
                {selectedOrder.refundReason && (
                  <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-[11px] font-bold">
                    Refund Reason: {selectedOrder.refundReason}
                  </div>
                )}
              </div>

              {/* Itemized list */}
              <div className="space-y-3 mb-6">
                <span className="text-[10px] font-black uppercase tracking-wider text-stone-400">Ordered Items</span>
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="p-3 bg-stone-50 dark:bg-stone-800/40 rounded-xl border border-stone-200/80 dark:border-stone-700 text-xs">
                    <div className="flex justify-between font-extrabold text-stone-900 dark:text-white">
                      <span>{item.quantity}x {item.name}</span>
                      <span>£{item.totalPrice.toFixed(2)}</span>
                    </div>
                    <span className="text-[10px] text-stone-500 font-bold uppercase">{item.variation.name}</span>
                    {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                      <div className="mt-1 space-y-0.5 text-[11px] text-stone-500">
                        {item.selectedModifiers.map((m, mIdx) => (
                          <div key={mIdx}>+ {m.optionName} {m.priceDelta > 0 ? `(+£${m.priceDelta.toFixed(2)})` : ''}</div>
                        ))}
                      </div>
                    )}
                    {item.specialRemovals && item.specialRemovals.length > 0 && (
                      <div className="text-[10px] text-rose-600 font-bold mt-0.5">
                        NO: {item.specialRemovals.join(', ')}
                      </div>
                    )}
                    {item.specialAdditions && item.specialAdditions.length > 0 && (
                      <div className="text-[10px] text-emerald-600 font-bold mt-0.5">
                        EXTRA: {item.specialAdditions.join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Totals Breakdown */}
              <div className="border-t border-stone-100 dark:border-stone-800 pt-3 space-y-1.5 text-xs">
                <div className="flex justify-between text-stone-500">
                  <span>Subtotal (Excl. VAT):</span>
                  <span className="font-mono">£{selectedOrder.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-stone-500">
                  <span>VAT (20%):</span>
                  <span className="font-mono">£{selectedOrder.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base font-black text-stone-900 dark:text-white border-t border-stone-100 dark:border-stone-800 pt-2">
                  <span>TOTAL:</span>
                  <span className="font-mono">£{selectedOrder.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Actions: Print Receipt, Refund */}
            <div className="mt-6 pt-4 border-t border-stone-200 dark:border-stone-800 space-y-2">
              <button
                onClick={() => handlePrint(selectedOrder)}
                className="w-full py-3 px-4 rounded-2xl bg-stone-900 dark:bg-white text-white dark:text-stone-950 font-black text-xs flex items-center justify-center gap-2 hover:bg-stone-800 transition-all cursor-pointer shadow-xs"
              >
                <Printer className="w-4 h-4" />
                <span>Reprint Receipt Ticket</span>
              </button>

              {selectedOrder.paymentStatus !== 'refunded' && (
                <button
                  onClick={() => setShowRefundModal(true)}
                  className="w-full py-2.5 px-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 text-rose-700 dark:text-rose-300 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer border border-rose-200 dark:border-rose-800"
                >
                  <ArrowDownLeft className="w-4 h-4" />
                  <span>Issue Order Refund</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Refund Modal */}
      {showRefundModal && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-stone-900 dark:text-white">Issue Refund for #{selectedOrder.orderNumber}</h3>
                <p className="text-xs text-stone-500">Refund amount: £{selectedOrder.total.toFixed(2)}</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                Reason for Refund
              </label>
              <select
                value={refundReason}
                onChange={e => setRefundReason(e.target.value)}
                className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2 text-xs font-medium"
              >
                <option value="Customer request / cancellation">Customer request / cancellation</option>
                <option value="Incorrect dish prepared">Incorrect dish prepared</option>
                <option value="Item out of stock">Item out of stock</option>
                <option value="Payment terminal duplicate error">Payment terminal duplicate error</option>
                <option value="Manager discretion">Manager discretion</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowRefundModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRefund}
                className="px-4 py-2 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
              >
                Confirm £{selectedOrder.total.toFixed(2)} Refund
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

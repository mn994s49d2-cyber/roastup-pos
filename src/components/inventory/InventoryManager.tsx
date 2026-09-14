import React, { useState } from 'react';
import { 
  Boxes, 
  AlertTriangle, 
  Plus, 
  Check, 
  RotateCcw, 
  TrendingDown, 
  DollarSign, 
  Filter, 
  RefreshCw, 
  Sparkles,
  Search
} from 'lucide-react';
import { InventoryItem } from '../../types';

interface InventoryManagerProps {
  inventory: InventoryItem[];
  onRestock: (id: string, amount: number) => void;
  onToggleOut: (id: string, isOut: boolean) => void;
  onUpdateItem?: (id: string, currentStock: number) => void;
}

export const InventoryManager: React.FC<InventoryManagerProps> = ({
  inventory,
  onRestock,
  onToggleOut
}) => {
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [customRestockItem, setCustomRestockItem] = useState<InventoryItem | null>(null);
  const [customAmount, setCustomAmount] = useState<number>(10);

  const categories = ['all', 'Produce', 'Meat & Poultry', 'Dairy & Cheese', 'Sauces & Condiments', 'Bakery', 'Beverages', 'Packaging'];

  // Filtered list
  const filtered = inventory.filter(item => {
    const matchCat = categoryFilter === 'all' || item.category === categoryFilter;
    const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  // Calculate statistics
  const lowStockItems = inventory.filter(i => i.currentStock <= i.minThreshold && !i.isOut);
  const outOfStockItems = inventory.filter(i => i.isOut || i.currentStock === 0);
  const totalValuation = inventory.reduce((sum, i) => sum + (i.currentStock * i.costPerUnit), 0);

  const handleCustomRestockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customRestockItem && customAmount > 0) {
      onRestock(customRestockItem.id, customAmount);
      setCustomRestockItem(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#FBFBFA] text-stone-900 overflow-hidden select-none">
      {/* Header & KPI Metrics */}
      <div className="p-5 border-b border-stone-200 bg-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Boxes className="w-5 h-5 text-amber-500" />
              <h1 className="text-xl font-black text-stone-900 tracking-tight">Inventory &amp; Supplies Tracker</h1>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Live ingredient deductions per order placed with automated low-stock warnings
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3.5 py-1.5 rounded-2xl bg-stone-50 border border-stone-200 text-xs">
              <span className="text-stone-500">Total Stock Value:</span>
              <strong className="text-stone-900 font-mono ml-1.5 font-bold">£{totalValuation.toFixed(2)}</strong>
            </div>

            {lowStockItems.length > 0 && (
              <div className="px-3.5 py-1.5 rounded-2xl bg-amber-100 border border-amber-300/80 text-amber-950 text-xs font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>{lowStockItems.length} Low Stock Alert</span>
              </div>
            )}
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="mt-4 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search potato batches, chicken, sauces..."
              className="w-full bg-stone-50 border border-stone-200 rounded-2xl pl-9 pr-4 py-2 text-xs text-stone-900 placeholder-stone-400 focus:outline-hidden focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto scrollbar-none">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  categoryFilter === cat
                    ? 'bg-amber-400 text-stone-950 shadow-2xs'
                    : 'bg-stone-100 text-stone-600 hover:text-stone-950 hover:bg-stone-200/70'
                }`}
              >
                {cat === 'all' ? 'All Supplies' : cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Inventory Items Table */}
      <div className="flex-1 overflow-y-auto p-5">
        <div className="bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-500 uppercase tracking-wider text-[10px] font-extrabold border-b border-stone-200">
              <tr>
                <th className="py-3 px-4">Ingredient / Supply</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Current Stock</th>
                <th className="py-3 px-4">Min. Threshold</th>
                <th className="py-3 px-4">Cost / Unit</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Quick Restock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filtered.map(item => {
                const isLow = item.currentStock <= item.minThreshold && !item.isOut;
                const isOut = item.isOut || item.currentStock === 0;

                return (
                  <tr key={item.id} className="hover:bg-stone-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-extrabold text-stone-900 text-sm block">{item.name}</span>
                      {item.id === 'inv-potatoes' && (
                        <span className="text-[10px] text-amber-700 font-semibold">
                          ≈ {Math.floor(item.currentStock / 0.35)} loaded potato portions remaining
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 rounded-lg bg-stone-100 text-stone-600 text-[11px] font-semibold border border-stone-200/60">
                        {item.category}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-mono font-black text-sm">
                      <span className={isOut ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-stone-900'}>
                        {item.currentStock} {item.unit}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-stone-500 font-mono">
                      {item.minThreshold} {item.unit}
                    </td>

                    <td className="py-3 px-4 text-stone-600 font-mono">
                      £{item.costPerUnit.toFixed(2)} / {item.unit}
                    </td>

                    <td className="py-3 px-4">
                      {isOut ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-extrabold">
                          ● OUT OF STOCK (86)
                        </span>
                      ) : isLow ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-extrabold">
                          ● LOW STOCK
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                          ● Optimal
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onRestock(item.id, item.unit === 'kg' ? 5 : item.unit === 'units' ? 25 : 5)}
                          className="px-2.5 py-1 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-mono font-bold text-[11px] transition-colors cursor-pointer"
                          title="Quick add"
                        >
                          +{item.unit === 'kg' ? '5kg' : item.unit === 'units' ? '25' : '5L'}
                        </button>

                        <button
                          type="button"
                          onClick={() => onRestock(item.id, item.unit === 'kg' ? 20 : item.unit === 'units' ? 100 : 20)}
                          className="px-2.5 py-1 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-mono font-bold text-[11px] transition-colors cursor-pointer"
                          title="Restock batch"
                        >
                          +{item.unit === 'kg' ? '20kg' : item.unit === 'units' ? '100' : '20L'}
                        </button>

                        <button
                          type="button"
                          onClick={() => onToggleOut(item.id, !isOut)}
                          className={`px-2.5 py-1 rounded-xl text-[11px] font-black transition-colors cursor-pointer ${
                            isOut
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs'
                              : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {isOut ? 'Restore' : '86 / Out'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { 
  Sparkles, 
  Plus, 
  Trash2, 
  Edit3, 
  ArrowUp, 
  ArrowDown, 
  Image as ImageIcon, 
  Type, 
  Tv, 
  Layers, 
  Check, 
  Search, 
  RefreshCw, 
  Sliders, 
  Eye, 
  DollarSign, 
  Flame, 
  Leaf, 
  ChevronRight, 
  Undo2,
  Play,
  Pause,
  ArrowUpDown
} from 'lucide-react';
import { 
  MenuItem, 
  ScreenMode, 
  AppCustomizationSettings, 
  FontFamilyStyle, 
  FontSizeScale, 
  DigitalLayoutMode, 
  TickerSpeed 
} from '../../types';
import { ItemEditorModal } from './ItemEditorModal';
import { saveCustomizationLocally } from '../../data/customizationSettings';

interface MenuScreenStudioProps {
  menuItems: MenuItem[];
  categories: string[];
  customization: AppCustomizationSettings;
  onUpdateMenuItems: (items: MenuItem[]) => void;
  onUpdateCustomization: (settings: AppCustomizationSettings) => void;
  onNavigateScreen: (screen: ScreenMode) => void;
  onResetDefaults: () => void;
}

export const MenuScreenStudio: React.FC<MenuScreenStudioProps> = ({
  menuItems,
  categories,
  customization,
  onUpdateMenuItems,
  onUpdateCustomization,
  onNavigateScreen,
  onResetDefaults
}) => {
  // Studio navigation tabs
  const [activeTab, setActiveTab] = useState<'items' | 'categories' | 'fonts' | 'signage'>('items');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Item Editor modal
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [showItemModal, setShowItemModal] = useState<boolean>(false);

  // New Category input
  const [newCatName, setNewCatName] = useState<string>('');
  const [saveToast, setSaveToast] = useState<string | null>(null);

  const showFeedback = (msg: string) => {
    setSaveToast(msg);
    setTimeout(() => setSaveToast(null), 3000);
  };

  // --- ITEM ACTIONS ---
  const handleSaveItem = async (item: MenuItem) => {
    const exists = menuItems.some(i => i.id === item.id);
    let updated: MenuItem[];

    if (exists) {
      updated = menuItems.map(i => i.id === item.id ? item : i);
      try {
        await fetch(`/api/menu/item/${item.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item)
        });
      } catch {}
      showFeedback(`Saved "${item.name}"`);
    } else {
      updated = [...menuItems, item];
      try {
        await fetch('/api/menu/item', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item)
        });
      } catch {}
      showFeedback(`Added "${item.name}"`);
    }

    onUpdateMenuItems(updated);
  };

  const handleDeleteItem = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}" from the menu?`)) return;

    const updated = menuItems.filter(i => i.id !== id);
    onUpdateMenuItems(updated);

    try {
      await fetch(`/api/menu/item/${id}`, { method: 'DELETE' });
    } catch {}
    showFeedback(`Deleted "${name}"`);
  };

  const handleToggleStock = async (id: string, currentInStock: boolean) => {
    const updated = menuItems.map(i => i.id === id ? { ...i, inStock: !currentInStock } : i);
    onUpdateMenuItems(updated);

    try {
      await fetch('/api/menu/update-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, inStock: !currentInStock })
      });
    } catch {}
  };

  // Move item up or down in the list
  const handleMoveItem = async (index: number, direction: 'up' | 'down') => {
    const newItems = [...menuItems];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newItems.length) return;

    const temp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temp;

    onUpdateMenuItems(newItems);

    try {
      await fetch('/api/menu/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: newItems, categoryOrder: customization.categoryOrder })
      });
    } catch {}
  };

  // --- CATEGORY ACTIONS ---
  const handleAddCategory = () => {
    if (!newCatName.trim()) return;
    const trimmed = newCatName.trim();
    if (customization.categoryOrder.includes(trimmed)) {
      alert('Category already exists');
      return;
    }

    const updatedCategories = [...customization.categoryOrder, trimmed];
    const updatedSettings = { ...customization, categoryOrder: updatedCategories };
    onUpdateCustomization(updatedSettings);
    saveCustomizationLocally(updatedSettings);
    setNewCatName('');
    showFeedback(`Added category "${trimmed}"`);
  };

  const handleMoveCategory = async (index: number, direction: 'up' | 'down') => {
    const cats = [...customization.categoryOrder];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= cats.length) return;

    const temp = cats[index];
    cats[index] = cats[targetIdx];
    cats[targetIdx] = temp;

    const updatedSettings = { ...customization, categoryOrder: cats };
    onUpdateCustomization(updatedSettings);
    saveCustomizationLocally(updatedSettings);

    try {
      await fetch('/api/customization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSettings)
      });
    } catch {}
  };

  // --- TYPOGRAPHY ACTIONS ---
  const handleSelectFont = (font: FontFamilyStyle) => {
    const updated = { ...customization, fontFamily: font };
    onUpdateCustomization(updated);
    saveCustomizationLocally(updated);

    fetch('/api/customization', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    }).catch(() => {});

    showFeedback(`Font applied: ${font.toUpperCase()}`);
  };

  const handleSelectScale = (scale: FontSizeScale) => {
    const updated = { ...customization, fontSizeScale: scale };
    onUpdateCustomization(updated);
    saveCustomizationLocally(updated);

    fetch('/api/customization', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    }).catch(() => {});
  };

  // --- DIGITAL SIGNAGE ACTIONS ---
  const handleUpdateSignage = (partial: Partial<AppCustomizationSettings['digitalSignage']>) => {
    const updated: AppCustomizationSettings = {
      ...customization,
      digitalSignage: {
        ...customization.digitalSignage,
        ...partial
      }
    };
    onUpdateCustomization(updated);
    saveCustomizationLocally(updated);

    fetch('/api/customization', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    }).catch(() => {});
  };

  // Filtered items
  const filteredItems = menuItems.filter(item => {
    const matchCat = selectedCategoryFilter === 'all' || item.category === selectedCategoryFilter;
    const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="flex-1 flex flex-col bg-[#FBFBFA] text-stone-900 overflow-hidden">
      {/* Studio Header Bar */}
      <div className="px-6 py-3.5 bg-white border-b border-stone-200 flex flex-wrap items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-amber-400 text-stone-950 flex items-center justify-center font-black shadow-xs">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black tracking-tight text-stone-900">
                Menu &amp; Screen Customizer
              </h1>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300">
                Studio
              </span>
            </div>
            <p className="text-xs text-stone-500">
              Customize dishes, photos, fonts, category ordering, and digital TV signage
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2">
          {saveToast && (
            <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-300 animate-in fade-in">
              ✓ {saveToast}
            </span>
          )}

          <button
            onClick={() => {
              if (window.confirm('Reset all menu items, fonts, and screen settings to factory defaults?')) {
                onResetDefaults();
                showFeedback('Reset to defaults');
              }
            }}
            className="px-3 py-1.5 rounded-xl text-xs font-bold text-stone-600 hover:text-rose-600 hover:bg-stone-100 border border-stone-200 transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Reset to initial factory menu"
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset Defaults</span>
          </button>

          <button
            onClick={() => onNavigateScreen('signage_menu')}
            className="px-3 py-1.5 rounded-xl text-xs font-bold text-stone-800 bg-stone-100 hover:bg-stone-200 border border-stone-200 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Tv className="w-3.5 h-3.5 text-stone-700" />
            <span>Preview TV</span>
          </button>

          <button
            onClick={() => onNavigateScreen('pos')}
            className="px-3.5 py-1.5 rounded-xl text-xs font-black text-stone-950 bg-amber-400 hover:bg-amber-500 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Open POS</span>
          </button>
        </div>
      </div>

      {/* Main Studio Navigation Tabs */}
      <div className="px-6 bg-white border-b border-stone-200 flex items-center gap-2 overflow-x-auto scrollbar-none">
        {[
          { id: 'items', label: 'Menu Items & Photos', icon: ImageIcon, count: menuItems.length },
          { id: 'categories', label: 'Category Rearranging', icon: ArrowUpDown, count: customization.categoryOrder.length },
          { id: 'fonts', label: 'Typography & Fonts', icon: Type },
          { id: 'signage', label: 'Digital Menu TV Settings', icon: Tv }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 py-3 px-4 text-xs font-black border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                isActive 
                  ? 'border-amber-500 text-stone-950 font-extrabold' 
                  : 'border-transparent text-stone-500 hover:text-stone-900 hover:border-stone-300'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-amber-600' : 'text-stone-400'}`} />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${isActive ? 'bg-amber-100 text-amber-950' : 'bg-stone-100 text-stone-600'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content Body */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* TAB 1: MENU ITEMS & PHOTOS */}
        {activeTab === 'items' && (
          <div className="space-y-4 max-w-6xl mx-auto">
            {/* Filter and Search Toolbar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-stone-200 shadow-2xs">
              <div className="flex items-center gap-2 flex-1">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search menu items..."
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-stone-50 border border-stone-200 text-xs font-medium text-stone-900 placeholder-stone-400 focus:outline-hidden focus:border-amber-400"
                  />
                </div>

                {/* Category Filter */}
                <select
                  value={selectedCategoryFilter}
                  onChange={e => setSelectedCategoryFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-stone-50 border border-stone-200 text-xs font-bold text-stone-800 focus:outline-hidden"
                >
                  <option value="all">All Categories ({menuItems.length})</option>
                  {customization.categoryOrder.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => {
                  setEditingItem(null);
                  setShowItemModal(true);
                }}
                className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-stone-950 text-xs font-black transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Menu Item</span>
              </button>
            </div>

            {/* Menu Items Table / Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredItems.map((item, idx) => {
                const globalIndex = menuItems.findIndex(i => i.id === item.id);
                return (
                  <div
                    key={item.id}
                    className={`bg-white rounded-2xl border p-4 transition-all shadow-2xs hover:shadow-xs flex flex-col justify-between gap-3 ${
                      !item.inStock ? 'opacity-60 border-stone-200 bg-stone-50/50' : 'border-stone-200'
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      {/* Item Photo / Thumbnail */}
                      <div className="w-20 h-20 rounded-2xl border border-stone-200 bg-stone-100 overflow-hidden shrink-0 flex items-center justify-center relative">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // Fallback on broken image
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="text-center p-1 text-stone-400">
                            <span className="text-xl block">🥔</span>
                            <span className="text-[9px] font-bold">No Photo</span>
                          </div>
                        )}

                        {item.imageUrl && (
                          <span className="absolute bottom-1 right-1 p-0.5 rounded-full bg-emerald-500 text-white shadow-xs">
                            <Check className="w-2.5 h-2.5" />
                          </span>
                        )}
                      </div>

                      {/* Item Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded-md border border-amber-200/60">
                              {item.category}
                            </span>
                            <h3 className="font-extrabold text-sm text-stone-900 mt-1 truncate">
                              {item.name}
                            </h3>
                          </div>
                          <span className="text-xs font-black font-mono bg-stone-100 text-stone-900 px-2 py-1 rounded-lg shrink-0">
                            £{item.defaultPrice.toFixed(2)}
                          </span>
                        </div>

                        <p className="text-xs text-stone-500 mt-1 line-clamp-2 leading-relaxed">
                          {item.description || 'No description provided.'}
                        </p>

                        {/* Badges */}
                        <div className="flex flex-wrap gap-1 mt-2">
                          {item.tags?.map(t => (
                            <span key={t} className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-stone-100 text-stone-600 border border-stone-200">
                              {t === 'signature' ? '★ Signature' : t === 'spicy' ? '🌶️ Spicy' : t === 'vegetarian' ? '🌱 Veg' : t}
                            </span>
                          ))}
                          {!item.inStock && (
                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-rose-100 text-rose-800 border border-rose-300">
                              SOLD OUT (86)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Bar: Reorder buttons, Edit, Stock, Delete */}
                    <div className="pt-2.5 border-t border-stone-100 flex items-center justify-between gap-2 text-xs">
                      {/* Rearranging sequence controls */}
                      <div className="flex items-center gap-1 bg-stone-100 p-0.5 rounded-xl">
                        <button
                          type="button"
                          onClick={() => handleMoveItem(globalIndex, 'up')}
                          disabled={globalIndex === 0}
                          className="p-1.5 rounded-lg text-stone-600 hover:text-stone-950 hover:bg-white disabled:opacity-30 transition-colors"
                          title="Move Dish Up in Menu"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-[10px] font-mono font-bold px-1 text-stone-400">
                          #{globalIndex + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleMoveItem(globalIndex, 'down')}
                          disabled={globalIndex === menuItems.length - 1}
                          className="p-1.5 rounded-lg text-stone-600 hover:text-stone-950 hover:bg-white disabled:opacity-30 transition-colors"
                          title="Move Dish Down in Menu"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Edit, In-Stock, Delete buttons */}
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleToggleStock(item.id, item.inStock)}
                          className={`px-2 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                            item.inStock 
                              ? 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100' 
                              : 'text-rose-700 bg-rose-50 border-rose-200 hover:bg-rose-100'
                          }`}
                        >
                          {item.inStock ? 'In Stock' : '86 Out'}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setEditingItem(item);
                            setShowItemModal(true);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-amber-100 hover:text-amber-950 text-stone-700 font-bold border border-stone-200 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item.id, item.name)}
                          className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                          title="Delete Item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: CATEGORY REARRANGING & MANAGEMENT */}
        {activeTab === 'categories' && (
          <div className="max-w-2xl mx-auto space-y-5">
            <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-base text-stone-900">
                    Category Display Sequence
                  </h3>
                  <p className="text-xs text-stone-500">
                    Change the order in which categories appear on the POS register and the Digital Signage TV board
                  </p>
                </div>
              </div>

              {/* Add category input */}
              <div className="flex gap-2 pt-2">
                <input
                  type="text"
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  placeholder="Enter new category name (e.g. Desserts)..."
                  className="flex-1 px-3.5 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-bold text-stone-900 placeholder-stone-400 focus:outline-hidden focus:border-amber-400"
                />
                <button
                  onClick={handleAddCategory}
                  className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-stone-950 text-xs font-black transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Category</span>
                </button>
              </div>

              {/* Category List */}
              <div className="space-y-2 pt-2">
                {customization.categoryOrder.map((cat, idx) => {
                  const itemsCount = menuItems.filter(i => i.category === cat).length;
                  return (
                    <div
                      key={cat}
                      className="flex items-center justify-between p-3.5 rounded-2xl bg-stone-50 border border-stone-200 hover:border-amber-300 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-xl bg-white border border-stone-200 text-stone-600 flex items-center justify-center font-mono font-bold text-xs">
                          {idx + 1}
                        </span>
                        <div>
                          <span className="font-extrabold text-sm text-stone-900">{cat}</span>
                          <span className="text-xs text-stone-400 ml-2">({itemsCount} dishes)</span>
                        </div>
                      </div>

                      {/* Move controls */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleMoveCategory(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1.5 rounded-xl bg-white hover:bg-stone-100 border border-stone-200 text-stone-700 disabled:opacity-30 transition-colors"
                          title="Move Category Up"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveCategory(idx, 'down')}
                          disabled={idx === customization.categoryOrder.length - 1}
                          className="p-1.5 rounded-xl bg-white hover:bg-stone-100 border border-stone-200 text-stone-700 disabled:opacity-30 transition-colors"
                          title="Move Category Down"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: TYPOGRAPHY & FONTS */}
        {activeTab === 'fonts' && (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Font family selection */}
            <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-2xs space-y-4">
              <div>
                <h3 className="font-extrabold text-base text-stone-900">
                  Global Typography Archetype
                </h3>
                <p className="text-xs text-stone-500">
                  Select a font style tailored for restaurant menus, digital TV boards, and street-food kiosks
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {[
                  {
                    id: 'sans',
                    name: 'Modern Clean Sans',
                    previewClass: 'font-style-sans',
                    tagline: 'High legibility • Contemporary fast-casual',
                    sampleHeading: 'The OG Loaded Roasties'
                  },
                  {
                    id: 'street',
                    name: 'Bold Street Food',
                    previewClass: 'font-style-street',
                    tagline: 'Punchy • Big signage headers • Street vibe',
                    sampleHeading: 'ROASTUP CRISPY POTATOES'
                  },
                  {
                    id: 'rounded',
                    name: 'Friendly Rounded',
                    previewClass: 'font-style-rounded',
                    tagline: 'Warm • Approachable • Cafe feeling',
                    sampleHeading: 'Delicious Loaded Roasties'
                  },
                  {
                    id: 'serif',
                    name: 'Artisanal Gastro',
                    previewClass: 'font-style-serif',
                    tagline: 'Heritage British roast • Refined pub',
                    sampleHeading: 'Slow-Cooked Roast Dinner'
                  },
                  {
                    id: 'diner',
                    name: 'Retro Diner',
                    previewClass: 'font-style-diner',
                    tagline: 'Bold vintage diner • Eye-catching',
                    sampleHeading: 'TRIPLE-COOKED ROASTIES'
                  },
                  {
                    id: 'mono',
                    name: 'Technical Clean Mono',
                    previewClass: 'font-style-mono',
                    tagline: 'Industrial • High-tech precision',
                    sampleHeading: 'ORDER // ROAST.001'
                  }
                ].map(f => {
                  const isSelected = customization.fontFamily === f.id;
                  return (
                    <div
                      key={f.id}
                      onClick={() => handleSelectFont(f.id as FontFamilyStyle)}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected 
                          ? 'border-amber-400 bg-amber-50/40 shadow-xs' 
                          : 'border-stone-200 bg-stone-50/50 hover:border-stone-300'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-extrabold text-xs text-stone-900">{f.name}</span>
                          {isSelected && (
                            <span className="w-5 h-5 rounded-full bg-amber-400 text-stone-950 flex items-center justify-center text-xs font-black">
                              ✓
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-stone-500 mb-3">{f.tagline}</p>
                      </div>

                      {/* Live typography preview snippet */}
                      <div className={`p-3 rounded-xl bg-white border border-stone-200 ${f.previewClass}`}>
                        <p className="font-black text-sm text-stone-900 tracking-tight">
                          {f.sampleHeading}
                        </p>
                        <p className="text-[11px] text-stone-500 mt-1">
                          Maris Piper roasties, melted cheddar &amp; gravy
                        </p>
                        <span className="font-black text-xs text-amber-800 font-mono mt-1 block">
                          £6.50
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Font Sizing Scale */}
            <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-2xs space-y-3">
              <h3 className="font-extrabold text-sm text-stone-900">
                Display Text Sizing Scale
              </h3>
              <p className="text-xs text-stone-500">
                Scale all typography up for large TV monitors or down for compact tablet registers
              </p>

              <div className="flex flex-wrap gap-2 pt-1">
                {[
                  { id: 'compact', label: 'Compact (92%)', desc: 'Dense tablets' },
                  { id: 'normal', label: 'Standard (100%)', desc: 'Default layout' },
                  { id: 'large', label: 'Large (108%)', desc: 'Easier reading' },
                  { id: 'xl', label: 'Extra Large (116%)', desc: 'Big TV screens' }
                ].map(s => {
                  const isSelected = customization.fontSizeScale === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => handleSelectScale(s.id as FontSizeScale)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        isSelected 
                          ? 'bg-amber-400 text-stone-950 border-amber-500 shadow-xs' 
                          : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      <span className="block font-black">{s.label}</span>
                      <span className="text-[10px] text-stone-500 font-normal">{s.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: DIGITAL MENU TV SCREEN SETTINGS */}
        {activeTab === 'signage' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-2xs space-y-6">
              <div>
                <h3 className="font-extrabold text-base text-stone-900">
                  Digital Signage TV Customization
                </h3>
                <p className="text-xs text-stone-500">
                  Configure the layout, photo display, cycle interval, and promotional ticker for overhead TV boards
                </p>
              </div>

              {/* 1. Layout Mode */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-stone-700 mb-2">
                  Display Grid Layout
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'grid-2col', name: '2-Column Photo Cards', desc: 'Prominent photos with full details' },
                    { id: 'grid-3col', name: '3-Column High-Density', desc: 'Shows maximum dishes on one screen' },
                    { id: 'spotlight', name: 'Showcase Spotlight', desc: 'Hero dish feature banner + dishes' }
                  ].map(mode => {
                    const isSelected = customization.digitalSignage.layoutMode === mode.id;
                    return (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => handleUpdateSignage({ layoutMode: mode.id as DigitalLayoutMode })}
                        className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                          isSelected 
                            ? 'border-amber-400 bg-amber-50/40 shadow-xs' 
                            : 'border-stone-200 bg-stone-50 hover:bg-stone-100'
                        }`}
                      >
                        <span className="block font-extrabold text-xs text-stone-900">{mode.name}</span>
                        <span className="text-[11px] text-stone-500 mt-1 block">{mode.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Visual Content Toggles */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-stone-700 mb-2">
                  Card Visual Elements
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { key: 'showImages', label: 'Show Dish Photos', val: customization.digitalSignage.showImages },
                    { key: 'showDescriptions', label: 'Show Descriptions', val: customization.digitalSignage.showDescriptions },
                    { key: 'showVariations', label: 'Show Portion Prices', val: customization.digitalSignage.showVariations },
                    { key: 'showDietaryBadges', label: 'Show Dietary Tags', val: customization.digitalSignage.showDietaryBadges }
                  ].map(toggle => (
                    <button
                      key={toggle.key}
                      type="button"
                      onClick={() => handleUpdateSignage({ [toggle.key]: !toggle.val })}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                        toggle.val 
                          ? 'bg-amber-100/70 border-amber-300 text-amber-950 font-black' 
                          : 'bg-stone-50 border-stone-200 text-stone-400'
                      }`}
                    >
                      <span className="text-xs block">{toggle.val ? '✓ Active' : '✕ Hidden'}</span>
                      <span className="text-[11px] font-bold block mt-0.5">{toggle.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Promotional Marquee Ticker */}
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-black uppercase tracking-wider text-stone-900">
                    Scrolling Promotional Bottom Ticker
                  </label>
                  <div className="flex items-center gap-1 text-xs">
                    <span className="text-stone-500 text-[11px]">Speed:</span>
                    {(['slow', 'normal', 'fast', 'off'] as TickerSpeed[]).map(spd => (
                      <button
                        key={spd}
                        type="button"
                        onClick={() => handleUpdateSignage({ tickerSpeed: spd })}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase transition-colors cursor-pointer ${
                          customization.digitalSignage.tickerSpeed === spd 
                            ? 'bg-amber-400 text-stone-950 font-black' 
                            : 'bg-white text-stone-600 hover:bg-stone-200'
                        }`}
                      >
                        {spd}
                      </button>
                    ))}
                  </div>
                </div>

                <textarea
                  rows={2}
                  value={customization.digitalSignage.tickerText}
                  onChange={e => handleUpdateSignage({ tickerText: e.target.value })}
                  placeholder="Enter scrolling ticker text (separated with •)..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 text-xs font-medium text-stone-900 focus:outline-hidden focus:border-amber-400 leading-relaxed"
                />

                {/* Live ticker preview */}
                <div className="overflow-hidden py-1.5 px-3 bg-amber-400 text-stone-950 text-[11px] font-black uppercase tracking-wider rounded-xl">
                  <div className="truncate">
                    {customization.digitalSignage.tickerText || 'No ticker text'}
                  </div>
                </div>
              </div>

              {/* 4. Featured Spotlight Dish & Value Meal Deal Callout */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
                  <label className="block text-xs font-black uppercase tracking-wider text-stone-900">
                    Spotlight Highlight Dish
                  </label>
                  <select
                    value={customization.digitalSignage.featuredItemId}
                    onChange={e => handleUpdateSignage({ featuredItemId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-xs font-bold text-stone-900 focus:outline-hidden"
                  >
                    {menuItems.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.name} ({item.category})
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-stone-500">
                    This dish will be featured prominently in the sidebar hero box on the TV
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
                  <label className="block text-xs font-black uppercase tracking-wider text-stone-900">
                    Meal Deal Banner Box
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customization.digitalSignage.mealDealTitle}
                      onChange={e => handleUpdateSignage({ mealDealTitle: e.target.value })}
                      placeholder="Deal Title (e.g. Solo Roast)"
                      className="flex-1 px-3 py-1.5 rounded-xl bg-white border border-stone-200 text-xs font-bold text-stone-900"
                    />
                    <input
                      type="text"
                      value={customization.digitalSignage.mealDealPrice}
                      onChange={e => handleUpdateSignage({ mealDealPrice: e.target.value })}
                      placeholder="FROM £7.00"
                      className="w-28 px-3 py-1.5 rounded-xl bg-white border border-stone-200 text-xs font-mono font-bold text-stone-900"
                    />
                  </div>
                  <input
                    type="text"
                    value={customization.digitalSignage.mealDealDesc}
                    onChange={e => handleUpdateSignage({ mealDealDesc: e.target.value })}
                    placeholder="Short description..."
                    className="w-full px-3 py-1.5 rounded-xl bg-white border border-stone-200 text-xs text-stone-800"
                  />
                </div>
              </div>

              {/* 5. Category Auto-Cycle Duration */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-stone-50 border border-stone-200">
                <div>
                  <span className="block text-xs font-black uppercase tracking-wider text-stone-900">
                    TV Category Auto-Cycle Interval
                  </span>
                  <span className="text-[11px] text-stone-500">
                    Automatically rotates through menu categories on the TV screen
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {[6, 10, 15, 20].map(sec => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => handleUpdateSignage({ cycleInterval: sec })}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                        customization.digitalSignage.cycleInterval === sec 
                          ? 'bg-amber-400 text-stone-950 font-black shadow-2xs' 
                          : 'bg-white text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      {sec}s
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Item Add/Edit Modal */}
      <ItemEditorModal
        isOpen={showItemModal}
        item={editingItem}
        categories={customization.categoryOrder}
        onSave={handleSaveItem}
        onClose={() => setShowItemModal(false)}
      />
    </div>
  );
};

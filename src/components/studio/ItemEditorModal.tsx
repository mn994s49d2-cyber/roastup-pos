import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  Image as ImageIcon, 
  Plus, 
  Trash2, 
  Sparkles, 
  Check, 
  Flame, 
  Leaf, 
  Tag, 
  Link as LinkIcon, 
  Layers
} from 'lucide-react';
import { MenuItem, MenuVariation } from '../../types';
import { PRESET_FOOD_IMAGES, PresetImageOption } from '../../data/presetImages';

interface ItemEditorModalProps {
  isOpen: boolean;
  item: MenuItem | null; // null means create new item
  categories: string[];
  onSave: (item: MenuItem) => void;
  onClose: () => void;
}

export const ItemEditorModal: React.FC<ItemEditorModalProps> = ({
  isOpen,
  item,
  categories,
  onSave,
  onClose
}) => {
  if (!isOpen) return null;

  const isEditing = !!item;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState<string>(item?.name || '');
  const [category, setCategory] = useState<string>(item?.category || categories[0] || 'Loaded Roast Potatoes');
  const [customCategory, setCustomCategory] = useState<string>('');
  const [isAddingCustomCategory, setIsAddingCustomCategory] = useState<boolean>(false);
  const [description, setDescription] = useState<string>(item?.description || '');
  const [defaultPrice, setDefaultPrice] = useState<number>(item?.defaultPrice || 6.50);
  const [imageUrl, setImageUrl] = useState<string>(item?.imageUrl || '');
  const [inStock, setInStock] = useState<boolean>(item?.inStock ?? true);
  
  // Tags
  const [tags, setTags] = useState<string[]>(item?.tags || ['popular']);

  // Variations
  const [variations, setVariations] = useState<MenuVariation[]>(
    item?.variations && item.variations.length > 0 
      ? item.variations 
      : [
          { id: 'v-s', name: 'Small', sku: 'ROAST-S', price: 5.50 },
          { id: 'v-m', name: 'Medium', sku: 'ROAST-M', price: 6.50 },
          { id: 'v-l', name: 'Large', sku: 'ROAST-L', price: 7.50 }
        ]
  );

  // Active picture picker tab: 'upload' | 'url' | 'presets'
  const [imageTab, setImageTab] = useState<'presets' | 'upload' | 'url'>('presets');
  const [showPresetPicker, setShowPresetPicker] = useState<boolean>(false);

  // File upload handler -> Base64
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, WebP)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setImageUrl(result);
    };
    reader.readAsDataURL(file);
  };

  const handleToggleTag = (tag: string) => {
    if (tags.includes(tag)) {
      setTags(tags.filter(t => t !== tag));
    } else {
      setTags([...tags, tag]);
    }
  };

  const handleUpdateVariationPrice = (id: string, price: number) => {
    setVariations(prev => prev.map(v => v.id === id ? { ...v, price: Math.max(0, price) } : v));
  };

  const handleAddVariation = () => {
    const newId = `v-${Date.now()}`;
    setVariations(prev => [
      ...prev,
      { id: newId, name: 'Standard', sku: `ROAST-${Date.now().toString().slice(-4)}`, price: defaultPrice }
    ]);
  };

  const handleRemoveVariation = (id: string) => {
    if (variations.length <= 1) {
      alert('Must have at least one portion variation/price');
      return;
    }
    setVariations(prev => prev.filter(v => v.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Item name is required');
      return;
    }

    const resolvedCategory = isAddingCustomCategory && customCategory.trim() 
      ? customCategory.trim() 
      : category;

    const finalItem: MenuItem = {
      id: item?.id || `item-${Date.now()}`,
      name: name.trim(),
      category: resolvedCategory,
      description: description.trim(),
      itemType: item?.itemType || 'Prepared food and beverage',
      defaultPrice: Number(defaultPrice) || (variations[0]?.price ?? 6.50),
      variations: variations.map(v => ({ ...v, price: Number(v.price) || 0 })),
      tags,
      inStock,
      imageUrl: imageUrl.trim(),
      sortOrder: item?.sortOrder ?? Date.now()
    };

    onSave(finalItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-stone-200 bg-stone-50/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-stone-950 flex items-center justify-center font-black shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-stone-900 tracking-tight">
                {isEditing ? `Edit Dish: ${item.name}` : 'Add New Menu Item'}
              </h2>
              <p className="text-xs text-stone-500">
                Customize dish details, photo, prices, portion sizes, and badges
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-900 hover:bg-stone-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 1. Name & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-stone-700 mb-1.5">
                Item Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. The Truffle &amp; Parmesan Roasties"
                className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-sm font-bold text-stone-900 placeholder-stone-400 focus:outline-hidden focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-black uppercase tracking-wider text-stone-700">
                  Category *
                </label>
                <button
                  type="button"
                  onClick={() => setIsAddingCustomCategory(!isAddingCustomCategory)}
                  className="text-[11px] text-amber-700 hover:text-amber-800 font-bold"
                >
                  {isAddingCustomCategory ? 'Choose Existing' : '+ New Category'}
                </button>
              </div>

              {isAddingCustomCategory ? (
                <input
                  type="text"
                  required
                  value={customCategory}
                  onChange={e => setCustomCategory(e.target.value)}
                  placeholder="Enter new category name..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-amber-300 text-sm font-bold text-stone-900 placeholder-stone-400 focus:outline-hidden focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                />
              ) : (
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-sm font-bold text-stone-900 focus:outline-hidden focus:border-amber-400"
                >
                  {categories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* 2. Description */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-stone-700 mb-1.5">
              Description &amp; Ingredients
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Crispy Maris Piper roasties loaded with rich melted cheddar, savoury gravy and crispy golden onions..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-800 placeholder-stone-400 focus:outline-hidden focus:border-amber-400 focus:ring-1 focus:ring-amber-400 leading-relaxed"
            />
          </div>

          {/* 3. Dish Picture / Photo Selector */}
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-black uppercase tracking-wider text-stone-900 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-amber-500" />
                Dish Picture / Photo (Shown on TV Signage &amp; Register)
              </label>
              {imageUrl && (
                <button
                  type="button"
                  onClick={() => setImageUrl('')}
                  className="text-[11px] text-rose-600 font-bold hover:underline"
                >
                  Remove Picture
                </button>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-start gap-4">
              {/* Picture Thumbnail Preview */}
              <div className="w-28 h-28 rounded-2xl border-2 border-stone-200 bg-white overflow-hidden shrink-0 flex items-center justify-center relative shadow-xs">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={name || 'Dish preview'}
                    className="w-full h-full object-cover"
                    onError={() => setImageUrl('')}
                  />
                ) : (
                  <div className="text-center p-2 text-stone-400">
                    <span className="text-2xl block mb-1">🥔</span>
                    <span className="text-[10px] font-bold">No Photo</span>
                  </div>
                )}
              </div>

              {/* Photo Input Methods */}
              <div className="flex-1 space-y-2.5 w-full">
                <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-stone-200 text-xs">
                  <button
                    type="button"
                    onClick={() => setImageTab('presets')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                      imageTab === 'presets' ? 'bg-amber-400 text-stone-950 shadow-xs' : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    Preset Photos
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageTab('upload')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                      imageTab === 'upload' ? 'bg-amber-400 text-stone-950 shadow-xs' : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    Upload File
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageTab('url')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                      imageTab === 'url' ? 'bg-amber-400 text-stone-950 shadow-xs' : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    Web URL
                  </button>
                </div>

                {/* Preset Picker */}
                {imageTab === 'presets' && (
                  <div>
                    <p className="text-[11px] text-stone-500 mb-2">
                      Select from curated roast potato dishes, roti wraps, and sauces:
                    </p>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-36 overflow-y-auto p-1 bg-white rounded-xl border border-stone-200">
                      {PRESET_FOOD_IMAGES.map(img => (
                        <button
                          key={img.id}
                          type="button"
                          onClick={() => setImageUrl(img.url)}
                          className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                            imageUrl === img.url ? 'border-amber-500 ring-2 ring-amber-400' : 'border-transparent hover:border-stone-300'
                          }`}
                          title={img.name}
                        >
                          <img src={img.thumb} alt={img.name} className="w-full h-full object-cover" />
                          {imageUrl === img.url && (
                            <div className="absolute inset-0 bg-amber-400/30 flex items-center justify-center">
                              <Check className="w-4 h-4 text-stone-950 font-black" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Upload File */}
                {imageTab === 'upload' && (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="p-4 border-2 border-dashed border-stone-300 hover:border-amber-400 bg-white rounded-xl text-center cursor-pointer transition-colors"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Upload className="w-5 h-5 mx-auto text-stone-400 mb-1" />
                    <span className="text-xs font-bold text-stone-800 block">Click to upload photo</span>
                    <span className="text-[10px] text-stone-400">PNG, JPG or WebP from your device</span>
                  </div>
                )}

                {/* URL Input */}
                {imageTab === 'url' && (
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={e => setImageUrl(e.target.value)}
                      placeholder="https://example.com/roast-potatoes.jpg"
                      className="flex-1 px-3 py-2 rounded-xl bg-white border border-stone-200 text-xs font-mono text-stone-900 placeholder-stone-400 focus:outline-hidden focus:border-amber-400"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 4. Portion Sizes & Pricing */}
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-stone-900">
                  Portion Sizes &amp; Pricing
                </label>
                <p className="text-[11px] text-stone-500">
                  Set prices for each portion size (Small, Medium, Large)
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddVariation}
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-stone-100 text-stone-700 text-xs font-bold border border-stone-200 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Portion
              </button>
            </div>

            <div className="space-y-2">
              {variations.map((v, idx) => (
                <div key={v.id} className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-stone-200">
                  <span className="w-6 text-center text-xs font-bold text-stone-400">{idx + 1}</span>
                  <input
                    type="text"
                    value={v.name}
                    onChange={e => {
                      const val = e.target.value as any;
                      setVariations(prev => prev.map(item => item.id === v.id ? { ...item, name: val } : item));
                    }}
                    placeholder="Portion name (e.g. Medium)"
                    className="flex-1 px-2.5 py-1.5 rounded-lg bg-stone-50 border border-stone-200 text-xs font-bold text-stone-900"
                  />
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-stone-500">£</span>
                    <input
                      type="number"
                      step="0.10"
                      min="0"
                      value={v.price}
                      onChange={e => handleUpdateVariationPrice(v.id, parseFloat(e.target.value) || 0)}
                      className="w-20 px-2.5 py-1.5 rounded-lg bg-stone-50 border border-stone-200 text-xs font-mono font-bold text-stone-900"
                    />
                  </div>
                  {variations.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveVariation(v.id)}
                      className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 5. Dietary & Signature Badges & Stock Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-stone-700 mb-2">
                Badges &amp; Dietary Tags
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'signature', label: '★ Signature', color: 'bg-amber-100 text-amber-900 border-amber-300' },
                  { id: 'popular', label: '🔥 Popular', color: 'bg-orange-100 text-orange-900 border-orange-300' },
                  { id: 'spicy', label: '🌶️ Spicy', color: 'bg-rose-100 text-rose-900 border-rose-300' },
                  { id: 'vegetarian', label: '🌱 Vegetarian', color: 'bg-emerald-100 text-emerald-900 border-emerald-300' },
                  { id: 'gluten_free_option', label: '🌾 Gluten-Friendly', color: 'bg-sky-100 text-sky-900 border-sky-300' }
                ].map(b => {
                  const isSelected = tags.includes(b.id);
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => handleToggleTag(b.id)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        isSelected 
                          ? `${b.color} ring-1 ring-stone-900/10 shadow-2xs` 
                          : 'bg-white text-stone-500 border-stone-200 hover:bg-stone-50'
                      }`}
                    >
                      {b.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-stone-700 mb-2">
                Availability Status
              </label>
              <div className="flex items-center gap-3 bg-stone-50 p-3 rounded-2xl border border-stone-200">
                <button
                  type="button"
                  onClick={() => setInStock(!inStock)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    inStock 
                      ? 'bg-emerald-600 text-white shadow-2xs' 
                      : 'bg-rose-100 text-rose-800 border border-rose-300'
                  }`}
                >
                  {inStock ? '● In Stock (Active)' : '● 86 / Sold Out'}
                </button>
                <span className="text-xs text-stone-500">
                  {inStock ? 'Visible and orderable on all screens' : 'Marked as Sold Out on TV and register'}
                </span>
              </div>
            </div>
          </div>
        </form>

        {/* Footer actions */}
        <div className="p-4 border-t border-stone-200 bg-stone-50/70 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:text-stone-900 hover:bg-stone-200/60 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-stone-950 text-xs font-black transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>{isEditing ? 'Save Changes' : 'Add Item to Menu'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

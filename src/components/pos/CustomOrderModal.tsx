import React, { useState } from 'react';
import { X, Plus, Minus, Check, AlertCircle } from 'lucide-react';
import { MenuItem, MenuVariation, SelectedModifier, CartItem, ModifierOption } from '../../types';

interface CustomOrderModalProps {
  item: MenuItem;
  onClose: () => void;
  onAddToCart: (item: CartItem) => void;
}

export const CustomOrderModal: React.FC<CustomOrderModalProps> = ({
  item,
  onClose,
  onAddToCart
}) => {
  // Default to Medium if available, else first variation
  const initialVariation = item.variations.find(v => v.name === 'Medium') || item.variations[0];
  const [selectedVariation, setSelectedVariation] = useState<MenuVariation>(initialVariation);
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedModifiers, setSelectedModifiers] = useState<SelectedModifier[]>([]);
  const [specialRemovals, setSpecialRemovals] = useState<string[]>([]);
  const [specialAdditions, setSpecialAdditions] = useState<string[]>([]);
  const [customNotes, setCustomNotes] = useState<string>('');

  // Extract quick removal options for standard signature recipes
  const commonRemovals = React.useMemo(() => {
    const list: string[] = [];
    const desc = (item.description || '').toLowerCase();
    if (desc.includes('bacon')) list.push('No Bacon');
    if (desc.includes('onion') || desc.includes('spring onion')) list.push('No Spring Onions');
    if (desc.includes('crispy onion')) list.push('No Crispy Onions');
    if (desc.includes('cheddar') || desc.includes('cheese')) list.push('No Cheese');
    if (desc.includes('jalapeño') || desc.includes('jalapenos')) list.push('No Jalapeños');
    if (desc.includes('mayo') || desc.includes('garlic mayo')) list.push('No Garlic Mayo');
    if (desc.includes('bbq')) list.push('No BBQ Sauce');
    if (desc.includes('hot sauce')) list.push('No Hot Sauce');
    if (desc.includes('gravy')) list.push('No Gravy');
    if (desc.includes('lettuce')) list.push('No Lettuce');
    if (list.length === 0) {
      list.push('No Onions', 'Sauce on the side');
    }
    return list;
  }, [item]);

  const toggleRemoval = (removal: string) => {
    setSpecialRemovals(prev => 
      prev.includes(removal) ? prev.filter(r => r !== removal) : [...prev, removal]
    );
  };

  const toggleAddition = (addition: string) => {
    setSpecialAdditions(prev =>
      prev.includes(addition) ? prev.filter(a => a !== addition) : [...prev, addition]
    );
  };

  const handleModifierToggle = (setId: string, setName: string, opt: ModifierOption, maxSelections: number) => {
    setSelectedModifiers(prev => {
      const isSelected = prev.some(m => m.optionId === opt.id);
      if (isSelected) {
        return prev.filter(m => m.optionId !== opt.id);
      }
      
      // If single choice (maxSelections === 1), replace previous selection in this set
      if (maxSelections === 1) {
        const withoutThisSet = prev.filter(m => m.setId !== setId);
        return [...withoutThisSet, {
          setId,
          setName,
          optionId: opt.id,
          optionName: opt.name,
          priceDelta: opt.priceDelta
        }];
      }

      // If multi-select, check limit
      const currentInSet = prev.filter(m => m.setId === setId);
      if (currentInSet.length >= maxSelections) {
        return prev;
      }

      return [...prev, {
        setId,
        setName,
        optionId: opt.id,
        optionName: opt.name,
        priceDelta: opt.priceDelta
      }];
    });
  };

  // Calculate unit and total prices
  const modifiersCost = selectedModifiers.reduce((sum, m) => sum + m.priceDelta, 0);
  const unitPrice = selectedVariation.price + modifiersCost;
  const totalPrice = unitPrice * quantity;

  const handleSave = () => {
    const cartItem: CartItem = {
      cartItemId: `${item.id}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      menuItemId: item.id,
      name: item.name,
      category: item.category,
      variation: selectedVariation,
      selectedModifiers,
      specialRemovals,
      specialAdditions,
      customNotes: customNotes.trim() || undefined,
      unitPrice,
      quantity,
      totalPrice
    };

    onAddToCart(cartItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div 
        id="custom-order-modal"
        className="bg-white border border-stone-200 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-stone-900 animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-100 flex items-start justify-between gap-4 bg-white">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300/60">
                {item.category}
              </span>
              {item.tags?.includes('spicy') && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200">🌶️ Spicy</span>
              )}
              {item.tags?.includes('vegetarian') && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">🌱 Veg</span>
              )}
            </div>
            <h2 className="text-xl font-extrabold text-stone-900 mt-1.5">{item.name}</h2>
            <p className="text-xs text-stone-500 mt-0.5 max-w-md">{item.description}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-stone-100 text-stone-500 hover:text-stone-900 hover:bg-stone-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-6 flex-1 text-sm bg-white">
          {/* Size / Variation selection */}
          {item.variations.length > 1 && (
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-stone-700 mb-2.5">
                1. Select Portion Size
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {item.variations.map(v => {
                  const isSelected = selectedVariation.id === v.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelectedVariation(v)}
                      className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                        isSelected 
                          ? 'border-amber-500 bg-amber-50 text-stone-950 ring-2 ring-amber-400' 
                          : 'border-stone-200 bg-stone-50/50 text-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-bold text-sm">{v.name}</span>
                        {isSelected && <Check className="w-4 h-4 text-amber-600" />}
                      </div>
                      <span className="text-xs font-black text-amber-800 mt-1">
                        £{v.price.toFixed(2)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Modifier Sets (For BYO or Meal Deals) */}
          {item.modifierSets && item.modifierSets.length > 0 && (
            <div className="space-y-5">
              {item.modifierSets.map(modSet => (
                <div key={modSet.id} className="border-t border-stone-100 pt-4">
                  <div className="flex items-center justify-between mb-2.5">
                    <label className="text-xs font-extrabold uppercase tracking-wider text-stone-900 flex items-center gap-1.5">
                      {modSet.name}
                      {modSet.required && <span className="text-rose-500">*</span>}
                    </label>
                    <span className="text-[11px] text-stone-500 font-medium">
                      {modSet.maxSelections === 1 ? 'Choose 1' : `Up to ${modSet.maxSelections}`}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {modSet.options.map(opt => {
                      const isSelected = selectedModifiers.some(m => m.optionId === opt.id);
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleModifierToggle(modSet.id, modSet.name, opt, modSet.maxSelections)}
                          className={`px-3 py-2.5 rounded-xl border text-left flex items-center justify-between transition-all text-xs font-semibold ${
                            isSelected
                              ? 'border-amber-500 bg-amber-50 text-stone-950 ring-1 ring-amber-400'
                              : 'border-stone-200 bg-stone-50/50 text-stone-700 hover:bg-stone-100'
                          }`}
                        >
                          <span>{opt.name}</span>
                          <span className={opt.priceDelta > 0 ? 'text-amber-800 font-bold ml-2 shrink-0' : 'text-stone-400 ml-2 shrink-0'}>
                            {opt.priceDelta > 0 ? `+£${opt.priceDelta.toFixed(2)}` : 'Included'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Signature Item Customizations (Removals / Kitchen Notes) */}
          <div className="border-t border-stone-100 pt-4">
            <label className="block text-xs font-extrabold uppercase tracking-wider text-stone-700 mb-2.5">
              Kitchen Adjustments (Hold / Extra)
            </label>
            <div className="flex flex-wrap gap-2">
              {commonRemovals.map(removal => {
                const isRemoved = specialRemovals.includes(removal);
                return (
                  <button
                    key={removal}
                    type="button"
                    onClick={() => toggleRemoval(removal)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                      isRemoved
                        ? 'bg-rose-50 text-rose-700 border-rose-300 line-through font-bold'
                        : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    {removal}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => toggleAddition('Extra Crispy Roasties')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                  specialAdditions.includes('Extra Crispy Roasties')
                    ? 'bg-amber-100 text-amber-900 border-amber-400 font-bold'
                    : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                }`}
              >
                + Extra Crispy
              </button>

              <button
                type="button"
                onClick={() => toggleAddition('Sauce in Pot on Side')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                  specialAdditions.includes('Sauce in Pot on Side')
                    ? 'bg-amber-100 text-amber-900 border-amber-400 font-bold'
                    : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                }`}
              >
                + Sauce On Side
              </button>
            </div>
          </div>

          {/* Allergen & Kitchen Instructions */}
          <div className="border-t border-stone-100 pt-4">
            <label className="block text-xs font-extrabold uppercase tracking-wider text-stone-700 mb-1.5 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              Special Instructions / Allergy Warnings for Kitchen
            </label>
            <input
              type="text"
              value={customNotes}
              onChange={e => setCustomNotes(e.target.value)}
              placeholder="e.g. Gluten intolerance, extra gravy, serve piping hot..."
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs text-stone-900 placeholder-stone-400 focus:outline-hidden focus:border-amber-400 focus:bg-white transition-colors"
            />
          </div>
        </div>

        {/* Footer with Quantity Counter and Add to Order Button */}
        <div className="p-4 sm:p-5 border-t border-stone-100 bg-stone-50/50 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 bg-white border border-stone-200 rounded-2xl p-1 shadow-2xs">
            <button
              type="button"
              disabled={quantity <= 1}
              onClick={() => setQuantity(q => Math.max(1, q - 1))}
              className="p-2 rounded-xl text-stone-500 hover:bg-stone-100 disabled:opacity-30 transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-8 text-center font-extrabold text-stone-900 text-sm">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity(q => q + 1)}
              className="p-2 rounded-xl text-stone-500 hover:bg-stone-100 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <button
            id="modal-add-to-order-btn"
            type="button"
            onClick={handleSave}
            className="flex-1 py-3 px-5 rounded-2xl bg-amber-400 hover:bg-amber-500 text-stone-950 font-black text-sm shadow-xs transition-all flex items-center justify-between cursor-pointer"
          >
            <span>Add to Order</span>
            <span>£{totalPrice.toFixed(2)}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

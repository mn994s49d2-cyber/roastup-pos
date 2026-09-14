import React, { useState, useEffect } from 'react';
import { 
  Tv, 
  Sparkles, 
  Flame, 
  Play, 
  Pause, 
  Check, 
  AlertCircle,
  Sliders,
  Maximize
} from 'lucide-react';
import { MenuItem, AppCustomizationSettings } from '../../types';
import { DEFAULT_CUSTOMIZATION_SETTINGS } from '../../data/customizationSettings';

interface DigitalSignageMenuProps {
  menuItems: MenuItem[];
  customization?: AppCustomizationSettings;
  onOpenStudio?: () => void;
}

export const DigitalSignageMenu: React.FC<DigitalSignageMenuProps> = ({ 
  menuItems, 
  customization = DEFAULT_CUSTOMIZATION_SETTINGS,
  onOpenStudio 
}) => {
  const categories = customization.categoryOrder && customization.categoryOrder.length > 0 
    ? customization.categoryOrder 
    : ['Loaded Roast Potatoes', 'Roti Roast Potato Wraps', 'Sides', 'Meal Deals', 'Sauces & Dips', 'Drinks'];

  const [activeCategoryIndex, setActiveCategoryIndex] = useState<number>(0);
  const [autoCycle, setAutoCycle] = useState<boolean>(customization.digitalSignage.autoCycle);

  const cycleMs = (customization.digitalSignage.cycleInterval || 10) * 1000;

  // Auto-cycle categories according to configured interval
  useEffect(() => {
    if (!autoCycle || categories.length <= 1) return;
    const interval = setInterval(() => {
      setActiveCategoryIndex(prev => (prev + 1) % categories.length);
    }, cycleMs);
    return () => clearInterval(interval);
  }, [autoCycle, categories.length, cycleMs]);

  const currentCategory = categories[activeCategoryIndex] || categories[0];
  const itemsInCurrentCategory = menuItems.filter(i => i.category === currentCategory);

  // Featured spotlight dish
  const featuredItem = menuItems.find(i => i.id === customization.digitalSignage.featuredItemId) ||
    menuItems.find(i => i.name === 'The OG Loaded') || 
    menuItems[0];

  const { 
    layoutMode, 
    showImages, 
    showDescriptions, 
    showVariations, 
    showDietaryBadges, 
    tickerText, 
    tickerSpeed,
    mealDealTitle,
    mealDealPrice,
    mealDealDesc
  } = customization.digitalSignage;

  // Marquee speed class
  const tickerAnimClass = tickerSpeed === 'off' 
    ? 'hidden' 
    : tickerSpeed === 'fast' 
    ? 'animate-marquee-fast' 
    : tickerSpeed === 'slow' 
    ? 'animate-marquee-slow' 
    : 'animate-marquee';

  // Grid layout class based on settings
  const gridClass = layoutMode === 'grid-3col' 
    ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5'
    : 'grid grid-cols-1 md:grid-cols-2 gap-3.5';

  return (
    <div className={`flex-1 flex flex-col bg-[#FBFBFA] text-stone-900 overflow-hidden select-none font-style-${customization.fontFamily} scale-${customization.fontSizeScale}`}>
      {/* Signage Top Control Header (Bar for screen operators) */}
      <div className="px-6 py-2.5 bg-white border-b border-stone-200 flex items-center justify-between text-xs shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-black tracking-wider uppercase text-stone-800">
            ROASTUP Digital Menu TV • 1080p/4K Live Board
          </span>
          <span className="hidden sm:inline-block text-[10px] font-bold px-2 py-0.5 rounded-md bg-stone-100 text-stone-500 border border-stone-200">
            {layoutMode.toUpperCase()}
          </span>
        </div>

        {/* Category Pills & Controls */}
        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200 overflow-x-auto max-w-md scrollbar-none">
            {categories.map((cat, idx) => (
              <button
                key={cat}
                onClick={() => {
                  setActiveCategoryIndex(idx);
                  setAutoCycle(false);
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition-colors cursor-pointer whitespace-nowrap ${
                  activeCategoryIndex === idx
                    ? 'bg-white text-stone-950 shadow-xs ring-1 ring-stone-200'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <button
            onClick={() => setAutoCycle(!autoCycle)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
              autoCycle ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-stone-100 text-stone-600 border-stone-200'
            }`}
            title="Toggle automatic rotation of categories"
          >
            {autoCycle ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{autoCycle ? `Cycle (${customization.digitalSignage.cycleInterval}s)` : 'Paused'}</span>
          </button>

          {onOpenStudio && (
            <button
              onClick={onOpenStudio}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-stone-950 text-xs font-black transition-colors shadow-2xs cursor-pointer"
              title="Open customization studio"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Customize TV</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Digital Board Showcase */}
      <div className="flex-1 p-5 lg:p-8 flex flex-col lg:flex-row gap-6 overflow-hidden">
        {/* LEFT COLUMN: Active Category Menu Cards */}
        <div className="flex-1 flex flex-col justify-between overflow-hidden">
          <div>
            {/* Category Header */}
            <div className="flex items-baseline justify-between border-b-2 border-amber-400 pb-2.5 mb-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl lg:text-3xl">🥔</span>
                <h1 className="text-2xl lg:text-3xl font-black uppercase tracking-tight text-stone-900">
                  {currentCategory}
                </h1>
              </div>
              <span className="text-xs font-mono font-extrabold text-stone-600 tracking-wider uppercase">
                {itemsInCurrentCategory.length} Dishes
              </span>
            </div>

            {/* Menu Items Cards Grid */}
            <div className={`${gridClass} overflow-y-auto max-h-[calc(100vh-230px)] pr-1`}>
              {itemsInCurrentCategory.map(item => (
                <div
                  key={item.id}
                  className={`rounded-3xl border transition-all overflow-hidden flex flex-col justify-between ${
                    !item.inStock
                      ? 'bg-stone-100/50 border-stone-200 opacity-55'
                      : 'bg-white border-stone-200 hover:border-amber-400 shadow-2xs'
                  }`}
                >
                  {/* Photo Header (if item has photo & showImages is true) */}
                  {showImages && item.imageUrl && (
                    <div className="h-32 sm:h-36 w-full overflow-hidden relative bg-stone-100">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                      
                      {/* Price badge overlaid on photo */}
                      <div className="absolute bottom-2.5 right-2.5 bg-amber-400 text-stone-950 font-black font-mono text-sm px-2.5 py-1 rounded-xl shadow-xs">
                        £{item.defaultPrice.toFixed(2)}
                      </div>

                      {/* Tag badges over photo */}
                      {showDietaryBadges && item.tags && item.tags.length > 0 && (
                        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1">
                          {item.tags.includes('signature') && (
                            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-stone-950/80 text-amber-400 backdrop-blur-xs">
                              ★ Signature
                            </span>
                          )}
                          {item.tags.includes('spicy') && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-600/90 text-white backdrop-blur-xs">
                              🌶️ Spicy
                            </span>
                          )}
                          {item.tags.includes('vegetarian') && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-600/90 text-white backdrop-blur-xs">
                              🌱 Veg
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Card Content Area */}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-extrabold text-stone-900 tracking-tight leading-snug">
                              {item.name}
                            </h3>
                            {!item.inStock && (
                              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 border border-rose-300">
                                Sold Out
                              </span>
                            )}
                          </div>

                          {/* Fallback tags if no photo */}
                          {(!showImages || !item.imageUrl) && showDietaryBadges && item.tags && item.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {item.tags.includes('signature') && (
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-900">
                                  ★ Signature
                                </span>
                              )}
                              {item.tags.includes('spicy') && <span className="text-xs">🌶️</span>}
                              {item.tags.includes('vegetarian') && <span className="text-xs">🌱</span>}
                            </div>
                          )}
                        </div>

                        {/* Price badge (when no photo) */}
                        {(!showImages || !item.imageUrl) && (
                          <div className="text-right shrink-0">
                            <span className="text-base font-black text-stone-950 font-mono bg-amber-100 text-amber-950 px-2.5 py-1 rounded-xl border border-amber-300">
                              £{item.defaultPrice.toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>

                      {showDescriptions && item.description && (
                        <p className="text-xs text-stone-500 mt-2 leading-relaxed line-clamp-2">
                          {item.description}
                        </p>
                      )}
                    </div>

                    {/* Variations Pricing Pill */}
                    {showVariations && item.variations && item.variations.length > 1 && (
                      <div className="mt-3 pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
                        <span className="text-[11px] font-bold text-stone-400">Portions:</span>
                        <div className="flex items-center gap-2">
                          {item.variations.map(v => (
                            <span key={v.id} className="text-[11px] font-mono">
                              <span className="text-stone-400">{v.name}: </span>
                              <strong className="text-stone-900 font-bold">£{v.price.toFixed(2)}</strong>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Feature of the Day / Meal Deal Highlight Banner */}
        <div className="w-full lg:w-96 flex flex-col gap-4 shrink-0">
          {/* Hero Feature Spotlight Box */}
          {featuredItem && (
            <div className="p-6 rounded-3xl bg-white border-2 border-amber-400 shadow-sm flex flex-col justify-between relative overflow-hidden">
              <div className="absolute -top-12 -right-12 w-36 h-36 bg-amber-200/40 rounded-full blur-2xl pointer-events-none" />

              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-stone-950 font-black text-[11px] uppercase tracking-wider mb-3 shadow-2xs">
                  <Sparkles className="w-3.5 h-3.5" />
                  Customer Spotlight
                </div>

                {featuredItem.imageUrl && showImages && (
                  <div className="w-full h-44 rounded-2xl overflow-hidden mb-3 border border-stone-200 bg-stone-100">
                    <img
                      src={featuredItem.imageUrl}
                      alt={featuredItem.name}
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                    />
                  </div>
                )}

                <h2 className="text-2xl font-black text-stone-900 tracking-tight">
                  {featuredItem.name}
                </h2>
                <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                  {featuredItem.description}
                </p>

                {featuredItem.variations && featuredItem.variations.length > 0 && (
                  <div className="mt-4 p-3 rounded-2xl bg-stone-50 border border-stone-200 space-y-1.5 text-xs">
                    {featuredItem.variations.map(v => (
                      <div key={v.id} className="flex justify-between font-mono">
                        <span className="text-stone-500">{v.name} Portion</span>
                        <span className="text-stone-900 font-black">£{v.price.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-stone-100 text-center">
                <span className="text-xs font-extrabold text-amber-800">
                  Triple-Cooked Maris Piper Roasties
                </span>
              </div>
            </div>
          )}

          {/* Value Meal Deal Callout */}
          <div className="p-5 rounded-3xl bg-amber-400 text-stone-950 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider bg-stone-950 text-white px-2 py-0.5 rounded-md">
                Meal Deal Special
              </span>
              <span className="text-xl font-black font-mono">{mealDealPrice || 'FROM £7.00'}</span>
            </div>
            <h4 className="text-lg font-black mt-2">{mealDealTitle || 'The Solo Roast Deal'}</h4>
            <p className="text-xs font-medium text-stone-900 mt-0.5 leading-relaxed">
              {mealDealDesc || 'Any loaded roast potato + cold soft drink of your choice.'}
            </p>
          </div>
        </div>
      </div>

      {/* BOTTOM TICKER / ROTATING PROMOTIONAL BANNER */}
      {tickerSpeed !== 'off' && (
        <div className="py-2.5 px-6 bg-amber-400 text-stone-950 font-black text-xs tracking-wider uppercase flex items-center overflow-hidden whitespace-nowrap shadow-xs">
          <div className={`${tickerAnimClass} flex items-center gap-12 font-black`}>
            <span>{tickerText}</span>
            <span>{tickerText}</span>
          </div>
        </div>
      )}
    </div>
  );
};

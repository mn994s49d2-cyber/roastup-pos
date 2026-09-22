import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Maximize, 
  Minimize, 
  ArrowLeft,
  Tv,
  Plus
} from 'lucide-react';
import { MenuItem, AppCustomizationSettings } from '../../types';
import { DEFAULT_CUSTOMIZATION_SETTINGS } from '../../data/customizationSettings';
import { RoastupLogo, RoastupPotatoIcon } from '../brand/RoastupBrand';

interface DigitalSignageMenuProps {
  menuItems: MenuItem[];
  customization?: AppCustomizationSettings;
  onOpenStudio?: () => void;
  standaloneTvMode?: boolean;
  initialChannel?: number;
  onExit?: () => void;
}

export const DigitalSignageMenu: React.FC<DigitalSignageMenuProps> = ({ 
  menuItems, 
  customization = DEFAULT_CUSTOMIZATION_SETTINGS,
  initialChannel = 0,
  onExit
}) => {
  const allCategories = customization.categoryOrder && customization.categoryOrder.length > 0 
    ? customization.categoryOrder 
    : ['Loaded Roast Potatoes', 'Roti Roast Potato Wraps', 'Sides', 'Meal Deals', 'Sauces & Dips', 'Drinks'];

  // Multi-Screen Channel Setup:
  // 0: All categories (auto-cycle every N seconds)
  // 1: Loaded Roast Potatoes & Spuds
  // 2: Roti Wraps & Sides
  // 3: Meal Deals & Drinks
  // 4+: Custom screen
  const [channels, setChannels] = useState<Array<{ id: number; name: string; categories: string[] }>>([
    { id: 0, name: 'All (Cycle)', categories: allCategories },
    { id: 1, name: 'Screen 1 (Spuds)', categories: allCategories.filter(c => c.toLowerCase().includes('potato') || c.toLowerCase().includes('loaded') || c.toLowerCase().includes('build')) },
    { id: 2, name: 'Screen 2 (Wraps & Sides)', categories: allCategories.filter(c => c.toLowerCase().includes('wrap') || c.toLowerCase().includes('side') || c.toLowerCase().includes('sauce') || c.toLowerCase().includes('dip')) },
    { id: 3, name: 'Screen 3 (Deals & Drinks)', categories: allCategories.filter(c => c.toLowerCase().includes('deal') || c.toLowerCase().includes('drink') || c.toLowerCase().includes('beverage')) }
  ]);

  const [selectedChannelId, setSelectedChannelId] = useState<number>(initialChannel || 0);
  const [activeCategoryIndex, setActiveCategoryIndex] = useState<number>(0);
  const [showControls, setShowControls] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

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

  const activeChannel = channels.find(c => c.id === selectedChannelId) || channels[0];
  const channelCategories = activeChannel.categories.length > 0 ? activeChannel.categories : allCategories;

  const cycleMs = (customization.digitalSignage.cycleInterval || 10) * 1000;
  const isAutoCycling = selectedChannelId === 0 && channelCategories.length > 1;

  // Auto-cycle through categories when in rotation mode
  useEffect(() => {
    if (!isAutoCycling) return;
    const interval = setInterval(() => {
      setActiveCategoryIndex(prev => (prev + 1) % channelCategories.length);
    }, cycleMs);
    return () => clearInterval(interval);
  }, [isAutoCycling, channelCategories.length, cycleMs]);

  // Current category to render
  const safeIndex = activeCategoryIndex % channelCategories.length;
  const currentCategory = channelCategories[safeIndex] || channelCategories[0];
  // Include all items in category (including sold out, which will be greyed out)
  const itemsInCurrentCategory = menuItems.filter(i => i.category === currentCategory);

  const [tvScale, setTvScale] = useState<'auto' | 'standard' | 'large' | 'xl'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('roastup_tv_scale');
      if (saved === 'auto' || saved === 'standard' || saved === 'large' || saved === 'xl') return saved;
    }
    return 'auto';
  });

  const handleSetTvScale = (scale: 'auto' | 'standard' | 'large' | 'xl') => {
    setTvScale(scale);
    if (typeof window !== 'undefined') {
      localStorage.setItem('roastup_tv_scale', scale);
    }
  };

  const getItemNameClass = () => {
    switch (tvScale) {
      case 'standard': return 'text-sm sm:text-base lg:text-lg font-black text-stone-900 dark:text-white truncate';
      case 'large': return 'text-base sm:text-lg lg:text-xl xl:text-2xl font-black text-stone-900 dark:text-white truncate';
      case 'xl': return 'text-lg sm:text-xl lg:text-2xl xl:text-3xl font-black text-stone-900 dark:text-white truncate';
      default: // auto: dynamic fluid clamp for perfect proportion on any screen
        return 'text-[clamp(1rem,1.3vw+0.25rem,1.95rem)] font-black text-stone-900 dark:text-white truncate';
    }
  };

  const getItemDescClass = () => {
    switch (tvScale) {
      case 'standard': return 'text-xs sm:text-xs md:text-sm text-stone-500 dark:text-stone-400 line-clamp-2 mt-0.5 leading-snug';
      case 'large': return 'text-xs sm:text-sm lg:text-base text-stone-500 dark:text-stone-400 line-clamp-2 mt-0.5 leading-snug';
      case 'xl': return 'text-sm sm:text-base lg:text-lg text-stone-500 dark:text-stone-400 line-clamp-2 mt-0.5 leading-snug';
      default: // auto
        return 'text-[clamp(0.75rem,0.85vw+0.15rem,1.15rem)] text-stone-500 dark:text-stone-400 line-clamp-2 mt-0.5 leading-snug';
    }
  };

  const getItemPriceClass = (isSoldOut: boolean) => {
    const base = isSoldOut ? 'line-through text-stone-400' : 'text-stone-900 dark:text-white';
    switch (tvScale) {
      case 'standard': return `text-base sm:text-lg md:text-xl lg:text-2xl font-black font-mono block ${base}`;
      case 'large': return `text-lg sm:text-xl md:text-2xl lg:text-3xl font-black font-mono block ${base}`;
      case 'xl': return `text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black font-mono block ${base}`;
      default: // auto
        return `text-[clamp(1.15rem,1.6vw+0.3rem,2.4rem)] font-black font-mono block ${base}`;
    }
  };

  const getCategoryHeaderClass = () => {
    switch (tvScale) {
      case 'standard': return 'text-xl lg:text-2xl font-black text-stone-900 dark:text-white tracking-tight uppercase';
      case 'large': return 'text-2xl lg:text-3xl xl:text-4xl font-black text-stone-900 dark:text-white tracking-tight uppercase';
      case 'xl': return 'text-3xl lg:text-4xl xl:text-5xl font-black text-stone-900 dark:text-white tracking-tight uppercase';
      default: // auto
        return 'text-[clamp(1.4rem,2.4vw+0.3rem,3.25rem)] font-black text-stone-900 dark:text-white tracking-tight uppercase';
    }
  };

  const getImageSizeClass = () => {
    switch (tvScale) {
      case 'standard': return 'w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-2xl object-cover border border-stone-200 dark:border-stone-700';
      case 'large': return 'w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 xl:w-28 xl:h-28 rounded-2xl object-cover border border-stone-200 dark:border-stone-700';
      case 'xl': return 'w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 xl:w-32 xl:h-32 rounded-2xl object-cover border border-stone-200 dark:border-stone-700';
      default: // auto
        return 'w-[clamp(3.5rem,5.5vw,6rem)] h-[clamp(3.5rem,5.5vw,6rem)] rounded-2xl object-cover border border-stone-200 dark:border-stone-700';
    }
  };

  const {
    layoutMode = 'grid-2col',
    showImages = true,
    showDescriptions = true,
    showVariations = true,
    showDietaryBadges = true,
    tickerText = '',
    tickerSpeed = 'normal',
    mealDealTitle,
    mealDealPrice,
    mealDealDesc
  } = customization.digitalSignage;

  const isSpotlightLayout = layoutMode === 'spotlight';
  const featuredItem = menuItems.find(i => i.id === customization.digitalSignage.featuredItemId) || menuItems[0];

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleAddCustomScreen = () => {
    const nextId = channels.length;
    const name = `Screen ${nextId} (Custom)`;
    const newChan = { id: nextId, name, categories: allCategories };
    setChannels(prev => [...prev, newChan]);
    setSelectedChannelId(nextId);
  };

  return (
    <div className="h-screen max-h-screen w-screen flex flex-col bg-[#FBFBFA] dark:bg-stone-950 text-stone-900 dark:text-stone-100 overflow-hidden select-none font-sans relative">
      {/* PURE DIGITAL SIGNAGE BOARD (Zero top navbar, clean full-screen TV view) */}
      <div className="flex-1 min-h-0 flex flex-col justify-between overflow-hidden p-5 md:p-6 lg:p-8">
        {/* Brand Header & Active Category Indicator */}
        <div className="flex items-center justify-between border-b-2 border-stone-900 dark:border-stone-100 pb-3 mb-4 shrink-0">
          <div className="flex items-center gap-3.5">
            <RoastupPotatoIcon size="lg" className="ring-2 ring-amber-400/50 shadow-xs" />
            <div>
              <div className="flex items-center gap-2.5">
                <RoastupLogo size="md" />
                <span className="text-[10px] px-2.5 py-0.5 rounded-md bg-stone-900 text-amber-400 dark:bg-white dark:text-stone-950 font-black tracking-widest uppercase">
                  {selectedChannelId > 0 ? activeChannel.name : 'Master Menu Board'}
                </span>
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 font-extrabold uppercase tracking-widest mt-0.5">
                100% Fresh British Maris Piper Potatoes • Roasted Hourly
              </p>
            </div>
          </div>

          {/* Active Category Display */}
          <div className="text-right">
            <span className="text-[10px] font-black tracking-widest uppercase text-amber-600 dark:text-amber-400 block">
              Now Serving
            </span>
            <span className={getCategoryHeaderClass()}>
              {currentCategory}
            </span>
          </div>
        </div>

        {/* Dynamic Items Content Area */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-5 overflow-hidden items-stretch">
          {/* Main Items Catalog */}
          <div className={`${isSpotlightLayout && featuredItem ? 'lg:col-span-8' : 'lg:col-span-12'} flex flex-col justify-between overflow-hidden min-h-0`}>
            <div className={`grid gap-3 flex-1 min-h-0 overflow-y-auto pr-1 ${
              layoutMode === 'grid-3col' 
                ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' 
                : 'grid-cols-1 md:grid-cols-2'
            }`}>
              {itemsInCurrentCategory.map(item => {
                const isSoldOut = item.inStock === false;
                return (
                  <div 
                    key={item.id}
                    className={`rounded-3xl border transition-all flex items-center justify-between shadow-2xs relative overflow-hidden ${
                      isSoldOut 
                        ? 'p-3.5 sm:p-4 lg:p-4.5 xl:p-5 bg-stone-100/70 dark:bg-stone-900/60 border-dashed border-stone-300 dark:border-stone-800 opacity-55 grayscale select-none' 
                        : 'p-3.5 sm:p-4 lg:p-4.5 xl:p-5 bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 sm:gap-4 flex-1 min-w-0">
                      {showImages && item.imageUrl && (
                        <div className="relative shrink-0">
                          <img 
                            src={item.imageUrl} 
                            alt={item.name}
                            className={getImageSizeClass()}
                            referrerPolicy="no-referrer"
                          />
                          {isSoldOut && (
                            <div className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center">
                              <span className="text-[9px] sm:text-[10px] font-black uppercase text-amber-300 px-1.5 py-0.5 rounded bg-black/90">
                                86'd
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className={getItemNameClass()}>
                            {item.name}
                          </h4>
                          {isSoldOut ? (
                            <span className="text-[10px] sm:text-xs font-black uppercase px-2 py-0.5 rounded-md bg-stone-800 text-amber-400 dark:bg-amber-400 dark:text-stone-950 shrink-0">
                              Sold Out
                            </span>
                          ) : (
                            showDietaryBadges && item.tags?.includes('signature') && (
                              <span className="text-[9px] sm:text-[10px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-400 text-stone-950 shrink-0">
                                ★ Top Pick
                              </span>
                            )
                          )}
                        </div>
                        {showDescriptions && (
                          <p className={getItemDescClass()}>
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0 pl-2">
                      <span className={getItemPriceClass(isSoldOut)}>
                        £{(item.defaultPrice ?? item.variations?.[0]?.price ?? 0).toFixed(2)}
                      </span>
                      {isSoldOut ? (
                        <span className="text-[10px] sm:text-xs font-black text-rose-500 uppercase tracking-wider block mt-0.5">
                          Out of stock
                        </span>
                      ) : (
                        showVariations && item.variations && item.variations.length > 1 && (
                          <span className="block text-[10px] sm:text-xs text-stone-400 font-bold uppercase">
                            From £{Math.min(...item.variations.map(v => v.price)).toFixed(2)}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Signature Meal Deal Footer Banner */}
            {mealDealTitle && (
              <div className="mt-3 p-3.5 rounded-2xl bg-amber-400 text-stone-950 flex items-center justify-between shadow-xs shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-stone-950 text-amber-400 flex items-center justify-center font-black">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider block text-stone-900">
                      Deal of the Day
                    </span>
                    <h3 className="text-sm font-black tracking-tight">{mealDealTitle}</h3>
                    <p className="text-[11px] text-stone-800 font-medium line-clamp-1">{mealDealDesc}</p>
                  </div>
                </div>
                <div className="text-right pl-3">
                  <span className="text-xl font-black font-mono">{mealDealPrice}</span>
                </div>
              </div>
            )}
          </div>

          {/* Spotlight Hero Dish (When Spotlight layout is active) */}
          {isSpotlightLayout && featuredItem && (
            <div className="hidden lg:flex lg:col-span-4 flex-col rounded-3xl bg-stone-900 text-white p-5 justify-between overflow-hidden shadow-xl border border-stone-800 shrink-0">
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest text-amber-400 bg-amber-400/20 px-2.5 py-0.5 rounded-full border border-amber-400/30">
                  Chef's Highlight
                </span>
                <h3 className="text-xl font-black tracking-tight mt-2 text-white">
                  {featuredItem.name}
                </h3>
                <p className="text-[11px] text-stone-400 mt-1 line-clamp-3">
                  {featuredItem.description}
                </p>
              </div>

              {featuredItem.imageUrl && (
                <div className="my-3 rounded-2xl overflow-hidden border border-stone-800 shadow-md h-40">
                  <img 
                    src={featuredItem.imageUrl} 
                    alt={featuredItem.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}

              <div className="flex items-center justify-between border-t border-stone-800 pt-3">
                <span className="text-xs font-bold text-stone-400">Portion from</span>
                <span className="text-2xl font-black text-amber-400 font-mono">
                  £{(featuredItem.defaultPrice || 0).toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Crawl Marquee Ticker */}
        {tickerText && tickerSpeed !== 'off' && (
          <div className="mt-3 bg-stone-900 text-amber-400 py-1.5 px-4 rounded-xl overflow-hidden shrink-0 border border-stone-800">
            <div className="whitespace-nowrap flex items-center font-bold text-xs uppercase tracking-wider animate-marquee">
              <span className="mr-8">{tickerText}</span>
              <span className="mr-8">{tickerText}</span>
            </div>
          </div>
        )}
      </div>

      {/* DISCREET FLOATING CONTROL BAR (Auto-hides on inactivity; reveals on mouse move) */}
      <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-stone-900/90 dark:bg-stone-800/90 backdrop-blur-md p-1.5 rounded-2xl shadow-xl border border-stone-700 transition-all duration-300 ${
        showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      }`}>
        {onExit && (
          <button
            onClick={onExit}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors cursor-pointer"
            title="Exit Menu Board & Back to POS"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to POS</span>
          </button>
        )}

        {/* Multi-screen channel switchers */}
        <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl">
          {channels.map(ch => (
            <button
              key={ch.id}
              onClick={() => {
                setSelectedChannelId(ch.id);
                setActiveCategoryIndex(0);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                selectedChannelId === ch.id
                  ? 'bg-amber-400 text-stone-950 font-black shadow-xs'
                  : 'text-stone-300 hover:text-white'
              }`}
            >
              {ch.name}
            </button>
          ))}

          <button
            onClick={handleAddCustomScreen}
            className="p-1 rounded-lg text-stone-400 hover:text-amber-400 transition-colors cursor-pointer"
            title="Add another screen channel"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Display Scale Adjuster */}
        <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl">
          <span className="text-[10px] font-bold text-stone-400 px-1 hidden sm:inline uppercase">Scale:</span>
          {(['auto', 'standard', 'large', 'xl'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => handleSetTvScale(mode)}
              className={`px-2 py-1 rounded-lg text-[10px] sm:text-xs font-bold transition-colors cursor-pointer uppercase ${
                tvScale === mode
                  ? 'bg-amber-400 text-stone-950 font-black shadow-xs'
                  : 'text-stone-300 hover:text-white'
              }`}
              title={
                mode === 'auto' ? 'Auto Dynamic Screen Adjust' :
                mode === 'standard' ? 'Standard Display' :
                mode === 'large' ? 'Large Screen / TV' : 'Extra Large Display'
              }
            >
              {mode === 'auto' ? 'Auto' : mode === 'standard' ? 'Std' : mode === 'large' ? 'Lg' : 'XL'}
            </button>
          ))}
        </div>

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

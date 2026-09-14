import React, { useState, useRef, useEffect } from 'react';
import { 
  ShoppingBag, 
  UtensilsCrossed, 
  Tv, 
  Radio, 
  Boxes, 
  Wifi, 
  Maximize, 
  Minimize, 
  TabletSmartphone,
  Sparkles,
  Sliders,
  ChevronDown,
  LayoutGrid
} from 'lucide-react';
import { ScreenMode } from '../types';
import { RoastupLogo, RoastupPotatoIcon, BrandUploadModal } from './brand/RoastupBrand';

interface NavbarProps {
  currentScreen: ScreenMode;
  onSelectScreen: (screen: ScreenMode) => void;
  activeOrdersCount: number;
  lowStockCount: number;
  serverOnline: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentScreen,
  onSelectScreen,
  activeOrdersCount,
  lowStockCount,
  serverOnline
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowMoreMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Primary core stations
  const primaryNavItems: { id: ScreenMode; label: string; icon: any; badge?: number; badgeColor?: string }[] = [
    { id: 'pos', label: 'POS Register', icon: ShoppingBag },
    { id: 'kds', label: 'Kitchen KDS', icon: UtensilsCrossed, badge: activeOrdersCount, badgeColor: 'bg-amber-400 text-stone-950' },
    { id: 'signage_menu', label: 'Menu Board', icon: Tv },
    { id: 'studio', label: 'Menu Studio', icon: Sliders }
  ];

  // Secondary screens & displays
  const secondaryNavItems: { id: ScreenMode; label: string; desc: string; icon: any; badge?: number; badgeColor?: string }[] = [
    { id: 'order_status', label: 'Pickup Board', desc: 'Customer collection order queue', icon: Radio },
    { id: 'cfd', label: 'Customer Screen', desc: 'Facing display for payment & cart', icon: TabletSmartphone },
    { id: 'inventory', label: 'Stock & Inventory', desc: 'Track potato sacks, tubs & stock', icon: Boxes, badge: lowStockCount > 0 ? lowStockCount : undefined, badgeColor: 'bg-rose-500 text-white' },
    { id: 'network_hub', label: 'Network & Hardware', desc: 'Printers, terminals & screen pairing', icon: Wifi }
  ];

  const activeSecondaryItem = secondaryNavItems.find(item => item.id === currentScreen);
  const totalSecondaryBadges = (lowStockCount > 0 ? lowStockCount : 0);

  return (
    <header className="bg-white text-stone-900 border-b border-stone-200 sticky top-0 z-40 select-none shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between gap-3">
        {/* Brand identity: New Clean Logo & Potato Icon */}
        <div 
          onClick={() => onSelectScreen('pos')}
          className="flex items-center gap-2.5 cursor-pointer group shrink-0"
        >
          <RoastupPotatoIcon size="md" className="ring-2 ring-amber-400/40 group-hover:scale-105 transition-transform" />
          <div className="flex items-center gap-2">
            <RoastupLogo size="sm" />
            <span className="hidden sm:inline-flex text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300">
              POS
            </span>
          </div>
        </div>

        {/* Primary Station Navigation */}
        <div className="flex items-center gap-1.5 bg-stone-100/90 p-1 rounded-2xl border border-stone-200/80">
          {primaryNavItems.map(item => {
            const Icon = item.icon;
            const isActive = currentScreen === item.id;
            return (
              <button
                key={item.id}
                id={`nav-tab-${item.id}`}
                onClick={() => onSelectScreen(item.id)}
                className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-150 ${
                  isActive 
                    ? 'bg-amber-400 text-stone-950 shadow-xs font-black' 
                    : 'text-stone-600 hover:text-stone-950 hover:bg-white/80'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-stone-950' : 'text-stone-500'}`} />
                <span className="hidden md:inline">{item.label}</span>
                <span className="inline md:hidden">
                  {item.id === 'pos' ? 'POS' : item.id === 'kds' ? 'Kitchen' : item.id === 'signage_menu' ? 'TV' : 'Studio'}
                </span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={`ml-0.5 text-[10px] font-black px-1.5 py-0.2 rounded-full ${isActive ? 'bg-stone-950 text-amber-400' : item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Secondary Screens Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeSecondaryItem 
                  ? 'bg-stone-900 text-amber-400 shadow-xs font-black' 
                  : 'text-stone-600 hover:text-stone-900 hover:bg-white/80'
              }`}
              title="More Screens & Displays"
            >
              {activeSecondaryItem ? (
                <>
                  <activeSecondaryItem.icon className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">{activeSecondaryItem.label}</span>
                </>
              ) : (
                <>
                  <LayoutGrid className="w-3.5 h-3.5 text-stone-500" />
                  <span className="hidden sm:inline">More Screens</span>
                </>
              )}
              {totalSecondaryBadges > 0 && !activeSecondaryItem && (
                <span className="w-2 h-2 rounded-full bg-rose-500" />
              )}
              <ChevronDown className={`w-3 h-3 transition-transform ${showMoreMenu ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu Popover */}
            {showMoreMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-stone-200 p-2 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-stone-400 border-b border-stone-100 mb-1">
                  Additional Screens &amp; Tools
                </div>
                <div className="space-y-1">
                  {secondaryNavItems.map(item => {
                    const Icon = item.icon;
                    const isSelected = currentScreen === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          onSelectScreen(item.id);
                          setShowMoreMenu(false);
                        }}
                        className={`w-full flex items-start gap-2.5 p-2 rounded-xl text-left transition-colors ${
                          isSelected 
                            ? 'bg-amber-50 text-amber-950 font-bold border border-amber-200/80' 
                            : 'text-stone-700 hover:bg-stone-100'
                        }`}
                      >
                        <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${isSelected ? 'bg-amber-400 text-stone-950' : 'bg-stone-100 text-stone-600'}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold truncate">{item.label}</span>
                            {item.badge !== undefined && item.badge > 0 && (
                              <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${item.badgeColor}`}>
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-stone-500 leading-tight truncate">{item.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right actions: Brand modal trigger, Network status & Fullscreen */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowBrandModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-50/80 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold transition-colors cursor-pointer"
            title="Upload or Change Logo & Icon"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden lg:inline">Branding</span>
          </button>

          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-stone-50 border border-stone-200 text-xs">
            <span className={`w-2 h-2 rounded-full ${serverOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
            <span className="text-stone-600 text-[11px] font-semibold">
              {serverOnline ? 'Live' : 'Offline'}
            </span>
          </div>

          <button
            id="fullscreen-toggle-btn"
            onClick={toggleFullscreen}
            title="Toggle Fullscreen"
            className="p-1.5 rounded-xl text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <BrandUploadModal
        isOpen={showBrandModal}
        onClose={() => setShowBrandModal(false)}
      />
    </header>
  );
};


import React, { useState } from 'react';
import { 
  ShoppingBag, 
  UtensilsCrossed, 
  GlassWater,
  History,
  Tv, 
  Radio, 
  Settings,
  Maximize, 
  Minimize, 
  TabletSmartphone
} from 'lucide-react';
import { ScreenMode, AppCustomizationSettings } from '../types';
import { RoastupLogo, RoastupPotatoIcon } from './brand/RoastupBrand';

interface NavbarProps {
  currentScreen: ScreenMode;
  onSelectScreen: (screen: ScreenMode) => void;
  activeOrdersCount: number;
  fohOrdersCount?: number;
  lowStockCount: number;
  serverOnline: boolean;
  customization: AppCustomizationSettings;
  onUpdateCustomization: (settings: AppCustomizationSettings) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentScreen,
  onSelectScreen,
  activeOrdersCount,
  fohOrdersCount = 0,
  lowStockCount,
  serverOnline
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Direct station buttons (No nested side menus or dropdown menus)
  const navStations: { id: ScreenMode; label: string; shortLabel: string; icon: any; badge?: number; badgeColor?: string }[] = [
    { id: 'pos', label: 'POS Register', shortLabel: 'POS', icon: ShoppingBag },
    { id: 'kds', label: 'Kitchen KDS', shortLabel: 'Kitchen', icon: UtensilsCrossed, badge: activeOrdersCount > 0 ? activeOrdersCount : undefined, badgeColor: 'bg-amber-400 text-stone-950' },
    { id: 'foh', label: 'FOH Drinks & Bar', shortLabel: 'FOH', icon: GlassWater, badge: fohOrdersCount > 0 ? fohOrdersCount : undefined, badgeColor: 'bg-cyan-500 text-white' },
    { id: 'order_history', label: 'Order History', shortLabel: 'History', icon: History },
    { id: 'signage_menu', label: 'Menu Board TV', shortLabel: 'Menu TV', icon: Tv },
    { id: 'order_status', label: 'Pickup Board', shortLabel: 'Pickup', icon: Radio },
    { id: 'cfd', label: 'Customer Screen', shortLabel: 'Customer', icon: TabletSmartphone },
    { id: 'admin', label: 'Settings & Admin', shortLabel: 'Settings', icon: Settings, badge: lowStockCount > 0 ? lowStockCount : undefined, badgeColor: 'bg-rose-500 text-white' }
  ];

  return (
    <header className="bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 border-b border-stone-200 dark:border-stone-800 sticky top-0 z-40 select-none shadow-2xs font-sans">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between gap-3">
        {/* Brand identity: Logo & Mascot */}
        <div 
          onClick={() => onSelectScreen('pos')}
          className="flex items-center gap-2.5 cursor-pointer group shrink-0"
          title="Roasties POS Register"
        >
          <RoastupPotatoIcon size="md" className="ring-2 ring-amber-400/40 group-hover:scale-105 transition-transform" />
          <div className="flex items-center gap-2">
            <RoastupLogo size="sm" />
            <span className="hidden xl:inline-flex text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800">
              VITA POS
            </span>
          </div>
        </div>

        {/* Primary Station Navigation Bar (No dropdown or side menu) */}
        <nav className="flex items-center gap-1 bg-stone-100/90 dark:bg-stone-800/90 p-1 rounded-2xl border border-stone-200/80 dark:border-stone-700 overflow-x-auto scrollbar-none">
          {navStations.map(item => {
            const Icon = item.icon;
            const isActive = currentScreen === item.id;
            return (
              <button
                key={item.id}
                id={`nav-tab-${item.id}`}
                onClick={() => onSelectScreen(item.id)}
                className={`relative flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-150 cursor-pointer ${
                  isActive 
                    ? 'bg-amber-400 text-stone-950 shadow-xs font-black' 
                    : 'text-stone-600 dark:text-stone-300 hover:text-stone-950 dark:hover:text-white hover:bg-white/80 dark:hover:bg-stone-700'
                }`}
                title={item.label}
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-stone-950' : 'text-stone-500 dark:text-stone-400'}`} />
                <span className="hidden lg:inline">{item.label}</span>
                <span className="inline lg:hidden">{item.shortLabel}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={`ml-0.5 text-[10px] font-black px-1.5 py-0.2 rounded-full ${isActive ? 'bg-stone-950 text-amber-400' : item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right actions: Live connection & Fullscreen */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs">
            <span className={`w-2 h-2 rounded-full ${serverOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
            <span className="text-stone-600 dark:text-stone-300 text-[11px] font-semibold hidden sm:inline">
              {serverOnline ? 'Live' : 'Offline'}
            </span>
          </div>

          <button
            id="fullscreen-toggle-btn"
            onClick={toggleFullscreen}
            title="Toggle Fullscreen"
            className="p-1.5 rounded-xl text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer border border-stone-200 dark:border-stone-700"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};

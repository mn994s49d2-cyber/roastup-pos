import { AppCustomizationSettings } from '../types';

export const DEFAULT_CUSTOMIZATION_SETTINGS: AppCustomizationSettings = {
  fontFamily: 'sans',
  fontSizeScale: 'normal',
  categoryOrder: [
    'Loaded Roast Potatoes',
    'Roti Roast Potato Wraps',
    'Sides',
    'Sauces & Dips',
    'Meal Deals',
    'Drinks',
    'Build Your Own'
  ],
  digitalSignage: {
    layoutMode: 'grid-2col',
    showImages: true,
    showDescriptions: true,
    showVariations: true,
    showDietaryBadges: true,
    cycleInterval: 10,
    autoCycle: true,
    tickerText: '🥔 100% FRESH BRITISH MARIS PIPER POTATOES ROASTED HOURLY • ★ THE UK\'S BEST LOADED ROAST POTATOES & FRESH ROTI WRAPS • 🔥 TRY OUR SIGNATURE ROAST DINNER WITH RICH GRAVY & STUFFING CRUMBS • ⚡ CARD, APPLE PAY & CONTACTLESS ACCEPTED',
    tickerSpeed: 'normal',
    featuredItemId: 'item-001',
    mealDealTitle: 'The Solo Roast Deal',
    mealDealPrice: 'FROM £7.00',
    mealDealDesc: 'Any loaded roast potato portion + cold can/bottle drink of your choice.'
  }
};

const STORAGE_KEY = 'roastup_customization_v1';

export function loadSavedCustomization(): AppCustomizationSettings {
  if (typeof window === 'undefined') return DEFAULT_CUSTOMIZATION_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_CUSTOMIZATION_SETTINGS,
        ...parsed,
        digitalSignage: {
          ...DEFAULT_CUSTOMIZATION_SETTINGS.digitalSignage,
          ...(parsed.digitalSignage || {})
        }
      };
    }
  } catch (err) {
    console.error('Error loading customization settings', err);
  }
  return DEFAULT_CUSTOMIZATION_SETTINGS;
}

export function saveCustomizationLocally(settings: AppCustomizationSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    // Apply font styling class to root element
    applyFontToDocument(settings.fontFamily, settings.fontSizeScale);
  } catch (err) {
    console.error('Error saving customization settings', err);
  }
}

export const loadCustomizationLocally = loadSavedCustomization;

export function applyFontToDocument(font: string, scale: string): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  
  // Remove existing font classes
  root.classList.remove('font-style-sans', 'font-style-street', 'font-style-rounded', 'font-style-serif', 'font-style-diner', 'font-style-mono');
  root.classList.add(`font-style-${font}`);

  // Scale classes
  root.classList.remove('scale-compact', 'scale-normal', 'scale-large', 'scale-xl');
  root.classList.add(`scale-${scale}`);
}

export function applyCustomizationToDOM(settings: AppCustomizationSettings): void {
  applyFontToDocument(settings.fontFamily, settings.fontSizeScale);
}

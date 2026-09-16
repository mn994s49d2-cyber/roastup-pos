import React, { useState, useEffect, useRef } from 'react';
import { Upload, Sparkles, Image as ImageIcon, Check, RefreshCw, CheckCircle2 } from 'lucide-react';
import defaultLogoImg from '../../assets/images/roastup_logo_1789405639770.jpg';
import defaultPotatoImg from '../../assets/images/potato_icon_1789405650527.jpg';

// Default generated high-res image assets
export const DEFAULT_ROASTUP_LOGO = defaultLogoImg;
export const DEFAULT_POTATO_ICON = defaultPotatoImg;

// Safe in-memory fallback store if localStorage is blocked by iframe security policies
const memoryBrandStore: Record<string, string> = {};
const BRAND_CHANGE_EVENT = 'roastup_brand_assets_changed';

/**
 * Resizes an image client-side to keep base64 strings small (<100KB)
 * so they never exceed browser localStorage quotas.
 */
export function resizeImageFile(file: File, maxWidth = 500, maxHeight = 500, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const isPng = file.type === 'image/png';
        const dataUrl = canvas.toDataURL(isPng ? 'image/png' : 'image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

function safeGetStorage(key: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  try {
    return window.localStorage.getItem(key) || memoryBrandStore[key] || fallback;
  } catch {
    return memoryBrandStore[key] || fallback;
  }
}

function safeSetStorage(key: string, value: string): void {
  memoryBrandStore[key] = value;
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, value);
  } catch (err) {
    console.warn('LocalStorage save failed, using memory fallback:', err);
  }
}

function safeRemoveStorage(key: string): void {
  delete memoryBrandStore[key];
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Gracefully ignore
  }
}

// Global broadcast to update all mounted brand components
function broadcastBrandUpdate() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(BRAND_CHANGE_EVENT));
  }
}

// Helper hook for persistent brand assets (stored safely in localStorage, memory & synchronized across all components)
export function useBrandAssets() {
  const [logoUrl, setLogoUrl] = useState<string>(() => safeGetStorage('roastup_custom_logo', DEFAULT_ROASTUP_LOGO));
  const [iconUrl, setIconUrl] = useState<string>(() => safeGetStorage('roastup_custom_icon', DEFAULT_POTATO_ICON));

  useEffect(() => {
    const handleUpdate = () => {
      setLogoUrl(safeGetStorage('roastup_custom_logo', DEFAULT_ROASTUP_LOGO));
      setIconUrl(safeGetStorage('roastup_custom_icon', DEFAULT_POTATO_ICON));
    };

    window.addEventListener(BRAND_CHANGE_EVENT, handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener(BRAND_CHANGE_EVENT, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const updateLogo = (dataUrl: string) => {
    setLogoUrl(dataUrl);
    safeSetStorage('roastup_custom_logo', dataUrl);
    broadcastBrandUpdate();
  };

  const updateIcon = (dataUrl: string) => {
    setIconUrl(dataUrl);
    safeSetStorage('roastup_custom_icon', dataUrl);
    broadcastBrandUpdate();
  };

  const resetBrand = () => {
    setLogoUrl(DEFAULT_ROASTUP_LOGO);
    setIconUrl(DEFAULT_POTATO_ICON);
    safeRemoveStorage('roastup_custom_logo');
    safeRemoveStorage('roastup_custom_icon');
    broadcastBrandUpdate();
  };

  return { logoUrl, iconUrl, updateLogo, updateIcon, resetBrand };
}

/**
 * ROASTUP Crown & Typography Vector Logo
 * Perfectly renders the golden brush ROASTUP logo with crown on white/transparent backgrounds
 */
export const RoastupSvgLogo: React.FC<{ className?: string; color?: string }> = ({ 
  className = "h-9 w-auto", 
  color = "#FFB800" 
}) => {
  return (
    <svg 
      viewBox="0 0 420 180" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
      aria-label="ROASTIES"
    >
      {/* Crown */}
      <path 
        d="M185 58 L165 24 L205 38 L245 24 L225 58 Z" 
        fill={color} 
        stroke={color} 
        strokeWidth="3" 
        strokeLinejoin="round" 
      />
      <circle cx="165" cy="22" r="3.5" fill={color} />
      <circle cx="205" cy="36" r="3.5" fill={color} />
      <circle cx="245" cy="22" r="3.5" fill={color} />

      {/* ROASTIES Brush Lettering */}
      <text 
        x="200" 
        y="126" 
        textAnchor="middle" 
        fill={color} 
        fontFamily="'Impact', 'Arial Black', -apple-system, sans-serif" 
        fontWeight="900" 
        fontSize="78" 
        letterSpacing="-1px"
        fontStyle="italic"
        transform="rotate(-2 200 120)"
      >
        ROASTIES
      </text>

      {/* Dynamic Brush Underline Swoosh */}
      <path 
        d="M 105 146 Q 210 162 315 138 Q 230 152 105 146 Z" 
        fill={color} 
      />
    </svg>
  );
};

/**
 * Crispy Roasted Potato Wedge Vector Icon
 */
export const RoastupSvgPotato: React.FC<{ className?: string }> = ({ className = "w-9 h-9" }) => {
  return (
    <svg 
      viewBox="0 0 120 120" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
      aria-label="Roast Potato"
    >
      {/* Potato Skin Base */}
      <path 
        d="M 22 75 C 18 42, 45 20, 80 24 C 105 28, 116 55, 110 82 C 104 105, 68 114, 38 106 C 26 102, 22 92, 22 75 Z" 
        fill="#C67D1E" 
        stroke="#8D4C06" 
        strokeWidth="4" 
      />
      {/* Roasted Golden Center */}
      <path 
        d="M 28 72 C 32 46, 52 30, 82 34 C 102 38, 108 58, 102 78 C 96 95, 68 100, 44 94 C 32 90, 28 82, 28 72 Z" 
        fill="#FFDA66" 
      />
      <path 
        d="M 40 50 C 58 40, 78 44, 92 56 C 85 75, 58 84, 42 74 C 36 68, 36 58, 40 50 Z" 
        fill="#FFF2B2" 
      />
      {/* Rosemary / Herb Flecks */}
      <path d="M 52 56 L 60 52 M 56 54 L 54 48" stroke="#2D7A32" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M 74 62 L 82 66 M 78 64 L 80 58" stroke="#2D7A32" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M 64 74 L 72 72 M 68 73 L 66 78" stroke="#2D7A32" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="50" cy="70" r="1.5" fill="#3D8B37" />
      <circle cx="78" cy="50" r="1.5" fill="#3D8B37" />
      {/* Crispy Toast Marks */}
      <path d="M 32 80 C 36 84, 42 86, 50 87" stroke="#A85A0E" strokeWidth="2" strokeLinecap="round" />
      <path d="M 88 42 C 94 48, 98 56, 96 66" stroke="#A85A0E" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
};

/**
 * Universal Brand Logo Component
 * Automatically displays uploaded image, generated logo, or clean vector SVG
 */
export const RoastupLogo: React.FC<{ 
  className?: string; 
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtext?: boolean;
}> = ({ className = '', size = 'md', showSubtext = false }) => {
  const { logoUrl } = useBrandAssets();
  const [imgError, setImgError] = useState(false);

  const sizeClasses = {
    sm: 'h-7',
    md: 'h-10',
    lg: 'h-14',
    xl: 'h-20'
  };

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {!imgError && logoUrl ? (
        <img 
          src={logoUrl} 
          alt="ROASTIES Logo" 
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
          className={`${sizeClasses[size]} w-auto object-contain drop-shadow-xs`} 
        />
      ) : (
        <RoastupSvgLogo className={`${sizeClasses[size]} w-auto`} />
      )}
      {showSubtext && (
        <div className="flex flex-col leading-none">
          <span className="text-[10px] font-black uppercase tracking-widest text-amber-600">
            Crispy Roast Potatoes
          </span>
        </div>
      )}
    </div>
  );
};

export const RoastiesLogo = RoastupLogo;

/**
 * Universal Potato Icon Component
 */
export const RoastupPotatoIcon: React.FC<{ 
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}> = ({ className = '', size = 'md' }) => {
  const { iconUrl } = useBrandAssets();
  const [imgError, setImgError] = useState(false);

  const sizeClasses = {
    sm: 'w-7 h-7',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20'
  };

  return (
    <div className={`inline-flex items-center justify-center rounded-2xl overflow-hidden shrink-0 ${sizeClasses[size]} ${className}`}>
      {!imgError && iconUrl ? (
        <img 
          src={iconUrl} 
          alt="Roast Potato" 
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
          className="w-full h-full object-cover rounded-2xl" 
        />
      ) : (
        <RoastupSvgPotato className="w-full h-full" />
      )}
    </div>
  );
};

export const RoastupIcon = RoastupPotatoIcon;
export const RoastiesPotatoIcon = RoastupPotatoIcon;

/**
 * Brand Customizer / Uploader Modal
 * Allows the user to drop in their own exact custom logo & icon PNGs anytime
 */
export const BrandUploadModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const { logoUrl, iconUrl, updateLogo, updateIcon, resetBrand } = useBrandAssets();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const iconInputRef = useRef<HTMLInputElement>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'icon') => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const resized = await resizeImageFile(file, 600, 600, 0.88);
      if (type === 'logo') {
        updateLogo(resized);
        setUploadSuccess('ROASTUP Logo updated successfully across all screens!');
      } else {
        updateIcon(resized);
        setUploadSuccess('Roast Potato Icon updated successfully across all screens!');
      }
      setTimeout(() => setUploadSuccess(null), 3500);
    } catch (err) {
      console.error('Failed to process uploaded image', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl w-full max-w-lg shadow-2xl p-6 text-stone-900 dark:text-white space-y-6">
        <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-stone-900 dark:text-white">Brand Logo &amp; Icon Assets</h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">Upload your custom PNG files or use the default artwork</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 font-bold text-xs p-1"
          >
            ✕
          </button>
        </div>

        {uploadSuccess && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{uploadSuccess}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Logo Card */}
          <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex flex-col justify-between items-center text-center space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300">Brand Logo</span>
            <div className="h-20 w-full flex items-center justify-center p-2 bg-white dark:bg-stone-900 rounded-xl border border-stone-200/80 dark:border-stone-700 shadow-xs">
              <RoastupLogo size="lg" />
            </div>
            <input 
              type="file" 
              ref={logoInputRef} 
              onChange={(e) => handleFileChange(e, 'logo')} 
              accept="image/*" 
              className="hidden" 
            />
            <button
              type="button"
              onClick={() => logoInputRef.current?.click()}
              className="w-full py-2 px-3 rounded-xl bg-amber-400 hover:bg-amber-500 text-stone-950 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Custom Logo</span>
            </button>
          </div>

          {/* Icon Card */}
          <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex flex-col justify-between items-center text-center space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300">Potato Icon</span>
            <div className="h-20 w-full flex items-center justify-center p-2 bg-white dark:bg-stone-900 rounded-xl border border-stone-200/80 dark:border-stone-700 shadow-xs">
              <RoastupPotatoIcon size="lg" />
            </div>
            <input 
              type="file" 
              ref={iconInputRef} 
              onChange={(e) => handleFileChange(e, 'icon')} 
              accept="image/*" 
              className="hidden" 
            />
            <button
              type="button"
              onClick={() => iconInputRef.current?.click()}
              className="w-full py-2 px-3 rounded-xl bg-amber-400 hover:bg-amber-500 text-stone-950 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Custom Icon</span>
            </button>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between border-t border-stone-100 dark:border-stone-800 text-xs">
          <button
            type="button"
            onClick={resetBrand}
            className="text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200 font-semibold flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset to Default</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 dark:bg-stone-700 dark:hover:bg-stone-600 text-white font-bold transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Embedded Brand Assets Settings Section
 * To be rendered directly inside AdminHub.tsx Settings tab
 */
export const BrandAssetsSettingsSection: React.FC = () => {
  const { logoUrl, iconUrl, updateLogo, updateIcon, resetBrand } = useBrandAssets();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const iconInputRef = useRef<HTMLInputElement>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'icon') => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const resized = await resizeImageFile(file, 600, 600, 0.88);
      if (type === 'logo') {
        updateLogo(resized);
        setStatusMsg('Brand Logo updated across all registers, boards & customer screens!');
      } else {
        updateIcon(resized);
        setStatusMsg('Roast Potato Icon updated across all screens!');
      }
      setTimeout(() => setStatusMsg(null), 4000);
    } catch (err) {
      console.error('Failed to resize uploaded asset', err);
    }
  };

  return (
    <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-6 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-stone-100 dark:border-stone-800 pb-4">
        <div>
          <h3 className="text-base font-black text-stone-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Brand Logo &amp; Visual Assets</span>
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Upload your shop's custom logo and emblem. Changes appear instantly across POS registers, TV boards, and customer displays.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            resetBrand();
            setStatusMsg('Reset to default ROASTUP artwork.');
            setTimeout(() => setStatusMsg(null), 3000);
          }}
          className="self-start sm:self-auto px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reset Default Artwork</span>
        </button>
      </div>

      {statusMsg && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Brand Logo Card */}
        <div className="p-5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/80 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-stone-700 dark:text-stone-300">
              Primary Brand Logo
            </span>
            <span className="text-[11px] text-stone-400">Header &amp; Boards</span>
          </div>

          <div className="h-28 w-full flex items-center justify-center p-3 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-700 shadow-2xs">
            <RoastupLogo size="xl" />
          </div>

          <input 
            type="file" 
            ref={logoInputRef} 
            onChange={(e) => handleFile(e, 'logo')} 
            accept="image/*" 
            className="hidden" 
          />

          <button
            type="button"
            onClick={() => logoInputRef.current?.click()}
            className="w-full py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-500 text-stone-950 text-xs font-black flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Upload New Logo (PNG / JPG)</span>
          </button>
        </div>

        {/* Potato Icon Card */}
        <div className="p-5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/80 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-stone-700 dark:text-stone-300">
              Roast Emblem / Icon
            </span>
            <span className="text-[11px] text-stone-400">App icon &amp; Badges</span>
          </div>

          <div className="h-28 w-full flex items-center justify-center p-3 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-700 shadow-2xs">
            <RoastupPotatoIcon size="xl" />
          </div>

          <input 
            type="file" 
            ref={iconInputRef} 
            onChange={(e) => handleFile(e, 'icon')} 
            accept="image/*" 
            className="hidden" 
          />

          <button
            type="button"
            onClick={() => iconInputRef.current?.click()}
            className="w-full py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-500 text-stone-950 text-xs font-black flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Upload New Icon (PNG / JPG)</span>
          </button>
        </div>
      </div>
    </div>
  );
};


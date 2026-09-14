import React, { useState, useEffect, useRef } from 'react';
import { Upload, Sparkles, Image as ImageIcon, Check, RefreshCw } from 'lucide-react';

// Default generated high-res image assets
export const DEFAULT_ROASTUP_LOGO = '/src/assets/images/roastup_logo_1789405639770.jpg';
export const DEFAULT_POTATO_ICON = '/src/assets/images/potato_icon_1789405650527.jpg';

// Helper hook for persistent brand assets (stored in localStorage)
export function useBrandAssets() {
  const [logoUrl, setLogoUrl] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('roastup_custom_logo') || DEFAULT_ROASTUP_LOGO;
    }
    return DEFAULT_ROASTUP_LOGO;
  });

  const [iconUrl, setIconUrl] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('roastup_custom_icon') || DEFAULT_POTATO_ICON;
    }
    return DEFAULT_POTATO_ICON;
  });

  const updateLogo = (dataUrl: string) => {
    setLogoUrl(dataUrl);
    if (typeof window !== 'undefined') {
      localStorage.setItem('roastup_custom_logo', dataUrl);
    }
  };

  const updateIcon = (dataUrl: string) => {
    setIconUrl(dataUrl);
    if (typeof window !== 'undefined') {
      localStorage.setItem('roastup_custom_icon', dataUrl);
    }
  };

  const resetBrand = () => {
    setLogoUrl(DEFAULT_ROASTUP_LOGO);
    setIconUrl(DEFAULT_POTATO_ICON);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('roastup_custom_logo');
      localStorage.removeItem('roastup_custom_icon');
    }
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
      aria-label="ROASTUP"
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

      {/* ROASTUP Brush Lettering */}
      <text 
        x="200" 
        y="126" 
        textAnchor="middle" 
        fill={color} 
        fontFamily="'Impact', 'Arial Black', -apple-system, sans-serif" 
        fontWeight="900" 
        fontSize="82" 
        letterSpacing="-1.5px"
        fontStyle="italic"
        transform="rotate(-2 200 120)"
      >
        ROASTUP
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
          alt="ROASTUP Logo" 
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

/**
 * Universal Potato Icon Component
 */
export const RoastupPotatoIcon: React.FC<{ 
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}> = ({ className = '', size = 'md' }) => {
  const { iconUrl } = useBrandAssets();
  const [imgError, setImgError] = useState(false);

  const sizeClasses = {
    sm: 'w-7 h-7',
    md: 'w-10 h-10',
    lg: 'w-14 h-14'
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'icon') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const result = evt.target?.result as string;
      if (type === 'logo') {
        updateLogo(result);
        setUploadSuccess('ROASTUP Logo updated successfully across all screens!');
      } else {
        updateIcon(result);
        setUploadSuccess('Roast Potato Icon updated successfully across all screens!');
      }
      setTimeout(() => setUploadSuccess(null), 3000);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white border border-stone-200 rounded-3xl w-full max-w-lg shadow-2xl p-6 text-stone-900 space-y-6">
        <div className="flex items-center justify-between border-b border-stone-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-stone-900">Brand Logo &amp; Icon Assets</h3>
              <p className="text-xs text-stone-500">Upload your custom PNG files or use the default artwork</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 font-bold text-xs p-1"
          >
            ✕
          </button>
        </div>

        {uploadSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{uploadSuccess}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Logo Card */}
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex flex-col justify-between items-center text-center space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-600">Brand Logo</span>
            <div className="h-20 w-full flex items-center justify-center p-2 bg-white rounded-xl border border-stone-200/80 shadow-xs">
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
              className="w-full py-2 px-3 rounded-xl bg-amber-400 hover:bg-amber-500 text-stone-950 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Custom Logo</span>
            </button>
          </div>

          {/* Icon Card */}
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex flex-col justify-between items-center text-center space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-600">Potato Icon</span>
            <div className="h-20 w-full flex items-center justify-center p-2 bg-white rounded-xl border border-stone-200/80 shadow-xs">
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
              className="w-full py-2 px-3 rounded-xl bg-amber-400 hover:bg-amber-500 text-stone-950 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Custom Icon</span>
            </button>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between border-t border-stone-100 text-xs">
          <button
            type="button"
            onClick={resetBrand}
            className="text-stone-500 hover:text-stone-800 font-semibold flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset to Default</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

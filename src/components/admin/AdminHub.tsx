import React, { useState } from 'react';
import { 
  Settings, 
  Sliders, 
  Package, 
  Wifi, 
  Printer, 
  CreditCard, 
  Moon, 
  Sun, 
  Check, 
  RefreshCw, 
  AlertCircle, 
  Sparkles,
  Smartphone,
  Server,
  Layers,
  CheckCircle2,
  Tv
} from 'lucide-react';
import { 
  MenuItem, 
  InventoryItem, 
  AppCustomizationSettings, 
  PrinterConfig, 
  PaymentTerminalConfig,
  FontFamilyStyle,
  FontSizeScale,
  ScreenMode
} from '../../types';
import { MenuScreenStudio } from '../studio/MenuScreenStudio';
import { InventoryManager } from '../inventory/InventoryManager';
import { NetworkHub } from '../network/NetworkHub';
import { hardware } from '../../utils/hardware';
import { saveCustomizationLocally, applyCustomizationToDOM } from '../../data/customizationSettings';
import { BrandAssetsSettingsSection } from '../brand/RoastupBrand';

interface AdminHubProps {
  initialTab?: 'general' | 'menu_studio' | 'inventory' | 'printers' | 'payments' | 'network';
  menuItems: MenuItem[];
  onMenuUpdated: (items: MenuItem[]) => void;
  inventory: InventoryItem[];
  onRestock: (id: string, amount: number) => void;
  onToggleOut: (id: string, isOut: boolean) => void;
  customization: AppCustomizationSettings;
  onUpdateCustomization: (settings: AppCustomizationSettings) => void;
  onNavigateScreen?: (screen: ScreenMode) => void;
  onResetDefaults?: () => void;
}

export const AdminHub: React.FC<AdminHubProps> = ({
  initialTab = 'general',
  menuItems,
  onMenuUpdated,
  inventory,
  onRestock,
  onToggleOut,
  customization,
  onUpdateCustomization,
  onNavigateScreen = () => {},
  onResetDefaults
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'menu_studio' | 'inventory' | 'printers' | 'payments' | 'network'>(initialTab);
  const [bluetoothStatus, setBluetoothStatus] = useState<string>('idle');
  const [testPrintFeedback, setTestPrintFeedback] = useState<string | null>(null);
  const [paymentSavedMessage, setPaymentSavedMessage] = useState<string | null>(null);

  // Local printer config copy
  const printerConfig: PrinterConfig = customization.printer || {
    type: 'browser',
    paperWidth: 80,
    autoPrintOnPayment: true
  };

  // Local payment terminal config copy
  const paymentConfig: PaymentTerminalConfig = customization.paymentTerminal || {
    provider: 'simulator',
    status: 'connected',
    testMode: true
  };

  const handleToggleTheme = (mode: 'light' | 'dark') => {
    const updated: AppCustomizationSettings = {
      ...customization,
      themeMode: mode
    };
    onUpdateCustomization(updated);
    saveCustomizationLocally(updated);
    applyCustomizationToDOM(updated);

    fetch('/api/customization', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    }).catch(() => {});
  };

  const handleUpdateFont = (font: FontFamilyStyle) => {
    const updated: AppCustomizationSettings = {
      ...customization,
      fontFamily: font
    };
    onUpdateCustomization(updated);
    saveCustomizationLocally(updated);
    applyCustomizationToDOM(updated);

    fetch('/api/customization', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    }).catch(() => {});
  };

  const handleUpdateScale = (scale: FontSizeScale) => {
    const updated: AppCustomizationSettings = {
      ...customization,
      fontSizeScale: scale
    };
    onUpdateCustomization(updated);
    saveCustomizationLocally(updated);
    applyCustomizationToDOM(updated);

    fetch('/api/customization', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    }).catch(() => {});
  };

  const handleUpdatePrinter = (printerUpdates: Partial<PrinterConfig>) => {
    const updated: AppCustomizationSettings = {
      ...customization,
      printer: {
        ...printerConfig,
        ...printerUpdates
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

  const handleUpdatePayment = async (paymentUpdates: Partial<PaymentTerminalConfig>) => {
    const updatedTerminal: PaymentTerminalConfig = {
      ...paymentConfig,
      ...paymentUpdates
    };
    const updated: AppCustomizationSettings = {
      ...customization,
      paymentTerminal: updatedTerminal
    };
    onUpdateCustomization(updated);
    saveCustomizationLocally(updated);

    try {
      await fetch('/api/customization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      const providerLabel = updatedTerminal.provider === 'simulator' 
        ? 'Simulator' 
        : updatedTerminal.provider === 'stripe_terminal' 
        ? 'Stripe WisePOS E' 
        : updatedTerminal.provider === 'square_terminal'
        ? 'Square Terminal'
        : 'SumUp Air';
      setPaymentSavedMessage(`Card reader set to: ${providerLabel}`);
      setTimeout(() => setPaymentSavedMessage(null), 4000);
    } catch {
      // Still saved locally
    }
  };

  const handleConnectBluetooth = async () => {
    setBluetoothStatus('connecting');
    const res = await hardware.connectBluetoothPrinter();
    if (res.success) {
      setBluetoothStatus('connected');
      handleUpdatePrinter({
        type: 'bluetooth',
        deviceName: res.deviceName
      });
    } else {
      setBluetoothStatus(`error: ${res.error}`);
    }
  };

  const handleTestPrint = async () => {
    setTestPrintFeedback('Printing test receipt ticket...');
    const res = await hardware.printTestTicket(printerConfig);
    setTestPrintFeedback(res.message);
    setTimeout(() => setTestPrintFeedback(null), 4000);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#FBFBFA] dark:bg-stone-950 text-stone-900 dark:text-stone-100 overflow-hidden font-sans">
      {/* Top Admin Navigation Bar */}
      <div className="px-6 py-3.5 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 flex flex-wrap items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-400 text-stone-950 flex items-center justify-center font-black shadow-xs">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-stone-900 dark:text-white">Admin &amp; Settings Hub</h1>
            <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">Configure themes, menu items, stock levels, card terminals and receipt printers</p>
          </div>
        </div>

        {/* Tab Navigation Pills */}
        <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800 p-1 rounded-2xl border border-stone-200 dark:border-stone-700 text-xs overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('general')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              activeTab === 'general' ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-xs' : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Settings &amp; Branding</span>
          </button>

          <button
            onClick={() => setActiveTab('menu_studio')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              activeTab === 'menu_studio' ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-xs' : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <span>Menu Studio</span>
          </button>

          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              activeTab === 'inventory' ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-xs' : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Stock &amp; Inventory</span>
          </button>

          <button
            onClick={() => setActiveTab('printers')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              activeTab === 'printers' ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-xs' : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Receipt Printers</span>
          </button>

          <button
            onClick={() => setActiveTab('payments')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              activeTab === 'payments' ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-xs' : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Card Readers</span>
          </button>

          <button
            onClick={() => setActiveTab('network')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              activeTab === 'network' ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-xs' : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <Wifi className="w-3.5 h-3.5" />
            <span>Multi-Screen &amp; Network</span>
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'general' && (
          <div className="max-w-4xl mx-auto p-6 md:p-8 space-y-8">
            {/* Brand Logo & Mascot Upload Section */}
            <BrandAssetsSettingsSection />

            {/* Theme & Light/Dark Mode */}
            <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-6 shadow-xs space-y-4">
              <div>
                <h3 className="text-base font-black text-stone-900 dark:text-white">Theme &amp; Display Mode</h3>
                <p className="text-xs text-stone-500">Toggle between day-shift bright view and evening dark contrast</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleToggleTheme('light')}
                  className={`p-4 rounded-2xl border-2 flex items-center gap-3 transition-all cursor-pointer ${
                    customization.themeMode !== 'dark' 
                      ? 'border-amber-400 bg-amber-50/50 dark:bg-amber-950/20 text-stone-900' 
                      : 'border-stone-200 dark:border-stone-700 text-stone-600'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-900">
                    <Sun className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <span className="font-bold text-sm block">Light Mode</span>
                    <span className="text-[11px] text-stone-500">Crisp high-contrast day counter</span>
                  </div>
                </button>

                <button
                  onClick={() => handleToggleTheme('dark')}
                  className={`p-4 rounded-2xl border-2 flex items-center gap-3 transition-all cursor-pointer ${
                    customization.themeMode === 'dark' 
                      ? 'border-amber-400 bg-amber-50/50 dark:bg-stone-800 text-white' 
                      : 'border-stone-200 dark:border-stone-700 text-stone-600'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-stone-800 flex items-center justify-center text-amber-400">
                    <Moon className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <span className="font-bold text-sm block text-stone-900 dark:text-white">Dark Mode</span>
                    <span className="text-[11px] text-stone-500">Deep charcoal &amp; amber accents</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Typography & Scaling */}
            <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-6 shadow-xs space-y-4">
              <div>
                <h3 className="text-base font-black text-stone-900 dark:text-white">Typography &amp; Scale</h3>
                <p className="text-xs text-stone-500">Adjust the font style and size across registers and kitchen displays</p>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-2">Font Family</label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {(['sans', 'street', 'rounded', 'serif', 'diner', 'mono'] as FontFamilyStyle[]).map(f => (
                    <button
                      key={f}
                      onClick={() => handleUpdateFont(f)}
                      className={`p-2.5 rounded-xl border text-xs font-bold capitalize transition-all cursor-pointer ${
                        customization.fontFamily === f 
                          ? 'bg-amber-400 text-stone-950 border-amber-500 shadow-2xs' 
                          : 'bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-2">Text Scale</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['compact', 'normal', 'large', 'xl'] as FontSizeScale[]).map(s => (
                    <button
                      key={s}
                      onClick={() => handleUpdateScale(s)}
                      className={`p-2.5 rounded-xl border text-xs font-bold capitalize transition-all cursor-pointer ${
                        customization.fontSizeScale === s 
                          ? 'bg-amber-400 text-stone-950 border-amber-500 shadow-2xs' 
                          : 'bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'menu_studio' && (
          <MenuScreenStudio
            menuItems={menuItems}
            categories={customization.categoryOrder}
            customization={customization}
            onUpdateMenuItems={onMenuUpdated}
            onUpdateCustomization={onUpdateCustomization}
            onNavigateScreen={onNavigateScreen}
            onResetDefaults={onResetDefaults}
          />
        )}

        {activeTab === 'inventory' && (
          <InventoryManager
            inventory={inventory}
            onRestock={onRestock}
            onToggleOut={onToggleOut}
          />
        )}

        {activeTab === 'printers' && (
          <div className="max-w-3xl mx-auto p-6 md:p-8 space-y-6">
            <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-6 shadow-xs space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 flex items-center justify-center">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-stone-900 dark:text-white">Thermal Receipt Printer Setup</h3>
                  <p className="text-xs text-stone-500">Connect via Web Bluetooth or system thermal printer (58mm / 80mm ESC/POS)</p>
                </div>
              </div>

              {testPrintFeedback && (
                <div className="p-3 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 text-xs font-bold text-center">
                  {testPrintFeedback}
                </div>
              )}

              {/* Bluetooth Pairing Bar */}
              <div className="p-4 bg-stone-50 dark:bg-stone-800/60 rounded-2xl border border-stone-200/80 dark:border-stone-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-stone-900 dark:text-white">
                      Bluetooth Wireless ESC/POS Printer
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase ${
                      hardware.isBluetoothConnected() 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : 'bg-stone-200 text-stone-600'
                    }`}>
                      {hardware.isBluetoothConnected() ? 'Connected' : 'Unpaired'}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 mt-0.5">
                    {hardware.getConnectedDeviceName() || 'Works with Epson, Star, Rongta, Munbyn, Xprinter and standard BT thermal printers'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleConnectBluetooth}
                    className="px-4 py-2 rounded-xl bg-stone-900 dark:bg-white text-white dark:text-stone-950 font-black text-xs hover:bg-stone-800 cursor-pointer shadow-xs"
                  >
                    Pair Bluetooth Printer
                  </button>
                </div>
              </div>

              {/* Printer Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                    Thermal Paper Roll Width
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleUpdatePrinter({ paperWidth: 80 })}
                      className={`p-2.5 rounded-xl border text-xs font-bold cursor-pointer ${
                        printerConfig.paperWidth === 80 
                          ? 'bg-amber-400 text-stone-950 border-amber-500 font-black' 
                          : 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700'
                      }`}
                    >
                      80mm Standard (Wide)
                    </button>
                    <button
                      onClick={() => handleUpdatePrinter({ paperWidth: 58 })}
                      className={`p-2.5 rounded-xl border text-xs font-bold cursor-pointer ${
                        printerConfig.paperWidth === 58 
                          ? 'bg-amber-400 text-stone-950 border-amber-500 font-black' 
                          : 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700'
                      }`}
                    >
                      58mm Compact
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                    Printing Mode
                  </label>
                  <select
                    value={printerConfig.type}
                    onChange={e => handleUpdatePrinter({ type: e.target.value as any })}
                    className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2 text-xs font-medium"
                  >
                    <option value="browser">System Thermal Driver / Browser Print</option>
                    <option value="bluetooth">Direct Web Bluetooth ESC/POS</option>
                  </select>
                </div>
              </div>

              {/* Auto print toggle */}
              <div className="flex items-center justify-between p-3.5 bg-stone-50 dark:bg-stone-800/60 rounded-2xl border border-stone-200/80 dark:border-stone-700">
                <div>
                  <span className="font-bold text-xs text-stone-900 dark:text-white block">Auto-Print Receipt on Payment</span>
                  <span className="text-[11px] text-stone-500">Automatically dispatches receipt to printer once contactless payment succeeds</span>
                </div>
                <input
                  type="checkbox"
                  checked={printerConfig.autoPrintOnPayment}
                  onChange={e => handleUpdatePrinter({ autoPrintOnPayment: e.target.checked })}
                  className="w-4 h-4 accent-amber-500 cursor-pointer"
                />
              </div>

              {/* Test Ticket Button */}
              <div className="pt-2">
                <button
                  onClick={handleTestPrint}
                  className="w-full py-3 rounded-2xl bg-amber-400 hover:bg-amber-500 text-stone-950 font-black text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Sample Test Receipt Ticket</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="max-w-3xl mx-auto p-6 md:p-8 space-y-6">
            <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-6 shadow-xs space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 flex items-center justify-center">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-stone-900 dark:text-white">Payment Terminal &amp; Merchant Integrations</h3>
                  <p className="text-xs text-stone-500">Configure your countertop card reader (Stripe Terminal, Square Terminal, SumUp, or Vita Mojo Simulator)</p>
                </div>
              </div>

              {paymentSavedMessage && (
                <div className="p-3 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs font-black text-center animate-in fade-in duration-200">
                  ✓ {paymentSavedMessage}
                </div>
              )}

              {/* Provider Selection */}
              <div>
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-2">
                  Active Payment Provider
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    { id: 'simulator', title: 'Vita Mojo Tap Simulator', desc: 'Instant contactless test' },
                    { id: 'stripe_terminal', title: 'Stripe Terminal', desc: 'WisePOS E / BBPOS S700' },
                    { id: 'square_terminal', title: 'Square Terminal', desc: 'Square Terminal API' },
                    { id: 'sumup', title: 'SumUp Air / 3G', desc: 'SumUp Merchant Reader' }
                  ].map(p => (
                    <button
                      key={p.id}
                      onClick={() => handleUpdatePayment({ provider: p.id as any })}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                        paymentConfig.provider === p.id
                          ? 'border-amber-400 bg-amber-50/50 dark:bg-amber-950/30'
                          : 'border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800'
                      }`}
                    >
                      <span className="font-bold text-xs text-stone-900 dark:text-white block">{p.title}</span>
                      <span className="text-[10px] text-stone-500">{p.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Provider Details Fields */}
              {paymentConfig.provider === 'stripe_terminal' && (
                <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 space-y-3">
                  <span className="text-xs font-black uppercase text-stone-700 dark:text-stone-300 block">
                    Stripe Terminal Configuration
                  </span>
                  <div>
                    <label className="text-[11px] font-bold text-stone-500 block mb-1">Reader ID (e.g. tmr_xxx)</label>
                    <input
                      type="text"
                      value={paymentConfig.readerId || ''}
                      onChange={e => handleUpdatePayment({ readerId: e.target.value })}
                      placeholder="tmr_123456789"
                      className="w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-stone-500 block mb-1">Location ID</label>
                    <input
                      type="text"
                      value={paymentConfig.locationId || ''}
                      onChange={e => handleUpdatePayment({ locationId: e.target.value })}
                      placeholder="loc_123456789"
                      className="w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2 text-xs font-mono"
                    />
                  </div>
                </div>
              )}

              {paymentConfig.provider === 'square_terminal' && (
                <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 space-y-3">
                  <span className="text-xs font-black uppercase text-stone-700 dark:text-stone-300 block">
                    Square Terminal Configuration
                  </span>
                  <div>
                    <label className="text-[11px] font-bold text-stone-500 block mb-1">Device Pairing Code</label>
                    <input
                      type="text"
                      value={paymentConfig.deviceCode || ''}
                      onChange={e => handleUpdatePayment({ deviceCode: e.target.value })}
                      placeholder="e.g. 8-digit device code"
                      className="w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2 text-xs font-mono"
                    />
                  </div>
                </div>
              )}

              {paymentConfig.provider === 'sumup' && (
                <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 space-y-3">
                  <span className="text-xs font-black uppercase text-stone-700 dark:text-stone-300 block">
                    SumUp Terminal Configuration
                  </span>
                  <div>
                    <label className="text-[11px] font-bold text-stone-500 block mb-1">Merchant Affiliate Key / Reader ID</label>
                    <input
                      type="text"
                      value={paymentConfig.readerId || ''}
                      onChange={e => handleUpdatePayment({ readerId: e.target.value })}
                      placeholder="e.g. SUMUP-AIR-01"
                      className="w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2 text-xs font-mono"
                    />
                  </div>
                </div>
              )}

              {/* Status and Test Mode toggle */}
              <div className="flex items-center justify-between p-3.5 bg-stone-50 dark:bg-stone-800/60 rounded-2xl border border-stone-200/80 dark:border-stone-700">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-bold text-xs text-stone-900 dark:text-white">Terminal Status: Ready &amp; Connected</span>
                </div>

                <label className="flex items-center gap-2 text-xs font-bold text-stone-600 dark:text-stone-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={paymentConfig.testMode}
                    onChange={e => handleUpdatePayment({ testMode: e.target.checked })}
                    className="w-4 h-4 accent-amber-500"
                  />
                  <span>Sandbox Test Mode</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'network' && (
          <NetworkHub
            menuItems={menuItems}
            onMenuUpdated={onMenuUpdated}
            onNavigateScreen={onNavigateScreen}
          />
        )}
      </div>
    </div>
  );
};

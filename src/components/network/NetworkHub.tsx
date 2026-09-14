import React, { useState, useEffect, useRef } from 'react';
import { 
  Wifi, 
  Server, 
  Tv, 
  UtensilsCrossed, 
  TabletSmartphone, 
  Radio, 
  FileSpreadsheet, 
  Upload, 
  Download, 
  Copy, 
  ExternalLink, 
  Check, 
  Terminal, 
  Layers, 
  AlertCircle,
  RefreshCw,
  QrCode
} from 'lucide-react';
import { MenuItem, ServerNetworkInfo, DeviceInfo } from '../../types';
import { parseMenuSpreadsheet, exportMenuToExcel } from '../../utils/excelMenu';

interface NetworkHubProps {
  menuItems: MenuItem[];
  onMenuUpdated: (items: MenuItem[]) => void;
  onNavigateScreen: (screen: any) => void;
}

export const NetworkHub: React.FC<NetworkHubProps> = ({
  menuItems,
  onMenuUpdated,
  onNavigateScreen
}) => {
  const [networkInfo, setNetworkInfo] = useState<ServerNetworkInfo | null>(null);
  const [copiedUrlKey, setCopiedUrlKey] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [parsedPreview, setParsedPreview] = useState<MenuItem[] | null>(null);
  const [activeTab, setActiveTab] = useState<'devices' | 'xlsx_menu' | 'server_guide'>('devices');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch network info from server
  const fetchNetworkInfo = async () => {
    try {
      const res = await fetch('/api/network/info');
      if (res.ok) {
        const data = await res.json();
        setNetworkInfo(data);
      }
    } catch {}
  };

  useEffect(() => {
    fetchNetworkInfo();
    const interval = setInterval(fetchNetworkInfo, 5000);
    return () => clearInterval(interval);
  }, []);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedUrlKey(key);
    setTimeout(() => setCopiedUrlKey(null), 2000);
  };

  // Handle Excel upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadStatus(`Reading ${file.name}...`);
    const reader = new FileReader();

    reader.onload = async (evt) => {
      try {
        const buffer = evt.target?.result as ArrayBuffer;
        const parsed = parseMenuSpreadsheet(buffer);
        setParsedPreview(parsed);
        setUploadStatus(`Successfully parsed ${parsed.length} menu items from ${file.name}`);
      } catch (err: any) {
        setUploadStatus(`Error reading file: ${err.message || 'Invalid format'}`);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const applyParsedMenu = async () => {
    if (!parsedPreview) return;
    try {
      const res = await fetch('/api/menu/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: parsedPreview })
      });
      if (res.ok) {
        onMenuUpdated(parsedPreview);
        setParsedPreview(null);
        setUploadStatus('Menu successfully updated across all registers & digital signage screens!');
      }
    } catch {
      onMenuUpdated(parsedPreview);
      setParsedPreview(null);
    }
  };

  const resetToDefaultMenu = async () => {
    if (confirm('Reset entire catalog to the original ROASTUP recipe spreadsheet?')) {
      try {
        const res = await fetch('/api/menu/reset-default', { method: 'POST' });
        if (res.ok) {
          const menuRes = await fetch('/api/menu');
          const data = await menuRes.json();
          onMenuUpdated(data);
          setUploadStatus('Reset menu to factory default successfully.');
        }
      } catch {}
    }
  };

  // Base URL
  const currentBase = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

  const screenEndpoints = [
    {
      id: 'pos',
      name: 'Counter POS Register',
      desc: 'Used by cashiers on tablets or counter PCs to take orders and process card payments.',
      url: `${currentBase}?screen=pos`,
      icon: TabletSmartphone,
      badge: 'Cashier Station'
    },
    {
      id: 'kds',
      name: 'Kitchen Display Screen (KDS)',
      desc: 'Wall-mounted tablet/monitor above fryer line for live order prep and timers.',
      url: `${currentBase}?screen=kds`,
      icon: UtensilsCrossed,
      badge: 'Line Cook Station'
    },
    {
      id: 'signage_menu',
      name: 'Customer Digital Menu Board',
      desc: '1080p/4K TV display behind counter with auto-cycling categories and live sold-out sync.',
      url: `${currentBase}?screen=signage_menu`,
      icon: Tv,
      badge: 'Customer TV'
    },
    {
      id: 'order_status',
      name: 'Order Pickup Status Screen',
      desc: 'Overhead TV showing "PREPARING" vs "READY FOR PICKUP" order numbers with audio chime.',
      url: `${currentBase}?screen=order_status`,
      icon: Radio,
      badge: 'Collection Board'
    },
    {
      id: 'cfd',
      name: 'Customer-Facing Checkout Display (CFD)',
      desc: 'Touchscreen tablet facing customer showing live ticket breakdown and card tap prompt.',
      url: `${currentBase}?screen=cfd`,
      icon: TabletSmartphone,
      badge: 'Checkout Facing'
    }
  ];

  return (
    <div className="flex-1 flex flex-col bg-[#FBFBFA] text-stone-900 overflow-hidden select-none">
      {/* Top Header & Tab Navigation */}
      <div className="p-5 border-b border-stone-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-400 text-stone-950 flex items-center justify-center font-black shadow-xs">
              <Wifi className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-black text-stone-900 tracking-tight">Network &amp; Device Manager</h1>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Connect wireless iPads, smart TVs, and run from your own on-premise server or cloud
          </p>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-2xl border border-stone-200 text-xs">
          <button
            onClick={() => setActiveTab('devices')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
              activeTab === 'devices' ? 'bg-white text-stone-950 shadow-xs ring-1 ring-stone-200' : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            Connected Screens
          </button>
          <button
            onClick={() => setActiveTab('xlsx_menu')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
              activeTab === 'xlsx_menu' ? 'bg-white text-stone-950 shadow-xs ring-1 ring-stone-200' : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            Menu XLSX Setup
          </button>
          <button
            onClick={() => setActiveTab('server_guide')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
              activeTab === 'server_guide' ? 'bg-white text-stone-950 shadow-xs ring-1 ring-stone-200' : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            Run on Your Server Guide
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* TAB 1: CONNECTED DEVICES & DIGITAL SIGNAGE OPTIONS */}
        {activeTab === 'devices' && (
          <div className="space-y-6">
            {/* Server IP Info Banner */}
            <div className="p-4 rounded-3xl bg-white border border-stone-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-stone-900">Local Server Address</span>
                    <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Port 3000 Active
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 font-mono mt-0.5 font-medium">
                    {networkInfo?.localIps ? networkInfo.localIps.map(ip => `http://${ip}:3000`).join(' or ') : currentBase}
                  </p>
                </div>
              </div>

              <div className="text-xs text-stone-600 bg-stone-50 px-3.5 py-2 rounded-2xl border border-stone-200">
                Any device connected to your shop&apos;s Wi-Fi router can open these screen URLs directly.
              </div>
            </div>

            {/* Screen Endpoints Grid */}
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-stone-500 mb-3">
                Digital Signage &amp; Terminal Connectivity Links
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {screenEndpoints.map(endpoint => {
                  const Icon = endpoint.icon;
                  const isCopied = copiedUrlKey === endpoint.id;

                  return (
                    <div
                      key={endpoint.id}
                      className="bg-white border border-stone-200 rounded-3xl p-4 flex flex-col justify-between shadow-xs hover:border-amber-400 hover:shadow-sm transition-all"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center">
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-md bg-stone-100 text-stone-600 border border-stone-200/60">
                            {endpoint.badge}
                          </span>
                        </div>

                        <h4 className="font-extrabold text-sm text-stone-900">{endpoint.name}</h4>
                        <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                          {endpoint.desc}
                        </p>

                        <div className="mt-3 p-2.5 bg-stone-50 rounded-xl border border-stone-200 font-mono text-[11px] text-stone-600 truncate">
                          {endpoint.url}
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-stone-100 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => copyToClipboard(endpoint.url, endpoint.id)}
                          className="flex-1 py-2 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{isCopied ? 'Copied' : 'Copy URL'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onNavigateScreen(endpoint.id)}
                          className="py-2 px-3.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-stone-950 text-xs font-black transition-colors cursor-pointer shadow-2xs"
                        >
                          Launch
                        </button>

                        <a
                          href={endpoint.url}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-500 hover:text-stone-900 transition-colors"
                          title="Open in new window"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MENU XLSX / SPREADSHEET SETUP */}
        {activeTab === 'xlsx_menu' && (
          <div className="space-y-6">
            <div className="p-6 bg-white border border-stone-200 rounded-3xl space-y-4 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-extrabold text-stone-900 flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                    Menu Spreadsheet Import &amp; Export
                  </h3>
                  <p className="text-xs text-stone-500 mt-1">
                    Upload your initial roast potato menu Excel (.xlsx) file or export the active catalog
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => exportMenuToExcel(menuItems, 'xlsx')}
                    className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download Current Menu (.xlsx)
                  </button>

                  <button
                    onClick={() => exportMenuToExcel(menuItems, 'csv')}
                    className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    CSV
                  </button>

                  <button
                    onClick={resetToDefaultMenu}
                    className="px-3.5 py-2 rounded-xl bg-stone-50 hover:bg-stone-100 text-stone-500 hover:text-stone-900 border border-stone-200 text-xs font-bold transition-colors cursor-pointer"
                  >
                    Reset Factory
                  </button>
                </div>
              </div>

              {/* Upload Dropzone */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-stone-200 hover:border-amber-400 rounded-3xl p-8 text-center cursor-pointer bg-stone-50/50 hover:bg-amber-50/30 transition-all space-y-2"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-900 mx-auto flex items-center justify-center font-bold">
                  <Upload className="w-6 h-6" />
                </div>
                <h4 className="font-extrabold text-sm text-stone-900">Click or drag &amp; drop menu spreadsheet (.xlsx or .csv)</h4>
                <p className="text-xs text-stone-500 max-w-md mx-auto">
                  Accepts standard columns: Item Name, Variation Name, Description, SKU, Price, Category, Modifier Sets
                </p>
              </div>

              {uploadStatus && (
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-950 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                  <span className="font-medium">{uploadStatus}</span>
                </div>
              )}

              {/* Parsed Preview Table */}
              {parsedPreview && (
                <div className="mt-4 border border-stone-200 rounded-3xl overflow-hidden bg-white shadow-xs">
                  <div className="p-3.5 bg-stone-50 flex items-center justify-between border-b border-stone-200">
                    <span className="font-extrabold text-xs text-stone-900">
                      Previewing {parsedPreview.length} items from your upload
                    </span>
                    <button
                      onClick={applyParsedMenu}
                      className="px-4 py-1.5 bg-amber-400 hover:bg-amber-500 text-stone-950 font-black text-xs rounded-xl transition-colors cursor-pointer shadow-2xs"
                    >
                      Apply This Menu Now
                    </button>
                  </div>
                  <div className="max-h-60 overflow-y-auto divide-y divide-stone-100 text-xs p-2">
                    {parsedPreview.map((item, idx) => (
                      <div key={idx} className="p-2 flex items-center justify-between">
                        <div>
                          <strong className="text-stone-900">{item.name}</strong>
                          <span className="text-stone-500 ml-2">({item.category})</span>
                        </div>
                        <span className="font-mono text-stone-900 font-extrabold">
                          {item.variations.map(v => `${v.name}: £${v.price.toFixed(2)}`).join(' | ')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: RUN ON YOUR SERVER GUIDE */}
        {activeTab === 'server_guide' && (
          <div className="space-y-6 max-w-4xl">
            <div className="p-6 bg-white border border-stone-200 rounded-3xl space-y-4 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center">
                  <Terminal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-stone-900">How to Run from Your Own Server</h3>
                  <p className="text-xs text-stone-500">
                    Host on an on-premise Raspberry Pi, mini PC, Intel NUC, or private Linux VPS
                  </p>
                </div>
              </div>

              <div className="space-y-3 text-xs text-stone-700">
                <p className="leading-relaxed">
                  This system is built with a standard Node.js Express server + React client architecture. It does not depend on proprietary cloud lock-in and can run entirely inside your shop network.
                </p>

                <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 font-mono text-xs text-stone-800 space-y-2">
                  <p className="text-stone-400"># 1. Download or Export Project ZIP, then extract &amp; enter directory:</p>
                  <p className="font-bold text-stone-950">cd roastup-pos</p>
                  <p className="text-stone-400"># 2. Install all dependencies:</p>
                  <p className="font-bold text-stone-950">npm install</p>
                  <p className="text-stone-400"># 3. Build single bundled production server:</p>
                  <p className="font-bold text-stone-950">npm run build</p>
                  <p className="text-stone-400"># 4. Start production server (binds to 0.0.0.0:3000):</p>
                  <p className="font-bold text-stone-950">npm start</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200">
                    <h5 className="font-extrabold text-stone-900 mb-1">Local Network Setup (Wi-Fi)</h5>
                    <p className="text-stone-500 text-[11px] leading-relaxed">
                      Assign a static IP to your server (e.g. 192.168.1.100) in your router settings. Any tablet or smart TV connected to that Wi-Fi can open <code>http://192.168.1.100:3000</code>.
                    </p>
                  </div>

                  <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200">
                    <h5 className="font-extrabold text-stone-900 mb-1">Smart TV Digital Signage</h5>
                    <p className="text-stone-500 text-[11px] leading-relaxed">
                      Open the TV built-in web browser or plug in a FireTV / Chromecast / Raspberry Pi, navigate to <code>?screen=signage_menu</code>, and press F11 for borderless fullscreen.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

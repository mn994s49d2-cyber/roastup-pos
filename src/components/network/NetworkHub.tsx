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
  QrCode,
  Smartphone,
  Send,
  CheckCircle2,
  XCircle,
  Info,
  Globe,
  Zap,
  Code
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
  const [activeTab, setActiveTab] = useState<'devices' | 'customer_app' | 'xlsx_menu' | 'server_guide'>('devices');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Customer App Integration State
  const [customerAppUrl, setCustomerAppUrl] = useState<string>('http://localhost:3001');
  const [customerAppStatus, setCustomerAppStatus] = useState<'idle' | 'connected' | 'warning' | 'error'>('idle');
  const [customerAppMessage, setCustomerAppMessage] = useState<string | null>(null);
  const [isTestingLink, setIsTestingLink] = useState<boolean>(false);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationSuccess, setSimulationSuccess] = useState<string | null>(null);
  const [isSavingUrl, setIsSavingUrl] = useState<boolean>(false);
  const [copiedSnippet, setCopiedSnippet] = useState<boolean>(false);

  // Fetch Customer App config
  const fetchCustomerAppConfig = async () => {
    try {
      const res = await fetch('/api/customer-app/config');
      if (res.ok) {
        const data = await res.json();
        if (data.url) setCustomerAppUrl(data.url);
        if (data.lastStatus) setCustomerAppStatus(data.lastStatus);
        if (data.lastMessage) setCustomerAppMessage(data.lastMessage);
      }
    } catch {}
  };

  const handleSaveCustomerAppUrl = async () => {
    setIsSavingUrl(true);
    try {
      const res = await fetch('/api/customer-app/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: customerAppUrl })
      });
      if (res.ok) {
        setCustomerAppMessage('Customer App URL updated successfully on POS server');
        setTimeout(() => setCustomerAppMessage(null), 3500);
      }
    } catch {
      setCustomerAppMessage('Failed to save URL');
    } finally {
      setIsSavingUrl(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTestingLink(true);
    setCustomerAppMessage('Pinging customer app endpoint...');
    try {
      const res = await fetch('/api/customer-app/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: customerAppUrl })
      });
      const data = await res.json();
      if (data.status === 'connected') {
        setCustomerAppStatus('connected');
      } else if (data.status === 'auth_gate') {
        setCustomerAppStatus('warning');
      } else {
        setCustomerAppStatus('error');
      }
      setCustomerAppMessage(data.message);
    } catch (err: any) {
      setCustomerAppStatus('error');
      setCustomerAppMessage(`Network request failed: ${err.message || 'Host unreachable'}`);
    } finally {
      setIsTestingLink(false);
    }
  };

  const handleSimulateOrder = async () => {
    setIsSimulating(true);
    setSimulationSuccess(null);
    try {
      const res = await fetch('/api/customer-app/simulate-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerName: 'Sarah M. (Customer App)' })
      });
      if (res.ok) {
        const data = await res.json();
        setSimulationSuccess(`Order #${data.order.orderNumber} successfully received from Customer App into POS queue!`);
        setTimeout(() => setSimulationSuccess(null), 6000);
      }
    } catch (err: any) {
      setCustomerAppMessage(`Simulation failed: ${err.message}`);
    } finally {
      setIsSimulating(false);
    }
  };

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
    fetchCustomerAppConfig();
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
            onClick={() => setActiveTab('customer_app')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'customer_app' ? 'bg-white text-stone-950 shadow-xs ring-1 ring-stone-200' : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-amber-500" />
            <span>Customer App Link</span>
            <span className={`w-2 h-2 rounded-full ${
              customerAppStatus === 'connected' ? 'bg-emerald-500 ring-2 ring-emerald-200' :
              customerAppStatus === 'warning' ? 'bg-amber-400 ring-2 ring-amber-200' :
              customerAppStatus === 'error' ? 'bg-rose-500 ring-2 ring-rose-200' : 'bg-stone-300'
            }`} />
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

        {/* TAB 2: ONLINE CUSTOMER APP INTEGRATION */}
        {activeTab === 'customer_app' && (
          <div className="space-y-6 max-w-4xl">
            {/* Header / Status Banner */}
            <div className="p-6 bg-white border border-stone-200 rounded-3xl space-y-4 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-extrabold text-stone-900">Customer App &amp; Online Ordering Link</h3>
                      <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                        customerAppStatus === 'connected' 
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                          : customerAppStatus === 'warning'
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : customerAppStatus === 'error'
                          ? 'bg-rose-100 text-rose-800 border-rose-300'
                          : 'bg-stone-100 text-stone-700 border-stone-300'
                      }`}>
                        {customerAppStatus === 'connected' && '● Live Connected'}
                        {customerAppStatus === 'warning' && '▲ Cookie Gate (AI Studio Dev)'}
                        {customerAppStatus === 'error' && '✕ Disconnected'}
                        {customerAppStatus === 'idle' && '○ Untested'}
                      </span>
                    </div>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Directly connect your mobile ordering app to this POS server with real-time ticket ingestion
                    </p>
                  </div>
                </div>

                {/* Simulation Button */}
                <button
                  onClick={handleSimulateOrder}
                  disabled={isSimulating}
                  className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isSimulating ? 'Sending...' : 'Simulate Incoming Order'}</span>
                </button>
              </div>

              {/* Simulation Banner */}
              {simulationSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{simulationSuccess} Check the KDS or FOH screen to see it live!</span>
                </div>
              )}

              {/* Connection URL Configuration */}
              <div className="pt-2 border-t border-stone-100 space-y-3">
                <label className="block text-xs font-bold text-stone-700">
                  Customer App Target URL (Web App or Server Endpoint):
                </label>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="relative flex-1">
                    <Globe className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={customerAppUrl}
                      onChange={(e) => setCustomerAppUrl(e.target.value)}
                      placeholder="e.g. http://localhost:3001 or https://order.roasties.co.uk"
                      className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl font-mono text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white transition-all"
                    />
                  </div>
                  
                  <button
                    onClick={handleSaveCustomerAppUrl}
                    disabled={isSavingUrl}
                    className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                  >
                    {isSavingUrl ? 'Saving...' : 'Save URL'}
                  </button>

                  <button
                    onClick={handleTestConnection}
                    disabled={isTestingLink}
                    className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-stone-950 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTestingLink ? 'animate-spin' : ''}`} />
                    <span>{isTestingLink ? 'Testing...' : 'Test Link Now'}</span>
                  </button>
                </div>

                {/* Status Message Details */}
                {customerAppMessage && (
                  <div className={`p-3.5 rounded-2xl text-xs leading-relaxed border ${
                    customerAppStatus === 'connected'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : customerAppStatus === 'warning'
                      ? 'bg-amber-50 border-amber-200 text-amber-900'
                      : 'bg-rose-50 border-rose-200 text-rose-900'
                  }`}>
                    <div className="font-bold flex items-center gap-1.5 mb-1">
                      <Info className="w-3.5 h-3.5" />
                      <span>Diagnostics Feedback:</span>
                    </div>
                    <p>{customerAppMessage}</p>
                    {customerAppStatus === 'warning' && (
                      <p className="mt-1.5 text-[11px] text-amber-800">
                        <strong>Why this happens in AI Studio:</strong> Dev URLs like <code>ais-dev-*.run.app</code> are protected by Google user cookies, preventing server-to-server fetches between separate dev containers. When you deploy both apps on your server, there is no cookie barrier, and requests flow instantly.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Architecture Card: How They Work Together on Your Server */}
            <div className="p-6 bg-white border border-stone-200 rounded-3xl space-y-4 shadow-xs">
              <div className="flex items-center gap-2.5">
                <Zap className="w-5 h-5 text-amber-500" />
                <h4 className="font-extrabold text-sm text-stone-900">How POS &amp; Customer App Link Together on Your Server</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-1.5">
                  <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-900 font-black flex items-center justify-center text-xs">
                    1
                  </div>
                  <h5 className="font-bold text-stone-900">Direct Order Ingestion</h5>
                  <p className="text-stone-600 text-[11px] leading-relaxed">
                    Customer taps &quot;Order&quot; in the mobile app. The app makes a standard <code>POST /api/orders</code> to this POS server. Universal CORS is enabled, so no requests are blocked.
                  </p>
                </div>

                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-1.5">
                  <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-900 font-black flex items-center justify-center text-xs">
                    2
                  </div>
                  <h5 className="font-bold text-stone-900">Auto Inventory &amp; KDS</h5>
                  <p className="text-stone-600 text-[11px] leading-relaxed">
                    The POS server registers the ticket, deducts raw ingredients (potatoes, chicken, boxes), plays the order chime, and displays the blue &quot;Online&quot; tag on kitchen monitors.
                  </p>
                </div>

                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-1.5">
                  <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-900 font-black flex items-center justify-center text-xs">
                    3
                  </div>
                  <h5 className="font-bold text-stone-900">Live Status &amp; Bumping</h5>
                  <p className="text-stone-600 text-[11px] leading-relaxed">
                    Customer app polls <code>GET /api/orders/:id</code> for status updates. When the chef taps &quot;BUMP&quot; on the KDS, the customer&apos;s phone screen flips to &quot;Ready for Collection!&quot;.
                  </p>
                </div>
              </div>
            </div>

            {/* Code Snippet for Customer App */}
            <div className="p-6 bg-white border border-stone-200 rounded-3xl space-y-3 shadow-xs">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Code className="w-4 h-4 text-stone-700" />
                  <h4 className="font-extrabold text-sm text-stone-900">Code to Paste into Your Customer App Checkout</h4>
                </div>
                <button
                  onClick={() => {
                    const snippet = `// In your Customer App (checkout / orderService.ts)
const POS_URL = "${customerAppUrl.includes('localhost') ? 'http://localhost:3000' : typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}";

// 1. Submit Order to POS
export async function submitOrderToPos(cart, customer) {
  const response = await fetch(\`\${POS_URL}/api/orders\`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      source: 'online_customer_app',
      customerName: customer.name,
      customerPhone: customer.phone,
      customerNotes: customer.notes,
      type: customer.orderType || 'takeaway',
      tableNumber: customer.tableNumber || '',
      items: cart.items,
      subtotal: cart.subtotal,
      tax: cart.tax,
      total: cart.total,
      paymentStatus: 'paid',
      paymentMethod: 'contactless'
    })
  });
  return await response.json();
}

// 2. Poll Order Status for the Customer Screen
export async function getOrderStatusFromPos(orderId) {
  const response = await fetch(\`\${POS_URL}/api/orders/\${orderId}\`);
  return await response.json(); // returns { status: 'preparing' | 'ready' | 'completed' }
}`;
                    navigator.clipboard.writeText(snippet).catch(() => {});
                    setCopiedSnippet(true);
                    setTimeout(() => setCopiedSnippet(false), 2500);
                  }}
                  className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedSnippet ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSnippet ? 'Copied Snippet!' : 'Copy Code'}</span>
                </button>
              </div>

              <p className="text-xs text-stone-500">
                Simply replace the order submission in your customer app with this function. It posts directly to the POS server and receives the generated order number.
              </p>

              <pre className="p-4 bg-stone-900 text-amber-300 font-mono text-[11px] rounded-2xl overflow-x-auto leading-relaxed">
{`// 1. Submit Order to POS
const POS_URL = "${customerAppUrl.includes('localhost') ? 'http://localhost:3000' : typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}";

export async function submitOrderToPos(cart, customer) {
  const response = await fetch(\`\${POS_URL}/api/orders\`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      source: 'online_customer_app',
      customerName: customer.name,
      customerPhone: customer.phone,
      type: customer.orderType || 'takeaway',
      items: cart.items,
      subtotal: cart.subtotal,
      tax: cart.tax,
      total: cart.total,
      paymentStatus: 'paid'
    })
  });
  return await response.json(); // { id: "ord-...", orderNumber: 104, ... }
}

// 2. Check Live Order Status
export async function getOrderStatus(orderId) {
  const response = await fetch(\`\${POS_URL}/api/orders/\${orderId}\`);
  return await response.json(); // { status: "ready", preparedAt: "..." }
}`}
              </pre>
            </div>
          </div>
        )}
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

                {/* Hosting POS and Customer App Together */}
                <div className="mt-4 p-5 bg-amber-50/70 rounded-2xl border border-amber-200/80 space-y-3">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-amber-900" />
                    <h5 className="font-extrabold text-stone-950 text-sm">Hosting POS &amp; Customer App Together on 1 Server</h5>
                  </div>
                  <p className="text-stone-700 text-xs leading-relaxed">
                    You can effortlessly run both applications side-by-side on your server. For example:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-xs text-stone-700 font-medium">
                    <li><strong>POS System:</strong> Runs on <code>http://YOUR-SERVER-IP:3000</code> (or <code>pos.roasties.co.uk</code>)</li>
                    <li><strong>Online Customer App:</strong> Runs on <code>http://YOUR-SERVER-IP:3001</code> (or <code>order.roasties.co.uk</code>)</li>
                  </ul>
                  <p className="text-stone-700 text-xs leading-relaxed">
                    Because this POS server has universal CORS enabled, the customer app on port 3001 can directly post tickets to port 3000 without any browser security blocks or proxy friction.
                  </p>
                  <div className="bg-stone-900 text-amber-300 p-3 rounded-xl font-mono text-[11px] space-y-1">
                    <p className="text-stone-400"># Run both apps simultaneously with PM2:</p>
                    <p>pm2 start dist/server.cjs --name &quot;roastup-pos&quot; -- 3000</p>
                    <p>pm2 start &quot;node customer-app/server.js&quot; --name &quot;roastup-customer-app&quot; -- 3001</p>
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

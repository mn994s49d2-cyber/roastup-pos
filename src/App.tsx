/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ScreenMode, MenuItem, Order, InventoryItem, OrderStatus, AppCustomizationSettings } from './types';
import { INITIAL_MENU_ITEMS } from './data/defaultMenu';
import { INITIAL_INVENTORY } from './data/defaultInventory';
import { Navbar } from './components/Navbar';
import { PosRegister } from './components/pos/PosRegister';
import { KitchenDisplayScreen } from './components/kds/KitchenDisplayScreen';
import { FrontOfHouseScreen } from './components/foh/FrontOfHouseScreen';
import { OrderHistoryScreen } from './components/history/OrderHistoryScreen';
import { DigitalSignageMenu } from './components/signage/DigitalSignageMenu';
import { OrderStatusBoard } from './components/signage/OrderStatusBoard';
import { CustomerFacingDisplay } from './components/signage/CustomerFacingDisplay';
import { AdminHub } from './components/admin/AdminHub';
import { 
  DEFAULT_CUSTOMIZATION_SETTINGS, 
  loadCustomizationLocally, 
  saveCustomizationLocally, 
  applyCustomizationToDOM 
} from './data/customizationSettings';

// =========================================================================
// ADJUSTMENTS TO MAKE IN YOUR ROASTUP POS APP (on Google AI Studio)
// File: src/App.tsx (or wherever POS orders state is managed)
// =========================================================================

const CUSTOMER_APP_URL = "https://ais-dev-wzwlyr5z47t37eijstn6yp-692264068415.europe-west2.run.app";

export default function App() {
  // Screen mode detection via URL parameter (for dedicated device boot e.g. ?screen=kds)
  const getInitialScreen = (): ScreenMode => {
    if (typeof window !== 'undefined') {
      try {
        const params = new URLSearchParams(window.location.search);
        const s = params.get('screen') || params.get('mode');
        if (s === 'kds') return 'kds';
        if (s === 'foh' || s === 'drinks' || s === 'bar') return 'foh';
        if (s === 'history' || s === 'order_history') return 'order_history';
        if (s === 'signage_menu' || s === 'signage' || s === 'menu') return 'signage_menu';
        if (s === 'order_status' || s === 'pickup' || s === 'collection') return 'order_status';
        if (s === 'cfd' || s === 'customer') return 'cfd';
        if (s === 'admin' || s === 'settings') return 'admin';
        if (s === 'studio') return 'admin';
        if (s === 'inventory') return 'admin';
        if (s === 'network_hub' || s === 'network') return 'admin';
      } catch {
        // Fallback for restricted iframe environments
      }
    }
    return 'pos';
  };

  // Detect standalone TV mode (e.g. ?tv=true or ?standalone=true)
  const isStandaloneTv = (() => {
    if (typeof window !== 'undefined') {
      try {
        const params = new URLSearchParams(window.location.search);
        return params.get('tv') === 'true' || params.get('standalone') === 'true';
      } catch {}
    }
    return false;
  })();

  const [currentScreen, setCurrentScreen] = useState<ScreenMode>(getInitialScreen);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(INITIAL_MENU_ITEMS);
  const [orders, setOrders] = useState<Order[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>(INITIAL_INVENTORY);
  const [serverOnline, setServerOnline] = useState<boolean>(true);
  const [customization, setCustomization] = useState<AppCustomizationSettings>(loadCustomizationLocally);

  // Apply typography and theme classes on initial load and whenever customization changes
  useEffect(() => {
    applyCustomizationToDOM(customization);
  }, [customization]);

  // Sync state from server on mount and periodic interval
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [menuRes, ordersRes, invRes, customRes] = await Promise.all([
          fetch('/api/menu'),
          fetch('/api/orders'),
          fetch('/api/inventory'),
          fetch('/api/customization')
        ]);

        if (menuRes.ok) {
          const menuData = await menuRes.json();
          if (Array.isArray(menuData) && menuData.length > 0) setMenuItems(menuData);
        }

        if (ordersRes.ok) {
          const ordersData = await ordersRes.json();
          if (Array.isArray(ordersData)) {
            setOrders(prev => {
              // Merge server orders without regressing optimistic bump states or losing synced online orders
              const map = new Map(prev.map(o => [o.id, o]));
              ordersData.forEach((srv: Order) => {
                const local = map.get(srv.id);
                const isLocalMoreAdvanced =
                  (local?.status === 'completed' && srv.status !== 'completed') ||
                  (local?.status === 'ready' && srv.status === 'preparing');

                map.set(srv.id, {
                  ...srv,
                  kitchenBumped: srv.kitchenBumped ?? local?.kitchenBumped ?? false,
                  fohBumped: srv.fohBumped ?? local?.fohBumped ?? false,
                  status: isLocalMoreAdvanced && local ? local.status : srv.status
                });
              });
              return Array.from(map.values()).sort((a, b) => 
                new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
              );
            });
          }
        }

        if (invRes.ok) {
          const invData = await invRes.json();
          if (Array.isArray(invData)) setInventory(invData);
        }

        if (customRes.ok) {
          const customData = await customRes.json();
          if (customData && customData.fontFamily) {
            setCustomization(prev => {
              const currentTerminal = prev.paymentTerminal;
              const serverTerminal = customData.paymentTerminal;
              
              // Prevent background polling from reverting a configured card reader to simulator
              const resolvedTerminal = (currentTerminal && currentTerminal.provider && currentTerminal.provider !== 'simulator')
                ? { ...serverTerminal, ...currentTerminal }
                : (serverTerminal || currentTerminal);

              const merged: AppCustomizationSettings = {
                ...prev,
                ...customData,
                themeMode: customData.themeMode || prev.themeMode || 'light',
                paymentTerminal: resolvedTerminal,
                printer: customData.printer || prev.printer,
                digitalSignage: {
                  ...prev.digitalSignage,
                  ...(customData.digitalSignage || {})
                }
              };
              saveCustomizationLocally(merged);
              return merged;
            });
          }
        }

        setServerOnline(true);
      } catch {
        setServerOnline(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 2000); // 2s polling for fast station bumping
    return () => clearInterval(interval);
  }, []);

  // Synchronize orders with online customer app via backend proxy
  const syncOnlineOrders = async () => {
    try {
      const res = await fetch('/api/customer-app/orders');
      if (res.ok) {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const onlineOrders = await res.json();
          if (Array.isArray(onlineOrders) && onlineOrders.length > 0) {
            setOrders(prevOrders => {
              // Merge customer online orders into POS order queue
              const map = new Map(prevOrders.map(o => [o.id, o]));
              onlineOrders.forEach((order: any) => {
                const existing = map.get(order.id);
                map.set(order.id, {
                  ...order,
                  source: order.source || 'online_customer_app',
                  // Preserve optimistic local bump states if already bumped in POS
                  kitchenBumped: order.kitchenBumped ?? existing?.kitchenBumped ?? false,
                  fohBumped: order.fohBumped ?? existing?.fohBumped ?? false,
                  status: (existing?.status === 'completed' && order.status !== 'completed')
                    ? 'completed'
                    : (existing?.status === 'ready' && order.status === 'preparing')
                    ? 'ready'
                    : (order.status || 'pending'),
                  type: order.type === 'dine_in' ? 'dine_in' : 'takeaway',
                });
              });
              return Array.from(map.values()).sort((a, b) => 
                new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
              );
            });
          }
        }
      }
    } catch {
      // Silent catch for smooth background polling
    }
  };

  // Poll online orders every 3 seconds
  useEffect(() => {
    syncOnlineOrders();
    const interval = setInterval(syncOnlineOrders, 3000);
    return () => clearInterval(interval);
  }, []);

  // Forward kitchen bump event to customer app
  const onBumpKitchen = async (orderId: string, unbump: boolean = false) => {
    try {
      await fetch(`/api/customer-app/orders/${orderId}/bump`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ station: 'kitchen', unbump })
      });
    } catch (e) {
      console.warn("Failed to notify customer app:", e);
    }
  };

  // Update browser URL query parameter when screen changes
  const handleSelectScreen = (screen: ScreenMode) => {
    setCurrentScreen(screen);
    if (typeof window !== 'undefined' && window.history) {
      try {
        const url = new URL(window.location.href);
        url.searchParams.set('screen', screen);
        window.history.replaceState({}, '', url.toString());
      } catch {
        // Silently skip if history modification is blocked in iframe
      }
    }
  };

  // Order created in POS
  const handleOrderCreated = (order: Order) => {
    setOrders(prev => [order, ...prev]);
  };

  // Order status update (e.g. from KDS or History)
  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));

    try {
      await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
    } catch {}
  };

  // Bump station: Kitchen (hot food line)
  // Kitchen bumps order off completely; food is marked ready for FOH; FOH shows green; FOH performs final bump
  const handleBumpKitchen = async (orderId: string, unbump: boolean = false) => {
    const now = new Date().toISOString();
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          kitchenBumped: !unbump,
          status: !unbump ? 'ready' : 'preparing',
          preparedAt: !unbump ? now : undefined
        };
      }
      return o;
    }));

    // Send bump event to customer app so the customer gets notified in real-time!
    await onBumpKitchen(orderId, unbump);

    try {
      const res = await fetch(`/api/orders/${orderId}/bump`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ station: 'kitchen', unbump })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.order) {
          setOrders(prev => prev.map(o => o.id === orderId ? data.order : o));
        }
      }
    } catch {}
  };

  // Bump station: Front of House (drinks & final handover)
  const handleBumpFoh = async (orderId: string) => {
    const now = new Date().toISOString();
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          fohBumped: true,
          status: 'completed',
          completedAt: now
        };
      }
      return o;
    }));

    // Notify customer app that order has been completed/handed over
    try {
      let res: Response | null = null;
      try {
        res = await fetch(`${CUSTOMER_APP_URL}/api/orders/${orderId}/bump`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ station: 'foh', unbump: false })
        });
      } catch {
        res = await fetch(`/api/customer-app/orders/${orderId}/bump`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ station: 'foh', unbump: false })
        });
      }
    } catch (e) {
      console.warn("Failed to notify customer app of FOH bump:", e);
    }

    try {
      const res = await fetch(`/api/orders/${orderId}/bump`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ station: 'foh' })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.order) {
          setOrders(prev => prev.map(o => o.id === orderId ? data.order : o));
        }
      }
    } catch {}
  };

  // Refund Order (from Order History)
  const handleRefundOrder = async (orderId: string) => {
    const timestamp = new Date().toISOString();
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          paymentStatus: 'refunded',
          refundedAt: timestamp,
          status: 'cancelled'
        };
      }
      return o;
    }));

    try {
      await fetch(`/api/orders/${orderId}/refund`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' }
      });
    } catch {}
  };

  // Inventory Restock
  const handleRestock = async (id: string, amount: number) => {
    setInventory(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, currentStock: item.currentStock + amount, isOut: false };
      }
      return item;
    }));

    try {
      await fetch('/api/inventory/restock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, amount })
      });
    } catch {}
  };

  // Inventory 86 Toggle
  const handleToggleOut = async (id: string, isOut: boolean) => {
    setInventory(prev => prev.map(item => item.id === id ? { ...item, isOut } : item));

    try {
      await fetch(`/api/inventory/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isOut })
      });
    } catch {}
  };

  // Menu items update from Studio
  const handleMenuUpdated = (items: MenuItem[]) => {
    setMenuItems(items);
  };

  const handleUpdateCustomization = (settings: AppCustomizationSettings) => {
    setCustomization(settings);
    saveCustomizationLocally(settings);
    applyCustomizationToDOM(settings);

    fetch('/api/customization', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    }).catch(() => {});
  };

  const handleResetDefaults = async () => {
    setMenuItems(INITIAL_MENU_ITEMS);
    setCustomization(DEFAULT_CUSTOMIZATION_SETTINGS);
    saveCustomizationLocally(DEFAULT_CUSTOMIZATION_SETTINGS);
    applyCustomizationToDOM(DEFAULT_CUSTOMIZATION_SETTINGS);

    try {
      await Promise.all([
        fetch('/api/customization', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(DEFAULT_CUSTOMIZATION_SETTINGS)
        }),
        fetch('/api/menu/reorder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: INITIAL_MENU_ITEMS, categoryOrder: DEFAULT_CUSTOMIZATION_SETTINGS.categoryOrder })
        })
      ]);
    } catch {}
  };

  // KPI counts
  const kitchenOrdersCount = orders.filter(o => !o.kitchenBumped && (o.status === 'pending' || o.status === 'preparing')).length;
  const fohOrdersCount = orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled').length;
  const lowStockCount = inventory.filter(i => i.currentStock <= i.minThreshold).length;

  // TV & Customer display screens hide the main application navbar completely for genuine full-screen TV view
  const isTvDisplayScreen = currentScreen === 'signage_menu' || currentScreen === 'order_status' || currentScreen === 'cfd';
  const shouldRenderNavbar = !isTvDisplayScreen;

  return (
    <div className={`h-screen max-h-screen flex flex-col overflow-hidden font-sans select-none selection:bg-amber-400 selection:text-stone-950 ${
      customization.themeMode === 'dark' ? 'dark bg-stone-950 text-stone-100' : 'bg-[#FBFBFA] text-stone-900'
    }`}>
      {/* Top Application Navbar (Suppressed on TV & Customer Screens) */}
      {shouldRenderNavbar && (
        <Navbar
          currentScreen={currentScreen}
          onSelectScreen={handleSelectScreen}
          activeOrdersCount={kitchenOrdersCount}
          fohOrdersCount={fohOrdersCount}
          lowStockCount={lowStockCount}
          serverOnline={serverOnline}
          customization={customization}
          onUpdateCustomization={handleUpdateCustomization}
        />
      )}

      {/* Main View Area */}
      <main className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {currentScreen === 'pos' && (
          <PosRegister
            menuItems={menuItems}
            onOrderCreated={handleOrderCreated}
            customization={customization}
            onOpenStudio={() => handleSelectScreen('admin')}
          />
        )}

        {currentScreen === 'kds' && (
          <KitchenDisplayScreen
            orders={orders}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            onBumpKitchen={handleBumpKitchen}
          />
        )}

        {currentScreen === 'foh' && (
          <FrontOfHouseScreen
            orders={orders}
            onBumpFoh={handleBumpFoh}
            onUpdateOrderStatus={handleUpdateOrderStatus}
          />
        )}

        {currentScreen === 'order_history' && (
          <OrderHistoryScreen
            orders={orders}
            customization={customization}
            onRefundOrder={handleRefundOrder}
          />
        )}

        {currentScreen === 'signage_menu' && (
          <DigitalSignageMenu
            menuItems={menuItems}
            customization={customization}
            standaloneTvMode={true}
            onExit={() => handleSelectScreen('pos')}
          />
        )}

        {currentScreen === 'order_status' && (
          <OrderStatusBoard
            orders={orders}
            standaloneTvMode={true}
            onExit={() => handleSelectScreen('pos')}
          />
        )}

        {currentScreen === 'cfd' && (
          <CustomerFacingDisplay
            standaloneTvMode={true}
            onExit={() => handleSelectScreen('pos')}
          />
        )}

        {currentScreen === 'admin' && (
          <AdminHub
            menuItems={menuItems}
            onMenuUpdated={handleMenuUpdated}
            inventory={inventory}
            onRestock={handleRestock}
            onToggleOut={handleToggleOut}
            customization={customization}
            onUpdateCustomization={handleUpdateCustomization}
            onNavigateScreen={handleSelectScreen}
            onResetDefaults={handleResetDefaults}
          />
        )}
      </main>
    </div>
  );
}

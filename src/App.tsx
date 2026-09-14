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
import { DigitalSignageMenu } from './components/signage/DigitalSignageMenu';
import { OrderStatusBoard } from './components/signage/OrderStatusBoard';
import { CustomerFacingDisplay } from './components/signage/CustomerFacingDisplay';
import { InventoryManager } from './components/inventory/InventoryManager';
import { NetworkHub } from './components/network/NetworkHub';
import { MenuScreenStudio } from './components/studio/MenuScreenStudio';
import { 
  DEFAULT_CUSTOMIZATION_SETTINGS, 
  loadCustomizationLocally, 
  saveCustomizationLocally, 
  applyCustomizationToDOM 
} from './data/customizationSettings';

export default function App() {
  // Screen mode detection via URL parameter (for dedicated device boot e.g. ?screen=kds)
  const getInitialScreen = (): ScreenMode => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const s = params.get('screen') || params.get('mode');
      if (s === 'kds') return 'kds';
      if (s === 'signage_menu' || s === 'signage' || s === 'menu') return 'signage_menu';
      if (s === 'studio' || s === 'customizer') return 'studio';
      if (s === 'order_status' || s === 'pickup') return 'order_status';
      if (s === 'cfd' || s === 'customer') return 'cfd';
      if (s === 'inventory') return 'inventory';
      if (s === 'network_hub' || s === 'network' || s === 'devices') return 'network_hub';
    }
    return 'pos';
  };

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
          if (Array.isArray(ordersData)) setOrders(ordersData);
        }

        if (invRes.ok) {
          const invData = await invRes.json();
          if (Array.isArray(invData)) setInventory(invData);
        }

        if (customRes.ok) {
          const customData = await customRes.json();
          if (customData && customData.fontFamily) {
            setCustomization(customData);
            saveCustomizationLocally(customData);
          }
        }

        setServerOnline(true);
      } catch {
        setServerOnline(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 2500); // 2.5s polling for multi-device sync
    return () => clearInterval(interval);
  }, []);

  // Update browser URL query parameter when screen changes so users can bookmark/share
  const handleSelectScreen = (screen: ScreenMode) => {
    setCurrentScreen(screen);
    if (typeof window !== 'undefined' && window.history) {
      const url = new URL(window.location.href);
      url.searchParams.set('screen', screen);
      window.history.replaceState({}, '', url.toString());
    }
  };

  // Order created in POS
  const handleOrderCreated = (order: Order) => {
    setOrders(prev => [order, ...prev]);
  };

  // Order status update in KDS
  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus) => {
    // Optimistic update
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));

    try {
      await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
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

    // If item is out, update related menu items if applicable
    try {
      await fetch(`/api/inventory/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isOut })
      });
    } catch {}
  };

  // Menu items update from Studio or XLSX upload
  const handleMenuUpdated = (items: MenuItem[]) => {
    setMenuItems(items);
  };

  const handleUpdateCustomization = (settings: AppCustomizationSettings) => {
    setCustomization(settings);
    saveCustomizationLocally(settings);
    applyCustomizationToDOM(settings);
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
  const activeOrdersCount = orders.filter(o => o.status === 'pending' || o.status === 'preparing').length;
  const lowStockCount = inventory.filter(i => i.currentStock <= i.minThreshold).length;

  return (
    <div className="min-h-screen flex flex-col bg-[#FBFBFA] font-sans text-stone-900 selection:bg-amber-400 selection:text-stone-950">
      {/* Top Application Navbar */}
      <Navbar
        currentScreen={currentScreen}
        onSelectScreen={handleSelectScreen}
        activeOrdersCount={activeOrdersCount}
        lowStockCount={lowStockCount}
        serverOnline={serverOnline}
      />

      {/* Main View Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {currentScreen === 'pos' && (
          <PosRegister
            menuItems={menuItems}
            onOrderCreated={handleOrderCreated}
            customization={customization}
            onOpenStudio={() => handleSelectScreen('studio')}
          />
        )}

        {currentScreen === 'studio' && (
          <MenuScreenStudio
            menuItems={menuItems}
            categories={customization.categoryOrder}
            customization={customization}
            onUpdateMenuItems={handleMenuUpdated}
            onUpdateCustomization={handleUpdateCustomization}
            onNavigateScreen={handleSelectScreen}
            onResetDefaults={handleResetDefaults}
          />
        )}

        {currentScreen === 'kds' && (
          <KitchenDisplayScreen
            orders={orders}
            onUpdateOrderStatus={handleUpdateOrderStatus}
          />
        )}

        {currentScreen === 'signage_menu' && (
          <DigitalSignageMenu
            menuItems={menuItems}
            customization={customization}
            onOpenStudio={() => handleSelectScreen('studio')}
          />
        )}

        {currentScreen === 'order_status' && (
          <OrderStatusBoard
            orders={orders}
          />
        )}

        {currentScreen === 'cfd' && (
          <CustomerFacingDisplay />
        )}

        {currentScreen === 'inventory' && (
          <InventoryManager
            inventory={inventory}
            onRestock={handleRestock}
            onToggleOut={handleToggleOut}
          />
        )}

        {currentScreen === 'network_hub' && (
          <NetworkHub
            menuItems={menuItems}
            onMenuUpdated={handleMenuUpdated}
            onNavigateScreen={handleSelectScreen}
          />
        )}
      </main>
    </div>
  );
}

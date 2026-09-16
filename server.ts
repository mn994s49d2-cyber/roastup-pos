import express from 'express';
import path from 'path';
import os from 'os';
import { createServer as createViteServer } from 'vite';
import { INITIAL_MENU_ITEMS } from './src/data/defaultMenu.ts';
import { INITIAL_INVENTORY } from './src/data/defaultInventory.ts';

const app = express();
const PORT = 3000;

// In-memory persistent state (persists across connected clients on network)
let menuItems = [...INITIAL_MENU_ITEMS];
let inventoryItems = [...INITIAL_INVENTORY];
let orders: any[] = [
  {
    id: 'ord-101',
    orderNumber: 101,
    timestamp: new Date(Date.now() - 8 * 60000).toISOString(),
    type: 'dine_in',
    items: [
      {
        cartItemId: 'c1',
        menuItemId: 'item-001',
        name: 'The OG Loaded',
        category: 'Loaded Roast Potatoes',
        variation: { id: 'v-og-m', name: 'Medium', sku: 'ROASTUP-002', price: 6.50 },
        selectedModifiers: [],
        unitPrice: 6.50,
        quantity: 1,
        totalPrice: 6.50,
        specialAdditions: ['Extra crispy roasties']
      },
      {
        cartItemId: 'c2',
        menuItemId: 'item-028',
        name: 'Canned Soft Drink',
        category: 'Drinks',
        variation: { id: 'v-can-std', name: 'Standard', sku: 'ROASTUP-048', price: 1.50 },
        selectedModifiers: [{ setId: 'can-flavour', setName: 'Drink Flavour', optionId: 'can-coke', optionName: 'Coca-Cola (Original)', priceDelta: 0 }],
        unitPrice: 1.50,
        quantity: 1,
        totalPrice: 1.50
      }
    ],
    subtotal: 6.67,
    tax: 1.33,
    total: 8.00,
    status: 'ready',
    kitchenBumped: true,
    paymentMethod: 'card_terminal',
    paymentStatus: 'paid',
    cardBrand: 'Visa',
    cardLast4: '4242',
    paymentRef: 'TXN-984210',
    preparedAt: new Date(Date.now() - 2 * 60000).toISOString()
  },
  {
    id: 'ord-102',
    orderNumber: 102,
    timestamp: new Date(Date.now() - 4 * 60000).toISOString(),
    type: 'takeaway',
    kitchenBumped: false,
    items: [
      {
        cartItemId: 'c3',
        menuItemId: 'item-004',
        name: 'The Roast Dinner',
        category: 'Loaded Roast Potatoes',
        variation: { id: 'v-roast-l', name: 'Large', sku: 'ROASTUP-012', price: 9.50 },
        selectedModifiers: [],
        specialAdditions: ['Extra Gravy on side'],
        unitPrice: 9.50,
        quantity: 1,
        totalPrice: 9.50
      },
      {
        cartItemId: 'c4',
        menuItemId: 'item-007',
        name: 'The Roast Wrap',
        category: 'Roti Roast Potato Wraps',
        variation: { id: 'v-wrap-std', name: 'Standard', sku: 'ROASTUP-019', price: 7.50 },
        selectedModifiers: [],
        specialRemovals: ['NO Garlic Mayo (Allergy)'],
        unitPrice: 7.50,
        quantity: 1,
        totalPrice: 7.50
      }
    ],
    subtotal: 14.17,
    tax: 2.83,
    total: 17.00,
    status: 'preparing',
    paymentMethod: 'contactless',
    paymentStatus: 'paid',
    cardBrand: 'Apple Pay',
    cardLast4: '8821',
    paymentRef: 'TXN-984211'
  }
];

let nextOrderNumber = 103;
let activeCfdCart: any = {
  items: [],
  subtotal: 0,
  tax: 0,
  total: 0,
  orderType: 'takeaway',
  customerGreeting: 'Welcome to ROASTIES!'
};

let connectedDevices: any[] = [];

let customizationSettings = {
  themeMode: 'light',
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

app.use(express.json({ limit: '15mb' }));

// Helper to determine local IP addresses
function getLocalNetworkIPs(): string[] {
  const interfaces = os.networkInterfaces();
  const ips: string[] = [];
  for (const devName in interfaces) {
    const iface = interfaces[devName];
    if (iface) {
      for (const alias of iface) {
        if (alias.family === 'IPv4' && !alias.internal) {
          ips.push(alias.address);
        }
      }
    }
  }
  return ips.length > 0 ? ips : ['127.0.0.1'];
}

// ----------------- API ROUTES ----------------- //

// Health
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString(), totalOrders: orders.length });
});

// Network info & device discovery
app.get('/api/network/info', (req, res) => {
  const localIPs = getLocalNetworkIPs();
  const primaryIP = localIPs[0] || 'localhost';
  const reqHost = req.get('host') || `${primaryIP}:${PORT}`;
  const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
  const baseUrl = `${protocol}://${reqHost}`;

  res.json({
    host: reqHost,
    port: PORT,
    localIps: localIPs,
    primaryIp: primaryIP,
    baseUrl,
    urls: {
      pos: `${baseUrl}?screen=pos`,
      kds: `${baseUrl}?screen=kds`,
      signageMenu: `${baseUrl}?screen=signage_menu`,
      orderStatus: `${baseUrl}?screen=order_status`,
      cfd: `${baseUrl}?screen=cfd`,
      inventory: `${baseUrl}?screen=inventory`,
      networkHub: `${baseUrl}?screen=network_hub`
    },
    connectedDevices
  });
});

// Register or ping a connected device (e.g. Kitchen iPad, Customer TV)
app.post('/api/network/register-device', (req, res) => {
  const { id, name, type } = req.body;
  const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
  const existingIdx = connectedDevices.findIndex(d => d.id === id);

  const deviceData = {
    id: id || `dev-${Date.now()}`,
    name: name || `${type.toUpperCase()} Station`,
    type: type || 'pos',
    ipAddress,
    lastActive: new Date().toISOString(),
    status: 'online'
  };

  if (existingIdx >= 0) {
    connectedDevices[existingIdx] = deviceData;
  } else {
    connectedDevices.push(deviceData);
  }

  // Prune devices inactive for > 15 mins
  const now = Date.now();
  connectedDevices = connectedDevices.filter(d => {
    return now - new Date(d.lastActive).getTime() < 15 * 60 * 1000;
  });

  res.json({ success: true, device: deviceData, totalConnected: connectedDevices.length });
});

// Customization & Typography Settings Endpoints
app.get('/api/customization', (req, res) => {
  res.json(customizationSettings);
});

app.post('/api/customization', (req, res) => {
  const newSettings = req.body;
  if (newSettings && typeof newSettings === 'object') {
    customizationSettings = {
      ...customizationSettings,
      ...newSettings,
      digitalSignage: {
        ...customizationSettings.digitalSignage,
        ...(newSettings.digitalSignage || {})
      }
    };
    res.json({ success: true, settings: customizationSettings });
  } else {
    res.status(400).json({ error: 'Invalid settings payload' });
  }
});

// Menu Endpoints
app.get('/api/menu', (req, res) => {
  res.json(menuItems);
});

// Add new menu item
app.post('/api/menu/item', (req, res) => {
  const newItem = req.body;
  if (!newItem || !newItem.name) {
    return res.status(400).json({ error: 'Item name is required' });
  }

  const createdItem = {
    ...newItem,
    id: newItem.id || `item-${Date.now()}`,
    category: newItem.category || 'Loaded Roast Potatoes',
    itemType: newItem.itemType || 'Prepared food and beverage',
    description: newItem.description || '',
    inStock: newItem.inStock !== false,
    defaultPrice: typeof newItem.defaultPrice === 'number' ? newItem.defaultPrice : 6.50,
    variations: Array.isArray(newItem.variations) && newItem.variations.length > 0 
      ? newItem.variations 
      : [{ id: `v-${Date.now()}`, name: 'Standard', sku: `ROAST-${Date.now().toString().slice(-4)}`, price: newItem.defaultPrice || 6.50 }],
    tags: Array.isArray(newItem.tags) ? newItem.tags : [],
    imageUrl: newItem.imageUrl || ''
  };

  menuItems.push(createdItem);
  res.status(201).json({ success: true, item: createdItem });
});

// Full update of menu item (name, category, description, price, variations, imageUrl, tags, etc.)
app.put('/api/menu/item/:id', (req, res) => {
  const { id } = req.params;
  const updatedData = req.body;
  const idx = menuItems.findIndex(i => i.id === id);

  if (idx >= 0) {
    menuItems[idx] = {
      ...menuItems[idx],
      ...updatedData,
      id // preserve ID
    };
    res.json({ success: true, item: menuItems[idx] });
  } else {
    res.status(404).json({ error: 'Menu item not found' });
  }
});

// Delete menu item
app.delete('/api/menu/item/:id', (req, res) => {
  const { id } = req.params;
  const beforeLen = menuItems.length;
  menuItems = menuItems.filter(i => i.id !== id);

  if (menuItems.length < beforeLen) {
    res.json({ success: true, deletedId: id });
  } else {
    res.status(404).json({ error: 'Menu item not found' });
  }
});

// Reorder menu items
app.post('/api/menu/reorder', (req, res) => {
  const { items, categoryOrder } = req.body;
  if (Array.isArray(items)) {
    menuItems = items;
  }
  if (Array.isArray(categoryOrder)) {
    customizationSettings.categoryOrder = categoryOrder;
  }
  res.json({ success: true, count: menuItems.length });
});

app.post('/api/menu/update-item', (req, res) => {
  const { id, inStock, price, variations } = req.body;
  const itemIndex = menuItems.findIndex(item => item.id === id);
  if (itemIndex >= 0) {
    if (typeof inStock === 'boolean') menuItems[itemIndex].inStock = inStock;
    if (typeof price === 'number') menuItems[itemIndex].defaultPrice = price;
    if (variations && Array.isArray(variations)) menuItems[itemIndex].variations = variations;
    res.json({ success: true, item: menuItems[itemIndex] });
  } else {
    res.status(404).json({ error: 'Item not found' });
  }
});

app.post('/api/menu/import', (req, res) => {
  const { items } = req.body;
  if (Array.isArray(items) && items.length > 0) {
    menuItems = items;
    res.json({ success: true, count: menuItems.length });
  } else {
    res.status(400).json({ error: 'Invalid menu items array' });
  }
});

app.post('/api/menu/reset-default', (req, res) => {
  menuItems = [...INITIAL_MENU_ITEMS];
  res.json({ success: true, count: menuItems.length });
});

// Orders Endpoints
app.get('/api/orders', (req, res) => {
  res.json(orders);
});

app.post('/api/orders', (req, res) => {
  const orderPayload = req.body;
  const newOrder = {
    ...orderPayload,
    id: `ord-${Date.now()}`,
    orderNumber: nextOrderNumber++,
    timestamp: new Date().toISOString(),
    status: orderPayload.status || 'pending',
    paymentStatus: orderPayload.paymentStatus || 'paid'
  };

  orders.unshift(newOrder);

  // Auto-deduct inventory
  if (Array.isArray(newOrder.items)) {
    newOrder.items.forEach((item: any) => {
      // Deduct potatoes
      const potatoInv = inventoryItems.find(i => i.id === 'inv-potatoes');
      if (potatoInv) {
        const portionKg = item.variation?.name === 'Large' ? 0.45 : item.variation?.name === 'Medium' ? 0.35 : 0.25;
        potatoInv.currentStock = Math.max(0, Math.round((potatoInv.currentStock - portionKg * item.quantity) * 10) / 10);
      }
      // Deduct box
      const boxInv = inventoryItems.find(i => i.id === 'inv-takeaway-boxes');
      if (boxInv && newOrder.type === 'takeaway') {
        boxInv.currentStock = Math.max(0, boxInv.currentStock - item.quantity);
      }
      // Deduct roti if wrap
      if (item.category?.includes('Roti') || item.name?.includes('Roti')) {
        const rotiInv = inventoryItems.find(i => i.id === 'inv-roti');
        if (rotiInv) rotiInv.currentStock = Math.max(0, rotiInv.currentStock - item.quantity);
      }
      // Deduct chicken if chicken item
      if (item.name?.includes('Chicken') || item.selectedModifiers?.some((m: any) => m.optionName?.includes('Chicken'))) {
        const chickenInv = inventoryItems.find(i => i.id === 'inv-chicken-shredded');
        if (chickenInv) chickenInv.currentStock = Math.max(0, Math.round((chickenInv.currentStock - 0.12 * item.quantity) * 10) / 10);
      }
      // Deduct bacon if bacon item
      if (item.name?.includes('Bacon') || item.name?.includes('OG Loaded') || item.selectedModifiers?.some((m: any) => m.optionName?.includes('Bacon'))) {
        const baconInv = inventoryItems.find(i => i.id === 'inv-bacon');
        if (baconInv) baconInv.currentStock = Math.max(0, Math.round((baconInv.currentStock - 0.05 * item.quantity) * 10) / 10);
      }
      // Deduct cheese
      if (item.name?.includes('Cheesy') || item.selectedModifiers?.some((m: any) => m.optionName?.includes('Cheddar'))) {
        const cheeseInv = inventoryItems.find(i => i.id === 'inv-cheddar');
        if (cheeseInv) cheeseInv.currentStock = Math.max(0, Math.round((cheeseInv.currentStock - 0.06 * item.quantity) * 10) / 10);
      }
    });
  }

  // Clear live CFD cart
  activeCfdCart = {
    items: [],
    subtotal: 0,
    tax: 0,
    total: 0,
    orderType: 'takeaway',
    lastCompletedOrderNumber: newOrder.orderNumber,
    customerGreeting: `Thank you! Order #${newOrder.orderNumber}`
  };

  res.status(201).json(newOrder);
});

app.patch('/api/orders/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const order = orders.find(o => o.id === id);
  if (order) {
    order.status = status;
    if (status === 'ready') {
      order.preparedAt = new Date().toISOString();
    } else if (status === 'completed') {
      order.completedAt = new Date().toISOString();
    }
    res.json({ success: true, order });
  } else {
    res.status(404).json({ error: 'Order not found' });
  }
});

// Bump station endpoint (Kitchen or Front of House)
app.patch('/api/orders/:id/bump', (req, res) => {
  const { id } = req.params;
  const { station, unbump } = req.body; // 'kitchen' | 'foh'
  const order = orders.find(o => o.id === id);
  
  if (order) {
    if (station === 'kitchen') {
      order.kitchenBumped = !unbump;
      if (!unbump) {
        order.status = 'ready';
        order.preparedAt = new Date().toISOString();
      } else {
        order.status = 'preparing';
        delete order.preparedAt;
      }
    } else if (station === 'foh') {
      order.fohBumped = !unbump;
      if (!unbump) {
        // Front of house performs final handover, completing the order
        order.status = 'completed';
        order.completedAt = new Date().toISOString();
      } else {
        order.status = 'ready';
        delete order.completedAt;
      }
    }

    res.json({ success: true, order });
  } else {
    res.status(404).json({ error: 'Order not found' });
  }
});

// Order refund endpoint
app.patch('/api/orders/:id/refund', (req, res) => {
  const { id } = req.params;
  const order = orders.find(o => o.id === id);
  if (order) {
    order.paymentStatus = 'refunded';
    order.refundedAt = new Date().toISOString();
    order.status = 'cancelled';
    res.json({ success: true, order });
  } else {
    res.status(404).json({ error: 'Order not found' });
  }
});

// Customer-Facing Display (CFD) live cart synchronization
app.get('/api/orders/current-active', (req, res) => {
  res.json(activeCfdCart);
});

app.post('/api/orders/current-active', (req, res) => {
  activeCfdCart = req.body;
  res.json({ success: true });
});

// Inventory Endpoints
app.get('/api/inventory', (req, res) => {
  res.json(inventoryItems);
});

app.patch('/api/inventory/:id', (req, res) => {
  const { id } = req.params;
  const { currentStock, isOut } = req.body;
  const item = inventoryItems.find(i => i.id === id);
  if (item) {
    if (typeof currentStock === 'number') item.currentStock = Math.max(0, currentStock);
    if (typeof isOut === 'boolean') item.isOut = isOut;
    res.json({ success: true, item });
  } else {
    res.status(404).json({ error: 'Inventory item not found' });
  }
});

app.post('/api/inventory/restock', (req, res) => {
  const { id, amount } = req.body;
  const item = inventoryItems.find(i => i.id === id);
  if (item && typeof amount === 'number') {
    item.currentStock += amount;
    item.isOut = false;
    res.json({ success: true, item });
  } else {
    res.status(400).json({ error: 'Invalid restock parameters' });
  }
});

// Card Payment Processing Endpoint
app.post('/api/payments/process-card', async (req, res) => {
  const { amount, method, cardDetails } = req.body;
  
  // Simulate payment gateway handshake delay (800ms)
  await new Promise(resolve => setTimeout(resolve, 800));

  // If manual card provided and ends with 0000, simulate decline for testing
  if (cardDetails?.number && cardDetails.number.endsWith('0000')) {
    return res.status(402).json({
      success: false,
      message: 'Card declined: Insufficient funds or invalid security code (test card ending 0000)',
      authCode: null
    });
  }

  const authCode = 'AUTH-' + Math.random().toString(36).substring(2, 8).toUpperCase();
  const txnRef = 'ROAST-' + Date.now().toString().slice(-6);

  res.json({
    success: true,
    authCode,
    txnRef,
    amount,
    method: method || 'card_terminal',
    timestamp: new Date().toISOString(),
    cardBrand: cardDetails?.brand || (method === 'contactless' ? 'Contactless Pay' : 'Visa Debit'),
    last4: cardDetails?.number ? cardDetails.number.slice(-4) : (method === 'contactless' ? '9204' : '4242')
  });
});

// ----------------- VITE & STATIC SERVING ----------------- //

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    const ips = getLocalNetworkIPs();
    console.log(`\n🥔 ROASTUP POS Server running on port ${PORT}`);
    console.log(`Local Access: http://localhost:${PORT}`);
    ips.forEach(ip => {
      console.log(`Network Device Access: http://${ip}:${PORT}`);
    });
    console.log(`Screen modes: ?screen=pos | ?screen=kds | ?screen=signage_menu | ?screen=order_status | ?screen=cfd\n`);
  });
}

startServer();

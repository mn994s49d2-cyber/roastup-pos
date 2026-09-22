export type ScreenMode = 
  | 'pos' 
  | 'kds' 
  | 'foh'
  | 'order_history'
  | 'signage_menu' 
  | 'order_status' 
  | 'cfd' 
  | 'admin'
  | 'inventory' 
  | 'studio'
  | 'menu_admin' 
  | 'network_hub';

export type FontFamilyStyle = 'sans' | 'street' | 'rounded' | 'serif' | 'diner' | 'mono';
export type FontSizeScale = 'compact' | 'normal' | 'large' | 'xl';
export type DigitalLayoutMode = 'grid-2col' | 'grid-3col' | 'spotlight' | 'minimal';
export type TickerSpeed = 'slow' | 'normal' | 'fast' | 'off';

export interface DigitalSignageSettings {
  layoutMode: DigitalLayoutMode;
  showImages: boolean;
  showDescriptions: boolean;
  showVariations: boolean;
  showDietaryBadges: boolean;
  cycleInterval: number; // seconds
  autoCycle: boolean;
  tickerText: string;
  tickerSpeed: TickerSpeed;
  featuredItemId: string;
  mealDealTitle: string;
  mealDealPrice: string;
  mealDealDesc: string;
  activeChannel?: number; // 1, 2, 3 or 0 (all)
}

export interface PrinterConfig {
  type: 'bluetooth' | 'network' | 'browser';
  deviceName?: string;
  paperWidth: 58 | 80;
  autoPrintOnPayment: boolean;
  networkIp?: string;
  networkPort?: number;
  lastTestPrinted?: string;
}

export interface PaymentTerminalConfig {
  provider: 'simulator' | 'stripe_terminal' | 'square_terminal' | 'sumup';
  apiKey?: string;
  readerId?: string;
  locationId?: string;
  deviceCode?: string;
  status: 'connected' | 'disconnected' | 'ready';
  testMode: boolean;
}

export interface AppCustomizationSettings {
  fontFamily: FontFamilyStyle;
  fontSizeScale: FontSizeScale;
  digitalSignage: DigitalSignageSettings;
  categoryOrder: string[];
  themeMode?: 'light' | 'dark';
  printer?: PrinterConfig;
  paymentTerminal?: PaymentTerminalConfig;
}

export type OrderType = 'takeaway' | 'dine_in';

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';

export type PaymentMethod = 'card_terminal' | 'card_manual' | 'contactless' | 'cash';

export type PaymentStatus = 'unpaid' | 'processing' | 'paid' | 'failed' | 'refunded';

export interface MenuVariation {
  id: string;
  name: 'Small' | 'Medium' | 'Large' | 'Standard';
  sku: string;
  price: number;
}

export interface ModifierOption {
  id: string;
  name: string;
  priceDelta: number; // e.g. +0.70 or 0
  category?: 'size' | 'filling' | 'cheese' | 'toppings' | 'sauce' | 'extras' | 'drink';
  inStock?: boolean;
}

export interface ModifierSet {
  id: string;
  name: string;
  required: boolean;
  minSelections: number;
  maxSelections: number;
  options: ModifierOption[];
}

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  description: string;
  itemType: string;
  variations: MenuVariation[];
  defaultPrice: number;
  modifierSets?: ModifierSet[];
  tags?: string[];
  inStock: boolean;
  imageUrl?: string;
  sortOrder?: number;
}

export interface SelectedModifier {
  setId: string;
  setName: string;
  optionId: string;
  optionName: string;
  priceDelta: number;
}

export interface CartItem {
  cartItemId: string;
  menuItemId: string;
  name: string;
  category: string;
  variation: MenuVariation;
  selectedModifiers: SelectedModifier[];
  customNotes?: string;
  specialRemovals?: string[]; // e.g. "No Onions", "No Bacon"
  specialAdditions?: string[]; // e.g. "Extra Crispy", "Gravy on side"
  unitPrice: number;
  quantity: number;
  totalPrice: number;
}

export interface Order {
  id: string;
  orderNumber: number; // e.g. 101, 102
  ticketNumber?: string; // e.g. "A-104"
  timestamp: string; // ISO string of order placed time
  placedAt?: string; // Explicit order placed ISO string
  dueTime?: string; // Target order due time string (e.g. "18:30" or ISO string)
  dueAt?: string; // Target order due ISO timestamp (e.g. "2026-09-21T18:30:00.000Z")
  dueMinutes?: number; // Target lead time in minutes
  isPreOrder?: boolean; // True if scheduled for later prep
  timeOfDay?: 'lunch' | 'afternoon' | 'dinner' | string; // Day period for service batching
  pickupTime?: string; // Friendly pickup display e.g. "Today at 18:30 (Dinner)"
  notes?: string; // Ticket notes, e.g. "[PRE-ORDER DUE: 18:30 (DINNER)] Please pack extra napkins"
  type: OrderType;
  items: CartItem[];
  subtotal: number;
  tax: number; // 20% VAT in UK standard
  total: number;
  status: OrderStatus;
  paymentMethod?: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentRef?: string;
  cardLast4?: string;
  cardBrand?: string;
  cashTendered?: number;
  changeDue?: number;
  customerName?: string;
  customerNotes?: string;
  tableNumber?: string;
  preparedAt?: string;
  completedAt?: string;
  kitchenBumped?: boolean;
  fohBumped?: boolean;
  refundedAt?: string;
  refundReason?: string;
  printedReceipt?: boolean;
  source?: string;
  loyaltyInfo?: LoyaltyTransactionInfo;
}

export interface LoyaltyReward {
  id: string;
  title: string;
  pointsCost: number;
  discountValue: number;
}

export interface LoyaltyMember {
  id: string; // e.g. "RP-88392"
  name: string;
  points: number;
  tier?: string;
  phone?: string;
  availableRewards?: LoyaltyReward[];
}

export interface LoyaltyVoucher {
  memberId: string;
  rewardId: string;
  pointsCost: number;
  title: string;
  discountValue: number;
}

export interface LoyaltyTransactionInfo {
  memberId: string;
  memberName?: string;
  pointsRedeemed?: number;
  pointsEarned?: number;
  previousPoints?: number;
  newPoints?: number;
  rewardId?: string;
  pointsCost?: number;
  rewardTitle?: string;
  discountValue?: number;
  qrPayload?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: 'Produce' | 'Meat & Poultry' | 'Dairy & Cheese' | 'Sauces & Condiments' | 'Bakery' | 'Beverages' | 'Packaging';
  currentStock: number;
  unit: 'kg' | 'portions' | 'liters' | 'units';
  minThreshold: number;
  costPerUnit: number;
  linkedMenuItems?: string[]; // item ids or modifier options
  isOut?: boolean;
}

export interface DeviceInfo {
  id: string;
  name: string;
  type: 'pos' | 'kds' | 'signage' | 'cfd';
  ipAddress?: string;
  lastActive: string;
  status: 'online' | 'offline';
}

export interface ServerNetworkInfo {
  host: string;
  port: number;
  localIp: string;
  localIps?: string[];
  primaryIp?: string;
  baseUrl?: string;
  urls: {
    pos: string;
    kds: string;
    signage?: string;
    signageMenu?: string;
    orderStatus: string;
    cfd: string;
    inventory?: string;
    networkHub?: string;
  };
  connectedDevices: DeviceInfo[];
}

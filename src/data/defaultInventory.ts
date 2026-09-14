import { InventoryItem } from '../types';

export const INITIAL_INVENTORY: InventoryItem[] = [
  {
    id: 'inv-potatoes',
    name: 'Maris Piper Roasting Potatoes',
    category: 'Produce',
    currentStock: 125,
    unit: 'kg',
    minThreshold: 25,
    costPerUnit: 1.10
  },
  {
    id: 'inv-chicken-shredded',
    name: 'Shredded Roast Chicken',
    category: 'Meat & Poultry',
    currentStock: 18.5,
    unit: 'kg',
    minThreshold: 4,
    costPerUnit: 7.20
  },
  {
    id: 'inv-chicken-spicy',
    name: 'Spicy Seasoned Chicken',
    category: 'Meat & Poultry',
    currentStock: 14.0,
    unit: 'kg',
    minThreshold: 3,
    costPerUnit: 7.40
  },
  {
    id: 'inv-chicken-tikka',
    name: 'Tikka Marinated Chicken',
    category: 'Meat & Poultry',
    currentStock: 12.0,
    unit: 'kg',
    minThreshold: 3,
    costPerUnit: 7.60
  },
  {
    id: 'inv-bacon',
    name: 'Crispy Smoked Bacon Bits',
    category: 'Meat & Poultry',
    currentStock: 9.2,
    unit: 'kg',
    minThreshold: 2.5,
    costPerUnit: 8.50
  },
  {
    id: 'inv-cheddar',
    name: 'Mature Grated Cheddar',
    category: 'Dairy & Cheese',
    currentStock: 16.0,
    unit: 'kg',
    minThreshold: 3.5,
    costPerUnit: 6.20
  },
  {
    id: 'inv-cheese-sauce',
    name: 'Creamy Melting Cheese Sauce',
    category: 'Dairy & Cheese',
    currentStock: 15.0,
    unit: 'liters',
    minThreshold: 4.0,
    costPerUnit: 4.50
  },
  {
    id: 'inv-roti',
    name: 'Fresh Roti Wraps',
    category: 'Bakery',
    currentStock: 85,
    unit: 'units',
    minThreshold: 20,
    costPerUnit: 0.35
  },
  {
    id: 'inv-garlic-mayo',
    name: 'ROASTUP Garlic Mayo',
    category: 'Sauces & Condiments',
    currentStock: 12.5,
    unit: 'liters',
    minThreshold: 3.0,
    costPerUnit: 3.80
  },
  {
    id: 'inv-bbq',
    name: 'Sweet Smoky BBQ Sauce',
    category: 'Sauces & Condiments',
    currentStock: 10.0,
    unit: 'liters',
    minThreshold: 2.5,
    costPerUnit: 3.40
  },
  {
    id: 'inv-hot-sauce',
    name: 'Fiery Roast Hot Sauce',
    category: 'Sauces & Condiments',
    currentStock: 7.0,
    unit: 'liters',
    minThreshold: 2.0,
    costPerUnit: 3.90
  },
  {
    id: 'inv-gravy',
    name: 'Rich Savoury Gravy Batch',
    category: 'Sauces & Condiments',
    currentStock: 18.0,
    unit: 'liters',
    minThreshold: 4.0,
    costPerUnit: 2.10
  },
  {
    id: 'inv-crispy-onions',
    name: 'Golden Crispy Fried Onions',
    category: 'Produce',
    currentStock: 8.5,
    unit: 'kg',
    minThreshold: 2.0,
    costPerUnit: 4.10
  },
  {
    id: 'inv-jalapenos',
    name: 'Sliced Pickled Jalapeños',
    category: 'Produce',
    currentStock: 6.0,
    unit: 'kg',
    minThreshold: 1.5,
    costPerUnit: 3.20
  },
  {
    id: 'inv-spring-onions',
    name: 'Fresh Sliced Spring Onions',
    category: 'Produce',
    currentStock: 5.0,
    unit: 'kg',
    minThreshold: 1.5,
    costPerUnit: 2.80
  },
  {
    id: 'inv-beans',
    name: 'Rich Tomato Baked Beans',
    category: 'Produce',
    currentStock: 14.0,
    unit: 'kg',
    minThreshold: 3.0,
    costPerUnit: 1.80
  },
  {
    id: 'inv-stuffing',
    name: 'Sage & Onion Stuffing Crumbs',
    category: 'Bakery',
    currentStock: 7.5,
    unit: 'kg',
    minThreshold: 2.0,
    costPerUnit: 3.00
  },
  {
    id: 'inv-cans',
    name: 'Canned Soft Drinks Assorted',
    category: 'Beverages',
    currentStock: 140,
    unit: 'units',
    minThreshold: 30,
    costPerUnit: 0.55
  },
  {
    id: 'inv-water',
    name: 'Bottled Mineral Water 500ml',
    category: 'Beverages',
    currentStock: 95,
    unit: 'units',
    minThreshold: 24,
    costPerUnit: 0.35
  },
  {
    id: 'inv-takeaway-boxes',
    name: 'Kraft Potato Meal Boxes',
    category: 'Packaging',
    currentStock: 350,
    unit: 'units',
    minThreshold: 60,
    costPerUnit: 0.18
  },
  {
    id: 'inv-cutlery-packs',
    name: 'Wooden Fork & Napkin Sets',
    category: 'Packaging',
    currentStock: 420,
    unit: 'units',
    minThreshold: 80,
    costPerUnit: 0.08
  }
];

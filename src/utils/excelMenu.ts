import * as XLSX from 'xlsx';
import { MenuItem, MenuVariation } from '../types';
import { INITIAL_MENU_ITEMS, COMMON_BYO_MODIFIERS, MEAL_DEAL_DRINK_MODIFIER, MEAL_DEAL_FILLING_MODIFIER } from '../data/defaultMenu';

export interface RawMenuRow {
  'Item Name'?: string;
  'Variation Name'?: string;
  Description?: string;
  SKU?: string;
  Price?: number | string;
  Category?: string;
  'Item Type'?: string;
  'Modifier Sets'?: string;
  [key: string]: any;
}

export function parseMenuSpreadsheet(data: ArrayBuffer | Uint8Array): MenuItem[] {
  const workbook = XLSX.read(data, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rows: RawMenuRow[] = XLSX.utils.sheet_to_json(worksheet);

  const itemsMap = new Map<string, MenuItem>();

  rows.forEach((row, index) => {
    const itemName = String(row['Item Name'] || row['Name'] || row['item_name'] || '').trim();
    if (!itemName) return;

    const variationName = String(row['Variation Name'] || row['Size'] || row['variation'] || 'Standard').trim() as any;
    const desc = String(row['Description'] || row['desc'] || '').trim();
    const sku = String(row['SKU'] || `ROAST-${index + 1}`).trim();
    const rawPrice = row['Price'] ?? row['price'] ?? 0;
    const price = typeof rawPrice === 'number' ? rawPrice : parseFloat(String(rawPrice).replace(/[^0-9.]/g, '')) || 0;
    const rawCategory = String(row['Category'] || row['category'] || 'Loaded Roast Potatoes').trim();
    const itemType = String(row['Item Type'] || 'Prepared food and beverage').trim();
    const modifierSetsStr = String(row['Modifier Sets'] || '').trim();

    const variation: MenuVariation = {
      id: `v-${itemName.toLowerCase().replace(/\s+/g, '-')}-${variationName.toLowerCase()}`,
      name: variationName,
      sku,
      price
    };

    if (itemsMap.has(itemName)) {
      const existing = itemsMap.get(itemName)!;
      // If this variation doesn't already exist, add it
      if (!existing.variations.some(v => v.name === variation.name)) {
        existing.variations.push(variation);
      }
      if (!existing.description && desc) existing.description = desc;
    } else {
      // Determine modifier sets
      let modifierSets = undefined;
      if (itemName.toLowerCase().includes('build your own') || rawCategory.toLowerCase().includes('build your own')) {
        modifierSets = COMMON_BYO_MODIFIERS;
      } else if (rawCategory.toLowerCase().includes('meal deal') || modifierSetsStr.toLowerCase().includes('meal deal')) {
        modifierSets = [MEAL_DEAL_FILLING_MODIFIER, MEAL_DEAL_DRINK_MODIFIER];
      }

      const newItem: MenuItem = {
        id: `item-${itemName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        name: itemName,
        category: (rawCategory as any) || 'Loaded Roast Potatoes',
        description: desc,
        itemType,
        variations: [variation],
        defaultPrice: price,
        inStock: true,
        modifierSets,
        tags: itemName.toLowerCase().includes('og') || itemName.toLowerCase().includes('roast dinner') 
          ? ['popular', 'signature'] 
          : itemName.toLowerCase().includes('fire') || itemName.toLowerCase().includes('hot') 
            ? ['spicy'] 
            : itemName.toLowerCase().includes('veggie') || itemName.toLowerCase().includes('bean')
              ? ['vegetarian']
              : []
      };

      itemsMap.set(itemName, newItem);
    }
  });

  const parsedItems = Array.from(itemsMap.values());
  return parsedItems.length > 0 ? parsedItems : INITIAL_MENU_ITEMS;
}

export function exportMenuToExcel(items: MenuItem[], format: 'xlsx' | 'csv' = 'xlsx') {
  const rows: RawMenuRow[] = [];

  items.forEach(item => {
    if (item.variations && item.variations.length > 0) {
      item.variations.forEach(v => {
        rows.push({
          'Item Name': item.name,
          'Variation Name': v.name,
          Description: item.description,
          SKU: v.sku,
          Price: v.price.toFixed(2),
          Category: item.category,
          'Item Type': item.itemType,
          'Modifier Sets': item.modifierSets ? item.modifierSets.map(m => m.name).join('; ') : ''
        });
      });
    } else {
      rows.push({
        'Item Name': item.name,
        'Variation Name': 'Standard',
        Description: item.description,
        SKU: `ROASTUP-${item.id}`,
        Price: item.defaultPrice.toFixed(2),
        Category: item.category,
        'Item Type': item.itemType,
        'Modifier Sets': ''
      });
    }
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'ROASTUP_Menu');

  if (format === 'csv') {
    const csvData = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, 'roastup_menu.csv');
  } else {
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    downloadBlob(blob, 'roastup_menu.xlsx');
  }
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

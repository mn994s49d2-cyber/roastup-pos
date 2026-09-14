import { MenuItem, ModifierSet } from '../types';

export const COMMON_BYO_MODIFIERS: ModifierSet[] = [
  {
    id: 'byo-fillings',
    name: 'Choose Filling / Protein',
    required: false,
    minSelections: 0,
    maxSelections: 2,
    options: [
      { id: 'f-chicken', name: 'Shredded Roast Chicken', priceDelta: 1.80, category: 'filling' },
      { id: 'f-spicy-chick', name: 'Spicy Chicken', priceDelta: 1.80, category: 'filling' },
      { id: 'f-tikka', name: 'Tikka Chicken', priceDelta: 2.00, category: 'filling' },
      { id: 'f-bacon', name: 'Crispy Bacon Pieces', priceDelta: 1.50, category: 'filling' },
      { id: 'f-stuffing', name: 'Roast Chicken & Stuffing', priceDelta: 2.20, category: 'filling' },
      { id: 'f-beans', name: 'Warm Baked Beans (V)', priceDelta: 1.00, category: 'filling' },
      { id: 'f-veggies', name: 'Roasted Peppers & Sweetcorn (VG)', priceDelta: 1.20, category: 'filling' }
    ]
  },
  {
    id: 'byo-cheese',
    name: 'Choose Cheese',
    required: false,
    minSelections: 0,
    maxSelections: 1,
    options: [
      { id: 'c-cheddar', name: 'Melted Cheddar', priceDelta: 1.00, category: 'cheese' },
      { id: 'c-sauce', name: 'Creamy Cheese Sauce', priceDelta: 1.20, category: 'cheese' },
      { id: 'c-parm', name: 'Parmesan-Style Cheese', priceDelta: 1.00, category: 'cheese' },
      { id: 'c-vegan', name: 'Vegan Melting Cheese', priceDelta: 1.20, category: 'cheese' }
    ]
  },
  {
    id: 'byo-toppings',
    name: 'Add Toppings',
    required: false,
    minSelections: 0,
    maxSelections: 4,
    options: [
      { id: 't-crispy-onions', name: 'Crispy Golden Onions', priceDelta: 0.50, category: 'toppings' },
      { id: 't-jalapenos', name: 'Pickled Jalapeños', priceDelta: 0.50, category: 'toppings' },
      { id: 't-spring-onions', name: 'Fresh Spring Onions', priceDelta: 0.40, category: 'toppings' },
      { id: 't-stuffing-crumbs', name: 'Herb Stuffing Crumbs', priceDelta: 0.60, category: 'toppings' },
      { id: 't-parsley', name: 'Fresh Parsley & Black Pepper', priceDelta: 0.30, category: 'toppings' },
      { id: 't-sweetcorn', name: 'Juicy Sweetcorn', priceDelta: 0.40, category: 'toppings' }
    ]
  },
  {
    id: 'byo-sauces',
    name: 'Signature Sauce / Gravy',
    required: false,
    minSelections: 0,
    maxSelections: 2,
    options: [
      { id: 's-garlic-mayo', name: 'ROASTUP Garlic Mayo', priceDelta: 0.70, category: 'sauce' },
      { id: 's-bbq', name: 'Smoky BBQ Sauce', priceDelta: 0.70, category: 'sauce' },
      { id: 's-hot', name: 'Spicy Hot Sauce', priceDelta: 0.70, category: 'sauce' },
      { id: 's-gravy', name: 'Rich Savoury Gravy', priceDelta: 0.70, category: 'sauce' },
      { id: 's-mint', name: 'Cooling Mint Sauce', priceDelta: 0.70, category: 'sauce' },
      { id: 's-cheese-dip', name: 'Warm Cheese Sauce', priceDelta: 1.00, category: 'sauce' }
    ]
  },
  {
    id: 'byo-extras',
    name: 'Extra Boosts',
    required: false,
    minSelections: 0,
    maxSelections: 3,
    options: [
      { id: 'x-potatoes', name: 'Extra Portion Crispy Roasties', priceDelta: 1.50, category: 'extras' },
      { id: 'x-bacon', name: 'Double Bacon', priceDelta: 1.50, category: 'extras' },
      { id: 'x-cheese', name: 'Extra Melted Cheddar', priceDelta: 1.00, category: 'extras' },
      { id: 'x-onions', name: 'Extra Crispy Onions', priceDelta: 0.80, category: 'extras' }
    ]
  }
];

export const MEAL_DEAL_DRINK_MODIFIER: ModifierSet = {
  id: 'meal-drink',
  name: 'Select Drink',
  required: true,
  minSelections: 1,
  maxSelections: 1,
  options: [
    { id: 'd-coke', name: 'Coca-Cola Original (Can)', priceDelta: 0, category: 'drink' },
    { id: 'd-diet-coke', name: 'Diet Coke (Can)', priceDelta: 0, category: 'drink' },
    { id: 'd-coke-zero', name: 'Coke Zero (Can)', priceDelta: 0, category: 'drink' },
    { id: 'd-sprite', name: 'Sprite Lemon-Lime (Can)', priceDelta: 0, category: 'drink' },
    { id: 'd-fanta', name: 'Fanta Orange (Can)', priceDelta: 0, category: 'drink' },
    { id: 'd-water', name: 'Still Mineral Water (Bottle)', priceDelta: 0, category: 'drink' },
    { id: 'd-sig', name: 'ROASTUP Signature Spiced Drink (+£1.00)', priceDelta: 1.00, category: 'drink' }
  ]
};

export const MEAL_DEAL_FILLING_MODIFIER: ModifierSet = {
  id: 'meal-filling',
  name: 'Select Loaded Roast Potato Choice',
  required: true,
  minSelections: 1,
  maxSelections: 1,
  options: [
    { id: 'mf-og', name: 'The OG Loaded (Bacon, Cheddar, Garlic Mayo)', priceDelta: 0 },
    { id: 'mf-bbq', name: 'The BBQ Chicken (Shredded Chicken, BBQ, Onions)', priceDelta: 0.50 },
    { id: 'mf-fire', name: 'The Fire One (Spicy Chicken, Jalapeños, Hot Sauce)', priceDelta: 0.50 },
    { id: 'mf-dinner', name: 'The Roast Dinner (Chicken, Stuffing, Gravy)', priceDelta: 1.00 },
    { id: 'mf-bean', name: 'The Cheesy Bean (Beans, Cheddar, Smoky)', priceDelta: 0 },
    { id: 'mf-garlic', name: 'The Garlic & Herb (Garlic Butter, Parmesan)', priceDelta: 0 }
  ]
};

export const INITIAL_MENU_ITEMS: MenuItem[] = [
  // 1. LOADED ROAST POTATOES
  {
    id: 'item-001',
    name: 'The OG Loaded',
    category: 'Loaded Roast Potatoes',
    description: 'Crispy roast potatoes, melted cheddar, crispy bacon, spring onions and creamy garlic mayo.',
    itemType: 'Prepared food and beverage',
    inStock: true,
    tags: ['popular', 'signature'],
    variations: [
      { id: 'v-og-s', name: 'Small', sku: 'ROASTUP-001', price: 5.50 },
      { id: 'v-og-m', name: 'Medium', sku: 'ROASTUP-002', price: 6.50 },
      { id: 'v-og-l', name: 'Large', sku: 'ROASTUP-003', price: 7.50 }
    ],
    defaultPrice: 6.50
  },
  {
    id: 'item-002',
    name: 'The BBQ Chicken',
    category: 'Loaded Roast Potatoes',
    description: 'Crispy roast potatoes, shredded chicken, cheddar, BBQ sauce, crispy onions and smoky mayo.',
    itemType: 'Prepared food and beverage',
    inStock: true,
    tags: ['popular'],
    variations: [
      { id: 'v-bbq-s', name: 'Small', sku: 'ROASTUP-004', price: 7.00 },
      { id: 'v-bbq-m', name: 'Medium', sku: 'ROASTUP-005', price: 8.00 },
      { id: 'v-bbq-l', name: 'Large', sku: 'ROASTUP-006', price: 9.00 }
    ],
    defaultPrice: 8.00
  },
  {
    id: 'item-003',
    name: 'The Fire One',
    category: 'Loaded Roast Potatoes',
    description: 'Crispy roast potatoes, spicy chicken, melted cheese, jalapeños, hot sauce and garlic mayo.',
    itemType: 'Prepared food and beverage',
    inStock: true,
    tags: ['spicy'],
    variations: [
      { id: 'v-fire-s', name: 'Small', sku: 'ROASTUP-007', price: 7.00 },
      { id: 'v-fire-m', name: 'Medium', sku: 'ROASTUP-008', price: 8.00 },
      { id: 'v-fire-l', name: 'Large', sku: 'ROASTUP-009', price: 9.00 }
    ],
    defaultPrice: 8.00
  },
  {
    id: 'item-004',
    name: 'The Roast Dinner',
    category: 'Loaded Roast Potatoes',
    description: 'Crispy roast potatoes, roast chicken, stuffing crumbs, gravy and crispy onions.',
    itemType: 'Prepared food and beverage',
    inStock: true,
    tags: ['popular', 'signature'],
    variations: [
      { id: 'v-roast-s', name: 'Small', sku: 'ROASTUP-010', price: 7.50 },
      { id: 'v-roast-m', name: 'Medium', sku: 'ROASTUP-011', price: 8.50 },
      { id: 'v-roast-l', name: 'Large', sku: 'ROASTUP-012', price: 9.50 }
    ],
    defaultPrice: 8.50
  },
  {
    id: 'item-005',
    name: 'The Cheesy Bean',
    category: 'Loaded Roast Potatoes',
    description: 'Crispy roast potatoes, baked beans, melted cheddar, spring onions and smoky sauce.',
    itemType: 'Prepared food and beverage',
    inStock: true,
    tags: ['vegetarian'],
    variations: [
      { id: 'v-bean-s', name: 'Small', sku: 'ROASTUP-013', price: 5.50 },
      { id: 'v-bean-m', name: 'Medium', sku: 'ROASTUP-014', price: 6.50 },
      { id: 'v-bean-l', name: 'Large', sku: 'ROASTUP-015', price: 7.50 }
    ],
    defaultPrice: 6.50
  },
  {
    id: 'item-006',
    name: 'The Garlic & Herb',
    category: 'Loaded Roast Potatoes',
    description: 'Crispy roast potatoes, garlic butter, parmesan-style cheese, parsley and cracked black pepper.',
    itemType: 'Prepared food and beverage',
    inStock: true,
    tags: ['vegetarian'],
    variations: [
      { id: 'v-garlic-s', name: 'Small', sku: 'ROASTUP-016', price: 5.00 },
      { id: 'v-garlic-m', name: 'Medium', sku: 'ROASTUP-017', price: 6.00 },
      { id: 'v-garlic-l', name: 'Large', sku: 'ROASTUP-018', price: 7.00 }
    ],
    defaultPrice: 6.00
  },

  // 2. ROTI ROAST POTATO WRAPS
  {
    id: 'item-007',
    name: 'The Roast Wrap',
    category: 'Roti Roast Potato Wraps',
    description: 'Toasted roti filled with crispy roast potatoes, shredded chicken, cheddar, lettuce and garlic mayo.',
    itemType: 'Prepared food and beverage',
    inStock: true,
    tags: ['popular'],
    variations: [{ id: 'v-wrap-std', name: 'Standard', sku: 'ROASTUP-019', price: 7.50 }],
    defaultPrice: 7.50
  },
  {
    id: 'item-008',
    name: 'The Fire Roti',
    category: 'Roti Roast Potato Wraps',
    description: 'Toasted roti filled with crispy roast potatoes, spicy chicken, melted cheese, jalapeños, hot sauce and cooling mayo.',
    itemType: 'Prepared food and beverage',
    inStock: true,
    tags: ['spicy'],
    variations: [{ id: 'v-fireroti-std', name: 'Standard', sku: 'ROASTUP-020', price: 7.50 }],
    defaultPrice: 7.50
  },
  {
    id: 'item-009',
    name: 'The Tikka Roast',
    category: 'Roti Roast Potato Wraps',
    description: 'Toasted roti filled with crispy roast potatoes, tikka chicken, mint yoghurt-style sauce, red onion and coriander.',
    itemType: 'Prepared food and beverage',
    inStock: true,
    tags: ['signature'],
    variations: [{ id: 'v-tikka-std', name: 'Standard', sku: 'ROASTUP-021', price: 8.00 }],
    defaultPrice: 8.00
  },
  {
    id: 'item-010',
    name: 'The Veggie Roast',
    category: 'Roti Roast Potato Wraps',
    description: 'Toasted roti filled with crispy roast potatoes, roasted peppers, sweetcorn, cheddar, lettuce and smoky garlic sauce.',
    itemType: 'Prepared food and beverage',
    inStock: true,
    tags: ['vegetarian'],
    variations: [{ id: 'v-veggie-std', name: 'Standard', sku: 'ROASTUP-022', price: 6.50 }],
    defaultPrice: 6.50
  },
  {
    id: 'item-011',
    name: 'The Bacon BBQ',
    category: 'Roti Roast Potato Wraps',
    description: 'Toasted roti filled with crispy roast potatoes, crispy bacon, cheddar, BBQ sauce, crispy onions and garlic mayo.',
    itemType: 'Prepared food and beverage',
    inStock: true,
    variations: [{ id: 'v-baconbbq-std', name: 'Standard', sku: 'ROASTUP-023', price: 7.50 }],
    defaultPrice: 7.50
  },

  // 3. SIDES
  {
    id: 'item-012',
    name: 'ROASTUP Bites',
    category: 'Sides',
    description: 'Crispy golden roast potatoes with your choice of seasoning.',
    itemType: 'Prepared food and beverage',
    inStock: true,
    variations: [
      { id: 'v-bites-s', name: 'Small', sku: 'ROASTUP-024', price: 2.50 },
      { id: 'v-bites-m', name: 'Medium', sku: 'ROASTUP-025', price: 3.00 },
      { id: 'v-bites-l', name: 'Large', sku: 'ROASTUP-026', price: 4.00 }
    ],
    defaultPrice: 3.00
  },
  {
    id: 'item-013',
    name: 'Loaded Bites',
    category: 'Sides',
    description: 'Crispy roast potato bites topped with melted cheese and your choice of sauce.',
    itemType: 'Prepared food and beverage',
    inStock: true,
    variations: [
      { id: 'v-loadedbites-s', name: 'Small', sku: 'ROASTUP-027', price: 3.50 },
      { id: 'v-loadedbites-m', name: 'Medium', sku: 'ROASTUP-028', price: 4.50 },
      { id: 'v-loadedbites-l', name: 'Large', sku: 'ROASTUP-029', price: 5.50 }
    ],
    defaultPrice: 4.50
  },
  {
    id: 'item-014',
    name: 'Cheesy Roast Bites',
    category: 'Sides',
    description: 'Crispy roast potato bites with melted cheddar cheese.',
    itemType: 'Prepared food and beverage',
    inStock: true,
    tags: ['vegetarian'],
    variations: [
      { id: 'v-cheesybites-s', name: 'Small', sku: 'ROASTUP-030', price: 3.00 },
      { id: 'v-cheesybites-m', name: 'Medium', sku: 'ROASTUP-031', price: 4.00 },
      { id: 'v-cheesybites-l', name: 'Large', sku: 'ROASTUP-032', price: 5.00 }
    ],
    defaultPrice: 4.00
  },
  {
    id: 'item-015',
    name: 'Crispy Onions',
    category: 'Sides',
    description: 'A portion of golden crispy onions.',
    itemType: 'Prepared food and beverage',
    inStock: true,
    tags: ['vegetarian'],
    variations: [{ id: 'v-onions-std', name: 'Standard', sku: 'ROASTUP-033', price: 1.50 }],
    defaultPrice: 1.50
  },
  {
    id: 'item-016',
    name: 'Extra Roti',
    category: 'Sides',
    description: 'A toasted roti wrap served on its own.',
    itemType: 'Prepared food and beverage',
    inStock: true,
    tags: ['vegetarian'],
    variations: [{ id: 'v-extraroti-std', name: 'Standard', sku: 'ROASTUP-034', price: 1.50 }],
    defaultPrice: 1.50
  },

  // 4. SAUCES & DIPS
  {
    id: 'item-017',
    name: 'ROASTUP Garlic Mayo',
    category: 'Sauces & Dips',
    description: 'Creamy garlic mayo.',
    itemType: 'Prepared food and beverage',
    inStock: true,
    tags: ['vegetarian'],
    variations: [{ id: 'v-sauce-garlic', name: 'Standard', sku: 'ROASTUP-035', price: 0.70 }],
    defaultPrice: 0.70
  },
  {
    id: 'item-018',
    name: 'Smoky BBQ',
    category: 'Sauces & Dips',
    description: 'Sweet and smoky BBQ sauce.',
    itemType: 'Prepared food and beverage',
    inStock: true,
    tags: ['vegetarian'],
    variations: [{ id: 'v-sauce-bbq', name: 'Standard', sku: 'ROASTUP-036', price: 0.70 }],
    defaultPrice: 0.70
  },
  {
    id: 'item-019',
    name: 'Hot Sauce',
    category: 'Sauces & Dips',
    description: 'A spicy hot sauce for an extra kick.',
    itemType: 'Prepared food and beverage',
    inStock: true,
    tags: ['spicy', 'vegetarian'],
    variations: [{ id: 'v-sauce-hot', name: 'Standard', sku: 'ROASTUP-037', price: 0.70 }],
    defaultPrice: 0.70
  },
  {
    id: 'item-020',
    name: 'Gravy',
    category: 'Sauces & Dips',
    description: 'Rich, savoury gravy.',
    itemType: 'Prepared food and beverage',
    inStock: true,
    variations: [{ id: 'v-sauce-gravy', name: 'Standard', sku: 'ROASTUP-038', price: 0.70 }],
    defaultPrice: 0.70
  },
  {
    id: 'item-021',
    name: 'Mint Sauce',
    category: 'Sauces & Dips',
    description: 'Fresh mint sauce.',
    itemType: 'Prepared food and beverage',
    inStock: true,
    tags: ['vegetarian'],
    variations: [{ id: 'v-sauce-mint', name: 'Standard', sku: 'ROASTUP-039', price: 0.70 }],
    defaultPrice: 0.70
  },
  {
    id: 'item-022',
    name: 'Cheese Sauce',
    category: 'Sauces & Dips',
    description: 'Creamy melted cheese sauce.',
    itemType: 'Prepared food and beverage',
    inStock: true,
    tags: ['vegetarian'],
    variations: [{ id: 'v-sauce-cheese', name: 'Standard', sku: 'ROASTUP-040', price: 1.00 }],
    defaultPrice: 1.00
  },
  {
    id: 'item-023',
    name: 'Extra Sauce',
    category: 'Sauces & Dips',
    description: 'Add an extra portion of your favourite sauce.',
    itemType: 'Prepared food and beverage',
    inStock: true,
    variations: [{ id: 'v-sauce-extra', name: 'Standard', sku: 'ROASTUP-041', price: 0.50 }],
    defaultPrice: 0.50
  },

  // 5. MEAL DEALS
  {
    id: 'item-024',
    name: 'The Solo Roast',
    category: 'Meal Deals',
    description: 'A loaded roast potato with a soft drink.',
    itemType: 'Prepared food and beverage',
    inStock: true,
    tags: ['popular'],
    variations: [
      { id: 'v-solo-s', name: 'Small', sku: 'ROASTUP-042', price: 7.00 },
      { id: 'v-solo-m', name: 'Medium', sku: 'ROASTUP-043', price: 8.00 },
      { id: 'v-solo-l', name: 'Large', sku: 'ROASTUP-044', price: 9.00 }
    ],
    defaultPrice: 8.00,
    modifierSets: [MEAL_DEAL_FILLING_MODIFIER, MEAL_DEAL_DRINK_MODIFIER]
  },
  {
    id: 'item-025',
    name: 'The Roti Combo',
    category: 'Meal Deals',
    description: 'Any signature roti wrap, ROASTUP Bites and a soft drink.',
    itemType: 'Prepared food and beverage',
    inStock: true,
    variations: [{ id: 'v-roticombo-std', name: 'Standard', sku: 'ROASTUP-045', price: 9.50 }],
    defaultPrice: 9.50,
    modifierSets: [
      {
        id: 'combo-wrap-choice',
        name: 'Select Roti Wrap',
        required: true,
        minSelections: 1,
        maxSelections: 1,
        options: [
          { id: 'rw-roast', name: 'The Roast Wrap', priceDelta: 0 },
          { id: 'rw-fire', name: 'The Fire Roti', priceDelta: 0 },
          { id: 'rw-tikka', name: 'The Tikka Roast (+£0.50)', priceDelta: 0.50 },
          { id: 'rw-veggie', name: 'The Veggie Roast', priceDelta: 0 },
          { id: 'rw-bacon', name: 'The Bacon BBQ', priceDelta: 0 }
        ]
      },
      MEAL_DEAL_DRINK_MODIFIER
    ]
  },
  {
    id: 'item-026',
    name: 'The Big Roast',
    category: 'Meal Deals',
    description: 'A large loaded roast potato, ROASTUP Bites, one dip and a soft drink.',
    itemType: 'Prepared food and beverage',
    inStock: true,
    tags: ['signature'],
    variations: [{ id: 'v-bigroast-std', name: 'Standard', sku: 'ROASTUP-046', price: 10.00 }],
    defaultPrice: 10.00,
    modifierSets: [
      MEAL_DEAL_FILLING_MODIFIER,
      {
        id: 'big-dip-choice',
        name: 'Select Free Dip',
        required: true,
        minSelections: 1,
        maxSelections: 1,
        options: [
          { id: 'dip-garlic', name: 'ROASTUP Garlic Mayo', priceDelta: 0 },
          { id: 'dip-bbq', name: 'Smoky BBQ', priceDelta: 0 },
          { id: 'dip-hot', name: 'Hot Sauce', priceDelta: 0 },
          { id: 'dip-gravy', name: 'Rich Gravy', priceDelta: 0 },
          { id: 'dip-cheese', name: 'Cheese Sauce (+£0.30)', priceDelta: 0.30 }
        ]
      },
      MEAL_DEAL_DRINK_MODIFIER
    ]
  },
  {
    id: 'item-027',
    name: 'The Sharing Roast',
    category: 'Meal Deals',
    description: 'A large sharing box of crispy roast potatoes with two toppings and two sauces.',
    itemType: 'Prepared food and beverage',
    inStock: true,
    tags: ['popular'],
    variations: [{ id: 'v-sharing-std', name: 'Standard', sku: 'ROASTUP-047', price: 15.00 }],
    defaultPrice: 15.00,
    modifierSets: [
      {
        id: 'share-topping-1',
        name: 'Choose 1st Protein / Main Topping',
        required: true,
        minSelections: 1,
        maxSelections: 1,
        options: [
          { id: 'st1-chicken', name: 'Shredded Roast Chicken', priceDelta: 0 },
          { id: 'st1-spicy', name: 'Spicy Chicken', priceDelta: 0 },
          { id: 'st1-tikka', name: 'Tikka Chicken (+£0.50)', priceDelta: 0.50 },
          { id: 'st1-bacon', name: 'Crispy Bacon Pieces', priceDelta: 0 },
          { id: 'st1-beans', name: 'Baked Beans', priceDelta: 0 }
        ]
      },
      {
        id: 'share-topping-2',
        name: 'Choose 2nd Protein / Main Topping',
        required: true,
        minSelections: 1,
        maxSelections: 1,
        options: [
          { id: 'st2-chicken', name: 'Shredded Roast Chicken', priceDelta: 0 },
          { id: 'st2-spicy', name: 'Spicy Chicken', priceDelta: 0 },
          { id: 'st2-tikka', name: 'Tikka Chicken (+£0.50)', priceDelta: 0.50 },
          { id: 'st2-bacon', name: 'Crispy Bacon Pieces', priceDelta: 0 },
          { id: 'st2-onions', name: 'Extra Crispy Onions', priceDelta: 0 }
        ]
      },
      {
        id: 'share-sauce-1',
        name: 'Choose 1st Sauce',
        required: true,
        minSelections: 1,
        maxSelections: 1,
        options: [
          { id: 'ss1-garlic', name: 'ROASTUP Garlic Mayo', priceDelta: 0 },
          { id: 'ss1-bbq', name: 'Smoky BBQ', priceDelta: 0 },
          { id: 'ss1-hot', name: 'Hot Sauce', priceDelta: 0 },
          { id: 'ss1-gravy', name: 'Gravy', priceDelta: 0 }
        ]
      },
      {
        id: 'share-sauce-2',
        name: 'Choose 2nd Sauce',
        required: true,
        minSelections: 1,
        maxSelections: 1,
        options: [
          { id: 'ss2-garlic', name: 'ROASTUP Garlic Mayo', priceDelta: 0 },
          { id: 'ss2-bbq', name: 'Smoky BBQ', priceDelta: 0 },
          { id: 'ss2-hot', name: 'Hot Sauce', priceDelta: 0 },
          { id: 'ss2-gravy', name: 'Gravy', priceDelta: 0 },
          { id: 'ss2-cheese', name: 'Cheese Sauce (+£0.50)', priceDelta: 0.50 }
        ]
      }
    ]
  },

  // 6. DRINKS
  {
    id: 'item-028',
    name: 'Canned Soft Drink',
    category: 'Drinks',
    description: 'Choose from available cold 330ml soft drinks.',
    itemType: 'Prepared food and beverage',
    inStock: true,
    variations: [{ id: 'v-can-std', name: 'Standard', sku: 'ROASTUP-048', price: 1.50 }],
    defaultPrice: 1.50,
    modifierSets: [
      {
        id: 'can-flavour',
        name: 'Drink Flavour',
        required: true,
        minSelections: 1,
        maxSelections: 1,
        options: [
          { id: 'can-coke', name: 'Coca-Cola (Original)', priceDelta: 0 },
          { id: 'can-diet', name: 'Diet Coke', priceDelta: 0 },
          { id: 'can-zero', name: 'Coke Zero', priceDelta: 0 },
          { id: 'can-sprite', name: 'Sprite', priceDelta: 0 },
          { id: 'can-fanta', name: 'Fanta Orange', priceDelta: 0 }
        ]
      }
    ]
  },
  {
    id: 'item-029',
    name: 'Bottled Water',
    category: 'Drinks',
    description: '500ml still bottled mineral water.',
    itemType: 'Prepared food and beverage',
    inStock: true,
    variations: [{ id: 'v-water-std', name: 'Standard', sku: 'ROASTUP-049', price: 1.20 }],
    defaultPrice: 1.20
  },
  {
    id: 'item-030',
    name: 'Large Soft Drink',
    category: 'Drinks',
    description: 'A large chilled fountain soft drink.',
    itemType: 'Prepared food and beverage',
    inStock: true,
    variations: [{ id: 'v-largedrink-std', name: 'Standard', sku: 'ROASTUP-050', price: 2.00 }],
    defaultPrice: 2.00
  },
  {
    id: 'item-031',
    name: 'ROASTUP Signature Drink',
    category: 'Drinks',
    description: 'A refreshing house-crafted signature spiced iced tea or punch.',
    itemType: 'Prepared food and beverage',
    inStock: true,
    tags: ['signature'],
    variations: [{ id: 'v-sigdrink-std', name: 'Standard', sku: 'ROASTUP-051', price: 2.50 }],
    defaultPrice: 2.50
  },

  // 7. BUILD YOUR OWN
  {
    id: 'item-032',
    name: 'Build Your Own Loaded Potato',
    category: 'Build Your Own',
    description: 'Create your own loaded roast potato with your choice of size, filling, cheese, toppings, sauce and extras.',
    itemType: 'Prepared food and beverage',
    inStock: true,
    tags: ['popular', 'signature'],
    variations: [
      { id: 'v-byo-s', name: 'Small', sku: 'ROASTUP-BYO-001S', price: 5.00 },
      { id: 'v-byo-m', name: 'Medium', sku: 'ROASTUP-BYO-001M', price: 6.20 },
      { id: 'v-byo-l', name: 'Large', sku: 'ROASTUP-BYO-001L', price: 7.40 }
    ],
    defaultPrice: 6.20,
    modifierSets: COMMON_BYO_MODIFIERS
  },
  {
    id: 'item-033',
    name: 'Build Your Own Roti Wrap',
    category: 'Build Your Own',
    description: 'Create your own roast potato roti wrap with your choice of filling, cheese, toppings, sauce and extras.',
    itemType: 'Prepared food and beverage',
    inStock: true,
    tags: ['signature'],
    variations: [{ id: 'v-byowrap-std', name: 'Standard', sku: 'ROASTUP-BYO-002', price: 6.50 }],
    defaultPrice: 6.50,
    modifierSets: COMMON_BYO_MODIFIERS
  }
];

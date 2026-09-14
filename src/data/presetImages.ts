/**
 * Preset Food Photography for ROASTUP
 * High-quality, reliable imagery for crispy roast potatoes, roti wraps, toppings, and drinks.
 */

export interface PresetImageOption {
  id: string;
  name: string;
  category: string;
  url: string;
  thumb: string;
}

export const PRESET_FOOD_IMAGES: PresetImageOption[] = [
  {
    id: 'roasties-og',
    name: 'The OG Crispy Roasties & Bacon',
    category: 'Loaded Potatoes',
    url: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&w=800&q=80',
    thumb: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&w=200&q=75'
  },
  {
    id: 'roasties-cheese-melt',
    name: 'Melted Cheddar & Spring Onion',
    category: 'Loaded Potatoes',
    url: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=800&q=80',
    thumb: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=200&q=75'
  },
  {
    id: 'roasties-gravy-chicken',
    name: 'Roast Chicken, Gravy & Herb Stuffing',
    category: 'Loaded Potatoes',
    url: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=800&q=80',
    thumb: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=200&q=75'
  },
  {
    id: 'roasties-spicy-jalapeno',
    name: 'Fiery Jalapeño & Hot Sauce',
    category: 'Loaded Potatoes',
    url: 'https://images.unsplash.com/photo-1585109649139-366815a0d713?auto=format&fit=crop&w=800&q=80',
    thumb: 'https://images.unsplash.com/photo-1585109649139-366815a0d713?auto=format&fit=crop&w=200&q=75'
  },
  {
    id: 'roasties-garlic-parm',
    name: 'Garlic Herb Butter & Parmesan',
    category: 'Loaded Potatoes',
    url: 'https://images.unsplash.com/photo-1518013034458-30d0f261ddab?auto=format&fit=crop&w=800&q=80',
    thumb: 'https://images.unsplash.com/photo-1518013034458-30d0f261ddab?auto=format&fit=crop&w=200&q=75'
  },
  {
    id: 'roasties-beans-cheese',
    name: 'Cheesy Baked Beans Roasties',
    category: 'Loaded Potatoes',
    url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
    thumb: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=200&q=75'
  },
  {
    id: 'wrap-roast-roti',
    name: 'Toasted Roti Potato Wrap',
    category: 'Roti Wraps',
    url: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=800&q=80',
    thumb: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=200&q=75'
  },
  {
    id: 'wrap-spicy-tikka',
    name: 'Spicy Chicken Tikka Wrap',
    category: 'Roti Wraps',
    url: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=800&q=80',
    thumb: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=200&q=75'
  },
  {
    id: 'side-stuffing-balls',
    name: 'Sage & Onion Stuffing Balls',
    category: 'Sides',
    url: 'https://images.unsplash.com/photo-1577906096429-f73c2c312435?auto=format&fit=crop&w=800&q=80',
    thumb: 'https://images.unsplash.com/photo-1577906096429-f73c2c312435?auto=format&fit=crop&w=200&q=75'
  },
  {
    id: 'side-crispy-onions',
    name: 'Crispy Golden Onion Tub',
    category: 'Sides',
    url: 'https://images.unsplash.com/photo-1619881590738-a111d176d906?auto=format&fit=crop&w=800&q=80',
    thumb: 'https://images.unsplash.com/photo-1619881590738-a111d176d906?auto=format&fit=crop&w=200&q=75'
  },
  {
    id: 'sauce-rich-gravy',
    name: 'Rich Savoury Gravy Dip Pot',
    category: 'Sauces',
    url: 'https://images.unsplash.com/photo-1546549032-9571cd6b27df?auto=format&fit=crop&w=800&q=80',
    thumb: 'https://images.unsplash.com/photo-1546549032-9571cd6b27df?auto=format&fit=crop&w=200&q=75'
  },
  {
    id: 'sauce-garlic-mayo',
    name: 'ROASTUP Garlic Mayo Dip',
    category: 'Sauces',
    url: 'https://images.unsplash.com/photo-1472476443507-c7a5948772fc?auto=format&fit=crop&w=800&q=80',
    thumb: 'https://images.unsplash.com/photo-1472476443507-c7a5948772fc?auto=format&fit=crop&w=200&q=75'
  },
  {
    id: 'drink-soft-can',
    name: 'Chilled Canned Soft Drinks',
    category: 'Drinks',
    url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=800&q=80',
    thumb: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=200&q=75'
  },
  {
    id: 'deal-solo-combo',
    name: 'Loaded Roastie & Cold Drink Deal',
    category: 'Meal Deals',
    url: 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?auto=format&fit=crop&w=800&q=80',
    thumb: 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?auto=format&fit=crop&w=200&q=75'
  }
];

import { IngredientDef } from '../types';

export const INGREDIENTS: IngredientDef[] = [
  // ─── Grains & Flour ───────────────────────────────────────────────
  { name: 'rice', emoji: '🍚', defaultUnit: 'kg', shelfLife: { pantry: 365, shelf: 180 }, lowThreshold: 0.5 },
  { name: 'basmati rice', emoji: '🍚', defaultUnit: 'kg', shelfLife: { pantry: 365, shelf: 180 }, lowThreshold: 0.5 },
  { name: 'atta', emoji: '🌾', defaultUnit: 'kg', shelfLife: { pantry: 60, shelf: 30 }, lowThreshold: 0.5 },
  { name: 'maida', emoji: '🌾', defaultUnit: 'kg', shelfLife: { pantry: 90, shelf: 30 }, lowThreshold: 0.5 },
  { name: 'rice flour', emoji: '🌾', defaultUnit: 'g', shelfLife: { pantry: 180 }, lowThreshold: 100 },
  { name: 'semolina', emoji: '🌾', defaultUnit: 'g', shelfLife: { pantry: 90 }, lowThreshold: 100 },
  { name: 'poha', emoji: '🍚', defaultUnit: 'g', shelfLife: { pantry: 90 }, lowThreshold: 100 },
  { name: 'besan', emoji: '🌾', defaultUnit: 'g', shelfLife: { pantry: 120 }, lowThreshold: 100 },
  { name: 'vermicelli', emoji: '🍝', defaultUnit: 'g', shelfLife: { pantry: 180 }, lowThreshold: 100 },
  { name: 'pasta', emoji: '🍝', defaultUnit: 'g', shelfLife: { pantry: 365 }, lowThreshold: 100 },
  { name: 'bread', emoji: '🍞', defaultUnit: 'pcs', shelfLife: { shelf: 3, fridge: 7 }, lowThreshold: 2 },

  // ─── Pulses & Legumes ─────────────────────────────────────────────
  { name: 'toor dal', emoji: '🫘', defaultUnit: 'g', shelfLife: { pantry: 365 }, lowThreshold: 100 },
  { name: 'moong dal', emoji: '🫘', defaultUnit: 'g', shelfLife: { pantry: 365 }, lowThreshold: 100 },
  { name: 'urad dal', emoji: '🫘', defaultUnit: 'g', shelfLife: { pantry: 365 }, lowThreshold: 100 },
  { name: 'chana dal', emoji: '🫘', defaultUnit: 'g', shelfLife: { pantry: 365 }, lowThreshold: 100 },
  { name: 'kidney beans', emoji: '🫘', defaultUnit: 'g', shelfLife: { pantry: 365 }, lowThreshold: 100 },
  { name: 'chickpeas', emoji: '🫘', defaultUnit: 'g', shelfLife: { pantry: 365 }, lowThreshold: 100 },
  { name: 'black lentils', emoji: '🫘', defaultUnit: 'g', shelfLife: { pantry: 365 }, lowThreshold: 100 },

  // ─── Vegetables ───────────────────────────────────────────────────
  { name: 'onion', emoji: '🧅', defaultUnit: 'pcs', shelfLife: { shelf: 14, pantry: 21, fridge: 30 }, lowThreshold: 2 },
  { name: 'tomato', emoji: '🍅', defaultUnit: 'pcs', shelfLife: { shelf: 5, fridge: 10 }, lowThreshold: 2 },
  { name: 'potato', emoji: '🥔', defaultUnit: 'pcs', shelfLife: { shelf: 14, pantry: 21, fridge: 21 }, lowThreshold: 2 },
  { name: 'garlic', emoji: '🧄', defaultUnit: 'pcs', shelfLife: { shelf: 30, pantry: 30, fridge: 60 }, lowThreshold: 1 },
  { name: 'ginger', emoji: '🫚', defaultUnit: 'g', shelfLife: { shelf: 7, fridge: 21, freezer: 180 }, lowThreshold: 20 },
  { name: 'green chilli', emoji: '🌶️', defaultUnit: 'pcs', shelfLife: { shelf: 3, fridge: 7 }, lowThreshold: 2 },
  { name: 'spinach', emoji: '🥬', defaultUnit: 'g', shelfLife: { fridge: 5 }, lowThreshold: 100 },
  { name: 'cauliflower', emoji: '🥦', defaultUnit: 'pcs', shelfLife: { shelf: 3, fridge: 7 }, lowThreshold: 1 },
  { name: 'eggplant', emoji: '🍆', defaultUnit: 'pcs', shelfLife: { shelf: 4, fridge: 7 }, lowThreshold: 1 },
  { name: 'carrot', emoji: '🥕', defaultUnit: 'pcs', shelfLife: { shelf: 5, fridge: 14 }, lowThreshold: 2 },
  { name: 'drumstick', emoji: '🌿', defaultUnit: 'pcs', shelfLife: { fridge: 5 }, lowThreshold: 2 },
  { name: 'spring onion', emoji: '🌱', defaultUnit: 'pcs', shelfLife: { fridge: 7 }, lowThreshold: 2 },
  { name: 'lemon', emoji: '🍋', defaultUnit: 'pcs', shelfLife: { shelf: 7, fridge: 21 }, lowThreshold: 1 },
  { name: 'coconut', emoji: '🥥', defaultUnit: 'pcs', shelfLife: { shelf: 7, fridge: 14 }, lowThreshold: 1 },

  // ─── Herbs ────────────────────────────────────────────────────────
  { name: 'curry leaves', emoji: '🍃', defaultUnit: 'g', shelfLife: { fridge: 7, freezer: 90 }, lowThreshold: 5 },
  { name: 'coriander leaves', emoji: '🌿', defaultUnit: 'g', shelfLife: { fridge: 5 }, lowThreshold: 10 },
  { name: 'mint leaves', emoji: '🌿', defaultUnit: 'g', shelfLife: { fridge: 5 }, lowThreshold: 10 },

  // ─── Dairy & Eggs ─────────────────────────────────────────────────
  { name: 'eggs', emoji: '🥚', defaultUnit: 'pcs', shelfLife: { shelf: 7, fridge: 21 }, lowThreshold: 2 },
  { name: 'milk', emoji: '🥛', defaultUnit: 'L', shelfLife: { fridge: 5 }, lowThreshold: 0.5 },
  { name: 'yogurt', emoji: '🥛', defaultUnit: 'g', shelfLife: { fridge: 7 }, lowThreshold: 100 },
  { name: 'paneer', emoji: '🧀', defaultUnit: 'g', shelfLife: { fridge: 5, freezer: 30 }, lowThreshold: 100 },
  { name: 'butter', emoji: '🧈', defaultUnit: 'g', shelfLife: { fridge: 30, freezer: 90 }, lowThreshold: 50 },
  { name: 'cream', emoji: '🥛', defaultUnit: 'ml', shelfLife: { fridge: 5 }, lowThreshold: 50 },
  { name: 'ghee', emoji: '🧈', defaultUnit: 'g', shelfLife: { pantry: 90, fridge: 365 }, lowThreshold: 50 },

  // ─── Meat & Seafood ───────────────────────────────────────────────
  { name: 'chicken', emoji: '🍗', defaultUnit: 'g', shelfLife: { fridge: 2, freezer: 90 }, lowThreshold: 200 },
  { name: 'fish', emoji: '🐟', defaultUnit: 'g', shelfLife: { fridge: 1, freezer: 60 }, lowThreshold: 200 },
  { name: 'prawns', emoji: '🦐', defaultUnit: 'g', shelfLife: { fridge: 1, freezer: 60 }, lowThreshold: 200 },

  // ─── Liquids & Sauces ─────────────────────────────────────────────
  { name: 'oil', emoji: '🫙', defaultUnit: 'ml', shelfLife: { pantry: 365, shelf: 90 }, lowThreshold: 100 },
  { name: 'coconut milk', emoji: '🥥', defaultUnit: 'ml', shelfLife: { pantry: 365, fridge: 3 }, lowThreshold: 100 },
  { name: 'tamarind', emoji: '🟤', defaultUnit: 'g', shelfLife: { pantry: 90, fridge: 180 }, lowThreshold: 20 },
  { name: 'soy sauce', emoji: '🫙', defaultUnit: 'ml', shelfLife: { pantry: 365, fridge: 730 }, lowThreshold: 50 },
  { name: 'vinegar', emoji: '🫙', defaultUnit: 'ml', shelfLife: { pantry: 730 }, lowThreshold: 50 },
  { name: 'olive oil', emoji: '🫙', defaultUnit: 'ml', shelfLife: { pantry: 365 }, lowThreshold: 50 },

  // ─── Spices & Seasonings ──────────────────────────────────────────
  { name: 'salt', emoji: '🧂', defaultUnit: 'g', shelfLife: { pantry: 9999, shelf: 9999 }, lowThreshold: 50 },
  { name: 'sugar', emoji: '🍬', defaultUnit: 'g', shelfLife: { pantry: 730, shelf: 730 }, lowThreshold: 100 },
  { name: 'jaggery', emoji: '🟤', defaultUnit: 'g', shelfLife: { pantry: 180 }, lowThreshold: 50 },
  { name: 'red chilli powder', emoji: '🌶️', defaultUnit: 'g', shelfLife: { pantry: 365 }, lowThreshold: 20 },
  { name: 'turmeric powder', emoji: '🟡', defaultUnit: 'g', shelfLife: { pantry: 730 }, lowThreshold: 10 },
  { name: 'coriander powder', emoji: '🌿', defaultUnit: 'g', shelfLife: { pantry: 365 }, lowThreshold: 20 },
  { name: 'cumin seeds', emoji: '🟤', defaultUnit: 'g', shelfLife: { pantry: 365 }, lowThreshold: 20 },
  { name: 'cumin powder', emoji: '🟤', defaultUnit: 'g', shelfLife: { pantry: 365 }, lowThreshold: 20 },
  { name: 'mustard seeds', emoji: '⚫', defaultUnit: 'g', shelfLife: { pantry: 365 }, lowThreshold: 20 },
  { name: 'garam masala', emoji: '🌶️', defaultUnit: 'g', shelfLife: { pantry: 365 }, lowThreshold: 20 },
  { name: 'cardamom', emoji: '💚', defaultUnit: 'g', shelfLife: { pantry: 365 }, lowThreshold: 10 },
  { name: 'cinnamon', emoji: '🟤', defaultUnit: 'g', shelfLife: { pantry: 365 }, lowThreshold: 10 },
  { name: 'cloves', emoji: '🟤', defaultUnit: 'g', shelfLife: { pantry: 365 }, lowThreshold: 10 },
  { name: 'bay leaves', emoji: '🍃', defaultUnit: 'g', shelfLife: { pantry: 365 }, lowThreshold: 5 },
  { name: 'black pepper', emoji: '⚫', defaultUnit: 'g', shelfLife: { pantry: 365 }, lowThreshold: 10 },
  { name: 'fenugreek seeds', emoji: '🟡', defaultUnit: 'g', shelfLife: { pantry: 365 }, lowThreshold: 10 },
  { name: 'saffron', emoji: '🟡', defaultUnit: 'g', shelfLife: { pantry: 730 }, lowThreshold: 1 },
  { name: 'amchur', emoji: '🟡', defaultUnit: 'g', shelfLife: { pantry: 365 }, lowThreshold: 10 },
  { name: 'poppy seeds', emoji: '⚫', defaultUnit: 'g', shelfLife: { pantry: 365 }, lowThreshold: 20 },
  { name: 'sesame seeds', emoji: '⚪', defaultUnit: 'g', shelfLife: { pantry: 180 }, lowThreshold: 20 },
  { name: 'sambar powder', emoji: '🌶️', defaultUnit: 'g', shelfLife: { pantry: 365 }, lowThreshold: 20 },

  // ─── Nuts & Dry Fruits ────────────────────────────────────────────
  { name: 'cashews', emoji: '🥜', defaultUnit: 'g', shelfLife: { pantry: 90 }, lowThreshold: 30 },
  { name: 'peanuts', emoji: '🥜', defaultUnit: 'g', shelfLife: { pantry: 90 }, lowThreshold: 30 },
  { name: 'almonds', emoji: '🥜', defaultUnit: 'g', shelfLife: { pantry: 180 }, lowThreshold: 30 },
  { name: 'raisins', emoji: '🍇', defaultUnit: 'g', shelfLife: { pantry: 180 }, lowThreshold: 30 },
  { name: 'dates', emoji: '🟤', defaultUnit: 'g', shelfLife: { pantry: 180, fridge: 365 }, lowThreshold: 50 },

  // ─── Beverages ────────────────────────────────────────────────────
  { name: 'tea leaves', emoji: '🍵', defaultUnit: 'g', shelfLife: { pantry: 365 }, lowThreshold: 20 },
];

export const INGREDIENT_MAP = new Map(INGREDIENTS.map(i => [i.name.toLowerCase(), i]));

export function getIngredientDef(name: string): IngredientDef | undefined {
  return INGREDIENT_MAP.get(name.toLowerCase());
}

export function getEmoji(name: string): string {
  const def = getIngredientDef(name);
  return def?.emoji ?? '🥘';
}

export function getSuggestedExpiry(
  ingredientName: string,
  location: string,
  fromDate: Date = new Date()
): Date | null {
  const def = getIngredientDef(ingredientName);
  if (!def) return null;
  const days = def.shelfLife[location as keyof typeof def.shelfLife];
  if (!days) return null;
  const d = new Date(fromDate);
  d.setDate(d.getDate() + days);
  return d;
}

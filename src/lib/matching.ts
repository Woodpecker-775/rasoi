import { Recipe, InventoryItem, MatchResult, ExpiryStatus } from '../types';

// ─── Name normalisation ────────────────────────────────────────────────
const STRIP_SUFFIXES = ['leaves', 'paste', 'seeds', 'fresh', 'dried', 'ground', 'whole', 'powder'];

function variants(name: string): string[] {
  const base = name.toLowerCase().trim();
  const v = [base];
  for (const s of STRIP_SUFFIXES) {
    if (base.endsWith(' ' + s)) v.push(base.slice(0, -(s.length + 1)).trim());
    if (base.startsWith(s + ' ')) v.push(base.slice(s.length + 1).trim());
  }
  return v;
}

export function ingredientsMatch(recipeName: string, inventoryName: string): boolean {
  const rv = variants(recipeName);
  const iv = variants(inventoryName);
  for (const r of rv) {
    for (const i of iv) {
      if (r === i) return true;
    }
  }
  return false;
}

function findInInventory(ingredientName: string, inventory: InventoryItem[]): InventoryItem | undefined {
  return inventory.find(
    item => item.quantity > 0 && ingredientsMatch(ingredientName, item.name)
  );
}

// ─── Expiry helpers ────────────────────────────────────────────────────
export function getExpiryStatus(item: InventoryItem): ExpiryStatus {
  if (!item.expiryDate) return 'fresh';
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const expiry = new Date(item.expiryDate); expiry.setHours(0, 0, 0, 0);
  const diff = Math.floor((expiry.getTime() - today.getTime()) / 86400000);
  if (diff < 0) return 'expired';
  if (diff <= 2) return 'soon';
  return 'fresh';
}

export function daysUntilExpiry(item: InventoryItem): number | null {
  if (!item.expiryDate) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const expiry = new Date(item.expiryDate); expiry.setHours(0, 0, 0, 0);
  return Math.floor((expiry.getTime() - today.getTime()) / 86400000);
}

// ─── Core recipe matching ──────────────────────────────────────────────
export function matchRecipe(recipe: Recipe, inventory: InventoryItem[]): MatchResult {
  const required = recipe.ingredients.filter(i => !i.optional);
  const missing: string[] = [];
  const expiringNames: string[] = [];

  for (const ing of required) {
    const found = findInInventory(ing.name, inventory);
    if (!found) {
      missing.push(ing.name);
    } else {
      const status = getExpiryStatus(found);
      if (status === 'soon' || status === 'expired') {
        expiringNames.push(found.name);
      }
    }
  }

  return {
    recipe,
    canMake: missing.length === 0,
    missingIngredients: missing,
    usesExpiring: expiringNames.length > 0,
    expiringNames,
  };
}

export function matchAllRecipes(recipes: Recipe[], inventory: InventoryItem[]): MatchResult[] {
  return recipes.map(r => matchRecipe(r, inventory));
}

// ─── Filtering ─────────────────────────────────────────────────────────
export function filterRecipes(
  results: MatchResult[],
  cuisine: string,
  regions: string[],
  categories: string[],
  timeCategory: string | null
): MatchResult[] {
  return results.filter(({ recipe: r }) => {
    // Cuisine filter
    if (cuisine !== 'Quick/Anything') {
      if (r.cuisine !== cuisine && !(cuisine === 'Indian' && r.cuisine === 'Indian')) {
        if (r.cuisine !== cuisine) return false;
      }
    }

    // Region filter (only applies when Indian selected)
    if (cuisine === 'Indian' && regions.length > 0) {
      if (!r.region || !regions.includes(r.region)) return false;
    }

    // Category filter — combine explicit selection + time override
    const activeCategories = categories.length > 0
      ? categories
      : timeCategory
        ? [timeCategory]
        : [];

    if (activeCategories.length > 0) {
      if (!activeCategories.includes(r.category)) return false;
    }

    return true;
  });
}

// ─── Sorting ───────────────────────────────────────────────────────────
export function sortByEffortAndExpiry(results: MatchResult[]): MatchResult[] {
  return [...results].sort((a, b) => {
    // Expiring items first
    if (a.usesExpiring && !b.usesExpiring) return -1;
    if (!a.usesExpiring && b.usesExpiring) return 1;
    // Then by effort
    return a.recipe.effort - b.recipe.effort;
  });
}

// ─── Unlock suggestions ────────────────────────────────────────────────
export interface UnlockSuggestion {
  ingredient: string;
  unlocksCount: number;
  recipeNames: string[];
}

export function getUnlockSuggestions(
  results: MatchResult[],
  maxMissing = 2
): UnlockSuggestion[] {
  const countMap = new Map<string, Set<string>>();

  for (const result of results) {
    if (!result.canMake && result.missingIngredients.length <= maxMissing) {
      for (const ing of result.missingIngredients) {
        if (!countMap.has(ing)) countMap.set(ing, new Set());
        countMap.get(ing)!.add(result.recipe.name);
      }
    }
  }

  const suggestions: UnlockSuggestion[] = [];
  for (const [ingredient, names] of countMap.entries()) {
    suggestions.push({
      ingredient,
      unlocksCount: names.size,
      recipeNames: Array.from(names),
    });
  }

  return suggestions.sort((a, b) => b.unlocksCount - a.unlocksCount).slice(0, 6);
}

// ─── Time helpers ──────────────────────────────────────────────────────
export function getMealTimeCategory(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 11) return 'Breakfast';
  if (h >= 11 && h < 16) return 'Lunch';
  if (h >= 16 && h < 19) return 'Snack';
  return 'Dinner';
}

export function getGreeting(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'Good morning';
  if (h >= 12 && h < 17) return 'Good afternoon';
  if (h >= 17 && h < 21) return 'Good evening';
  return 'Good night';
}

export function formatTime(): string {
  return new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

// ─── Low stock ─────────────────────────────────────────────────────────
export function isLowStock(item: InventoryItem): boolean {
  const threshold = item.lowThreshold ?? 1;
  return item.quantity <= threshold;
}

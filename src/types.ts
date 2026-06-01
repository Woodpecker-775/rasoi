export type StorageLocation = 'shelf' | 'pantry' | 'fridge' | 'freezer';
export type ExpiryStatus = 'fresh' | 'soon' | 'expired';
export type Cuisine = 'Indian' | 'Chinese' | 'Italian' | 'Continental' | 'Quick';
export type Region = 'Kerala' | 'Hyderabadi' | 'Punjabi' | 'South Indian' | 'North Indian' | 'Bengali' | 'Gujarati';
export type MealCategory = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack' | 'Sweet' | 'Drink';

export interface RecipeIngredient {
  name: string;
  quantity?: number;
  unit?: string;
  optional?: boolean;
}

export interface Recipe {
  id: string;
  name: string;
  cuisine: Cuisine;
  region?: Region;
  category: MealCategory;
  effort: 1 | 2 | 3 | 4 | 5;
  timeMinutes: number;
  ingredients: RecipeIngredient[];
  steps: string[];
  description?: string;
}

export interface IngredientDef {
  name: string;
  emoji: string;
  defaultUnit: string;
  shelfLife: Partial<Record<StorageLocation, number>>;
  lowThreshold: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  emoji: string;
  quantity: number;
  unit: string;
  location: StorageLocation;
  expiryDate?: string; // YYYY-MM-DD
  lowThreshold?: number;
  addedAt: string;
}

export interface AppSettings {
  geminiApiKey: string;
  openRouterModel: string;
  cuisinePreference: Cuisine;
  selectedRegions: Region[];
  selectedCategories: MealCategory[];
  overrideTimeCategory: MealCategory | null;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ShoppingNote {
  id: string;
  text: string;
  addedAt: string;
}

export interface MatchResult {
  recipe: Recipe;
  canMake: boolean;
  missingIngredients: string[];
  usesExpiring: boolean;
  expiringNames: string[];
}

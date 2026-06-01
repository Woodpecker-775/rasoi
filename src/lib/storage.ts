import { InventoryItem, AppSettings, ChatMessage, ShoppingNote } from '../types';

const KEYS = {
  INVENTORY: 'rasoi_inventory',
  SETTINGS: 'rasoi_settings',
  CHAT: 'rasoi_chat',
  SHOPPING: 'rasoi_shopping',
} as const;

function get<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function set<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore (e.g. private mode quota)
  }
}

// ─── Inventory ────────────────────────────────────────────────────────
export function loadInventory(): InventoryItem[] {
  return get<InventoryItem[]>(KEYS.INVENTORY, []);
}

export function saveInventory(items: InventoryItem[]): void {
  set(KEYS.INVENTORY, items);
}

// ─── Settings ─────────────────────────────────────────────────────────
const DEFAULT_SETTINGS: AppSettings = {
  geminiApiKey: '',
  openRouterModel: 'mistralai/mistral-7b-instruct:free',
  cuisinePreference: 'Indian',
  selectedRegions: [],
  selectedCategories: [],
  overrideTimeCategory: null,
};

export function loadSettings(): AppSettings {
  const saved = get<Partial<AppSettings>>(KEYS.SETTINGS, {});
  return { ...DEFAULT_SETTINGS, ...saved };
}

export function saveSettings(settings: AppSettings): void {
  set(KEYS.SETTINGS, settings);
}

// ─── Chat history ─────────────────────────────────────────────────────
export function loadChat(): ChatMessage[] {
  return get<ChatMessage[]>(KEYS.CHAT, []);
}

export function saveChat(messages: ChatMessage[]): void {
  // Keep only last 50 messages to avoid localStorage bloat
  set(KEYS.CHAT, messages.slice(-50));
}

// ─── Shopping notes ───────────────────────────────────────────────────
export function loadShopping(): ShoppingNote[] {
  return get<ShoppingNote[]>(KEYS.SHOPPING, []);
}

export function saveShopping(notes: ShoppingNote[]): void {
  set(KEYS.SHOPPING, notes);
}

// ─── Utils ────────────────────────────────────────────────────────────
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

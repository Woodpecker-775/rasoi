import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  InventoryItem, AppSettings, ChatMessage, ShoppingNote
} from '../types';
import {
  loadInventory, saveInventory, loadSettings, saveSettings,
  loadChat, saveChat, loadShopping, saveShopping, generateId, todayISO
} from '../lib/storage';
import { getExpiryStatus, isLowStock } from '../lib/matching';
import { getEmoji } from '../data/ingredients';

interface AppContextType {
  // Inventory
  inventory: InventoryItem[];
  addItem: (item: Omit<InventoryItem, 'id' | 'addedAt'>) => void;
  updateItem: (id: string, updates: Partial<InventoryItem>) => void;
  removeItem: (id: string) => void;

  // Settings
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => void;

  // Chat
  chatMessages: ChatMessage[];
  addChatMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  clearChat: () => void;

  // Shopping
  shoppingNotes: ShoppingNote[];
  addShoppingNote: (text: string) => void;
  removeShoppingNote: (id: string) => void;

  // Derived
  expiringItems: InventoryItem[];
  lowItems: InventoryItem[];
  hasApiKey: boolean;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [inventory, setInventory] = useState<InventoryItem[]>(() => loadInventory());
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => loadChat());
  const [shoppingNotes, setShoppingNotes] = useState<ShoppingNote[]>(() => loadShopping());

  // Persist whenever state changes
  useEffect(() => { saveInventory(inventory); }, [inventory]);
  useEffect(() => { saveSettings(settings); }, [settings]);
  useEffect(() => { saveChat(chatMessages); }, [chatMessages]);
  useEffect(() => { saveShopping(shoppingNotes); }, [shoppingNotes]);

  // Inventory
  const addItem = useCallback((item: Omit<InventoryItem, 'id' | 'addedAt'>) => {
    const newItem: InventoryItem = {
      ...item,
      id: generateId(),
      addedAt: todayISO(),
      emoji: item.emoji || getEmoji(item.name),
    };
    setInventory(prev => [...prev, newItem]);
  }, []);

  const updateItem = useCallback((id: string, updates: Partial<InventoryItem>) => {
    setInventory(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
  }, []);

  const removeItem = useCallback((id: string) => {
    setInventory(prev => prev.filter(i => i.id !== id));
  }, []);

  // Settings
  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  }, []);

  // Chat
  const addChatMessage = useCallback((msg: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMsg: ChatMessage = {
      ...msg,
      id: generateId(),
      timestamp: new Date().toISOString(),
    };
    setChatMessages(prev => [...prev, newMsg]);
  }, []);

  const clearChat = useCallback(() => setChatMessages([]), []);

  // Shopping
  const addShoppingNote = useCallback((text: string) => {
    setShoppingNotes(prev => [
      ...prev,
      { id: generateId(), text, addedAt: todayISO() },
    ]);
  }, []);

  const removeShoppingNote = useCallback((id: string) => {
    setShoppingNotes(prev => prev.filter(n => n.id !== id));
  }, []);

  // Derived
  const expiringItems = inventory.filter(i => {
    const s = getExpiryStatus(i);
    return s === 'soon' || s === 'expired';
  });

  const lowItems = inventory.filter(isLowStock);
  // In production the built-in AI (Vercel → Groq) is always available; only gate in local dev
  const hasApiKey = !!settings.geminiApiKey.trim() || !import.meta.env.DEV;

  return (
    <AppContext.Provider value={{
      inventory, addItem, updateItem, removeItem,
      settings, updateSettings,
      chatMessages, addChatMessage, clearChat,
      shoppingNotes, addShoppingNote, removeShoppingNote,
      expiringItems, lowItems, hasApiKey,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

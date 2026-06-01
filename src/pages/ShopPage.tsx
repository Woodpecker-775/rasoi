import { useState } from 'react';
import { Plus, Check, Trash2, Pencil } from 'lucide-react';
import { useApp } from '../context/AppContext';
import AddIngredientModal from '../components/AddIngredientModal';
import { getIngredientDef, getEmoji } from '../data/ingredients';
import { ShoppingNote, StorageLocation, InventoryItem } from '../types';
import { generateId, todayISO } from '../lib/storage';
import { getSuggestedExpiry } from '../data/ingredients';

function getDefaultLocation(name: string): StorageLocation {
  const def = getIngredientDef(name);
  if (!def) return 'fridge';
  if (def.shelfLife.fridge !== undefined) return 'fridge';
  if (def.shelfLife.pantry !== undefined) return 'pantry';
  if (def.shelfLife.freezer !== undefined) return 'freezer';
  return 'shelf';
}

function buildDefaultItem(name: string): InventoryItem {
  const def = getIngredientDef(name);
  const location = getDefaultLocation(name);
  const expiry = getSuggestedExpiry(name, location);
  return {
    id: generateId(),
    name: name.trim().toLowerCase(),
    emoji: getEmoji(name),
    quantity: 1,
    unit: def?.defaultUnit ?? 'pcs',
    location,
    expiryDate: expiry ? expiry.toISOString().split('T')[0] : undefined,
    lowThreshold: def?.lowThreshold,
    addedAt: todayISO(),
  };
}

export default function ShopPage() {
  const { shoppingNotes, addShoppingNote, removeShoppingNote, addItem, updateItem, inventory } = useApp();
  const [customInput, setCustomInput] = useState('');
  // Tracks which notes are in the "just ticked → added" animation state
  const [justAdded, setJustAdded] = useState<Set<string>>(new Set());
  // When ticking, briefly show the edit modal for that item
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  function handleAddCustom() {
    const text = customInput.trim().toLowerCase();
    if (!text) return;
    // Don't add duplicates
    if (shoppingNotes.some(n => n.text === text)) return;
    addShoppingNote(text);
    setCustomInput('');
  }

  function handleTick(note: ShoppingNote) {
    // Auto-build a sensible inventory item from defaults
    const item = buildDefaultItem(note.text);
    // Open the edit modal so user can optionally adjust before saving
    setEditingItem(item);
    setEditingNoteId(note.id);
  }

  function handleSaveItem(item: InventoryItem) {
    // Check if item with same name already exists in inventory
    const existing = inventory.find(
      i => i.name.toLowerCase() === item.name.toLowerCase()
    );
    if (existing) {
      // Merge: bump quantity
      updateItem(existing.id, { quantity: existing.quantity + item.quantity });
    } else {
      addItem(item);
    }
    // Animate and remove from shopping list
    if (editingNoteId) {
      setJustAdded(prev => new Set([...prev, editingNoteId]));
      setTimeout(() => {
        removeShoppingNote(editingNoteId);
        setJustAdded(prev => { const n = new Set(prev); n.delete(editingNoteId!); return n; });
      }, 600);
    }
    setEditingItem(null);
    setEditingNoteId(null);
  }

  function handleCloseModal() {
    setEditingItem(null);
    setEditingNoteId(null);
  }

  function clearAll() {
    shoppingNotes.forEach(n => removeShoppingNote(n.id));
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-4 pb-24 space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-stone-800">Shopping List 🛒</h2>
        <p className="text-xs text-stone-500 mt-0.5">
          Tick off when you buy — I'll add it to your kitchen automatically
        </p>
      </div>

      {/* Custom item input */}
      <div className="flex gap-2">
        <input
          value={customInput}
          onChange={e => setCustomInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAddCustom()}
          placeholder="Add anything to your list…"
          className="flex-1 bg-white border border-amber-100 rounded-2xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-300 shadow-sm"
        />
        <button
          onClick={handleAddCustom}
          disabled={!customInput.trim()}
          className="tap-target bg-orange-500 text-white px-4 py-2.5 rounded-2xl disabled:opacity-40 hover:bg-orange-600 transition-colors shadow-sm"
          aria-label="Add item"
        >
          <Plus size={18} />
        </button>
      </div>

      {/* How-it-works hint */}
      {shoppingNotes.length > 0 && (
        <p className="text-xs text-stone-400 flex items-center gap-1">
          <span className="w-4 h-4 rounded-full border-2 border-stone-300 inline-block shrink-0" />
          Tick an item → set quantity & expiry → it lands in Kitchen
        </p>
      )}

      {/* Empty state */}
      {shoppingNotes.length === 0 && (
        <div className="text-center py-16 space-y-3">
          <div className="text-6xl">🛍️</div>
          <p className="font-semibold text-stone-700">Nothing on the list yet</p>
          <p className="text-sm text-stone-500 max-w-xs mx-auto">
            Add items above, or use the{' '}
            <span className="font-medium text-orange-500">List</span> buttons on
            recipes in Cook &amp; Explore.
          </p>
        </div>
      )}

      {/* List */}
      <div className="space-y-2">
        {shoppingNotes.map(note => {
          const isAnimating = justAdded.has(note.id);
          const emoji = getEmoji(note.text);

          return (
            <div
              key={note.id}
              className={`flex items-center gap-3 bg-white border rounded-2xl px-4 py-3.5 transition-all duration-300 ${
                isAnimating
                  ? 'border-green-200 bg-green-50 scale-[0.98] opacity-60'
                  : 'border-amber-100 shadow-sm'
              }`}
            >
              {/* Checkbox */}
              <button
                onClick={() => !isAnimating && handleTick(note)}
                disabled={isAnimating}
                className={`tap-target shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                  isAnimating
                    ? 'bg-green-500 border-green-500'
                    : 'border-stone-300 hover:border-orange-400 hover:bg-orange-50'
                }`}
                aria-label="Mark as bought"
              >
                {isAnimating && <Check size={13} className="text-white" strokeWidth={3} />}
              </button>

              {/* Name */}
              <div className="flex-1 min-w-0">
                <span className={`text-sm capitalize ${isAnimating ? 'text-green-700 line-through' : 'text-stone-800'}`}>
                  {emoji} {note.text}
                </span>
                {isAnimating && (
                  <p className="text-[10px] text-green-600 mt-0.5">Added to Kitchen ✓</p>
                )}
              </div>

              {/* Delete */}
              {!isAnimating && (
                <button
                  onClick={() => removeShoppingNote(note.id)}
                  className="tap-target p-1.5 text-stone-300 hover:text-red-400 transition-colors shrink-0"
                  aria-label="Remove"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Clear all */}
      {shoppingNotes.length >= 3 && (
        <button
          onClick={clearAll}
          className="tap-target w-full text-center text-xs text-stone-400 hover:text-red-400 py-2 transition-colors"
        >
          Clear entire list
        </button>
      )}

      {/* Edit modal — opens when user ticks an item */}
      {editingItem && (
        <AddIngredientModal
          initial={editingItem}
          onSave={handleSaveItem}
          onClose={handleCloseModal}
          title={`Got it! Add ${editingItem.emoji} ${editingItem.name} to Kitchen`}
          saveLabel="Add to Kitchen 🏠"
        />
      )}
    </div>
  );
}

import { useState, useEffect, useRef, useMemo } from 'react';
import { X, Plus, Minus, ChevronDown } from 'lucide-react';
import { InventoryItem, StorageLocation } from '../types';
import { INGREDIENTS, getEmoji, getSuggestedExpiry } from '../data/ingredients';
import { generateId, todayISO } from '../lib/storage';

interface Props {
  initial?: InventoryItem;
  onSave: (item: InventoryItem) => void;
  onClose: () => void;
  title?: string;
  saveLabel?: string;
}

const LOCATIONS: StorageLocation[] = ['fridge', 'freezer', 'pantry', 'shelf'];
const LOCATION_EMOJI: Record<StorageLocation, string> = {
  fridge: '🧊', freezer: '❄️', pantry: '📦', shelf: '🪴',
};
const UNITS = ['pcs', 'g', 'kg', 'ml', 'L', 'cup', 'tbsp', 'tsp'];

function formatDateForInput(d: Date): string {
  return d.toISOString().split('T')[0];
}

export default function AddIngredientModal({ initial, onSave, onClose, title, saveLabel }: Props) {
  const [name, setName] = useState(initial?.name ?? '');
  const [emoji, setEmoji] = useState(initial?.emoji ?? '🥘');
  const [quantity, setQuantity] = useState(initial?.quantity ?? 1);
  const [unit, setUnit] = useState(initial?.unit ?? 'pcs');
  const [location, setLocation] = useState<StorageLocation>(initial?.location ?? 'fridge');
  const [expiryDate, setExpiryDate] = useState(initial?.expiryDate ?? '');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const isEditing = !!initial && !saveLabel;

  const filtered = useMemo(() => {
    if (!name.trim() || name.length < 2) return [];
    return INGREDIENTS.filter(i =>
      i.name.toLowerCase().includes(name.toLowerCase())
    ).slice(0, 8);
  }, [name]);

  // Auto-suggest expiry when location changes
  useEffect(() => {
    if (!name || isEditing) return;
    const suggested = getSuggestedExpiry(name, location);
    if (suggested) setExpiryDate(formatDateForInput(suggested));
  }, [location, name, isEditing]);

  function selectIngredient(ingName: string) {
    setName(ingName);
    setEmoji(getEmoji(ingName));
    const def = INGREDIENTS.find(i => i.name === ingName);
    if (def) {
      setUnit(def.defaultUnit);
      const suggested = getSuggestedExpiry(ingName, location);
      if (suggested) setExpiryDate(formatDateForInput(suggested));
    }
    setShowSuggestions(false);
    setTimeout(() => inputRef.current?.blur(), 0);
  }

  function handleSave() {
    if (!name.trim()) return;
    const item: InventoryItem = {
      id: initial?.id ?? generateId(),
      name: name.trim().toLowerCase(),
      emoji,
      quantity,
      unit,
      location,
      expiryDate: expiryDate || undefined,
      lowThreshold: initial?.lowThreshold,
      addedAt: initial?.addedAt ?? todayISO(),
    };
    onSave(item);
    onClose();
  }

  function adjustQty(delta: number) {
    setQuantity(q => Math.max(0.1, parseFloat((q + delta).toFixed(1))));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet */}
      <div className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-stone-200" />
        </div>

        <div className="flex items-center justify-between px-5 py-4">
          <h2 className="text-lg font-bold text-stone-800">
            {title ?? (isEditing ? 'Edit ingredient' : 'Add to kitchen')}
          </h2>
          <button onClick={onClose} className="tap-target p-2 rounded-xl text-stone-400 hover:text-stone-600">
            <X size={20} />
          </button>
        </div>

        <div className="px-5 pb-8 space-y-5">
          {/* Name + emoji */}
          <div className="relative">
            <label className="block text-xs font-semibold text-stone-500 mb-1.5">Ingredient</label>
            <div className="flex gap-2">
              <span className="text-2xl flex items-center">{emoji}</span>
              <input
                ref={inputRef}
                value={name}
                onChange={e => { setName(e.target.value); setShowSuggestions(true); }}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Type ingredient name…"
                className="flex-1 bg-amber-50 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-300 border border-amber-100"
              />
            </div>

            {/* Suggestions dropdown */}
            {showSuggestions && filtered.length > 0 && (
              <div className="absolute top-full left-8 right-0 z-10 mt-1 bg-white rounded-xl shadow-lg border border-amber-100 overflow-hidden">
                {filtered.map(ing => (
                  <button
                    key={ing.name}
                    onMouseDown={e => { e.preventDefault(); selectIngredient(ing.name); }}
                    className="tap-target w-full flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-amber-50 text-left"
                  >
                    <span>{ing.emoji}</span>
                    <span className="capitalize">{ing.name}</span>
                    <span className="ml-auto text-xs text-stone-400">{ing.defaultUnit}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quantity + unit */}
          <div>
            <label className="block text-xs font-semibold text-stone-500 mb-1.5">Quantity</label>
            <div className="flex gap-2 items-center">
              <button
                onClick={() => adjustQty(-1)}
                className="tap-target w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center hover:bg-amber-200"
              >
                <Minus size={16} />
              </button>
              <input
                type="number"
                value={quantity}
                onChange={e => setQuantity(Math.max(0.1, parseFloat(e.target.value) || 1))}
                className="w-20 text-center bg-amber-50 rounded-xl px-2 py-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-orange-300 border border-amber-100"
                min="0.1"
                step="0.5"
              />
              <button
                onClick={() => adjustQty(1)}
                className="tap-target w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center hover:bg-amber-200"
              >
                <Plus size={16} />
              </button>

              {/* Unit picker */}
              <div className="relative flex-1">
                <select
                  value={unit}
                  onChange={e => setUnit(e.target.value)}
                  className="w-full appearance-none bg-amber-50 rounded-xl pl-3 pr-8 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-300 border border-amber-100"
                >
                  {UNITS.map(u => <option key={u}>{u}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs font-semibold text-stone-500 mb-1.5">Where is it stored?</label>
            <div className="grid grid-cols-4 gap-2">
              {LOCATIONS.map(loc => (
                <button
                  key={loc}
                  onClick={() => setLocation(loc)}
                  className={`tap-target flex flex-col items-center gap-1 p-2.5 rounded-xl border text-xs font-medium transition-colors ${
                    location === loc
                      ? 'border-orange-400 bg-orange-50 text-orange-700'
                      : 'border-stone-200 bg-stone-50 text-stone-500 hover:bg-amber-50'
                  }`}
                >
                  <span className="text-xl">{LOCATION_EMOJI[loc]}</span>
                  <span className="capitalize">{loc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Expiry date */}
          <div>
            <label className="block text-xs font-semibold text-stone-500 mb-1.5">
              Best before <span className="font-normal text-stone-400">(auto-suggested)</span>
            </label>
            <input
              type="date"
              value={expiryDate}
              onChange={e => setExpiryDate(e.target.value)}
              className="w-full bg-amber-50 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-300 border border-amber-100"
            />
          </div>

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="tap-target w-full bg-orange-500 text-white font-semibold py-3.5 rounded-2xl text-sm hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {saveLabel ?? (isEditing ? 'Save changes' : `Add ${emoji || '🥘'} ${name || 'ingredient'}`)}
          </button>
        </div>
      </div>
    </div>
  );
}

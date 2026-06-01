import { useState, useEffect } from 'react';
import { Plus, ChevronDown, ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import IngredientCard from '../components/IngredientCard';
import AddIngredientModal from '../components/AddIngredientModal';
import ExpiryBanner from '../components/ExpiryBanner';
import { InventoryItem, StorageLocation } from '../types';
import { generateSmartAlert } from '../lib/gemini';

const LOCATIONS: { id: StorageLocation; label: string; emoji: string }[] = [
  { id: 'fridge', label: 'Fridge', emoji: '🧊' },
  { id: 'freezer', label: 'Freezer', emoji: '❄️' },
  { id: 'pantry', label: 'Pantry', emoji: '📦' },
  { id: 'shelf', label: 'Shelf', emoji: '🪴' },
];

export default function KitchenPage() {
  const { inventory, addItem, updateItem, removeItem, expiringItems, lowItems, settings, hasApiKey } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | undefined>();
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [smartAlert, setSmartAlert] = useState('');

  // Fetch smart alert when AI key is set
  useEffect(() => {
    if (!hasApiKey || (expiringItems.length === 0 && lowItems.length === 0)) return;
    let cancelled = false;
    generateSmartAlert(expiringItems, lowItems, settings.geminiApiKey)
      .then(msg => { if (!cancelled) setSmartAlert(msg); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [hasApiKey, settings.geminiApiKey, expiringItems.length, lowItems.length]);

  function toggleSection(id: string) {
    setCollapsed(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleEdit(item: InventoryItem) {
    setEditingItem(item);
    setShowModal(true);
  }

  function handleSave(item: InventoryItem) {
    if (editingItem) {
      updateItem(item.id, item);
    } else {
      addItem(item);
    }
    setEditingItem(undefined);
  }

  function handleCloseModal() {
    setShowModal(false);
    setEditingItem(undefined);
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-4 pb-24 space-y-4">
      {/* Alerts */}
      {(expiringItems.length > 0 || lowItems.length > 0) && (
        <ExpiryBanner
          expiringItems={expiringItems}
          lowItems={lowItems}
          smartAlert={smartAlert || undefined}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-stone-800">My Kitchen</h2>
          <p className="text-xs text-stone-500 mt-0.5">
            {inventory.length} item{inventory.length !== 1 ? 's' : ''} stocked
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="tap-target flex items-center gap-1.5 bg-orange-500 text-white px-4 py-2.5 rounded-2xl text-sm font-semibold hover:bg-orange-600 transition-colors shadow-sm"
        >
          <Plus size={16} />
          Add
        </button>
      </div>

      {/* Empty state */}
      {inventory.length === 0 && (
        <div className="text-center py-16 space-y-3">
          <div className="text-6xl">🧺</div>
          <p className="font-semibold text-stone-700">Your kitchen is empty!</p>
          <p className="text-sm text-stone-500">Add your first ingredient to get started. I'll tell you what you can cook.</p>
          <button
            onClick={() => setShowModal(true)}
            className="tap-target inline-flex items-center gap-1.5 bg-orange-500 text-white px-5 py-3 rounded-2xl text-sm font-semibold mt-2"
          >
            <Plus size={16} /> Add ingredient
          </button>
        </div>
      )}

      {/* Inventory by location */}
      {LOCATIONS.map(({ id, label, emoji }) => {
        const items = inventory.filter(i => i.location === id);
        if (items.length === 0) return null;
        const isCollapsed = collapsed.has(id);

        return (
          <div key={id}>
            <button
              onClick={() => toggleSection(id)}
              className="tap-target flex items-center gap-2 w-full mb-2"
            >
              <span className="text-lg">{emoji}</span>
              <span className="font-semibold text-stone-700">{label}</span>
              <span className="text-xs text-stone-400 ml-1">{items.length}</span>
              <div className="ml-auto text-stone-400">
                {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
              </div>
            </button>

            {!isCollapsed && (
              <div className="grid grid-cols-2 gap-2">
                {items
                  .sort((a, b) => {
                    // Soonest to expire first
                    if (!a.expiryDate && !b.expiryDate) return 0;
                    if (!a.expiryDate) return 1;
                    if (!b.expiryDate) return -1;
                    return a.expiryDate.localeCompare(b.expiryDate);
                  })
                  .map(item => (
                    <IngredientCard
                      key={item.id}
                      item={item}
                      onEdit={handleEdit}
                      onDelete={removeItem}
                    />
                  ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Modal */}
      {showModal && (
        <AddIngredientModal
          initial={editingItem}
          onSave={handleSave}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}

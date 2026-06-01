import { Pencil, Trash2 } from 'lucide-react';
import { InventoryItem, ExpiryStatus } from '../types';
import { getExpiryStatus, daysUntilExpiry } from '../lib/matching';

interface Props {
  item: InventoryItem;
  onEdit: (item: InventoryItem) => void;
  onDelete: (id: string) => void;
}

const STATUS_STYLES: Record<ExpiryStatus, string> = {
  fresh: 'bg-green-100 text-green-700',
  soon: 'bg-amber-100 text-amber-700',
  expired: 'bg-red-100 text-red-700',
};

export default function IngredientCard({ item, onEdit, onDelete }: Props) {
  const status = getExpiryStatus(item);
  const days = daysUntilExpiry(item);

  const expiryLabel = (): string => {
    if (days === null) return '';
    if (days < 0) return 'Expired';
    if (days === 0) return 'Today!';
    if (days === 1) return '1 day left';
    if (days <= 7) return `${days} days`;
    return item.expiryDate ?? '';
  };

  return (
    <div className="bg-white rounded-2xl border border-amber-100 p-3 flex flex-col gap-2 relative group">
      {/* Emoji + Name */}
      <div className="flex items-start justify-between gap-1">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-2xl">{item.emoji}</span>
          <div className="min-w-0">
            <p className="font-medium text-stone-800 text-sm truncate capitalize">{item.name}</p>
            <p className="text-xs text-stone-500">
              {item.quantity} {item.unit}
            </p>
          </div>
        </div>
      </div>

      {/* Location chip */}
      <div className="flex flex-wrap gap-1">
        <span className="text-[10px] font-medium bg-stone-100 text-stone-500 rounded-full px-2 py-0.5 capitalize">
          {item.location}
        </span>

        {/* Expiry chip */}
        {item.expiryDate && (
          <span className={`text-[10px] font-medium rounded-full px-2 py-0.5 ${STATUS_STYLES[status]}`}>
            {expiryLabel()}
          </span>
        )}
      </div>

      {/* Action buttons — show on hover/focus */}
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(item)}
          className="tap-target p-1.5 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100"
          aria-label="Edit"
        >
          <Pencil size={12} />
        </button>
        <button
          onClick={() => onDelete(item.id)}
          className="tap-target p-1.5 rounded-lg bg-red-50 text-red-400 hover:bg-red-100"
          aria-label="Delete"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}

import { AlertCircle, TrendingDown } from 'lucide-react';
import { InventoryItem } from '../types';

interface Props {
  expiringItems: InventoryItem[];
  lowItems: InventoryItem[];
  smartAlert?: string;
}

export default function ExpiryBanner({ expiringItems, lowItems, smartAlert }: Props) {
  if (expiringItems.length === 0 && lowItems.length === 0) return null;

  return (
    <div className="space-y-2">
      {expiringItems.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex gap-2.5">
          <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
          <div>
            {smartAlert ? (
              <p className="text-sm text-red-800">{smartAlert}</p>
            ) : (
              <>
                <p className="text-sm font-medium text-red-800">
                  {expiringItems.length === 1
                    ? `${expiringItems[0].emoji} ${expiringItems[0].name} is expiring soon — let's use it up!`
                    : `🔴 ${expiringItems.length} items expiring soon: ${expiringItems.map(i => i.name).join(', ')}`}
                </p>
                <p className="text-xs text-red-600 mt-0.5">Check the Cook tab for recipes that use them.</p>
              </>
            )}
          </div>
        </div>
      )}

      {lowItems.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2.5">
          <TrendingDown size={16} className="text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">
            🟡 Running low on {lowItems.map(i => i.name).join(', ')}. Time to restock!
          </p>
        </div>
      )}
    </div>
  );
}

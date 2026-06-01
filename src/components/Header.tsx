import { Settings, ShoppingCart } from 'lucide-react';
import { getGreeting, formatTime, getMealTimeCategory } from '../lib/matching';
import { useApp } from '../context/AppContext';

interface Props {
  onSettingsClick: () => void;
}

export default function Header({ onSettingsClick }: Props) {
  const { shoppingNotes } = useApp();
  const greeting = getGreeting();
  const time = formatTime();
  const meal = getMealTimeCategory();

  const mealEmoji: Record<string, string> = {
    Breakfast: '☀️',
    Lunch: '🌤️',
    Snack: '🌙',
    Dinner: '🌙',
  };

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-sm border-b border-amber-100">
      <div className="max-w-lg mx-auto flex items-center justify-between px-4 py-3">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-xl font-bold text-orange-500 tracking-tight">Rasoi</span>
            <span className="text-base">🍳</span>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            {greeting} · {time} {mealEmoji[meal]} {meal} time
          </p>
        </div>

        <div className="flex items-center gap-1">
          {/* Shopping list badge */}
          {shoppingNotes.length > 0 && (
            <button
              onClick={onSettingsClick}
              className="tap-target relative p-2 rounded-xl text-stone-500 hover:text-orange-500 hover:bg-amber-50 transition-colors"
              aria-label={`Shopping list — ${shoppingNotes.length} items`}
            >
              <ShoppingCart size={20} />
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-orange-500 text-white text-[9px] font-bold flex items-center justify-center">
                {shoppingNotes.length > 9 ? '9+' : shoppingNotes.length}
              </span>
            </button>
          )}

          <button
            onClick={onSettingsClick}
            className="tap-target p-2 rounded-xl text-stone-500 hover:text-orange-500 hover:bg-amber-50 transition-colors"
            aria-label="Settings"
          >
            <Settings size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}

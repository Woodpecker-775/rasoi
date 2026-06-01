import { UtensilsCrossed, ChefHat, Zap, Compass, ShoppingCart, MessageCircle, type LucideIcon } from 'lucide-react';

export type Page = 'kitchen' | 'cook' | 'hungry' | 'explore' | 'shop' | 'assistant';

interface Props {
  active: Page;
  onChange: (p: Page) => void;
  shopCount?: number;
}

const TABS: { id: Page; label: string; Icon: LucideIcon }[] = [
  { id: 'kitchen', label: 'Kitchen', Icon: UtensilsCrossed },
  { id: 'cook',    label: 'Cook',    Icon: ChefHat },
  { id: 'hungry',  label: 'Hungry',  Icon: Zap },
  { id: 'explore', label: 'Explore', Icon: Compass },
  { id: 'shop',    label: 'Shop',    Icon: ShoppingCart },
  { id: 'assistant', label: 'Chat',  Icon: MessageCircle },
];

export default function BottomNav({ active, onChange, shopCount = 0 }: Props) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-amber-100 safe-bottom">
      <div className="max-w-lg mx-auto flex">
        {TABS.map(({ id, label, Icon }) => {
          const isActive = active === id;
          const showBadge = id === 'shop' && shopCount > 0 && !isActive;

          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              className={`tap-target relative flex-1 flex flex-col items-center gap-0.5 py-2 px-0.5 transition-colors ${
                isActive ? 'text-orange-500' : 'text-stone-400 hover:text-stone-600'
              }`}
            >
              <div className="relative">
                <Icon size={20} strokeWidth={isActive ? 2.2 : 1.8} />
                {showBadge && (
                  <span className="absolute -top-1 -right-1.5 w-4 h-4 rounded-full bg-orange-500 text-white text-[9px] font-bold flex items-center justify-center">
                    {shopCount > 9 ? '9+' : shopCount}
                  </span>
                )}
              </div>
              <span className={`text-[9px] font-medium tracking-tight ${isActive ? 'text-orange-500' : ''}`}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

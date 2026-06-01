import { Cuisine, Region, MealCategory } from '../types';

const CUISINES: Cuisine[] = ['Indian', 'Chinese', 'Italian', 'Continental', 'Quick'];
const REGIONS: Region[] = ['Kerala', 'Hyderabadi', 'Punjabi', 'South Indian', 'North Indian', 'Bengali', 'Gujarati'];
const CATEGORIES: MealCategory[] = ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Sweet', 'Drink'];

const CATEGORY_EMOJI: Record<string, string> = {
  Breakfast: '☀️', Lunch: '🌤️', Dinner: '🌙', Snack: '🍿', Sweet: '🍮', Drink: '☕',
};

interface Props {
  cuisine: Cuisine;
  regions: Region[];
  categories: MealCategory[];
  onCuisineChange: (c: Cuisine) => void;
  onRegionToggle: (r: Region) => void;
  onCategoryToggle: (c: MealCategory) => void;
}

export default function CuisineFilter({
  cuisine, regions, categories,
  onCuisineChange, onRegionToggle, onCategoryToggle,
}: Props) {
  return (
    <div className="space-y-3">
      {/* Cuisine tabs */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {CUISINES.map(c => (
          <button
            key={c}
            onClick={() => onCuisineChange(c)}
            className={`tap-target shrink-0 px-3 py-1.5 rounded-xl text-sm font-medium border transition-colors ${
              cuisine === c
                ? 'bg-orange-500 text-white border-orange-500'
                : 'bg-white text-stone-600 border-stone-200 hover:border-orange-300'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Region chips — only when Indian */}
      {cuisine === 'Indian' && (
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
          {REGIONS.map(r => (
            <button
              key={r}
              onClick={() => onRegionToggle(r)}
              className={`tap-target shrink-0 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                regions.includes(r)
                  ? 'bg-amber-400 text-white border-amber-400'
                  : 'bg-white text-stone-500 border-stone-200 hover:border-amber-300'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      )}

      {/* Category chips */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
        {CATEGORIES.map(c => (
          <button
            key={c}
            onClick={() => onCategoryToggle(c)}
            className={`tap-target shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
              categories.includes(c)
                ? 'bg-amber-100 text-amber-800 border-amber-200'
                : 'bg-white text-stone-500 border-stone-200 hover:border-amber-200'
            }`}
          >
            {CATEGORY_EMOJI[c]} {c}
          </button>
        ))}
      </div>
    </div>
  );
}

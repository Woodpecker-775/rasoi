import { useState } from 'react';
import { Clock, ChevronDown, ChevronUp, Youtube, ShoppingCart, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Recipe } from '../types';

interface Props {
  recipe: Recipe;
  canMake: boolean;
  missingIngredients?: string[];
  usesExpiring?: boolean;
  expiringNames?: string[];
  onAddToShopping?: (ingredient: string) => void;
  showMissing?: boolean;
  compact?: boolean;
}

const EFFORT_LABEL: Record<number, string> = {
  1: 'Quick',
  2: 'Easy',
  3: 'Medium',
  4: 'Involved',
  5: 'Project',
};

const EFFORT_COLOR: Record<number, string> = {
  1: 'bg-green-100 text-green-700',
  2: 'bg-green-100 text-green-700',
  3: 'bg-yellow-100 text-yellow-700',
  4: 'bg-orange-100 text-orange-700',
  5: 'bg-red-100 text-red-700',
};

const CATEGORY_EMOJI: Record<string, string> = {
  Breakfast: '☀️',
  Lunch: '🌤️',
  Dinner: '🌙',
  Snack: '🍿',
  Sweet: '🍮',
  Drink: '☕',
};

export default function RecipeCard({
  recipe,
  canMake,
  missingIngredients = [],
  usesExpiring,
  expiringNames = [],
  onAddToShopping,
  showMissing = true,
  compact = false,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const [listAdded, setListAdded] = useState(false);

  const ytUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(recipe.name + ' recipe')}`;

  function handleAddToList() {
    missingIngredients.forEach(i => onAddToShopping!(i));
    setListAdded(true);
    setTimeout(() => setListAdded(false), 2500);
  }

  return (
    <div
      className={`bg-white rounded-2xl border transition-shadow ${
        canMake
          ? 'border-amber-100 shadow-sm hover:shadow-md'
          : 'border-stone-100 opacity-80'
      }`}
    >
      {/* Header — always visible */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="tap-target w-full text-left p-4"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {/* Tags row */}
            <div className="flex flex-wrap gap-1 mb-2">
              {usesExpiring && (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-red-100 text-red-600 rounded-full px-2 py-0.5">
                  <AlertCircle size={10} />
                  uses expiring {expiringNames[0]}
                </span>
              )}
              <span className="text-[10px] font-medium bg-amber-100 text-amber-700 rounded-full px-2 py-0.5">
                {CATEGORY_EMOJI[recipe.category]} {recipe.category}
              </span>
              {recipe.region && (
                <span className="text-[10px] font-medium bg-orange-50 text-orange-600 rounded-full px-2 py-0.5">
                  {recipe.region}
                </span>
              )}
            </div>

            <h3 className="font-semibold text-stone-800 leading-tight">{recipe.name}</h3>

            {recipe.description && !compact && (
              <p className="text-xs text-stone-500 mt-1 line-clamp-2">{recipe.description}</p>
            )}

            {/* Meta row */}
            <div className="flex items-center gap-2 mt-2">
              <span className={`text-[10px] font-medium rounded-full px-2 py-0.5 ${EFFORT_COLOR[recipe.effort]}`}>
                {EFFORT_LABEL[recipe.effort]}
              </span>
              <span className="flex items-center gap-1 text-xs text-stone-500">
                <Clock size={11} />
                {recipe.timeMinutes} min
              </span>
            </div>
          </div>

          <div className="shrink-0 mt-1">
            {expanded ? (
              <ChevronUp size={18} className="text-stone-400" />
            ) : (
              <ChevronDown size={18} className="text-stone-400" />
            )}
          </div>
        </div>

        {/* Ingredient icons */}
        <div className="flex flex-wrap gap-1 mt-3">
          {recipe.ingredients.slice(0, 12).map((ing, i) => (
            <span key={i} className="text-base" title={ing.name}>
              {/* emoji is derived from the ingredient name — we show name as tooltip */}
              {ing.name.split(' ')[0]}
            </span>
          ))}
        </div>

        {/* Missing ingredients */}
        {!canMake && showMissing && missingIngredients.length > 0 && (
          <div className="mt-2 text-xs text-stone-500">
            Missing: {missingIngredients.join(', ')}
          </div>
        )}
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-amber-50 px-4 pb-4">
          {/* Action buttons */}
          <div className="flex gap-2 pt-3 pb-4">
            <a
              href={ytUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="tap-target flex items-center gap-1.5 text-xs font-medium bg-red-500 text-white rounded-xl px-3 py-2 hover:bg-red-600 transition-colors"
            >
              <Youtube size={13} />
              Watch on YouTube
            </a>
            {!canMake && onAddToShopping && missingIngredients.length > 0 && (
              <button
                onClick={handleAddToList}
                className={`tap-target flex items-center gap-1.5 text-xs font-medium rounded-xl px-3 py-2 transition-all ${
                  listAdded
                    ? 'bg-green-100 text-green-700'
                    : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                }`}
              >
                {listAdded ? <CheckCircle2 size={13} /> : <ShoppingCart size={13} />}
                {listAdded ? 'Added to list!' : 'Add missing to list'}
              </button>
            )}
          </div>

          {/* Steps */}
          <ol className="space-y-3">
            {recipe.steps.map((step, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span className="shrink-0 w-5 h-5 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-[11px] font-bold mt-0.5">
                  {i + 1}
                </span>
                <span className="text-stone-700 leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

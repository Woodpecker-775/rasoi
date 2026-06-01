import { useState, useMemo, useEffect, useCallback } from 'react';
import { Sparkles, ShoppingCart, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import RecipeCard from '../components/RecipeCard';
import ExpiryBanner from '../components/ExpiryBanner';
import CuisineFilter from '../components/CuisineFilter';
import { RECIPES } from '../data/recipes';
import { matchAllRecipes, filterRecipes, sortByEffortAndExpiry, getUnlockSuggestions, getMealTimeCategory } from '../lib/matching';
import { generateCreativeRecipes } from '../lib/gemini';
import { Recipe, Cuisine, Region, MealCategory } from '../types';

export default function CookPage() {
  const { inventory, settings, updateSettings, expiringItems, lowItems, hasApiKey, addShoppingNote } = useApp();
  const [aiRecipes, setAiRecipes] = useState<Recipe[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [addedSet, setAddedSet] = useState<Set<string>>(new Set());

  const handleAddToList = useCallback((ingredient: string) => {
    addShoppingNote(ingredient);
    setAddedSet(prev => new Set([...prev, ingredient]));
    setTimeout(() => setAddedSet(prev => { const n = new Set(prev); n.delete(ingredient); return n; }), 2500);
  }, [addShoppingNote]);

  const timeCategory = settings.overrideTimeCategory ?? getMealTimeCategory();

  // Match all recipes (built-in + AI)
  const allRecipes = useMemo(() => [...RECIPES, ...aiRecipes], [aiRecipes]);
  const allResults = useMemo(() => matchAllRecipes(allRecipes, inventory), [allRecipes, inventory]);

  // Apply filters
  const filtered = useMemo(() =>
    filterRecipes(allResults, settings.cuisinePreference, settings.selectedRegions, settings.selectedCategories, timeCategory),
    [allResults, settings, timeCategory]
  );

  const canMakeResults = useMemo(() =>
    sortByEffortAndExpiry(filtered.filter(r => r.canMake)),
    [filtered]
  );

  const almostResults = useMemo(() =>
    sortByEffortAndExpiry(filtered.filter(r => !r.canMake && r.missingIngredients.length <= 2)),
    [filtered]
  );

  const unlockSuggestions = useMemo(() =>
    getUnlockSuggestions(filtered, 2),
    [filtered]
  );

  async function loadAiRecipes() {
    if (!hasApiKey) return;
    setAiLoading(true);
    setAiError('');
    try {
      const recipes = await generateCreativeRecipes(inventory, settings, timeCategory);
      setAiRecipes(recipes);
    } catch (e: unknown) {
      setAiError(e instanceof Error ? e.message : 'Could not reach AI right now. Try again in a moment!');
    } finally {
      setAiLoading(false);
    }
  }

  function toggleCategory(c: MealCategory) {
    const cats = settings.selectedCategories.includes(c)
      ? settings.selectedCategories.filter(x => x !== c)
      : [...settings.selectedCategories, c];
    updateSettings({ selectedCategories: cats });
  }

  function toggleRegion(r: Region) {
    const regions = settings.selectedRegions.includes(r)
      ? settings.selectedRegions.filter(x => x !== r)
      : [...settings.selectedRegions, r];
    updateSettings({ selectedRegions: regions });
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-4 pb-24 space-y-4">
      {/* Alerts */}
      {(expiringItems.length > 0 || lowItems.length > 0) && (
        <ExpiryBanner expiringItems={expiringItems} lowItems={lowItems} />
      )}

      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-stone-800">What can you cook?</h2>
        <p className="text-xs text-stone-500 mt-0.5">
          It's {timeCategory} time — here's what's possible right now.
        </p>
      </div>

      {/* Filters */}
      <CuisineFilter
        cuisine={settings.cuisinePreference}
        regions={settings.selectedRegions}
        categories={settings.selectedCategories}
        onCuisineChange={c => updateSettings({ cuisinePreference: c as Cuisine })}
        onRegionToggle={toggleRegion}
        onCategoryToggle={toggleCategory}
      />

      {/* AI creative recipes button */}
      {hasApiKey && (
        <button
          onClick={loadAiRecipes}
          disabled={aiLoading}
          className="tap-target w-full flex items-center justify-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 py-2.5 rounded-2xl text-sm font-medium hover:bg-amber-100 disabled:opacity-60 transition-colors"
        >
          {aiLoading ? (
            <><RefreshCw size={14} className="animate-spin" /> Getting creative ideas…</>
          ) : (
            <><Sparkles size={14} /> Ask AI for creative ideas</>
          )}
        </button>
      )}
      {aiError && <p className="text-sm text-red-500 text-center">{aiError}</p>}

      {/* Can make now */}
      {canMakeResults.length > 0 ? (
        <div>
          <h3 className="font-semibold text-stone-700 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
            You can make this now ({canMakeResults.length})
          </h3>
          <div className="space-y-3">
            {canMakeResults.map(result => (
              <RecipeCard
                key={result.recipe.id}
                recipe={result.recipe}
                canMake={true}
                usesExpiring={result.usesExpiring}
                expiringNames={result.expiringNames}
                onAddToShopping={handleAddToList}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-10 space-y-2">
          <div className="text-5xl">🥺</div>
          <p className="font-semibold text-stone-600">Nothing cookable right now</p>
          <p className="text-sm text-stone-500">
            {inventory.length === 0
              ? 'Add some ingredients in the Kitchen tab!'
              : 'Try changing the filters, or check "Unlock more dishes" below.'}
          </p>
        </div>
      )}

      {/* Unlock suggestions */}
      {unlockSuggestions.length > 0 && (
        <div>
          <h3 className="font-semibold text-stone-700 mb-3">
            Unlock more dishes 🔓
          </h3>
          <div className="space-y-2">
            {unlockSuggestions.map(s => (
              <div key={s.ingredient} className="flex items-center gap-3 bg-white rounded-xl border border-amber-100 px-3 py-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-stone-800">
                    Add <span className="text-orange-600">{s.ingredient}</span>
                    {' '}→ unlocks <strong>{s.unlocksCount}</strong> dish{s.unlocksCount !== 1 ? 'es' : ''}
                  </p>
                  <p className="text-xs text-stone-400 mt-0.5 truncate">
                    {s.recipeNames.slice(0, 3).join(', ')}
                  </p>
                </div>
                <button
                  onClick={() => handleAddToList(s.ingredient)}
                  className={`tap-target flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-all ${
                    addedSet.has(s.ingredient)
                      ? 'bg-green-100 text-green-700'
                      : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                  }`}
                >
                  {addedSet.has(s.ingredient) ? <CheckCircle2 size={12} /> : <ShoppingCart size={12} />}
                  {addedSet.has(s.ingredient) ? '✓' : 'List'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Almost there */}
      {almostResults.length > 0 && (
        <div>
          <h3 className="font-semibold text-stone-700 mb-3">
            Almost there — 1–2 ingredients away
          </h3>
          <div className="space-y-3">
            {almostResults.slice(0, 8).map(result => (
              <RecipeCard
                key={result.recipe.id}
                recipe={result.recipe}
                canMake={false}
                missingIngredients={result.missingIngredients}
                usesExpiring={result.usesExpiring}
                onAddToShopping={handleAddToList}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useMemo, useCallback } from 'react';
import { Search, Youtube, ShoppingCart, Sparkles, Send, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import RecipeCard from '../components/RecipeCard';
import CuisineFilter from '../components/CuisineFilter';
import { RECIPES } from '../data/recipes';
import { matchAllRecipes, filterRecipes } from '../lib/matching';
import { sendChatMessage } from '../lib/gemini';
import { Cuisine, Region, MealCategory } from '../types';

export default function ExplorePage() {
  const { inventory, settings, updateSettings, hasApiKey, addShoppingNote } = useApp();
  const [search, setSearch] = useState('');
  const [aiIdea, setAiIdea] = useState('');
  const [aiResult, setAiResult] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [localCuisine, setLocalCuisine] = useState<Cuisine>(settings.cuisinePreference);
  const [localRegions, setLocalRegions] = useState<Region[]>(settings.selectedRegions);
  const [localCategories, setLocalCategories] = useState<MealCategory[]>(settings.selectedCategories);
  const [addedSet, setAddedSet] = useState<Set<string>>(new Set());

  const handleAddToList = useCallback((ingredient: string) => {
    addShoppingNote(ingredient);
    setAddedSet(prev => new Set([...prev, ingredient]));
    setTimeout(() => setAddedSet(prev => { const n = new Set(prev); n.delete(ingredient); return n; }), 2500);
  }, [addShoppingNote]);

  const allResults = useMemo(() => matchAllRecipes(RECIPES, inventory), [inventory]);

  const filtered = useMemo(() => {
    let results = filterRecipes(allResults, localCuisine, localRegions, localCategories, null);
    if (search.trim()) {
      const q = search.toLowerCase();
      results = results.filter(r =>
        r.recipe.name.toLowerCase().includes(q) ||
        r.recipe.description?.toLowerCase().includes(q) ||
        r.recipe.ingredients.some(i => i.name.toLowerCase().includes(q))
      );
    }
    return results;
  }, [allResults, localCuisine, localRegions, localCategories, search]);

  function toggleRegion(r: Region) {
    setLocalRegions(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]);
  }
  function toggleCategory(c: MealCategory) {
    setLocalCategories(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
  }

  async function askForIdeas() {
    if (!hasApiKey || !aiIdea.trim()) return;
    setAiLoading(true);
    setAiResult('');
    try {
      const resp = await sendChatMessage(
        `I'm feeling like: "${aiIdea}". What should I cook? Tell me 2-3 ideas — which ones I can make right now, and what I'd need to buy for others. Keep it short and practical.`,
        [],
        inventory,
        settings
      );
      setAiResult(resp);
    } catch {
      setAiResult('AI is taking a breather. Try again in a moment!');
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-4 pb-24 space-y-4">
      <div>
        <h2 className="text-xl font-bold text-stone-800">Explore recipes</h2>
        <p className="text-xs text-stone-500 mt-0.5">Browse everything — see what you can unlock</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search recipes or ingredients…"
          className="w-full bg-white border border-amber-100 rounded-2xl pl-9 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-300"
        />
      </div>

      {/* Filters */}
      <CuisineFilter
        cuisine={localCuisine}
        regions={localRegions}
        categories={localCategories}
        onCuisineChange={setLocalCuisine}
        onRegionToggle={toggleRegion}
        onCategoryToggle={toggleCategory}
      />

      {/* AI craving box */}
      {hasApiKey && (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-amber-600" />
            <p className="text-sm font-semibold text-stone-700">Describe your craving</p>
          </div>
          <div className="flex gap-2">
            <input
              value={aiIdea}
              onChange={e => setAiIdea(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && askForIdeas()}
              placeholder="e.g. spicy Kerala dinner, something sweet, quick snack…"
              className="flex-1 bg-white border border-amber-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-300"
            />
            <button
              onClick={askForIdeas}
              disabled={aiLoading || !aiIdea.trim()}
              className="tap-target bg-orange-500 text-white px-3 py-2 rounded-xl hover:bg-orange-600 disabled:opacity-50 transition-colors"
            >
              <Send size={15} />
            </button>
          </div>
          {(aiLoading || aiResult) && (
            <div className="bg-white rounded-xl p-3 text-sm text-stone-700 leading-relaxed">
              {aiLoading ? (
                <div className="flex gap-1 items-center h-5">
                  <span className="dot-1 w-2 h-2 rounded-full bg-orange-400 inline-block" />
                  <span className="dot-2 w-2 h-2 rounded-full bg-orange-400 inline-block" />
                  <span className="dot-3 w-2 h-2 rounded-full bg-orange-400 inline-block" />
                </div>
              ) : aiResult}
            </div>
          )}
        </div>
      )}

      {/* Recipe list */}
      <p className="text-xs text-stone-500">{filtered.length} recipe{filtered.length !== 1 ? 's' : ''}</p>

      {filtered.length === 0 && (
        <div className="text-center py-10 space-y-2">
          <div className="text-5xl">🔍</div>
          <p className="font-semibold text-stone-600">No recipes match</p>
          <p className="text-sm text-stone-500">Try clearing some filters or searching something else.</p>
        </div>
      )}

      <div className="space-y-3">
        {filtered.map(result => (
          <div key={result.recipe.id}>
            <RecipeCard
              recipe={result.recipe}
              canMake={result.canMake}
              missingIngredients={result.missingIngredients}
              usesExpiring={result.usesExpiring}
              expiringNames={result.expiringNames}
              onAddToShopping={handleAddToList}
            />
            {!result.canMake && result.missingIngredients.length > 0 && (
              <div className="mt-1.5 ml-4 flex flex-wrap gap-1">
                {result.missingIngredients.slice(0, 4).map(ing => (
                  <button
                    key={ing}
                    onClick={() => handleAddToList(ing)}
                    className={`tap-target flex items-center gap-1 text-[10px] font-medium rounded-full px-2 py-0.5 transition-all ${
                      addedSet.has(ing)
                        ? 'bg-green-100 text-green-700'
                        : 'bg-stone-100 text-stone-500 hover:bg-amber-100 hover:text-amber-700'
                    }`}
                  >
                    {addedSet.has(ing) ? <CheckCircle2 size={9} /> : <ShoppingCart size={9} />}
                    {ing}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

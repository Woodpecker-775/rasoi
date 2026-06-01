import { useState } from 'react';
import { Zap, Send } from 'lucide-react';
import { useApp } from '../context/AppContext';
import RecipeCard from '../components/RecipeCard';
import { RECIPES } from '../data/recipes';
import { matchAllRecipes, sortByEffortAndExpiry } from '../lib/matching';
import { sendChatMessage } from '../lib/gemini';

export default function HungryPage() {
  const { inventory, settings, hasApiKey, addChatMessage } = useApp();
  const [asked, setAsked] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const allResults = matchAllRecipes(RECIPES, inventory);
  const canMake = sortByEffortAndExpiry(
    allResults.filter(r => r.canMake)
  );

  async function handleHungry() {
    setAsked(true);
    if (!hasApiKey) return;

    setLoading(true);
    setAiResponse('');
    try {
      const cookable = canMake.map(r => r.recipe.name).join(', ') || 'nothing';
      const fastestRecipe = canMake[0]?.recipe;
      const userMsg = fastestRecipe
        ? `I'm hungry right now. I can make: ${cookable}. The fastest option is ${fastestRecipe.name} (${fastestRecipe.timeMinutes} min). Tell me what to make and give me a quick pep talk in 2-3 sentences max.`
        : `I'm hungry but my kitchen has very little. I have: ${inventory.map(i => i.name).join(', ') || 'almost nothing'}. Suggest one quick thing and what to buy.`;

      const resp = await sendChatMessage(userMsg, [], inventory, settings);
      setAiResponse(resp);
      addChatMessage({ role: 'user', content: userMsg });
      addChatMessage({ role: 'assistant', content: resp });
    } catch {
      setAiResponse('Oops — AI is taking a break. But look below for what you can make!');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-4 pb-24 space-y-5">
      {/* Big hungry button */}
      {!asked ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-6 text-center">
          <div className="text-7xl animate-bounce">😤</div>
          <div>
            <h2 className="text-2xl font-bold text-stone-800">Just got home?</h2>
            <p className="text-stone-500 mt-1 text-sm">
              Hit the button and I'll show you exactly what you can eat right now — no shopping, no waiting.
            </p>
          </div>
          <button
            onClick={handleHungry}
            className="tap-target flex items-center gap-2 bg-orange-500 text-white font-bold text-lg px-8 py-4 rounded-3xl shadow-lg hover:bg-orange-600 active:scale-95 transition-all"
          >
            <Zap size={22} />
            Feed me now!
          </button>
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-stone-800">Hungry mode 🔥</h2>
            <span className="text-xs bg-orange-100 text-orange-600 font-medium px-2 py-0.5 rounded-full">
              Zero missing ingredients
            </span>
          </div>

          {/* AI response */}
          {hasApiKey && (
            <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">👩‍🍳</span>
                <span className="text-xs font-semibold text-orange-700">Your kitchen assistant</span>
              </div>
              {loading ? (
                <div className="flex gap-1 items-center h-5">
                  <span className="dot-1 w-2 h-2 rounded-full bg-orange-400 inline-block" />
                  <span className="dot-2 w-2 h-2 rounded-full bg-orange-400 inline-block" />
                  <span className="dot-3 w-2 h-2 rounded-full bg-orange-400 inline-block" />
                </div>
              ) : (
                <p className="text-sm text-stone-700 leading-relaxed">{aiResponse}</p>
              )}
            </div>
          )}

          {/* Results */}
          {canMake.length > 0 ? (
            <div>
              <p className="text-sm font-medium text-stone-600 mb-3">
                {canMake.length} dish{canMake.length !== 1 ? 'es' : ''} you can make right now — sorted fastest first:
              </p>
              <div className="space-y-3">
                {canMake.map(result => (
                  <RecipeCard
                    key={result.recipe.id}
                    recipe={result.recipe}
                    canMake={true}
                    usesExpiring={result.usesExpiring}
                    expiringNames={result.expiringNames}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-10 space-y-3">
              <div className="text-5xl">😔</div>
              <p className="font-semibold text-stone-700">Nothing strictly makeable right now</p>
              {allResults.filter(r => r.missingIngredients.length === 1).length > 0 && (
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-sm text-stone-700">
                  <p className="font-medium mb-1">Closest option — just 1 ingredient away:</p>
                  {allResults
                    .filter(r => r.missingIngredients.length === 1)
                    .sort((a, b) => a.recipe.timeMinutes - b.recipe.timeMinutes)
                    .slice(0, 1)
                    .map(r => (
                      <p key={r.recipe.id}>
                        <strong>{r.recipe.name}</strong> — just need <em>{r.missingIngredients[0]}</em>
                      </p>
                    ))}
                </div>
              )}
            </div>
          )}

          <button
            onClick={() => { setAsked(false); setAiResponse(''); }}
            className="tap-target w-full flex items-center justify-center gap-2 bg-stone-100 text-stone-600 py-3 rounded-2xl text-sm font-medium hover:bg-stone-200 transition-colors"
          >
            <Send size={14} /> Ask again
          </button>
        </>
      )}
    </div>
  );
}

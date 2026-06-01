import { useState } from 'react';
import { X, Eye, EyeOff, CheckCircle, ChevronDown } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Cuisine, Region, MealCategory } from '../types';
import { OR_DEFAULT_MODEL } from '../lib/gemini';

const CUISINES: Cuisine[] = ['Indian', 'Chinese', 'Italian', 'Continental', 'Quick'];
const REGIONS: Region[] = ['Kerala', 'Hyderabadi', 'Punjabi', 'South Indian', 'North Indian', 'Bengali', 'Gujarati'];
const CATEGORIES: MealCategory[] = ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Sweet', 'Drink'];

const FREE_MODELS = [
  { id: 'anthropic/claude-sonnet-4-6',               label: '✨ Claude Sonnet 4.6 (your plan)' },
  { id: 'anthropic/claude-opus-4-8',                 label: 'Claude Opus 4.8 (your plan)' },
  { id: 'anthropic/claude-haiku-4-5-20251001',       label: 'Claude Haiku 4.5 (your plan)' },
  { id: 'mistralai/mistral-7b-instruct:free',        label: 'Mistral 7B (free)' },
  { id: 'meta-llama/llama-3.1-8b-instruct:free',     label: 'Llama 3.1 8B (free)' },
  { id: 'meta-llama/llama-3.3-70b-instruct:free',    label: 'Llama 3.3 70B (free)' },
  { id: 'deepseek/deepseek-chat-v3-0324:free',       label: 'DeepSeek V3 (free)' },
  { id: 'google/gemini-2.0-flash-001',               label: 'Gemini 2.0 Flash (paid)' },
  { id: 'google/gemini-flash-1.5',                   label: 'Gemini 1.5 Flash (paid)' },
];

interface Props { onClose: () => void }

export default function SettingsPanel({ onClose }: Props) {
  const { settings, updateSettings } = useApp();
  const [showKey, setShowKey] = useState(false);
  const [keySaved, setKeySaved] = useState(false);
  const [localKey, setLocalKey] = useState(settings.geminiApiKey);

  function saveKey() {
    updateSettings({ geminiApiKey: localKey.trim() });
    setKeySaved(true);
    setTimeout(() => setKeySaved(false), 2000);
  }

  function toggleRegion(r: Region) {
    const regions = settings.selectedRegions.includes(r)
      ? settings.selectedRegions.filter(x => x !== r)
      : [...settings.selectedRegions, r];
    updateSettings({ selectedRegions: regions });
  }

  function toggleCategory(c: MealCategory) {
    const cats = settings.selectedCategories.includes(c)
      ? settings.selectedCategories.filter(x => x !== c)
      : [...settings.selectedCategories, c];
    updateSettings({ selectedCategories: cats });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-stone-200" />
        </div>

        <div className="flex items-center justify-between px-5 py-4 sticky top-0 bg-white border-b border-amber-50 z-10">
          <h2 className="text-lg font-bold text-stone-800">Settings ⚙️</h2>
          <button onClick={onClose} className="tap-target p-2 rounded-xl text-stone-400 hover:text-stone-600">
            <X size={20} />
          </button>
        </div>

        <div className="px-5 pb-8 space-y-6 pt-4">
          {/* Gemini API Key */}
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1">
              Gemini API Key
            </label>
            <p className="text-xs text-stone-500 mb-2">
              Gemini (AIza…), OpenRouter (sk-or-…), or Groq (gsk_… — free, no card needed).
            </p>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={localKey}
                  onChange={e => setLocalKey(e.target.value)}
                  placeholder="Paste Gemini, OpenRouter, or Groq key…"
                  className="w-full bg-amber-50 rounded-xl px-3 pr-10 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-300 border border-amber-100"
                />
                <button
                  onClick={() => setShowKey(s => !s)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400"
                >
                  {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <button
                onClick={saveKey}
                className={`tap-target px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  keySaved
                    ? 'bg-green-100 text-green-700'
                    : 'bg-orange-500 text-white hover:bg-orange-600'
                }`}
              >
                {keySaved ? <CheckCircle size={16} /> : 'Save'}
              </button>
            </div>
            {settings.geminiApiKey && (
              <p className="text-xs text-green-600 mt-1">
                ✓ AI active ·{' '}
                {settings.geminiApiKey.startsWith('gsk_')
                  ? '⚡ Groq (free)'
                  : settings.geminiApiKey.startsWith('sk-')
                  ? '🔀 OpenRouter'
                  : '✨ Gemini'}
              </p>
            )}
          </div>

          {/* Model picker — shown only when an OpenRouter key is set */}
          {settings.geminiApiKey && (settings.geminiApiKey.startsWith('sk-or-') || settings.geminiApiKey.startsWith('sk-')) && (
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1">
                OpenRouter model
              </label>
              <p className="text-xs text-stone-400 mb-2">
                Free models cost $0. Browse more at{' '}
                <span className="text-orange-500">openrouter.ai/models</span>
              </p>
              <div className="relative">
                <select
                  value={settings.openRouterModel || OR_DEFAULT_MODEL}
                  onChange={e => updateSettings({ openRouterModel: e.target.value })}
                  className="w-full appearance-none bg-amber-50 border border-amber-100 rounded-xl pl-3 pr-8 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-300"
                >
                  {FREE_MODELS.map(m => (
                    <option key={m.id} value={m.id}>{m.label}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
              </div>
            </div>
          )}

          {/* Cuisine preference */}
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">
              Default cuisine
            </label>
            <div className="flex flex-wrap gap-2">
              {CUISINES.map(c => (
                <button
                  key={c}
                  onClick={() => updateSettings({ cuisinePreference: c })}
                  className={`tap-target px-3 py-1.5 rounded-xl text-sm font-medium border transition-colors ${
                    settings.cuisinePreference === c
                      ? 'bg-orange-500 text-white border-orange-500'
                      : 'bg-white text-stone-600 border-stone-200 hover:border-orange-300'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Indian regions */}
          {settings.cuisinePreference === 'Indian' && (
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1">
                Favourite regions
              </label>
              <p className="text-xs text-stone-400 mb-2">Multi-select to mix styles</p>
              <div className="flex flex-wrap gap-2">
                {REGIONS.map(r => (
                  <button
                    key={r}
                    onClick={() => toggleRegion(r)}
                    className={`tap-target px-3 py-1.5 rounded-xl text-sm font-medium border transition-colors ${
                      settings.selectedRegions.includes(r)
                        ? 'bg-amber-400 text-white border-amber-400'
                        : 'bg-white text-stone-600 border-stone-200 hover:border-amber-300'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Meal categories */}
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1">
              Default meal categories
            </label>
            <p className="text-xs text-stone-400 mb-2">Leave blank to auto-select by time of day</p>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(c => (
                <button
                  key={c}
                  onClick={() => toggleCategory(c)}
                  className={`tap-target px-3 py-1.5 rounded-xl text-sm font-medium border transition-colors ${
                    settings.selectedCategories.includes(c)
                      ? 'bg-amber-400 text-white border-amber-400'
                      : 'bg-white text-stone-600 border-stone-200 hover:border-amber-300'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Shopping list lives in the Shop tab */}
        </div>
      </div>
    </div>
  );
}

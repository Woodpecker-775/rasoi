import { InventoryItem, ChatMessage, Recipe, AppSettings } from '../types';
import { getExpiryStatus } from './matching';
import { RASOI_TOOLS, ToolExecutor, ToolResult, executeTool } from './tools';

// ─── Provider detection ───────────────────────────────────────────────
type Provider = 'builtin' | 'gemini' | 'openrouter' | 'groq';

function detectProvider(key: string): Provider {
  if (!key) return 'builtin';
  if (key.startsWith('gsk_')) return 'groq';
  if (key.startsWith('sk-or-') || key.startsWith('sk-')) return 'openrouter';
  return 'gemini';
}

// ─── Message types ────────────────────────────────────────────────────
interface ToolCall {
  id: string;
  type: 'function';
  function: { name: string; arguments: string };
}

// Flexible message type that covers system/user/assistant/tool roles
type LLMMessage =
  | { role: 'system' | 'user'; content: string }
  | { role: 'assistant'; content: string | null; tool_calls?: ToolCall[] }
  | { role: 'tool'; tool_call_id: string; content: string; name?: string };

interface RawResponse {
  text: string | null;
  toolCalls: ToolCall[];
}

// ─── Built-in call (Vercel Edge → Groq, key stored server-side) ──────
async function callBuiltIn(messages: LLMMessage[], maxTokens = 800, tools?: unknown[]): Promise<RawResponse> {
  if (import.meta.env.DEV) {
    throw new Error('Built-in AI only works when deployed. Add your own API key in Settings for local dev.');
  }
  const body: Record<string, unknown> = { messages, max_tokens: maxTokens };
  if (tools?.length) body.tools = tools;

  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await res.json() as { error?: string; choices?: { message?: { content?: string | null; tool_calls?: ToolCall[] } }[] };

  if (!res.ok) throw new Error(data.error ?? `AI error (${res.status})`);

  const msg = data.choices?.[0]?.message;
  return { text: msg?.content ?? null, toolCalls: msg?.tool_calls ?? [] };
}

// ─── OpenRouter call ──────────────────────────────────────────────────
const OR_URL = 'https://openrouter.ai/api/v1/chat/completions';
export const OR_DEFAULT_MODEL = 'mistralai/mistral-7b-instruct:free';

async function callOpenRouter(messages: LLMMessage[], apiKey: string, maxTokens = 800, model = OR_DEFAULT_MODEL, tools?: unknown[]): Promise<RawResponse> {
  const body: Record<string, unknown> = { model, messages, max_tokens: maxTokens };
  if (tools && tools.length) body.tools = tools;

  const res = await fetch(OR_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://rasoi.vercel.app',
      'X-Title': 'Rasoi Kitchen Assistant',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: { message?: string } }).error?.message ?? `HTTP ${res.status}`);
  }

  const data = await res.json() as {
    choices?: { message?: { content?: string | null; tool_calls?: ToolCall[] } }[];
  };
  const msg = data.choices?.[0]?.message;
  return {
    text: msg?.content ?? null,
    toolCalls: msg?.tool_calls ?? [],
  };
}

// ─── Gemini direct call ───────────────────────────────────────────────
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const GEMINI_MODEL = 'gemini-2.0-flash';

async function callGemini(messages: LLMMessage[], apiKey: string, maxTokens = 800): Promise<RawResponse> {
  // Split system message out
  const systemMsg = messages.find(m => m.role === 'system');
  const conversation = messages.filter(m => m.role !== 'system');

  const contents = conversation.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const body: Record<string, unknown> = {
    contents,
    generationConfig: { temperature: 0.8, maxOutputTokens: maxTokens },
  };

  if (systemMsg) {
    body.system_instruction = { parts: [{ text: systemMsg.content }] };
  }

  const res = await fetch(
    `${GEMINI_BASE}/${GEMINI_MODEL}:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: { message?: string } }).error?.message ?? `HTTP ${res.status}`);
  }

  const data = await res.json() as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "I couldn't come up with anything — try rephrasing?";
  return { text, toolCalls: [] };
}

// ─── Groq call ───────────────────────────────────────────────────────
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_DEFAULT_MODEL = 'llama-3.3-70b-versatile';

async function callGroq(messages: LLMMessage[], apiKey: string, maxTokens = 800, tools?: unknown[]): Promise<RawResponse> {
  const body: Record<string, unknown> = { model: GROQ_DEFAULT_MODEL, messages, max_tokens: maxTokens, temperature: 0.8 };
  if (tools && tools.length) body.tools = tools;

  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: { message?: string } }).error?.message ?? `HTTP ${res.status}`);
  }

  const data = await res.json() as {
    choices?: { message?: { content?: string | null; tool_calls?: ToolCall[] } }[];
  };
  const msg = data.choices?.[0]?.message;
  return { text: msg?.content ?? null, toolCalls: msg?.tool_calls ?? [] };
}

// ─── Unified LLM call ─────────────────────────────────────────────────
async function callLLM(
  messages: LLMMessage[],
  apiKey: string,
  maxTokens = 800,
  orModel = OR_DEFAULT_MODEL,
  tools?: unknown[]
): Promise<RawResponse> {
  const provider = detectProvider(apiKey);
  if (provider === 'builtin') return callBuiltIn(messages, maxTokens, tools);
  if (provider === 'groq') return callGroq(messages, apiKey, maxTokens, tools);
  if (provider === 'openrouter') return callOpenRouter(messages, apiKey, maxTokens, orModel, tools);
  return callGemini(messages, apiKey, maxTokens); // Gemini: no tool calling for now
}

// ─── Context builders ─────────────────────────────────────────────────
function inventoryContext(inventory: InventoryItem[]): string {
  if (inventory.length === 0) return 'Empty kitchen.';
  return inventory.map(item => {
    const expiry = item.expiryDate ? ` exp:${item.expiryDate}[${getExpiryStatus(item)}]` : '';
    return `${item.name} ${item.quantity}${item.unit} ${item.location}${expiry}`;
  }).join(', ');
}

function systemPrompt(inventory: InventoryItem[], settings: AppSettings): string {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  const dayStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const cuisine = settings.cuisinePreference;
  const regions = settings.selectedRegions.length > 0 ? settings.selectedRegions.join(', ') : 'all regions';

  return `You are Rasoi, a friendly kitchen assistant. Warm, practical, a little playful.
Time: ${timeStr}, ${dayStr} | Cuisine: ${cuisine} (${regions})

Inventory: ${inventoryContext(inventory)}

Use tools proactively — when user says "add X", call add_to_inventory; "add for biryani", call add_recipe_to_shopping_list. Don't describe, do it.
For recipes include: https://www.youtube.com/results?search_query=<name>+recipe
Keep responses short. Work from what's in the kitchen.`;
}

// ─── Chat (plain, no tools) ────────────────────────────────────────────
export async function sendChatMessage(
  userMessage: string,
  history: ChatMessage[],
  inventory: InventoryItem[],
  settings: AppSettings
): Promise<string> {
  const messages: LLMMessage[] = [
    { role: 'system', content: systemPrompt(inventory, settings) },
    ...history.slice(-6).map(m => ({ role: m.role === 'assistant' ? 'assistant' as const : 'user' as const, content: m.content })),
    { role: 'user', content: userMessage },
  ];
  const res = await callLLM(messages, settings.geminiApiKey, 600, settings.openRouterModel);
  return res.text ?? "I couldn't think of anything — try again?";
}

// ─── Chat WITH tools ───────────────────────────────────────────────────
export interface ToolChatResult {
  text: string;
  actions: ToolResult[];
}

export async function sendChatMessageWithTools(
  userMessage: string,
  history: ChatMessage[],
  inventory: InventoryItem[],
  settings: AppSettings,
  executor: ToolExecutor
): Promise<ToolChatResult> {
  const provider = detectProvider(settings.geminiApiKey);
  // Gemini direct doesn't support function calling in this format — fall back to plain chat
  if (provider === 'gemini') {
    const text = await sendChatMessage(userMessage, history, inventory, settings);
    return { text, actions: [] };
  }

  const messages: LLMMessage[] = [
    { role: 'system', content: systemPrompt(inventory, settings) },
    ...history.slice(-6).map(m => ({ role: m.role === 'assistant' ? 'assistant' as const : 'user' as const, content: m.content })),
    { role: 'user', content: userMessage },
  ];

  const actions: ToolResult[] = [];

  // Tool execution loop — up to 6 rounds
  for (let round = 0; round < 6; round++) {
    const response = await callLLM(messages, settings.geminiApiKey, 600, settings.openRouterModel, RASOI_TOOLS);

    if (response.toolCalls && response.toolCalls.length > 0) {
      // Append assistant message with tool calls
      messages.push({ role: 'assistant', content: response.text ?? null, tool_calls: response.toolCalls });

      // Execute each tool call and append results
      for (const call of response.toolCalls) {
        let args: unknown = {};
        try { args = JSON.parse(call.function.arguments); } catch { /* ignore */ }
        const result = executeTool(call.function.name, args, executor);
        actions.push(result);
        messages.push({ role: 'tool', tool_call_id: call.id, name: call.function.name, content: result.summary });
      }
    } else {
      // No more tool calls — return final text
      return { text: response.text ?? "Done!", actions };
    }
  }

  return { text: "Done! Check your kitchen and shopping list.", actions };
}

// ─── Creative recipes ─────────────────────────────────────────────────
export async function generateCreativeRecipes(
  inventory: InventoryItem[],
  settings: AppSettings,
  mealTime: string
): Promise<Recipe[]> {
  const prompt = `Given this kitchen inventory:
${inventoryContext(inventory)}

It is currently ${mealTime} time. The user prefers ${settings.cuisinePreference} cuisine (regions: ${settings.selectedRegions.join(', ') || 'any'}).

Suggest 3 creative recipes they can make RIGHT NOW using primarily these ingredients. Be creative but realistic.

Return ONLY a JSON array with this exact structure (no markdown, no explanation):
[
  {
    "id": "ai_1",
    "name": "Recipe Name",
    "cuisine": "Indian",
    "region": "Kerala",
    "category": "${mealTime}",
    "effort": 2,
    "timeMinutes": 20,
    "description": "One line description",
    "ingredients": [{"name": "onion", "quantity": 1, "unit": "pcs"}],
    "steps": ["Step 1", "Step 2"]
  }
]`;

  try {
    const messages: LLMMessage[] = [{ role: 'user', content: prompt }];
    const raw = await callLLM(messages, settings.geminiApiKey, 1500, settings.openRouterModel);
    let text = raw.text ?? '';
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(text) as Recipe[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// ─── Smart alert phrasing ─────────────────────────────────────────────
export async function generateSmartAlert(
  expiringItems: InventoryItem[],
  lowItems: InventoryItem[],
  apiKey: string
): Promise<string> {
  if (expiringItems.length === 0 && lowItems.length === 0) return '';

  const expiring = expiringItems.map(i => `${i.name} (${i.expiryDate})`).join(', ');
  const low = lowItems.map(i => i.name).join(', ');

  const prompt = `Be a friendly kitchen assistant. In 1–2 short, warm, casual sentences, tell the user about:
${expiring ? `- Expiring soon: ${expiring}` : ''}
${low ? `- Running low: ${low}` : ''}

Suggest using the expiring item in something quick. Keep it friendly and brief.`;

  try {
    const raw = await callLLM([{ role: 'user', content: prompt }], apiKey, 150);
    return raw.text ?? '';
  } catch {
    return '';
  }
}

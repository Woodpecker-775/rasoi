import { useState, useRef, useEffect } from 'react';
import { Send, Trash2, Key, CheckCircle, XCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { sendChatMessageWithTools, ToolChatResult } from '../lib/gemini';
import { ToolResult, toolEmoji } from '../lib/tools';

const STARTER_PROMPTS = [
  'Add 500g chicken to my fridge',
  'I bought onions, tomatoes and garlic — add them',
  "What can I cook for dinner tonight?",
  "Add everything I need for Hyderabadi Biryani to my shopping list",
  "What's about to expire? Plan dinner around it",
  "Clear my shopping list and start fresh",
];

interface DisplayMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  actions?: ToolResult[];
  timestamp: string;
}

export default function AssistantPage() {
  const { inventory, settings, chatMessages, addChatMessage, clearChat, hasApiKey,
    addItem, updateItem, removeItem, addShoppingNote, removeShoppingNote, shoppingNotes } = useApp();

  const [displayMessages, setDisplayMessages] = useState<DisplayMessage[]>(() =>
    chatMessages.map(m => ({ id: m.id, role: m.role, content: m.content, timestamp: m.timestamp }))
  );
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [displayMessages, loading]);

  const executor = {
    inventory,
    shoppingNotes,
    addItem,
    updateItem,
    removeItem,
    addShoppingNote,
    removeShoppingNote,
  };

  function genId() { return `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`; }

  async function send(message?: string) {
    const text = (message ?? input).trim();
    if (!text || !hasApiKey) return;
    setInput('');
    setError('');

    const userMsg: DisplayMessage = { id: genId(), role: 'user', content: text, timestamp: new Date().toISOString() };
    setDisplayMessages(prev => [...prev, userMsg]);
    addChatMessage({ role: 'user', content: text });
    setLoading(true);

    try {
      const result: ToolChatResult = await sendChatMessageWithTools(
        text,
        chatMessages,
        inventory,
        settings,
        executor
      );

      const assistantMsg: DisplayMessage = {
        id: genId(),
        role: 'assistant',
        content: result.text,
        actions: result.actions,
        timestamp: new Date().toISOString(),
      };
      setDisplayMessages(prev => [...prev, assistantMsg]);
      addChatMessage({ role: 'assistant', content: result.text });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'something went wrong';
      const isQuota = msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('rate limit') || msg.toLowerCase().includes('exceeded');
      setError(isQuota
        ? 'Gemini free quota exceeded. Switch to OpenRouter (sk-or-…) or Groq (gsk_…) in ⚙️ Settings — both have better free limits.'
        : `Oops — ${msg}. Try again?`
      );
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  }

  function handleClear() {
    clearChat();
    setDisplayMessages([]);
  }

  if (!hasApiKey) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-4 pb-24">
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-amber-100 flex items-center justify-center text-3xl">👩‍🍳</div>
          <div>
            <h2 className="text-xl font-bold text-stone-800">Meet your kitchen assistant</h2>
            <p className="text-sm text-stone-500 mt-2 max-w-xs">
              She can chat, cook up ideas — and with an AI key, she can add ingredients, build shopping lists, and manage your kitchen hands-free.
            </p>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-sm text-amber-800 flex items-start gap-2.5 text-left max-w-xs">
            <Key size={16} className="shrink-0 mt-0.5" />
            <span>Open ⚙️ Settings → paste your API key → Save</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto flex flex-col" style={{ height: 'calc(100dvh - 7rem)' }}>
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-orange-100 flex items-center justify-center text-xl">👩‍🍳</div>
          <div>
            <p className="font-semibold text-stone-800 text-sm">Kitchen Assistant</p>
            <p className="text-xs text-green-600">● Can act on your kitchen</p>
          </div>
        </div>
        {displayMessages.length > 0 && (
          <button onClick={handleClear} className="tap-target flex items-center gap-1 text-xs text-stone-400 hover:text-red-400 p-2 rounded-xl">
            <Trash2 size={13} /> Clear
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 space-y-4 pb-4">
        {displayMessages.length === 0 && (
          <div className="space-y-4 pt-2">
            <div className="flex gap-3">
              <span className="text-2xl shrink-0">👩‍🍳</span>
              <div className="bg-white border border-amber-100 rounded-2xl rounded-tl-sm px-4 py-3 max-w-xs">
                <p className="text-sm text-stone-700 leading-relaxed">
                  Hey! I know your kitchen and I can actually <strong>do things</strong> — add ingredients, fill your shopping list, manage expiry. Just tell me what you need. 🍳
                </p>
              </div>
            </div>
            <p className="text-xs text-stone-400 text-center">Try asking…</p>
            <div className="flex flex-col gap-2">
              {STARTER_PROMPTS.map(prompt => (
                <button
                  key={prompt}
                  onClick={() => send(prompt)}
                  className="tap-target text-left bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5 text-sm text-stone-700 hover:bg-amber-100 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {displayMessages.map(msg => (
          <div key={msg.id} className={`chat-bubble flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'gap-3'} w-full`}>
              {msg.role === 'assistant' && <span className="text-2xl shrink-0 mt-1">👩‍🍳</span>}
              <div
                className={`rounded-2xl px-4 py-3 max-w-[82%] text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-orange-500 text-white rounded-tr-sm'
                    : 'bg-white border border-amber-100 text-stone-700 rounded-tl-sm'
                }`}
              >
                {msg.content.split('\n').map((line, i, arr) => (
                  <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
                ))}
              </div>
            </div>

            {/* Action chips */}
            {msg.actions && msg.actions.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2 ml-11 max-w-[82%]">
                {msg.actions.map((action, i) => (
                  <span
                    key={i}
                    className={`inline-flex items-center gap-1.5 text-[11px] font-medium rounded-full px-2.5 py-1 ${
                      action.ok
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-600'
                    }`}
                  >
                    {action.ok
                      ? <CheckCircle size={11} />
                      : <XCircle size={11} />}
                    {toolEmoji(action.toolName)} {action.summary}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="chat-bubble flex gap-3">
            <span className="text-2xl shrink-0">👩‍🍳</span>
            <div className="bg-white border border-amber-100 rounded-2xl rounded-tl-sm px-4 py-4">
              <div className="flex gap-1.5 items-center">
                <span className="dot-1 w-2 h-2 rounded-full bg-stone-400 inline-block" />
                <span className="dot-2 w-2 h-2 rounded-full bg-stone-400 inline-block" />
                <span className="dot-3 w-2 h-2 rounded-full bg-stone-400 inline-block" />
              </div>
            </div>
          </div>
        )}

        {error && <p className="text-center text-sm text-red-500 py-2">{error}</p>}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 pb-4 shrink-0">
        <div className="flex items-end gap-2 bg-white border border-amber-200 rounded-2xl px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-orange-300">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tell me what to do — I'll handle it…"
            rows={1}
            className="flex-1 resize-none text-sm outline-none max-h-32 bg-transparent text-stone-800 placeholder-stone-400"
            style={{ minHeight: '24px' }}
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || loading}
            className="tap-target w-9 h-9 rounded-xl bg-orange-500 text-white flex items-center justify-center disabled:opacity-40 hover:bg-orange-600 transition-colors shrink-0"
          >
            <Send size={15} />
          </button>
        </div>
        <p className="text-[10px] text-stone-400 text-center mt-1.5">Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  );
}

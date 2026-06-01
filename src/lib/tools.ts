import { InventoryItem, ShoppingNote, StorageLocation } from '../types';
import { getIngredientDef, getEmoji, getSuggestedExpiry } from '../data/ingredients';
import { ingredientsMatch } from './matching';
import { RECIPES } from '../data/recipes';

// ─── Executor interface ────────────────────────────────────────────────
export interface ToolExecutor {
  inventory: InventoryItem[];
  shoppingNotes: ShoppingNote[];
  addItem: (item: Omit<InventoryItem, 'id' | 'addedAt'>) => void;
  updateItem: (id: string, updates: Partial<InventoryItem>) => void;
  removeItem: (id: string) => void;
  addShoppingNote: (text: string) => void;
  removeShoppingNote: (id: string) => void;
}

// ─── Tool definitions (OpenAI function-calling format) ─────────────────
export const RASOI_TOOLS = [
  {
    type: 'function' as const,
    function: {
      name: 'add_to_inventory',
      description:
        'Add an ingredient to the user\'s kitchen inventory. Call this when user says they bought something, have something, or want to stock up.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Ingredient name in lowercase (e.g. "chicken", "basmati rice")' },
          quantity: { type: 'number', description: 'Amount. Default 1.' },
          unit: { type: 'string', description: 'Unit: pcs | g | kg | ml | L | cup | tbsp | tsp. Pick sensible default.' },
          location: { type: 'string', enum: ['fridge', 'freezer', 'pantry', 'shelf'], description: 'Where to store it.' },
          expiry_days: { type: 'number', description: 'Days until expiry. Omit to auto-calculate.' },
        },
        required: ['name'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'remove_from_inventory',
      description: 'Remove an ingredient from the kitchen (used it up, threw it out, etc.)',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Ingredient name to remove' },
        },
        required: ['name'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'update_inventory_quantity',
      description: 'Change the quantity of an existing kitchen item (used some, added more, etc.)',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Ingredient name' },
          quantity: { type: 'number', description: 'New quantity value' },
        },
        required: ['name', 'quantity'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'add_to_shopping_list',
      description:
        'Add items to the shopping list (things the user needs to buy). Use when they\'re missing something, planning a recipe, or asking what to buy.',
      parameters: {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: { type: 'string' },
            description: 'Ingredient names to add to shopping list',
          },
        },
        required: ['items'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'add_recipe_to_shopping_list',
      description:
        'Add all the missing ingredients for a specific recipe to the shopping list. Great when user says "I want to make X, add what I need".',
      parameters: {
        type: 'object',
        properties: {
          recipe_name: { type: 'string', description: 'Name of the recipe (partial match is fine)' },
        },
        required: ['recipe_name'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'clear_shopping_list',
      description: 'Clear the entire shopping list',
      parameters: { type: 'object', properties: {} },
    },
  },
];

// ─── Tool result type ──────────────────────────────────────────────────
export interface ToolResult {
  toolName: string;
  summary: string; // Short human-readable description of what happened
  ok: boolean;
}

// ─── Executor ─────────────────────────────────────────────────────────
export function executeTool(toolName: string, rawArgs: unknown, executor: ToolExecutor): ToolResult {
  try {
    const args = rawArgs as Record<string, unknown>;

    switch (toolName) {
      case 'add_to_inventory': {
        const name = (args.name as string).toLowerCase().trim();
        const quantity = (args.quantity as number | undefined) ?? 1;
        const location = ((args.location as string | undefined) ?? 'fridge') as StorageLocation;
        const unit = args.unit as string | undefined;
        const expiryDays = args.expiry_days as number | undefined;
        const def = getIngredientDef(name);

        let expiryDate: string | undefined;
        if (expiryDays) {
          const d = new Date(); d.setDate(d.getDate() + expiryDays);
          expiryDate = d.toISOString().split('T')[0];
        } else {
          expiryDate = getSuggestedExpiry(name, location)?.toISOString().split('T')[0];
        }

        // Merge if already exists
        const existing = executor.inventory.find(i => ingredientsMatch(i.name, name));
        if (existing) {
          const newQty = existing.quantity + quantity;
          executor.updateItem(existing.id, { quantity: newQty });
          return { toolName, ok: true, summary: `Updated ${name}: ${existing.quantity} → ${newQty} ${existing.unit} (${existing.location})` };
        }

        executor.addItem({
          name,
          emoji: getEmoji(name),
          quantity,
          unit: unit || def?.defaultUnit || 'pcs',
          location,
          expiryDate,
          lowThreshold: def?.lowThreshold,
        });
        return { toolName, ok: true, summary: `Added ${quantity} ${unit || def?.defaultUnit || 'pcs'} ${name} → ${location}` };
      }

      case 'remove_from_inventory': {
        const name = (args.name as string).toLowerCase().trim();
        const item = executor.inventory.find(i => ingredientsMatch(i.name, name));
        if (!item) return { toolName, ok: false, summary: `${name} not found in kitchen` };
        executor.removeItem(item.id);
        return { toolName, ok: true, summary: `Removed ${name} from kitchen` };
      }

      case 'update_inventory_quantity': {
        const name = (args.name as string).toLowerCase().trim();
        const quantity = args.quantity as number;
        const item = executor.inventory.find(i => ingredientsMatch(i.name, name));
        if (!item) return { toolName, ok: false, summary: `${name} not found in kitchen` };
        executor.updateItem(item.id, { quantity });
        return { toolName, ok: true, summary: `${name}: quantity → ${quantity} ${item.unit}` };
      }

      case 'add_to_shopping_list': {
        const items = (args.items as string[]).map(i => i.toLowerCase().trim());
        const added: string[] = [];
        for (const item of items) {
          if (!executor.shoppingNotes.some(n => n.text === item)) {
            executor.addShoppingNote(item);
            added.push(item);
          }
        }
        if (added.length === 0) return { toolName, ok: true, summary: 'All items already on shopping list' };
        return { toolName, ok: true, summary: `Shopping list ← ${added.join(', ')}` };
      }

      case 'add_recipe_to_shopping_list': {
        const recipeName = (args.recipe_name as string).toLowerCase();
        const recipe = RECIPES.find(r => r.name.toLowerCase().includes(recipeName));
        if (!recipe) return { toolName, ok: false, summary: `Recipe "${args.recipe_name}" not found` };

        const missing = recipe.ingredients
          .filter(i => !i.optional)
          .filter(i => !executor.inventory.some(inv => ingredientsMatch(inv.name, i.name) && inv.quantity > 0))
          .map(i => i.name);

        if (missing.length === 0) return { toolName, ok: true, summary: `You already have everything for ${recipe.name}!` };

        for (const item of missing) {
          if (!executor.shoppingNotes.some(n => n.text === item)) executor.addShoppingNote(item);
        }
        return { toolName, ok: true, summary: `Shopping list ← ${missing.length} missing ingredients for ${recipe.name}` };
      }

      case 'clear_shopping_list': {
        const count = executor.shoppingNotes.length;
        [...executor.shoppingNotes].forEach(n => executor.removeShoppingNote(n.id));
        return { toolName, ok: true, summary: `Shopping list cleared (${count} items removed)` };
      }

      default:
        return { toolName, ok: false, summary: `Unknown tool: ${toolName}` };
    }
  } catch (e: unknown) {
    return { toolName, ok: false, summary: `Error: ${e instanceof Error ? e.message : 'unknown'}` };
  }
}

// ─── Tool action display label ─────────────────────────────────────────
export function toolEmoji(toolName: string): string {
  const map: Record<string, string> = {
    add_to_inventory: '🥘',
    remove_from_inventory: '🗑️',
    update_inventory_quantity: '✏️',
    add_to_shopping_list: '🛒',
    add_recipe_to_shopping_list: '📋',
    clear_shopping_list: '🧹',
  };
  return map[toolName] ?? '⚙️';
}

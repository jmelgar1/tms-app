import { SPRITE_MAP } from '../components/inventory-grid/sprite-map';
import { CUSTOM_SPRITE_MAP } from '../components/stat-table/custom-sprite-map';
import { MOB_SPRITE_MAP } from '../components/stat-table/mob-sprite-map';
import { environment } from '../../environments/environment';
import { DisplayStat } from '../models/player-stats.model';

const TILE_SIZE = 64;
const ITEM_GRID_SIZE = 39;
const CUSTOM_GRID_COLS = 6;
const CUSTOM_GRID_ROWS = 5;
const MOB_GRID_COLS = 10;
const MOB_GRID_ROWS = 9;

const VERB_PREFIXES = [
  'interact_with_', 'inspect_', 'open_', 'play_', 'tune_',
  'fill_', 'use_', 'eat_', 'clean_', 'trigger_',
];

const CUSTOM_STAT_OVERRIDES: Record<string, string> = {
  'pot_flower': 'flower_pot',
  'enchant_item': 'enchanting_table',
  'sleep_in_bed': 'white_bed',
  'clean_armor': 'cauldron',
  'clean_banner': 'cauldron',
  'boat_one_cm': 'oak_boat',
  'minecart_one_cm': 'minecart',
  'strider_one_cm': 'warped_fungus_on_a_stick',
  'play_record': 'music_disc_cat',
  'fish_caught': 'cooked_cod',
  'damage_blocked_by_shield': 'shield',
  'sweet_berry_bush': 'sweet_berries',
  'cocoa': 'cocoa_beans',
  'pitcher_crop': 'pitcher_plant',
  'powder_snow': 'powder_snow_bucket',
  'tripwire': 'tripwire_hook',
  'cave_vines': 'glow_berries',
  'cave_vines_plant': 'glow_berries',
  'wither_skeleton_wall_head': 'wither_skeleton_skull',
};

// Prefixes to strip from block variant names to find the base item
// e.g. "spruce_wall_sign" → "spruce_sign", "potted_dead_bush" → "dead_bush"
const BLOCK_VARIANT_STRIPS = [
  'wall_hanging_', 'wall_',   // must try wall_hanging_ before wall_
  'potted_',
  'tall_',
  'water_', 'lava_',
];

const COLLAPSED_SPRITE_KEYS = new Map<string, string>();
for (const key of Object.keys(SPRITE_MAP)) {
  const stripped = key.replace('minecraft_', '');
  const collapsed = stripped.replace(/_/g, '');
  if (collapsed !== stripped) {
    COLLAPSED_SPRITE_KEYS.set(collapsed, stripped);
  }
}

function resolveItemKey(statKey: string): string | null {
  const direct = statKey.replace(':', '_');
  if (SPRITE_MAP[direct]) return direct;

  const bare = statKey.replace(/^minecraft:/, '');

  const override = CUSTOM_STAT_OVERRIDES[bare];
  if (override) {
    const key = `minecraft_${override}`;
    if (SPRITE_MAP[key]) return key;
  }

  let candidate = bare;
  for (const prefix of VERB_PREFIXES) {
    if (bare.startsWith(prefix)) {
      candidate = bare.slice(prefix.length);
      break;
    }
  }

  const candidateKey = `minecraft_${candidate}`;
  if (SPRITE_MAP[candidateKey]) return candidateKey;

  const collapsed = candidate.replace(/_/g, '');
  const resolved = COLLAPSED_SPRITE_KEYS.get(collapsed);
  if (resolved) {
    const key = `minecraft_${resolved}`;
    if (SPRITE_MAP[key]) return key;
  }

  // Strip block variant prefixes: "spruce_wall_sign" → "spruce_sign",
  // "potted_dead_bush" → "dead_bush", "water_cauldron" → "cauldron"
  for (const strip of BLOCK_VARIANT_STRIPS) {
    const idx = candidate.indexOf(strip);
    if (idx >= 0) {
      const stripped = candidate.slice(0, idx) + candidate.slice(idx + strip.length);
      const key = `minecraft_${stripped}`;
      if (SPRITE_MAP[key]) return key;
    }
  }

  // Try plural → singular: "carrots" → "carrot", "potatoes" → "potato", "beetroots" → "beetroot"
  if (candidate.endsWith('es')) {
    const key = `minecraft_${candidate.slice(0, -2)}`;
    if (SPRITE_MAP[key]) return key;
  }
  if (candidate.endsWith('s')) {
    const key = `minecraft_${candidate.slice(0, -1)}`;
    if (SPRITE_MAP[key]) return key;
  }

  for (const source of [candidate, bare]) {
    const parts = source.split('_');
    for (let len = parts.length - 1; len >= 1; len--) {
      const sub = parts.slice(0, len).join('_');
      const subKey = `minecraft_${sub}`;
      if (SPRITE_MAP[subKey]) return subKey;
    }
  }

  return null;
}

function spriteStyle(url: string, cols: number, rows: number, x: number, y: number): Record<string, string> {
  const col = x / TILE_SIZE;
  const row = y / TILE_SIZE;
  return {
    'background-image': `url(${url})`,
    'background-size': `${cols * 100}% ${rows * 100}%`,
    'background-position': `${col * 100 / (cols - 1)}% ${row * 100 / (rows - 1)}%`,
  };
}

export function heartSpriteStyle(): Record<string, string> {
  const pos = CUSTOM_SPRITE_MAP['Heart'];
  return spriteStyle(environment.customSpritesheetUrl, CUSTOM_GRID_COLS, CUSTOM_GRID_ROWS, pos.x, pos.y);
}

// Memoize resolved sprite styles. Row recycling during virtual scroll re-resolves
// the same stats repeatedly; caching keeps the returned object reference stable
// (cheaper change detection) and avoids re-running resolveItemKey on every render.
const spriteStyleCache = new Map<string, Record<string, string> | null>();

export function statSpriteStyle(stat: DisplayStat): Record<string, string> | null {
  const cacheKey = `${stat.category}|${stat.statKey}|${stat.label}`;
  const cached = spriteStyleCache.get(cacheKey);
  if (cached !== undefined) {
    return cached;
  }
  const resolved = computeStatSpriteStyle(stat);
  spriteStyleCache.set(cacheKey, resolved);
  return resolved;
}

function computeStatSpriteStyle(stat: DisplayStat): Record<string, string> | null {
  const customKey = stat.label.replace(/ /g, '_');

  // Check mob sprite map for killed/killed_by categories
  const isMobCategory = stat.category === 'minecraft:killed' || stat.category === 'minecraft:killed_by';
  if (isMobCategory) {
    const mobPos = MOB_SPRITE_MAP[customKey];
    if (mobPos) {
      return spriteStyle(environment.mobSpritesheetUrl, MOB_GRID_COLS, MOB_GRID_ROWS, mobPos.x, mobPos.y);
    }
  }

  // Check custom sprite map (non-mob stats: movement, combat, interactions, Environmental, etc.)
  const customPos = CUSTOM_SPRITE_MAP[customKey];
  if (customPos) {
    return spriteStyle(environment.customSpritesheetUrl, CUSTOM_GRID_COLS, CUSTOM_GRID_ROWS, customPos.x, customPos.y);
  }

  // Fall back to item sprite map (keyed by minecraft item ID)
  const resolved = resolveItemKey(stat.statKey);
  if (!resolved) return null;
  const pos = SPRITE_MAP[resolved];
  if (!pos) return null;
  return spriteStyle(environment.itemSpritesheetUrl, ITEM_GRID_SIZE, ITEM_GRID_SIZE, pos.x, pos.y);
}

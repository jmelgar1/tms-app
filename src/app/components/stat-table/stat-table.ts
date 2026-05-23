import { Component, input, output, signal, computed } from '@angular/core';
import { NgStyle } from '@angular/common';
import { DisplayStat } from '../../models/player-stats.model';
import { SPRITE_MAP } from '../inventory-grid/sprite-map';
import { CUSTOM_SPRITE_MAP } from './custom-sprite-map';
import { environment } from '../../../environments/environment';

const TILE_SIZE = 64;
const ITEM_GRID_SIZE = 39;
const CUSTOM_GRID_SIZE = 7;

const VERB_PREFIXES = [
  'interact_with_', 'inspect_', 'open_', 'play_', 'tune_',
  'fill_', 'use_', 'eat_', 'clean_',
];

// Stats where the block name can't be derived from the stat key
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
};

// Build a reverse lookup: underscore-collapsed sprite name → original sprite key
// e.g. "brewingstand" → "brewing_stand" so we can match Minecraft's merged names
const COLLAPSED_SPRITE_KEYS = new Map<string, string>();
for (const key of Object.keys(SPRITE_MAP)) {
  const stripped = key.replace('minecraft_', '');
  const collapsed = stripped.replace(/_/g, '');
  if (collapsed !== stripped) {
    COLLAPSED_SPRITE_KEYS.set(collapsed, stripped);
  }
}

type SortColumn = 'label' | 'rawValue' | 'rank';
type SortDirection = 'asc' | 'desc';

@Component({
  selector: 'app-stat-table',
  imports: [NgStyle],
  templateUrl: './stat-table.html',
  styleUrl: './stat-table.scss',
})
export class StatTable {
  title = input.required<string>();
  stats = input.required<DisplayStat[]>();
  barColor = input<string>('#27ae60');
  scrollable = input<boolean>(false);
  showRanks = input<boolean>(false);

  statClicked = output<DisplayStat>();

  sortColumn = signal<SortColumn>('rawValue');
  sortDirection = signal<SortDirection>('desc');

  filterText = signal('');

  canScrollUp = signal(false);
  canScrollDown = signal(true);

  sortedStats = computed(() => {
    const col = this.sortColumn();
    const dir = this.sortDirection();
    const filter = this.filterText().toLowerCase();
    const list = filter
      ? this.stats().filter(s => s.label.toLowerCase().includes(filter))
      : [...this.stats()];

    list.sort((a, b) => {
      if (col === 'label') {
        const cmp = a.label.localeCompare(b.label);
        return dir === 'asc' ? cmp : -cmp;
      }
      if (col === 'rawValue') {
        return dir === 'asc' ? a.rawValue - b.rawValue : b.rawValue - a.rawValue;
      }
      // rank
      const aRank = a.rank ?? Infinity;
      const bRank = b.rank ?? Infinity;
      return dir === 'asc' ? aRank - bRank : bRank - aRank;
    });

    return list;
  });

  toggleSort(column: SortColumn): void {
    if (this.sortColumn() === column) {
      this.sortDirection.update(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set(column === 'rawValue' ? 'desc' : 'asc');
    }
  }

  sortIndicator(column: SortColumn): string {
    if (this.sortColumn() !== column) {
      return '\u25BC';
    }
    return this.sortDirection() === 'asc' ? '\u25B2' : '\u25BC';
  }

  isSortActive(column: SortColumn): boolean {
    return this.sortColumn() === column;
  }

  rankColor(rank: number): string {
    switch (rank) {
      case 1: return '#EFBF04';
      case 2: return '#ffffff';
      case 3: return '#CE8946';
      default: return '#666666';
    }
  }

  rankTextColor(rank: number): string {
    return rank === 2 ? '#1a1a1a' : '#fff';
  }

  onScroll(event: Event): void {
    const el = event.target as HTMLElement;
    this.canScrollUp.set(el.scrollTop > 0);
    this.canScrollDown.set(el.scrollTop + el.clientHeight < el.scrollHeight - 1);
  }

  itemSpriteStyle(stat: DisplayStat): Record<string, string> | null {
    // Check custom sprite map first (keyed by display label with underscores)
    const customKey = stat.label.replace(/ /g, '_');
    const customPos = CUSTOM_SPRITE_MAP[customKey];
    if (customPos) {
      const col = customPos.x / TILE_SIZE;
      const row = customPos.y / TILE_SIZE;
      return {
        'background-image': `url(${environment.customSpritesheetUrl})`,
        'background-size': `${CUSTOM_GRID_SIZE * 100}% ${CUSTOM_GRID_SIZE * 100}%`,
        'background-position': `${col * 100 / (CUSTOM_GRID_SIZE - 1)}% ${row * 100 / (CUSTOM_GRID_SIZE - 1)}%`,
      };
    }

    // Fall back to item sprite map (keyed by minecraft item ID)
    const resolved = this.resolveItemKey(stat.statKey);
    if (!resolved) return null;
    const pos = SPRITE_MAP[resolved];
    if (!pos) return null;
    const col = pos.x / TILE_SIZE;
    const row = pos.y / TILE_SIZE;
    return {
      'background-image': `url(${environment.itemSpritesheetUrl})`,
      'background-size': `${ITEM_GRID_SIZE * 100}% ${ITEM_GRID_SIZE * 100}%`,
      'background-position': `${col * 100 / (ITEM_GRID_SIZE - 1)}% ${row * 100 / (ITEM_GRID_SIZE - 1)}%`,
    };
  }

  private resolveItemKey(statKey: string): string | null {
    // Direct match: works for mined/crafted/used/broken categories
    // e.g. "minecraft:diamond_ore" → "minecraft_diamond_ore"
    const direct = statKey.replace(':', '_');
    if (SPRITE_MAP[direct]) return direct;

    const bare = statKey.replace(/^minecraft:/, '');

    // Manual overrides for irregular stats
    const override = CUSTOM_STAT_OVERRIDES[bare];
    if (override) {
      const key = `minecraft_${override}`;
      if (SPRITE_MAP[key]) return key;
    }

    // Strip verb prefixes: "interact_with_anvil" → "anvil"
    let candidate = bare;
    for (const prefix of VERB_PREFIXES) {
      if (bare.startsWith(prefix)) {
        candidate = bare.slice(prefix.length);
        break;
      }
    }

    // Try direct lookup with candidate
    const candidateKey = `minecraft_${candidate}`;
    if (SPRITE_MAP[candidateKey]) return candidateKey;

    // Try underscore-collapsed matching for merged names
    // e.g. "noteblock" → matches "note_block", "enderchest" → "ender_chest"
    const collapsed = candidate.replace(/_/g, '');
    const resolved = COLLAPSED_SPRITE_KEYS.get(collapsed);
    if (resolved) {
      const key = `minecraft_${resolved}`;
      if (SPRITE_MAP[key]) return key;
    }

    // Try dropping trailing words from the prefix-stripped candidate:
    // "cake_slice" → "cake", and from the full bare key: "bell_ring" → "bell"
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
}

export interface PlayerStatsResponse {
  uuid: string;
  name: string;
  color: string;
  stats: Record<string, StatEntry[]>;
}

export interface StatEntry {
  stat: string;
  value: number;
  serverTotal?: number;
  players?: PlayerBreakdownEntry[];
}

export interface PlayerBreakdownEntry {
  uuid: string;
  name: string;
  value: number;
}

export interface PlayerInfoResponse {
  uuid: string;
  name: string;
  firstSeen: string;
  lastSeen: string;
  online: boolean;
}

export interface ServerStatsResponse {
  playerCount: number;
  playerColors: Record<string, string>;
  stats: Record<string, StatEntry[]>;
}

export interface LeaderboardResponse {
  category: string;
  stat: string;
  entries: LeaderboardEntry[];
}

export interface LeaderboardEntry {
  rank: number;
  uuid: string;
  name: string;
  value: number;
}

export interface RankEntry {
  stat: string;
  rank: number;
}

export interface PlayerRanksResponse {
  uuid: string;
  name: string;
  ranks: Record<string, RankEntry[]>;
}

export interface BarSegment {
  percentage: number;
  color: string;
  label: string;
  value: number;
}

export interface DisplayStat {
  label: string;
  rawValue: number;
  displayValue: string;
  percentage: number;
  statKey: string;
  category: string;
  rank?: number;
  segments?: BarSegment[];
}

export interface StatChartGroup {
  title: string;
  stats: DisplayStat[];
  color: string;
  scrollable?: boolean;
}

export interface EnchantmentEntry {
  id: string;
  level: number;
}

export interface InventorySlot {
  slot: number;
  itemId: string;
  count: number;
  displayName?: string;
  enchantments?: EnchantmentEntry[];
  durability?: number;
  maxDurability?: number;
}

export interface PlayerInventoryResponse {
  uuid: string;
  name: string;
  online: boolean;
  slots: InventorySlot[];
}

export interface AdvancementEntry {
  id: string;
  title: string;
  description: string;
  iconItem: string;
  frameType: 'task' | 'goal' | 'challenge';
  hidden: boolean;
  completed: boolean;
  completedAt: string | null;
  unlockedBy: number;
}

export interface AdvancementCategory {
  advancements: AdvancementEntry[];
  completedCount: number;
  totalCount: number;
}

export interface PlayerAdvancementsResponse {
  uuid: string;
  name: string;
  categories: Record<string, AdvancementCategory>;
  totalCompleted: number;
  totalAvailable: number;
  totalPlayers: number;
}

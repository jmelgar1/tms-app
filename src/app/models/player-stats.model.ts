export interface PlayerStatsResponse {
  uuid: string;
  name: string;
  stats: Record<string, StatEntry[]>;
}

export interface StatEntry {
  stat: string;
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

export interface DisplayStat {
  label: string;
  rawValue: number;
  displayValue: string;
  percentage: number;
  statKey: string;
  category: string;
  rank?: number;
}

export interface StatChartGroup {
  title: string;
  stats: DisplayStat[];
  color: string;
  scrollable?: boolean;
}

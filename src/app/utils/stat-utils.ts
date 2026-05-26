import { StatEntry, DisplayStat, StatChartGroup, RankEntry, BarSegment } from '../models/player-stats.model';

const MOVEMENT_STATS = new Set([
  'walk_one_cm', 'sprint_one_cm', 'crouch_one_cm', 'climb_one_cm',
  'fall_one_cm', 'swim_one_cm', 'fly_one_cm', 'aviate_one_cm',
  'walk_on_water_one_cm', 'walk_under_water_one_cm',
  'boat_one_cm', 'horse_one_cm', 'pig_one_cm', 'minecart_one_cm',
  'strider_one_cm',
]);

const COMBAT_STATS = new Set([
  'mob_kills', 'player_kills',
  'damage_dealt', 'damage_taken',
  'damage_blocked_by_shield', 'damage_absorbed', 'damage_resisted',
]);

const DAMAGE_STATS = new Set([
  'damage_dealt', 'damage_taken',
  'damage_blocked_by_shield', 'damage_absorbed', 'damage_resisted',
]);

const EXCLUDED_STATS = new Set(['play_time', 'deaths', 'total_world_time', 'aviate_one_cm']);

const TIME_STATS = new Set(['play_time', 'time_since_death', 'time_since_rest', 'sneak_time']);

const CHART_COLORS = {
  movement: '#27ae60',
  combat: '#e74c3c',
  interaction: '#3498db',
  mined: '#e67e22',
  crafted: '#9b59b6',
  used: '#1abc9c',
  broken: '#e84393',
  killedBy: '#d63031',
} as const;

const EVERYONE_ELSE_COLOR = '#3a3a3a';

const numberFormatter = new Intl.NumberFormat('en-US');

export interface SegmentOptions {
  mode: 'server' | 'player';
  playerColors?: Record<string, string>;
  playerColor?: string;
}

export function ticksToDaysHours(ticks: number): string {
  const totalSeconds = Math.floor(ticks / 20);
  if (totalSeconds < 60) return `${totalSeconds} seconds`;
  if (totalSeconds < 3600) return `${(totalSeconds / 60).toFixed(1)} minutes`;
  if (totalSeconds < 86400) return `${(totalSeconds / 3600).toFixed(1)} hours`;
  const days = totalSeconds / 86400;
  return `${days.toFixed(2)} days`;
}

export function cmToDistance(cm: number): string {
  return `${numberFormatter.format(Math.round(cm / 100))} blocks`;
}

export function formatStatName(stat: string): string {
  const name = stripPrefix(stat);
  return name
    .replace(/_one_cm$/g, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

function stripPrefix(stat: string): string {
  return stat.replace(/^minecraft:/, '');
}

function statKey(stat: string): string {
  return stripPrefix(stat);
}

export function formatStatValue(statKey: string, value: number): string {
  const key = statKey.replace(/^minecraft:/, '');
  if (key.endsWith('_one_cm')) return cmToDistance(value);
  if (DAMAGE_STATS.has(key)) return `${formatNumber(Math.round(value / 2))} hearts`;
  if (TIME_STATS.has(key)) return ticksToDaysHours(value);
  return formatNumber(value);
}

function computeSegments(entry: StatEntry, options: SegmentOptions): BarSegment[] {
  if (options.mode === 'server' && entry.players) {
    const total = entry.players.reduce((sum, p) => sum + p.value, 0);
    if (total === 0) return [];
    return entry.players.map(p => ({
      percentage: (p.value / total) * 100,
      color: options.playerColors?.[p.uuid] ?? '#555',
      label: p.name,
      value: p.value,
    }));
  }

  if (options.mode === 'player' && entry.serverTotal != null) {
    const serverTotal = entry.serverTotal;
    if (serverTotal === 0) return [];
    const playerValue = entry.value;
    const otherValue = serverTotal - playerValue;
    const segments: BarSegment[] = [{
      percentage: (playerValue / serverTotal) * 100,
      color: options.playerColor ?? '#27ae60',
      label: 'You',
      value: playerValue,
    }];
    if (otherValue > 0) {
      segments.push({
        percentage: (otherValue / serverTotal) * 100,
        color: EVERYONE_ELSE_COLOR,
        label: 'Everyone Else',
        value: otherValue,
      });
    }
    return segments;
  }

  return [];
}

function toDisplayStats(
  entries: StatEntry[],
  formatter: (value: number, stat: string) => string,
  category: string,
  rankEntries?: RankEntry[],
  segmentOptions?: SegmentOptions,
): DisplayStat[] {
  if (entries.length === 0) return [];

  // For player mode, use serverTotal for bar width so bars reflect server scale
  const valueForBar = (e: StatEntry) =>
    segmentOptions?.mode === 'player' && e.serverTotal != null ? e.serverTotal : e.value;
  const max = Math.max(...entries.map(valueForBar));

  const rankMap = new Map(rankEntries?.map(r => [r.stat, r.rank]));

  return entries.map(e => {
    const barValue = valueForBar(e);
    const segments = segmentOptions ? computeSegments(e, segmentOptions) : undefined;
    const displayStat: DisplayStat = {
      label: formatStatName(e.stat),
      rawValue: e.value,
      displayValue: formatter(e.value, e.stat),
      percentage: segments && segments.length > 0 ? 100 : (max > 0 ? (barValue / max) * 100 : 0),
      statKey: e.stat,
      category: category,
      rank: rankMap.get(e.stat),
      segments,
    };

    return displayStat;
  });
}

export function extractHeadlineStats(
  stats: Record<string, StatEntry[]>,
): { playtime: string; deaths: number } {
  const custom = stats['minecraft:custom'] ?? [];
  let playTimeTicks = 0;
  let deaths = 0;
  for (const entry of custom) {
    const key = statKey(entry.stat);
    if (key === 'play_time') playTimeTicks = entry.value;
    if (key === 'deaths') deaths = entry.value;
  }
  return {
    playtime: ticksToDaysHours(playTimeTicks),
    deaths,
  };
}

export function buildChartGroups(
  stats: Record<string, StatEntry[]>,
  ranks?: Record<string, RankEntry[]>,
  segmentOptions?: SegmentOptions,
): StatChartGroup[] {
  const groups: StatChartGroup[] = [];

  const custom = stats['minecraft:custom'] ?? [];

  const movementEntries: StatEntry[] = [];
  const combatEntries: StatEntry[] = [];
  const interactionEntries: StatEntry[] = [];

  for (const entry of custom) {
    const key = statKey(entry.stat);
    if (EXCLUDED_STATS.has(key)) continue;
    if (MOVEMENT_STATS.has(key)) {
      movementEntries.push(entry);
    } else if (COMBAT_STATS.has(key)) {
      combatEntries.push(entry);
    } else {
      interactionEntries.push(entry);
    }
  }

  if (movementEntries.length > 0) {
    groups.push({
      title: 'Movement',
      stats: toDisplayStats(movementEntries, v => cmToDistance(v), 'minecraft:custom', ranks?.['minecraft:custom'], segmentOptions),
      color: CHART_COLORS.movement,
    });
  }

  if (combatEntries.length > 0) {
    groups.push({
      title: 'Combat',
      stats: toDisplayStats(combatEntries, (v, stat) => {
        if (DAMAGE_STATS.has(statKey(stat))) {
          return `${formatNumber(Math.round(v / 2))} hearts`;
        }
        return formatNumber(v);
      }, 'minecraft:custom', ranks?.['minecraft:custom'], segmentOptions),
      color: CHART_COLORS.combat,
    });
  }

  if (interactionEntries.length > 0) {
    groups.push({
      title: 'Interactions',
      stats: toDisplayStats(interactionEntries, (v, stat) => {
        if (TIME_STATS.has(statKey(stat))) {
          return ticksToDaysHours(v);
        }
        return formatNumber(v);
      }, 'minecraft:custom', ranks?.['minecraft:custom'], segmentOptions),
      color: CHART_COLORS.interaction,
    });
  }

  const categoryGroups: {
    key: string;
    title: string;
    color: string;
  }[] = [
    { key: 'minecraft:mined', title: 'Blocks Mined', color: CHART_COLORS.mined },
    { key: 'minecraft:crafted', title: 'Items Crafted', color: CHART_COLORS.crafted },
    { key: 'minecraft:used', title: 'Items Used', color: CHART_COLORS.used },
    { key: 'minecraft:broken', title: 'Items Broken', color: CHART_COLORS.broken },
    // minecraft:killed_by is handled separately below to include environmental deaths
  ];

  for (const cat of categoryGroups) {
    const entries = stats[cat.key] ?? [];
    if (entries.length > 0) {
      const displayStats = toDisplayStats(entries, v => formatNumber(v), cat.key, ranks?.[cat.key], segmentOptions);
      groups.push({
        title: cat.title,
        stats: displayStats,
        color: cat.color,
      });
    }
  }

  // Death Causes: killed_by entries + derived environmental deaths
  const killedByEntries = stats['minecraft:killed_by'] ?? [];
  const deathsEntry = custom.find(e => statKey(e.stat) === 'deaths');
  const totalDeaths = deathsEntry?.value ?? 0;
  const mobDeaths = killedByEntries.reduce((sum, e) => sum + e.value, 0);
  const envDeaths = Math.max(0, totalDeaths - mobDeaths);

  const deathEntries: StatEntry[] = [...killedByEntries];

  if (envDeaths > 0) {
    const envEntry: StatEntry = { stat: 'Environmental', value: envDeaths };

    if (segmentOptions?.mode === 'server' && deathsEntry?.players) {
      // Compute per-player environmental deaths for server mode
      const playerMobDeaths = new Map<string, number>();
      for (const entry of killedByEntries) {
        if (entry.players) {
          for (const p of entry.players) {
            playerMobDeaths.set(p.uuid, (playerMobDeaths.get(p.uuid) ?? 0) + p.value);
          }
        }
      }
      const envPlayers = deathsEntry.players
        .map(p => ({
          uuid: p.uuid,
          name: p.name,
          value: Math.max(0, p.value - (playerMobDeaths.get(p.uuid) ?? 0)),
        }))
        .filter(p => p.value > 0)
        .sort((a, b) => b.value - a.value);
      envEntry.players = envPlayers;
    }

    if (segmentOptions?.mode === 'player' && deathsEntry?.serverTotal != null) {
      // Compute server total environmental deaths for player mode
      const serverTotalMobDeaths = killedByEntries.reduce((sum, e) => sum + (e.serverTotal ?? e.value), 0);
      const serverTotalDeaths = deathsEntry.serverTotal;
      envEntry.serverTotal = Math.max(0, serverTotalDeaths - serverTotalMobDeaths);
    }

    deathEntries.push(envEntry);
  }

  deathEntries.sort((a, b) => b.value - a.value);

  if (deathEntries.length > 0) {
    groups.push({
      title: 'Death Causes',
      stats: toDisplayStats(deathEntries, v => formatNumber(v), 'minecraft:killed_by', ranks?.['minecraft:killed_by'], segmentOptions),
      color: CHART_COLORS.killedBy,
    });
  }

  for (const group of groups) {
    group.scrollable = group.stats.length > 10;
  }

  return groups;
}

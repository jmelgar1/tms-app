import { StatEntry, DisplayStat, StatChartGroup } from '../models/player-stats.model';

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

const TIME_STATS = new Set(['time_since_death', 'time_since_rest', 'sneak_time']);

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

const numberFormatter = new Intl.NumberFormat('en-US');

export function ticksToDaysHours(ticks: number): string {
  const totalSeconds = Math.floor(ticks / 20);
  const totalHours = Math.floor(totalSeconds / 3600);
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  if (days === 0 && hours === 0) return '0 hours';
  if (days === 0) return `${hours} hours`;
  if (hours === 0) return `${days} days`;
  return `${days} days and ${hours} hours`;
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

function toDisplayStats(
  entries: { stat: string; value: number }[],
  formatter: (value: number, stat: string) => string,
): DisplayStat[] {
  if (entries.length === 0) return [];
  const max = Math.max(...entries.map(e => e.value));
  return entries.map(e => ({
    label: formatStatName(e.stat),
    rawValue: e.value,
    displayValue: formatter(e.value, e.stat),
    percentage: max > 0 ? (e.value / max) * 100 : 0,
  }));
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
): StatChartGroup[] {
  const groups: StatChartGroup[] = [];

  const custom = stats['minecraft:custom'] ?? [];

  const movementEntries: { stat: string; value: number }[] = [];
  const combatEntries: { stat: string; value: number }[] = [];
  const interactionEntries: { stat: string; value: number }[] = [];

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
      stats: toDisplayStats(movementEntries, v => cmToDistance(v)),
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
      }),
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
      }),
      color: CHART_COLORS.interaction,
    });
  }

  const categoryGroups: {
    key: string;
    title: string;
    color: string;
    scrollable: boolean;
  }[] = [
    { key: 'minecraft:mined', title: 'Blocks Mined', color: CHART_COLORS.mined, scrollable: true },
    { key: 'minecraft:crafted', title: 'Items Crafted', color: CHART_COLORS.crafted, scrollable: true },
    { key: 'minecraft:used', title: 'Items Used', color: CHART_COLORS.used, scrollable: true },
    { key: 'minecraft:broken', title: 'Items Broken', color: CHART_COLORS.broken, scrollable: true },
    // minecraft:killed_by is handled separately below to include environmental deaths
  ];

  for (const cat of categoryGroups) {
    const entries = stats[cat.key] ?? [];
    if (entries.length > 0) {
      groups.push({
        title: cat.title,
        stats: toDisplayStats(entries, v => formatNumber(v)),
        color: cat.color,
        scrollable: cat.scrollable,
      });
    }
  }

  // Death Causes: killed_by entries + derived environmental deaths
  const killedByEntries = stats['minecraft:killed_by'] ?? [];
  const totalDeaths = custom.find(e => statKey(e.stat) === 'deaths')?.value ?? 0;
  const mobDeaths = killedByEntries.reduce((sum, e) => sum + e.value, 0);
  const envDeaths = Math.max(0, totalDeaths - mobDeaths);

  const deathEntries: { stat: string; value: number }[] = [
    ...killedByEntries,
    ...(envDeaths > 0 ? [{ stat: 'Environmental', value: envDeaths }] : []),
  ].sort((a, b) => b.value - a.value);

  if (deathEntries.length > 0) {
    groups.push({
      title: 'Death Causes',
      stats: toDisplayStats(deathEntries, v => formatNumber(v)),
      color: CHART_COLORS.killedBy,
    });
  }

  return groups;
}

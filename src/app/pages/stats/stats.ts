import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { PlayerStatsService } from '../../services/player-stats.service';
import { PlayerStatsResponse, PlayerInfoResponse, ServerStatsResponse, LeaderboardEntry, DisplayStat, PlayerRanksResponse, PlayerInventoryResponse } from '../../models/player-stats.model';
import { PlayerHeader } from '../../components/player-header/player-header';
import { StatHighlight } from '../../components/stat-highlight/stat-highlight';
import { StatBarChart } from '../../components/stat-bar-chart/stat-bar-chart';
import { StatComparisonModal } from '../../components/stat-comparison-modal/stat-comparison-modal';
import { extractHeadlineStats, buildChartGroups, formatNumber } from '../../utils/stat-utils';

@Component({
  selector: 'app-stats',
  imports: [RouterLink, FormsModule, PlayerHeader, StatHighlight, StatBarChart, StatComparisonModal],
  templateUrl: './stats.html',
  styleUrl: './stats.scss',
})
export class Stats implements OnInit {
  private statsService = inject(PlayerStatsService);

  searchName = '';
  loading = signal(false);
  error = signal<string | null>(null);

  // Player view
  statsResult = signal<PlayerStatsResponse | null>(null);
  playerInfo = signal<PlayerInfoResponse | null>(null);
  playerRanks = signal<PlayerRanksResponse | null>(null);
  playerInventory = signal<PlayerInventoryResponse | null>(null);

  // Server view
  serverStats = signal<ServerStatsResponse | null>(null);
  serverLoading = signal(true);
  serverError = signal<string | null>(null);
  playerList = signal<LeaderboardEntry[]>([]);

  // Which view is active
  viewingPlayer = signal(false);

  // Modal state
  selectedStat = signal<DisplayStat | null>(null);
  selectedColor = signal<string>('#27ae60');

  headlines = computed(() => {
    const stats = this.viewingPlayer() ? this.statsResult()?.stats : this.serverStats()?.stats;
    if (!stats) return null;
    return extractHeadlineStats(stats);
  });

  chartGroups = computed(() => {
    const stats = this.viewingPlayer() ? this.statsResult()?.stats : this.serverStats()?.stats;
    if (!stats) return [];
    const ranks = this.viewingPlayer() ? this.playerRanks()?.ranks : undefined;
    return buildChartGroups(stats, ranks);
  });

  serverPlayerCount = computed(() => {
    const s = this.serverStats();
    return s ? formatNumber(s.playerCount) : '0';
  });

  selectedServerTotal = computed(() => {
    const stat = this.selectedStat();
    const server = this.serverStats();
    if (!stat || !server) return 0;

    if (stat.statKey === 'Environmental') {
      const custom = server.stats['minecraft:custom'] ?? [];
      const totalDeaths = custom.find(e => e.stat === 'minecraft:deaths')?.value ?? 0;
      const killedBy = server.stats['minecraft:killed_by'] ?? [];
      const mobDeaths = killedBy.reduce((sum, e) => sum + e.value, 0);
      return Math.max(0, totalDeaths - mobDeaths);
    }

    const categoryStats = server.stats[stat.category] ?? [];
    const match = categoryStats.find(e => e.stat === stat.statKey);
    return match?.value ?? 0;
  });

  ngOnInit(): void {
    this.loadServerStats();
    this.loadPlayerList();
  }

  avatarUrl(uuid: string): string {
    return `https://mc-heads.net/avatar/${uuid}/48`;
  }

  selectPlayer(name: string): void {
    this.searchName = name;
    this.search();
  }

  search(): void {
    const name = this.searchName.trim();
    if (!name) return;

    this.loading.set(true);
    this.error.set(null);
    this.statsResult.set(null);
    this.playerInfo.set(null);
    this.playerRanks.set(null);
    this.playerInventory.set(null);

    forkJoin({
      stats: this.statsService.getStatsByName(name),
      info: this.statsService.getPlayerInfo(name),
      ranks: this.statsService.getPlayerRanks(name),
      inventory: this.statsService.getPlayerInventory(name).pipe(
        catchError(() => of(null))
      ),
    }).subscribe({
      next: ({ stats, info, ranks, inventory }) => {
        this.statsResult.set(stats);
        this.playerInfo.set(info);
        this.playerRanks.set(ranks);
        this.playerInventory.set(inventory);
        this.viewingPlayer.set(true);
        this.loading.set(false);
      },
      error: (err) => {
        if (err.status === 404) {
          this.error.set(`Player "${name}" not found.`);
        } else {
          this.error.set('Failed to load stats. Is the server online?');
        }
        this.loading.set(false);
      },
    });
  }

  onStatClicked(stat: DisplayStat, color: string): void {
    if (!this.viewingPlayer()) return;
    this.selectedStat.set(stat);
    this.selectedColor.set(color);
  }

  closeModal(): void {
    this.selectedStat.set(null);
  }

  backToServer(): void {
    this.viewingPlayer.set(false);
    this.statsResult.set(null);
    this.playerInfo.set(null);
    this.playerRanks.set(null);
    this.playerInventory.set(null);
    this.error.set(null);
    this.searchName = '';
  }

  private loadServerStats(): void {
    this.serverLoading.set(true);
    this.statsService.getServerStats().subscribe({
      next: (data) => {
        this.serverStats.set(data);
        this.serverLoading.set(false);
      },
      error: () => {
        this.serverError.set('Failed to load server stats. Is the server online?');
        this.serverLoading.set(false);
      },
    });
  }

  private loadPlayerList(): void {
    this.statsService.getLeaderboard('minecraft:custom', 'minecraft:play_time').subscribe({
      next: (data) => this.playerList.set(data.entries),
    });
  }
}

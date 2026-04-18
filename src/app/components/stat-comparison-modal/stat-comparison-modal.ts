import { Component, input, output, inject, signal, computed, OnInit, OnDestroy, HostListener } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { PlayerStatsService } from '../../services/player-stats.service';
import { DisplayStat, LeaderboardEntry } from '../../models/player-stats.model';
import { formatStatValue } from '../../utils/stat-utils';

@Component({
  selector: 'app-stat-comparison-modal',
  imports: [DecimalPipe],
  templateUrl: './stat-comparison-modal.html',
  styleUrl: './stat-comparison-modal.scss',
})
export class StatComparisonModal implements OnInit, OnDestroy {
  private statsService = inject(PlayerStatsService);

  stat = input.required<DisplayStat>();
  playerName = input.required<string>();
  playerUuid = input.required<string>();
  serverTotal = input.required<number>();
  color = input<string>('#27ae60');

  closed = output<void>();

  leaderboard = signal<LeaderboardEntry[]>([]);
  leaderboardLoading = signal(true);
  leaderboardError = signal(false);

  // Tracks which player's contribution is being viewed
  viewedName = signal('');
  viewedUuid = signal('');
  viewedValue = signal(0);

  viewedDisplayValue = computed(() => formatStatValue(this.stat().statKey, this.viewedValue()));

  viewedPercentage = computed(() => {
    const total = this.serverTotal();
    if (total === 0) return 0;
    return (this.viewedValue() / total) * 100;
  });

  formattedServerTotal = computed(() => {
    return formatStatValue(this.stat().statKey, this.serverTotal());
  });

  viewedRank = computed(() => {
    const entries = this.leaderboard();
    const entry = entries.find(e => e.uuid === this.viewedUuid());
    return entry ? entry.rank : null;
  });

  ngOnInit(): void {
    document.body.style.overflow = 'hidden';

    this.viewedName.set(this.playerName());
    this.viewedUuid.set(this.playerUuid());
    this.viewedValue.set(this.stat().rawValue);

    const s = this.stat();
    this.statsService.getLeaderboard(s.category, s.statKey, 100).subscribe({
      next: (data) => {
        this.leaderboard.set(data.entries);
        this.leaderboardLoading.set(false);
      },
      error: () => {
        this.leaderboardError.set(true);
        this.leaderboardLoading.set(false);
      },
    });
  }

  ngOnDestroy(): void {
    document.body.style.overflow = '';
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closed.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.closed.emit();
    }
  }

  close(): void {
    this.closed.emit();
  }

  formatValue(value: number): string {
    return formatStatValue(this.stat().statKey, value);
  }

  leaderboardPercentage(entry: LeaderboardEntry): number {
    const entries = this.leaderboard();
    if (entries.length === 0) return 0;
    const max = entries[0].value;
    return max > 0 ? (entry.value / max) * 100 : 0;
  }

  avatarUrl(uuid: string): string {
    return `https://mc-heads.net/avatar/${uuid}/24`;
  }

  isViewedPlayer(entry: LeaderboardEntry): boolean {
    return entry.uuid === this.viewedUuid();
  }

  onPlayerClick(entry: LeaderboardEntry): void {
    this.viewedName.set(entry.name);
    this.viewedUuid.set(entry.uuid);
    this.viewedValue.set(entry.value);
  }
}

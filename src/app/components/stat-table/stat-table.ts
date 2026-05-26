import { Component, input, output, signal, computed } from '@angular/core';
import { NgStyle } from '@angular/common';
import { DisplayStat } from '../../models/player-stats.model';
import { statSpriteStyle, heartSpriteStyle } from '../../utils/sprite-utils';
import { isDamageStat, isMovementStat } from '../../utils/stat-utils';

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

  isScrollable = computed(() => this.scrollable() && this.sortedStats().length > 10);

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

  heartStyle = heartSpriteStyle();

  isHeartsStat(stat: DisplayStat): boolean {
    return isDamageStat(stat.statKey);
  }

  isBlocksStat(stat: DisplayStat): boolean {
    return isMovementStat(stat.statKey);
  }

  itemSpriteStyle(stat: DisplayStat): Record<string, string> | null {
    return statSpriteStyle(stat);
  }
}

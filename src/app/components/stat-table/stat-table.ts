import { Component, input, output, signal, computed, viewChild } from '@angular/core';
import { NgStyle } from '@angular/common';
import { CdkVirtualScrollViewport, ScrollingModule } from '@angular/cdk/scrolling';
import { DisplayStat } from '../../models/player-stats.model';
import { statSpriteStyle, heartSpriteStyle } from '../../utils/sprite-utils';
import { isDamageStat, isMovementStat } from '../../utils/stat-utils';

type SortColumn = 'label' | 'rawValue' | 'rank';
type SortDirection = 'asc' | 'desc';

// Fixed row height (px) used by the virtual scroll strategy. Must match the
// rendered height of .stat-row in stat-table.scss or scrolling will drift.
const ROW_HEIGHT = 32;
// Cap the viewport so long tables scroll instead of growing unbounded.
const MAX_VIEWPORT_HEIGHT = 326;

@Component({
  selector: 'app-stat-table',
  imports: [NgStyle, ScrollingModule],
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

  readonly rowHeight = ROW_HEIGHT;

  private viewport = viewChild(CdkVirtualScrollViewport);

  sortColumn = signal<SortColumn>('rawValue');
  sortDirection = signal<SortDirection>('desc');

  filterText = signal('');

  canScrollUp = signal(false);
  canScrollDown = signal(true);

  // Height the rows would occupy if all rendered, capped at the max.
  viewportHeight = computed(() =>
    Math.min(this.sortedStats().length * ROW_HEIGHT, MAX_VIEWPORT_HEIGHT),
  );

  // Scrollable (and chevrons shown) only when content overflows the capped viewport.
  isScrollable = computed(() => this.sortedStats().length * ROW_HEIGHT > MAX_VIEWPORT_HEIGHT);

  trackByStatKey = (_: number, stat: DisplayStat): string => stat.statKey;

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

  onScroll(): void {
    const vp = this.viewport();
    if (!vp) {
      return;
    }
    this.canScrollUp.set(vp.measureScrollOffset('top') > 1);
    this.canScrollDown.set(vp.measureScrollOffset('bottom') > 1);
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

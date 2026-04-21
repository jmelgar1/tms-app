import { Component, input, output, signal } from '@angular/core';
import { DisplayStat } from '../../models/player-stats.model';

@Component({
  selector: 'app-stat-bar-chart',
  templateUrl: './stat-bar-chart.html',
  styleUrl: './stat-bar-chart.scss',
})
export class StatBarChart {
  title = input.required<string>();
  stats = input.required<DisplayStat[]>();
  barColor = input<string>('#27ae60');
  scrollable = input<boolean>(false);

  statClicked = output<DisplayStat>();

  canScrollUp = signal(false);
  canScrollDown = signal(true);

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
}

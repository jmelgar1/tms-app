import { Component, input, signal } from '@angular/core';
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

  canScrollUp = signal(false);
  canScrollDown = signal(true);

  onScroll(event: Event): void {
    const el = event.target as HTMLElement;
    this.canScrollUp.set(el.scrollTop > 0);
    this.canScrollDown.set(el.scrollTop + el.clientHeight < el.scrollHeight - 1);
  }
}

import { Component, input } from '@angular/core';
import { formatNumber } from '../../utils/stat-utils';

@Component({
  selector: 'app-stat-highlight',
  templateUrl: './stat-highlight.html',
  styleUrl: './stat-highlight.scss',
})
export class StatHighlight {
  playtime = input.required<string>();
  deaths = input.required<number>();

  formattedDeaths(): string {
    return formatNumber(this.deaths());
  }
}

import { Component, input, output } from '@angular/core';
import { formatNumber } from '../../utils/stat-utils';

@Component({
  selector: 'app-stat-highlight',
  templateUrl: './stat-highlight.html',
  styleUrl: './stat-highlight.scss',
})
export class StatHighlight {
  playtime = input.required<string>();
  deaths = input.required<number>();

  highlightClicked = output<'playtime' | 'deaths'>();

  formattedDeaths(): string {
    return formatNumber(this.deaths());
  }
}

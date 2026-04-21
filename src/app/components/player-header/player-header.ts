import { Component, computed, input, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { InventoryGrid } from '../inventory-grid/inventory-grid';
import { PlayerInventoryResponse } from '../../models/player-stats.model';

@Component({
  selector: 'app-player-header',
  imports: [DatePipe, InventoryGrid],
  templateUrl: './player-header.html',
  styleUrl: './player-header.scss',
})
export class PlayerHeader {
  uuid = input.required<string>();
  name = input.required<string>();
  online = input<boolean>(false);
  firstSeen = input<string>('');
  lastSeen = input<string>('');
  inventory = input<PlayerInventoryResponse | null>(null);

  skinLoaded = signal(true);
  bodyUrl = computed(() => `https://mc-heads.net/body/${this.uuid()}/200`);

  onSkinError(): void {
    this.skinLoaded.set(false);
  }
}

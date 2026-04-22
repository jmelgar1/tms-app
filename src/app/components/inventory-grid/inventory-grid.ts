import { Component, computed, HostListener, input, signal } from '@angular/core';
import { NgStyle } from '@angular/common';
import { PlayerInventoryResponse, InventorySlot } from '../../models/player-stats.model';
import { SPRITE_MAP } from './sprite-map';

const SPRITESHEET_URL = 'https://pub-7cdebf4e8e6a4b16a846ef6af6dd72ae.r2.dev/inventory/items-spritesheet.png';
const TILE_SIZE = 64;
const GRID_SIZE = 39;

@Component({
  selector: 'app-inventory-grid',
  imports: [NgStyle],
  templateUrl: './inventory-grid.html',
  styleUrl: './inventory-grid.scss',
})
export class InventoryGrid {
  inventory = input.required<PlayerInventoryResponse>();
  compact = input<boolean>(false);

  slotMap = computed(() => {
    const map = new Map<number, InventorySlot>();
    for (const slot of this.inventory().slots) {
      map.set(slot.slot, slot);
    }
    return map;
  });

  hotbarSlots = Array.from({ length: 9 }, (_, i) => i);
  mainSlots = Array.from({ length: 27 }, (_, i) => i + 9);
  armorSlots = [39, 38, 37, 36]; // head, chest, legs, feet (top to bottom)
  offhandSlot = 40;

  tooltipSlot = signal<InventorySlot | null>(null);
  tooltipPosition = signal<{ x: number; y: number }>({ x: 0, y: 0 });
  private isTouchDevice = false;

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (!this.isTouchDevice) return;
    const target = event.target as HTMLElement;
    if (!target.closest('.inv-slot')) {
      this.hideTooltip();
    }
  }

  getSlot(index: number): InventorySlot | undefined {
    return this.slotMap().get(index);
  }

  isEnchanted(index: number): boolean {
    const slot = this.slotMap().get(index);
    return !!slot?.enchantments?.length;
  }

  itemSpriteStyle(itemId: string): Record<string, string> | null {
    const name = itemId.replace(':', '_');
    const pos = SPRITE_MAP[name];
    if (!pos) return null;
    const col = pos.x / TILE_SIZE;
    const row = pos.y / TILE_SIZE;
    return {
      'background-image': `url(${SPRITESHEET_URL})`,
      'background-size': `${GRID_SIZE * 100}% ${GRID_SIZE * 100}%`,
      'background-position': `${col * 100 / (GRID_SIZE - 1)}% ${row * 100 / (GRID_SIZE - 1)}%`,
    };
  }

  showTooltip(event: MouseEvent, slot: InventorySlot): void {
    this.tooltipSlot.set(slot);
    this.tooltipPosition.set({ x: event.clientX, y: event.clientY });
  }

  hideTooltip(): void {
    this.tooltipSlot.set(null);
  }

  toggleTooltip(event: Event, slot: InventorySlot): void {
    this.isTouchDevice = true;
    event.stopPropagation();
    if (this.tooltipSlot() === slot) {
      this.hideTooltip();
      return;
    }
    const el = (event.target as HTMLElement).closest('.inv-slot') as HTMLElement;
    if (el) {
      const rect = el.getBoundingClientRect();
      this.tooltipSlot.set(slot);
      this.tooltipPosition.set({ x: rect.left + rect.width / 2, y: rect.bottom });
    }
  }

  formatItemName(slot: InventorySlot): string {
    if (slot.displayName) return slot.displayName;
    return slot.itemId
      .replace(/^minecraft:/, '')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
  }

  formatEnchantmentName(id: string): string {
    return id
      .replace(/^minecraft:/, '')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
  }

  romanNumeral(level: number): string {
    const numerals = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
    return numerals[level] ?? level.toString();
  }

  durabilityPercent(slot: InventorySlot): number {
    if (!slot.durability || !slot.maxDurability) return 100;
    return Math.round((slot.durability / slot.maxDurability) * 100);
  }

  durabilityColor(slot: InventorySlot): string {
    const pct = this.durabilityPercent(slot);
    if (pct > 60) return '#27ae60';
    if (pct > 30) return '#f39c12';
    return '#e74c3c';
  }

}

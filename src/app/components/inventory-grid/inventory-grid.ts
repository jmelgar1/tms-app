import { Component, computed, input, signal } from '@angular/core';
import { PlayerInventoryResponse, InventorySlot } from '../../models/player-stats.model';

@Component({
  selector: 'app-inventory-grid',
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

  getSlot(index: number): InventorySlot | undefined {
    return this.slotMap().get(index);
  }

  isEnchanted(index: number): boolean {
    const slot = this.slotMap().get(index);
    return !!slot?.enchantments?.length;
  }

  itemIconUrl(itemId: string): string {
    // CDN expects "minecraft_diamond_sword" format (colon -> underscore)
    const name = itemId.replace(':', '_');
    return `https://mc.nerothe.com/img/1.21.11/${name}.png`;
  }

  showTooltip(event: MouseEvent, slot: InventorySlot): void {
    this.tooltipSlot.set(slot);
    this.tooltipPosition.set({ x: event.clientX, y: event.clientY });
  }

  hideTooltip(): void {
    this.tooltipSlot.set(null);
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

  onIconError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
  }
}

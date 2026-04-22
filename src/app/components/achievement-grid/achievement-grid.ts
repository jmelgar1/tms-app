import { Component, computed, HostListener, input, signal } from '@angular/core';
import { NgStyle } from '@angular/common';
import { PlayerAdvancementsResponse, AdvancementEntry } from '../../models/player-stats.model';
import { SPRITE_MAP } from '../inventory-grid/sprite-map';

const SPRITESHEET_URL = 'https://pub-7cdebf4e8e6a4b16a846ef6af6dd72ae.r2.dev/inventory/items-spritesheet.png';
const TILE_SIZE = 64;
const GRID_SIZE = 39;

const CATEGORY_ORDER = ['story', 'adventure', 'husbandry', 'nether', 'end'];

const CATEGORY_META: Record<string, { title: string; color: string }> = {
  story: { title: 'Minecraft', color: '#4CAF50' },
  adventure: { title: 'Adventure', color: '#FF5722' },
  husbandry: { title: 'Husbandry', color: '#FFC107' },
  nether: { title: 'Nether', color: '#D32F2F' },
  end: { title: 'The End', color: '#9C27B0' },
};

@Component({
  selector: 'app-achievement-grid',
  imports: [NgStyle],
  templateUrl: './achievement-grid.html',
  styleUrl: './achievement-grid.scss',
})
export class AchievementGrid {
  advancements = input.required<PlayerAdvancementsResponse>();

  collapsed = signal(true);

  orderedCategories = computed(() => {
    const cats = this.advancements().categories;
    const ordered: { key: string; title: string; color: string; advancements: AdvancementEntry[]; completedCount: number; totalCount: number }[] = [];

    for (const key of CATEGORY_ORDER) {
      if (cats[key]) {
        const meta = CATEGORY_META[key] ?? { title: key, color: '#aaa' };
        ordered.push({
          key,
          title: meta.title,
          color: meta.color,
          advancements: cats[key].advancements,
          completedCount: cats[key].completedCount,
          totalCount: cats[key].totalCount,
        });
      }
    }

    // Include any categories not in CATEGORY_ORDER
    for (const key of Object.keys(cats)) {
      if (!CATEGORY_ORDER.includes(key)) {
        const meta = CATEGORY_META[key] ?? { title: key.charAt(0).toUpperCase() + key.slice(1), color: '#aaa' };
        ordered.push({
          key,
          title: meta.title,
          color: meta.color,
          advancements: cats[key].advancements,
          completedCount: cats[key].completedCount,
          totalCount: cats[key].totalCount,
        });
      }
    }

    return ordered;
  });

  totalCompleted = computed(() => this.advancements().totalCompleted);
  totalAvailable = computed(() => this.advancements().totalAvailable);

  // Tooltip
  tooltipAdvancement = signal<AdvancementEntry | null>(null);
  tooltipPosition = signal<{ x: number; y: number }>({ x: 0, y: 0 });
  private isTouchDevice = false;

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (!this.isTouchDevice) return;
    const target = event.target as HTMLElement;
    if (!target.closest('.adv-slot')) {
      this.hideTooltip();
    }
  }

  toggle(): void {
    this.collapsed.update(v => !v);
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

  showTooltip(event: MouseEvent, adv: AdvancementEntry): void {
    this.tooltipAdvancement.set(adv);
    this.tooltipPosition.set({ x: event.clientX, y: event.clientY });
  }

  hideTooltip(): void {
    this.tooltipAdvancement.set(null);
  }

  toggleTooltip(event: Event, adv: AdvancementEntry): void {
    this.isTouchDevice = true;
    event.stopPropagation();
    if (this.tooltipAdvancement() === adv) {
      this.hideTooltip();
      return;
    }
    const el = (event.target as HTMLElement).closest('.adv-slot') as HTMLElement;
    if (el) {
      const rect = el.getBoundingClientRect();
      this.tooltipAdvancement.set(adv);
      this.tooltipPosition.set({ x: rect.left + rect.width / 2, y: rect.bottom });
    }
  }
}

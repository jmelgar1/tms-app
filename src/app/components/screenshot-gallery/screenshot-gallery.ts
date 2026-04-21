import { Component, inject, input, output, signal, computed, OnInit, OnChanges, AfterViewInit, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ScreenshotService } from '../../services/screenshot.service';
import { Screenshot } from '../../models/screenshot.model';

@Component({
  selector: 'app-screenshot-gallery',
  imports: [DatePipe],
  templateUrl: './screenshot-gallery.html',
  styleUrl: './screenshot-gallery.scss',
})
export class ScreenshotGallery implements OnInit, OnChanges, AfterViewInit {
  private screenshotService = inject(ScreenshotService);

  @ViewChildren('card') cards!: QueryList<ElementRef<HTMLElement>>;

  refreshTrigger = input(0);
  uploadClicked = output<void>();

  screenshots = signal<Screenshot[]>([]);
  loading = signal(true);
  error = signal(false);
  currentIndex = signal(0);

  canScrollUp = computed(() => this.currentIndex() > 0);
  canScrollDown = computed(() => this.currentIndex() < this.screenshots().length - 1);

  private cardWidth = signal(0);
  private readonly gap = 16; // 1rem
  private scrolling = false;

  trackTransform = computed(() => {
    const w = this.cardWidth();
    if (w === 0) return 'translateX(0)';
    const i = this.currentIndex();
    const offset = -(i * (w + this.gap));
    return `translateX(${offset}px)`;
  });

  ngOnInit(): void {
    this.fetchScreenshots();
  }

  ngOnChanges(): void {
    this.fetchScreenshots();
  }

  ngAfterViewInit(): void {
    this.measureCardWidth();
    this.cards.changes.subscribe(() => this.measureCardWidth());
  }

  imageUrl(screenshot: Screenshot): string {
    return screenshot.imageUrl || this.screenshotService.imageUrl(screenshot.id);
  }

  avatarUrl(uuid: string): string {
    return `https://mc-heads.net/avatar/${uuid}/24`;
  }

  onUploadClick(): void {
    this.uploadClicked.emit();
  }

  onWheel(event: WheelEvent): void {
    event.preventDefault();
    if (this.scrolling) return;

    if (event.deltaY > 0) {
      this.goNext();
    } else if (event.deltaY < 0) {
      this.goPrev();
    }
  }

  goNext(): void {
    const max = this.screenshots().length - 1;
    if (this.currentIndex() >= max) return;
    this.scrolling = true;
    this.currentIndex.update((i) => i + 1);
    setTimeout(() => (this.scrolling = false), 400);
  }

  goPrev(): void {
    if (this.currentIndex() <= 0) return;
    this.scrolling = true;
    this.currentIndex.update((i) => i - 1);
    setTimeout(() => (this.scrolling = false), 400);
  }

  private measureCardWidth(): void {
    const firstCard = this.cards.first;
    if (firstCard) {
      this.cardWidth.set(firstCard.nativeElement.offsetWidth);
    }
  }

  private fetchScreenshots(): void {
    this.screenshotService.getScreenshots(20, 0).subscribe({
      next: (data) => {
        this.screenshots.set(data.screenshots);
        this.currentIndex.set(0);
        this.loading.set(false);
        this.error.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set(true);
      },
    });
  }
}

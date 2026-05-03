import { Component, inject, input, output, signal, computed, OnInit, OnChanges, AfterViewInit, ViewChildren, QueryList, ElementRef, HostListener } from '@angular/core';
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
  totalScreenshots = signal(0);
  loading = signal(true);
  loadingMore = signal(false);
  error = signal(false);
  currentIndex = signal(0);

  private allLoaded = false;
  private readonly PAGE_SIZE = 20;
  private readonly PREFETCH_THRESHOLD = 5;

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

  private touchStartX = 0;
  private touchStartY = 0;

  onTouchStart(event: TouchEvent): void {
    this.touchStartX = event.touches[0].clientX;
    this.touchStartY = event.touches[0].clientY;
  }

  onTouchEnd(event: TouchEvent): void {
    const deltaX = event.changedTouches[0].clientX - this.touchStartX;
    const deltaY = event.changedTouches[0].clientY - this.touchStartY;
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      if (deltaX < 0) this.goNext();
      else this.goPrev();
    }
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.measureCardWidth();
  }

  goNext(): void {
    const max = this.screenshots().length - 1;
    if (this.currentIndex() >= max) return;
    this.scrolling = true;
    this.currentIndex.update((i) => i + 1);
    setTimeout(() => (this.scrolling = false), 400);
    this.prefetchIfNeeded();
  }

  goPrev(): void {
    if (this.currentIndex() <= 0) return;
    this.scrolling = true;
    this.currentIndex.update((i) => i - 1);
    setTimeout(() => (this.scrolling = false), 400);
  }

  private prefetchIfNeeded(): void {
    const loaded = this.screenshots().length;
    const remaining = loaded - this.currentIndex() - 1;
    if (remaining <= this.PREFETCH_THRESHOLD && !this.allLoaded && !this.loadingMore()) {
      this.loadMore();
    }
  }

  private loadMore(): void {
    this.loadingMore.set(true);
    const offset = this.screenshots().length;
    this.screenshotService.getScreenshots(this.PAGE_SIZE, offset).subscribe({
      next: (data) => {
        if (data.screenshots.length > 0) {
          this.screenshots.update(current => [...current, ...data.screenshots]);
        }
        this.totalScreenshots.set(data.total);
        if (data.screenshots.length < this.PAGE_SIZE || this.screenshots().length >= data.total) {
          this.allLoaded = true;
        }
        this.loadingMore.set(false);
      },
      error: () => {
        this.loadingMore.set(false);
      },
    });
  }

  private measureCardWidth(): void {
    const firstCard = this.cards.first;
    if (firstCard) {
      this.cardWidth.set(firstCard.nativeElement.offsetWidth);
    }
  }

  private fetchScreenshots(): void {
    this.loading.set(true);
    this.allLoaded = false;
    this.screenshotService.getScreenshots(this.PAGE_SIZE, 0).subscribe({
      next: (data) => {
        this.screenshots.set(data.screenshots);
        this.totalScreenshots.set(data.total);
        this.currentIndex.set(0);
        this.loading.set(false);
        this.error.set(false);
        if (data.screenshots.length < this.PAGE_SIZE || data.screenshots.length >= data.total) {
          this.allLoaded = true;
        }
      },
      error: () => {
        this.loading.set(false);
        this.error.set(true);
      },
    });
  }
}

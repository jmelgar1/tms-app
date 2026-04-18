import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ServerStatusService } from '../../services/server-status.service';
import { ServerStatus, PlayerInfo } from '../../models/server-status.model';
import { ScreenshotGallery } from '../../components/screenshot-gallery/screenshot-gallery';
import { ScreenshotUploadModal } from '../../components/screenshot-upload-modal/screenshot-upload-modal';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-home',
  imports: [RouterLink, ScreenshotGallery, ScreenshotUploadModal],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit, OnDestroy {
  private statusService = inject(ServerStatusService);
  bluemapUrl = environment.bluemapUrl;
  private refreshInterval: ReturnType<typeof setInterval> | null = null;

  status = signal<ServerStatus | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  showUploadModal = signal(false);
  galleryRefresh = signal(0);

  ngOnInit(): void {
    const cached = this.statusService.cachedStatus;
    if (cached) {
      this.status.set(cached);
      this.loading.set(false);
    }
    this.fetchStatus();
    this.refreshInterval = setInterval(() => this.fetchStatus(), 60_000);
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  playerName(player: PlayerInfo): string {
    return player.name_clean || player.name || player.name_raw || 'Unknown';
  }

  playerAvatarUrl(player: PlayerInfo): string {
    return `https://mc-heads.net/avatar/${player.uuid}/48`;
  }

  openUploadModal(): void {
    this.showUploadModal.set(true);
  }

  onUploadModalClosed(): void {
    this.showUploadModal.set(false);
  }

  onScreenshotUploaded(): void {
    this.galleryRefresh.update((v) => v + 1);
  }

  private fetchStatus(): void {
    this.statusService.getServerStatus().subscribe({
      next: (data) => {
        this.status.set(data);
        this.loading.set(false);
        this.error.set(null);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Failed to fetch server status.');
      },
    });
  }
}

import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ServerStatusService } from '../../services/server-status.service';
import { ServerStatus, PlayerInfo } from '../../models/server-status.model';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit, OnDestroy {
  private statusService = inject(ServerStatusService);
  private refreshInterval: ReturnType<typeof setInterval> | null = null;

  status = signal<ServerStatus | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

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

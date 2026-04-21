import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PlayerStatsResponse, PlayerInfoResponse, ServerStatsResponse, LeaderboardResponse, PlayerRanksResponse, PlayerInventoryResponse } from '../models/player-stats.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PlayerStatsService {
  private http = inject(HttpClient);

  getStatsByName(name: string): Observable<PlayerStatsResponse> {
    return this.http.get<PlayerStatsResponse>(
      `${environment.tmsApiBase}/players/name/${encodeURIComponent(name)}/stats`
    );
  }

  getPlayerInfo(name: string): Observable<PlayerInfoResponse> {
    return this.http.get<PlayerInfoResponse>(
      `${environment.tmsApiBase}/players/name/${encodeURIComponent(name)}`
    );
  }

  getServerStats(): Observable<ServerStatsResponse> {
    return this.http.get<ServerStatsResponse>(
      `${environment.tmsApiBase}/stats/server`
    );
  }

  getPlayerRanks(name: string): Observable<PlayerRanksResponse> {
    return this.http.get<PlayerRanksResponse>(
      `${environment.tmsApiBase}/players/name/${encodeURIComponent(name)}/ranks`
    );
  }

  getPlayerInventory(name: string): Observable<PlayerInventoryResponse> {
    return this.http.get<PlayerInventoryResponse>(
      `${environment.tmsApiBase}/players/name/${encodeURIComponent(name)}/inventory`
    );
  }

  getLeaderboard(category: string, stat: string, limit: number = 100): Observable<LeaderboardResponse> {
    return this.http.get<LeaderboardResponse>(
      `${environment.tmsApiBase}/leaderboard?category=${encodeURIComponent(category)}&stat=${encodeURIComponent(stat)}&limit=${limit}`
    );
  }
}

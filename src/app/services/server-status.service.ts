import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { ServerStatus } from '../models/server-status.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ServerStatusService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.statusApiBase}/${environment.serverAddress}`;

  cachedStatus: ServerStatus | null = null;

  getServerStatus(): Observable<ServerStatus> {
    return this.http.get<ServerStatus>(this.apiUrl).pipe(
      tap((data) => (this.cachedStatus = data))
    );
  }
}

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ScreenshotListResponse, TokenRequestResponse, TokenStatusResponse } from '../models/screenshot.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ScreenshotService {
  private http = inject(HttpClient);

  getScreenshots(limit = 20, offset = 0): Observable<ScreenshotListResponse> {
    return this.http.get<ScreenshotListResponse>(
      `${environment.tmsApiBase}/screenshots?limit=${limit}&offset=${offset}`
    );
  }

  requestToken(username: string): Observable<TokenRequestResponse> {
    return this.http.post<TokenRequestResponse>(
      `${environment.tmsApiBase}/screenshots/request-token`,
      { username }
    );
  }

  checkTokenStatus(token: string): Observable<TokenStatusResponse> {
    return this.http.get<TokenStatusResponse>(
      `${environment.tmsApiBase}/screenshots/token-status?token=${encodeURIComponent(token)}`
    );
  }

  uploadScreenshot(token: string, file: File, caption?: string): Observable<{ message: string }> {
    const formData = new FormData();
    formData.append('token', token);
    formData.append('file', file);
    if (caption) formData.append('caption', caption);
    return this.http.post<{ message: string }>(
      `${environment.tmsApiBase}/screenshots/upload`,
      formData
    );
  }

  imageUrl(id: number): string {
    return `${environment.tmsApiBase}/screenshots/${id}/image`;
  }
}

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DonationInfo } from '../models/donation.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DonationService {
  private http = inject(HttpClient);

  getDonationInfo(): Observable<DonationInfo> {
    return this.http.get<DonationInfo>(`${environment.tmsApiBase}/donations`);
  }
}

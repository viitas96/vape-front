import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { StoreSettings, StoreSettingsUpdate } from '../features/settings/store-settings.models';

@Injectable({ providedIn: 'root' })
export class StoreSettingsService {
  private readonly API_URL = `${environment.apiBaseUrl}/settings`;

  constructor(private http: HttpClient) {}

  get(): Observable<StoreSettings> {
    return this.http.get<StoreSettings>(this.API_URL);
  }

  update(dto: StoreSettingsUpdate): Observable<StoreSettings> {
    return this.http.put<StoreSettings>(this.API_URL, dto);
  }
}
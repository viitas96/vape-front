import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { MyOrder, MyProfile } from '../features/dashboard/customer/customer.models';
import { PageResponse } from '../shared/models/page-response.model';
import { DrinkStampHistoryItem } from '../features/coffee/coffee.models';

@Injectable({ providedIn: 'root' })
export class MeService {
  private readonly API_URL = `${environment.apiBaseUrl}/me`;

  constructor(private http: HttpClient) {}

  getProfile(): Observable<MyProfile> {
    return this.http.get<MyProfile>(this.API_URL);
  }

  getOrders(page = 0, size = 10): Observable<PageResponse<MyOrder>> {
    return this.http.get<PageResponse<MyOrder>>(`${this.API_URL}/orders`, {
      params: { page, size },
    });
  }

  getDrinkStamps(page = 0, size = 10): Observable<PageResponse<DrinkStampHistoryItem>> {
    return this.http.get<PageResponse<DrinkStampHistoryItem>>(`${this.API_URL}/drink-stamps`, {
      params: { page, size },
    });
  }
}
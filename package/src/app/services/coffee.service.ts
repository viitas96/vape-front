import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { CoffeeCustomer, DrinkStampEventResponse, DrinkStampTick } from '../features/coffee/coffee.models';

@Injectable({ providedIn: 'root' })
export class CoffeeService {
  private readonly API_URL = `${environment.apiBaseUrl}/coffee`;

  constructor(private http: HttpClient) {}

  findCustomer(code: string): Observable<CoffeeCustomer> {
    return this.http.get<CoffeeCustomer>(`${this.API_URL}/customers`, { params: { code } });
  }

  stamp(tick: DrinkStampTick): Observable<DrinkStampEventResponse> {
    return this.http.post<DrinkStampEventResponse>(`${this.API_URL}/stamps`, tick);
  }

  redeem(tick: DrinkStampTick): Observable<DrinkStampEventResponse> {
    return this.http.post<DrinkStampEventResponse>(`${this.API_URL}/redemptions`, tick);
  }

  undo(eventId: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/events/${eventId}`);
  }
}

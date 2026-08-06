import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Promotion, PromotionDTO } from '../features/dashboard/customer/customer.models';

@Injectable({ providedIn: 'root' })
export class PromotionService {
  private readonly API_URL = `${environment.apiBaseUrl}/promotions`;

  constructor(private http: HttpClient) {}

  getActive(): Observable<Promotion[]> {
    return this.http.get<Promotion[]>(this.API_URL);
  }

  getAll(): Observable<Promotion[]> {
    return this.http.get<Promotion[]>(`${this.API_URL}/all`);
  }

  create(dto: PromotionDTO): Observable<Promotion> {
    return this.http.post<Promotion>(this.API_URL, dto);
  }

  update(id: number, dto: PromotionDTO): Observable<Promotion> {
    return this.http.put<Promotion>(`${this.API_URL}/${id}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }
}
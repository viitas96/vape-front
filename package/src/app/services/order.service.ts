import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Order, OrderDTO, Refund, RefundDTO } from '../features/orders/order.models';
import { PageResponse } from '../shared/models/page-response.model';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly API_URL = `${environment.apiBaseUrl}/orders`;

  constructor(private http: HttpClient) {}

  getAll(page = 0, size = 10, sortBy = 'id', sortDirection = 'desc', shiftId?: number | null): Observable<PageResponse<Order>> {
    let params = new HttpParams().set('page', page).set('size', size).set('sortBy', sortBy).set('sortDirection', sortDirection);
    if (shiftId !== null && shiftId !== undefined) {
      params = params.set('shiftId', shiftId);
    }

    return this.http.get<PageResponse<Order>>(this.API_URL, { params });
  }

  getRefunds(id: number): Observable<Refund[]> {
    return this.http.get<Refund[]>(`${this.API_URL}/${id}/refunds`);
  }

  refund(id: number, dto: RefundDTO): Observable<void> {
    return this.http.post<void>(`${this.API_URL}/${id}/refunds`, dto);
  }

  getById(id: number): Observable<Order> {
    return this.http.get<Order>(`${this.API_URL}/${id}`);
  }

  create(dto: OrderDTO): Observable<Order> {
    return this.http.post<Order>(this.API_URL, dto);
  }

  update(id: number, dto: OrderDTO): Observable<Order> {
    return this.http.put<Order>(`${this.API_URL}/${id}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }
}

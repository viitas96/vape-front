import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Order, OrderDTO } from '../features/orders/order.models';
import { PageResponse } from '../shared/models/page-response.model';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly API_URL = `${environment.apiBaseUrl}/orders`;

  constructor(private http: HttpClient) {}

  getAll(page = 0, size = 10): Observable<PageResponse<Order>> {
    return this.http.get<PageResponse<Order>>(this.API_URL, {
      params: { page, size },
    });
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
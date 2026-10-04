import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Order, OrderDTO, OrderFilter, Refund, RefundDTO } from '../features/orders/order.models';
import { PageResponse } from '../shared/models/page-response.model';
import { toQueryParams } from '../shared/http/file-download';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly API_URL = `${environment.apiBaseUrl}/orders`;

  constructor(private http: HttpClient) {}

  getAll(page = 0, size = 10, sortBy = 'id', sortDirection = 'desc', filter: OrderFilter = {}): Observable<PageResponse<Order>> {
    return this.http.get<PageResponse<Order>>(this.API_URL, {
      params: { page, size, sortBy, sortDirection, ...toQueryParams(filter) },
    });
  }

  export(filter: OrderFilter): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.API_URL}/export`, {
      params: toQueryParams(filter),
      observe: 'response',
      responseType: 'blob',
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

  getRefunds(id: number): Observable<Refund[]> {
    return this.http.get<Refund[]>(`${this.API_URL}/${id}/refunds`);
  }

  refund(id: number, dto: RefundDTO): Observable<void> {
    return this.http.post<void>(`${this.API_URL}/${id}/refunds`, dto);
  }
}

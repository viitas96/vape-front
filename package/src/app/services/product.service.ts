import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Product, ProductDTO } from '../features/products/product.models';
import { PageResponse } from '../shared/models/page-response.model';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly API_URL = `${environment.apiBaseUrl}/products`;

  constructor(private http: HttpClient) {}

  getAll(page = 0, size = 10): Observable<PageResponse<Product>> {
    return this.http.get<PageResponse<Product>>(this.API_URL, {
      params: { page, size },
    });
  }

  getById(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.API_URL}/${id}`);
  }

  create(dto: ProductDTO): Observable<Product> {
    return this.http.post<Product>(this.API_URL, dto);
  }

  update(id: number, dto: ProductDTO): Observable<Product> {
    return this.http.put<Product>(`${this.API_URL}/${id}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }
}
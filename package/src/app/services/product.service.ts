import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Product, ProductDTO, StockMovement } from '../features/products/product.models';
import { PageResponse } from '../shared/models/page-response.model';

export interface ProductFilters {
  name?: string;
  gammaId?: number | null;
  categoryId?: number | null;
  brandId?: number | null;
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly API_URL = `${environment.apiBaseUrl}/products`;

  constructor(private http: HttpClient) {}

  getAll(
    page = 0,
    size = 10,
    sortBy = 'id',
    sortDirection = 'asc',
    filters: ProductFilters = {},
  ): Observable<PageResponse<Product>> {
    const params: Record<string, string | number> = { page, size, sortBy, sortDirection };

    if (filters.name) {
      params['name'] = filters.name;
    }

    if (filters.gammaId) {
      params['gammaId'] = filters.gammaId;
    }

    if (filters.categoryId) {
      params['categoryId'] = filters.categoryId;
    }

    if (filters.brandId) {
      params['brandId'] = filters.brandId;
    }

    return this.http.get<PageResponse<Product>>(this.API_URL, {
      params,
    });
  }

  getById(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.API_URL}/${id}`);
  }

  getStockMovements(id: number, page = 0, size = 20): Observable<PageResponse<StockMovement>> {
    return this.http.get<PageResponse<StockMovement>>(`${this.API_URL}/${id}/stock-movements`, {
      params: { page, size },
    });
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

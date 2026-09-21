import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ProductGroupCategory, ProductGroupCategoryDTO } from '../features/product-group-categories/product-group-category.models';

@Injectable({ providedIn: 'root' })
export class ProductGroupCategoryService {
  private readonly API_URL = `${environment.apiBaseUrl}/product-group-categories`;

  constructor(private http: HttpClient) {}

  getAll(sortBy = 'id', sortDirection = 'asc'): Observable<ProductGroupCategory[]> {
    return this.http.get<ProductGroupCategory[]>(this.API_URL, {
      params: { sortBy, sortDirection },
    });
  }

  create(dto: ProductGroupCategoryDTO): Observable<ProductGroupCategory> {
    return this.http.post<ProductGroupCategory>(this.API_URL, dto);
  }

  update(id: number, dto: ProductGroupCategoryDTO): Observable<ProductGroupCategory> {
    return this.http.put<ProductGroupCategory>(`${this.API_URL}/${id}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }
}

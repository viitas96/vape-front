import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ProductGroup, ProductGroupDTO } from '../features/product-groups/product-group.models';

@Injectable({ providedIn: 'root' })
export class ProductGroupService {
  private readonly API_URL = `${environment.apiBaseUrl}/product-groups`;

  constructor(private http: HttpClient) {}

  getAll(sortBy = 'id', sortDirection = 'asc'): Observable<ProductGroup[]> {
    return this.http.get<ProductGroup[]>(this.API_URL, {
      params: { sortBy, sortDirection },
    });
  }

  create(dto: ProductGroupDTO): Observable<ProductGroup> {
    return this.http.post<ProductGroup>(this.API_URL, dto);
  }

  update(id: number, dto: ProductGroupDTO): Observable<ProductGroup> {
    return this.http.put<ProductGroup>(`${this.API_URL}/${id}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }
}

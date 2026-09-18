import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ProductGamma, ProductGammaDTO } from '../features/product-gammas/product-gamma.models';

@Injectable({ providedIn: 'root' })
export class ProductGammaService {
  private readonly API_URL = `${environment.apiBaseUrl}/product-gammas`;

  constructor(private http: HttpClient) {}

  getAll(sortBy = 'id', sortDirection = 'asc'): Observable<ProductGamma[]> {
    return this.http.get<ProductGamma[]>(this.API_URL, {
      params: { sortBy, sortDirection },
    });
  }

  create(dto: ProductGammaDTO): Observable<ProductGamma> {
    return this.http.post<ProductGamma>(this.API_URL, dto);
  }

  update(id: number, dto: ProductGammaDTO): Observable<ProductGamma> {
    return this.http.put<ProductGamma>(`${this.API_URL}/${id}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }
}

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Brand, BrandDTO } from '../features/brands/brand.models';

@Injectable({ providedIn: 'root' })
export class BrandService {
  private readonly API_URL = `${environment.apiBaseUrl}/brands`;

  constructor(private http: HttpClient) {}

  getActive(sortBy = 'name', sortDirection = 'asc'): Observable<Brand[]> {
    return this.http.get<Brand[]>(this.API_URL, { params: { sortBy, sortDirection } });
  }

  getAll(sortBy = 'name', sortDirection = 'asc'): Observable<Brand[]> {
    return this.http.get<Brand[]>(`${this.API_URL}/all`, { params: { sortBy, sortDirection } });
  }

  create(dto: BrandDTO): Observable<Brand> {
    return this.http.post<Brand>(this.API_URL, dto);
  }

  update(id: number, dto: BrandDTO): Observable<Brand> {
    return this.http.put<Brand>(`${this.API_URL}/${id}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }
}

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { CustomerDTO, CustomerUpdateDTO } from '../features/customers/customer.models';
import { RoleDTO, UserResponse } from '../features/users/user.models';
import { PageResponse } from '../shared/models/page-response.model';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly API_URL = `${environment.apiBaseUrl}/admin`;

  constructor(private http: HttpClient) {}

  getRoles(): Observable<RoleDTO[]> {
    return this.http.get<RoleDTO[]>(`${this.API_URL}/roles`);
  }

  createUser(email: string, password: string, rolesIds: number[]): Observable<{ token: string }> {
    return this.http.post<{ token: string }>(`${this.API_URL}/users`, {
      email,
      password,
      roles_ids: rolesIds,
    });
  }

  getUsers(page = 0, size = 10, sortBy = 'id', sortDirection = 'asc'): Observable<PageResponse<UserResponse>> {
    return this.http.get<PageResponse<UserResponse>>(`${this.API_URL}/users`, {
      params: { page, size, sortBy, sortDirection },
    });
  }

  getCustomers(page = 0, size = 10, sortBy = 'id', sortDirection = 'asc'): Observable<PageResponse<UserResponse>> {
    return this.http.get<PageResponse<UserResponse>>(`${this.API_URL}/users/customers`, {
      params: { page, size, sortBy, sortDirection },
    });
  }

  createCustomer(dto: CustomerDTO): Observable<void> {
    return this.http.post<void>(`${this.API_URL}/customers`, dto);
  }

  updateCustomer(id: number, dto: CustomerUpdateDTO): Observable<void> {
    return this.http.put<void>(`${this.API_URL}/customers/${id}`, dto);
  }

  changePassword(id: number, newPassword: string): Observable<void> {
    return this.http.put<void>(`${this.API_URL}/users/${id}/password`, { newPassword });
  }

  toggleBan(id: number): Observable<UserResponse> {
    return this.http.put<UserResponse>(`${this.API_URL}/users/${id}/ban`, {});
  }
}

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { PosCheckoutDTO, PosCheckoutResponse, ScanResult } from '../features/dashboard/seller/pos.models';

@Injectable({ providedIn: 'root' })
export class PosService {
  private readonly API_URL = `${environment.apiBaseUrl}/pos`;

  constructor(private http: HttpClient) {}

  scan(code: string): Observable<ScanResult> {
    return this.http.get<ScanResult>(`${this.API_URL}/scan`, { params: { code } });
  }

  checkout(dto: PosCheckoutDTO): Observable<PosCheckoutResponse> {
    return this.http.post<PosCheckoutResponse>(`${this.API_URL}/checkout`, dto);
  }
}
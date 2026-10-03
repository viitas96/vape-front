import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  CashMovement,
  CashMovementDTO,
  Shift,
  ShiftCloseDTO,
  ShiftOpenDTO,
  ShiftReport,
} from '../features/shifts/shift.models';
import { PageResponse } from '../shared/models/page-response.model';

@Injectable({ providedIn: 'root' })
export class ShiftService {
  private readonly API_URL = `${environment.apiBaseUrl}/shifts`;

  constructor(private http: HttpClient) {}

  getCurrent(): Observable<Shift | null> {
    return this.http.get<Shift | null>(`${this.API_URL}/current`);
  }

  open(dto: ShiftOpenDTO): Observable<void> {
    return this.http.post<void>(`${this.API_URL}/open`, dto);
  }

  close(dto: ShiftCloseDTO): Observable<void> {
    return this.http.post<void>(`${this.API_URL}/close`, dto);
  }

  recordCashMovement(dto: CashMovementDTO): Observable<void> {
    return this.http.post<void>(`${this.API_URL}/cash-movements`, dto);
  }

  getCashMovements(shiftId: number): Observable<CashMovement[]> {
    return this.http.get<CashMovement[]>(`${this.API_URL}/${shiftId}/cash-movements`);
  }

  getAll(page = 0, size = 10): Observable<PageResponse<Shift>> {
    return this.http.get<PageResponse<Shift>>(this.API_URL, { params: { page, size } });
  }

  getById(id: number): Observable<Shift> {
    return this.http.get<Shift>(`${this.API_URL}/${id}`);
  }

  getReport(id: number): Observable<ShiftReport> {
    return this.http.get<ShiftReport>(`${this.API_URL}/${id}/report`);
  }

  getCurrentReport(): Observable<ShiftReport> {
    return this.http.get<ShiftReport>(`${this.API_URL}/current/report`);
  }
}

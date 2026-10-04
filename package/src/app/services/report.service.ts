import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  CategorySales,
  EmployeeSales,
  InventoryValuation,
  ItemSales,
  OneCOperationType,
  PaymentTypeSales,
  ReportPeriod,
  ReportTab,
  SalesSummary,
  TaxSales,
} from '../features/reports/report.models';

@Injectable({ providedIn: 'root' })
export class ReportService {
  private readonly API_URL = `${environment.apiBaseUrl}/reports`;

  constructor(private http: HttpClient) {}

  getSummary(period: ReportPeriod): Observable<SalesSummary> {
    return this.http.get<SalesSummary>(`${this.API_URL}/summary`, { params: { ...period } });
  }

  getItemSales(period: ReportPeriod): Observable<ItemSales[]> {
    return this.http.get<ItemSales[]>(`${this.API_URL}/items`, { params: { ...period } });
  }

  getCategorySales(period: ReportPeriod): Observable<CategorySales[]> {
    return this.http.get<CategorySales[]>(`${this.API_URL}/categories`, { params: { ...period } });
  }

  getEmployeeSales(period: ReportPeriod): Observable<EmployeeSales[]> {
    return this.http.get<EmployeeSales[]>(`${this.API_URL}/employees`, { params: { ...period } });
  }

  getPaymentTypeSales(period: ReportPeriod): Observable<PaymentTypeSales[]> {
    return this.http.get<PaymentTypeSales[]>(`${this.API_URL}/payment-types`, { params: { ...period } });
  }

  getTaxes(period: ReportPeriod): Observable<TaxSales[]> {
    return this.http.get<TaxSales[]>(`${this.API_URL}/taxes`, { params: { ...period } });
  }

  getInventoryValuation(): Observable<InventoryValuation> {
    return this.http.get<InventoryValuation>(`${this.API_URL}/inventory`);
  }

  export(report: ReportTab | 'summary', period: ReportPeriod): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.API_URL}/${report}/export`, {
      params: { ...period },
      observe: 'response',
      responseType: 'blob',
    });
  }

  exportForOneC(month: string, type: OneCOperationType): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.API_URL}/1c-export`, {
      params: { month, type },
      observe: 'response',
      responseType: 'blob',
    });
  }
}

import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ApexAxisChartSeries, ApexChart, ApexDataLabels, ApexGrid, ApexLegend, ApexPlotOptions, ApexTooltip, ApexXAxis, ApexYAxis, NgApexchartsModule } from 'ng-apexcharts';
import { MaterialModule } from 'src/app/material.module';
import { ReportService } from 'src/app/services/report.service';
import { DateRangeFilterComponent } from 'src/app/shared/date/date-range-filter.component';
import { DateRange, presetRange } from 'src/app/shared/date/date-range.util';
import { toIsoDate } from 'src/app/shared/date/date.util';
import { saveFile } from 'src/app/shared/http/file-download';
import { formatMdl } from 'src/app/shared/money/money.util';
import {
  CategorySales,
  DailySales,
  EmployeeSales,
  InventoryValuation,
  ItemSales,
  OneCOperationType,
  PaymentTypeSales,
  ReportPeriod,
  ReportTab,
  SalesSummary,
  TaxSales,
} from './report.models';

interface DailyChart {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  colors: string[];
  plotOptions: ApexPlotOptions;
  dataLabels: ApexDataLabels;
  grid: ApexGrid;
  legend: ApexLegend;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  tooltip: ApexTooltip;
}

interface SummaryTile {
  label: string;
  value: string;
}

const TABS: readonly ReportTab[] = ['items', 'categories', 'employees', 'payment-types', 'taxes', 'inventory'];
const CHART_COLOR = '#0085db';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [MaterialModule, TranslatePipe, NgApexchartsModule, DateRangeFilterComponent, FormsModule],
  templateUrl: './reports.component.html',
  styles: [`
    .report-tiles {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: 12px;
    }

    .report-tile {
      border: 1px solid rgba(0, 0, 0, 0.08);
      border-radius: 8px;
      padding: 12px 16px;
    }

    .report-table {
      overflow-x: auto;
    }

    .report-warning {
      border-left: 3px solid #ffae1f;
      padding: 8px 12px;
      background: rgba(255, 174, 31, 0.1);
      border-radius: 4px;
    }

    .report-one-c {
      border: 1px solid rgba(0, 0, 0, 0.08);
      border-radius: 8px;
      padding: 12px 16px;
    }
  `],
})
export class ReportsComponent implements OnInit {
  readonly tabs = TABS;
  readonly itemColumns = ['productName', 'categoryName', 'quantity', 'quantityRefunded', 'netSales', 'refunds', 'netRevenue', 'costOfGoods', 'grossProfit'];
  readonly categoryColumns = ['categoryName', 'quantity', 'quantityRefunded', 'netRevenue', 'costOfGoods', 'grossProfit', 'sharePercent'];
  readonly employeeColumns = ['seller', 'receiptsCount', 'shiftsCount', 'grossSales', 'pointsDiscount', 'netSales', 'averageReceipt'];
  readonly paymentTypeColumns = ['type', 'receiptsCount', 'amount', 'refunded', 'netAmount', 'sharePercent'];
  readonly taxColumns = ['vatRate', 'netSales', 'refunds', 'taxableAmount', 'vatAmount', 'amountWithoutVat'];
  readonly inventoryColumns = ['productName', 'categoryName', 'stock', 'costPrice', 'price', 'costValue', 'retailValue', 'potentialProfit'];
  readonly oneCTypes: readonly OneCOperationType[] = ['SALES', 'RETURNS'];

  period: ReportPeriod = presetRange('THIS_MONTH');
  activeTab: ReportTab = 'items';
  summary: SalesSummary | null = null;
  tiles: SummaryTile[] = [];
  chart: DailyChart | null = null;
  itemSales: ItemSales[] = [];
  categorySales: CategorySales[] = [];
  employeeSales: EmployeeSales[] = [];
  paymentTypeSales: PaymentTypeSales[] = [];
  taxes: TaxSales[] = [];
  inventory: InventoryValuation | null = null;
  oneCMonth = toIsoDate(new Date()).slice(0, 7);
  oneCType: OneCOperationType = 'SALES';
  errorMessage = '';
  exporting = false;

  constructor(
    private readonly reportService: ReportService,
    private readonly translateService: TranslateService,
  ) {}

  ngOnInit(): void {
    this.loadAll();
  }

  format(cents: number | null): string {
    if (cents === null) {
      return '-';
    }

    return formatMdl(cents);
  }

  exportForOneC(): void {
    if (!this.oneCMonth) {
      return;
    }

    this.exporting = true;
    this.reportService.exportForOneC(this.oneCMonth, this.oneCType).subscribe({
      next: (response) => {
        saveFile(response, `1c-${this.oneCType.toLowerCase()}_${this.oneCMonth}.xlsx`);
        this.exporting = false;
      },
      error: () => {
        this.errorMessage = this.translateService.instant('REPORTS.EXPORT_FAILED');
        this.exporting = false;
      },
    });
  }

  onRangeChange(range: DateRange): void {
    if (!range.from || !range.to) {
      return;
    }

    this.period = { from: range.from, to: range.to };
    this.loadAll();
  }

  onTabChange(index: number): void {
    this.activeTab = this.tabs[index];
    this.loadActiveTab();
  }

  export(report: ReportTab | 'summary'): void {
    this.exporting = true;
    this.reportService.export(report, this.period).subscribe({
      next: (response) => {
        saveFile(response, `${report}_${this.period.from}_${this.period.to}.xlsx`);
        this.exporting = false;
      },
      error: () => {
        this.errorMessage = this.translateService.instant('REPORTS.EXPORT_FAILED');
        this.exporting = false;
      },
    });
  }

  private loadAll(): void {
    this.errorMessage = '';
    this.reportService.getSummary(this.period).subscribe({
      next: (summary) => {
        this.summary = summary;
        this.tiles = this.buildTiles(summary);
        this.chart = this.buildChart(summary.daily);
      },
      error: () => this.setLoadError(),
    });
    this.loadActiveTab();
  }

  private loadActiveTab(): void {
    switch (this.activeTab) {
      case 'items':
        this.reportService.getItemSales(this.period).subscribe({
          next: (rows) => (this.itemSales = rows),
          error: () => this.setLoadError(),
        });
        break;
      case 'categories':
        this.reportService.getCategorySales(this.period).subscribe({
          next: (rows) => (this.categorySales = rows),
          error: () => this.setLoadError(),
        });
        break;
      case 'employees':
        this.reportService.getEmployeeSales(this.period).subscribe({
          next: (rows) => (this.employeeSales = rows),
          error: () => this.setLoadError(),
        });
        break;
      case 'payment-types':
        this.reportService.getPaymentTypeSales(this.period).subscribe({
          next: (rows) => (this.paymentTypeSales = rows),
          error: () => this.setLoadError(),
        });
        break;
      case 'taxes':
        this.reportService.getTaxes(this.period).subscribe({
          next: (rows) => (this.taxes = rows),
          error: () => this.setLoadError(),
        });
        break;
      case 'inventory':
        this.reportService.getInventoryValuation().subscribe({
          next: (valuation) => (this.inventory = valuation),
          error: () => this.setLoadError(),
        });
        break;
    }
  }

  private setLoadError(): void {
    this.errorMessage = this.translateService.instant('REPORTS.LOAD_FAILED');
  }

  private buildTiles(summary: SalesSummary): SummaryTile[] {
    const t = (key: string) => this.translateService.instant(`REPORTS.${key}`);
    return [
      { label: t('NET_REVENUE'), value: formatMdl(summary.netRevenue) },
      { label: t('GROSS_PROFIT'), value: formatMdl(summary.grossProfit) },
      { label: t('COST_OF_GOODS'), value: formatMdl(summary.costOfGoods) },
      { label: t('NET_SALES'), value: formatMdl(summary.netSales) },
      { label: t('REFUNDS'), value: `${formatMdl(summary.refunds)} (${summary.refundsCount})` },
      { label: t('GROSS_SALES'), value: formatMdl(summary.grossSales) },
      { label: t('POINTS_DISCOUNT'), value: formatMdl(summary.pointsDiscount) },
      { label: t('VAT_AMOUNT'), value: formatMdl(summary.vatAmount) },
      { label: t('RECEIPTS'), value: String(summary.receiptsCount) },
      { label: t('AVERAGE_RECEIPT'), value: formatMdl(summary.averageReceipt) },
      { label: t('CASH'), value: formatMdl(summary.cashPayments - summary.cashRefunds) },
      { label: t('CARD'), value: formatMdl(summary.cardPayments - summary.cardRefunds) },
    ];
  }

  private buildChart(daily: DailySales[]): DailyChart {
    return {
      series: [{ name: this.translateService.instant('REPORTS.NET_REVENUE'), data: daily.map((day) => day.netRevenue) }],
      chart: { type: 'bar', height: 280, toolbar: { show: false }, fontFamily: 'inherit', foreColor: '#7c8fac' },
      colors: [CHART_COLOR],
      plotOptions: { bar: { borderRadius: 4, borderRadiusApplication: 'end', columnWidth: '60%' } },
      dataLabels: { enabled: false },
      grid: { borderColor: 'rgba(124, 143, 172, 0.2)', strokeDashArray: 3 },
      legend: { show: false },
      xaxis: { categories: daily.map((day) => this.formatDay(day.date)), axisTicks: { show: false } },
      yaxis: { labels: { formatter: (value: number) => (value / 100).toFixed(0) } },
      tooltip: { y: { formatter: (value: number) => formatMdl(value) } },
    };
  }

  private formatDay(isoDate: string): string {
    const [, month, day] = isoDate.split('-');
    return `${day}.${month}`;
  }
}

import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { forkJoin } from 'rxjs';
import { MaterialModule } from 'src/app/material.module';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AdminService } from 'src/app/services/admin.service';
import { UserResponse } from '../users/user.models';
import { OrderService } from 'src/app/services/order.service';
import { Order, OrderFilter, OrderStatus, PaymentMethod, RefundDTO } from './order.models';
import { RefundDialogComponent, RefundDialogData } from './refund-dialog.component';
import { FormsModule } from '@angular/forms';
import { DateRangeFilterComponent } from 'src/app/shared/date/date-range-filter.component';
import { DateRange } from 'src/app/shared/date/date-range.util';
import { saveFile } from 'src/app/shared/http/file-download';
import { ProductService } from 'src/app/services/product.service';
import { Product } from '../products/product.models';
import { ConfirmDialogService } from 'src/app/shared/dialogs/confirm-dialog.service';
import { PagedListPageState } from 'src/app/shared/page/page-state';
import { TablePaginatorComponent } from 'src/app/shared/page/table-paginator.component';
import { AuthService } from 'src/app/services/auth.service';
import { OrderDialogComponent, OrderDialogData } from './order-dialog.component';
import { OrderViewDialogComponent, OrderViewDialogData } from './order-view-dialog.component';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [MaterialModule, DatePipe, TranslatePipe, TablePaginatorComponent, FormsModule, DateRangeFilterComponent],
  templateUrl: './orders.component.html',
  styles: [`
    .mat-column-createdBy {
      flex: 2.5;
      min-width: 200px;
    }
  `],
})
export class OrdersComponent extends PagedListPageState implements OnInit {
  orders: Order[] = [];
  products: Product[] = [];
  users: UserResponse[] = [];
  displayedColumns = ['id', 'status', 'items', 'pointsUsed', 'total', 'createdBy', 'createdAt', 'actions', 'expand'];
  override sortDirection = 'desc' as const;
  readonly statuses: OrderStatus[] = ['PENDING', 'COMPLETED', 'CANCELLED'];
  readonly paymentMethods: PaymentMethod[] = ['CASH', 'CARD', 'SPLIT'];
  filter: OrderFilter = {};
  exporting = false;

  constructor(
    private readonly orderService: OrderService,
    private readonly productService: ProductService,
    private readonly adminService: AdminService,
    private readonly authService: AuthService,
    private readonly dialog: MatDialog,
    private readonly confirmDialog: ConfirmDialogService,
    private readonly translateService: TranslateService,
  ) {
    super();
  }

  get canManage(): boolean {
    return this.authService.hasAnyRole(['ADMIN', 'SELLER']);
  }

  get canExport(): boolean {
    return this.authService.hasAnyRole(['ADMIN', 'ACCOUNTANT']);
  }

  ngOnInit(): void {
    this.loadPage();
    this.loadReferenceData();
  }

  onRangeChange(range: DateRange): void {
    this.filter = { ...this.filter, from: range.from, to: range.to };
    this.applyFilters();
  }

  applyFilters(): void {
    this.pageIndex = 0;
    this.collapseRowDetails();
    this.loadPage();
  }

  resetFilters(): void {
    this.filter = {};
    this.applyFilters();
  }

  export(): void {
    this.exporting = true;
    this.orderService.export(this.filter).subscribe({
      next: (response) => {
        saveFile(response, 'receipts.xlsx');
        this.exporting = false;
      },
      error: () => {
        this.setError(this.translateService.instant('ORDERS.EXPORT_FAILED'));
        this.exporting = false;
      },
    });
  }

  formatPrice(cents: number): string {
    return (cents / 100).toFixed(2);
  }

  openViewDialog(order: Order): void {
    const data: OrderViewDialogData = {
      order,
      customerEmail: this.users.find((user) => user.uuid === order.customerId)?.email ?? null,
    };

    this.dialog.open(OrderViewDialogComponent, { width: '640px', maxWidth: 'calc(100vw - 48px)', data });
  }

  openDialog(order?: Order): void {
    const data: OrderDialogData = {
      order: order ?? null,
      products: this.products,
      users: this.users,
      usePoints: false,
    };

    this.dialog.open(OrderDialogComponent, { width: '720px', data }).afterClosed().subscribe((dto) => {
      if (!dto) {
        return;
      }

      this.clearMessages();
      const request = order
        ? this.orderService.update(order.id, dto)
        : this.orderService.create(dto);

      request.subscribe({
        next: (savedOrder) => {
          this.setSuccess(this.translateService.instant(order ? 'ORDERS.UPDATED' : 'ORDERS.CREATED', { id: order?.id ?? savedOrder.id }));
          this.loadPage();
        },
        error: (error) => {
          this.setError(error.error?.message ?? this.translateService.instant(order ? 'ORDERS.UPDATE_FAILED' : 'ORDERS.CREATE_FAILED'));
        },
      });
    });
  }

  canRefund(order: Order): boolean {
    return this.canManage && order.status === 'COMPLETED';
  }

  openRefundDialog(order: Order): void {
    this.clearMessages();
    this.orderService.getRefunds(order.id).subscribe({
      next: (refunds) => {
        const data: RefundDialogData = { order, refunds };
        this.dialog.open(RefundDialogComponent, { width: '640px', maxWidth: 'calc(100vw - 48px)', data })
          .afterClosed()
          .subscribe((dto) => {
            if (dto) {
              this.submitRefund(order, dto);
            }
          });
      },
      error: () => this.setError(this.translateService.instant('REFUNDS.LOAD_FAILED')),
    });
  }

  delete(order: Order): void {
    this.confirmDialog.confirm({
      title: this.translateService.instant('ORDERS.DELETE_TITLE'),
      message: this.translateService.instant('ORDERS.DELETE_MESSAGE', { id: order.id }),
      confirmLabel: this.translateService.instant('COMMON.DELETE'),
      confirmColor: 'warn',
    }).subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }

      this.orderService.delete(order.id).subscribe({
        next: () => {
          this.setSuccess(this.translateService.instant('ORDERS.DELETED', { id: order.id }));
          this.loadPage();
        },
        error: () => {
          this.setError(this.translateService.instant('ORDERS.DELETE_FAILED'));
        },
      });
    });
  }

  private submitRefund(order: Order, dto: RefundDTO): void {
    this.orderService.refund(order.id, dto).subscribe({
      next: () => {
        this.setSuccess(this.translateService.instant('REFUNDS.CREATED', { id: order.id }));
        this.loadPage();
      },
      error: (error) => {
        this.setError(error.error?.message ?? this.translateService.instant('REFUNDS.CREATE_FAILED'));
      },
    });
  }

  protected override loadPage(): void {
    this.orderService.getAll(this.pageIndex, this.pageSize, this.sortBy, this.sortDirection, this.filter).subscribe({
      next: (response) => {
        this.orders = response.content;
        this.updateTotal(response.totalElements);
      },
      error: () => {
        this.setError(this.translateService.instant('ORDERS.LOAD_FAILED'));
      },
    });
  }

  private loadReferenceData(): void {
    forkJoin({
      products: this.productService.getAll(0, 1000),
      users: this.adminService.getCustomers(0, 1000),
    }).subscribe({
      next: ({ products, users }) => {
        this.products = products.content;
        this.users = users.content;
      },
      error: () => {
        this.setError(this.translateService.instant('ORDERS.REFERENCE_LOAD_FAILED'));
      },
    });
  }
}

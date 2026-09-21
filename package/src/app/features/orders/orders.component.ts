import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { forkJoin } from 'rxjs';
import { MaterialModule } from 'src/app/material.module';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AdminService } from 'src/app/services/admin.service';
import { UserResponse } from '../users/user.models';
import { OrderService } from 'src/app/services/order.service';
import { Order } from './order.models';
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
  imports: [MaterialModule, DatePipe, TranslatePipe, TablePaginatorComponent],
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

  ngOnInit(): void {
    this.loadPage();
    this.loadReferenceData();
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

  protected override loadPage(): void {
    this.orderService.getAll(this.pageIndex, this.pageSize, this.sortBy, this.sortDirection).subscribe({
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

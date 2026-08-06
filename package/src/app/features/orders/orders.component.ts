import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { forkJoin } from 'rxjs';
import { MaterialModule } from 'src/app/material.module';
import { TranslatePipe } from '@ngx-translate/core';
import { AdminService } from 'src/app/services/admin.service';
import { UserResponse } from '../users/user.models';
import { OrderService } from 'src/app/services/order.service';
import { Order } from './order.models';
import { ProductService } from 'src/app/services/product.service';
import { Product } from '../products/product.models';
import { ConfirmDialogService } from 'src/app/shared/dialogs/confirm-dialog.service';
import { PagedListPageState } from 'src/app/shared/page/page-state';
import { OrderDialogComponent, OrderDialogData } from './order-dialog.component';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [MaterialModule, DatePipe, TranslatePipe],
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
  displayedColumns = ['id', 'status', 'items', 'pointsUsed', 'total', 'createdBy', 'createdAt', 'actions'];

  constructor(
    private readonly orderService: OrderService,
    private readonly productService: ProductService,
    private readonly adminService: AdminService,
    private readonly dialog: MatDialog,
    private readonly confirmDialog: ConfirmDialogService,
  ) {
    super();
  }

  ngOnInit(): void {
    this.loadPage();
    this.loadReferenceData();
  }

  formatPrice(cents: number): string {
    return (cents / 100).toFixed(2);
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
          this.setSuccess(order ? `Order #${order.id} updated.` : `Order #${savedOrder.id} created.`);
          this.loadPage();
        },
        error: (error) => {
          this.setError(error.error?.message ?? `Failed to ${order ? 'update' : 'create'} order`);
        },
      });
    });
  }

  delete(order: Order): void {
    this.confirmDialog.confirm({
      title: 'Delete Order',
      message: `Delete order #${order.id}?`,
      confirmLabel: 'Delete',
      confirmColor: 'warn',
    }).subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }

      this.orderService.delete(order.id).subscribe({
        next: () => {
          this.setSuccess(`Order #${order.id} deleted.`);
          this.loadPage();
        },
        error: () => {
          this.setError('Failed to delete order');
        },
      });
    });
  }

  protected override loadPage(): void {
    this.orderService.getAll(this.pageIndex, this.pageSize).subscribe({
      next: (response) => {
        this.orders = response.content;
        this.updateTotal(response.totalElements);
      },
      error: () => {
        this.setError('Failed to load orders');
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
        this.setError('Failed to load order reference data');
      },
    });
  }
}
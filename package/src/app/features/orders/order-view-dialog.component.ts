import { DatePipe } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslatePipe } from '@ngx-translate/core';
import { MaterialModule } from 'src/app/material.module';
import { Order } from './order.models';

export interface OrderViewDialogData {
  order: Order;
  customerEmail: string | null;
}

@Component({
  selector: 'app-order-view-dialog',
  standalone: true,
  imports: [MaterialModule, TranslatePipe, DatePipe],
  templateUrl: './order-view-dialog.component.html',
  styles: [`
    .order-view-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 16px;
      margin: 0;
    }

    .order-view-items {
      max-width: 100%;
      overflow-x: auto;
    }

    .order-view-items table {
      min-width: 420px;
    }

    @media (max-width: 600px) {
      .order-view-grid {
        grid-template-columns: minmax(0, 1fr);
      }
    }
  `],
})
export class OrderViewDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: OrderViewDialogData) {}

  get order(): Order {
    return this.data.order;
  }

  get customerLabel(): string | null {
    return this.data.customerEmail ?? this.order.customerId ?? null;
  }

  formatPrice(cents: number): string {
    return (cents / 100).toFixed(2);
  }
}

import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { EMPTY, Observable, map, switchMap } from 'rxjs';
import { OrderService } from 'src/app/services/order.service';
import { Order } from './order.models';
import { RefundDialogComponent, RefundDialogData } from './refund-dialog.component';

@Injectable({ providedIn: 'root' })
export class RefundFlowService {
  constructor(
    private readonly dialog: MatDialog,
    private readonly orderService: OrderService,
  ) {}

  canRefund(order: Order): boolean {
    return order.status === 'COMPLETED' && order.refundStatus !== 'REFUNDED';
  }

  refund(order: Order): Observable<number> {
    const data: RefundDialogData = { order };
    return this.dialog.open(RefundDialogComponent, { width: '680px', maxWidth: 'calc(100vw - 48px)', data })
      .afterClosed()
      .pipe(
        switchMap((dto) => {
          if (!dto) {
            return EMPTY;
          }

          return this.orderService.refund(order.id, dto).pipe(map(() => order.id));
        }),
      );
  }
}

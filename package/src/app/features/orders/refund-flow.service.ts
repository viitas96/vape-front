import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { EMPTY, Observable, catchError, forkJoin, map, of, switchMap, tap } from 'rxjs';
import { OrderService } from 'src/app/services/order.service';
import { ShiftService } from 'src/app/services/shift.service';
import { PosPrintService } from 'src/app/shared/print/pos-print.service';
import { Order } from './order.models';
import { RefundDialogComponent, RefundDialogData } from './refund-dialog.component';

@Injectable({ providedIn: 'root' })
export class RefundFlowService {
  constructor(
    private readonly dialog: MatDialog,
    private readonly orderService: OrderService,
    private readonly shiftService: ShiftService,
    private readonly posPrint: PosPrintService,
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

          return this.orderService.refund(order.id, dto);
        }),
        tap(() => this.printLatestRefund(order)),
        map(() => order.id),
      );
  }

  private printLatestRefund(order: Order): void {
    forkJoin({
      refunds: this.orderService.getRefunds(order.id),
      drawer: this.shiftService.getCurrentReport().pipe(
        map((report) => report.expectedCash ?? null),
        catchError(() => of(null)),
      ),
    }).subscribe(({ refunds, drawer }) => {
      const latest = refunds.at(-1);
      if (latest) {
        this.posPrint.printRefund(order, latest, drawer);
      }
    });
  }
}

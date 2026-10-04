import { DatePipe } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { MaterialModule } from 'src/app/material.module';
import { Order } from 'src/app/features/orders/order.models';
import { RefundFlowService } from 'src/app/features/orders/refund-flow.service';
import { OrderService } from 'src/app/services/order.service';
import { getApiErrorMessage } from 'src/app/shared/http/api-error';
import { formatMdl } from 'src/app/shared/money/money.util';
import { PosPrintService } from 'src/app/shared/print/pos-print.service';

export interface ReceiptsDialogData {
  shiftId: number | null;
}

const RECEIPTS_PAGE_SIZE = 50;

@Component({
  selector: 'app-receipts-dialog',
  standalone: true,
  imports: [MaterialModule, FormsModule, TranslatePipe, DatePipe],
  template: `
    <h2 mat-dialog-title>{{ 'REFUNDS.RECEIPTS_TITLE' | translate }}</h2>

    <mat-dialog-content>
      <form class="d-flex align-items-center gap-8 p-t-8" (ngSubmit)="findByNumber()">
        <mat-form-field appearance="outline" class="w-100" subscriptSizing="dynamic">
          <mat-label>{{ 'REFUNDS.RECEIPTS_SEARCH' | translate }}</mat-label>
          <input matInput type="number" min="1" name="receiptNumber" [(ngModel)]="receiptNumber" autocomplete="off" />
        </mat-form-field>
        <button mat-stroked-button type="submit" [disabled]="!receiptNumber">{{ 'REFUNDS.RECEIPTS_FIND' | translate }}</button>
      </form>

      @if (successMessage) {
        <p class="text-success f-s-13 m-t-8">{{ successMessage }}</p>
      }
      @if (errorMessage) {
        <p class="text-danger f-s-13 m-t-8">{{ errorMessage }}</p>
      }

      <div class="receipts-list m-t-12">
        @for (order of receipts; track order.id) {
          <div class="receipt-row" [class.receipt-row-refunded]="order.refundStatus === 'REFUNDED'">
            <div class="receipt-main">
              <span class="f-w-700">#{{ order.id }}</span>
              <span class="f-s-12">{{ order.createdAt | date:'HH:mm' }} · {{ order.items.length }} × · {{ order.paymentMethod }}</span>
            </div>
            <div class="receipt-side">
              @if (order.refundStatus && order.refundStatus !== 'NONE') {
                <span class="receipt-badge">{{ 'REFUNDS.STATUS_' + order.refundStatus | translate }}</span>
              }
              <strong>{{ format(order.total) }}</strong>
              <button mat-icon-button type="button" (click)="print(order)" [title]="'POS.PRINT_LAST_RECEIPT' | translate">
                <mat-icon>print</mat-icon>
              </button>
              @if (canRefund(order)) {
                <button mat-stroked-button color="warn" type="button" (click)="refund(order)">
                  <mat-icon>undo</mat-icon> {{ 'REFUNDS.ACTION' | translate }}
                </button>
              }
            </div>
          </div>
        }

        @if (!loading && receipts.length === 0) {
          <p class="f-s-13">{{ 'REFUNDS.RECEIPTS_EMPTY' | translate }}</p>
        }
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-flat-button color="primary" mat-dialog-close>{{ 'COMMON.CLOSE' | translate }}</button>
    </mat-dialog-actions>
  `,
  styles: `
    .receipts-list {
      max-height: 55vh;
      overflow: auto;
    }

    .receipt-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 8px 4px;
      border-bottom: 1px solid var(--mat-sys-outline-variant);
    }

    .receipt-row-refunded {
      color: var(--mat-sys-error);
    }

    .receipt-main {
      display: flex;
      flex-direction: column;
    }

    .receipt-side {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .receipt-badge {
      padding: 1px 6px;
      border-radius: 8px;
      font-size: 11px;
      color: var(--mat-sys-error);
      border: 1px solid var(--mat-sys-error);
    }
  `,
})
export class ReceiptsDialogComponent implements OnInit {
  receipts: Order[] = [];
  receiptNumber: number | null = null;
  loading = true;
  successMessage = '';
  errorMessage = '';

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ReceiptsDialogData,
    private readonly orderService: OrderService,
    private readonly refundFlow: RefundFlowService,
    private readonly translateService: TranslateService,
    private readonly posPrint: PosPrintService,
  ) {}

  ngOnInit(): void {
    this.loadReceipts();
  }

  canRefund(order: Order): boolean {
    return this.refundFlow.canRefund(order);
  }

  format(cents: number): string {
    return formatMdl(cents);
  }

  print(order: Order): void {
    this.posPrint.printSale(order);
  }

  findByNumber(): void {
    const id = this.receiptNumber;
    if (!id) {
      return;
    }

    this.clearMessages();
    this.orderService.getById(id).subscribe({
      next: (order) => {
        if (!this.canRefund(order)) {
          this.errorMessage = this.translateService.instant('REFUNDS.RECEIPTS_NOT_REFUNDABLE', { id });
          return;
        }

        this.refund(order);
      },
      error: () => {
        this.errorMessage = this.translateService.instant('REFUNDS.RECEIPTS_NOT_FOUND', { id });
      },
    });
  }

  refund(order: Order): void {
    this.clearMessages();
    this.refundFlow.refund(order).subscribe({
      next: (id) => {
        this.successMessage = this.translateService.instant('REFUNDS.CREATED', { id });
        this.receiptNumber = null;
        this.loadReceipts();
      },
      error: (error) => {
        this.errorMessage = getApiErrorMessage(error, this.translateService.instant('REFUNDS.CREATE_FAILED'));
      },
    });
  }

  private loadReceipts(): void {
    this.loading = true;
    this.orderService.getAll(0, RECEIPTS_PAGE_SIZE, 'id', 'desc', this.data.shiftId).subscribe({
      next: (response) => {
        this.receipts = response.content.filter((order) => order.status === 'COMPLETED');
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.errorMessage = this.translateService.instant('REFUNDS.LOAD_FAILED');
      },
    });
  }

  private clearMessages(): void {
    this.successMessage = '';
    this.errorMessage = '';
  }
}

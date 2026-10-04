import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslatePipe } from '@ngx-translate/core';
import { MaterialModule } from 'src/app/material.module';
import { formatMdl } from 'src/app/shared/money/money.util';
import { Order, OrderItem, RefundDTO } from './order.models';

export interface RefundDialogData {
  order: Order;
}

interface RefundLine {
  item: OrderItem;
  remaining: number;
  quantity: number;
}

@Component({
  selector: 'app-refund-dialog',
  standalone: true,
  imports: [MaterialModule, FormsModule, TranslatePipe],
  template: `
    <h2 mat-dialog-title>{{ 'REFUNDS.TITLE' | translate }} · #{{ data.order.id }}</h2>

    <mat-dialog-content>
      @if (nothingLeft) {
        <p class="f-s-14">{{ 'REFUNDS.NOTHING_LEFT' | translate }}</p>
      } @else {
        <div class="refund-lines m-b-16">
          <div class="refund-line refund-line-header f-s-12 f-w-600">
            <span>{{ 'COMMON.PRODUCT' | translate }}</span>
            <span class="text-right">{{ 'REFUNDS.REMAINING' | translate }}</span>
            <span class="text-center">{{ 'REFUNDS.QUANTITY' | translate }}</span>
            <span class="text-right">{{ 'REFUNDS.AMOUNT' | translate }}</span>
          </div>
          @for (line of lines; track line.item.id) {
            <div class="refund-line f-s-13" [class.refund-line-done]="line.remaining === 0">
              <span>{{ line.item.productName }}</span>
              <span class="text-right">{{ line.remaining }}</span>
              <span class="refund-stepper">
                <button mat-icon-button type="button" [disabled]="line.quantity === 0" (click)="change(line, -1)">
                  <mat-icon>remove</mat-icon>
                </button>
                <strong>{{ line.quantity }}</strong>
                <button mat-icon-button type="button" [disabled]="line.quantity >= line.remaining" (click)="change(line, 1)">
                  <mat-icon>add</mat-icon>
                </button>
              </span>
              <span class="text-right">{{ format(lineAmount(line)) }}</span>
            </div>
          }
        </div>

        <div class="d-flex align-items-center justify-content-between m-b-16">
          <span class="f-s-14 f-w-600">{{ 'REFUNDS.TOTAL' | translate }}</span>
          <span class="f-s-18 f-w-700">{{ format(total) }}</span>
        </div>

        <p class="f-s-13 m-b-16">{{ 'REFUNDS.SAME_METHOD' | translate }}</p>

        <mat-form-field appearance="outline" class="w-100">
          <mat-label>{{ 'REFUNDS.REASON' | translate }}</mat-label>
          <input matInput maxlength="255" [(ngModel)]="reason" />
        </mat-form-field>

        @if (data.order.customerId) {
          <p class="f-s-12 m-b-0">{{ 'REFUNDS.POINTS_HINT' | translate }}</p>
        }
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-stroked-button mat-dialog-close>{{ 'COMMON.CANCEL' | translate }}</button>
      @if (!nothingLeft) {
        <button mat-flat-button color="warn" [disabled]="!canSubmit" (click)="submit()">{{ 'REFUNDS.CONFIRM' | translate }}</button>
      }
    </mat-dialog-actions>
  `,
  styles: `
    .refund-line {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 56px 128px 96px;
      align-items: center;
      gap: 8px;
      padding: 4px 0;
      border-bottom: 1px solid var(--mat-sys-outline-variant);
    }

    .refund-line-header {
      padding-bottom: 8px;
    }

    .refund-line-done {
      opacity: 0.5;
    }

    .refund-stepper {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
    }

    .text-right {
      text-align: right;
    }

    .text-center {
      text-align: center;
    }
  `,
})
export class RefundDialogComponent {
  readonly lines: RefundLine[];
  reason = '';

  constructor(
    public dialogRef: MatDialogRef<RefundDialogComponent, RefundDTO>,
    @Inject(MAT_DIALOG_DATA) public data: RefundDialogData,
  ) {
    this.lines = data.order.items.map((item) => ({
      item,
      remaining: item.quantity - (item.refundedQuantity ?? 0),
      quantity: 0,
    }));
  }

  get nothingLeft(): boolean {
    return this.lines.every((line) => line.remaining === 0);
  }

  get total(): number {
    return this.lines.reduce((sum, line) => sum + this.lineAmount(line), 0);
  }

  get canSubmit(): boolean {
    return this.lines.some((line) => line.quantity > 0);
  }

  format(cents: number): string {
    return formatMdl(cents);
  }

  change(line: RefundLine, delta: number): void {
    line.quantity = Math.min(line.remaining, Math.max(0, line.quantity + delta));
  }

  lineAmount(line: RefundLine): number {
    const net = line.item.netLineTotal ?? line.item.lineTotal;
    const alreadyRefunded = line.item.quantity - line.remaining;
    const share = (quantity: number) => Math.floor((net * quantity) / line.item.quantity);
    return share(alreadyRefunded + line.quantity) - share(alreadyRefunded);
  }

  submit(): void {
    if (!this.canSubmit) {
      return;
    }

    this.dialogRef.close({
      items: this.lines
        .filter((line) => line.quantity > 0)
        .map((line) => ({ orderItemId: line.item.id, quantity: line.quantity })),
      reason: this.reason.trim() || undefined,
    });
  }
}

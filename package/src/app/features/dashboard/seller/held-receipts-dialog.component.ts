import { DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { MaterialModule } from 'src/app/material.module';
import { ConfirmDialogService } from 'src/app/shared/dialogs/confirm-dialog.service';
import { formatMdl } from 'src/app/shared/money/money.util';
import { HeldReceipt } from './pos.models';
import { HeldReceiptsService } from './held-receipts.service';

@Component({
  selector: 'app-held-receipts-dialog',
  standalone: true,
  imports: [MaterialModule, DatePipe, TranslatePipe],
  template: `
    <h2 mat-dialog-title>{{ 'POS.HELD_TITLE' | translate }}</h2>

    <mat-dialog-content>
      @if (receipts.length === 0) {
        <p class="f-s-14">{{ 'POS.HELD_EMPTY' | translate }}</p>
      }

      @for (receipt of receipts; track receipt.id) {
        <div class="held-receipt">
          <div class="held-receipt-info">
            <div class="f-w-600">{{ customerLabel(receipt) }}</div>
            <div class="held-receipt-muted">
              {{ 'POS.HELD_ITEMS' | translate:{ count: itemCount(receipt) } }}
              · {{ receipt.heldAt | date:'shortTime' }}
            </div>
          </div>
          <strong class="held-receipt-total">{{ total(receipt) }}</strong>
          <button mat-flat-button color="primary" type="button" (click)="resume(receipt)">
            <mat-icon>play_arrow</mat-icon>
            {{ 'POS.HELD_RESUME' | translate }}
          </button>
          <button mat-icon-button color="warn" type="button" (click)="remove(receipt)">
            <mat-icon>delete_outline</mat-icon>
          </button>
        </div>
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-stroked-button mat-dialog-close>{{ 'COMMON.CLOSE' | translate }} (Esc)</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .held-receipt {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 0;
      border-bottom: 1px solid var(--mat-sys-outline-variant, rgba(0, 0, 0, 0.12));
    }

    .held-receipt-info {
      flex: 1;
      min-width: 0;
      overflow-wrap: anywhere;
    }

    .held-receipt-muted {
      font-size: 12px;
      opacity: 0.7;
    }

    .held-receipt-total {
      white-space: nowrap;
    }
  `],
})
export class HeldReceiptsDialogComponent {
  constructor(
    private readonly heldReceipts: HeldReceiptsService,
    private readonly dialogRef: MatDialogRef<HeldReceiptsDialogComponent, string>,
    private readonly confirmDialog: ConfirmDialogService,
    private readonly translateService: TranslateService,
  ) {}

  get receipts(): HeldReceipt[] {
    return this.heldReceipts.all;
  }

  customerLabel(receipt: HeldReceipt): string {
    if (!receipt.customer) {
      return this.translateService.instant('POS.HELD_NO_CUSTOMER');
    }

    const name = [receipt.customer.firstName, receipt.customer.lastName].filter(Boolean).join(' ');
    return name || receipt.customer.email;
  }

  itemCount(receipt: HeldReceipt): number {
    return receipt.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  total(receipt: HeldReceipt): string {
    return formatMdl(receipt.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0));
  }

  resume(receipt: HeldReceipt): void {
    this.dialogRef.close(receipt.id);
  }

  remove(receipt: HeldReceipt): void {
    this.confirmDialog.confirm({
      title: this.translateService.instant('POS.HELD_DELETE_TITLE'),
      message: this.translateService.instant('POS.HELD_DELETE_MESSAGE', { label: this.customerLabel(receipt) }),
      confirmLabel: this.translateService.instant('COMMON.DELETE'),
      confirmColor: 'warn',
    }).subscribe((confirmed) => {
      if (confirmed) {
        this.heldReceipts.remove(receipt.id);
      }
    });
  }
}

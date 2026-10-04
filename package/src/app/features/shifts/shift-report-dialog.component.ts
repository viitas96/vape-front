import { DatePipe } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { MaterialModule } from 'src/app/material.module';
import { ShiftService } from 'src/app/services/shift.service';
import { formatMdl } from 'src/app/shared/money/money.util';
import { CashMovement, ShiftReport } from './shift.models';

export interface ShiftReportDialogData {
  shiftId: number;
}

@Component({
  selector: 'app-shift-report-dialog',
  standalone: true,
  imports: [MaterialModule, DatePipe, TranslatePipe],
  template: `
    <h2 mat-dialog-title>{{ 'SHIFTS.REPORT' | translate }} · {{ 'SHIFTS.SHIFT' | translate }} #{{ data.shiftId }}</h2>

    <mat-dialog-content>
      @if (errorMessage) {
        <p class="text-danger f-s-14">{{ errorMessage }}</p>
      }

      @if (report) {
        <div class="m-b-16">
          <div class="d-flex justify-content-between f-s-13">
            <span>{{ 'SHIFTS.OPENED_BY' | translate }}</span>
            <span>{{ report.openedBy }} · {{ report.openedAt | date:'short' }}</span>
          </div>
          @if (report.closedAt) {
            <div class="d-flex justify-content-between f-s-13">
              <span>{{ 'SHIFTS.CLOSED_BY' | translate }}</span>
              <span>{{ report.closedBy }} · {{ report.closedAt | date:'short' }}</span>
            </div>
          }
          <div class="d-flex justify-content-between f-s-13">
            <span>{{ 'SHIFTS.DURATION' | translate }}</span>
            <span>{{ formatDuration(report.durationMinutes) }}</span>
          </div>
        </div>

        <h3 class="f-s-14 f-w-700 m-b-8">{{ 'SHIFTS.SALES' | translate }}</h3>
        <div class="d-flex justify-content-between f-s-13">
          <span>{{ 'SHIFTS.RECEIPTS' | translate }}</span><strong>{{ report.receiptsCount }}</strong>
        </div>
        <div class="d-flex justify-content-between f-s-13">
          <span>{{ 'SHIFTS.GROSS_SALES' | translate }}</span><strong>{{ format(report.grossSales) }}</strong>
        </div>
        <div class="d-flex justify-content-between f-s-13">
          <span>{{ 'SHIFTS.POINTS_DISCOUNT' | translate }}</span><strong>{{ format(report.pointsDiscount) }}</strong>
        </div>
        <div class="d-flex justify-content-between f-s-13">
          <span>{{ 'SHIFTS.NET_SALES' | translate }}</span><strong>{{ format(report.netSales) }}</strong>
        </div>
        <div class="d-flex justify-content-between f-s-13">
          <span>{{ 'SHIFTS.POINTS_USED' | translate }}</span><strong>{{ report.pointsUsed }}</strong>
        </div>
        <div class="d-flex justify-content-between f-s-13">
          <span>{{ 'SHIFTS.POINTS_EARNED' | translate }}</span><strong>{{ report.pointsEarned }}</strong>
        </div>

        <mat-divider class="m-y-12"></mat-divider>

        <h3 class="f-s-14 f-w-700 m-b-8">{{ 'SHIFTS.TENDERS' | translate }}</h3>
        <div class="d-flex justify-content-between f-s-13">
          <span>{{ 'SHIFTS.CASH_PAYMENTS' | translate }}</span><strong>{{ format(report.cashPayments) }}</strong>
        </div>
        <div class="d-flex justify-content-between f-s-13">
          <span>{{ 'SHIFTS.CARD_PAYMENTS' | translate }}</span><strong>{{ format(report.cardPayments) }}</strong>
        </div>
        <div class="d-flex justify-content-between f-s-13">
          <span>{{ 'SHIFTS.POINTS_PAYMENTS' | translate }}</span><strong>{{ format(report.pointsPayments) }}</strong>
        </div>
        <div class="d-flex justify-content-between f-s-13">
          <span>{{ 'SHIFTS.FREE_DRINKS' | translate }}</span><strong>{{ report.freeDrinksRedeemed }}</strong>
        </div>
        <div class="d-flex justify-content-between f-s-13">
          <span>{{ 'SHIFTS.REFUNDS_COUNT' | translate }}</span><strong>{{ report.refundsCount ?? 0 }}</strong>
        </div>
        <div class="d-flex justify-content-between f-s-13">
          <span>{{ 'SHIFTS.CARD_REFUNDS' | translate }}</span><strong>{{ format(report.cardRefunds ?? 0) }}</strong>
        </div>

        <mat-divider class="m-y-12"></mat-divider>

        <h3 class="f-s-14 f-w-700 m-b-8">{{ 'SHIFTS.CASH_DRAWER' | translate }}</h3>
        <p class="f-s-12 m-b-8">{{ 'SHIFTS.CARD_NOT_IN_DRAWER' | translate }}</p>
        <div class="d-flex justify-content-between f-s-13">
          <span>{{ 'SHIFTS.STARTING_CASH' | translate }}</span><strong>{{ format(report.startingCash) }}</strong>
        </div>
        <div class="d-flex justify-content-between f-s-13">
          <span>{{ 'SHIFTS.CASH_PAYMENTS' | translate }}</span><strong>{{ format(report.cashPayments) }}</strong>
        </div>
        <div class="d-flex justify-content-between f-s-13">
          <span>{{ 'SHIFTS.CASH_REFUNDS' | translate }}</span><strong>−{{ format(report.cashRefunds ?? 0) }}</strong>
        </div>
        <div class="d-flex justify-content-between f-s-13">
          <span>{{ 'SHIFTS.PAID_IN' | translate }}</span><strong>{{ format(report.paidIn) }}</strong>
        </div>
        <div class="d-flex justify-content-between f-s-13">
          <span>{{ 'SHIFTS.PAID_OUT' | translate }}</span><strong>{{ format(report.paidOut) }}</strong>
        </div>
        <div class="d-flex justify-content-between f-s-14 f-w-700 m-t-8">
          <span>{{ 'SHIFTS.EXPECTED_CASH' | translate }}</span><span>{{ format(report.expectedCash ?? 0) }}</span>
        </div>
        @if (hasActualCash) {
          <div class="d-flex justify-content-between f-s-14 f-w-700">
            <span>{{ 'SHIFTS.ACTUAL_CASH' | translate }}</span><span>{{ format(report.actualCash ?? 0) }}</span>
          </div>
          <div class="d-flex justify-content-between f-s-16 f-w-700"
               [class.text-success]="isBalanced"
               [class.text-danger]="!isBalanced">
            <span>{{ 'SHIFTS.DIFFERENCE' | translate }}</span><span>{{ format(report.difference ?? 0) }}</span>
          </div>
        }

        <mat-divider class="m-y-12"></mat-divider>

        <h3 class="f-s-14 f-w-700 m-b-8">{{ 'SHIFTS.MOVEMENTS' | translate }}</h3>
        @if (movements.length === 0) {
          <p class="f-s-13">{{ 'SHIFTS.NO_MOVEMENTS' | translate }}</p>
        }
        @for (movement of movements; track movement.id) {
          <div class="d-flex justify-content-between f-s-13">
            <span>
              {{ ('SHIFTS.' + movement.type) | translate }}
              @if (movement.comment) {
                <span>· {{ movement.comment }}</span>
              }
            </span>
            <strong>{{ format(movement.amount) }}</strong>
          </div>
        }
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-stroked-button mat-dialog-close>{{ 'COMMON.CLOSE' | translate }}</button>
    </mat-dialog-actions>
  `,
})
export class ShiftReportDialogComponent implements OnInit {
  report: ShiftReport | null = null;
  movements: CashMovement[] = [];
  errorMessage = '';

  constructor(
    private readonly shiftService: ShiftService,
    private readonly translateService: TranslateService,
    @Inject(MAT_DIALOG_DATA) public data: ShiftReportDialogData,
  ) {}

  get hasActualCash(): boolean {
    return this.report?.actualCash !== null && this.report?.actualCash !== undefined;
  }

  get isBalanced(): boolean {
    return (this.report?.difference ?? 0) === 0;
  }

  ngOnInit(): void {
    this.shiftService.getReport(this.data.shiftId).subscribe({
      next: (report) => {
        this.report = report;
      },
      error: () => {
        this.errorMessage = this.translateService.instant('SHIFTS.LOAD_FAILED');
      },
    });

    this.shiftService.getCashMovements(this.data.shiftId).subscribe({
      next: (movements) => {
        this.movements = movements;
      },
    });
  }

  format(cents: number): string {
    return formatMdl(cents);
  }

  formatDuration(minutes: number): string {
    return this.translateService.instant('SHIFTS.DURATION_VALUE', {
      hours: Math.floor(minutes / 60),
      minutes: minutes % 60,
    });
  }
}

import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { catchError, forkJoin, map, of } from 'rxjs';
import { MaterialModule } from 'src/app/material.module';
import { ShiftService } from 'src/app/services/shift.service';
import { CashMovement, CashMovementDTO, Shift, ShiftReport } from 'src/app/features/shifts/shift.models';
import { ShiftReportDialogComponent, ShiftReportDialogData } from 'src/app/features/shifts/shift-report-dialog.component';
import { formatMdl } from 'src/app/shared/money/money.util';
import { getApiErrorMessage } from 'src/app/shared/http/api-error';
import { PosPrintService } from 'src/app/shared/print/pos-print.service';
import { ShiftOpenDialogComponent, ShiftOpenDialogData } from './shift-open-dialog.component';
import { ShiftCloseDialogComponent } from './shift-close-dialog.component';
import { CashMovementDialogComponent } from './cash-movement-dialog.component';
import { ReceiptsDialogComponent, ReceiptsDialogData } from './receipts-dialog.component';

@Component({
  selector: 'app-seller-shift',
  standalone: true,
  imports: [MaterialModule, DatePipe, TranslatePipe],
  templateUrl: './seller-shift.component.html',
  styleUrls: ['./seller-shift.component.scss'],
})
export class SellerShiftComponent implements OnInit {
  currentShift: Shift | null = null;
  report: ShiftReport | null = null;
  closedShift: Shift | null = null;
  loading = true;

  constructor(
    private readonly shiftService: ShiftService,
    private readonly dialog: MatDialog,
    private readonly snackBar: MatSnackBar,
    private readonly translateService: TranslateService,
    private readonly posPrint: PosPrintService,
  ) {}

  ngOnInit(): void {
    this.loadCurrentShift();
  }

  formatMdl(cents: number | null | undefined): string {
    return formatMdl(cents ?? 0);
  }

  formatDuration(minutes: number): string {
    return this.translateService.instant('SHIFTS.DURATION_VALUE', {
      hours: Math.floor(minutes / 60),
      minutes: minutes % 60,
    });
  }

  openShift(): void {
    this.shiftService.getLastClosed().pipe(
      map((shift) => shift?.actualCash ?? null),
      catchError(() => of(null)),
    ).subscribe((suggestedStartingCash) => {
      const data: ShiftOpenDialogData = { suggestedStartingCash };
      this.dialog.open(ShiftOpenDialogComponent, { width: '360px', data })
        .afterClosed()
        .subscribe((startingCash?: number) => {
          if (startingCash === undefined) {
            return;
          }

          this.shiftService.open({ startingCash }).subscribe({
            next: () => {
              this.closedShift = null;
              this.notify('SHIFTS.OPENED_SUCCESS');
              this.loadCurrentShift();
            },
            error: (error) => this.notifyError(error, 'SHIFTS.OPEN_FAILED'),
          });
        });
    });
  }

  closeShift(): void {
    const shift = this.currentShift;
    if (!shift) {
      return;
    }

    this.dialog.open(ShiftCloseDialogComponent, { width: '360px' })
      .afterClosed()
      .subscribe((actualCash?: number) => {
        if (actualCash === undefined) {
          return;
        }

        this.shiftService.close({ actualCash }).subscribe({
          next: () => {
            this.currentShift = null;
            this.report = null;
            this.notify('SHIFTS.CLOSED_SUCCESS');
            this.loadClosedShift(shift.id);
            this.printShiftReport(shift.id);
          },
          error: (error) => this.notifyError(error, 'SHIFTS.CLOSE_FAILED'),
        });
      });
  }

  openCashMovement(): void {
    this.dialog.open(CashMovementDialogComponent, { width: '400px' })
      .afterClosed()
      .subscribe((dto?: CashMovementDTO) => {
        if (!dto) {
          return;
        }

        this.shiftService.recordCashMovement(dto).subscribe({
          next: () => {
            this.notify('SHIFTS.MOVEMENT_RECORDED');
            this.printCashMovement(dto);
            this.loadReport();
          },
          error: (error) => this.notifyError(error, 'SHIFTS.MOVEMENT_FAILED'),
        });
      });
  }

  openReport(): void {
    if (!this.currentShift) {
      return;
    }

    const data: ShiftReportDialogData = { shiftId: this.currentShift.id };
    this.dialog.open(ShiftReportDialogComponent, { width: '640px', maxWidth: 'calc(100vw - 48px)', data });
  }

  openReceipts(): void {
    const data: ReceiptsDialogData = { shiftId: this.currentShift?.id ?? null };
    this.dialog.open(ReceiptsDialogComponent, { width: '680px', maxWidth: 'calc(100vw - 48px)', data })
      .afterClosed()
      .subscribe(() => this.loadReport());
  }

  printShiftReport(shiftId: number): void {
    this.shiftService.getReport(shiftId).subscribe({
      next: (report) => this.posPrint.printShiftReport(report),
      error: (error) => this.notifyError(error, 'SHIFTS.LOAD_FAILED'),
    });
  }

  private printCashMovement(dto: CashMovementDTO): void {
    const shiftId = this.currentShift?.id;
    if (shiftId === undefined) {
      return;
    }

    forkJoin({
      movements: this.shiftService.getCashMovements(shiftId).pipe(catchError(() => of([] as CashMovement[]))),
      drawerAmount: this.shiftService.getCurrentReport().pipe(
        map((report) => report.expectedCash ?? null),
        catchError(() => of(null)),
      ),
    }).subscribe(({ movements, drawerAmount }) => {
      const latest = movements.at(-1);
      this.posPrint.printCashMovement({
        type: dto.type,
        amount: dto.amount,
        comment: dto.comment,
        drawerAmount,
        author: latest?.createdBy ?? '',
        createdAt: new Date(latest?.createdAt ?? Date.now()),
      });
    });
  }

  private loadCurrentShift(): void {
    this.loading = true;
    this.shiftService.getCurrent().subscribe({
      next: (shift) => {
        this.currentShift = shift;
        this.loading = false;
        this.loadReport();
      },
      error: () => {
        this.currentShift = null;
        this.loading = false;
      },
    });
  }

  private loadReport(): void {
    if (!this.currentShift) {
      this.report = null;
      return;
    }

    this.shiftService.getCurrentReport().subscribe({
      next: (report) => {
        this.report = report;
      },
      error: () => {
        this.report = null;
      },
    });
  }

  private loadClosedShift(id: number): void {
    this.shiftService.getById(id).subscribe({
      next: (shift) => {
        this.closedShift = shift;
      },
    });
  }

  private notifyError(error: unknown, fallbackKey: string): void {
    const message = getApiErrorMessage(error, this.translateService.instant(fallbackKey));
    this.snackBar.open(message, this.translateService.instant('COMMON.CLOSE'), { duration: 5000 });
  }

  private notify(key: string): void {
    this.snackBar.open(
      this.translateService.instant(key),
      this.translateService.instant('COMMON.CLOSE'),
      { duration: 3000 },
    );
  }
}

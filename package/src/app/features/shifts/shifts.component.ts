import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { MaterialModule } from 'src/app/material.module';
import { ShiftService } from 'src/app/services/shift.service';
import { PagedListPageState } from 'src/app/shared/page/page-state';
import { TablePaginatorComponent } from 'src/app/shared/page/table-paginator.component';
import { formatMdl } from 'src/app/shared/money/money.util';
import { Shift } from './shift.models';
import { ShiftReportDialogComponent, ShiftReportDialogData } from './shift-report-dialog.component';

@Component({
  selector: 'app-shifts',
  standalone: true,
  imports: [MaterialModule, DatePipe, TranslatePipe, TablePaginatorComponent],
  templateUrl: './shifts.component.html',
})
export class ShiftsComponent extends PagedListPageState implements OnInit {
  shifts: Shift[] = [];
  displayedColumns = [
    'id',
    'status',
    'openedBy',
    'openedAt',
    'closedAt',
    'duration',
    'startingCash',
    'expectedCash',
    'actualCash',
    'difference',
    'actions',
  ];

  constructor(
    private readonly shiftService: ShiftService,
    private readonly dialog: MatDialog,
    private readonly translateService: TranslateService,
  ) {
    super();
  }

  ngOnInit(): void {
    this.loadPage();
  }

  format(cents: number | null | undefined): string {
    return formatMdl(cents ?? 0);
  }

  formatDuration(minutes: number): string {
    return this.translateService.instant('SHIFTS.DURATION_VALUE', {
      hours: Math.floor(minutes / 60),
      minutes: minutes % 60,
    });
  }

  isBalanced(shift: Shift): boolean {
    return (shift.cashDifference ?? 0) === 0;
  }

  hasCashFigures(shift: Shift): boolean {
    return shift.expectedCash !== null && shift.expectedCash !== undefined;
  }

  openReport(shift: Shift): void {
    const data: ShiftReportDialogData = { shiftId: shift.id };
    this.dialog.open(ShiftReportDialogComponent, {
      width: '640px',
      maxWidth: 'calc(100vw - 48px)',
      data,
    });
  }

  protected override loadPage(): void {
    this.shiftService.getAll(this.pageIndex, this.pageSize).subscribe({
      next: (response) => {
        this.shifts = response.content;
        this.updateTotal(response.totalElements);
      },
      error: () => {
        this.setError(this.translateService.instant('SHIFTS.LOAD_FAILED'));
      },
    });
  }
}

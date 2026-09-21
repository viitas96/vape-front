import { Injectable, OnDestroy } from '@angular/core';
import { MatDatepickerIntl } from '@angular/material/datepicker';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { refreshOnTranslations } from '../i18n/translation-refresh';

@Injectable()
export class TranslatedDatepickerIntl extends MatDatepickerIntl implements OnDestroy {
  private readonly subscription: Subscription;

  constructor(private readonly translateService: TranslateService) {
    super();

    this.subscription = refreshOnTranslations(this.translateService, () => this.applyTranslations());
  }

  override formatYearRangeLabel = (start: string, end: string): string =>
    this.translateService.instant('DATEPICKER.YEAR_RANGE_LABEL', { start, end });

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private applyTranslations(): void {
    this.calendarLabel = this.translateService.instant('DATEPICKER.CALENDAR');
    this.openCalendarLabel = this.translateService.instant('DATEPICKER.OPEN_CALENDAR');
    this.closeCalendarLabel = this.translateService.instant('DATEPICKER.CLOSE_CALENDAR');
    this.prevMonthLabel = this.translateService.instant('DATEPICKER.PREVIOUS_MONTH');
    this.nextMonthLabel = this.translateService.instant('DATEPICKER.NEXT_MONTH');
    this.prevYearLabel = this.translateService.instant('DATEPICKER.PREVIOUS_YEAR');
    this.nextYearLabel = this.translateService.instant('DATEPICKER.NEXT_YEAR');
    this.prevMultiYearLabel = this.translateService.instant('DATEPICKER.PREVIOUS_YEARS');
    this.nextMultiYearLabel = this.translateService.instant('DATEPICKER.NEXT_YEARS');
    this.switchToMonthViewLabel = this.translateService.instant('DATEPICKER.CHOOSE_DATE');
    this.switchToMultiYearViewLabel = this.translateService.instant('DATEPICKER.CHOOSE_MONTH_YEAR');
    this.startDateLabel = this.translateService.instant('DATEPICKER.START_DATE');
    this.endDateLabel = this.translateService.instant('DATEPICKER.END_DATE');
    this.comparisonDateLabel = this.translateService.instant('DATEPICKER.COMPARISON_RANGE');
    this.changes.next();
  }
}

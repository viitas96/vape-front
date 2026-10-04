import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { MaterialModule } from 'src/app/material.module';
import { fromIsoDate, toIsoDate } from './date.util';
import { DATE_RANGE_PRESETS, DateRange, DateRangePreset, presetRange } from './date-range.util';

@Component({
  selector: 'app-date-range-filter',
  standalone: true,
  imports: [MaterialModule, ReactiveFormsModule, TranslatePipe],
  template: `
    <div class="d-flex align-items-center flex-wrap date-range-filter">
      <mat-form-field appearance="outline" class="date-range-field" subscriptSizing="dynamic">
        <mat-label>{{ 'REPORTS.PERIOD' | translate }}</mat-label>
        <mat-date-range-input [formGroup]="range" [rangePicker]="picker">
          <input matStartDate formControlName="start" [placeholder]="'REPORTS.FROM' | translate" />
          <input matEndDate formControlName="end" [placeholder]="'REPORTS.TO' | translate" (dateChange)="emitRange()" />
        </mat-date-range-input>
        <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
        <mat-date-range-picker #picker></mat-date-range-picker>
      </mat-form-field>

      @for (preset of presets; track preset) {
        <button mat-stroked-button type="button" (click)="applyPreset(preset)">
          {{ 'REPORTS.PRESET_' + preset | translate }}
        </button>
      }

      @if (clearable) {
        <button mat-button type="button" (click)="clear()">{{ 'COMMON.CLEAR' | translate }}</button>
      }
    </div>
  `,
  styles: [`
    .date-range-filter {
      gap: 8px;
    }

    .date-range-field {
      min-width: 260px;
    }
  `],
})
export class DateRangeFilterComponent implements OnChanges {
  @Input() from?: string;
  @Input() to?: string;
  @Input() clearable = false;
  @Output() rangeChange = new EventEmitter<DateRange>();

  readonly presets = DATE_RANGE_PRESETS;
  readonly range = new FormGroup({
    start: new FormControl<Date | null>(null),
    end: new FormControl<Date | null>(null),
  });

  ngOnChanges(): void {
    this.range.setValue({
      start: fromIsoDate(this.from ?? null),
      end: fromIsoDate(this.to ?? null),
    }, { emitEvent: false });
  }

  applyPreset(preset: DateRangePreset): void {
    const { from, to } = presetRange(preset);
    this.range.setValue({ start: fromIsoDate(from), end: fromIsoDate(to) }, { emitEvent: false });
    this.rangeChange.emit({ from, to });
  }

  emitRange(): void {
    const { start, end } = this.range.value;
    if (!start || !end) {
      return;
    }

    this.rangeChange.emit({ from: toIsoDate(start), to: toIsoDate(end) });
  }

  clear(): void {
    this.range.reset({ start: null, end: null }, { emitEvent: false });
    this.rangeChange.emit({});
  }
}

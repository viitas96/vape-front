import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { TranslatePipe } from '@ngx-translate/core';
import { MaterialModule } from 'src/app/material.module';
import { toCents } from 'src/app/shared/money/money.util';

@Component({
  selector: 'app-shift-open-dialog',
  standalone: true,
  imports: [MaterialModule, ReactiveFormsModule, TranslatePipe],
  template: `
    <h2 mat-dialog-title>{{ 'SHIFTS.OPEN_TITLE' | translate }}</h2>

    <mat-dialog-content>
      <form [formGroup]="form" id="shift-open-form" (ngSubmit)="submit()" class="p-t-8">
        <mat-form-field appearance="outline" class="w-100">
          <mat-label>{{ 'SHIFTS.STARTING_CASH' | translate }}</mat-label>
          <input matInput formControlName="startingCash" type="number" min="0" step="0.01" placeholder="0.00" autofocus />
          <span matTextSuffix>MDL</span>
          <mat-hint>{{ 'SHIFTS.STARTING_CASH_HINT' | translate }}</mat-hint>
        </mat-form-field>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-stroked-button mat-dialog-close>{{ 'COMMON.CANCEL' | translate }}</button>
      <button mat-flat-button color="primary" form="shift-open-form" type="submit">
        {{ 'SHIFTS.OPEN' | translate }}
      </button>
    </mat-dialog-actions>
  `,
})
export class ShiftOpenDialogComponent {
  readonly form = new FormGroup({
    startingCash: new FormControl<number | null>(0, [Validators.required, Validators.min(0)]),
  });

  constructor(private readonly dialogRef: MatDialogRef<ShiftOpenDialogComponent, number>) {}

  submit(): void {
    if (this.form.invalid) {
      return;
    }

    this.dialogRef.close(toCents(this.form.controls.startingCash.value!));
  }
}

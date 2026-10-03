import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { TranslatePipe } from '@ngx-translate/core';
import { MaterialModule } from 'src/app/material.module';
import { toCents } from 'src/app/shared/money/money.util';

@Component({
  selector: 'app-shift-close-dialog',
  standalone: true,
  imports: [MaterialModule, ReactiveFormsModule, TranslatePipe],
  template: `
    <h2 mat-dialog-title>{{ 'SHIFTS.CLOSE_TITLE' | translate }}</h2>

    <mat-dialog-content>
      <p class="f-s-14 m-b-16">{{ 'SHIFTS.ACTUAL_CASH_HINT' | translate }}</p>

      <form [formGroup]="form" id="shift-close-form" (ngSubmit)="submit()">
        <mat-form-field appearance="outline" class="w-100">
          <mat-label>{{ 'SHIFTS.ACTUAL_CASH' | translate }}</mat-label>
          <input matInput formControlName="actualCash" type="number" min="0" step="0.01" placeholder="0.00" autofocus />
          <span matTextSuffix>MDL</span>
        </mat-form-field>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-stroked-button mat-dialog-close>{{ 'COMMON.CANCEL' | translate }}</button>
      <button mat-flat-button color="primary" form="shift-close-form" type="submit">
        {{ 'SHIFTS.CLOSE' | translate }}
      </button>
    </mat-dialog-actions>
  `,
})
export class ShiftCloseDialogComponent {
  readonly form = new FormGroup({
    actualCash: new FormControl<number | null>(null, [Validators.required, Validators.min(0)]),
  });

  constructor(private readonly dialogRef: MatDialogRef<ShiftCloseDialogComponent, number>) {}

  submit(): void {
    if (this.form.invalid) {
      return;
    }

    this.dialogRef.close(toCents(this.form.controls.actualCash.value!));
  }
}

import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { TranslatePipe } from '@ngx-translate/core';
import { MaterialModule } from 'src/app/material.module';
import { CashMovementDTO, CashMovementType } from 'src/app/features/shifts/shift.models';
import { toCents } from 'src/app/shared/money/money.util';

@Component({
  selector: 'app-cash-movement-dialog',
  standalone: true,
  imports: [MaterialModule, ReactiveFormsModule, TranslatePipe],
  template: `
    <h2 mat-dialog-title>{{ 'SHIFTS.CASH_MANAGEMENT' | translate }}</h2>

    <mat-dialog-content>
      <form [formGroup]="form" id="cash-movement-form" (ngSubmit)="submit()">
        <mat-button-toggle-group formControlName="type" class="w-100 m-b-16">
          <mat-button-toggle value="PAY_IN" class="w-100">
            <mat-icon>add</mat-icon> {{ 'SHIFTS.PAY_IN' | translate }}
          </mat-button-toggle>
          <mat-button-toggle value="PAY_OUT" class="w-100">
            <mat-icon>remove</mat-icon> {{ 'SHIFTS.PAY_OUT' | translate }}
          </mat-button-toggle>
        </mat-button-toggle-group>

        <mat-form-field appearance="outline" class="w-100">
          <mat-label>{{ 'SHIFTS.AMOUNT' | translate }}</mat-label>
          <input matInput formControlName="amount" type="number" min="0.01" step="0.01" placeholder="0.00" autofocus />
          <span matTextSuffix>MDL</span>
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-100">
          <mat-label>{{ 'SHIFTS.COMMENT' | translate }}</mat-label>
          <input matInput formControlName="comment" maxlength="255" />
        </mat-form-field>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-stroked-button mat-dialog-close>{{ 'COMMON.CANCEL' | translate }}</button>
      <button mat-flat-button color="primary" form="cash-movement-form" type="submit">
        {{ 'COMMON.APPLY' | translate }}
      </button>
    </mat-dialog-actions>
  `,
})
export class CashMovementDialogComponent {
  readonly form = new FormGroup({
    type: new FormControl<CashMovementType>('PAY_IN', [Validators.required]),
    amount: new FormControl<number | null>(null, [Validators.required, Validators.min(0.01)]),
    comment: new FormControl<string>('', [Validators.maxLength(255)]),
  });

  constructor(private readonly dialogRef: MatDialogRef<CashMovementDialogComponent, CashMovementDTO>) {}

  submit(): void {
    if (this.form.invalid) {
      return;
    }

    const comment = this.form.controls.comment.value?.trim();
    this.dialogRef.close({
      type: this.form.controls.type.value!,
      amount: toCents(this.form.controls.amount.value!),
      comment: comment ? comment : undefined,
    });
  }
}

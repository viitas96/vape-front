import { Component, Inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslatePipe } from '@ngx-translate/core';
import { MaterialModule } from 'src/app/material.module';
import { formatMdl, toCents } from 'src/app/shared/money/money.util';

export type PaymentChoice = 'CASH' | 'CARD' | 'SPLIT';

export interface PaymentDialogData {
  totalCents: number;
}

export interface PaymentDialogResult {
  cashAmount: number;
  cardAmount: number;
  changeCents: number;
}

@Component({
  selector: 'app-payment-dialog',
  standalone: true,
  imports: [MaterialModule, ReactiveFormsModule, TranslatePipe],
  template: `
    <h2 mat-dialog-title>{{ 'PAYMENT.TITLE' | translate }}</h2>

    <mat-dialog-content>
      <div class="d-flex justify-content-between f-s-18 f-w-700 m-b-16">
        <span>{{ 'PAYMENT.TO_PAY' | translate }}</span>
        <span>{{ format(data.totalCents) }}</span>
      </div>

      <form [formGroup]="form" id="payment-form" (ngSubmit)="submit()">
        <mat-button-toggle-group formControlName="method" class="w-100 m-b-16">
          <mat-button-toggle value="CASH" class="w-100">{{ 'PAYMENT.CASH' | translate }}</mat-button-toggle>
          <mat-button-toggle value="CARD" class="w-100">{{ 'PAYMENT.CARD' | translate }}</mat-button-toggle>
          <mat-button-toggle value="SPLIT" class="w-100">{{ 'PAYMENT.SPLIT' | translate }}</mat-button-toggle>
        </mat-button-toggle-group>

        @if (method === 'SPLIT') {
          <mat-form-field appearance="outline" class="w-100">
            <mat-label>{{ 'PAYMENT.CARD_AMOUNT' | translate }}</mat-label>
            <input matInput formControlName="cardAmount" type="number" min="0" step="0.01" placeholder="0.00" autofocus />
            <span matTextSuffix>MDL</span>
          </mat-form-field>

          @if (!splitValid) {
            <p class="text-danger f-s-12 m-b-16">{{ 'PAYMENT.MISMATCH' | translate }}</p>
          }
        }

        @if (takesCash) {
          <div class="d-flex justify-content-between f-s-14 m-b-12">
            <span>{{ 'PAYMENT.CASH_DUE' | translate }}</span>
            <strong>{{ format(cashDueCents) }}</strong>
          </div>

          <mat-form-field appearance="outline" class="w-100">
            <mat-label>{{ 'PAYMENT.TENDERED' | translate }}</mat-label>
            <input matInput formControlName="tendered" type="number" min="0" step="0.01" placeholder="0.00" />
            <span matTextSuffix>MDL</span>
            <mat-hint>{{ 'PAYMENT.TENDERED_HINT' | translate }}</mat-hint>
          </mat-form-field>

          <div class="d-flex gap-8 m-b-16">
            @for (amount of quickTenderCents; track amount) {
              <button mat-stroked-button type="button" class="f-s-12" (click)="setTendered(amount)">
                {{ format(amount) }}
              </button>
            }
          </div>

          @if (hasTendered) {
            @if (isShort) {
              <div class="d-flex justify-content-between f-s-16 f-w-700 text-danger">
                <span>{{ 'PAYMENT.MISSING' | translate }}</span>
                <span>{{ format(-changeCents) }}</span>
              </div>
            } @else {
              <div class="d-flex justify-content-between f-s-20 f-w-700 text-success">
                <span>{{ 'PAYMENT.CHANGE' | translate }}</span>
                <span>{{ format(changeCents) }}</span>
              </div>
            }
          }
        }
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-stroked-button mat-dialog-close>{{ 'COMMON.CANCEL' | translate }}</button>
      <button mat-flat-button color="primary" form="payment-form" type="submit" [disabled]="!canConfirm">
        {{ 'PAYMENT.CONFIRM' | translate }}
      </button>
    </mat-dialog-actions>
  `,
})
export class PaymentDialogComponent {
  readonly form = new FormGroup({
    method: new FormControl<PaymentChoice>('CASH'),
    cardAmount: new FormControl<number | null>(null),
    tendered: new FormControl<number | null>(null),
  });

  readonly quickTenderCents: number[];

  constructor(
    private readonly dialogRef: MatDialogRef<PaymentDialogComponent, PaymentDialogResult>,
    @Inject(MAT_DIALOG_DATA) public data: PaymentDialogData,
  ) {
    this.quickTenderCents = this.buildQuickTenders();
  }

  get method(): PaymentChoice {
    return this.form.controls.method.value ?? 'CASH';
  }

  get takesCash(): boolean {
    return this.method !== 'CARD';
  }

  get cardCents(): number {
    if (this.method === 'CARD') {
      return this.data.totalCents;
    }

    if (this.method === 'SPLIT') {
      return toCents(this.form.controls.cardAmount.value ?? 0);
    }

    return 0;
  }

  get cashDueCents(): number {
    return this.data.totalCents - this.cardCents;
  }

  get tenderedCents(): number {
    return toCents(this.form.controls.tendered.value ?? 0);
  }

  get hasTendered(): boolean {
    return this.tenderedCents > 0;
  }

  get changeCents(): number {
    if (!this.hasTendered) {
      return 0;
    }

    return this.tenderedCents - this.cashDueCents;
  }

  get isShort(): boolean {
    return this.hasTendered && this.changeCents < 0;
  }

  get splitValid(): boolean {
    if (this.method !== 'SPLIT') {
      return true;
    }

    return this.cardCents > 0 && this.cardCents < this.data.totalCents;
  }

  get canConfirm(): boolean {
    return this.splitValid && !this.isShort;
  }

  setTendered(cents: number): void {
    this.form.controls.tendered.setValue(cents / 100);
  }

  format(cents: number): string {
    return formatMdl(cents);
  }

  submit(): void {
    if (!this.canConfirm) {
      return;
    }

    this.dialogRef.close({
      cashAmount: this.cashDueCents,
      cardAmount: this.cardCents,
      changeCents: Math.max(0, this.changeCents),
    });
  }

  private buildQuickTenders(): number[] {
    const notes = [5000, 10000, 20000, 50000, 100000];
    const exact = this.data.totalCents;
    const suggestions = notes.filter((note) => note > exact).slice(0, 3);

    return [exact, ...suggestions];
  }
}

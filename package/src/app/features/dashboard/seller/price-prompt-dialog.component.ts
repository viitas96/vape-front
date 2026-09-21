import { Component, Inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslatePipe } from '@ngx-translate/core';
import { MaterialModule } from 'src/app/material.module';

export interface PricePromptDialogData {
  productName: string;
}

@Component({
  selector: 'app-price-prompt-dialog',
  standalone: true,
  imports: [MaterialModule, ReactiveFormsModule, TranslatePipe],
  template: `
    <h2 mat-dialog-title>{{ 'POS.PRICE_PROMPT_TITLE' | translate }}</h2>

    <mat-dialog-content>
      <p class="f-s-14 m-b-16">{{ 'POS.PRICE_PROMPT_MESSAGE' | translate:{ name: data.productName } }}</p>

      <form [formGroup]="form" id="price-prompt-form" (ngSubmit)="submit()">
        <mat-form-field appearance="outline" class="w-100">
          <mat-label>{{ 'PRODUCTS.PRICE' | translate }}</mat-label>
          <input matInput formControlName="price" type="number" min="0" step="0.01" placeholder="0.00" autofocus />
          <mat-error>{{ 'PRODUCTS.PRICE_INVALID' | translate }}</mat-error>
        </mat-form-field>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-stroked-button mat-dialog-close>{{ 'COMMON.CANCEL' | translate }}</button>
      <button mat-flat-button color="primary" form="price-prompt-form" type="submit">
        {{ 'COMMON.APPLY' | translate }}
      </button>
    </mat-dialog-actions>
  `,
})
export class PricePromptDialogComponent {
  form = new FormGroup({
    price: new FormControl<number | null>(null, [Validators.required, Validators.min(0)]),
  });

  constructor(
    private readonly dialogRef: MatDialogRef<PricePromptDialogComponent, number>,
    @Inject(MAT_DIALOG_DATA) public data: PricePromptDialogData,
  ) {}

  submit(): void {
    if (this.form.invalid) {
      return;
    }

    this.dialogRef.close(Math.round(this.form.controls.price.value! * 100));
  }
}

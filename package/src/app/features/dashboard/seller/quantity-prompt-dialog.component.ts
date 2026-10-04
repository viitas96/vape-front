import { AfterViewInit, Component, ElementRef, Inject, ViewChild } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslatePipe } from '@ngx-translate/core';
import { MaterialModule } from 'src/app/material.module';
import { Product } from 'src/app/features/products/product.models';
import { formatMdl, toCents, toMdl } from 'src/app/shared/money/money.util';

export interface QuantityPromptDialogData {
  product: Product;
}

export interface QuantityPromptResult {
  quantity: number;
  unitPrice: number;
}

const MAX_QUANTITY = 999;
const CONTROL_KEYS = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter', 'Escape', 'Home', 'End'];

@Component({
  selector: 'app-quantity-prompt-dialog',
  standalone: true,
  imports: [MaterialModule, ReactiveFormsModule, TranslatePipe],
  template: `
    <h2 mat-dialog-title>{{ data.product.name }}</h2>

    <mat-dialog-content>
      <form [formGroup]="form" id="quantity-prompt-form" (ngSubmit)="submit()" class="p-t-8">
        <mat-form-field appearance="outline" class="w-100">
          <mat-label>{{ 'POS.QUANTITY' | translate }}</mat-label>
          <input
            matInput
            #quantityInput
            formControlName="quantity"
            inputmode="numeric"
            maxlength="3"
            autocomplete="off"
            (keydown)="onlyDigits($event)"
            (input)="sanitize()"
          />
          <mat-hint>{{ 'POS.QUANTITY_HINT' | translate }}</mat-hint>
        </mat-form-field>

        @if (hasOwnPrice) {
          <div class="d-flex justify-content-between f-s-14 m-t-8">
            <span>{{ 'PRODUCTS.PRICE' | translate }}</span>
            <strong>{{ format(data.product.price!) }}</strong>
          </div>
        } @else {
          <mat-form-field appearance="outline" class="w-100 m-t-8">
            <mat-label>{{ 'PRODUCTS.PRICE' | translate }}</mat-label>
            <input matInput formControlName="price" type="number" min="0" step="0.01" placeholder="0.00" />
            <span matTextSuffix>MDL</span>
            @if (suggestedPriceMdl !== null) {
              <mat-hint>{{ 'POS.PICKER_GAMMA_PRICE' | translate }}</mat-hint>
            }
            <mat-error>{{ 'PRODUCTS.PRICE_INVALID' | translate }}</mat-error>
          </mat-form-field>
        }

        <div class="d-flex justify-content-between f-s-16 f-w-700 m-t-16">
          <span>{{ 'POS.TOTAL' | translate }}</span>
          <span>{{ format(lineTotal) }}</span>
        </div>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-stroked-button mat-dialog-close>{{ 'COMMON.CANCEL' | translate }} (Esc)</button>
      <button mat-flat-button color="primary" form="quantity-prompt-form" type="submit" [disabled]="form.invalid">
        <mat-icon>add_shopping_cart</mat-icon>
        {{ 'POS.PICKER_ADD' | translate }} (Enter)
      </button>
    </mat-dialog-actions>
  `,
})
export class QuantityPromptDialogComponent implements AfterViewInit {
  @ViewChild('quantityInput') quantityInput?: ElementRef<HTMLInputElement>;

  readonly form = new FormGroup({
    quantity: new FormControl('1', [Validators.required, Validators.pattern(/^[1-9]\d{0,2}$/)]),
    price: new FormControl<number | null>(null, [Validators.min(0)]),
  });

  constructor(
    private readonly dialogRef: MatDialogRef<QuantityPromptDialogComponent, QuantityPromptResult>,
    @Inject(MAT_DIALOG_DATA) public data: QuantityPromptDialogData,
  ) {
    if (!this.hasOwnPrice) {
      this.form.controls.price.setValue(this.suggestedPriceMdl);
      this.form.controls.price.addValidators(Validators.required);
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.quantityInput?.nativeElement.select());
  }

  get hasOwnPrice(): boolean {
    return this.data.product.price !== null && this.data.product.price !== undefined;
  }

  get suggestedPriceMdl(): number | null {
    const gammaPrice = this.data.product.gamma?.price;
    if (gammaPrice === null || gammaPrice === undefined) {
      return null;
    }

    return toMdl(gammaPrice);
  }

  get quantity(): number {
    return Math.min(MAX_QUANTITY, Number.parseInt(this.form.controls.quantity.value ?? '', 10) || 0);
  }

  get unitPrice(): number {
    if (this.hasOwnPrice) {
      return this.data.product.price!;
    }

    return toCents(this.form.controls.price.value ?? 0);
  }

  get lineTotal(): number {
    return this.unitPrice * this.quantity;
  }

  format(cents: number): string {
    return formatMdl(cents);
  }

  onlyDigits(event: KeyboardEvent): void {
    if (CONTROL_KEYS.includes(event.key) || event.ctrlKey || event.metaKey) {
      return;
    }

    if (!/^\d$/.test(event.key)) {
      event.preventDefault();
    }
  }

  sanitize(): void {
    const control = this.form.controls.quantity;
    const digits = (control.value ?? '').replace(/\D/g, '');
    if (digits !== control.value) {
      control.setValue(digits);
    }
  }

  submit(): void {
    if (this.form.invalid || this.quantity < 1) {
      return;
    }

    this.dialogRef.close({ quantity: this.quantity, unitPrice: this.unitPrice });
  }
}

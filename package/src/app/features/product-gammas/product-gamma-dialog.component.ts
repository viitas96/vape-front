import { Component, Inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslatePipe } from '@ngx-translate/core';
import { MaterialModule } from 'src/app/material.module';
import { ProductGroupCategory } from '../product-group-categories/product-group-category.models';
import { ProductGamma, ProductGammaDTO } from './product-gamma.models';

export interface ProductGammaDialogData {
  gamma: ProductGamma | null;
  categories: ProductGroupCategory[];
}

@Component({
  selector: 'app-product-gamma-dialog',
  standalone: true,
  imports: [MaterialModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './product-gamma-dialog.component.html',
})
export class ProductGammaDialogComponent {
  form = new FormGroup({
    name: new FormControl('', [Validators.required]),
    noPrice: new FormControl<boolean>(false, { nonNullable: true }),
    price: new FormControl<number | null>(null, [Validators.required, Validators.min(0)]),
    categoryId: new FormControl<number | null>(null),
  });

  constructor(
    public dialogRef: MatDialogRef<ProductGammaDialogComponent, ProductGammaDTO>,
    @Inject(MAT_DIALOG_DATA) public data: ProductGammaDialogData,
  ) {
    this.form.controls.noPrice.valueChanges.subscribe((noPrice) => this.applyNoPrice(noPrice));

    if (data.gamma) {
      const hasPrice = data.gamma.price !== null && data.gamma.price !== undefined;
      this.form.setValue({
        name: data.gamma.name,
        noPrice: !hasPrice,
        price: hasPrice ? data.gamma.price! / 100 : null,
        categoryId: data.gamma.category?.id ?? null,
      });
    }
  }

  get f() {
    return this.form.controls;
  }

  get isEdit(): boolean {
    return this.data.gamma !== null;
  }

  submit(): void {
    if (this.form.invalid) {
      return;
    }

    this.dialogRef.close({
      name: this.f.name.value!,
      price: this.resolvePrice(),
      categoryId: this.f.categoryId.value ?? undefined,
    });
  }

  private applyNoPrice(noPrice: boolean): void {
    if (noPrice) {
      this.f.price.reset(null);
      this.f.price.clearValidators();
      this.f.price.disable();
    } else {
      this.f.price.setValidators([Validators.required, Validators.min(0)]);
      this.f.price.enable();
    }

    this.f.price.updateValueAndValidity();
  }

  private resolvePrice(): number | undefined {
    if (this.f.noPrice.value || this.f.price.value === null) {
      return undefined;
    }

    return Math.round(this.f.price.value * 100);
  }
}

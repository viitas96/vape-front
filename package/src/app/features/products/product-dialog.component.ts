import { Component, Inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MaterialModule } from 'src/app/material.module';
import { Product, ProductDTO } from './product.models';
import { ProductGroupCategory } from '../product-group-categories/product-group-category.models';
import { ProductGamma } from '../product-gammas/product-gamma.models';
import { Brand } from '../brands/brand.models';
import { TranslatePipe } from '@ngx-translate/core';

export interface ProductDialogData {
  product: Product | null;
  categories: ProductGroupCategory[];
  gammas: ProductGamma[];
  brands: Brand[];
  initialCategoryId?: number | null;
  initialGammaId?: number | null;
}

@Component({
  selector: 'app-product-dialog',
  standalone: true,
  imports: [MaterialModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './product-dialog.component.html',
  styleUrls: ['./product-dialog.component.scss'],
})
export class ProductDialogComponent {
  form = new FormGroup({
    name: new FormControl('', [Validators.required]),
    noPrice: new FormControl<boolean>(false, { nonNullable: true }),
    price: new FormControl<number | null>(null, [Validators.required, Validators.min(0)]),
    costPrice: new FormControl<number | null>(null, [Validators.min(0)]),
    vatRate: new FormControl<number | null>(null, [Validators.min(0), Validators.max(100)]),
    stock: new FormControl<number | null>(null, [Validators.min(0)]),
    itemCode: new FormControl(''),
    barcode: new FormControl(''),
    matrixBarcode: new FormControl(''),
    qrCode: new FormControl(''),
    categoryId: new FormControl<number | null>(null),
    gammaId: new FormControl<number | null>(null),
    brandId: new FormControl<number | null>(null),
    drinkStampEligible: new FormControl<boolean>(false, { nonNullable: true }),
  });

  constructor(
    public dialogRef: MatDialogRef<ProductDialogComponent, ProductDTO>,
    @Inject(MAT_DIALOG_DATA) public data: ProductDialogData,
  ) {
    this.form.controls.noPrice.valueChanges.subscribe((noPrice) => this.applyNoPrice(noPrice));

    if (data.product) {
      this.form.setValue({
        name: data.product.name,
        noPrice: data.product.price === null || data.product.price === undefined,
        price: this.toMajorUnits(data.product.price),
        costPrice: this.toMajorUnits(data.product.costPrice),
        vatRate: data.product.vatRate ?? null,
        stock: data.product.stock ?? null,
        itemCode: data.product.itemCode ?? '',
        barcode: data.product.barcode ?? '',
        matrixBarcode: data.product.matrixBarcode ?? '',
        qrCode: data.product.qrCode ?? '',
        categoryId: data.product.category?.id ?? null,
        gammaId: data.product.gamma?.id ?? null,
        brandId: data.product.brand?.id ?? null,
        drinkStampEligible: data.product.drinkStampEligible ?? false,
      });
      return;
    }

    const categoryId = this.getExistingId(data.initialCategoryId, data.categories);
    const gammaId = this.getExistingId(data.initialGammaId, data.gammas);
    this.form.patchValue({ categoryId, gammaId });
    this.onGammaSelected(gammaId);
  }

  get f() {
    return this.form.controls;
  }

  get isEdit(): boolean {
    return this.data.product !== null;
  }

  submit(): void {
    if (this.form.invalid) return;
    this.dialogRef.close({
      name: this.f.name.value!,
      price: this.resolvePrice(),
      costPrice: this.toMinorUnits(this.f.costPrice.value),
      vatRate: this.f.vatRate.value ?? undefined,
      stock: this.f.stock.value ?? undefined,
      itemCode: this.f.itemCode.value || undefined,
      barcode: this.f.barcode.value || undefined,
      matrixBarcode: this.f.matrixBarcode.value || undefined,
      qrCode: this.f.qrCode.value || undefined,
      categoryId: this.f.categoryId.value ?? undefined,
      gammaId: this.f.gammaId.value ?? undefined,
      brandId: this.f.brandId.value ?? undefined,
      drinkStampEligible: this.f.drinkStampEligible.value,
    });
  }

  // the gamma fills in the price and the category only where they are still empty; typed-in values are never overwritten
  onGammaSelected(gammaId: number | null): void {
    if (gammaId === null) {
      return;
    }

    const gamma = this.data.gammas.find((existingGamma) => existingGamma.id === gammaId);
    if (!gamma) {
      return;
    }

    if (!this.hasPrice && !this.f.noPrice.value && gamma.price !== null && gamma.price !== undefined) {
      this.f.price.setValue(gamma.price / 100);
    }

    if (this.f.categoryId.value === null && gamma.category) {
      this.f.categoryId.setValue(gamma.category.id);
    }
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

  private get hasPrice(): boolean {
    const price = this.f.price.value;

    return price !== null && price !== undefined;
  }

  private toMinorUnits(amount: number | null): number | undefined {
    if (amount === null || amount === undefined) {
      return undefined;
    }

    return Math.round(amount * 100);
  }

  private toMajorUnits(price: number | null | undefined): number | null {
    if (price === null || price === undefined) {
      return null;
    }

    return price / 100;
  }

  private getExistingId<T extends { id: number }>(id: number | null | undefined, options: readonly T[]): number | null {
    if (id === null || id === undefined) {
      return null;
    }

    if (options.some((option) => option.id === id)) {
      return id;
    }

    return null;
  }
}

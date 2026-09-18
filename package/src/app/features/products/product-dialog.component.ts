import { Component, Inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MaterialModule } from 'src/app/material.module';
import { Product, ProductDTO } from './product.models';
import { ProductGroup } from '../product-groups/product-group.models';
import { ProductGamma } from '../product-gammas/product-gamma.models';
import { TranslatePipe } from '@ngx-translate/core';

export interface ProductDialogData {
  product: Product | null;
  groups: ProductGroup[];
  gammas: ProductGamma[];
  initialGroupId?: number | null;
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
    price: new FormControl<number | null>(null, [Validators.required, Validators.min(0)]),
    itemCode: new FormControl(''),
    barcode: new FormControl(''),
    matrixBarcode: new FormControl(''),
    qrCode: new FormControl(''),
    groupId: new FormControl<number | null>(null),
    gammaId: new FormControl<number | null>(null),
  });

  constructor(
    public dialogRef: MatDialogRef<ProductDialogComponent, ProductDTO>,
    @Inject(MAT_DIALOG_DATA) public data: ProductDialogData,
  ) {
    if (data.product) {
      this.form.setValue({
        name: data.product.name,
        price: data.product.price / 100,
        itemCode: data.product.itemCode ?? '',
        barcode: data.product.barcode ?? '',
        matrixBarcode: data.product.matrixBarcode ?? '',
        qrCode: data.product.qrCode ?? '',
        groupId: data.product.group?.id ?? null,
        gammaId: data.product.gamma?.id ?? null,
      });
      return;
    }

    const groupId = this.getExistingId(data.initialGroupId, data.groups);
    const gammaId = this.getExistingId(data.initialGammaId, data.gammas);
    this.form.patchValue({ groupId, gammaId });
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
      price: Math.round(this.f.price.value! * 100),
      itemCode: this.f.itemCode.value || undefined,
      barcode: this.f.barcode.value || undefined,
      matrixBarcode: this.f.matrixBarcode.value || undefined,
      qrCode: this.f.qrCode.value || undefined,
      groupId: this.f.groupId.value ?? undefined,
      gammaId: this.f.gammaId.value ?? undefined,
    });
  }

  onGammaSelected(gammaId: number | null): void {
    if (this.isEdit || gammaId === null) {
      return;
    }

    const gamma = this.data.gammas.find((existingGamma) => existingGamma.id === gammaId);
    if (gamma) {
      this.form.controls.price.setValue(gamma.price / 100);
    }
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

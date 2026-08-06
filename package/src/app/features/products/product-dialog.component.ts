import { Component, Inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MaterialModule } from 'src/app/material.module';
import { Product, ProductDTO } from './product.models';
import { ProductGroup } from '../product-groups/product-group.models';
import { TranslatePipe } from '@ngx-translate/core';

export interface ProductDialogData {
  product: Product | null;
  groups: ProductGroup[];
}

@Component({
  selector: 'app-product-dialog',
  standalone: true,
  imports: [MaterialModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './product-dialog.component.html',
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
      });
    }
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
    });
  }
}

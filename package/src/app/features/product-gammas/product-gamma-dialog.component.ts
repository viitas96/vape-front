import { Component, Inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslatePipe } from '@ngx-translate/core';
import { MaterialModule } from 'src/app/material.module';
import { ProductGamma, ProductGammaDTO } from './product-gamma.models';

export interface ProductGammaDialogData {
  gamma: ProductGamma | null;
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
    price: new FormControl<number | null>(null, [Validators.required, Validators.min(0)]),
  });

  constructor(
    public dialogRef: MatDialogRef<ProductGammaDialogComponent, ProductGammaDTO>,
    @Inject(MAT_DIALOG_DATA) public data: ProductGammaDialogData,
  ) {
    if (data.gamma) {
      this.form.setValue({ name: data.gamma.name, price: data.gamma.price / 100 });
    }
  }

  get isEdit(): boolean {
    return this.data.gamma !== null;
  }

  submit(): void {
    if (this.form.invalid) {
      return;
    }

    const { name, price } = this.form.value;
    this.dialogRef.close({ name: name!, price: Math.round(price! * 100) });
  }
}

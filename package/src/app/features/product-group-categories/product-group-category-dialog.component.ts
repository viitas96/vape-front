import { Component, Inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslatePipe } from '@ngx-translate/core';
import { MaterialModule } from 'src/app/material.module';
import { ProductGroupCategory, ProductGroupCategoryDTO } from './product-group-category.models';

export interface ProductGroupCategoryDialogData {
  category: ProductGroupCategory | null;
}

@Component({
  selector: 'app-product-group-category-dialog',
  standalone: true,
  imports: [MaterialModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './product-group-category-dialog.component.html',
})
export class ProductGroupCategoryDialogComponent {
  // systemName removed from the UI (kept on the model/backend for future use).
  form = new FormGroup({
    name: new FormControl('', [Validators.required]),
  });

  constructor(
    public dialogRef: MatDialogRef<ProductGroupCategoryDialogComponent, ProductGroupCategoryDTO>,
    @Inject(MAT_DIALOG_DATA) public data: ProductGroupCategoryDialogData,
  ) {
    if (data.category) {
      this.form.setValue({ name: data.category.name });
    }
  }

  get isEdit(): boolean {
    return this.data.category !== null;
  }

  submit(): void {
    if (this.form.invalid) {
      return;
    }

    const { name } = this.form.value;
    this.dialogRef.close({ name: name!, systemName: this.data.category?.systemName });
  }
}

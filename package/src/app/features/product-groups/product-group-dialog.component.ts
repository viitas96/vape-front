import { Component, Inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MaterialModule } from 'src/app/material.module';
import { TranslatePipe } from '@ngx-translate/core';
import { ProductGroup, ProductGroupCategory, ProductGroupDTO } from './product-group.models';

export interface ProductGroupDialogData {
  group: ProductGroup | null;
  categories: ProductGroupCategory[];
}

@Component({
  selector: 'app-product-group-dialog',
  standalone: true,
  imports: [MaterialModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './product-group-dialog.component.html',
})
export class ProductGroupDialogComponent {
  form = new FormGroup({
    name: new FormControl('', [Validators.required]),
    categoryId: new FormControl<number | null>(null, [Validators.required]),
  });

  constructor(
    public dialogRef: MatDialogRef<ProductGroupDialogComponent, ProductGroupDTO>,
    @Inject(MAT_DIALOG_DATA) public data: ProductGroupDialogData,
  ) {
    if (data.group) {
      this.form.setValue({ name: data.group.name, categoryId: data.group.category.id });
      return;
    }

    if (data.categories.length) {
      this.form.controls.categoryId.setValue(data.categories[0].id);
    }
  }

  get isEdit(): boolean {
    return this.data.group !== null;
  }

  submit(): void {
    if (this.form.invalid) {
      return;
    }

    const { name, categoryId } = this.form.value;
    this.dialogRef.close({ name: name!, categoryId: categoryId! });
  }
}

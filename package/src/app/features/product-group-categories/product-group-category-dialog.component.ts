import { Component, Inject, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslatePipe } from '@ngx-translate/core';
import { MaterialModule } from 'src/app/material.module';
import { CategoryIconComponent } from './category-icon.component';
import {
  CATEGORY_ICON_MAX_BYTES,
  CATEGORY_ICON_TYPES,
  ProductGroupCategory,
  ProductGroupCategoryDialogResult,
} from './product-group-category.models';

export interface ProductGroupCategoryDialogData {
  category: ProductGroupCategory | null;
}

@Component({
  selector: 'app-product-group-category-dialog',
  standalone: true,
  imports: [MaterialModule, ReactiveFormsModule, TranslatePipe, CategoryIconComponent],
  templateUrl: './product-group-category-dialog.component.html',
})
export class ProductGroupCategoryDialogComponent implements OnDestroy {
  // systemName removed from the UI (kept on the model/backend for future use).
  form = new FormGroup({
    name: new FormControl('', [Validators.required]),
  });

  readonly acceptedIconTypes = CATEGORY_ICON_TYPES.join(',');

  iconFile: File | null = null;
  previewUrl: string | null = null;
  removeIcon = false;
  iconError = '';

  constructor(
    public dialogRef: MatDialogRef<ProductGroupCategoryDialogComponent, ProductGroupCategoryDialogResult>,
    @Inject(MAT_DIALOG_DATA) public data: ProductGroupCategoryDialogData,
  ) {
    if (data.category) {
      this.form.setValue({ name: data.category.name });
    }
  }

  get isEdit(): boolean {
    return this.data.category !== null;
  }

  get previewCategory(): ProductGroupCategory {
    const name = this.form.value.name || this.data.category?.name || '';
    const iconVersion = this.removeIcon ? null : this.data.category?.iconVersion;
    return { id: this.data.category?.id ?? 0, name, iconVersion };
  }

  get hasIcon(): boolean {
    return this.iconFile !== null || (!this.removeIcon && !!this.data.category?.iconVersion);
  }

  onIconSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.item(0) ?? null;
    input.value = '';
    if (!file) {
      return;
    }

    this.iconError = '';
    if (!CATEGORY_ICON_TYPES.includes(file.type)) {
      this.iconError = 'CATEGORIES.ICON_INVALID_TYPE';
      return;
    }

    if (file.size > CATEGORY_ICON_MAX_BYTES) {
      this.iconError = 'CATEGORIES.ICON_TOO_LARGE';
      return;
    }

    this.revokePreview();
    this.iconFile = file;
    this.previewUrl = URL.createObjectURL(file);
    this.removeIcon = false;
  }

  clearIcon(): void {
    this.revokePreview();
    this.iconFile = null;
    this.iconError = '';
    this.removeIcon = !!this.data.category?.iconVersion;
  }

  submit(): void {
    if (this.form.invalid) {
      return;
    }

    const { name } = this.form.value;
    this.dialogRef.close({
      dto: { name: name!, systemName: this.data.category?.systemName },
      icon: this.iconFile,
      removeIcon: this.removeIcon,
    });
  }

  ngOnDestroy(): void {
    this.revokePreview();
  }

  private revokePreview(): void {
    if (this.previewUrl) {
      URL.revokeObjectURL(this.previewUrl);
      this.previewUrl = null;
    }
  }
}

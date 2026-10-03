import { Component, Inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslatePipe } from '@ngx-translate/core';
import { MaterialModule } from 'src/app/material.module';
import { Brand, BrandDTO } from './brand.models';

export interface BrandDialogData {
  brand: Brand | null;
}

@Component({
  selector: 'app-brand-dialog',
  standalone: true,
  imports: [MaterialModule, ReactiveFormsModule, TranslatePipe],
  template: `
    <h2 mat-dialog-title>{{ (isEdit ? 'BRANDS.EDIT_TITLE' : 'BRANDS.ADD') | translate }}</h2>

    <mat-dialog-content>
      <form [formGroup]="form" id="brand-form" (ngSubmit)="submit()" class="p-t-8">
        <mat-form-field appearance="outline" class="w-100">
          <mat-label>{{ 'PRODUCTS.NAME' | translate }}</mat-label>
          <input matInput formControlName="name" maxlength="255" autofocus />
          <mat-error>{{ 'BRANDS.NAME_REQUIRED' | translate }}</mat-error>
        </mat-form-field>

        @if (isEdit) {
          <mat-checkbox formControlName="active">{{ 'BRANDS.ACTIVE' | translate }}</mat-checkbox>
        }
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-stroked-button mat-dialog-close>{{ 'COMMON.CANCEL' | translate }}</button>
      <button mat-flat-button color="primary" form="brand-form" type="submit">
        {{ 'COMMON.SAVE' | translate }}
      </button>
    </mat-dialog-actions>
  `,
})
export class BrandDialogComponent {
  readonly form = new FormGroup({
    name: new FormControl('', [Validators.required]),
    active: new FormControl<boolean>(true, { nonNullable: true }),
  });

  constructor(
    private readonly dialogRef: MatDialogRef<BrandDialogComponent, BrandDTO>,
    @Inject(MAT_DIALOG_DATA) public data: BrandDialogData,
  ) {
    if (data.brand) {
      this.form.setValue({ name: data.brand.name, active: data.brand.active });
    }
  }

  get isEdit(): boolean {
    return this.data.brand !== null;
  }

  submit(): void {
    if (this.form.invalid) {
      return;
    }

    this.dialogRef.close({
      name: this.form.controls.name.value!,
      active: this.form.controls.active.value,
    });
  }
}

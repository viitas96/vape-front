import { Component, Inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { MaterialModule } from 'src/app/material.module';
import { AdminService } from 'src/app/services/admin.service';
import { getApiErrorMessage } from 'src/app/shared/http/api-error';
import { UserResponse } from '../users/user.models';
import { fromIsoDate, minimumBirthDate, toIsoDate } from 'src/app/shared/date/date.util';
import { PhoneInputDirective } from 'src/app/shared/phone/phone-input.directive';

@Component({
  selector: 'app-edit-customer-dialog',
  standalone: true,
  imports: [MaterialModule, ReactiveFormsModule, TranslatePipe, PhoneInputDirective],
  template: `
    <h2 mat-dialog-title>{{ 'CUSTOMERS.EDIT' | translate }}</h2>

    <mat-dialog-content style="padding-bottom: 24px;">
      <form [formGroup]="form" id="editCustomerForm" (ngSubmit)="submit()">

        <mat-label class="f-s-14 f-w-600 m-b-12 d-block">{{ 'AUTH.COMMON.EMAIL' | translate }}</mat-label>
        <mat-form-field appearance="outline" class="w-100">
          <input matInput formControlName="email" type="email" [placeholder]="'USERS.EMAIL_PLACEHOLDER' | translate" />
          <mat-error>{{ 'AUTH.LOGIN.INVALID_EMAIL' | translate }}</mat-error>
        </mat-form-field>

        <mat-label class="f-s-14 f-w-600 m-b-12 d-block">{{ 'CUSTOMERS.FIRST_NAME' | translate }}</mat-label>
        <mat-form-field appearance="outline" class="w-100">
          <input matInput formControlName="firstName" [placeholder]="'CUSTOMERS.FIRST_NAME_PLACEHOLDER' | translate" />
          <mat-error>{{ 'CUSTOMERS.FIRST_NAME_REQUIRED' | translate }}</mat-error>
        </mat-form-field>

        <mat-label class="f-s-14 f-w-600 m-b-12 d-block">{{ 'CUSTOMERS.LAST_NAME' | translate }}</mat-label>
        <mat-form-field appearance="outline" class="w-100">
          <input matInput formControlName="lastName" [placeholder]="'CUSTOMERS.LAST_NAME_PLACEHOLDER' | translate" />
          <mat-error>{{ 'CUSTOMERS.LAST_NAME_REQUIRED' | translate }}</mat-error>
        </mat-form-field>

        <mat-label class="f-s-14 f-w-600 m-b-12 d-block">{{ 'CUSTOMERS.PHONE' | translate }}</mat-label>
        <mat-form-field appearance="outline" class="w-100">
          <input matInput appPhoneInput formControlName="phone" type="tel" inputmode="tel" autocomplete="tel" maxlength="20"
                 [placeholder]="'CUSTOMERS.PHONE_PLACEHOLDER' | translate" />
          <mat-icon matPrefix class="f-s-18 m-r-8">phone</mat-icon>
          <mat-hint>{{ 'CUSTOMERS.PHONE_HINT' | translate }}</mat-hint>
          <mat-error>{{ 'CUSTOMERS.PHONE_INVALID' | translate }}</mat-error>
        </mat-form-field>

        <mat-label class="f-s-14 f-w-600 m-b-12 d-block">{{ 'AUTH.REGISTER.DATE_OF_BIRTH' | translate }}</mat-label>
        <mat-form-field appearance="outline" class="w-100">
          <input matInput formControlName="dateOfBirth" [matDatepicker]="dateOfBirthPicker" [max]="maxBirthDate"
                 [placeholder]="'COMMON.DATE_FORMAT_HINT' | translate" />
          <mat-datepicker-toggle matIconSuffix [for]="dateOfBirthPicker"></mat-datepicker-toggle>
          <mat-datepicker #dateOfBirthPicker startView="multi-year"></mat-datepicker>
          <mat-hint>{{ 'COMMON.DATE_FORMAT_HINT' | translate }}</mat-hint>
          <mat-error>{{ 'AUTH.REGISTER.DATE_OF_BIRTH_REQUIRED' | translate }}</mat-error>
        </mat-form-field>

        @if (errorMessage) {
          <p class="text-danger f-s-14">{{ errorMessage }}</p>
        }

      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end" style="padding: 16px 24px;">
      <button mat-stroked-button mat-dialog-close>{{ 'COMMON.CANCEL' | translate }}</button>
      <button mat-flat-button color="primary" type="submit" form="editCustomerForm" [disabled]="loading">
        {{ loading ? ('COMMON.SAVING' | translate) : ('COMMON.SAVE' | translate) }}
      </button>
    </mat-dialog-actions>
  `,
})
export class EditCustomerDialogComponent {
  errorMessage = '';
  loading = false;
  readonly maxBirthDate = minimumBirthDate(18);

  form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    firstName: new FormControl('', [Validators.required, Validators.maxLength(64)]),
    lastName: new FormControl('', [Validators.required, Validators.maxLength(64)]),
    phone: new FormControl('', [Validators.required, Validators.pattern(/^\+?[0-9]{6,20}$/)]),
    dateOfBirth: new FormControl<Date | null>(null, [Validators.required]),
  });

  constructor(
    private readonly adminService: AdminService,
    private readonly dialogRef: MatDialogRef<EditCustomerDialogComponent, boolean>,
    private readonly translateService: TranslateService,
    @Inject(MAT_DIALOG_DATA) public customer: UserResponse,
  ) {
    this.form.patchValue({
      email: customer.email,
      firstName: customer.firstName ?? '',
      lastName: customer.lastName ?? '',
      phone: customer.phone ?? '',
      dateOfBirth: fromIsoDate(customer.dateOfBirth),
    });
  }

  submit(): void {
    if (this.form.invalid) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.adminService.updateCustomer(this.customer.id, {
      email: this.form.controls.email.value!,
      firstName: this.form.controls.firstName.value!,
      lastName: this.form.controls.lastName.value!,
      phone: this.form.controls.phone.value!,
      dateOfBirth: toIsoDate(this.form.controls.dateOfBirth.value),
    }).subscribe({
      next: () => this.dialogRef.close(true),
      error: (error) => {
        this.errorMessage = getApiErrorMessage(
          error,
          this.translateService.instant('CUSTOMERS.UPDATE_FAILED'),
        );
        this.loading = false;
      },
    });
  }
}

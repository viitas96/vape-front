import { Component, Inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MaterialModule } from 'src/app/material.module';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AdminService } from 'src/app/services/admin.service';
import { UserResponse } from './user.models';

@Component({
  selector: 'app-change-password-dialog',
  standalone: true,
  imports: [MaterialModule, ReactiveFormsModule, TranslatePipe],
  template: `
    <h2 mat-dialog-title>{{ 'USERS.CHANGE_PASSWORD' | translate }}</h2>

    <mat-dialog-content>
      <form [formGroup]="form" id="change-password-form" (ngSubmit)="submit()" class="p-t-8">
        <p class="f-s-14 m-b-16">{{ 'USERS.USER' | translate }}: <strong>{{ data.user.email }}</strong></p>

        <mat-label class="f-s-14 f-w-600 m-b-12 d-block">{{ 'USERS.NEW_PASSWORD' | translate }}</mat-label>
        <mat-form-field appearance="outline" class="w-100">
          <input matInput formControlName="newPassword" type="password" [placeholder]="'USERS.PASSWORD_PLACEHOLDER' | translate" />
          <mat-error>{{ 'AUTH.REGISTER.PASSWORD_LENGTH' | translate }}</mat-error>
        </mat-form-field>

        @if (errorMessage) {
          <p class="text-danger f-s-14">{{ errorMessage }}</p>
        }
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-stroked-button mat-dialog-close>{{ 'COMMON.CANCEL' | translate }}</button>
      <button mat-flat-button color="primary" form="change-password-form" type="submit" [disabled]="loading">
        {{ loading ? ('USERS.SAVING' | translate) : ('COMMON.SAVE' | translate) }}
      </button>
    </mat-dialog-actions>
  `,
})
export class ChangePasswordDialogComponent {
  errorMessage = '';
  loading = false;

  form = new FormGroup({
    newPassword: new FormControl('', [Validators.required, Validators.minLength(6)]),
  });

  constructor(
    private adminService: AdminService,
    private dialogRef: MatDialogRef<ChangePasswordDialogComponent>,
    private translateService: TranslateService,
    @Inject(MAT_DIALOG_DATA) public data: { user: UserResponse },
  ) {}

  submit(): void {
    if (this.form.invalid) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.adminService.changePassword(this.data.user.id, this.form.value.newPassword!).subscribe({
      next: () => this.dialogRef.close(true),
      error: (error) => {
        this.errorMessage = error.error?.message ?? this.translateService.instant('USERS.PASSWORD_UPDATE_FAILED');
        this.loading = false;
      },
    });
  }
}
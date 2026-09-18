import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MaterialModule } from 'src/app/material.module';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AdminService } from 'src/app/services/admin.service';
import { getApiErrorMessage } from 'src/app/shared/http/api-error';
import { RoleDTO } from './user.models';

@Component({
  selector: 'app-create-user-dialog',
  standalone: true,
  imports: [MaterialModule, ReactiveFormsModule, TranslatePipe],
  template: `
    <h2 mat-dialog-title>{{ 'USERS.CREATE' | translate }}</h2>

    <mat-dialog-content style="padding-bottom: 24px;">
      <form [formGroup]="form" id="createUserForm" (ngSubmit)="submit()">

        <mat-label class="f-s-14 f-w-600 m-b-12 d-block">{{ 'AUTH.COMMON.EMAIL' | translate }}</mat-label>
        <mat-form-field appearance="outline" class="w-100">
          <input matInput formControlName="email" type="email" [placeholder]="'USERS.EMAIL_PLACEHOLDER' | translate" />
          <mat-error>{{ 'AUTH.LOGIN.INVALID_EMAIL' | translate }}</mat-error>
        </mat-form-field>

        <mat-label class="f-s-14 f-w-600 m-b-12 d-block">{{ 'AUTH.COMMON.PASSWORD' | translate }}</mat-label>
        <mat-form-field appearance="outline" class="w-100">
          <input matInput formControlName="password" type="password" [placeholder]="'USERS.PASSWORD_PLACEHOLDER' | translate" />
          <mat-error>{{ 'AUTH.REGISTER.PASSWORD_LENGTH' | translate }}</mat-error>
        </mat-form-field>

        <mat-label class="f-s-14 f-w-600 m-b-12 d-block">{{ 'USERS.ROLES' | translate }}</mat-label>
        <mat-form-field appearance="outline" class="w-100">
          <mat-select formControlName="roles" multiple [placeholder]="'USERS.SELECT_ROLES' | translate">
            @for (role of roles; track role.id) {
              <mat-option [value]="role.id">{{ role.name }}</mat-option>
            }
          </mat-select>
          <mat-error>{{ 'USERS.ROLES_REQUIRED' | translate }}</mat-error>
        </mat-form-field>

        @if (errorMessage) {
          <p class="text-danger f-s-14">{{ errorMessage }}</p>
        }

      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end" style="padding: 16px 24px;">
      <button mat-stroked-button mat-dialog-close>{{ 'COMMON.CANCEL' | translate }}</button>
      <button mat-flat-button color="primary" type="submit" form="createUserForm" [disabled]="loading">
        {{ loading ? ('USERS.CREATING' | translate) : ('COMMON.CREATE' | translate) }}
      </button>
    </mat-dialog-actions>
  `,
})
export class CreateUserDialogComponent implements OnInit {
  roles: RoleDTO[] = [];
  errorMessage = '';
  loading = false;

  form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(6)]),
    roles: new FormControl<number[]>([], { validators: [Validators.required], nonNullable: true }),
  });

  constructor(
    private adminService: AdminService,
    private dialogRef: MatDialogRef<CreateUserDialogComponent>,
    private translateService: TranslateService,
  ) {}

  ngOnInit(): void {
    this.adminService.getRoles().subscribe({
      next: (roles) => (this.roles = roles),
      error: () => (this.errorMessage = this.translateService.instant('USERS.ROLES_LOAD_FAILED')),
    });
  }

  submit(): void {
    if (this.form.invalid) {
      return;
    }

    const { email, password, roles } = this.form.value;
    this.loading = true;
    this.errorMessage = '';
    this.adminService.createUser(email!, password!, roles!).subscribe({
      next: () => this.dialogRef.close(true),
      error: (error) => {
        this.errorMessage = getApiErrorMessage(
          error,
          this.translateService.instant('USERS.CREATE_FAILED'),
        );
        this.loading = false;
      },
    });
  }
}

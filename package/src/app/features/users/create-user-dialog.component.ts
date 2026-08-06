import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MaterialModule } from 'src/app/material.module';
import { TranslatePipe } from '@ngx-translate/core';
import { AdminService } from 'src/app/services/admin.service';
import { RoleDTO } from './user.models';

@Component({
  selector: 'app-create-user-dialog',
  standalone: true,
  imports: [MaterialModule, ReactiveFormsModule, TranslatePipe],
  template: `
    <h2 mat-dialog-title>{{ 'USERS.CREATE' | translate }}</h2>

    <mat-dialog-content style="padding-bottom: 24px;">
      <form [formGroup]="form" id="createUserForm" (ngSubmit)="submit()">

        <mat-label class="f-s-14 f-w-600 m-b-12 d-block">Email</mat-label>
        <mat-form-field appearance="outline" class="w-100">
          <input matInput formControlName="email" type="email" placeholder="user@example.com" />
          <mat-error>Enter a valid email address</mat-error>
        </mat-form-field>

        <mat-label class="f-s-14 f-w-600 m-b-12 d-block">Password</mat-label>
        <mat-form-field appearance="outline" class="w-100">
          <input matInput formControlName="password" type="password" placeholder="Min. 6 characters" />
          <mat-error>Password must be at least 6 characters</mat-error>
        </mat-form-field>

        <mat-label class="f-s-14 f-w-600 m-b-12 d-block">Roles</mat-label>
        <mat-form-field appearance="outline" class="w-100">
          <mat-select formControlName="roles" multiple placeholder="Select roles">
            @for (role of roles; track role.id) {
              <mat-option [value]="role.id">{{ role.name }}</mat-option>
            }
          </mat-select>
          <mat-error>At least one role is required</mat-error>
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
  ) {}

  ngOnInit(): void {
    this.adminService.getRoles().subscribe({
      next: (roles) => (this.roles = roles),
      error: () => (this.errorMessage = 'Failed to load roles'),
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
        this.errorMessage = error.error?.message ?? 'Failed to create user';
        this.loading = false;
      },
    });
  }
}
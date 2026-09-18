import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MaterialModule } from 'src/app/material.module';
import { AdminService } from 'src/app/services/admin.service';
import { getApiErrorMessage } from 'src/app/shared/http/api-error';
import { RoleDTO } from '../../users/user.models';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [MaterialModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './admin-dashboard.component.html',
})
export class AdminDashboardComponent implements OnInit {
  roles: RoleDTO[] = [];
  successMessage = '';
  errorMessage = '';

  form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(6)]),
    roles: new FormControl<number[]>([], { validators: [Validators.required], nonNullable: true }),
  });

  constructor(private adminService: AdminService, private translateService: TranslateService) {}

  ngOnInit(): void {
    this.adminService.getRoles().subscribe({
      next: (roles) => (this.roles = roles),
      error: () => (this.errorMessage = this.translateService.instant('USERS.ROLES_LOAD_FAILED')),
    });
  }

  get f() {
    return this.form.controls;
  }

  submit(): void {
    if (this.form.invalid) {
      return;
    }

    const { email, password, roles } = this.form.value;
    this.successMessage = '';
    this.errorMessage = '';
    this.adminService.createUser(email!, password!, roles!).subscribe({
      next: () => {
        this.successMessage = this.translateService.instant('USERS.CREATED');
        this.form.reset();
      },
      error: (error) => {
        this.errorMessage = getApiErrorMessage(
          error,
          this.translateService.instant('USERS.CREATE_FAILED'),
        );
      },
    });
  }
}

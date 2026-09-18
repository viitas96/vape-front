import { Component } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MaterialModule } from 'src/app/material.module';
import { AuthService } from 'src/app/services/auth.service';
import { getApiErrorMessage } from 'src/app/shared/http/api-error';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-register',
  imports: [RouterModule, MaterialModule, FormsModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './register.component.html',
})
export class AppRegisterComponent {
  errorMessage = '';
  loading = false;
  showPassword = false;

  readonly form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(6)]),
    dateOfBirth: new FormControl('', [Validators.required]),
  });

  constructor(
    private readonly router: Router,
    private readonly authService: AuthService,
  ) {}

  get f() {
    return this.form.controls;
  }

  submit(): void {
    if (this.form.invalid) {
      return;
    }

    const { email, password, dateOfBirth } = this.form.value;
    this.loading = true;
    this.errorMessage = '';

    this.authService.register(email!, password!, dateOfBirth!).subscribe({
      next: () => this.router.navigate(['/customer']),
      error: (error) => {
        this.errorMessage = getApiErrorMessage(error, 'Registration failed');
        this.loading = false;
      },
    });
  }
}

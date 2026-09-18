import { Component } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MaterialModule } from 'src/app/material.module';
import { AuthService } from 'src/app/services/auth.service';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-login',
  imports: [RouterModule, MaterialModule, FormsModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './login.component.html',
  standalone: true
})
export class AppLoginComponent {
  errorMessage = '';
  showPassword = false;

  readonly form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required]),
  });

  constructor(
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly translateService: TranslateService,
  ) {}

  get f() {
    return this.form.controls;
  }

  submit(): void {
    this.errorMessage = '';
    if (this.form.invalid) {
      return;
    }

    const { email, password } = this.form.value;
    this.authService.login(email!, password!).subscribe({
      next: () => this.router.navigate([this.authService.getRedirectPath()]),
      error: () => {
        this.errorMessage = this.translateService.instant('AUTH.LOGIN.INVALID_CREDENTIALS');
      },
    });
  }
}

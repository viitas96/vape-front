import { Component } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MaterialModule } from 'src/app/material.module';
import { AuthService } from 'src/app/services/auth.service';
import { getApiErrorMessage } from 'src/app/shared/http/api-error';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { minimumBirthDate, toIsoDate } from 'src/app/shared/date/date.util';
import { PhoneInputDirective } from 'src/app/shared/phone/phone-input.directive';

@Component({
  selector: 'app-register',
  imports: [RouterModule, MaterialModule, FormsModule, ReactiveFormsModule, TranslatePipe, PhoneInputDirective],
  templateUrl: './register.component.html',
})
export class AppRegisterComponent {
  errorMessage = '';
  loading = false;
  showPassword = false;
  readonly maxBirthDate = minimumBirthDate(18);

  readonly form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    firstName: new FormControl('', [Validators.required, Validators.maxLength(64)]),
    lastName: new FormControl('', [Validators.required, Validators.maxLength(64)]),
    phone: new FormControl('', [Validators.required, Validators.pattern(/^\+?[0-9]{6,20}$/)]),
    password: new FormControl('', [Validators.required, Validators.minLength(6)]),
    dateOfBirth: new FormControl<Date | null>(null, [Validators.required]),
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
    if (this.form.invalid) {
      return;
    }

    const { email, firstName, lastName, phone, password, dateOfBirth } = this.form.value;
    this.loading = true;
    this.errorMessage = '';

    this.authService.register({
      email: email!,
      firstName: firstName!,
      lastName: lastName!,
      phone: phone!,
      password: password!,
      dateOfBirth: toIsoDate(dateOfBirth ?? null),
    }).subscribe({
      next: () => this.router.navigate(['/customer']),
      error: (error) => {
        this.errorMessage = getApiErrorMessage(error, this.translateService.instant('AUTH.REGISTER.FAILED'));
        this.loading = false;
      },
    });
  }
}

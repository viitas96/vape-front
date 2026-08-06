import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MaterialModule } from 'src/app/material.module';
import { AuthService } from 'src/app/services/auth.service';
import { StoreSettingsService } from 'src/app/services/store-settings.service';
import { FeedbackPageState } from 'src/app/shared/page/page-state';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [MaterialModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './settings.component.html',
})
export class SettingsComponent extends FeedbackPageState implements OnInit {
  loading = false;
  readonly canEdit: boolean;

  readonly form = new FormGroup({
    earnRatePercent: new FormControl<number>(10, [Validators.required, Validators.min(1), Validators.max(100)]),
    spendRate: new FormControl<number>(10, [Validators.required, Validators.min(1)]),
    goodsPointsCapPercent: new FormControl<number>(50, [Validators.required, Validators.min(1), Validators.max(100)]),
    souvenirSplitPercent: new FormControl<number>(90, [Validators.required, Validators.min(1), Validators.max(100)]),
  });

  constructor(
    private readonly settingsService: StoreSettingsService,
    authService: AuthService,
    private readonly translateService: TranslateService,
  ) {
    super();
    this.canEdit = authService.hasAnyRole(['ADMIN', 'DIRECTOR']);
  }

  ngOnInit(): void {
    this.settingsService.get().subscribe({
      next: (settings) => {
        this.form.patchValue(settings);
      },
      error: () => {
        this.setError(this.translateService.instant('SETTINGS.LOAD_FAILED'));
      },
    });

    if (!this.canEdit) {
      this.form.disable();
    }
  }

  submit(): void {
    if (this.form.invalid || !this.canEdit) {
      return;
    }

    this.loading = true;
    this.clearMessages();
    const { earnRatePercent, spendRate, goodsPointsCapPercent, souvenirSplitPercent } = this.form.value;

    this.settingsService.update({
      earnRatePercent: earnRatePercent!,
      spendRate: spendRate!,
      goodsPointsCapPercent: goodsPointsCapPercent!,
      souvenirSplitPercent: souvenirSplitPercent!,
    }).subscribe({
      next: () => {
        this.loading = false;
        this.setSuccess(this.translateService.instant('SETTINGS.SAVED'));
      },
      error: (error) => {
        this.loading = false;
        this.setError(error.error?.message ?? this.translateService.instant('SETTINGS.SAVE_FAILED'));
      },
    });
  }
}
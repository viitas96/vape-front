import { DatePipe } from '@angular/common';
import { Component, DestroyRef, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { TablerIconsModule } from 'angular-tabler-icons';
import { toDataURL } from 'qrcode';
import { EMPTY, catchError, filter, switchMap, timer } from 'rxjs';
import { MaterialModule } from 'src/app/material.module';
import { AuthService } from 'src/app/services/auth.service';
import { MeService } from 'src/app/services/me.service';
import { StoreSettingsService } from 'src/app/services/store-settings.service';
import { MyProfile } from '../../dashboard/customer/customer.models';
import { DrinkStampHistoryItem } from '../coffee.models';
import { StampRowComponent } from '../stamp-row/stamp-row.component';

const POLL_INTERVAL_MS = 5000;
const HISTORY_SIZE = 10;

@Component({
  selector: 'app-coffee-card',
  standalone: true,
  imports: [DatePipe, MaterialModule, TranslatePipe, TablerIconsModule, StampRowComponent],
  templateUrl: './coffee-card.component.html',
  styleUrls: ['./coffee-card.component.scss'],
})
export class CoffeeCardComponent implements OnInit {
  profile: MyProfile | null = null;
  history: DrinkStampHistoryItem[] = [];
  threshold = 6;
  qrDataUrl = '';
  showProfile = false;
  loadFailed = false;

  constructor(
    private readonly meService: MeService,
    private readonly settingsService: StoreSettingsService,
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly destroyRef: DestroyRef,
  ) {}

  ngOnInit(): void {
    this.settingsService.get().subscribe({
      next: (settings) => (this.threshold = Math.max(1, settings.freeDrinkThreshold)),
    });

    timer(0, POLL_INTERVAL_MS)
      .pipe(
        filter(() => document.visibilityState === 'visible'),
        switchMap(() => this.meService.getProfile().pipe(catchError(() => this.onProfileFailed()))),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((profile) => this.onProfile(profile));
  }

  get freeDrinkNumber(): number {
    return this.threshold + 1;
  }

  get displayName(): string {
    if (!this.profile) {
      return '';
    }

    const fullName = [this.profile.firstName, this.profile.lastName].filter(Boolean).join(' ');
    return fullName || this.profile.email;
  }

  toggleProfile(): void {
    this.showProfile = !this.showProfile;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/authentication/login']);
  }

  private onProfile(profile: MyProfile): void {
    const previous = this.profile;
    this.profile = profile;
    this.loadFailed = false;

    if (!previous || previous.uuid !== profile.uuid) {
      this.generateQrCode(profile.uuid);
    }

    if (!previous || this.countersChanged(previous, profile)) {
      this.loadHistory();
    }
  }

  private onProfileFailed() {
    if (!this.profile) {
      this.loadFailed = true;
    }

    return EMPTY;
  }

  private countersChanged(previous: MyProfile, current: MyProfile): boolean {
    return previous.drinkCount !== current.drinkCount || previous.freeDrinksAvailable !== current.freeDrinksAvailable;
  }

  private loadHistory(): void {
    this.meService.getDrinkStamps(0, HISTORY_SIZE).subscribe({
      next: (page) => (this.history = page.content),
    });
  }

  private generateQrCode(uuid: string): void {
    toDataURL(uuid, { width: 320, margin: 1, color: { dark: '#18191b', light: '#ffffff' } }).then((url) => {
      this.qrDataUrl = url;
    });
  }
}

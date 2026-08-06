import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { toDataURL } from 'qrcode';
import { MaterialModule } from 'src/app/material.module';
import { MeService } from 'src/app/services/me.service';
import { MyOrder, MyProfile, Promotion } from './customer.models';
import { PromotionService } from 'src/app/services/promotion.service';
import { StoreSettingsService } from 'src/app/services/store-settings.service';
import { StoreSettings } from '../../settings/store-settings.models';

@Component({
  selector: 'app-customer-dashboard',
  standalone: true,
  imports: [MaterialModule, DatePipe],
  templateUrl: './customer-dashboard.component.html',
})
export class CustomerDashboardComponent implements OnInit {
  profile: MyProfile | null = null;
  orders: MyOrder[] = [];
  promotions: Promotion[] = [];
  settings: StoreSettings | null = null;
  qrDataUrl = '';
  promoIndex = 0;

  constructor(
    private readonly meService: MeService,
    private readonly promotionService: PromotionService,
    private readonly settingsService: StoreSettingsService,
  ) {}

  ngOnInit(): void {
    forkJoin({
      profile: this.meService.getProfile(),
      orders: this.meService.getOrders(0, 5),
      promotions: this.promotionService.getActive(),
      settings: this.settingsService.get(),
    }).subscribe(({ profile, orders, promotions, settings }) => {
      this.profile = profile;
      this.orders = orders.content;
      this.promotions = promotions;
      this.settings = settings;
      this.generateQrCode(profile.uuid);
    });
  }

  get pointsValueMdl(): number {
    if (!this.profile || !this.settings) {
      return 0;
    }

    return Math.floor((this.profile.pointsBalance * 100) / this.settings.spendRate) / 100;
  }

  get souvenirProgressPercent(): number {
    if (!this.profile || !this.settings) {
      return 0;
    }

    const targetPoints = (15000 * this.settings.spendRate) / 100;
    return Math.min(100, Math.round((this.profile.pointsBalance / targetPoints) * 100));
  }

  prevPromo(): void {
    this.promoIndex = (this.promoIndex - 1 + this.promotions.length) % this.promotions.length;
  }

  nextPromo(): void {
    this.promoIndex = (this.promoIndex + 1) % this.promotions.length;
  }

  formatMdl(cents: number): string {
    return `${(cents / 100).toFixed(2)} MDL`;
  }

  private generateQrCode(uuid: string): void {
    toDataURL(uuid, { width: 220, margin: 1, color: { dark: '#1a1a2e', light: '#ffffff' } }).then((url) => {
      this.qrDataUrl = url;
    });
  }
}
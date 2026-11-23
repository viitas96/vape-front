import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MaterialModule } from 'src/app/material.module';
import { AuthService } from 'src/app/services/auth.service';
import { CoffeeService } from 'src/app/services/coffee.service';
import { StoreSettingsService } from 'src/app/services/store-settings.service';
import { getApiErrorMessage } from 'src/app/shared/http/api-error';
import { CoffeeCustomer, DrinkStampEventResponse } from '../coffee.models';
import { QrCameraComponent } from '../qr-camera/qr-camera.component';
import { StampRowComponent } from '../stamp-row/stamp-row.component';

const MIN_QUANTITY = 1;
const MAX_QUANTITY = 20;
const UNDO_WINDOW_MS = 30000;

@Component({
  selector: 'app-coffee-seller',
  standalone: true,
  imports: [FormsModule, MaterialModule, TranslatePipe, TablerIconsModule, QrCameraComponent, StampRowComponent],
  templateUrl: './coffee-seller.component.html',
  styleUrls: ['./coffee-seller.component.scss'],
})
export class CoffeeSellerComponent implements OnInit {
  customer: CoffeeCustomer | null = null;
  threshold = 6;
  quantity = MIN_QUANTITY;
  phone = '';
  loading = false;
  errorMessage = '';

  constructor(
    private readonly coffeeService: CoffeeService,
    private readonly settingsService: StoreSettingsService,
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly snackBar: MatSnackBar,
    private readonly translateService: TranslateService,
  ) {}

  ngOnInit(): void {
    this.settingsService.get().subscribe({
      next: (settings) => (this.threshold = Math.max(1, settings.freeDrinkThreshold)),
    });
  }

  get customerName(): string {
    if (!this.customer) {
      return '';
    }

    const fullName = [this.customer.firstName, this.customer.lastName].filter(Boolean).join(' ');
    return fullName || this.customer.email;
  }

  get canRedeem(): boolean {
    return !!this.customer && !this.loading && this.quantity <= this.customer.freeDrinksAvailable;
  }

  onScanned(code: string): void {
    this.lookup(code);
  }

  searchByPhone(): void {
    const phone = this.phone.trim();
    if (!phone) {
      return;
    }

    this.lookup(phone);
  }

  increment(): void {
    this.quantity = Math.min(MAX_QUANTITY, this.quantity + 1);
  }

  decrement(): void {
    this.quantity = Math.max(MIN_QUANTITY, this.quantity - 1);
  }

  stamp(): void {
    if (!this.customer || this.loading) {
      return;
    }

    const quantity = this.quantity;
    this.loading = true;
    this.coffeeService.stamp({ customerId: this.customer.id, quantity }).subscribe({
      next: (response) => this.onTickSaved(response, 'COFFEE.STAMPED', quantity),
      error: (error) => this.onActionFailed(error),
    });
  }

  redeem(): void {
    if (!this.customer || !this.canRedeem) {
      return;
    }

    const quantity = this.quantity;
    this.loading = true;
    this.coffeeService.redeem({ customerId: this.customer.id, quantity }).subscribe({
      next: (response) => this.onTickSaved(response, 'COFFEE.REDEEMED', quantity),
      error: (error) => this.onActionFailed(error),
    });
  }

  reset(): void {
    this.customer = null;
    this.quantity = MIN_QUANTITY;
    this.phone = '';
    this.errorMessage = '';
    this.loading = false;
  }

  back(): void {
    this.router.navigateByUrl(this.authService.getRedirectPath());
  }

  private lookup(code: string): void {
    this.loading = true;
    this.errorMessage = '';
    this.coffeeService.findCustomer(code).subscribe({
      next: (customer) => {
        this.customer = customer;
        this.quantity = MIN_QUANTITY;
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = getApiErrorMessage(error, this.translateService.instant('COFFEE.CUSTOMER_NOT_FOUND'));
        this.loading = false;
      },
    });
  }

  private onTickSaved(response: DrinkStampEventResponse, messageKey: string, quantity: number): void {
    this.applyCounters(response.drinkCount, response.freeDrinksAvailable);
    this.quantity = MIN_QUANTITY;
    this.loading = false;

    const snackRef = this.snackBar.open(
      this.translateService.instant(messageKey, { count: quantity }),
      this.translateService.instant('COFFEE.UNDO'),
      { duration: UNDO_WINDOW_MS },
    );
    snackRef.onAction().subscribe(() => this.undo(response.eventId));
  }

  private undo(eventId: number): void {
    const customer = this.customer;
    this.loading = true;
    this.coffeeService.undo(eventId).subscribe({
      next: () => {
        this.snackBar.open(this.translateService.instant('COFFEE.UNDONE'), undefined, { duration: 3000 });
        if (customer) {
          this.refreshCustomer(customer.uuid);
          return;
        }

        this.loading = false;
      },
      error: (error) => this.onActionFailed(error),
    });
  }

  private refreshCustomer(uuid: string): void {
    this.coffeeService.findCustomer(uuid).subscribe({
      next: (customer) => {
        if (this.customer?.id === customer.id) {
          this.customer = customer;
        }
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  private applyCounters(drinkCount: number, freeDrinksAvailable: number): void {
    if (!this.customer) {
      return;
    }

    this.customer = { ...this.customer, drinkCount, freeDrinksAvailable };
  }

  private onActionFailed(error: unknown): void {
    this.loading = false;
    this.snackBar.open(
      getApiErrorMessage(error, this.translateService.instant('COFFEE.ACTION_FAILED')),
      this.translateService.instant('COMMON.CLOSE'),
      { duration: 5000 },
    );
  }
}

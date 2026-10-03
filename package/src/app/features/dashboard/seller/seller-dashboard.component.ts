import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { MaterialModule } from 'src/app/material.module';
import { PricePromptDialogComponent, PricePromptDialogData } from './price-prompt-dialog.component';
import { Order } from '../../orders/order.models';
import { PosService } from 'src/app/services/pos.service';
import { CustomerScan, PosCheckoutDTO } from './pos.models';
import { Product } from '../../products/product.models';
import { StoreSettingsService } from 'src/app/services/store-settings.service';
import { ShiftService } from 'src/app/services/shift.service';
import { CashMovementDTO, Shift } from 'src/app/features/shifts/shift.models';
import { ShiftOpenDialogComponent } from './shift-open-dialog.component';
import { ShiftCloseDialogComponent } from './shift-close-dialog.component';
import { CashMovementDialogComponent } from './cash-movement-dialog.component';
import { PaymentDialogComponent, PaymentDialogData, PaymentDialogResult } from './payment-dialog.component';
import { formatMdl } from 'src/app/shared/money/money.util';
import { getApiErrorMessage } from 'src/app/shared/http/api-error';
import { PickedProduct, ProductPickerDialogComponent } from './product-picker-dialog.component';

interface CartItem {
  product: Product;
  unitPrice: number;
  quantity: number;
  free: boolean;
}

@Component({
  selector: 'app-seller-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, MaterialModule, MatSnackBarModule, TranslatePipe],
  templateUrl: './seller-dashboard.component.html',
})
export class SellerDashboardComponent implements OnInit {
  @ViewChild('barcodeInput') barcodeInputRef!: ElementRef<HTMLInputElement>;

  scanCode = '';
  cart: CartItem[] = [];
  customer: CustomerScan | null = null;
  usePoints = false;
  loading = false;
  lastOrder: Order | null = null;
  lastChangeCents = 0;
  spendRate = 10;
  goodsPointsCapPercent = 50;
  souvenirSplitPercent = 90;
  freeDrinkThreshold = 6;
  shiftManagementEnabled = true;
  currentShift: Shift | null = null;
  closedShift: Shift | null = null;

  constructor(
    private readonly posService: PosService,
    private readonly settingsService: StoreSettingsService,
    private readonly shiftService: ShiftService,
    private readonly snackBar: MatSnackBar,
    private readonly translateService: TranslateService,
    private readonly dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.settingsService.get().subscribe((settings) => {
      this.spendRate = settings.spendRate;
      this.goodsPointsCapPercent = settings.goodsPointsCapPercent;
      this.souvenirSplitPercent = settings.souvenirSplitPercent;
      this.shiftManagementEnabled = settings.shiftManagementEnabled;
      this.freeDrinkThreshold = settings.freeDrinkThreshold;
    });

    this.loadCurrentShift(true);
    setTimeout(() => this.focusBarcode(), 100);
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'F5') {
      event.preventDefault();
      this.checkout();
    }
  }

  get customerName(): string {
    if (!this.customer) {
      return '';
    }

    return [this.customer.firstName, this.customer.lastName].filter(Boolean).join(' ');
  }

  get grossTotal(): number {
    return this.cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  }

  get maxPointsForPurchase(): number {
    if (!this.customer) {
      return 0;
    }

    let totalPoints = 0;
    for (const item of this.cart) {
      const lineTotalCents = item.unitPrice * item.quantity;
      const systemName = item.product.category?.systemName;
      if (systemName === 'SOUVENIR') {
        const pointsPortionCents = Math.floor((lineTotalCents * this.souvenirSplitPercent) / 100);
        totalPoints += Math.floor((pointsPortionCents * this.spendRate) / 100);
        continue;
      }

      const maxDiscountCents = Math.floor((lineTotalCents * this.goodsPointsCapPercent) / 100);
      totalPoints += Math.floor((maxDiscountCents * this.spendRate) / 100);
    }

    return totalPoints;
  }

  get pointsUsed(): number {
    if (!this.usePoints || !this.customer) {
      return 0;
    }

    return Math.min(this.customer.pointsBalance, this.maxPointsForPurchase);
  }

  get discountCents(): number {
    if (this.pointsUsed <= 0) {
      return 0;
    }

    return Math.round((this.pointsUsed * 100) / this.spendRate);
  }

  get netTotal(): number {
    return Math.max(0, this.grossTotal - this.discountCents);
  }

  get freeDrinksApplied(): number {
    return this.cart.filter((item) => item.free).reduce((sum, item) => sum + item.quantity, 0);
  }

  get freeDrinksRemaining(): number {
    return (this.customer?.freeDrinksAvailable ?? 0) - this.freeDrinksApplied;
  }

  canApplyFreeDrink(item: CartItem): boolean {
    return !item.free && item.product.drinkStampEligible === true && this.freeDrinksRemaining > 0;
  }

  applyFreeDrink(item: CartItem): void {
    if (!this.canApplyFreeDrink(item)) {
      return;
    }

    const freeLine = this.cart.find((existing) => existing.free && existing.product.id === item.product.id);
    if (freeLine) {
      freeLine.quantity++;
    } else {
      this.cart.push({ product: item.product, unitPrice: 0, quantity: 1, free: true });
    }

    item.quantity--;
    if (item.quantity <= 0) {
      this.cart = this.cart.filter((existing) => existing !== item);
    }

    this.focusBarcode();
  }

  get shiftRequired(): boolean {
    return this.shiftManagementEnabled && this.currentShift === null;
  }

  get canCheckout(): boolean {
    return this.cart.length > 0 && !this.loading && !this.shiftRequired;
  }

  focusBarcode(): void {
    if (this.dialog.openDialogs.length > 0) {
      return;
    }

    this.barcodeInputRef?.nativeElement.focus();
  }

  onScan(): void {
    const code = this.scanCode.trim();
    if (!code) {
      return;
    }

    this.scanCode = '';
    this.posService.scan(code).subscribe({
      next: (result) => {
        if (result.type === 'PRODUCT') {
          this.addToCart(result.data as Product);
          return;
        }

        const customer = result.data as CustomerScan;
        this.customer = customer;
        this.usePoints = false;
        this.notify('POS.CUSTOMER_SCANNED', { email: customer.email, points: customer.pointsBalance });
      },
      error: (error) => {
        if (error?.status === 400) {
          this.notify('POS.CUSTOMER_BANNED');
          return;
        }

        this.notify('POS.CODE_NOT_RECOGNISED');
      },
      complete: () => {
        this.focusBarcode();
      },
    });
  }

  addToCart(product: Product): void {
    const existingItem = this.cart.find((item) => item.product.id === product.id && !item.free);
    if (existingItem) {
      existingItem.quantity++;
      this.focusBarcode();
      return;
    }

    if (product.price === null || product.price === undefined) {
      this.askForPrice(product);
      return;
    }

    this.cart.push({ product, unitPrice: product.price, quantity: 1, free: false });
    this.focusBarcode();
  }

  removeFromCart(index: number): void {
    this.cart.splice(index, 1);
    this.focusBarcode();
  }

  changeQty(item: CartItem, delta: number): void {
    if (item.free && delta > 0 && this.freeDrinksRemaining <= 0) {
      this.focusBarcode();
      return;
    }

    item.quantity += delta;
    if (item.quantity <= 0) {
      this.cart = this.cart.filter((existingItem) => existingItem !== item);
    }

    this.focusBarcode();
  }

  clearCustomer(): void {
    this.customer = null;
    this.usePoints = false;
    this.cart = this.cart.filter((item) => !item.free);
    this.focusBarcode();
  }

  formatMdl(cents: number): string {
    return formatMdl(cents);
  }

  formatDuration(minutes: number): string {
    return this.translateService.instant('SHIFTS.DURATION_VALUE', {
      hours: Math.floor(minutes / 60),
      minutes: minutes % 60,
    });
  }

  checkout(): void {
    if (!this.canCheckout) {
      return;
    }

    if (this.netTotal === 0) {
      this.submitCheckout({ cashAmount: 0, cardAmount: 0, changeCents: 0 });
      return;
    }

    const data: PaymentDialogData = { totalCents: this.netTotal };
    this.dialog.open(PaymentDialogComponent, { width: '400px', data })
      .afterClosed()
      .subscribe((payment?: PaymentDialogResult) => {
        if (!payment) {
          this.focusBarcode();
          return;
        }

        this.submitCheckout(payment);
      });
  }

  openShift(): void {
    this.dialog.open(ShiftOpenDialogComponent, { width: '360px' })
      .afterClosed()
      .subscribe((startingCash?: number) => {
        if (startingCash === undefined) {
          this.focusBarcode();
          return;
        }

        this.shiftService.open({ startingCash }).subscribe({
          next: () => {
            this.closedShift = null;
            this.notify('SHIFTS.OPENED_SUCCESS');
            this.loadCurrentShift();
            this.focusBarcode();
          },
          error: (error) => this.notifyError(error, 'SHIFTS.OPEN_FAILED'),
        });
      });
  }

  closeShift(): void {
    const shift = this.currentShift;
    if (!shift) {
      return;
    }

    this.dialog.open(ShiftCloseDialogComponent, { width: '360px' })
      .afterClosed()
      .subscribe((actualCash?: number) => {
        if (actualCash === undefined) {
          this.focusBarcode();
          return;
        }

        this.shiftService.close({ actualCash }).subscribe({
          next: () => {
            this.currentShift = null;
            this.notify('SHIFTS.CLOSED_SUCCESS');
            this.loadClosedShift(shift.id);
            this.focusBarcode();
          },
          error: (error) => this.notifyError(error, 'SHIFTS.CLOSE_FAILED'),
        });
      });
  }

  openProductPicker(): void {
    this.dialog.open(ProductPickerDialogComponent, { width: '860px', maxWidth: 'calc(100vw - 48px)' })
      .afterClosed()
      .subscribe((picked?: PickedProduct[]) => {
        if (picked) {
          this.addPickedProducts(picked);
        }

        this.focusBarcode();
      });
  }

  openCashMovement(): void {
    this.dialog.open(CashMovementDialogComponent, { width: '400px' })
      .afterClosed()
      .subscribe((dto?: CashMovementDTO) => {
        if (!dto) {
          this.focusBarcode();
          return;
        }

        this.shiftService.recordCashMovement(dto).subscribe({
          next: () => {
            this.notify('SHIFTS.MOVEMENT_RECORDED');
            this.focusBarcode();
          },
          error: (error) => this.notifyError(error, 'SHIFTS.MOVEMENT_FAILED'),
        });
      });
  }

  private submitCheckout(payment: PaymentDialogResult): void {
    this.loading = true;
    const orderDto: PosCheckoutDTO = {
      customerId: this.customer?.uuid,
      usePoints: this.usePoints,
      cashAmount: payment.cashAmount,
      cardAmount: payment.cardAmount,
      freeDrinksRedeemed: this.freeDrinksApplied,
      items: this.cart.map((item) => ({
        productId: item.product.id,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
      })),
    };

    this.posService.checkout(orderDto).subscribe({
      next: (order) => {
        this.lastOrder = order;
        this.lastChangeCents = payment.changeCents;
        this.notify('POS.CHECKOUT_SUCCESS', { points: order.pointsEarned ?? 0 }, 5000);
        this.cart = [];
        this.customer = null;
        this.usePoints = false;
        this.loading = false;
        this.focusBarcode();
      },
      error: (error) => {
        this.loading = false;
        this.notifyError(error, 'POS.CHECKOUT_FAILED');
      },
    });
  }

  private addPickedProducts(picked: PickedProduct[]): void {
    for (const pick of picked) {
      const existingItem = this.cart.find((item) => item.product.id === pick.product.id && !item.free);
      if (existingItem) {
        existingItem.quantity += pick.quantity;
        continue;
      }

      this.cart.push({
        product: pick.product,
        unitPrice: pick.unitPrice,
        quantity: pick.quantity,
        free: false,
      });
    }
  }

  private loadCurrentShift(warnIfOpen = false): void {
    this.shiftService.getCurrent().subscribe({
      next: (shift) => {
        this.currentShift = shift;
        if (warnIfOpen && shift) {
          this.notify('SHIFTS.STILL_OPEN', { openedAt: new Date(shift.openedAt).toLocaleString() }, 6000);
        }
      },
      error: () => {
        this.currentShift = null;
      },
    });
  }

  private loadClosedShift(id: number): void {
    this.shiftService.getById(id).subscribe({
      next: (shift) => {
        this.closedShift = shift;
      },
    });
  }

  private notifyError(error: unknown, fallbackKey: string): void {
    const message = getApiErrorMessage(error, this.translateService.instant(fallbackKey));
    this.snackBar.open(message, this.translateService.instant('COMMON.CLOSE'), { duration: 5000 });
    this.focusBarcode();
  }

  private askForPrice(product: Product): void {
    const data: PricePromptDialogData = { productName: product.name };
    this.dialog.open(PricePromptDialogComponent, { width: '360px', data })
      .afterClosed()
      .subscribe((unitPrice?: number) => {
        if (unitPrice !== undefined) {
          this.cart.push({ product, unitPrice, quantity: 1, free: false });
        }

        this.focusBarcode();
      });
  }

  private notify(key: string, params?: Record<string, unknown>, duration = 3000): void {
    this.snackBar.open(
      this.translateService.instant(key, params),
      this.translateService.instant('COMMON.CLOSE'),
      { duration },
    );
  }
}

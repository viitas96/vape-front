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
import { CustomerScan } from './pos.models';
import { Product } from '../../products/product.models';
import { StoreSettingsService } from 'src/app/services/store-settings.service';

interface CartItem {
  product: Product;
  unitPrice: number;
  quantity: number;
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
  spendRate = 10;
  goodsPointsCapPercent = 50;
  souvenirSplitPercent = 90;

  constructor(
    private readonly posService: PosService,
    private readonly settingsService: StoreSettingsService,
    private readonly snackBar: MatSnackBar,
    private readonly translateService: TranslateService,
    private readonly dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.settingsService.get().subscribe((settings) => {
      this.spendRate = settings.spendRate;
      this.goodsPointsCapPercent = settings.goodsPointsCapPercent;
      this.souvenirSplitPercent = settings.souvenirSplitPercent;
    });

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
    const existingItem = this.cart.find((item) => item.product.id === product.id);
    if (existingItem) {
      existingItem.quantity++;
      this.focusBarcode();
      return;
    }

    if (product.price === null || product.price === undefined) {
      this.askForPrice(product);
      return;
    }

    this.cart.push({ product, unitPrice: product.price, quantity: 1 });
    this.focusBarcode();
  }

  removeFromCart(index: number): void {
    this.cart.splice(index, 1);
    this.focusBarcode();
  }

  changeQty(item: CartItem, delta: number): void {
    item.quantity += delta;
    if (item.quantity <= 0) {
      this.cart = this.cart.filter((existingItem) => existingItem !== item);
    }

    this.focusBarcode();
  }

  clearCustomer(): void {
    this.customer = null;
    this.usePoints = false;
    this.focusBarcode();
  }

  formatMdl(cents: number): string {
    return `${(cents / 100).toFixed(2)} MDL`;
  }

  checkout(): void {
    if (this.cart.length === 0 || this.loading) {
      return;
    }

    this.loading = true;
    const orderDto = {
      customerId: this.customer?.uuid,
      usePoints: this.usePoints,
      items: this.cart.map((item) => ({
        productId: item.product.id,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
      })),
    };

    this.posService.checkout(orderDto).subscribe({
      next: (order) => {
        this.lastOrder = order;
        this.notify('POS.CHECKOUT_SUCCESS', { points: order.pointsEarned ?? 0 }, 5000);
        this.cart = [];
        this.customer = null;
        this.usePoints = false;
        this.loading = false;
        this.focusBarcode();
      },
      error: (error) => {
        const message = error?.error?.message ?? this.translateService.instant('POS.CHECKOUT_FAILED');
        this.snackBar.open(message, this.translateService.instant('COMMON.CLOSE'), { duration: 5000 });
        this.loading = false;
        this.focusBarcode();
      },
    });
  }

  private askForPrice(product: Product): void {
    const data: PricePromptDialogData = { productName: product.name };
    this.dialog.open(PricePromptDialogComponent, { width: '360px', data })
      .afterClosed()
      .subscribe((unitPrice?: number) => {
        if (unitPrice !== undefined) {
          this.cart.push({ product, unitPrice, quantity: 1 });
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

import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { RouterLink } from '@angular/router';
import { MaterialModule } from 'src/app/material.module';
import { Order } from '../../orders/order.models';
import { PosService } from 'src/app/services/pos.service';
import { CartItem, CustomerScan, PickedProduct, PosCheckoutDTO, ProductPickerDialog } from './pos.models';
import { HeldReceiptsService } from './held-receipts.service';
import { HeldReceiptsDialogComponent } from './held-receipts-dialog.component';
import { Product } from '../../products/product.models';
import { StoreSettingsService } from 'src/app/services/store-settings.service';
import { ShiftService } from 'src/app/services/shift.service';
import { Shift } from 'src/app/features/shifts/shift.models';
import { PaymentDialogComponent, PaymentDialogData, PaymentDialogResult } from './payment-dialog.component';
import { formatMdl } from 'src/app/shared/money/money.util';
import { getApiErrorMessage } from 'src/app/shared/http/api-error';
import { ProductGridComponent } from './product-grid.component';
import { CoreService } from 'src/app/services/core.service';
import { ProductListDialogComponent } from './product-list-dialog.component';
import { QuantityPromptService } from './quantity-prompt.service';
import { ConfirmDialogService } from 'src/app/shared/dialogs/confirm-dialog.service';
import { PosPrintService } from 'src/app/shared/print/pos-print.service';

const SELECTION_STEPS: Record<string, number> = {
  ArrowUp: -1,
  ArrowDown: 1,
};

@Component({
  selector: 'app-seller-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, MaterialModule, MatSnackBarModule, TranslatePipe, RouterLink, ProductGridComponent],
  templateUrl: './seller-dashboard.component.html',
  styleUrls: ['./seller-dashboard.component.scss'],
})
export class SellerDashboardComponent implements OnInit {
  @ViewChild('barcodeInput') barcodeInputRef!: ElementRef<HTMLInputElement>;
  @ViewChild(ProductGridComponent) productGrid?: ProductGridComponent;

  scanCode = '';
  cart: CartItem[] = [];
  selectedLine: CartItem | null = null;
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

  constructor(
    private readonly posService: PosService,
    private readonly settingsService: StoreSettingsService,
    private readonly shiftService: ShiftService,
    private readonly snackBar: MatSnackBar,
    private readonly translateService: TranslateService,
    private readonly dialog: MatDialog,
    private readonly confirmDialog: ConfirmDialogService,
    private readonly posPrint: PosPrintService,
    private readonly quantityPrompt: QuantityPromptService,
    private readonly coreService: CoreService,
    private readonly heldReceipts: HeldReceiptsService,
  ) {}

  ngOnInit(): void {
    this.coreService.setOptions({ sidenavCollapsed: true });

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
    if (this.dialog.openDialogs.length > 0 || event.defaultPrevented) {
      return;
    }

    const handled = this.handleHotkey(event);
    if (handled) {
      event.preventDefault();
    }
  }

  get customerName(): string {
    if (!this.customer) {
      return '';
    }

    return [this.customer.firstName, this.customer.lastName].filter(Boolean).join(' ');
  }

  get maxPointsHint(): string {
    const maxDiscount = formatMdl((this.maxPointsForPurchase * 100) / this.spendRate);
    return `${this.translateService.instant('POS.MAX_POINTS')}: ${this.maxPointsForPurchase} (≈ ${maxDiscount})`;
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

  get shiftRequired(): boolean {
    return this.shiftManagementEnabled && this.currentShift === null;
  }

  get canCheckout(): boolean {
    return this.cart.length > 0 && !this.loading && !this.shiftRequired;
  }

  get hasReceiptContent(): boolean {
    return this.cart.length > 0 || this.customer !== null;
  }

  get heldCount(): number {
    return this.heldReceipts.count;
  }

  get hasSomethingToPrint(): boolean {
    return this.cart.length > 0 || this.lastOrder !== null;
  }

  lineDetails(item: CartItem): string {
    const product = item.product;
    return [formatMdl(item.unitPrice), product.brand?.name, product.category?.name, product.gamma?.name, product.barcode]
      .filter(Boolean)
      .join(' · ');
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
      this.removeLine(item);
    }

    this.focusBarcode();
  }

  focusBarcode(): void {
    if (this.dialog.openDialogs.length > 0) {
      return;
    }

    this.barcodeInputRef?.nativeElement.focus();
  }

  onBarcodeBlur(event: FocusEvent): void {
    if (event.relatedTarget === null) {
      this.focusBarcode();
    }
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
          this.addScannedProduct(result.data as Product);
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

  selectLine(item: CartItem): void {
    this.selectedLine = item;
  }

  isSelected(item: CartItem): boolean {
    return this.selectedLine === item;
  }

  removeLine(item: CartItem): void {
    const index = this.cart.indexOf(item);
    this.cart = this.cart.filter((existing) => existing !== item);
    if (this.selectedLine === item) {
      this.selectedLine = this.cart[Math.min(index, this.cart.length - 1)] ?? null;
    }

    this.focusBarcode();
  }

  changeQty(item: CartItem, delta: number): void {
    if (item.free && delta > 0 && this.freeDrinksRemaining <= 0) {
      this.focusBarcode();
      return;
    }

    item.quantity += delta;
    if (item.quantity <= 0) {
      this.removeLine(item);
      return;
    }

    this.focusBarcode();
  }

  clearCustomer(): void {
    this.customer = null;
    this.usePoints = false;
    this.cart = this.cart.filter((item) => !item.free);
    this.focusBarcode();
  }

  clearReceipt(): void {
    if (!this.hasReceiptContent) {
      return;
    }

    this.confirmDialog.confirm({
      title: this.translateService.instant('POS.CLEAR_CONFIRM_TITLE'),
      message: this.translateService.instant('POS.CLEAR_CONFIRM_MESSAGE'),
      confirmLabel: `${this.translateService.instant('POS.CLEAR_RECEIPT')} (Enter)`,
      confirmColor: 'warn',
      focusConfirm: true,
    }).subscribe((confirmed) => {
      if (confirmed) {
        this.resetReceipt();
      }

      this.focusBarcode();
    });
  }

  printReceipt(): void {
    if (this.cart.length > 0) {
      this.posPrint.printBill({
        lines: this.cart.map((item) => ({
          name: item.product.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          free: item.free,
        })),
        grossTotal: this.grossTotal,
        discount: this.discountCents,
        netTotal: this.netTotal,
        customerEmail: this.customer?.email,
      });
      return;
    }

    if (this.lastOrder) {
      this.posPrint.printSale(this.lastOrder);
      return;
    }

    this.notify('POS.NOTHING_TO_PRINT');
  }

  formatMdl(cents: number): string {
    return formatMdl(cents);
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
    this.dialog.open(PaymentDialogComponent, { width: '420px', data })
      .afterClosed()
      .subscribe((payment?: PaymentDialogResult) => {
        if (!payment) {
          this.focusBarcode();
          return;
        }

        this.submitCheckout(payment);
      });
  }

  onProductPicked(product: Product): void {
    this.quantityPrompt.ask(product).subscribe({
      next: (picked) => this.addToCart(picked.product, picked.quantity, picked.unitPrice),
      complete: () => setTimeout(() => this.productGrid?.focusSearch()),
    });
  }

  openProductList(): void {
    const dialogRef = this.dialog.open(ProductListDialogComponent, { width: '720px', maxWidth: 'calc(100vw - 48px)' });
    this.addPickedProducts(dialogRef);
  }

  holdReceipt(): void {
    if (!this.hasReceiptContent) {
      this.notify('POS.HOLD_NOTHING');
      return;
    }

    this.parkCurrentReceipt();
    this.notify('POS.HOLD_SUCCESS');
    this.focusBarcode();
  }

  openHeldReceipts(): void {
    this.dialog.open(HeldReceiptsDialogComponent, { width: '560px', maxWidth: 'calc(100vw - 48px)' })
      .afterClosed()
      .subscribe((id?: string) => {
        if (id) {
          this.resumeReceipt(id);
        }

        this.focusBarcode();
      });
  }

  private resumeReceipt(id: string): void {
    const receipt = this.heldReceipts.take(id);
    if (!receipt) {
      return;
    }

    if (this.hasReceiptContent) {
      this.parkCurrentReceipt();
    }

    this.cart = receipt.items;
    this.customer = receipt.customer;
    this.usePoints = receipt.usePoints;
    this.selectedLine = null;
    this.notify('POS.HELD_RESUMED');
  }

  private parkCurrentReceipt(): void {
    this.heldReceipts.hold({ customer: this.customer, usePoints: this.usePoints, items: this.cart });
    this.resetReceipt();
  }

  private handleHotkey(event: KeyboardEvent): boolean {
    if (event.ctrlKey && event.key === 'Delete') {
      this.clearReceipt();
      return true;
    }

    if (event.shiftKey && event.key === 'F8') {
      this.openHeldReceipts();
      return true;
    }

    const actions: Record<string, () => void> = {
      F1: () => this.focusBarcode(),
      F2: () => this.productGrid?.focusSearch(),
      F3: () => this.openProductList(),
      F4: () => this.togglePoints(),
      F5: () => this.checkout(),
      F8: () => this.holdReceipt(),
      F9: () => this.printReceipt(),
    };
    const action = actions[event.key];
    if (action) {
      action();
      return true;
    }

    if (!this.isTypingInBarcode(event) || this.scanCode.length > 0) {
      return false;
    }

    return this.handleCartKey(event.key);
  }

  private handleCartKey(key: string): boolean {
    const selectionStep = SELECTION_STEPS[key];
    if (selectionStep !== undefined) {
      this.moveSelection(selectionStep);
      return true;
    }

    if (!this.selectedLine) {
      return false;
    }

    const cartActions: Record<string, () => void> = {
      '+': () => this.changeQty(this.selectedLine!, 1),
      '-': () => this.changeQty(this.selectedLine!, -1),
      Delete: () => this.removeLine(this.selectedLine!),
    };
    const action = cartActions[key];
    if (!action) {
      return false;
    }

    action();
    return true;
  }

  private isTypingInBarcode(event: KeyboardEvent): boolean {
    return event.target === this.barcodeInputRef?.nativeElement;
  }

  private moveSelection(delta: number): void {
    if (this.cart.length === 0) {
      return;
    }

    const current = this.cart.indexOf(this.selectedLine as CartItem);
    const next = Math.min(this.cart.length - 1, Math.max(0, current + delta));
    this.selectedLine = this.cart[next];
  }

  private togglePoints(): void {
    if (!this.customer) {
      return;
    }

    this.usePoints = !this.usePoints;
  }

  private addScannedProduct(product: Product): void {
    const existingItem = this.cart.find((item) => item.product.id === product.id && !item.free);
    if (existingItem) {
      existingItem.quantity++;
      this.selectedLine = existingItem;
      this.focusBarcode();
      return;
    }

    if (product.price === null || product.price === undefined) {
      this.askQuantity(product);
      return;
    }

    this.addToCart(product, 1, product.price);
    this.focusBarcode();
  }

  private askQuantity(product: Product): void {
    this.quantityPrompt.ask(product).subscribe({
      next: (picked) => this.addToCart(picked.product, picked.quantity, picked.unitPrice),
      complete: () => setTimeout(() => this.focusBarcode()),
    });
  }

  private addPickedProducts(dialogRef: MatDialogRef<ProductPickerDialog>): void {
    const subscription = dialogRef.componentInstance.productAdded
      .subscribe((picked: PickedProduct) => this.addToCart(picked.product, picked.quantity, picked.unitPrice));

    dialogRef.afterClosed().subscribe(() => {
      subscription.unsubscribe();
      setTimeout(() => this.focusBarcode());
    });
  }

  private addToCart(product: Product, quantity: number, unitPrice: number): void {
    const existingItem = this.cart.find((item) => item.product.id === product.id && !item.free && item.unitPrice === unitPrice);
    if (existingItem) {
      existingItem.quantity += quantity;
      this.selectedLine = existingItem;
      return;
    }

    const item: CartItem = { product, unitPrice, quantity, free: false };
    this.cart.push(item);
    this.selectedLine = item;
  }

  private resetReceipt(): void {
    this.cart = [];
    this.selectedLine = null;
    this.customer = null;
    this.usePoints = false;
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
        this.resetReceipt();
        this.loading = false;
        this.focusBarcode();
      },
      error: (error) => {
        this.loading = false;
        this.notifyError(error, 'POS.CHECKOUT_FAILED');
      },
    });
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

  private notifyError(error: unknown, fallbackKey: string): void {
    const message = getApiErrorMessage(error, this.translateService.instant(fallbackKey));
    this.snackBar.open(message, this.translateService.instant('COMMON.CLOSE'), { duration: 5000 });
    this.focusBarcode();
  }

  private notify(key: string, params?: Record<string, unknown>, duration = 3000): void {
    this.snackBar.open(
      this.translateService.instant(key, params),
      this.translateService.instant('COMMON.CLOSE'),
      { duration },
    );
  }
}

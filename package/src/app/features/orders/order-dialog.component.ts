import { Component, Inject } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MaterialModule } from 'src/app/material.module';
import { Order, OrderDTO, OrderStatus } from './order.models';
import { Product } from '../products/product.models';
import { UserResponse } from '../users/user.models';
import { StoreSettingsService } from 'src/app/services/store-settings.service';
import { StoreSettings } from '../settings/store-settings.models';
import { TranslatePipe } from '@ngx-translate/core';

export interface OrderDialogData {
  order: Order | null;
  products: Product[];
  users: UserResponse[];
  usePoints: boolean;
}

interface ItemForm {
  product: FormControl<Product | string | null>;
  unitPrice: FormControl<number | null>;
  quantity: FormControl<number | null>;
}

interface ProductTreeGamma {
  name: string;
  products: Product[];
}

interface ProductTreeGroup {
  name: string;
  gammas: ProductTreeGamma[];
}

interface ProductTreeCategory {
  name: string;
  groups: ProductTreeGroup[];
}

@Component({
  selector: 'app-order-dialog',
  standalone: true,
  imports: [MaterialModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './order-dialog.component.html',
})
export class OrderDialogComponent {
  statuses: OrderStatus[] = ['PENDING', 'COMPLETED', 'CANCELLED'];
  settings?: StoreSettings;

  form = new FormGroup({
    status: new FormControl<OrderStatus>('COMPLETED', { nonNullable: true }),
    isWalkIn: new FormControl<boolean>(false, { nonNullable: true }),
    customer: new FormControl<UserResponse | string | null>(null),
    items: new FormArray<FormGroup<ItemForm>>([]),
    usePoints: new FormControl<boolean>(false),
  });

  constructor(
    public dialogRef: MatDialogRef<OrderDialogComponent, OrderDTO>,
    @Inject(MAT_DIALOG_DATA) public data: OrderDialogData,
    private storeSettingsService: StoreSettingsService,
  ) {
    this.storeSettingsService.get().subscribe((s) => (this.settings = s));
    this.form.controls.customer.setValidators([this.customerValidator]);

    this.form.controls.isWalkIn.valueChanges.subscribe((isWalkIn) => {
      if (isWalkIn) {
        this.form.controls.customer.disable();
        this.form.controls.customer.setValue(null);
      } else {
        this.form.controls.customer.enable();
      }
    });

    if (data.order) {
      this.form.controls.status.setValue(data.order.status);
      this.form.controls.usePoints.setValue(data.order.pointsUsed ? data.order.pointsUsed > 0 : false);
      if (data.order.customerId) {
        this.form.controls.isWalkIn.setValue(false);
        const existing = data.users.find((u) => u.uuid === data.order!.customerId);
        if (existing) this.form.controls.customer.setValue(existing);
      } else {
        this.form.controls.isWalkIn.setValue(true);
        this.form.controls.customer.disable();
      }
      data.order.items.forEach((item) => {
        // resolve to the live product; fall back to a stub if it was since deleted
        const product =
          this.data.products.find((p) => p.id === item.productId) ??
          ({ id: item.productId, name: item.productName, price: item.unitPrice } as Product);
        this.items.push(this.createItem(product, item.unitPrice / 100, item.quantity));
      });
    } else {
      this.form.controls.isWalkIn.setValue(false);
      this.addItem();
    }
  }

  get items(): FormArray<FormGroup<ItemForm>> {
    return this.form.controls.items;
  }

  get isEdit(): boolean {
    return this.data.order !== null;
  }

  get total(): number {
    return this.items.controls.reduce((sum, g) => {
      const price = g.controls.unitPrice.value ?? 0;
      const qty = g.controls.quantity.value ?? 0;
      return sum + price * qty;
    }, 0);
  }

  get selectedCustomer(): UserResponse | null {
    const cust = this.form.controls.customer.value;
    return cust && typeof cust === 'object' && 'uuid' in cust ? (cust as UserResponse) : null;
  }

  get productTree(): ProductTreeCategory[] {
    const categories = new Map<string, Map<string, Map<string, Product[]>>>();

    for (const product of this.data.products) {
      const categoryName = product.group?.category?.name ?? 'No category';
      const groupName = product.group?.name ?? 'No group';
      const gammaName = product.gamma?.name ?? 'No gamma';

      if (!categories.has(categoryName)) {
        categories.set(categoryName, new Map<string, Map<string, Product[]>>());
      }

      const groups = categories.get(categoryName)!;
      if (!groups.has(groupName)) {
        groups.set(groupName, new Map<string, Product[]>());
      }

      const gammas = groups.get(groupName)!;
      if (!gammas.has(gammaName)) {
        gammas.set(gammaName, []);
      }

      gammas.get(gammaName)!.push(product);
    }

    return Array.from(categories.entries()).map(([categoryName, groups]) => ({
      name: categoryName,
      groups: Array.from(groups.entries()).map(([groupName, gammas]) => ({
        name: groupName,
        gammas: Array.from(gammas.entries()).map(([gammaName, products]) => ({
          name: gammaName,
          products,
        })),
      })),
    }));
  }

  get maxPointsForPurchase(): number {
    if (!this.settings) return 0;
    let totalPoints = 0;
    for (const g of this.items.controls) {
      const product = g.controls.product.value;
      if (product && typeof product === 'object') {
        const price = g.controls.unitPrice.value ?? 0;
        const qty = g.controls.quantity.value ?? 0;
        const lineTotalCents = Math.round(price * qty * 100);
        const systemName = product.group?.category?.systemName;
        if (systemName === 'SOUVENIR') {
          const pointsPortionCents = Math.floor((lineTotalCents * this.settings.souvenirSplitPercent) / 100);
          totalPoints += Math.floor((pointsPortionCents * this.settings.spendRate) / 100);
        } else {
          const maxDiscountCents = Math.floor((lineTotalCents * this.settings.goodsPointsCapPercent) / 100);
          totalPoints += Math.floor((maxDiscountCents * this.settings.spendRate) / 100);
        }
      }
    }
    return totalPoints;
  }

  addItem(): void {
    this.items.push(this.createItem(null, null, 1));
  }


  removeItem(index: number): void {
    this.items.removeAt(index);
  }

  // filters by product name, barcode or item code РІР‚вЂќ lets a scanner match the scanned barcode
  filterProducts(value: Product | string | null): Product[] {
    if (!value || typeof value === 'object') return this.data.products;
    const term = value.trim().toLowerCase();
    return this.data.products.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        (p.barcode?.toLowerCase().includes(term) ?? false) ||
        (p.itemCode?.toLowerCase().includes(term) ?? false),
    );
  }

  displayProduct(product: Product | string | null): string {
    return product && typeof product === 'object' ? product.name : '';
  }

  compareProducts(firstProduct: Product | string | null, secondProduct: Product | string | null): boolean {
    return Boolean(
      firstProduct &&
      secondProduct &&
      typeof firstProduct === 'object' &&
      typeof secondProduct === 'object' &&
      firstProduct.id === secondProduct.id
    );
  }

  onProductSelected(index: number): void {
    const group = this.items.at(index);
    const product = group.controls.product.value;
    // selecting a product resets the line price to that product's current price (seller can then discount)
    if (product && typeof product === 'object') {
      group.controls.unitPrice.setValue(product.price / 100);
    }
  }

  // filters users by email or UUID (strips QR_ prefix from scanned values)
  filterCustomers(value: UserResponse | string | null): UserResponse[] {
    if (!value || typeof value === 'object') return this.data.users;
    const raw = value.trim();
    const term = (raw.toUpperCase().startsWith('QR_') ? raw.slice(3) : raw).toLowerCase();
    if (!term) return this.data.users;
    return this.data.users.filter(
      (u) => u.email.toLowerCase().includes(term) || u.uuid.toLowerCase().includes(term)
    );
  }

  displayCustomer(user: UserResponse | string | null): string {
    return user && typeof user === 'object' ? user.email : '';
  }

  submit(): void {
    if (this.form.invalid) return;
    const isWalkIn = this.form.controls.isWalkIn.value;
    const customer = this.form.controls.customer.value;
    this.dialogRef.close({
      status: this.form.controls.status.value,
      customerId: (!isWalkIn && customer && typeof customer === 'object') ? customer.uuid : null,
      items: this.items.controls.map((g) => ({
        productId: (g.controls.product.value as Product).id,
        unitPrice: Math.round((g.controls.unitPrice.value ?? 0) * 100),
        quantity: g.controls.quantity.value!,
      })),
      usePoints: this.form.controls.usePoints?.value ?? false,
    });
  }

  private createItem(product: Product | null, unitPrice: number | null, quantity: number): FormGroup<ItemForm> {
    return new FormGroup<ItemForm>({
      product: new FormControl<Product | string | null>(product, [this.productValidator]),
      unitPrice: new FormControl(unitPrice, [Validators.required, Validators.min(0)]),
      quantity: new FormControl(quantity, [Validators.required, Validators.min(1)]),
    });
  }

  // a free-typed string (not yet resolved to a product) is invalid
  private productValidator = (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    return value && typeof value === 'object' && value.id != null ? null : { productRequired: true };
  };

  private customerValidator = (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    return value && typeof value === 'object' && value.uuid != null ? null : { customerRequired: true };
  };
}

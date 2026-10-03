import { Component, HostListener, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { TranslatePipe } from '@ngx-translate/core';
import { MaterialModule } from 'src/app/material.module';
import { Product } from 'src/app/features/products/product.models';
import { ProductService } from 'src/app/services/product.service';
import { formatMdl, toCents, toMdl } from 'src/app/shared/money/money.util';

export type PickerGroupBy = 'CATEGORY' | 'GAMMA' | 'BRAND';

export interface PickedProduct {
  product: Product;
  unitPrice: number;
  quantity: number;
}

interface PickerGroup {
  key: string;
  label: string;
  products: Product[];
}

const OTHER_GROUP_KEY = '__OTHER__';
const CATALOG_PAGE_SIZE = 1000;

@Component({
  selector: 'app-product-picker-dialog',
  standalone: true,
  imports: [MaterialModule, FormsModule, TranslatePipe],
  templateUrl: './product-picker-dialog.component.html',
})
export class ProductPickerDialogComponent implements OnInit {
  products: Product[] = [];
  groupBy: PickerGroupBy = 'CATEGORY';
  search = '';
  loading = true;
  errorMessage = '';

  selected: Product | null = null;
  quantity = 1;
  priceMdl: number | null = null;

  picked: PickedProduct[] = [];
  collapsedGroups = new Set<string>();
  highlightedId: number | null = null;

  readonly otherGroupKey = OTHER_GROUP_KEY;

  constructor(
    private readonly productService: ProductService,
    private readonly dialogRef: MatDialogRef<ProductPickerDialogComponent, PickedProduct[]>,
  ) {}

  ngOnInit(): void {
    this.productService.getAll(0, CATALOG_PAGE_SIZE, 'name', 'asc').subscribe({
      next: (response) => {
        this.products = response.content;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'POS.PICKER_LOAD_FAILED';
      },
    });
  }

  get groups(): PickerGroup[] {
    const matching = this.filterProducts();
    const byKey = new Map<string, PickerGroup>();

    for (const product of matching) {
      const key = this.groupKey(product);
      const label = this.groupLabel(product);
      const group = byKey.get(key);
      if (group) {
        group.products.push(product);
        continue;
      }

      byKey.set(key, { key, label, products: [product] });
    }

    return [...byKey.values()].sort((left, right) => {
      if (left.key === OTHER_GROUP_KEY) {
        return 1;
      }
      if (right.key === OTHER_GROUP_KEY) {
        return -1;
      }

      return left.label.localeCompare(right.label);
    });
  }

  get visibleProducts(): Product[] {
    return this.groups
      .filter((group) => !this.collapsedGroups.has(group.key))
      .flatMap((group) => group.products);
  }

  get addedCount(): number {
    return this.picked.reduce((sum, pick) => sum + pick.quantity, 0);
  }

  get hasOwnPrice(): boolean {
    return this.selected?.price !== null && this.selected?.price !== undefined;
  }

  get suggestedPriceMdl(): number | null {
    const gammaPrice = this.selected?.gamma?.price;
    if (gammaPrice === null || gammaPrice === undefined) {
      return null;
    }

    return toMdl(gammaPrice);
  }

  get canAdd(): boolean {
    if (!this.selected || this.quantity < 1) {
      return false;
    }

    if (this.hasOwnPrice) {
      return true;
    }

    return this.priceMdl !== null && this.priceMdl >= 0;
  }

  isCollapsed(group: PickerGroup): boolean {
    return this.collapsedGroups.has(group.key);
  }

  toggleGroup(group: PickerGroup): void {
    if (this.collapsedGroups.has(group.key)) {
      this.collapsedGroups.delete(group.key);
      return;
    }

    this.collapsedGroups.add(group.key);
  }

  onGroupByChange(): void {
    this.collapsedGroups.clear();
    this.highlightedId = null;
  }

  isHighlighted(product: Product): boolean {
    return this.highlightedId === product.id;
  }

  select(product: Product): void {
    this.selected = product;
    this.quantity = 1;
    this.priceMdl = this.suggestedPriceMdl;
    this.highlightedId = product.id;
  }

  changeQuantity(delta: number): void {
    this.quantity = Math.max(1, this.quantity + delta);
  }

  format(cents: number | null | undefined): string {
    if (cents === null || cents === undefined) {
      return '';
    }

    return formatMdl(cents);
  }

  add(): void {
    if (!this.canAdd || !this.selected) {
      return;
    }

    const unitPrice = this.hasOwnPrice ? this.selected.price! : toCents(this.priceMdl!);
    const existing = this.picked.find((pick) => pick.product.id === this.selected!.id && pick.unitPrice === unitPrice);
    if (existing) {
      existing.quantity += this.quantity;
    } else {
      this.picked.push({ product: this.selected, unitPrice, quantity: this.quantity });
    }

    this.selected = null;
    this.quantity = 1;
    this.priceMdl = null;
  }

  done(): void {
    this.dialogRef.close(this.picked);
  }

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    const visible = this.visibleProducts;
    if (visible.length === 0) {
      return;
    }

    const current = visible.findIndex((product) => product.id === this.highlightedId);

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.highlightedId = visible[Math.min(visible.length - 1, current + 1)].id;
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.highlightedId = visible[Math.max(0, current - 1)].id;
      return;
    }

    if (event.key === 'Enter' && current >= 0) {
      event.preventDefault();
      this.select(visible[current]);
    }
  }

  private filterProducts(): Product[] {
    const term = this.search.trim().toLowerCase();
    if (!term) {
      return this.products;
    }

    return this.products.filter((product) => product.name.toLowerCase().includes(term));
  }

  private groupKey(product: Product): string {
    if (this.groupBy === 'GAMMA') {
      return product.gamma ? `gamma-${product.gamma.id}` : OTHER_GROUP_KEY;
    }

    if (this.groupBy === 'BRAND') {
      return product.brand ? `brand-${product.brand.id}` : OTHER_GROUP_KEY;
    }

    return product.category ? `category-${product.category.id}` : OTHER_GROUP_KEY;
  }

  private groupLabel(product: Product): string {
    if (this.groupBy === 'GAMMA') {
      return product.gamma?.name ?? '';
    }

    if (this.groupBy === 'BRAND') {
      return product.brand?.name ?? '';
    }

    return product.category?.name ?? '';
  }
}

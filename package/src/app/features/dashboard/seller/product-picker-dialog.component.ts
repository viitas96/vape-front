import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { TranslatePipe } from '@ngx-translate/core';
import { MaterialModule } from 'src/app/material.module';
import { Product } from 'src/app/features/products/product.models';
import { CategoryIconComponent } from 'src/app/features/product-group-categories/category-icon.component';
import { ProductGroupCategory } from 'src/app/features/product-group-categories/product-group-category.models';
import { ProductService } from 'src/app/services/product.service';
import { formatMdl, toCents, toMdl } from 'src/app/shared/money/money.util';

export type PickerGroupBy = 'CATEGORY' | 'GAMMA' | 'BRAND' | 'BRAND_CATEGORY_GAMMA';

export interface PickedProduct {
  product: Product;
  unitPrice: number;
  quantity: number;
}

type PickerDimension = 'CATEGORY' | 'GAMMA' | 'BRAND';

interface PickerGroup {
  key: string;
  label: string;
  icon: ProductGroupCategory;
  productCount: number;
}

const OTHER_GROUP_KEY = '__OTHER__';
const PRODUCT_KEY_PREFIX = 'product-';
const CATALOG_PAGE_SIZE = 1000;
const NAVIGATION_KEYS = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Enter', 'Backspace'];

const GROUP_BY_LEVELS: Record<PickerGroupBy, PickerDimension[]> = {
  CATEGORY: ['CATEGORY'],
  GAMMA: ['GAMMA'],
  BRAND: ['BRAND'],
  BRAND_CATEGORY_GAMMA: ['BRAND', 'CATEGORY', 'GAMMA'],
};

const ROOT_LABELS: Record<PickerDimension, string> = {
  CATEGORY: 'POS.PICKER_ALL_CATEGORIES',
  GAMMA: 'POS.PICKER_ALL_GAMMAS',
  BRAND: 'POS.PICKER_ALL_BRANDS',
};

@Component({
  selector: 'app-product-picker-dialog',
  standalone: true,
  imports: [MaterialModule, FormsModule, TranslatePipe, CategoryIconComponent],
  templateUrl: './product-picker-dialog.component.html',
  styleUrls: ['./product-picker-dialog.component.scss'],
})
export class ProductPickerDialogComponent implements OnInit {
  @ViewChild('tileGrid') tileGrid?: ElementRef<HTMLElement>;

  products: Product[] = [];
  groupBy: PickerGroupBy = 'CATEGORY';
  path: PickerGroup[] = [];
  search = '';
  loading = true;
  errorMessage = '';

  selected: Product | null = null;
  quantity = 1;
  priceMdl: number | null = null;

  picked: PickedProduct[] = [];
  highlightedKey: string | null = null;

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

  get levels(): PickerDimension[] {
    return GROUP_BY_LEVELS[this.groupBy];
  }

  get isSearching(): boolean {
    return this.search.trim().length > 0;
  }

  get showGroups(): boolean {
    return !this.isSearching && this.path.length < this.levels.length;
  }

  get isAtRoot(): boolean {
    return !this.isSearching && this.path.length === 0;
  }

  get groups(): PickerGroup[] {
    if (!this.showGroups) {
      return [];
    }

    const dimension = this.levels[this.path.length];
    const byKey = new Map<string, PickerGroup>();

    for (const product of this.productsInPath()) {
      const key = this.groupKey(dimension, product);
      const group = byKey.get(key) ?? this.createGroup(dimension, key, product);
      group.productCount++;
      byKey.set(key, group);
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
    if (this.isSearching) {
      const term = this.search.trim().toLowerCase();
      return this.products.filter((product) => product.name.toLowerCase().includes(term));
    }

    if (this.showGroups) {
      return [];
    }

    return this.productsInPath();
  }

  get rootLabel(): string {
    return ROOT_LABELS[this.levels[0]];
  }

  get addedCount(): number {
    return this.picked.reduce((sum, pick) => sum + pick.quantity, 0);
  }

  get hasOwnPrice(): boolean {
    return this.hasPrice(this.selected);
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

  hasPrice(product: Product | null): boolean {
    return product?.price !== null && product?.price !== undefined;
  }

  productKey(product: Product): string {
    return `${PRODUCT_KEY_PREFIX}${product.id}`;
  }

  openGroup(group: PickerGroup): void {
    this.path = [...this.path, group];
    this.highlightedKey = null;
  }

  goToLevel(level: number): void {
    this.highlightedKey = this.path[level]?.key ?? null;
    this.path = this.path.slice(0, level);
    this.search = '';
  }

  goBack(): void {
    this.goToLevel(Math.max(0, this.path.length - 1));
  }

  onSearchChange(): void {
    this.highlightedKey = null;
  }

  onGroupByChange(): void {
    this.path = [];
    this.highlightedKey = null;
  }

  isHighlighted(key: string): boolean {
    return this.highlightedKey === key;
  }

  isSelected(product: Product): boolean {
    return this.selected?.id === product.id;
  }

  select(product: Product): void {
    this.selected = product;
    this.quantity = 1;
    this.priceMdl = this.suggestedPriceMdl;
    this.highlightedKey = this.productKey(product);
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
    if (!NAVIGATION_KEYS.includes(event.key) || !this.isNavigationTarget(event)) {
      return;
    }

    if (event.key === 'Backspace') {
      if (!this.isAtRoot && !this.isSearching) {
        event.preventDefault();
        this.goBack();
      }
      return;
    }

    const keys = this.tileKeys();
    if (keys.length === 0) {
      return;
    }

    const current = keys.findIndex((key) => key === this.highlightedKey);
    if (event.key === 'Enter') {
      if (current >= 0) {
        event.preventDefault();
        this.activate(keys[current]);
      }
      return;
    }

    event.preventDefault();
    const next = Math.min(keys.length - 1, Math.max(0, current + this.navigationStep(event.key)));
    this.highlightedKey = keys[next];
    this.scrollHighlightedIntoView();
  }

  private productsInPath(): Product[] {
    return this.products.filter((product) =>
      this.path.every((group, level) => this.groupKey(this.levels[level], product) === group.key),
    );
  }

  private tileKeys(): string[] {
    if (this.showGroups) {
      return this.groups.map((group) => group.key);
    }

    return this.visibleProducts.map((product) => this.productKey(product));
  }

  private activate(key: string): void {
    const group = this.groups.find((candidate) => candidate.key === key);
    if (group) {
      this.openGroup(group);
      return;
    }

    const product = this.visibleProducts.find((candidate) => this.productKey(candidate) === key);
    if (product) {
      this.select(product);
    }
  }

  private isNavigationTarget(event: KeyboardEvent): boolean {
    const target = event.target as HTMLElement;
    if (target.closest('mat-button-toggle-group')) {
      return false;
    }

    if (target.tagName !== 'INPUT') {
      return true;
    }

    const isSearch = target.classList.contains('picker-search-input');
    return isSearch && ['ArrowUp', 'ArrowDown', 'Enter'].includes(event.key);
  }

  private navigationStep(key: string): number {
    if (this.highlightedKey === null) {
      return 1;
    }

    const columns = this.columnCount();
    const steps: Record<string, number> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -columns,
      ArrowDown: columns,
    };

    return steps[key] ?? 0;
  }

  private columnCount(): number {
    const grid = this.tileGrid?.nativeElement;
    if (!grid) {
      return 1;
    }

    const columns = getComputedStyle(grid).gridTemplateColumns.split(' ').filter((column) => column.length > 0);
    return Math.max(1, columns.length);
  }

  private scrollHighlightedIntoView(): void {
    setTimeout(() => {
      this.tileGrid?.nativeElement.querySelector('.picker-tile-highlighted')?.scrollIntoView({ block: 'nearest' });
    });
  }

  private createGroup(dimension: PickerDimension, key: string, product: Product): PickerGroup {
    const label = this.groupLabel(dimension, product);
    const group: PickerGroup = { key, label, icon: { id: 0, name: label, iconVersion: null }, productCount: 0 };
    if (dimension === 'CATEGORY' && product.category) {
      group.icon = product.category;
    }

    return group;
  }

  private groupKey(dimension: PickerDimension, product: Product): string {
    if (dimension === 'GAMMA') {
      return product.gamma ? `gamma-${product.gamma.id}` : OTHER_GROUP_KEY;
    }

    if (dimension === 'BRAND') {
      return product.brand ? `brand-${product.brand.id}` : OTHER_GROUP_KEY;
    }

    return product.category ? `category-${product.category.id}` : OTHER_GROUP_KEY;
  }

  private groupLabel(dimension: PickerDimension, product: Product): string {
    if (dimension === 'GAMMA') {
      return product.gamma?.name ?? '';
    }

    if (dimension === 'BRAND') {
      return product.brand?.name ?? '';
    }

    return product.category?.name ?? '';
  }
}

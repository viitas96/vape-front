import { Component, ElementRef, EventEmitter, HostListener, OnInit, Output, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { MaterialModule } from 'src/app/material.module';
import { Product } from 'src/app/features/products/product.models';
import { CategoryIconComponent } from 'src/app/features/product-group-categories/category-icon.component';
import { ProductGroupCategory } from 'src/app/features/product-group-categories/product-group-category.models';
import { ProductService } from 'src/app/services/product.service';
import { formatMdl } from 'src/app/shared/money/money.util';

export type PickerGroupBy = 'CATEGORY' | 'GAMMA' | 'BRAND' | 'BRAND_CATEGORY_GAMMA';

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
const NAVIGATION_KEYS = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Enter', 'Backspace', 'Escape'];

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

const GROUP_BY_LABELS: Record<PickerGroupBy, string> = {
  CATEGORY: 'PRODUCTS.CATEGORY',
  GAMMA: 'PRODUCTS.GAMMA',
  BRAND: 'PRODUCTS.BRAND',
  BRAND_CATEGORY_GAMMA: 'POS.PICKER_BRAND_CATEGORY_GAMMA',
};

@Component({
  selector: 'app-product-grid',
  standalone: true,
  imports: [MaterialModule, FormsModule, TranslatePipe, CategoryIconComponent],
  templateUrl: './product-grid.component.html',
  styleUrls: ['./product-grid.component.scss'],
})
export class ProductGridComponent implements OnInit {
  @ViewChild('tileGrid') tileGrid?: ElementRef<HTMLElement>;
  @ViewChild('searchInput') searchInput?: ElementRef<HTMLInputElement>;

  @Output() readonly productPicked = new EventEmitter<Product>();

  products: Product[] = [];
  groupBy: PickerGroupBy = 'CATEGORY';
  path: PickerGroup[] = [];
  search = '';
  loading = true;
  errorMessage = '';
  highlightedKey: string | null = null;

  readonly otherGroupKey = OTHER_GROUP_KEY;
  readonly groupByOptions = Object.keys(GROUP_BY_LEVELS) as PickerGroupBy[];

  constructor(private readonly productService: ProductService) {}

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

  groupByLabel(option: PickerGroupBy): string {
    return GROUP_BY_LABELS[option];
  }

  hasPrice(product: Product): boolean {
    return product.price !== null && product.price !== undefined;
  }

  format(cents: number | null | undefined): string {
    if (cents === null || cents === undefined) {
      return '';
    }

    return formatMdl(cents);
  }

  productKey(product: Product): string {
    return `${PRODUCT_KEY_PREFIX}${product.id}`;
  }

  focusSearch(): void {
    this.searchInput?.nativeElement.focus();
    this.searchInput?.nativeElement.select();
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

  pick(product: Product): void {
    this.highlightedKey = this.productKey(product);
    this.productPicked.emit(product);
  }

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (!NAVIGATION_KEYS.includes(event.key) || !this.isNavigationTarget(event)) {
      return;
    }

    if (event.key === 'Escape') {
      if (this.isSearching) {
        event.preventDefault();
        this.search = '';
        return;
      }
      if (!this.isAtRoot) {
        event.preventDefault();
        this.goBack();
      }
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
      if (current >= 0 || this.isSearching) {
        event.preventDefault();
        this.activate(keys[Math.max(current, 0)]);
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
      this.pick(product);
    }
  }

  private isNavigationTarget(event: KeyboardEvent): boolean {
    const target = event.target as HTMLElement;
    if (target.closest('mat-select, .mat-mdc-select')) {
      return false;
    }

    if (target.tagName !== 'INPUT') {
      return true;
    }

    const isSearch = target.classList.contains('product-grid-search-input');
    return isSearch && ['ArrowUp', 'ArrowDown', 'Enter', 'Escape'].includes(event.key);
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
      this.tileGrid?.nativeElement.querySelector('.grid-tile-highlighted')?.scrollIntoView({ block: 'nearest' });
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

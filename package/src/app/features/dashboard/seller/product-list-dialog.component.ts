import { Component, ElementRef, EventEmitter, HostListener, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { MaterialModule } from 'src/app/material.module';
import { Product } from 'src/app/features/products/product.models';
import { ProductService } from 'src/app/services/product.service';
import { formatMdl } from 'src/app/shared/money/money.util';
import { PickedProduct, ProductPickerDialog } from './pos.models';
import { QuantityPromptService } from './quantity-prompt.service';

export type ProductListGroupBy = 'CATEGORY' | 'GAMMA' | 'BRAND';

interface ProductListGroup {
  key: string;
  label: string;
  products: Product[];
}

const OTHER_GROUP_KEY = '__OTHER__';
const CATALOG_PAGE_SIZE = 1000;

@Component({
  selector: 'app-product-list-dialog',
  standalone: true,
  imports: [MaterialModule, FormsModule, TranslatePipe],
  templateUrl: './product-list-dialog.component.html',
  styleUrls: ['./product-list-dialog.component.scss'],
})
export class ProductListDialogComponent implements ProductPickerDialog, OnInit {
  @ViewChild('productList') productList?: ElementRef<HTMLElement>;

  readonly productAdded = new EventEmitter<PickedProduct>();

  products: Product[] = [];
  groupBy: ProductListGroupBy = 'CATEGORY';
  search = '';
  loading = true;
  errorMessage = '';
  addedCount = 0;
  collapsedGroups = new Set<string>();
  highlightedId: number | null = null;

  readonly otherGroupKey = OTHER_GROUP_KEY;

  constructor(
    private readonly productService: ProductService,
    private readonly quantityPrompt: QuantityPromptService,
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

  get groups(): ProductListGroup[] {
    const byKey = new Map<string, ProductListGroup>();

    for (const product of this.filterProducts()) {
      const key = this.groupKey(product);
      const group = byKey.get(key);
      if (group) {
        group.products.push(product);
        continue;
      }

      byKey.set(key, { key, label: this.groupLabel(product), products: [product] });
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
      .filter((group) => !this.isCollapsed(group))
      .flatMap((group) => group.products);
  }

  isCollapsed(group: ProductListGroup): boolean {
    return this.collapsedGroups.has(group.key);
  }

  toggleGroup(group: ProductListGroup): void {
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

  hasPrice(product: Product): boolean {
    return product.price !== null && product.price !== undefined;
  }

  format(cents: number): string {
    return formatMdl(cents);
  }

  pick(product: Product): void {
    this.highlightedId = product.id;
    this.quantityPrompt.ask(product).subscribe((picked) => {
      this.addedCount += picked.quantity;
      this.productAdded.emit(picked);
    });
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
      this.highlight(visible[Math.min(visible.length - 1, current + 1)]);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.highlight(visible[Math.max(0, current - 1)]);
      return;
    }

    if (event.key === 'Enter' && current >= 0) {
      event.preventDefault();
      this.pick(visible[current]);
    }
  }

  private highlight(product: Product): void {
    this.highlightedId = product.id;
    setTimeout(() => {
      const row = this.productList?.nativeElement.querySelector(`[data-product-id="${product.id}"]`);
      row?.scrollIntoView({ block: 'nearest' });
    });
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

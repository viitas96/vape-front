import { Component, Input } from '@angular/core';
import { ProductGroupCategoryService } from 'src/app/services/product-group-category.service';
import { ProductGroupCategory } from './product-group-category.models';

const FALLBACK_COLORS = ['#5d87ff', '#13deb9', '#ffae1f', '#fa896b', '#539bff', '#8965e5', '#49beff'];

@Component({
  selector: 'app-category-icon',
  standalone: true,
  template: `
    @if (src) {
      <img class="category-icon" [src]="src" [alt]="category?.name ?? ''" [style.width.px]="size" [style.height.px]="size" />
    } @else {
      <span
        class="category-icon category-icon-fallback"
        [style.width.px]="size"
        [style.height.px]="size"
        [style.font-size.px]="size * 0.45"
        [style.background]="fallbackColor"
      >{{ initial }}</span>
    }
  `,
  styles: `
    :host {
      display: inline-flex;
      flex-shrink: 0;
    }

    .category-icon {
      border-radius: 8px;
      object-fit: contain;
    }

    .category-icon-fallback {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-weight: 700;
      text-transform: uppercase;
    }
  `,
})
export class CategoryIconComponent {
  @Input() category: ProductGroupCategory | null | undefined;
  @Input() size = 32;
  @Input() previewUrl: string | null = null;

  constructor(private readonly productGroupCategoryService: ProductGroupCategoryService) {}

  get src(): string | null {
    if (this.previewUrl) {
      return this.previewUrl;
    }

    if (!this.category) {
      return null;
    }

    return this.productGroupCategoryService.iconUrl(this.category);
  }

  get initial(): string {
    return this.category?.name?.charAt(0) ?? '?';
  }

  get fallbackColor(): string {
    const name = this.category?.name ?? '';
    const hash = [...name].reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return FALLBACK_COLORS[hash % FALLBACK_COLORS.length];
  }
}

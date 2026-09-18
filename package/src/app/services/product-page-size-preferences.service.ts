import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ProductPageSizePreferencesService {
  private static readonly STORAGE_KEY = 'product-page-size';

  getPageSize(): number | null {
    const storedPageSize = localStorage.getItem(ProductPageSizePreferencesService.STORAGE_KEY);
    if (!storedPageSize) {
      return null;
    }

    const pageSize = Number(storedPageSize);
    if (!Number.isInteger(pageSize) || pageSize <= 0) {
      return null;
    }

    return pageSize;
  }

  savePageSize(pageSize: number): void {
    localStorage.setItem(ProductPageSizePreferencesService.STORAGE_KEY, pageSize.toString());
  }
}

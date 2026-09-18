import { Injectable } from '@angular/core';

export interface ProductCreationPreferences {
  groupId: number | null;
  gammaId: number | null;
}

@Injectable({ providedIn: 'root' })
export class ProductCreationPreferencesService {
  private static readonly STORAGE_KEY = 'product-creation-dropdown-preferences';

  getPreferences(): ProductCreationPreferences | null {
    const storedPreferences = localStorage.getItem(ProductCreationPreferencesService.STORAGE_KEY);
    if (!storedPreferences) {
      return null;
    }

    try {
      const preferences: unknown = JSON.parse(storedPreferences);
      if (!this.isProductCreationPreferences(preferences)) {
        return null;
      }

      return preferences;
    } catch {
      return null;
    }
  }

  savePreferences(preferences: ProductCreationPreferences): void {
    localStorage.setItem(ProductCreationPreferencesService.STORAGE_KEY, JSON.stringify(preferences));
  }

  clearPreferences(): void {
    localStorage.removeItem(ProductCreationPreferencesService.STORAGE_KEY);
  }

  private isProductCreationPreferences(value: unknown): value is ProductCreationPreferences {
    if (typeof value !== 'object' || value === null) {
      return false;
    }

    const preferences = value as Record<string, unknown>;
    return this.isNullableId(preferences['groupId']) && this.isNullableId(preferences['gammaId']);
  }

  private isNullableId(value: unknown): value is number | null {
    return value === null || (typeof value === 'number' && Number.isInteger(value) && value > 0);
  }
}

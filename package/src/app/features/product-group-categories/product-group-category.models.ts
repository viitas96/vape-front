export interface ProductGroupCategory {
  id: number;
  name: string;
  systemName?: string;
  iconVersion?: string | null;
}

export interface ProductGroupCategoryDTO {
  name: string;
  systemName?: string;
}

export interface ProductGroupCategoryDialogResult {
  dto: ProductGroupCategoryDTO;
  icon: File | null;
  removeIcon: boolean;
}

export const CATEGORY_ICON_MAX_BYTES = 2 * 1024 * 1024;
export const CATEGORY_ICON_TYPES = ['image/png', 'image/jpeg'];

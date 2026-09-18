export interface ProductGroupCategory {
  id: number;
  name: string;
  systemName?: string;
}

export interface ProductGroupCategoryDTO {
  name: string;
  systemName?: string;
}

export interface ProductGroup {
  id: number;
  name: string;
  category: ProductGroupCategory;
}

export interface ProductGroupDTO {
  name: string;
  categoryId: number;
}

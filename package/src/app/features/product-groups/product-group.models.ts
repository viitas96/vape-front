export type ProductGroupCategory = 'GENERAL_GOODS' | 'SOUVENIR';

export interface ProductGroup {
  id: number;
  name: string;
  category: ProductGroupCategory;
}

export interface ProductGroupDTO {
  name: string;
  category: ProductGroupCategory;
}
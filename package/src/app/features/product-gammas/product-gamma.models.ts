import { ProductGroupCategory } from '../product-group-categories/product-group-category.models';

export interface ProductGamma {
  id: number;
  name: string;
  price: number | null;
  category?: ProductGroupCategory;
}

export interface ProductGammaDTO {
  name: string;
  price?: number;
  categoryId?: number;
}

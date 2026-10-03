import { ProductGroupCategory } from '../product-group-categories/product-group-category.models';
import { ProductGamma } from '../product-gammas/product-gamma.models';
import { Brand } from '../brands/brand.models';

export interface Product {
  id: number;
  name: string;
  price: number | null;
  stock?: number;
  drinkStampEligible?: boolean;
  itemCode?: string;
  barcode?: string;
  matrixBarcode?: string;
  qrCode?: string;
  category?: ProductGroupCategory;
  gamma?: ProductGamma;
  brand?: Brand;
}

export interface ProductDTO {
  name: string;
  price?: number;
  itemCode?: string;
  barcode?: string;
  matrixBarcode?: string;
  qrCode?: string;
  categoryId?: number;
  gammaId?: number;
  brandId?: number;
  drinkStampEligible?: boolean;
}

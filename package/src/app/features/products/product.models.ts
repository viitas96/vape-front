import { ProductGroupCategory } from '../product-groups/product-group.models';
import { ProductGamma } from '../product-gammas/product-gamma.models';

export interface ProductGroupSummary {
  id: number;
  name: string;
  category?: ProductGroupCategory;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  stock?: number;
  itemCode?: string;
  barcode?: string;
  matrixBarcode?: string;
  qrCode?: string;
  group?: ProductGroupSummary;
  gamma?: ProductGamma;
}

export interface ProductDTO {
  name: string;
  price: number;
  itemCode?: string;
  barcode?: string;
  matrixBarcode?: string;
  qrCode?: string;
  groupId?: number;
  gammaId?: number;
}

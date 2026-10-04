import { ProductGroupCategory } from '../product-group-categories/product-group-category.models';
import { ProductGamma } from '../product-gammas/product-gamma.models';
import { Brand } from '../brands/brand.models';

export interface Product {
  id: number;
  name: string;
  price: number | null;
  stock?: number;
  costPrice?: number | null;
  vatRate?: number | null;
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
  costPrice?: number;
  vatRate?: number;
  stock?: number;
  itemCode?: string;
  barcode?: string;
  matrixBarcode?: string;
  qrCode?: string;
  categoryId?: number;
  gammaId?: number;
  brandId?: number;
  drinkStampEligible?: boolean;
}

export type StockMovementType = 'SALE' | 'SALE_REVERSAL' | 'REFUND' | 'ADJUSTMENT';

export interface StockMovement {
  id: number;
  productId: number;
  type: StockMovementType;
  quantity: number;
  stockAfter: number;
  orderId: number | null;
  refundId: number | null;
  comment: string | null;
  createdBy: string;
  createdAt: string;
}

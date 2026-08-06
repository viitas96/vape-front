import { OrderItemDTO, Order } from '../../orders/order.models';
import { Product } from '../../products/product.models';

export interface CustomerScan {
  id: number;
  uuid: string;
  email: string;
  roles: string[];
  banned: boolean;
  dateOfBirth: string | null;
  pointsBalance: number;
}

export interface ScanResult {
  type: 'PRODUCT' | 'CUSTOMER';
  data: Product | CustomerScan;
}

export interface PosCheckoutDTO {
  customerId?: string;
  usePoints?: boolean;
  items: OrderItemDTO[];
}

export type PosCheckoutResponse = Order;
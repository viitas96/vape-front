import { OrderItemDTO, Order } from '../../orders/order.models';
import { Product } from '../../products/product.models';

export interface CustomerScan {
  id: number;
  uuid: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  roles: string[];
  banned: boolean;
  dateOfBirth: string | null;
  pointsBalance: number;
  drinkCount: number;
  freeDrinksAvailable: number;
}

export interface ScanResult {
  type: 'PRODUCT' | 'CUSTOMER';
  data: Product | CustomerScan;
}

export interface PosCheckoutDTO {
  customerId?: string;
  usePoints?: boolean;
  cashAmount?: number;
  cardAmount?: number;
  freeDrinksRedeemed?: number;
  items: OrderItemDTO[];
}

export type PosCheckoutResponse = Order;
export type OrderStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED';

export type PaymentMethod = 'CASH' | 'CARD' | 'SPLIT';

export interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  netLineTotal?: number;
  refundedQuantity?: number;
}

export type RefundStatus = 'NONE' | 'PARTIALLY_REFUNDED' | 'REFUNDED';

export interface RefundItem {
  id: number;
  orderItemId: number;
  productId: number;
  productName: string;
  quantity: number;
  amount: number;
  discount: number;
}

export interface Refund {
  id: number;
  orderId: number;
  shiftId?: number | null;
  total: number;
  cashAmount: number;
  cardAmount: number;
  pointsReturned: number;
  pointsRevoked: number;
  reason?: string | null;
  items: RefundItem[];
  createdBy: string;
  createdAt: string;
}

export interface RefundDTO {
  items: { orderItemId: number; quantity: number }[];
  reason?: string;
}

export interface Order {
  id: number;
  status: OrderStatus;
  total: number;
  customerId?: string;
  pointsUsed?: number;
  pointsEarned?: number;
  discount?: number;
  cashAmount?: number;
  cardAmount?: number;
  paymentMethod?: PaymentMethod;
  freeDrinksRedeemed?: number;
  shiftId?: number | null;
  items: OrderItem[];
  refundStatus?: RefundStatus;
  createdBy: string;
  createdAt: string;
  lastModifiedBy?: string;
  lastModifiedAt?: string;
}

export interface OrderItemDTO {
  productId: number;
  unitPrice?: number;
  quantity: number;
}

export interface OrderDTO {
  status?: OrderStatus;
  customerId?: string | null;
  items: OrderItemDTO[];
  usePoints: boolean;
}
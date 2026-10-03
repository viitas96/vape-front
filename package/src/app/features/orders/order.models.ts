export type OrderStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED';

export type PaymentMethod = 'CASH' | 'CARD' | 'SPLIT';

export interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
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
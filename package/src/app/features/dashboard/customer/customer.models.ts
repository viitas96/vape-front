export interface MyOrderItem {
  productName: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface MyProfile {
  id: number;
  uuid: string;
  email: string;
  roles: string[];
  banned: boolean;
  dateOfBirth: string | null;
  pointsBalance: number;
}

export interface MyOrder {
  id: number;
  status: string;
  total: number;
  createdAt: string;
  items: MyOrderItem[];
}

export interface Promotion {
  id: number;
  title: string;
  body: string;
  active: boolean;
}

export interface PromotionDTO {
  title: string;
  body: string;
  active: boolean;
}
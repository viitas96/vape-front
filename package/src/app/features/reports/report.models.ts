export type PaymentType = 'CASH' | 'CARD' | 'POINTS';

export type ReportTab = 'items' | 'categories' | 'employees' | 'payment-types' | 'taxes' | 'inventory';

export type OneCOperationType = 'SALES' | 'RETURNS';

export interface ReportPeriod {
  from: string;
  to: string;
}

export interface DailySales {
  date: string;
  receiptsCount: number;
  grossSales: number;
  pointsDiscount: number;
  netSales: number;
  cashPayments: number;
  cardPayments: number;
  averageReceipt: number;
  refunds: number;
  netRevenue: number;
  grossProfit: number;
}

export interface SalesSummary {
  from: string;
  to: string;
  receiptsCount: number;
  shiftsCount: number;
  grossSales: number;
  pointsDiscount: number;
  netSales: number;
  averageReceipt: number;
  cashPayments: number;
  cardPayments: number;
  pointsUsed: number;
  pointsEarned: number;
  freeDrinksRedeemed: number;
  refundsCount: number;
  refunds: number;
  cashRefunds: number;
  cardRefunds: number;
  netRevenue: number;
  costOfGoods: number;
  grossProfit: number;
  vatAmount: number;
  itemsWithoutCost: number;
  daily: DailySales[];
}

export interface SalesTotals {
  quantity: number;
  grossSales: number;
  pointsDiscount: number;
  netSales: number;
  quantityRefunded: number;
  refunds: number;
  netRevenue: number;
  costOfGoods: number;
  grossProfit: number;
}

export interface TaxSales {
  vatRate: number;
  netSales: number;
  refunds: number;
  taxableAmount: number;
  vatAmount: number;
  amountWithoutVat: number;
}

export interface InventoryItem {
  productId: number;
  productName: string;
  categoryName: string | null;
  stock: number;
  costPrice: number | null;
  price: number | null;
  costValue: number;
  retailValue: number;
  potentialProfit: number;
}

export interface InventoryValuation {
  totalUnits: number;
  costValue: number;
  retailValue: number;
  potentialProfit: number;
  productsWithoutCost: number;
  items: InventoryItem[];
}

export interface ItemSales extends SalesTotals {
  productId: number | null;
  productName: string | null;
  categoryName: string | null;
  brandName: string | null;
}

export interface CategorySales extends SalesTotals {
  categoryId: number | null;
  categoryName: string | null;
  sharePercent: number;
}

export interface EmployeeSales {
  seller: string;
  name: string | null;
  receiptsCount: number;
  shiftsCount: number;
  grossSales: number;
  pointsDiscount: number;
  netSales: number;
  averageReceipt: number;
}

export interface PaymentTypeSales {
  type: PaymentType;
  receiptsCount: number;
  amount: number;
  refunded: number;
  netAmount: number;
  sharePercent: number;
}

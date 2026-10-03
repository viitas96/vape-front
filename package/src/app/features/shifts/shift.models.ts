export type ShiftStatus = 'OPEN' | 'CLOSED';

export type CashMovementType = 'PAY_IN' | 'PAY_OUT';

export interface Shift {
  id: number;
  status: ShiftStatus;
  openedBy: string;
  openedAt: string;
  closedBy?: string | null;
  closedAt?: string | null;
  durationMinutes: number;
  startingCash: number;
  expectedCash?: number | null;
  actualCash?: number | null;
  cashDifference?: number | null;
}

export interface CashMovement {
  id: number;
  type: CashMovementType;
  amount: number;
  comment?: string | null;
  createdBy?: string | null;
  createdAt: string;
}

export interface ShiftReport {
  shiftId: number;
  status: ShiftStatus;
  openedBy: string;
  openedAt: string;
  closedBy?: string | null;
  closedAt?: string | null;
  durationMinutes: number;
  receiptsCount: number;
  grossSales: number;
  pointsDiscount: number;
  netSales: number;
  pointsUsed: number;
  pointsEarned: number;
  startingCash: number;
  cashPayments: number;
  cardPayments: number;
  pointsPayments: number;
  paidIn: number;
  paidOut: number;
  freeDrinksRedeemed: number;
  expectedCash?: number | null;
  actualCash?: number | null;
  difference?: number | null;
}

export interface ShiftOpenDTO {
  startingCash: number;
}

export interface ShiftCloseDTO {
  actualCash: number;
}

export interface CashMovementDTO {
  type: CashMovementType;
  amount: number;
  comment?: string;
}

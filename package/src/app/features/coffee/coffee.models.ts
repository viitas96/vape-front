export interface CoffeeCustomer {
  id: number;
  uuid: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  drinkCount: number;
  freeDrinksAvailable: number;
}

export interface DrinkStampTick {
  customerId: number;
  quantity: number;
}

export interface DrinkStampEventResponse {
  eventId: number;
  drinkCount: number;
  freeDrinksAvailable: number;
}

export type DrinkStampEventType = 'STAMP' | 'REDEEM';

export interface DrinkStampHistoryItem {
  id: number;
  type: DrinkStampEventType;
  quantity: number;
  createdAt: string;
}

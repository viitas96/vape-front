export interface StoreSettings {
  id: number;
  earnRatePercent: number;
  spendRate: number;
  goodsPointsCapPercent: number;
  souvenirSplitPercent: number;
  shiftManagementEnabled: boolean;
  freeDrinkThreshold: number;
  defaultVatRate: number;
  inventoryTrackingEnabled: boolean;
}

export type StoreSettingsUpdate = Omit<StoreSettings, 'id'>;
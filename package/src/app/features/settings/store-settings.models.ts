export interface StoreSettings {
  id: number;
  earnRatePercent: number;
  spendRate: number;
  goodsPointsCapPercent: number;
  souvenirSplitPercent: number;
}

export type StoreSettingsUpdate = Omit<StoreSettings, 'id'>;
import { toIsoDate } from './date.util';

export type DateRangePreset = 'TODAY' | 'YESTERDAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'LAST_MONTH';

export const DATE_RANGE_PRESETS: readonly DateRangePreset[] = ['TODAY', 'YESTERDAY', 'THIS_WEEK', 'THIS_MONTH', 'LAST_MONTH'];

export interface DateRange {
  from?: string;
  to?: string;
}

export function presetRange(preset: DateRangePreset, today = new Date()): Required<DateRange> {
  const year = today.getFullYear();
  const month = today.getMonth();
  const day = today.getDate();

  switch (preset) {
    case 'TODAY':
      return range(today, today);
    case 'YESTERDAY': {
      const yesterday = new Date(year, month, day - 1);
      return range(yesterday, yesterday);
    }
    case 'THIS_WEEK': {
      const daysSinceMonday = (today.getDay() + 6) % 7;
      return range(new Date(year, month, day - daysSinceMonday), today);
    }
    case 'THIS_MONTH':
      return range(new Date(year, month, 1), today);
    case 'LAST_MONTH':
      return range(new Date(year, month - 1, 1), new Date(year, month, 0));
  }
}

function range(from: Date, to: Date): Required<DateRange> {
  return { from: toIsoDate(from), to: toIsoDate(to) };
}

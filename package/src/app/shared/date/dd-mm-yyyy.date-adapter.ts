import { Injectable } from '@angular/core';
import { NativeDateAdapter } from '@angular/material/core';

const DATE_PATTERN = /^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/;

@Injectable()
export class DdMmYyyyDateAdapter extends NativeDateAdapter {
  override parse(value: any, parseFormat?: any): Date | null {
    if (typeof value !== 'string') {
      return super.parse(value, parseFormat);
    }

    const match = DATE_PATTERN.exec(value.trim());
    if (!match) {
      return null;
    }

    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);

    if (month < 1 || month > 12) {
      return null;
    }

    const daysInMonth = this.getNumDaysInMonth(this.createDate(year, month - 1, 1));
    if (day < 1 || day > daysInMonth) {
      return null;
    }

    return this.createDate(year, month - 1, day);
  }

  override format(date: Date, displayFormat: Object): string {
    if (displayFormat !== 'input') {
      return super.format(date, displayFormat);
    }

    const day = String(this.getDate(date)).padStart(2, '0');
    const month = String(this.getMonth(date) + 1).padStart(2, '0');
    return `${day}/${month}/${this.getYear(date)}`;
  }
}

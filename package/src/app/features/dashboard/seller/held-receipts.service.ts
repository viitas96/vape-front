import { Injectable } from '@angular/core';
import { HeldReceipt } from './pos.models';

const STORAGE_KEY = 'pos.heldReceipts';

@Injectable({ providedIn: 'root' })
export class HeldReceiptsService {
  private receipts: HeldReceipt[] = this.load();

  get all(): HeldReceipt[] {
    return this.receipts;
  }

  get count(): number {
    return this.receipts.length;
  }

  hold(receipt: Omit<HeldReceipt, 'id' | 'heldAt'>): void {
    const held: HeldReceipt = {
      ...receipt,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      heldAt: new Date().toISOString(),
    };
    this.receipts = [held, ...this.receipts];
    this.save();
  }

  take(id: string): HeldReceipt | null {
    const receipt = this.receipts.find((candidate) => candidate.id === id) ?? null;
    this.remove(id);
    return receipt;
  }

  remove(id: string): void {
    this.receipts = this.receipts.filter((candidate) => candidate.id !== id);
    this.save();
  }

  private load(): HeldReceipt[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        return [];
      }

      const parsed: unknown = JSON.parse(stored);
      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed as HeldReceipt[];
    } catch {
      return [];
    }
  }

  private save(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.receipts));
    } catch {
      return;
    }
  }
}

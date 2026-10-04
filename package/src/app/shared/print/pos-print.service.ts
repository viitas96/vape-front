import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Order, Refund } from 'src/app/features/orders/order.models';
import { CashMovementType, ShiftReport } from 'src/app/features/shifts/shift.models';
import { formatMdl } from 'src/app/shared/money/money.util';
import { PrintService } from './print.service';
import { ReceiptBuilder } from './receipt-builder';

export interface BillLine {
  name: string;
  quantity: number;
  unitPrice: number;
  free: boolean;
}

export interface BillData {
  lines: BillLine[];
  grossTotal: number;
  discount: number;
  netTotal: number;
  customerEmail?: string | null;
}

export interface CashMovementSlipData {
  type: CashMovementType;
  amount: number;
  comment?: string | null;
  drawerAmount: number | null;
  author: string;
  createdAt: Date;
}

@Injectable({ providedIn: 'root' })
export class PosPrintService {
  constructor(
    private readonly printService: PrintService,
    private readonly translate: TranslateService,
  ) {}

  printSale(order: Order): void {
    const builder = this.header()
      .subtitle(this.t('PRINT.RECEIPT_TITLE', { id: order.id }))
      .row(this.t('PRINT.DATE'), this.date(order.createdAt))
      .row(this.t('PRINT.CASHIER'), order.createdBy)
      .optionalRow(this.t('PRINT.CUSTOMER'), order.customerEmail)
      .divider();

    for (const item of order.items) {
      builder.item(item.productName, `${item.quantity} × ${this.money(item.unitPrice)}`, this.money(item.lineTotal));
    }

    builder.divider();
    if (order.discount) {
      builder
        .row(this.t('POS.SUBTOTAL'), this.money(order.total + order.discount))
        .row(this.t('PRINT.POINTS_DISCOUNT', { points: order.pointsUsed ?? 0 }), `−${this.money(order.discount)}`);
    }

    builder
      .total(this.t('POS.TOTAL'), this.money(order.total))
      .optionalRow(this.t('PAYMENT.CASH'), this.positiveMoney(order.cashAmount))
      .optionalRow(this.t('PAYMENT.CARD'), this.positiveMoney(order.cardAmount))
      .optionalRow(this.t('PRINT.POINTS_EARNED'), order.pointsEarned || null)
      .divider()
      .muted(this.t('PRINT.NON_FISCAL'));

    this.printService.print(this.t('PRINT.RECEIPT_TITLE', { id: order.id }), builder.build());
  }

  printBill(bill: BillData): void {
    const builder = this.header()
      .subtitle(this.t('PRINT.BILL_TITLE'))
      .row(this.t('PRINT.DATE'), this.date(new Date()))
      .optionalRow(this.t('PRINT.CUSTOMER'), bill.customerEmail)
      .divider();

    for (const line of bill.lines) {
      const name = line.free ? `${line.name} · ${this.t('POS.FREE')}` : line.name;
      builder.item(name, `${line.quantity} × ${this.money(line.unitPrice)}`, this.money(line.unitPrice * line.quantity));
    }

    builder.divider();
    if (bill.discount > 0) {
      builder
        .row(this.t('POS.SUBTOTAL'), this.money(bill.grossTotal))
        .row(this.t('POS.DISCOUNT'), `−${this.money(bill.discount)}`);
    }

    builder
      .total(this.t('POS.TOTAL'), this.money(bill.netTotal))
      .divider()
      .muted(this.t('PRINT.NOT_PAID'));

    this.printService.print(this.t('PRINT.BILL_TITLE'), builder.build());
  }

  printCashMovement(slip: CashMovementSlipData): void {
    const titleKey = slip.type === 'PAY_IN' ? 'PRINT.PAY_IN_TITLE' : 'PRINT.PAY_OUT_TITLE';
    const builder = this.header()
      .subtitle(this.t(titleKey))
      .row(this.t('PRINT.DATE'), this.date(slip.createdAt))
      .row(this.t('PRINT.AUTHOR'), slip.author)
      .divider()
      .total(this.t('PRINT.AMOUNT'), this.money(slip.amount))
      .optionalRow(this.t('PRINT.COMMENT'), slip.comment)
      .optionalRow(this.t('PRINT.DRAWER_AMOUNT'), this.optionalMoney(slip.drawerAmount));

    this.printService.print(this.t(titleKey), builder.build());
  }

  printShiftReport(report: ShiftReport): void {
    const builder = this.header()
      .subtitle(this.t('PRINT.SHIFT_REPORT_TITLE', { id: report.shiftId }))
      .row(this.t('PRINT.OPENED'), `${this.date(report.openedAt)} · ${report.openedBy}`)
      .optionalRow(this.t('PRINT.CLOSED'), this.closedLine(report))
      .divider()
      .row(this.t('SHIFTS.RECEIPTS'), report.receiptsCount)
      .row(this.t('SHIFTS.GROSS_SALES'), this.money(report.grossSales))
      .row(this.t('SHIFTS.POINTS_DISCOUNT'), this.money(report.pointsDiscount))
      .total(this.t('SHIFTS.NET_SALES'), this.money(report.netSales))
      .row(this.t('PAYMENT.CASH'), this.money(report.cashPayments))
      .row(this.t('PAYMENT.CARD'), this.money(report.cardPayments))
      .row(this.t('SHIFTS.POINTS_USED'), report.pointsUsed)
      .row(this.t('SHIFTS.REFUNDS_COUNT'), report.refundsCount ?? 0)
      .row(this.t('SHIFTS.CASH_REFUNDS'), this.money(report.cashRefunds ?? 0))
      .row(this.t('SHIFTS.CARD_REFUNDS'), this.money(report.cardRefunds ?? 0))
      .divider()
      .row(this.t('SHIFTS.STARTING_CASH'), this.money(report.startingCash))
      .row(this.t('SHIFTS.PAID_IN'), this.money(report.paidIn))
      .row(this.t('SHIFTS.PAID_OUT'), this.money(report.paidOut))
      .optionalRow(this.t('SHIFTS.EXPECTED_CASH'), this.optionalMoney(report.expectedCash))
      .optionalRow(this.t('SHIFTS.ACTUAL_CASH'), this.optionalMoney(report.actualCash))
      .optionalRow(this.t('SHIFTS.DIFFERENCE'), this.optionalMoney(report.difference))
      .optionalRow(this.t('PRINT.LEFT_IN_DRAWER'), this.optionalMoney(report.actualCash));

    this.printService.print(this.t('PRINT.SHIFT_REPORT_TITLE', { id: report.shiftId }), builder.build());
  }

  printRefund(order: Order, refund: Refund, drawerAmount: number | null): void {
    const builder = this.header()
      .subtitle(this.t('PRINT.REFUND_TITLE', { id: refund.id, orderId: order.id }))
      .row(this.t('PRINT.DATE'), this.date(refund.createdAt))
      .row(this.t('PRINT.AUTHOR'), refund.createdBy)
      .optionalRow(this.t('PRINT.CUSTOMER'), order.customerEmail)
      .divider();

    for (const item of refund.items) {
      builder.item(item.productName, `${item.quantity}`, this.money(item.amount));
    }

    builder
      .divider()
      .total(this.t('PRINT.REFUNDED'), this.money(refund.total))
      .optionalRow(this.t('PAYMENT.CASH'), this.positiveMoney(refund.cashAmount))
      .optionalRow(this.t('PAYMENT.CARD'), this.positiveMoney(refund.cardAmount))
      .optionalRow(this.t('PRINT.POINTS_RETURNED'), refund.pointsReturned || null)
      .optionalRow(this.t('PRINT.POINTS_REVOKED'), refund.pointsRevoked || null)
      .optionalRow(this.t('PRINT.REASON'), refund.reason)
      .optionalRow(this.t('PRINT.DRAWER_AMOUNT'), this.optionalMoney(drawerAmount));

    this.printService.print(this.t('PRINT.REFUND_TITLE', { id: refund.id, orderId: order.id }), builder.build());
  }

  private closedLine(report: ShiftReport): string | null {
    if (!report.closedAt) {
      return null;
    }

    return `${this.date(report.closedAt)} · ${report.closedBy ?? ''}`;
  }

  private header(): ReceiptBuilder {
    return new ReceiptBuilder().title(this.t('PRINT.STORE_NAME')).divider();
  }

  private t(key: string, params?: Record<string, unknown>): string {
    return this.translate.instant(key, params);
  }

  private money(cents: number): string {
    return formatMdl(cents);
  }

  private optionalMoney(cents: number | null | undefined): string | null {
    if (cents === null || cents === undefined) {
      return null;
    }

    return formatMdl(cents);
  }

  private positiveMoney(cents: number | null | undefined): string | null {
    if (!cents) {
      return null;
    }

    return formatMdl(cents);
  }

  private date(value: string | Date): string {
    return new Date(value).toLocaleString('ro-RO');
  }
}

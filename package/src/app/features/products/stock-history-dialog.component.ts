import { DatePipe } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { MaterialModule } from 'src/app/material.module';
import { ProductService } from 'src/app/services/product.service';
import { StockMovement } from './product.models';

export interface StockHistoryDialogData {
  productId: number;
  productName: string;
}

@Component({
  selector: 'app-stock-history-dialog',
  standalone: true,
  imports: [MaterialModule, DatePipe, TranslatePipe],
  template: `
    <h2 mat-dialog-title>{{ 'PRODUCTS.STOCK_HISTORY' | translate }} · {{ data.productName }}</h2>

    <mat-dialog-content>
      @if (errorMessage) {
        <p class="text-danger f-s-14">{{ errorMessage }}</p>
      }

      <mat-table [dataSource]="movements">
        <ng-container matColumnDef="createdAt">
          <mat-header-cell *matHeaderCellDef>{{ 'ORDERS.CREATED_AT' | translate }}</mat-header-cell>
          <mat-cell *matCellDef="let m">{{ m.createdAt | date:'short' }}</mat-cell>
        </ng-container>
        <ng-container matColumnDef="type">
          <mat-header-cell *matHeaderCellDef>{{ 'PRODUCTS.MOVEMENT_TYPE' | translate }}</mat-header-cell>
          <mat-cell *matCellDef="let m">{{ 'PRODUCTS.MOVEMENT_' + m.type | translate }}</mat-cell>
        </ng-container>
        <ng-container matColumnDef="quantity">
          <mat-header-cell *matHeaderCellDef>{{ 'COMMON.QUANTITY' | translate }}</mat-header-cell>
          <mat-cell *matCellDef="let m" [class.text-success]="m.quantity > 0" [class.text-danger]="m.quantity < 0">
            {{ m.quantity > 0 ? '+' : '' }}{{ m.quantity }}
          </mat-cell>
        </ng-container>
        <ng-container matColumnDef="stockAfter">
          <mat-header-cell *matHeaderCellDef>{{ 'PRODUCTS.STOCK_AFTER' | translate }}</mat-header-cell>
          <mat-cell *matCellDef="let m">{{ m.stockAfter }}</mat-cell>
        </ng-container>
        <ng-container matColumnDef="reference">
          <mat-header-cell *matHeaderCellDef>{{ 'PRODUCTS.MOVEMENT_REFERENCE' | translate }}</mat-header-cell>
          <mat-cell *matCellDef="let m">
            @if (m.orderId) { #{{ m.orderId }} }
            {{ m.comment || '' }}
          </mat-cell>
        </ng-container>
        <ng-container matColumnDef="createdBy">
          <mat-header-cell *matHeaderCellDef>{{ 'ORDERS.CREATED_BY' | translate }}</mat-header-cell>
          <mat-cell *matCellDef="let m">{{ m.createdBy }}</mat-cell>
        </ng-container>
        <mat-header-row *matHeaderRowDef="columns"></mat-header-row>
        <mat-row *matRowDef="let row; columns: columns"></mat-row>
        <tr class="mat-row" *matNoDataRow>
          <td class="mat-cell p-16">{{ 'PRODUCTS.STOCK_HISTORY_EMPTY' | translate }}</td>
        </tr>
      </mat-table>

      <mat-paginator [length]="totalElements" [pageSize]="pageSize" [pageIndex]="pageIndex" [hidePageSize]="true"
        (page)="onPageChange($event)"></mat-paginator>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-stroked-button mat-dialog-close>{{ 'COMMON.CLOSE' | translate }}</button>
    </mat-dialog-actions>
  `,
})
export class StockHistoryDialogComponent implements OnInit {
  readonly columns = ['createdAt', 'type', 'quantity', 'stockAfter', 'reference', 'createdBy'];
  readonly pageSize = 20;
  movements: StockMovement[] = [];
  totalElements = 0;
  pageIndex = 0;
  errorMessage = '';

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: StockHistoryDialogData,
    private readonly productService: ProductService,
    private readonly translateService: TranslateService,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.load();
  }

  private load(): void {
    this.productService.getStockMovements(this.data.productId, this.pageIndex, this.pageSize).subscribe({
      next: (response) => {
        this.movements = response.content;
        this.totalElements = response.totalElements;
      },
      error: () => {
        this.errorMessage = this.translateService.instant('PRODUCTS.STOCK_HISTORY_FAILED');
      },
    });
  }
}

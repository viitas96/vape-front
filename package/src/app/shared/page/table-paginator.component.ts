import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

@Component({
  selector: 'app-table-paginator',
  standalone: true,
  imports: [MatPaginatorModule],
  template: `
    <mat-paginator
      [length]="length"
      [pageSize]="pageSize"
      [pageIndex]="pageIndex"
      [pageSizeOptions]="pageSizeOptions"
      (page)="page.emit($event)"
      showFirstLastButtons>
    </mat-paginator>
  `,
})
export class TablePaginatorComponent {
  @Input({ required: true }) length = 0;
  @Input({ required: true }) pageSize = 0;
  @Input({ required: true }) pageIndex = 0;
  @Input({ required: true }) pageSizeOptions: number[] = [];

  @Output() readonly page = new EventEmitter<PageEvent>();
}

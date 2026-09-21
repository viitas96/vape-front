import { PageEvent } from '@angular/material/paginator';
import { Sort, SortDirection } from '@angular/material/sort';

export abstract class FeedbackPageState {
  successMessage = '';
  errorMessage = '';

  protected clearMessages(): void {
    this.successMessage = '';
    this.errorMessage = '';
  }

  protected setSuccess(message: string): void {
    this.successMessage = message;
    this.errorMessage = '';
  }

  protected setError(message: string): void {
    this.successMessage = '';
    this.errorMessage = message;
  }
}

export abstract class ExpandableRowsPageState extends FeedbackPageState {
  readonly expandedDetailColumns = ['expandedDetail'];
  expandedRowId: number | null = null;

  rowNumber(index: number): number {
    return index + 1;
  }

  toggleRowDetails(rowId: number): void {
    if (this.expandedRowId === rowId) {
      this.expandedRowId = null;
      return;
    }

    this.expandedRowId = rowId;
  }

  isRowDetailsExpanded(rowId: number): boolean {
    return this.expandedRowId === rowId;
  }

  protected collapseRowDetails(): void {
    this.expandedRowId = null;
  }
}

export abstract class PagedListPageState extends ExpandableRowsPageState {
  totalElements = 0;
  pageSize = 50;
  pageIndex = 0;
  sortBy = 'id';
  sortDirection: SortDirection = 'asc';
  readonly pageSizeOptions = [5, 10, 25, 50];

  override rowNumber(index: number): number {
    return this.pageIndex * this.pageSize + index + 1;
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.collapseRowDetails();
    this.loadPage();
  }

  onSortChange(sort: Sort): void {
    this.sortBy = sort.active || 'id';
    this.sortDirection = sort.direction || 'asc';
    this.pageIndex = 0;
    this.collapseRowDetails();
    this.loadPage();
  }

  protected updateTotal(totalElements: number): void {
    this.totalElements = totalElements;
  }

  protected abstract loadPage(): void;
}

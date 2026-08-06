import { PageEvent } from '@angular/material/paginator';

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

export abstract class PagedListPageState extends FeedbackPageState {
  totalElements = 0;
  pageSize = 10;
  pageIndex = 0;
  readonly pageSizeOptions = [5, 10, 25, 50];

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadPage();
  }

  protected updateTotal(totalElements: number): void {
    this.totalElements = totalElements;
  }

  protected abstract loadPage(): void;
}
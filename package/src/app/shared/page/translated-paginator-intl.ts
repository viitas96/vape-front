import { Injectable, OnDestroy } from '@angular/core';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { refreshOnTranslations } from '../i18n/translation-refresh';

@Injectable()
export class TranslatedPaginatorIntl extends MatPaginatorIntl implements OnDestroy {
  private readonly subscription: Subscription;

  constructor(private readonly translateService: TranslateService) {
    super();

    this.subscription = refreshOnTranslations(this.translateService, () => this.applyTranslations());
  }

  override getRangeLabel = (page: number, pageSize: number, length: number): string => {
    if (length === 0 || pageSize === 0) {
      return this.translateService.instant('PAGINATOR.RANGE_EMPTY', { length });
    }

    const total = Math.max(length, 0);
    const startIndex = page * pageSize;
    let endIndex = startIndex + pageSize;
    if (startIndex < total) {
      endIndex = Math.min(endIndex, total);
    }

    return this.translateService.instant('PAGINATOR.RANGE', {
      start: startIndex + 1,
      end: endIndex,
      length: total,
    });
  };

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private applyTranslations(): void {
    this.itemsPerPageLabel = this.translateService.instant('PAGINATOR.ITEMS_PER_PAGE');
    this.nextPageLabel = this.translateService.instant('PAGINATOR.NEXT_PAGE');
    this.previousPageLabel = this.translateService.instant('PAGINATOR.PREVIOUS_PAGE');
    this.firstPageLabel = this.translateService.instant('PAGINATOR.FIRST_PAGE');
    this.lastPageLabel = this.translateService.instant('PAGINATOR.LAST_PAGE');
    this.changes.next();
  }
}

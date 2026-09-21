import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ProductGammaService } from 'src/app/services/product-gamma.service';
import { ProductGroupCategoryService } from 'src/app/services/product-group-category.service';
import { MaterialModule } from 'src/app/material.module';
import { ConfirmDialogService } from 'src/app/shared/dialogs/confirm-dialog.service';
import { getApiErrorMessage } from 'src/app/shared/http/api-error';
import { ExpandableRowsPageState } from 'src/app/shared/page/page-state';
import { ProductGroupCategory } from '../product-group-categories/product-group-category.models';
import { ProductGamma } from './product-gamma.models';
import { ProductGammaDialogComponent, ProductGammaDialogData } from './product-gamma-dialog.component';

@Component({
  selector: 'app-product-gammas',
  standalone: true,
  imports: [MaterialModule, TranslatePipe],
  templateUrl: './product-gammas.component.html',
})
export class ProductGammasComponent extends ExpandableRowsPageState implements OnInit {
  gammas: ProductGamma[] = [];
  categories: ProductGroupCategory[] = [];
  displayedColumns = ['id', 'name', 'price', 'category', 'actions', 'expand'];
  sortBy = 'id';
  sortDirection: 'asc' | 'desc' = 'asc';

  constructor(
    private readonly productGammaService: ProductGammaService,
    private readonly productGroupCategoryService: ProductGroupCategoryService,
    private readonly dialog: MatDialog,
    private readonly confirmDialog: ConfirmDialogService,
    private readonly translateService: TranslateService,
  ) {
    super();
  }

  ngOnInit(): void {
    this.loadGammas();
    this.loadCategories();
  }

  formatPrice(cents: number | null): string {
    if (cents === null || cents === undefined) {
      return '—';
    }

    return (cents / 100).toFixed(2);
  }

  categoryName(gamma: ProductGamma): string {
    return gamma.category?.name ?? '—';
  }

  openDialog(gamma?: ProductGamma): void {
    const data: ProductGammaDialogData = { gamma: gamma ?? null, categories: this.categories };
    this.dialog.open(ProductGammaDialogComponent, { width: '400px', data }).afterClosed().subscribe((dto) => {
      if (!dto) {
        return;
      }

      this.clearMessages();
      const request = gamma
        ? this.productGammaService.update(gamma.id, dto)
        : this.productGammaService.create(dto);

      request.subscribe({
        next: () => {
          this.setSuccess(this.translateService.instant(gamma ? 'GAMMAS.UPDATED' : 'GAMMAS.CREATED', { name: dto.name }));
          this.loadGammas();
        },
        error: (error) => {
          const fallback = this.translateService.instant(gamma ? 'GAMMAS.UPDATE_FAILED' : 'GAMMAS.CREATE_FAILED');
          this.setError(getApiErrorMessage(error, fallback));
        },
      });
    });
  }

  delete(gamma: ProductGamma): void {
    this.confirmDialog.confirm({
      title: this.translateService.instant('GAMMAS.DELETE_TITLE'),
      message: this.translateService.instant('GAMMAS.DELETE_MESSAGE', { name: gamma.name }),
      confirmLabel: this.translateService.instant('COMMON.DELETE'),
      confirmColor: 'warn',
    }).subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }

      this.productGammaService.delete(gamma.id).subscribe({
        next: () => {
          this.setSuccess(this.translateService.instant('GAMMAS.DELETED', { name: gamma.name }));
          this.loadGammas();
        },
        error: (error) => {
          this.setError(getApiErrorMessage(error, this.translateService.instant('GAMMAS.DELETE_FAILED')));
        },
      });
    });
  }

  onSortChange(sort: { active: string; direction: '' | 'asc' | 'desc' }): void {
    this.sortBy = sort.active || 'id';
    this.sortDirection = sort.direction || 'asc';
    this.collapseRowDetails();
    this.loadGammas();
  }

  private loadGammas(): void {
    this.productGammaService.getAll(this.sortBy, this.sortDirection).subscribe({
      next: (gammas) => {
        this.gammas = gammas;
      },
      error: () => {
        this.setError(this.translateService.instant('GAMMAS.LOAD_FAILED'));
      },
    });
  }

  private loadCategories(): void {
    this.productGroupCategoryService.getAll().subscribe({
      next: (categories) => {
        this.categories = categories;
      },
      error: () => {
        this.setError(this.translateService.instant('PRODUCTS.CATEGORIES_LOAD_FAILED'));
      },
    });
  }
}

import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MaterialModule } from 'src/app/material.module';
import { ProductGroupCategoryService } from 'src/app/services/product-group-category.service';
import { ProductGroupService } from 'src/app/services/product-group.service';
import { ProductGammaService } from 'src/app/services/product-gamma.service';
import { ProductCreationPreferencesService } from 'src/app/services/product-creation-preferences.service';
import { ProductPageSizePreferencesService } from 'src/app/services/product-page-size-preferences.service';
import { ProductFilters, ProductService } from 'src/app/services/product.service';
import { ConfirmDialogService } from 'src/app/shared/dialogs/confirm-dialog.service';
import { getApiErrorMessage, isDuplicateValueError } from 'src/app/shared/http/api-error';
import { PagedListPageState } from 'src/app/shared/page/page-state';
import { ProductDialogComponent, ProductDialogData } from './product-dialog.component';
import { ProductGroup, ProductGroupCategory } from '../product-groups/product-group.models';
import { ProductGamma } from '../product-gammas/product-gamma.models';
import { Product } from './product.models';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [MaterialModule, TranslatePipe, FormsModule],
  templateUrl: './products.component.html',
})
export class ProductsComponent extends PagedListPageState implements OnInit {
  override pageSize = 50;
  products: Product[] = [];
  groups: ProductGroup[] = [];
  gammas: ProductGamma[] = [];
  categories: ProductGroupCategory[] = [];
  nameFilter = '';
  gammaIdFilter: number | null = null;
  categoryIdFilter: number | null = null;
  appliedFilters: ProductFilters = {};
  // 'group' column removed from the UI; kept on the model/backend for future use.
  displayedColumns = ['id', 'name', 'price', 'itemCode', 'barcode', 'matrixBarcode', 'qrCode', 'gamma', 'actions', 'expand'];

  constructor(
    private readonly productService: ProductService,
    private readonly productGroupService: ProductGroupService,
    private readonly productGammaService: ProductGammaService,
    private readonly productGroupCategoryService: ProductGroupCategoryService,
    private readonly productCreationPreferencesService: ProductCreationPreferencesService,
    private readonly productPageSizePreferencesService: ProductPageSizePreferencesService,
    private readonly dialog: MatDialog,
    private readonly confirmDialog: ConfirmDialogService,
    private readonly snackBar: MatSnackBar,
    private readonly translateService: TranslateService,
  ) {
    super();
  }

  ngOnInit(): void {
    this.restorePageSize();
    this.loadPage();
    this.loadGroups();
    this.loadGammas();
    this.loadCategories();
  }

  formatPrice(cents: number): string {
    return (cents / 100).toFixed(2);
  }

  override onPageChange(event: PageEvent): void {
    this.productPageSizePreferencesService.savePageSize(event.pageSize);
    super.onPageChange(event);
  }

  openDialog(product?: Product): void {
    let initialGroupId: number | null = null;
    let initialGammaId: number | null = null;
    if (!product) {
      const preferences = this.productCreationPreferencesService.getPreferences();
      if (preferences) {
        initialGroupId = preferences.groupId;
        initialGammaId = preferences.gammaId;
      }
    }

    const data: ProductDialogData = {
      product: product ?? null,
      groups: this.groups,
      gammas: this.gammas,
      initialGroupId,
      initialGammaId,
    };
    this.dialog.open(ProductDialogComponent, {
      width: '800px',
      maxWidth: 'calc(100vw - 48px)',
      data,
    }).afterClosed().subscribe((dto) => {
      if (!dto) {
        return;
      }

      this.clearMessages();
      const request = product
        ? this.productService.update(product.id, dto)
        : this.productService.create(dto);

      request.subscribe({
        next: () => {
          if (!product) {
            this.productCreationPreferencesService.savePreferences({
              groupId: dto.groupId ?? null,
              gammaId: dto.gammaId ?? null,
            });
          }

          this.setSuccess(this.translateService.instant(product ? 'PRODUCTS.UPDATED' : 'PRODUCTS.CREATED', { name: dto.name }));
          this.loadPage();
        },
        error: (error) => {
          const fallback = this.translateService.instant(product ? 'PRODUCTS.UPDATE_FAILED' : 'PRODUCTS.CREATE_FAILED');
          if (isDuplicateValueError(error)) {
            this.showDuplicateValueError(error, fallback);
            return;
          }

          this.setError(getApiErrorMessage(error, fallback));
        },
      });
    });
  }

  applyFilters(): void {
    this.appliedFilters = this.getFilters();
    this.pageIndex = 0;
    this.loadPage();
  }

  clearFilters(): void {
    this.nameFilter = '';
    this.gammaIdFilter = null;
    this.categoryIdFilter = null;
  }

  delete(product: Product): void {
    this.confirmDialog.confirm({
      title: this.translateService.instant('PRODUCTS.DELETE_TITLE'),
      message: this.translateService.instant('PRODUCTS.DELETE_MESSAGE', { name: product.name }),
      confirmLabel: this.translateService.instant('COMMON.DELETE'),
      confirmColor: 'warn',
    }).subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }

      this.productService.delete(product.id).subscribe({
        next: () => {
          this.setSuccess(this.translateService.instant('PRODUCTS.DELETED', { name: product.name }));
          this.loadPage();
        },
        error: () => {
          this.setError(this.translateService.instant('PRODUCTS.DELETE_FAILED'));
        },
      });
    });
  }

  protected override loadPage(): void {
    this.productService.getAll(this.pageIndex, this.pageSize, this.sortBy, this.sortDirection, this.appliedFilters).subscribe({
      next: (response) => {
        this.products = response.content;
        this.updateTotal(response.totalElements);
      },
      error: () => {
        this.setError(this.translateService.instant('PRODUCTS.LOAD_FAILED'));
      },
    });
  }

  private loadGroups(): void {
    this.productGroupService.getAll().subscribe({
      next: (groups) => {
        this.groups = groups;
      },
      error: () => {
        this.setError(this.translateService.instant('PRODUCTS.GROUPS_LOAD_FAILED'));
      },
    });
  }

  private loadGammas(): void {
    this.productGammaService.getAll().subscribe({
      next: (gammas) => {
        this.gammas = gammas;
      },
      error: () => {
        this.setError(this.translateService.instant('PRODUCTS.GAMMAS_LOAD_FAILED'));
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

  private getFilters(): ProductFilters {
    const filters: ProductFilters = {};
    const name = this.nameFilter.trim();

    if (name) {
      filters.name = name;
    }

    if (this.gammaIdFilter) {
      filters.gammaId = this.gammaIdFilter;
    }

    if (this.categoryIdFilter) {
      filters.categoryId = this.categoryIdFilter;
    }

    return filters;
  }

  private restorePageSize(): void {
    const storedPageSize = this.productPageSizePreferencesService.getPageSize();
    if (storedPageSize === null || !this.pageSizeOptions.includes(storedPageSize)) {
      return;
    }

    this.pageSize = storedPageSize;
  }

  private showDuplicateValueError(error: unknown, fallback: string): void {
    const localizedFieldMessages = {
      duplicate: this.translateService.instant('PRODUCTS.DUPLICATE_VALUE'),
      name: this.translateService.instant('PRODUCTS.DUPLICATE_NAME'),
      itemCode: this.translateService.instant('PRODUCTS.DUPLICATE_ITEM_CODE'),
      barcode: this.translateService.instant('PRODUCTS.DUPLICATE_BARCODE'),
      matrixBarcode: this.translateService.instant('PRODUCTS.DUPLICATE_MATRIX_BARCODE'),
      qrCode: this.translateService.instant('PRODUCTS.DUPLICATE_QR_CODE'),
    };
    const message = getApiErrorMessage(error, fallback, localizedFieldMessages);

    this.snackBar.open(message, this.translateService.instant('COMMON.CLOSE'), { duration: 5000 });
  }
}

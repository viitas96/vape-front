import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MaterialModule } from 'src/app/material.module';
import { ProductGroupService } from 'src/app/services/product-group.service';
import { ProductService } from 'src/app/services/product.service';
import { ConfirmDialogService } from 'src/app/shared/dialogs/confirm-dialog.service';
import { PagedListPageState } from 'src/app/shared/page/page-state';
import { ProductDialogComponent, ProductDialogData } from './product-dialog.component';
import { ProductGroup } from '../product-groups/product-group.models';
import { Product } from './product.models';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [MaterialModule, TranslatePipe],
  templateUrl: './products.component.html',
})
export class ProductsComponent extends PagedListPageState implements OnInit {
  products: Product[] = [];
  groups: ProductGroup[] = [];
  displayedColumns = ['id', 'name', 'price', 'itemCode', 'barcode', 'matrixBarcode', 'qrCode', 'group', 'actions'];

  constructor(
    private readonly productService: ProductService,
    private readonly productGroupService: ProductGroupService,
    private readonly dialog: MatDialog,
    private readonly confirmDialog: ConfirmDialogService,
    private readonly translateService: TranslateService,
  ) {
    super();
  }

  ngOnInit(): void {
    this.loadPage();
    this.loadGroups();
  }

  formatPrice(cents: number): string {
    return (cents / 100).toFixed(2);
  }

  openDialog(product?: Product): void {
    const data: ProductDialogData = { product: product ?? null, groups: this.groups };
    this.dialog.open(ProductDialogComponent, { width: '500px', data }).afterClosed().subscribe((dto) => {
      if (!dto) {
        return;
      }

      this.clearMessages();
      const request = product
        ? this.productService.update(product.id, dto)
        : this.productService.create(dto);

      request.subscribe({
        next: () => {
          this.setSuccess(this.translateService.instant(product ? 'PRODUCTS.UPDATED' : 'PRODUCTS.CREATED', { name: dto.name }));
          this.loadPage();
        },
        error: (error) => {
          this.setError(error.error?.message ?? this.translateService.instant(product ? 'PRODUCTS.UPDATE_FAILED' : 'PRODUCTS.CREATE_FAILED'));
        },
      });
    });
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
    this.productService.getAll(this.pageIndex, this.pageSize).subscribe({
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
}
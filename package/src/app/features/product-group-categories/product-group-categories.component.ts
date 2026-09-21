import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { TranslatePipe } from '@ngx-translate/core';
import { MaterialModule } from 'src/app/material.module';
import { ProductGroupCategoryService } from 'src/app/services/product-group-category.service';
import { ConfirmDialogService } from 'src/app/shared/dialogs/confirm-dialog.service';
import { getApiErrorMessage } from 'src/app/shared/http/api-error';
import { ExpandableRowsPageState } from 'src/app/shared/page/page-state';
import { ProductGroupCategory } from './product-group-category.models';
import {
  ProductGroupCategoryDialogComponent,
  ProductGroupCategoryDialogData,
} from './product-group-category-dialog.component';

@Component({
  selector: 'app-product-group-categories',
  standalone: true,
  imports: [MaterialModule, TranslatePipe],
  templateUrl: './product-group-categories.component.html',
})
export class ProductGroupCategoriesComponent extends ExpandableRowsPageState implements OnInit {
  categories: ProductGroupCategory[] = [];
  // systemName column removed from the UI; kept on the model/backend for future use.
  displayedColumns = ['id', 'name', 'actions', 'expand'];
  sortBy = 'id';
  sortDirection: 'asc' | 'desc' = 'asc';

  constructor(
    private readonly productGroupCategoryService: ProductGroupCategoryService,
    private readonly dialog: MatDialog,
    private readonly confirmDialog: ConfirmDialogService,
  ) {
    super();
  }

  ngOnInit(): void {
    this.loadCategories();
  }

  openDialog(category?: ProductGroupCategory): void {
    const data: ProductGroupCategoryDialogData = { category: category ?? null };
    this.dialog.open(ProductGroupCategoryDialogComponent, { width: '400px', data }).afterClosed().subscribe((dto) => {
      if (!dto) {
        return;
      }

      this.clearMessages();
      const request = category
        ? this.productGroupCategoryService.update(category.id, dto)
        : this.productGroupCategoryService.create(dto);

      request.subscribe({
        next: () => {
          this.setSuccess(`Category "${dto.name}" ${category ? 'updated' : 'created'}.`);
          this.loadCategories();
        },
        error: (error) => {
          this.setError(getApiErrorMessage(error, `Failed to ${category ? 'update' : 'create'} category`));
        },
      });
    });
  }

  delete(category: ProductGroupCategory): void {
    this.confirmDialog.confirm({
      title: 'Delete Category',
      message: `Delete category "${category.name}"?`,
      confirmLabel: 'Delete',
      confirmColor: 'warn',
    }).subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }

      this.productGroupCategoryService.delete(category.id).subscribe({
        next: () => {
          this.setSuccess(`Category "${category.name}" deleted.`);
          this.loadCategories();
        },
        error: (error) => {
          this.setError(error.error?.message ?? 'Failed to delete category');
        },
      });
    });
  }

  onSortChange(sort: { active: string; direction: '' | 'asc' | 'desc' }): void {
    this.sortBy = sort.active || 'id';
    this.sortDirection = sort.direction || 'asc';
    this.collapseRowDetails();
    this.loadCategories();
  }

  private loadCategories(): void {
    this.productGroupCategoryService.getAll(this.sortBy, this.sortDirection).subscribe({
      next: (categories) => {
        this.categories = categories;
      },
      error: () => {
        this.setError('Failed to load product group categories');
      },
    });
  }
}

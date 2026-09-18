import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MaterialModule } from 'src/app/material.module';
import { TranslatePipe } from '@ngx-translate/core';
import { ProductGroupService } from 'src/app/services/product-group.service';
import { ConfirmDialogService } from 'src/app/shared/dialogs/confirm-dialog.service';
import { getApiErrorMessage } from 'src/app/shared/http/api-error';
import { ExpandableRowsPageState } from 'src/app/shared/page/page-state';
import { ProductGroupDialogComponent, ProductGroupDialogData } from './product-group-dialog.component';
import { ProductGroup, ProductGroupCategory } from './product-group.models';
import { ProductGroupCategoryService } from 'src/app/services/product-group-category.service';

@Component({
  selector: 'app-product-groups',
  standalone: true,
  imports: [MaterialModule, TranslatePipe],
  templateUrl: './product-groups.component.html',
})
export class ProductGroupsComponent extends ExpandableRowsPageState implements OnInit {
  groups: ProductGroup[] = [];
  categories: ProductGroupCategory[] = [];
  displayedColumns = ['id', 'name', 'category', 'actions', 'expand'];
  sortBy = 'id';
  sortDirection: 'asc' | 'desc' = 'asc';

  constructor(
    private readonly productGroupService: ProductGroupService,
    private readonly productGroupCategoryService: ProductGroupCategoryService,
    private readonly dialog: MatDialog,
    private readonly confirmDialog: ConfirmDialogService,
  ) {
    super();
  }

  ngOnInit(): void {
    this.loadGroups();
    this.loadCategories();
  }

  openDialog(group?: ProductGroup): void {
    const data: ProductGroupDialogData = { group: group ?? null, categories: this.categories };
    this.dialog.open(ProductGroupDialogComponent, { width: '400px', data }).afterClosed().subscribe((dto) => {
      if (!dto) {
        return;
      }

      this.clearMessages();
      const request = group
        ? this.productGroupService.update(group.id, dto)
        : this.productGroupService.create(dto);

      request.subscribe({
        next: () => {
          this.setSuccess(`Group "${dto.name}" ${group ? 'updated' : 'created'}.`);
          this.loadGroups();
        },
        error: (error) => {
          this.setError(getApiErrorMessage(error, `Failed to ${group ? 'update' : 'create'} group`));
        },
      });
    });
  }

  delete(group: ProductGroup): void {
    this.confirmDialog.confirm({
      title: 'Delete Group',
      message: `Delete group "${group.name}"?`,
      confirmLabel: 'Delete',
      confirmColor: 'warn',
    }).subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }

      this.productGroupService.delete(group.id).subscribe({
        next: () => {
          this.setSuccess(`Group "${group.name}" deleted.`);
          this.loadGroups();
        },
        error: () => {
          this.setError('Failed to delete group');
        },
      });
    });
  }

  onSortChange(sort: { active: string; direction: '' | 'asc' | 'desc' }): void {
    this.sortBy = sort.active || 'id';
    this.sortDirection = sort.direction || 'asc';
    this.collapseRowDetails();
    this.loadGroups();
  }

  private loadGroups(): void {
    this.productGroupService.getAll(this.sortBy, this.sortDirection).subscribe({
      next: (groups) => {
        this.groups = groups;
      },
      error: () => {
        this.setError('Failed to load product groups');
      },
    });
  }

  private loadCategories(): void {
    this.productGroupCategoryService.getAll().subscribe({
      next: (categories) => {
        this.categories = categories;
      },
      error: () => {
        this.setError('Failed to load product group categories');
      },
    });
  }
}

import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MaterialModule } from 'src/app/material.module';
import { TranslatePipe } from '@ngx-translate/core';
import { ProductGroupService } from 'src/app/services/product-group.service';
import { ConfirmDialogService } from 'src/app/shared/dialogs/confirm-dialog.service';
import { FeedbackPageState } from 'src/app/shared/page/page-state';
import { ProductGroupDialogComponent, ProductGroupDialogData } from './product-group-dialog.component';
import { ProductGroup } from './product-group.models';

@Component({
  selector: 'app-product-groups',
  standalone: true,
  imports: [MaterialModule, TranslatePipe],
  templateUrl: './product-groups.component.html',
})
export class ProductGroupsComponent extends FeedbackPageState implements OnInit {
  groups: ProductGroup[] = [];
  displayedColumns = ['id', 'name', 'actions'];

  constructor(
    private readonly productGroupService: ProductGroupService,
    private readonly dialog: MatDialog,
    private readonly confirmDialog: ConfirmDialogService,
  ) {
    super();
  }

  ngOnInit(): void {
    this.loadGroups();
  }

  openDialog(group?: ProductGroup): void {
    const data: ProductGroupDialogData = { group: group ?? null };
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
          this.setError(error.error?.message ?? `Failed to ${group ? 'update' : 'create'} group`);
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

  private loadGroups(): void {
    this.productGroupService.getAll().subscribe({
      next: (groups) => {
        this.groups = groups;
      },
      error: () => {
        this.setError('Failed to load product groups');
      },
    });
  }
}
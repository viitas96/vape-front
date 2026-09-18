import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { TranslatePipe } from '@ngx-translate/core';
import { ProductGammaService } from 'src/app/services/product-gamma.service';
import { MaterialModule } from 'src/app/material.module';
import { ConfirmDialogService } from 'src/app/shared/dialogs/confirm-dialog.service';
import { getApiErrorMessage } from 'src/app/shared/http/api-error';
import { ExpandableRowsPageState } from 'src/app/shared/page/page-state';
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
  displayedColumns = ['id', 'name', 'price', 'actions', 'expand'];
  sortBy = 'id';
  sortDirection: 'asc' | 'desc' = 'asc';

  constructor(
    private readonly productGammaService: ProductGammaService,
    private readonly dialog: MatDialog,
    private readonly confirmDialog: ConfirmDialogService,
  ) {
    super();
  }

  ngOnInit(): void {
    this.loadGammas();
  }

  formatPrice(cents: number): string {
    return (cents / 100).toFixed(2);
  }

  openDialog(gamma?: ProductGamma): void {
    const data: ProductGammaDialogData = { gamma: gamma ?? null };
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
          this.setSuccess(`Gamma "${dto.name}" ${gamma ? 'updated' : 'created'}.`);
          this.loadGammas();
        },
        error: (error) => {
          this.setError(getApiErrorMessage(error, `Failed to ${gamma ? 'update' : 'create'} gamma`));
        },
      });
    });
  }

  delete(gamma: ProductGamma): void {
    this.confirmDialog.confirm({
      title: 'Delete Gamma',
      message: `Delete gamma "${gamma.name}"?`,
      confirmLabel: 'Delete',
      confirmColor: 'warn',
    }).subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }

      this.productGammaService.delete(gamma.id).subscribe({
        next: () => {
          this.setSuccess(`Gamma "${gamma.name}" deleted.`);
          this.loadGammas();
        },
        error: (error) => {
          this.setError(error.error?.message ?? 'Failed to delete gamma');
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
        this.setError('Failed to load gammas');
      },
    });
  }
}

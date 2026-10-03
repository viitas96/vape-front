import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { MaterialModule } from 'src/app/material.module';
import { BrandService } from 'src/app/services/brand.service';
import { ConfirmDialogService } from 'src/app/shared/dialogs/confirm-dialog.service';
import { getApiErrorMessage } from 'src/app/shared/http/api-error';
import { ExpandableRowsPageState } from 'src/app/shared/page/page-state';
import { Brand } from './brand.models';
import { BrandDialogComponent, BrandDialogData } from './brand-dialog.component';

@Component({
  selector: 'app-brands',
  standalone: true,
  imports: [MaterialModule, TranslatePipe],
  templateUrl: './brands.component.html',
})
export class BrandsComponent extends ExpandableRowsPageState implements OnInit {
  brands: Brand[] = [];
  displayedColumns = ['id', 'name', 'active', 'actions'];
  sortBy = 'name';
  sortDirection: 'asc' | 'desc' = 'asc';

  constructor(
    private readonly brandService: BrandService,
    private readonly dialog: MatDialog,
    private readonly confirmDialog: ConfirmDialogService,
    private readonly translateService: TranslateService,
  ) {
    super();
  }

  ngOnInit(): void {
    this.loadBrands();
  }

  openDialog(brand?: Brand): void {
    const data: BrandDialogData = { brand: brand ?? null };
    this.dialog.open(BrandDialogComponent, { width: '400px', data }).afterClosed().subscribe((dto) => {
      if (!dto) {
        return;
      }

      this.clearMessages();
      const request = brand
        ? this.brandService.update(brand.id, dto)
        : this.brandService.create(dto);

      request.subscribe({
        next: () => {
          this.setSuccess(this.translateService.instant(brand ? 'BRANDS.UPDATED' : 'BRANDS.CREATED', { name: dto.name }));
          this.loadBrands();
        },
        error: (error) => {
          const fallback = this.translateService.instant(brand ? 'BRANDS.UPDATE_FAILED' : 'BRANDS.CREATE_FAILED');
          this.setError(getApiErrorMessage(error, fallback));
        },
      });
    });
  }

  deactivate(brand: Brand): void {
    this.confirmDialog.confirm({
      title: this.translateService.instant('BRANDS.DEACTIVATE_TITLE'),
      message: this.translateService.instant('BRANDS.DEACTIVATE_MESSAGE', { name: brand.name }),
      confirmLabel: this.translateService.instant('BRANDS.DEACTIVATE'),
      confirmColor: 'warn',
    }).subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }

      this.brandService.delete(brand.id).subscribe({
        next: () => {
          this.setSuccess(this.translateService.instant('BRANDS.DEACTIVATED', { name: brand.name }));
          this.loadBrands();
        },
        error: (error) => {
          this.setError(getApiErrorMessage(error, this.translateService.instant('BRANDS.DEACTIVATE_FAILED')));
        },
      });
    });
  }

  reactivate(brand: Brand): void {
    this.clearMessages();
    this.brandService.update(brand.id, { name: brand.name, active: true }).subscribe({
      next: () => {
        this.setSuccess(this.translateService.instant('BRANDS.REACTIVATED', { name: brand.name }));
        this.loadBrands();
      },
      error: (error) => {
        this.setError(getApiErrorMessage(error, this.translateService.instant('BRANDS.UPDATE_FAILED')));
      },
    });
  }

  onSortChange(sort: { active: string; direction: '' | 'asc' | 'desc' }): void {
    this.sortBy = sort.active || 'name';
    this.sortDirection = sort.direction || 'asc';
    this.collapseRowDetails();
    this.loadBrands();
  }

  private loadBrands(): void {
    this.brandService.getAll(this.sortBy, this.sortDirection).subscribe({
      next: (brands) => {
        this.brands = brands;
      },
      error: () => {
        this.setError(this.translateService.instant('BRANDS.LOAD_FAILED'));
      },
    });
  }
}

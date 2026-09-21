import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { MaterialModule } from 'src/app/material.module';
import { AdminService } from 'src/app/services/admin.service';
import { ConfirmDialogData } from 'src/app/shared/dialogs/confirm-dialog.component';
import { ConfirmDialogService } from 'src/app/shared/dialogs/confirm-dialog.service';
import { PagedListPageState } from 'src/app/shared/page/page-state';
import { TablePaginatorComponent } from 'src/app/shared/page/table-paginator.component';
import { UserResponse } from '../users/user.models';
import { CreateCustomerDialogComponent } from './create-customer-dialog.component';
import { EditCustomerDialogComponent } from './edit-customer-dialog.component';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [MaterialModule, TranslatePipe, TablePaginatorComponent],
  templateUrl: './customers.component.html',
})
export class CustomersComponent extends PagedListPageState implements OnInit {
  customers: UserResponse[] = [];
  displayedColumns = ['id', 'name', 'email', 'phone', 'points', 'status', 'actions', 'expand'];
  override readonly pageSizeOptions = [5, 10, 25, 50];

  constructor(
    private readonly adminService: AdminService,
    private readonly dialog: MatDialog,
    private readonly confirmDialog: ConfirmDialogService,
    private readonly translateService: TranslateService,
  ) {
    super();
  }

  ngOnInit(): void {
    this.loadPage();
  }

  openCreateDialog(): void {
    this.dialog.open(CreateCustomerDialogComponent, { width: '480px' }).afterClosed().subscribe((created) => {
      if (!created) {
        return;
      }

      this.setSuccess(this.translateService.instant('CUSTOMERS.CREATED'));
      this.loadPage();
    });
  }

  openEditDialog(customer: UserResponse): void {
    this.dialog.open(EditCustomerDialogComponent, { width: '480px', data: customer }).afterClosed().subscribe((updated) => {
      if (!updated) {
        return;
      }

      this.setSuccess(this.translateService.instant('CUSTOMERS.UPDATED'));
      this.loadPage();
    });
  }

  fullName(customer: UserResponse): string {
    return [customer.firstName, customer.lastName].filter(Boolean).join(' ');
  }

  toggleBan(customer: UserResponse): void {
    const banning = !customer.banned;
    const data: ConfirmDialogData = {
      title: this.translateService.instant(banning ? 'USERS.BAN_TITLE' : 'USERS.UNBAN_TITLE'),
      message: this.translateService.instant(banning ? 'USERS.BAN_MESSAGE' : 'USERS.UNBAN_MESSAGE', { email: customer.email }),
      confirmLabel: this.translateService.instant(banning ? 'USERS.BAN' : 'USERS.UNBAN'),
      confirmColor: banning ? 'warn' : 'primary',
    };

    this.confirmDialog.confirm(data).subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }

      this.adminService.toggleBan(customer.id).subscribe({
        next: (updated) => {
          this.customers = this.customers.map((existing) => existing.id === updated.id ? updated : existing);
          this.setSuccess(this.translateService.instant(updated.banned ? 'USERS.BANNED_SUCCESS' : 'USERS.UNBANNED_SUCCESS', { email: updated.email }));
        },
        error: () => {
          this.setError(this.translateService.instant('USERS.STATUS_UPDATE_FAILED'));
        },
      });
    });
  }

  protected override loadPage(): void {
    this.adminService.getCustomers(this.pageIndex, this.pageSize, this.sortBy, this.sortDirection).subscribe({
      next: (response) => {
        this.customers = response.content;
        this.updateTotal(response.totalElements);
      },
      error: () => {
        this.setError(this.translateService.instant('CUSTOMERS.LOAD_FAILED'));
      },
    });
  }
}

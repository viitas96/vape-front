import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MaterialModule } from 'src/app/material.module';
import { TranslatePipe } from '@ngx-translate/core';
import { AdminService } from 'src/app/services/admin.service';
import { ConfirmDialogData } from 'src/app/shared/dialogs/confirm-dialog.component';
import { ConfirmDialogService } from 'src/app/shared/dialogs/confirm-dialog.service';
import { PagedListPageState } from 'src/app/shared/page/page-state';
import { ChangePasswordDialogComponent } from './change-password-dialog.component';
import { CreateUserDialogComponent } from './create-user-dialog.component';
import { UserResponse } from './user.models';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [MaterialModule, TranslatePipe],
  templateUrl: './users.component.html',
})
export class UsersComponent extends PagedListPageState implements OnInit {
  users: UserResponse[] = [];
  displayedColumns = ['id', 'email', 'roles', 'status', 'actions'];
  override readonly pageSizeOptions = [5, 10, 25];

  constructor(
    private readonly adminService: AdminService,
    private readonly dialog: MatDialog,
    private readonly confirmDialog: ConfirmDialogService,
  ) {
    super();
  }

  ngOnInit(): void {
    this.loadPage();
  }

  openCreateDialog(): void {
    this.dialog.open(CreateUserDialogComponent, { width: '480px' }).afterClosed().subscribe((created) => {
      if (!created) {
        return;
      }

      this.setSuccess('User created successfully.');
      this.loadPage();
    });
  }

  openChangePasswordDialog(user: UserResponse): void {
    this.dialog.open(ChangePasswordDialogComponent, { width: '420px', data: { user } }).afterClosed().subscribe((saved) => {
      if (!saved) {
        return;
      }

      this.setSuccess(`Password updated for "${user.email}".`);
    });
  }

  toggleBan(user: UserResponse): void {
    const banning = !user.banned;
    const data: ConfirmDialogData = {
      title: banning ? 'Ban User' : 'Unban User',
      message: `Are you sure you want to ${banning ? 'ban' : 'unban'} "${user.email}"?`,
      confirmLabel: banning ? 'Ban' : 'Unban',
      confirmColor: banning ? 'warn' : 'primary',
    };

    this.confirmDialog.confirm(data).subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }

      this.adminService.toggleBan(user.id).subscribe({
        next: (updated) => {
          this.users = this.users.map((existingUser) => existingUser.id === updated.id ? updated : existingUser);
          this.setSuccess(`User "${updated.email}" ${updated.banned ? 'banned' : 'unbanned'}.`);
        },
        error: () => {
          this.setError('Failed to update user status');
        },
      });
    });
  }

  protected override loadPage(): void {
    this.adminService.getUsers(this.pageIndex, this.pageSize).subscribe({
      next: (response) => {
        this.users = response.content;
        this.updateTotal(response.totalElements);
      },
      error: () => {
        this.setError('Failed to load users');
      },
    });
  }
}
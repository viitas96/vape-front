import { inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { map, Observable } from 'rxjs';
import { ConfirmDialogComponent, ConfirmDialogData } from './confirm-dialog.component';

@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  private readonly dialog = inject(MatDialog);

  confirm(data: ConfirmDialogData, width = '380px'): Observable<boolean> {
    return this.dialog.open(ConfirmDialogComponent, { width, data }).afterClosed().pipe(
      map((confirmed) => Boolean(confirmed)),
    );
  }
}
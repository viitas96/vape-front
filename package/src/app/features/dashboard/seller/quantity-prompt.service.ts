import { inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { filter, map, Observable } from 'rxjs';
import { Product } from 'src/app/features/products/product.models';
import { PickedProduct } from './pos.models';
import { QuantityPromptDialogComponent, QuantityPromptDialogData, QuantityPromptResult } from './quantity-prompt-dialog.component';

@Injectable({ providedIn: 'root' })
export class QuantityPromptService {
  private readonly dialog = inject(MatDialog);

  ask(product: Product): Observable<PickedProduct> {
    const data: QuantityPromptDialogData = { product };
    return this.dialog.open(QuantityPromptDialogComponent, { width: '380px', data }).afterClosed().pipe(
      filter((result?: QuantityPromptResult): result is QuantityPromptResult => Boolean(result)),
      map((result) => ({ product, quantity: result.quantity, unitPrice: result.unitPrice })),
    );
  }
}

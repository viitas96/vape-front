import { Component } from '@angular/core';
import { MaterialModule } from 'src/app/material.module';

@Component({
  selector: 'app-accountant-dashboard',
  standalone: true,
  imports: [MaterialModule],
  template: `
    <mat-card class="cardWithShadow m-24">
      <mat-card-content class="p-24">
        <h1 class="mat-headline-4">ACCOUNTANT</h1>
      </mat-card-content>
    </mat-card>
  `,
})
export class AccountantDashboardComponent {}
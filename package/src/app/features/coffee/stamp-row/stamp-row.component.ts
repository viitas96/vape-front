import { Component, Input } from '@angular/core';
import { TablerIconsModule } from 'angular-tabler-icons';

@Component({
  selector: 'app-stamp-row',
  standalone: true,
  imports: [TablerIconsModule],
  templateUrl: './stamp-row.component.html',
  styleUrls: ['./stamp-row.component.scss'],
})
export class StampRowComponent {
  @Input() threshold = 6;
  @Input() count = 0;
  @Input() hasFreeDrink = false;

  get slots(): boolean[] {
    return Array.from({ length: this.threshold }, (_, index) => index < this.count);
  }
}

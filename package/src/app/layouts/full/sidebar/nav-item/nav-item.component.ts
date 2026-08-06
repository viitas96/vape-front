import {
  Component,
  EventEmitter,
  HostBinding,
  Input,
  OnChanges,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MaterialModule } from 'src/app/material.module';
import { NavService } from '../../../../services/nav.service';
import { NavItem } from './nav-item';

@Component({
  selector: 'app-nav-item',
  imports: [TranslateModule, TablerIconsModule, MaterialModule, CommonModule],
  templateUrl: './nav-item.component.html',
  styleUrls: [],
})
export class AppNavItemComponent implements OnChanges {
  @Output() notify = new EventEmitter<boolean>();
  @Input() item!: NavItem;
  @Input() depth = 0;
  @HostBinding('attr.aria-expanded') ariaExpanded = false;

  expanded = false;

  constructor(
    public readonly navService: NavService,
    public readonly router: Router,
  ) {}

  ngOnChanges(): void {
    const url = this.navService.currentUrl();
    const route = this.item.route;
    if (!url || !route) {
      return;
    }

    const normalizedRoute = route.startsWith('/') ? route : `/${route}`;
    this.expanded = url.startsWith(normalizedRoute);
    this.ariaExpanded = this.expanded;
  }

  onItemSelected(item: NavItem): void {
    if (!item.children?.length && item.route) {
      this.router.navigateByUrl(item.route);
    }

    if (item.children?.length) {
      this.expanded = !this.expanded;
    }

    window.scroll({
      top: 0,
      left: 0,
      behavior: 'smooth',
    });

    if (!this.expanded && window.innerWidth < 1024) {
      this.notify.emit();
    }
  }

  openExternalLink(url: string): void {
    if (url) {
      window.open(url, '_blank');
    }
  }

  onSubItemSelected(item: NavItem): void {
    if (!item.children?.length && this.expanded && window.innerWidth < 1024) {
      this.notify.emit();
    }
  }
}
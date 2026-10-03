import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatSidenav, MatSidenavContent } from '@angular/material/sidenav';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { NgScrollbarModule } from 'ngx-scrollbar';
import { Subscription, filter } from 'rxjs';
import { TablerIconsModule } from 'angular-tabler-icons';
import { buildSidebarNavItems } from 'src/app/core/routing/app-feature.routes';
import { MaterialModule } from 'src/app/material.module';
import { AuthService } from 'src/app/services/auth.service';
import { CoreService } from 'src/app/services/core.service';
import { ThemeService } from 'src/app/services/theme.service';
import { TranslatePipe } from '@ngx-translate/core';
import { AppNavItemComponent } from './sidebar/nav-item/nav-item.component';
import { NavItem } from './sidebar/nav-item/nav-item';
import { SidebarComponent } from './sidebar/sidebar.component';

const MOBILE_VIEW = 'screen and (max-width: 768px)';
const TABLET_VIEW = 'screen and (min-width: 769px) and (max-width: 1024px)';

@Component({
  selector: 'app-full',
  imports: [
    RouterModule,
    AppNavItemComponent,
    MaterialModule,
    SidebarComponent,
    NgScrollbarModule,
    TablerIconsModule,
    TranslatePipe,
  ],
  templateUrl: './full.component.html',
  encapsulation: ViewEncapsulation.None,
})
export class FullComponent implements OnInit, OnDestroy {
  @ViewChild('leftsidenav') sidenav?: MatSidenav;
  @ViewChild('content', { static: true }) content!: MatSidenavContent;

  navItems: NavItem[] = [];
  options = this.settings.getOptions();
  isSidenavHovered = false;

  private readonly subscriptions = new Subscription();
  private isMobileScreen = false;
  private hoverCloseTimer?: number;

  get isOver(): boolean {
    return this.isMobileScreen;
  }

  constructor(
    private readonly settings: CoreService,
    private readonly router: Router,
    private readonly breakpointObserver: BreakpointObserver,
    private readonly authService: AuthService,
    public readonly themeService: ThemeService,
  ) {
    this.subscriptions.add(
      this.breakpointObserver.observe([MOBILE_VIEW, TABLET_VIEW]).subscribe((state) => {
        this.clearHoverCloseTimer();
        this.isSidenavHovered = false;
        this.options.sidenavOpened = true;
        this.isMobileScreen = state.breakpoints[MOBILE_VIEW];

        if (!this.options.sidenavCollapsed) {
          this.options.sidenavCollapsed = state.breakpoints[TABLET_VIEW];
        }
      }),
    );

    this.subscriptions.add(
      this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
        this.content.scrollTo({ top: 0 });
      }),
    );
  }

  ngOnInit(): void {
    this.navItems = buildSidebarNavItems(this.authService.getRoles());
  }

  ngOnDestroy(): void {
    this.clearHoverCloseTimer();
    this.subscriptions.unsubscribe();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/authentication/login']);
  }

  get isImpersonating(): boolean {
    return this.authService.isImpersonating();
  }

  get impersonatedEmail(): string {
    return this.authService.getImpersonatedEmail() ?? '';
  }

  stopImpersonating(): void {
    this.authService.stopImpersonation();
    window.location.assign(this.authService.getRedirectPath());
  }

  toggleCollapsed(): void {
    this.clearHoverCloseTimer();
    this.isSidenavHovered = false;
    this.options.sidenavCollapsed = !this.options.sidenavCollapsed;
    this.settings.setOptions(this.options);
  }

  collapseSidenavOnContentClick(): void {
    if (this.isOver) {
      return;
    }

    this.hideSidenavAfterSelection();
  }

  hideSidenavAfterSelection(): void {
    this.clearHoverCloseTimer();
    this.isSidenavHovered = false;

    if (this.isOver) {
      this.sidenav?.close();
      return;
    }

    if (this.options.sidenavCollapsed) {
      return;
    }

    this.options.sidenavCollapsed = true;
    this.settings.setOptions(this.options);
  }

  showSidenavOnHover(): void {
    if (this.isOver || !this.options.sidenavCollapsed) {
      return;
    }

    this.clearHoverCloseTimer();
    this.isSidenavHovered = true;
  }

  scheduleSidenavHideAfterHover(): void {
    if (this.isOver || !this.options.sidenavCollapsed) {
      return;
    }

    this.clearHoverCloseTimer();
    this.hoverCloseTimer = window.setTimeout(() => {
      this.isSidenavHovered = false;
      this.hoverCloseTimer = undefined;
    }, 500);
  }

  hideSidenavAfterHover(): void {
    if (this.isOver || !this.options.sidenavCollapsed) {
      return;
    }

    this.clearHoverCloseTimer();
    this.isSidenavHovered = false;
  }

  onSidenavClosedStart(): void {
    this.settings.setOptions({ sidenavOpened: false });
  }

  onSidenavOpenedChange(isOpened: boolean): void {
    this.options.sidenavOpened = isOpened;
    this.settings.setOptions({ sidenavOpened: isOpened });
  }

  private clearHoverCloseTimer(): void {
    if (this.hoverCloseTimer === undefined) {
      return;
    }

    window.clearTimeout(this.hoverCloseTimer);
    this.hoverCloseTimer = undefined;
  }
}

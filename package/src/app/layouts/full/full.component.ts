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
import { LanguageService, SupportedLanguage } from 'src/app/services/language.service';
import { AppNavItemComponent } from './sidebar/nav-item/nav-item.component';
import { NavItem } from './sidebar/nav-item/nav-item';
import { SidebarComponent } from './sidebar/sidebar.component';
import { HeaderComponent } from './header/header.component';

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
  ],
  templateUrl: './full.component.html',
  encapsulation: ViewEncapsulation.None,
})
export class FullComponent implements OnInit, OnDestroy {
  @ViewChild('leftsidenav') sidenav?: MatSidenav;
  @ViewChild('content', { static: true }) content!: MatSidenavContent;

  navItems: NavItem[] = [];
  options = this.settings.getOptions();

  private readonly subscriptions = new Subscription();
  private isMobileScreen = false;

  get isOver(): boolean {
    return this.isMobileScreen;
  }

  constructor(
    private readonly settings: CoreService,
    private readonly router: Router,
    private readonly breakpointObserver: BreakpointObserver,
    private readonly authService: AuthService,
    private readonly languageService: LanguageService,
  ) {
    this.subscriptions.add(
      this.breakpointObserver.observe([MOBILE_VIEW, TABLET_VIEW]).subscribe((state) => {
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
    this.subscriptions.unsubscribe();
  }

  get currentLanguage(): SupportedLanguage {
    return this.languageService.currentLanguage;
  }

  setLanguage(language: SupportedLanguage): void {
    this.languageService.setLanguage(language);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/authentication/login']);
  }

  toggleCollapsed(): void {
    this.options.sidenavCollapsed = !this.options.sidenavCollapsed;
    this.settings.setOptions(this.options);
  }

  onSidenavClosedStart(): void {
    this.settings.setOptions({ sidenavOpened: false });
  }

  onSidenavOpenedChange(isOpened: boolean): void {
    this.options.sidenavOpened = isOpened;
    this.settings.setOptions({ sidenavOpened: isOpened });
  }
}
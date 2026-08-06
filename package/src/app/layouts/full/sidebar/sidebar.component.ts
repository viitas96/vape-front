import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MaterialModule } from 'src/app/material.module';
import { ThemeService } from 'src/app/services/theme.service';
import { LanguageService, SupportedLanguage } from 'src/app/services/language.service';
import { BrandingComponent } from './branding.component';

@Component({
  selector: 'app-sidebar',
  imports: [BrandingComponent, TablerIconsModule, MaterialModule],
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent {
  @Input() showToggle = true;
  @Output() toggleMobileNav = new EventEmitter<void>();
  @Output() toggleCollapsed = new EventEmitter<void>();

  constructor(public readonly themeService: ThemeService) {}
}
import {
  Component,
  Output,
  EventEmitter,
  Input,
  ViewEncapsulation,
} from '@angular/core';
import { Router } from '@angular/router';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MaterialModule } from 'src/app/material.module';
import { AuthService } from 'src/app/services/auth.service';
import { LanguageService, SupportedLanguage } from 'src/app/services/language.service';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-header',
  imports: [TablerIconsModule, MaterialModule, TranslatePipe],
  templateUrl: './header.component.html',
  encapsulation: ViewEncapsulation.None,
})
export class HeaderComponent {
  @Input() showToggle = true;
  @Input() toggleChecked = false;
  @Output() toggleMobileNav = new EventEmitter<void>();

  constructor(
    private readonly authService: AuthService,
    private readonly languageService: LanguageService,
    private readonly router: Router,
  ) {}

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
}
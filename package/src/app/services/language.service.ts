import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

export type SupportedLanguage = 'en' | 'ro';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private static readonly STORAGE_KEY = 'language';

  constructor(private readonly translateService: TranslateService) {
    const language = this.getStoredLanguage();

    this.translateService.use(language);
  }

  get currentLanguage(): SupportedLanguage {
    return this.getStoredLanguage();
  }

  setLanguage(language: SupportedLanguage): void {
    localStorage.setItem(LanguageService.STORAGE_KEY, language);
    this.translateService.use(language);
  }

  private getStoredLanguage(): SupportedLanguage {
    const language = localStorage.getItem(LanguageService.STORAGE_KEY);

    if (language === 'en') {
      return 'en';
    }

    return 'ro';
  }
}

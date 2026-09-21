import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

export type SupportedLanguage = 'ro';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  static readonly DEFAULT_LANGUAGE: SupportedLanguage = 'ro';

  constructor(private readonly translateService: TranslateService) {
    this.translateService.use(LanguageService.DEFAULT_LANGUAGE);
  }
}

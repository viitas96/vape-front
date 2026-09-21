import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

export function refreshOnTranslations(translateService: TranslateService, apply: () => void): Subscription {
  const subscription = new Subscription();

  subscription.add(translateService.onLangChange.subscribe(() => apply()));
  subscription.add(translateService.onTranslationChange.subscribe(() => apply()));
  apply();

  return subscription;
}

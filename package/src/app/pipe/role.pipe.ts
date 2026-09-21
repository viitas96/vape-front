import { Pipe, PipeTransform } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Pipe({ name: 'appRole', standalone: true, pure: true })
export class RolePipe implements PipeTransform {
  constructor(private readonly translateService: TranslateService) {}

  transform(value: string | string[] | null | undefined): string {
    if (!value) {
      return '';
    }

    if (Array.isArray(value)) {
      return value.map((role) => this.translateRole(role)).join(', ');
    }

    return this.translateRole(value);
  }

  private translateRole(role: string): string {
    const key = `ROLE.${role}`;
    const translation = this.translateService.instant(key);

    return translation === key ? role : translation;
  }
}

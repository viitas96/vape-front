import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'vape-theme';
const LIGHT = 'light-theme';
const DARK = 'dark-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly isDark = signal(false);

  constructor() {
    this.apply(localStorage.getItem(STORAGE_KEY) === DARK);
  }

  toggle(): void {
    this.apply(!this.isDark());
  }

  private apply(dark: boolean): void {
    this.isDark.set(dark);
    const body = document.body;
    // blue_theme provides the primary palette; light/dark only flips the color scheme.
    body.classList.add('blue_theme');
    body.classList.toggle(DARK, dark);
    body.classList.toggle(LIGHT, !dark);
    localStorage.setItem(STORAGE_KEY, dark ? DARK : LIGHT);
  }
}

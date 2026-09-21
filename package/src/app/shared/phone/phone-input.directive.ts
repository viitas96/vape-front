import { Directive, HostListener } from '@angular/core';
import { NgControl } from '@angular/forms';
import { normalizePhone } from './phone.util';

@Directive({
  selector: 'input[appPhoneInput]',
  standalone: true,
})
export class PhoneInputDirective {
  constructor(private readonly ngControl: NgControl) {}

  @HostListener('blur')
  onBlur(): void {
    const normalized = normalizePhone(this.ngControl.value);
    if (normalized !== this.ngControl.value) {
      this.ngControl.control?.setValue(normalized);
    }
  }
}

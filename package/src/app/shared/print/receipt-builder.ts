import { escapeHtml } from './print.service';

export class ReceiptBuilder {
  private readonly parts: string[] = [];

  title(text: string): this {
    this.parts.push(`<div class="center title">${escapeHtml(text)}</div>`);
    return this;
  }

  subtitle(text: string): this {
    this.parts.push(`<div class="center subtitle">${escapeHtml(text)}</div>`);
    return this;
  }

  line(text: string): this {
    this.parts.push(`<div>${escapeHtml(text)}</div>`);
    return this;
  }

  muted(text: string): this {
    this.parts.push(`<div class="center muted">${escapeHtml(text)}</div>`);
    return this;
  }

  row(label: string, value: string | number): this {
    this.parts.push(`<div class="row"><span>${escapeHtml(label)}</span><span>${escapeHtml(value)}</span></div>`);
    return this;
  }

  optionalRow(label: string, value: string | number | null | undefined): this {
    if (value === null || value === undefined || value === '') {
      return this;
    }

    return this.row(label, value);
  }

  total(label: string, value: string): this {
    this.parts.push(`<div class="row total"><span>${escapeHtml(label)}</span><span>${escapeHtml(value)}</span></div>`);
    return this;
  }

  item(name: string, detail: string, amount: string): this {
    this.parts.push(
      `<div class="item"><div class="item-name">${escapeHtml(name)}</div>`
      + `<div class="row"><span>${escapeHtml(detail)}</span><span>${escapeHtml(amount)}</span></div></div>`,
    );
    return this;
  }

  divider(): this {
    this.parts.push('<div class="divider"></div>');
    return this;
  }

  build(): string {
    return this.parts.join('');
  }
}

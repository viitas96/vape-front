import { Injectable } from '@angular/core';

const RECEIPT_STYLES = `
  @page { size: 80mm auto; margin: 4mm; }
  * { box-sizing: border-box; }
  body { margin: 0; width: 72mm; font-family: 'Courier New', monospace; font-size: 12px; color: #000; }
  .center { text-align: center; }
  .title { font-size: 15px; font-weight: 700; }
  .subtitle { font-size: 13px; font-weight: 700; margin-top: 4px; }
  .row { display: flex; justify-content: space-between; gap: 8px; }
  .row span:last-child { text-align: right; white-space: nowrap; }
  .item { margin: 2px 0; }
  .item-name { word-break: break-word; }
  .total { font-size: 14px; font-weight: 700; }
  .divider { border-top: 1px dashed #000; margin: 6px 0; }
  .muted { font-size: 11px; }
`;

@Injectable({ providedIn: 'root' })
export class PrintService {

  print(title: string, bodyHtml: string): void {
    const frame = document.createElement('iframe');
    frame.style.position = 'fixed';
    frame.style.width = '0';
    frame.style.height = '0';
    frame.style.border = '0';
    frame.setAttribute('aria-hidden', 'true');
    document.body.appendChild(frame);

    const frameWindow = frame.contentWindow;
    const frameDocument = frameWindow?.document;
    if (!frameWindow || !frameDocument) {
      frame.remove();
      return;
    }

    frameDocument.open();
    frameDocument.write(`<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title><style>${RECEIPT_STYLES}</style></head><body>${bodyHtml}</body></html>`);
    frameDocument.close();

    frameWindow.onafterprint = () => frame.remove();
    setTimeout(() => {
      frameWindow.focus();
      frameWindow.print();
      setTimeout(() => frame.remove(), 60000);
    }, 50);
  }
}

export function escapeHtml(value: string | number | null | undefined): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

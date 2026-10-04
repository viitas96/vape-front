import { HttpResponse } from '@angular/common/http';

const FILE_NAME_PATTERN = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i;

export function saveFile(response: HttpResponse<Blob>, fallbackName: string): void {
  if (!response.body) {
    return;
  }

  const disposition = response.headers.get('Content-Disposition') ?? '';
  const fileName = decodeURIComponent(FILE_NAME_PATTERN.exec(disposition)?.[1] ?? fallbackName);
  const url = URL.createObjectURL(response.body);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export function toQueryParams(values: object): Record<string, string | number> {
  const params: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(values)) {
    if (value !== null && value !== undefined && value !== '') {
      params[key] = value as string | number;
    }
  }
  return params;
}

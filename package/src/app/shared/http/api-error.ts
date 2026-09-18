interface ApiErrorResponse {
  message?: string;
  errors?: Record<string, unknown>;
}

interface ApiError {
  status?: number;
  error?: ApiErrorResponse;
}

export function isDuplicateValueError(error: unknown): boolean {
  return (error as ApiError | null)?.status === 409;
}

export function getApiErrorMessage(
  error: unknown,
  fallback: string,
  localizedFieldMessages: Record<string, string> = {},
): string {
  const response = (error as ApiError | null)?.error;
  const fieldMessages = Object.entries(response?.errors ?? {})
    .map(([field, message]) => localizedFieldMessages[field] ?? message)
    .filter((message): message is string => typeof message === 'string' && message.length > 0);

  if (fieldMessages.length > 0) {
    return fieldMessages.join('; ');
  }

  if (response?.message) {
    return response.message;
  }

  return fallback;
}

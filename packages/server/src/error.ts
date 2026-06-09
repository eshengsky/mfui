import type { MFUIServerError } from './types.js';

export function createMFUIServerError(
  code: string,
  message: string,
  status = 400,
): MFUIServerError {
  const error = new Error(message) as MFUIServerError;
  error.code = code;
  error.status = status;
  return error;
}

export function isMFUIServerError(error: unknown): error is MFUIServerError {
  return Boolean(
    error &&
      typeof error === 'object' &&
      'code' in error &&
      'status' in error &&
      typeof (error as { code?: unknown }).code === 'string' &&
      typeof (error as { status?: unknown }).status === 'number',
  );
}

export function errorToResponse(error: unknown): Response {
  if (isMFUIServerError(error)) {
    return jsonResponse(
      {
        error: {
          code: error.code,
          message: error.message,
        },
      },
      { status: error.status },
    );
  }

  const message = error instanceof Error ? error.message : 'Internal server error';
  return jsonResponse(
    {
      error: {
        code: 'internal_error',
        message,
      },
    },
    { status: 500 },
  );
}

function jsonResponse(body: unknown, init: ResponseInit): Response {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json; charset=utf-8');
  return new Response(JSON.stringify(body), {
    ...init,
    headers,
  });
}

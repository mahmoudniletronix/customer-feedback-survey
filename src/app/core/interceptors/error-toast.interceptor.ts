import {
  HttpContextToken,
  HttpErrorResponse,
  HttpResponse,
  HttpInterceptorFn,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, from, mergeMap, of, tap, throwError } from 'rxjs';
import { I18nService } from '../services/i18n.service';
import { ToastService } from '../../shared/ui/toast/toast.service';

export const SKIP_ERROR_TOAST = new HttpContextToken<boolean>(() => false);
export const SKIP_SUCCESS_TOAST = new HttpContextToken<boolean>(() => false);

interface ApiProblemDetails {
  title: string;
  detail: string;
  errors: readonly string[];
}

export const errorToastInterceptor: HttpInterceptorFn = (request, next) => {
  const toastService = inject(ToastService);
  const i18n = inject(I18nService);

  return next(request).pipe(
    tap((event) => {
      if (
        event instanceof HttpResponse &&
        isMutationMethod(request.method) &&
        !isAuthRequest(request.url) &&
        !request.context.get(SKIP_SUCCESS_TOAST)
      ) {
        toastService.success(
          i18n.translate('toast.successTitle'),
          i18n.translate('toast.successDescription'),
        );
      }
    }),
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && !request.context.get(SKIP_ERROR_TOAST)) {
        return resolveProblemDetails(error).pipe(
          mergeMap((problem) => {
            toastService.error(problem.title, problem.detail || problem.errors.join('\n'));
            return throwError(() => error);
          }),
        );
      }

      return throwError(() => error);
    }),
  );
};

function isMutationMethod(method: string): boolean {
  return method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE';
}

function isAuthRequest(url: string): boolean {
  return url.includes('/api/auth/');
}

function resolveProblemDetails(error: HttpErrorResponse) {
  const body = error.error;
  if (body instanceof Blob) {
    return from(readBlobProblemDetails(error, body));
  }

  return of(readProblemDetails(error, body));
}

async function readBlobProblemDetails(error: HttpErrorResponse, blob: Blob): Promise<ApiProblemDetails> {
  const text = (await blob.text()).trim();
  if (!text) {
    return readProblemDetails(error, {});
  }

  return readProblemDetails(error, parseProblemText(text));
}

function readProblemDetails(error: HttpErrorResponse, body: unknown): ApiProblemDetails {
  const problem = isRecord(body) ? body : {};
  const errors = readErrorMessages(problem['errors']);
  const detail =
    readString(problem['detail']) ||
    readString(problem['message']) ||
    (typeof body === 'string' ? body.trim() : '');
  const safeDetail = isHttpClientFailureMessage(detail) ? '' : detail;
  const title = readString(problem['title']) || statusTitle(error.status);

  return {
    title,
    detail: errors.length > 0 ? errors.slice(0, 3).join('\n') : safeDetail || statusDescription(error.status),
    errors,
  };
}

function parseProblemText(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function readErrorMessages(errors: unknown): readonly string[] {
  if (!Array.isArray(errors)) {
    return [];
  }

  return errors
    .map((error) => {
      if (!isRecord(error)) {
        return '';
      }

      return readString(error['message']) || readString(error['code']);
    })
    .filter((message) => message.length > 0);
}

function statusTitle(status: number): string {
  if (status === 0) {
    return 'Network error';
  }
  if (status === 401) {
    return 'Unauthorized';
  }
  if (status === 403) {
    return 'Forbidden';
  }
  if (status === 404) {
    return 'Not found';
  }
  if (status === 422 || status === 400) {
    return 'Validation error';
  }

  return 'Request failed';
}

function statusDescription(status: number): string {
  if (status === 0) {
    return 'Unable to reach the server. Please check your connection.';
  }
  if (status === 401) {
    return 'Please sign in again to continue.';
  }
  if (status === 403) {
    return 'You do not have permission to complete this action.';
  }
  if (status === 404) {
    return 'The requested resource was not found.';
  }
  if (status === 422 || status === 400) {
    return 'Please review the submitted data and try again.';
  }

  return 'The request could not be completed. Please try again.';
}

function isHttpClientFailureMessage(value: string): boolean {
  const normalizedValue = value.toLowerCase();
  return normalizedValue.includes('http failure response for') || normalizedValue.includes('/api/');
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { I18nService, Language } from '../services/i18n.service';

const ACCEPT_LANGUAGE_HEADER = 'Accept-Language';
const ACCEPT_LANGUAGE_VALUES: Record<Language, string> = {
  ar: 'ar-EG,ar;q=0.9,en;q=0.8',
  en: 'en-US,en;q=0.9,ar;q=0.8',
};

export const languageInterceptor: HttpInterceptorFn = (request, next) => {
  if (request.headers.has(ACCEPT_LANGUAGE_HEADER)) {
    return next(request);
  }

  const i18n = inject(I18nService);
  const language = i18n.language();

  return next(
    request.clone({
      setHeaders: {
        [ACCEPT_LANGUAGE_HEADER]: ACCEPT_LANGUAGE_VALUES[language],
      },
    }),
  );
};

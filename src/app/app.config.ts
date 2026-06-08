import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { RuntimeConfigService } from './core/config/runtime-config.service';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorToastInterceptor } from './core/interceptors/error-toast.interceptor';
import { languageInterceptor } from './core/interceptors/language.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideAppInitializer(() => inject(RuntimeConfigService).load()),
    provideHttpClient(withInterceptors([languageInterceptor, authInterceptor, errorToastInterceptor])),
  ]
};

import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';
import { environment } from '../../../environments/environment';

interface RuntimeConfig {
  readonly apiBaseUrl: string;
}

type MutableEnvironment = {
  apiBaseUrl: string;
};

const CONFIG_FILE_NAME = 'app-config.json';

@Injectable({ providedIn: 'root' })
export class RuntimeConfigService {
  private readonly document = inject(DOCUMENT);
  private readonly configSignal = signal<RuntimeConfig>({
    apiBaseUrl: this.normalizeApiBaseUrl(environment.apiBaseUrl),
  });

  readonly config = this.configSignal.asReadonly();

  async load(): Promise<void> {
    try {
      const response = await fetch(this.configUrl(), { cache: 'no-store' });
      if (!response.ok) {
        return;
      }

      const body = (await response.json()) as unknown;
      const apiBaseUrl = this.normalizeApiBaseUrl(this.readString(body, 'apiBaseUrl'));
      if (!apiBaseUrl) {
        return;
      }

      (environment as MutableEnvironment).apiBaseUrl = apiBaseUrl;
      this.configSignal.set({ apiBaseUrl });
    } catch {
      return;
    }
  }

  private configUrl(): string {
    return new URL(CONFIG_FILE_NAME, this.document.baseURI).toString();
  }

  private normalizeApiBaseUrl(value: string): string {
    return value.trim().replace(/\/+$/, '');
  }

  private readString(value: unknown, key: string): string {
    if (typeof value !== 'object' || value === null) {
      return '';
    }

    const record = value as Record<string, unknown>;
    const field = record[key];
    return typeof field === 'string' ? field : '';
  }
}

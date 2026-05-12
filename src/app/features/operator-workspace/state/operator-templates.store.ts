import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { finalize, take } from 'rxjs';
import { OperatorMyTemplates } from '../models/operator-template.model';
import { OperatorTemplatesService } from '../services/operator-templates.service';

@Injectable()
export class OperatorTemplatesStore {
  private readonly operatorTemplatesService = inject(OperatorTemplatesService);
  private readonly myTemplatesSignal = signal<OperatorMyTemplates | null>(null);
  private readonly loadingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);

  readonly myTemplates = this.myTemplatesSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly templates = computed(() => this.myTemplatesSignal()?.templates ?? []);
  readonly templatesCount = computed(() => this.myTemplatesSignal()?.templatesCount ?? this.templates().length);
  readonly questionsCount = computed(() =>
    this.templates().reduce((total, template) => total + template.questionsCount, 0),
  );

  load(): void {
    if (this.loadingSignal()) {
      return;
    }

    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.operatorTemplatesService
      .myTemplates()
      .pipe(
        take(1),
        finalize(() => this.loadingSignal.set(false)),
      )
      .subscribe({
        next: (myTemplates) => {
          this.myTemplatesSignal.set({
            ...myTemplates,
            templates: myTemplates.templates.filter((template) => template.templateId.length > 0),
          });
        },
        error: (error: unknown) => {
          this.myTemplatesSignal.set(null);
          this.errorSignal.set(this.readErrorKey(error));
        },
      });
  }

  private readErrorKey(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'operatorTemplates.loadError';
    }
    if (error.status === 401) {
      return 'operatorTemplates.unauthorized';
    }
    if (error.status === 403) {
      return 'operatorTemplates.forbidden';
    }
    return 'operatorTemplates.loadError';
  }
}

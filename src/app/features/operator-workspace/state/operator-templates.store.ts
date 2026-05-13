import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { finalize, take } from 'rxjs';
import {
  OperatorMyTemplates,
  OperatorTemplateAnswerSubmission,
  OperatorTemplateResponseResult,
} from '../models/operator-template.model';
import { OperatorTemplatesService } from '../services/operator-templates.service';

interface ApiErrorItem {
  code?: string;
  message?: string;
  messageName?: string;
}

interface ApiErrorResponse {
  errors?: readonly ApiErrorItem[];
  title?: string;
  detail?: string;
}

@Injectable()
export class OperatorTemplatesStore {
  private readonly operatorTemplatesService = inject(OperatorTemplatesService);
  private readonly myTemplatesSignal = signal<OperatorMyTemplates | null>(null);
  private readonly submittedResponseSignal = signal<OperatorTemplateResponseResult | null>(null);
  private readonly loadingSignal = signal(false);
  private readonly submittingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);
  private readonly submitErrorSignal = signal<string | null>(null);
  private readonly submitSuccessSignal = signal<string | null>(null);

  readonly myTemplates = this.myTemplatesSignal.asReadonly();
  readonly submittedResponse = this.submittedResponseSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly submitting = this.submittingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly submitError = this.submitErrorSignal.asReadonly();
  readonly submitSuccess = this.submitSuccessSignal.asReadonly();
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

  submitTemplateResponse(
    templateId: string,
    answers: readonly OperatorTemplateAnswerSubmission[],
    onSubmitted: (response: OperatorTemplateResponseResult) => void,
  ): void {
    if (this.submittingSignal()) {
      return;
    }

    this.submittingSignal.set(true);
    this.submitErrorSignal.set(null);
    this.submitSuccessSignal.set(null);
    this.submittedResponseSignal.set(null);

    this.operatorTemplatesService
      .submitResponse(templateId, answers)
      .pipe(
        take(1),
        finalize(() => this.submittingSignal.set(false)),
      )
      .subscribe({
        next: (response) => {
          this.submittedResponseSignal.set(response);
          this.submitSuccessSignal.set('operatorTemplates.submitSuccess');
          onSubmitted(response);
        },
        error: (error: unknown) => {
          this.submitErrorSignal.set(this.readSubmitError(error));
        },
      });
  }

  clearSubmitState(): void {
    this.submitErrorSignal.set(null);
    this.submitSuccessSignal.set(null);
    this.submittedResponseSignal.set(null);
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

  private readSubmitError(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'operatorTemplates.submitError';
    }

    const backendMessage = this.readProblemDetailsMessage(error.error);
    if (backendMessage.length > 0) {
      return backendMessage;
    }

    if (error.status === 401) {
      return 'operatorTemplates.unauthorized';
    }
    if (error.status === 403) {
      return 'operatorTemplates.submitForbidden';
    }
    if (error.status === 404) {
      return 'operatorTemplates.templateNotAssigned';
    }

    return 'operatorTemplates.submitError';
  }

  private readProblemDetailsMessage(errorBody: unknown): string {
    if (!this.isApiErrorResponse(errorBody)) {
      return '';
    }

    const firstError = errorBody.errors?.[0];
    return firstError?.message ?? errorBody.detail ?? errorBody.title ?? '';
  }

  private isApiErrorResponse(value: unknown): value is ApiErrorResponse {
    return typeof value === 'object' && value !== null;
  }
}

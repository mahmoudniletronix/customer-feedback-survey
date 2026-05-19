import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { finalize, take } from 'rxjs';
import {
  OperatorAssignedTemplate,
  OperatorLatestTemplateResponse,
  OperatorMyTemplates,
  OperatorTemplateAnswerSubmission,
  OperatorTemplateCustomInputSubmission,
  OperatorTemplateResponseResult,
} from '../../domain/operator-template.model';
import { OperatorTemplatesService } from '../../data/operator-templates.service';

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
  private readonly inactiveTemplateIdsSignal = signal<ReadonlySet<string>>(new Set());

  readonly myTemplates = this.myTemplatesSignal.asReadonly();
  readonly submittedResponse = this.submittedResponseSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly submitting = this.submittingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly submitError = this.submitErrorSignal.asReadonly();
  readonly submitSuccess = this.submitSuccessSignal.asReadonly();
  readonly inactiveTemplateIds = this.inactiveTemplateIdsSignal.asReadonly();
  readonly templates = computed(() => {
    const inactiveTemplateIds = this.inactiveTemplateIdsSignal();

    return (this.myTemplatesSignal()?.templates ?? []).map((template) =>
      inactiveTemplateIds.has(template.templateId) ? { ...template, isActive: false } : template,
    );
  });
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
            templates: myTemplates.templates
              .filter((template) => template.templateId.length > 0)
              .map((template) =>
                this.inactiveTemplateIdsSignal().has(template.templateId)
                  ? { ...template, isActive: false }
                  : template,
              ),
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
    customInputs: readonly OperatorTemplateCustomInputSubmission[],
    onSubmitted: (response: OperatorTemplateResponseResult) => void,
    onRejected?: (errorKey: string) => void,
  ): void {
    if (this.submittingSignal()) {
      return;
    }

    this.submittingSignal.set(true);
    this.submitErrorSignal.set(null);
    this.submitSuccessSignal.set(null);
    this.submittedResponseSignal.set(null);

    this.operatorTemplatesService
      .submitResponse(templateId, answers, customInputs)
      .pipe(
        take(1),
        finalize(() => this.submittingSignal.set(false)),
      )
      .subscribe({
        next: (response) => {
          this.submittedResponseSignal.set(response);
          this.applySubmittedResponse(templateId, response, answers);
          this.submitSuccessSignal.set('operatorTemplates.submitSuccess');
          onSubmitted(response);
        },
        error: (error: unknown) => {
          const submitError = this.readSubmitError(error);
          this.submitErrorSignal.set(submitError);

          if (this.shouldRefreshTemplatesAfterSubmitError(submitError)) {
            if (this.isTemplateAvailabilitySubmitError(submitError)) {
              this.markTemplateInactive(templateId);
            }
            this.load();
          }
          onRejected?.(submitError);
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
    const marker = [firstError?.code, firstError?.messageName, firstError?.message, errorBody.detail, errorBody.title]
      .filter((value): value is string => typeof value === 'string')
      .join(' ');
    const normalizedMarker = marker.replace(/[\s_.-]/g, '').toLowerCase();

    if (normalizedMarker.includes('templateinactive')) {
      return 'operatorTemplates.templateInactive';
    }
    if (normalizedMarker.includes('templatenotstartedyet')) {
      return 'operatorTemplates.templateNotStartedYet';
    }
    if (normalizedMarker.includes('templateexpired')) {
      return 'operatorTemplates.templateExpired';
    }
    if (normalizedMarker.includes('visiblequestions') && normalizedMarker.includes('required')) {
      return 'operatorTemplates.visibleQuestionsRequired';
    }
    if (normalizedMarker.includes('hiddenquestionanswer') && normalizedMarker.includes('notallowed')) {
      return 'operatorTemplates.hiddenQuestionAnswerNotAllowed';
    }
    if (normalizedMarker.includes('custominput') && normalizedMarker.includes('duplicated')) {
      return 'operatorTemplates.customInputDuplicated';
    }
    if (normalizedMarker.includes('custominput') && normalizedMarker.includes('notfound')) {
      return 'operatorTemplates.customInputNotFound';
    }
    if (normalizedMarker.includes('custominput') && normalizedMarker.includes('required')) {
      return 'operatorTemplates.customInputRequired';
    }
    if (normalizedMarker.includes('custominput') && normalizedMarker.includes('type') && normalizedMarker.includes('invalid')) {
      return 'operatorTemplates.customInputTypeInvalid';
    }
    if (normalizedMarker.includes('custominput') && normalizedMarker.includes('string') && normalizedMarker.includes('minlength')) {
      return 'operatorTemplates.customInputMinLength';
    }
    if (normalizedMarker.includes('custominput') && normalizedMarker.includes('string') && normalizedMarker.includes('maxlength')) {
      return 'operatorTemplates.customInputMaxLength';
    }
    if (normalizedMarker.includes('custominput') && normalizedMarker.includes('integer') && normalizedMarker.includes('invalid')) {
      return 'operatorTemplates.customInputInteger';
    }
    if (normalizedMarker.includes('custominput') && normalizedMarker.includes('integer') && normalizedMarker.includes('minvalue')) {
      return 'operatorTemplates.customInputMinValue';
    }
    if (normalizedMarker.includes('custominput') && normalizedMarker.includes('integer') && normalizedMarker.includes('maxvalue')) {
      return 'operatorTemplates.customInputMaxValue';
    }

    return firstError?.message ?? errorBody.detail ?? errorBody.title ?? '';
  }

  private markTemplateInactive(templateId: string): void {
    if (templateId.length === 0) {
      return;
    }

    this.inactiveTemplateIdsSignal.update((templateIds) => new Set(templateIds).add(templateId));
    this.myTemplatesSignal.update((myTemplates) =>
      myTemplates
        ? {
            ...myTemplates,
            templates: myTemplates.templates.map((template) =>
              template.templateId === templateId ? { ...template, isActive: false } : template,
            ),
          }
        : myTemplates,
    );
  }

  private applySubmittedResponse(
    templateId: string,
    response: OperatorTemplateResponseResult,
    answers: readonly OperatorTemplateAnswerSubmission[],
  ): void {
    this.myTemplatesSignal.update((myTemplates) => {
      if (!myTemplates) {
        return myTemplates;
      }

      let templateUpdated = false;
      const templates = myTemplates.templates.map((template) => {
        if (template.templateId !== templateId) {
          return template;
        }

        templateUpdated = true;
        return {
          ...template,
          hasAnswered: true,
          latestResponse: this.toLatestResponseFromSubmittedResult(template, response, answers),
        };
      });

      return templateUpdated ? { ...myTemplates, templates } : myTemplates;
    });
  }

  private toLatestResponseFromSubmittedResult(
    template: OperatorAssignedTemplate,
    response: OperatorTemplateResponseResult,
    answers: readonly OperatorTemplateAnswerSubmission[],
  ): OperatorLatestTemplateResponse {
    return {
      surveyResponseId: response.surveyResponseId,
      submittedOnUtc: response.submittedOnUtc,
      answersCount: response.answersCount,
      customInputsCount: response.customInputsCount,
      score: {
        actualScore: response.actualScore,
        maxScore: response.maxScore,
        percentage: response.scorePercentage,
      },
      customInputs: response.customInputs,
      answers: answers.map((answer) => {
        const question = template.questions.find(
          (templateQuestion) => templateQuestion.questionId === answer.questionId,
        );
        const selectedOption = answer.selectedQuestionOptionId
          ? question?.options.find((option) => option.optionId === answer.selectedQuestionOptionId)
          : undefined;

        return {
          templateQuestionId: question?.templateQuestionId ?? '',
          questionId: answer.questionId,
          questionType: question?.type ?? '',
          selectedQuestionOptionId: answer.selectedQuestionOptionId ?? null,
          selectedOptionTextEn: selectedOption?.textEn ?? null,
          selectedOptionTextAr: selectedOption?.textAr ?? null,
          starRatingValue: answer.starRatingValue ?? null,
          smileValue: answer.smileValue ?? null,
          textAnswer: answer.textAnswer ?? null,
          voiceFileName: answer.voiceFile?.name ?? null,
          voiceFileUrl: null,
        };
      }),
    };
  }

  private shouldRefreshTemplatesAfterSubmitError(errorKey: string): boolean {
    return (
      this.isTemplateAvailabilitySubmitError(errorKey) ||
      errorKey === 'operatorTemplates.visibleQuestionsRequired' ||
      errorKey === 'operatorTemplates.hiddenQuestionAnswerNotAllowed'
    );
  }

  private isTemplateAvailabilitySubmitError(errorKey: string): boolean {
    return (
      errorKey === 'operatorTemplates.templateInactive' ||
      errorKey === 'operatorTemplates.templateNotStartedYet' ||
      errorKey === 'operatorTemplates.templateExpired'
    );
  }

  private isApiErrorResponse(value: unknown): value is ApiErrorResponse {
    return typeof value === 'object' && value !== null;
  }
}

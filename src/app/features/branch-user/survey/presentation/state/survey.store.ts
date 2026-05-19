import { Injectable, computed, inject, signal } from '@angular/core';
import { finalize, take } from 'rxjs';
import { CreateQuestionPayload, CreateSurveyPayload, Survey } from '../../domain/survey.model';
import { SurveyService } from '../../data/survey.service';

@Injectable()
export class SurveyStore {
  private readonly surveyService = inject(SurveyService);
  private readonly surveysSignal = signal<readonly Survey[]>([]);
  private readonly selectedSurveyIdSignal = signal<string | null>(null);
  private readonly loadingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);

  readonly surveys = this.surveysSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly selectedSurveyId = this.selectedSurveyIdSignal.asReadonly();
  readonly selectedSurvey = computed(() => {
    const selectedId = this.selectedSurveyIdSignal();
    return this.surveysSignal().find((survey) => survey.id === selectedId) ?? this.surveysSignal()[0] ?? null;
  });
  readonly activeCount = computed(() => this.surveysSignal().filter((survey) => survey.status === 'ACTIVE').length);
  readonly totalResponses = computed(() =>
    this.surveysSignal().reduce((total, survey) => total + survey.responses, 0)
  );
  readonly totalQuestions = computed(() =>
    this.surveysSignal().reduce((total, survey) => total + survey.questions.length, 0)
  );

  load(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.surveyService
      .list()
      .pipe(
        take(1),
        finalize(() => this.loadingSignal.set(false))
      )
      .subscribe({
        next: (surveys) => {
          this.surveysSignal.set(surveys);
          this.selectedSurveyIdSignal.set(surveys[0]?.id ?? null);
        },
        error: () => this.errorSignal.set('Unable to load surveys.')
      });
  }

  selectSurvey(surveyId: string): void {
    this.selectedSurveyIdSignal.set(surveyId);
  }

  createSurvey(payload: CreateSurveyPayload): void {
    this.surveyService
      .create(payload)
      .pipe(take(1))
      .subscribe({
        next: (survey) => {
          this.surveysSignal.update((surveys) => [survey, ...surveys]);
          this.selectedSurveyIdSignal.set(survey.id);
        },
        error: () => {
          this.errorSignal.set('survey.createError');
        }
      });
  }

  addQuestion(payload: CreateQuestionPayload): void {
    this.surveyService
      .addQuestion(payload)
      .pipe(take(1))
      .subscribe({
        next: (question) => {
          this.surveysSignal.update((surveys) =>
            surveys.map((survey) =>
              survey.id === payload.surveyId
                ? { ...survey, questions: [...survey.questions, question] }
                : survey
            )
          );
        },
        error: () => {
          this.errorSignal.set('survey.questionCreateError');
        }
      });
  }

  toggleStatus(surveyId: string): void {
    this.surveyService
      .toggleStatus(surveyId)
      .pipe(take(1))
      .subscribe({
        next: (updatedSurvey) => {
          if (!updatedSurvey) {
            return;
          }
          this.surveysSignal.update((surveys) =>
            surveys.map((survey) => (survey.id === updatedSurvey.id ? updatedSurvey : survey))
          );
        },
        error: () => {
          this.errorSignal.set('survey.statusUpdateError');
        }
      });
  }
}

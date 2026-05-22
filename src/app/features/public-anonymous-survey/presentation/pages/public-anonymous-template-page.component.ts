import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertCircle, Languages, Mic, Send, Star } from 'lucide-angular';
import { I18nService } from '../../../../core/services/i18n.service';
import {
  QUESTION_ANSWER_TYPE,
  toQuestionAnswerType,
} from '../../../../shared/models/question-answer.model';
import {
  PublicAnonymousAnswerDraft,
  PublicAnonymousAnswerPayload,
  PublicAnonymousCustomInputValuePayload,
  PublicAnonymousTemplate,
  PublicAnonymousTemplateCustomInput,
  PublicAnonymousTemplateQuestion,
  PublicAnonymousTemplateQuestionCondition,
  PublicAnonymousTemplateQuestionOption,
  PublicQuestionKind,
  SubmitPublicAnonymousResponsePayload,
} from '../../domain/public-anonymous-template.model';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { PublicSurveyFooterComponent } from '../components/public-survey-footer.component';
import { PublicSurveyBrandingService } from '../services/public-survey-branding.service';
import { PublicAnonymousTemplateStore } from '../state/public-anonymous-template.store';

const RATING_VALUES = [1, 2, 3, 4, 5] as const;

@Component({
  selector: 'app-public-anonymous-template-page',
  standalone: true,
  imports: [IconComponent, TranslatePipe, PublicSurveyFooterComponent],
  templateUrl: './public-anonymous-template-page.component.html',
  styleUrl: './public-anonymous-template-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicAnonymousTemplatePageComponent implements OnInit, OnDestroy {
  readonly publicAnonymousTemplateStore = inject(PublicAnonymousTemplateStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly i18n = inject(I18nService);
  private readonly publicSurveyBranding = inject(PublicSurveyBrandingService);

  readonly alertIcon = AlertCircle;
  readonly languageIcon = Languages;
  readonly micIcon = Mic;
  readonly sendIcon = Send;
  readonly starIcon = Star;
  readonly ratingValues = RATING_VALUES;

  readonly customInputValues = signal<Readonly<Record<string, string>>>({});
  readonly answers = signal<Readonly<Record<string, PublicAnonymousAnswerDraft>>>({});
  readonly validationSubmitted = signal(false);
  readonly validationError = signal<string | null>(null);

  readonly templateName = computed(() => {
    const template = this.publicAnonymousTemplateStore.template();
    return template ? this.localizedText(template.nameEn, template.nameAr) : '';
  });

  readonly templateDescription = computed(() => {
    const template = this.publicAnonymousTemplateStore.template();
    return template ? this.localizedText(template.description ?? '', null) : '';
  });

  readonly visibleQuestions = computed<readonly PublicAnonymousTemplateQuestion[]>(() => {
    const template = this.publicAnonymousTemplateStore.template();
    return template ? this.visibleQuestionsFromAnswers(template, this.answers()) : [];
  });
  readonly hierarchyDepthByQuestionId = computed<Readonly<Record<string, number>>>(() => {
    const template = this.publicAnonymousTemplateStore.template();
    return template ? this.buildQuestionHierarchyDepths(template) : {};
  });

  readonly answeredVisibleQuestionsCount = computed(
    () => this.visibleQuestions().filter((question) => this.hasAnswer(question)).length,
  );
  readonly progressPercent = computed(() => {
    const visibleQuestionsCount = this.visibleQuestions().length;
    return visibleQuestionsCount > 0
      ? (this.answeredVisibleQuestionsCount() / visibleQuestionsCount) * 100
      : 0;
  });
  readonly canSubmit = computed(
    () =>
      !this.publicAnonymousTemplateStore.submitting() &&
      this.publicAnonymousTemplateStore.template() !== null,
  );

  ngOnInit(): void {
    this.publicSurveyBranding.applyPublicSurveyBranding();

    const anonymousTemplateId = this.route.snapshot.paramMap.get('anonymousTemplateId') ?? '';
    this.publicAnonymousTemplateStore.load(anonymousTemplateId);
  }

  ngOnDestroy(): void {
    this.publicAnonymousTemplateStore.clear();
    this.publicSurveyBranding.restoreAppBranding();
  }

  toggleLanguage(): void {
    this.i18n.toggleLanguage();
  }

  nextLanguageLabel(): string {
    return this.i18n.nextLanguageLabel();
  }

  questionText(question: PublicAnonymousTemplateQuestion): string {
    return this.localizedText(question.textEn, question.textAr);
  }

  isRootQuestion(question: PublicAnonymousTemplateQuestion): boolean {
    const template = this.publicAnonymousTemplateStore.template();

    return template
      ? template.rootAnonymousTemplateQuestionIds.includes(question.anonymousTemplateQuestionId)
      : question.isRoot;
  }

  questionHierarchyDepth(question: PublicAnonymousTemplateQuestion): number {
    const depth = this.hierarchyDepthByQuestionId()[question.anonymousTemplateQuestionId];
    return depth ?? (this.isRootQuestion(question) ? 0 : 1);
  }

  groupName(question: PublicAnonymousTemplateQuestion): string {
    return this.localizedText(question.groupNameEn, question.groupNameAr);
  }

  customInputLabel(input: PublicAnonymousTemplateCustomInput): string {
    return this.localizedText(input.labelEn ?? input.name, input.labelAr);
  }

  customInputValue(input: PublicAnonymousTemplateCustomInput): string {
    return this.customInputValues()[input.customInputId] ?? '';
  }

  customInputError(input: PublicAnonymousTemplateCustomInput): string {
    const value = this.customInputValue(input).trim();

    if (input.isRequired && value.length === 0) {
      return this.i18n.translate('publicAnonymousTemplates.requiredError');
    }

    if (value.length === 0) {
      return '';
    }

    if (input.type === 1) {
      if (input.minLength !== null && value.length < input.minLength) {
        return `${this.i18n.translate('publicAnonymousTemplates.minLength')} ${input.minLength}`;
      }
      if (input.maxLength !== null && value.length > input.maxLength) {
        return `${this.i18n.translate('publicAnonymousTemplates.maxLength')} ${input.maxLength}`;
      }
    }

    if (input.type === 2) {
      const numberValue = Number(value);
      if (!Number.isInteger(numberValue)) {
        return this.i18n.translate('publicAnonymousTemplates.integerError');
      }
      if (input.minValue !== null && numberValue < input.minValue) {
        return `${this.i18n.translate('publicAnonymousTemplates.minValue')} ${input.minValue}`;
      }
      if (input.maxValue !== null && numberValue > input.maxValue) {
        return `${this.i18n.translate('publicAnonymousTemplates.maxValue')} ${input.maxValue}`;
      }
    }

    return '';
  }

  updateCustomInputValue(input: PublicAnonymousTemplateCustomInput, event: Event): void {
    const value = this.readInputValue(event);
    this.customInputValues.update((values) => ({
      ...values,
      [input.customInputId]: value,
    }));
  }

  answerFor(questionId: string): PublicAnonymousAnswerDraft {
    return this.answers()[questionId] ?? this.emptyAnswer();
  }

  setSingleChoiceAnswer(questionId: string, optionId: string): void {
    this.answers.update((answers) => ({
      ...answers,
      [questionId]: {
        ...this.emptyAnswer(),
        ...answers[questionId],
        selectedQuestionOptionId: optionId,
        starRatingValue: null,
        smileValue: null,
        textAnswer: '',
        voiceFileName: '',
      },
    }));
    this.clearHiddenAnswers();
  }

  setStarRatingAnswer(questionId: string, value: number): void {
    this.answers.update((answers) => ({
      ...answers,
      [questionId]: {
        ...this.emptyAnswer(),
        ...answers[questionId],
        selectedQuestionOptionId: '',
        starRatingValue: value,
        smileValue: null,
        textAnswer: '',
        voiceFileName: '',
      },
    }));
    this.clearHiddenAnswers();
  }

  setSmileAnswer(questionId: string, value: number): void {
    this.answers.update((answers) => ({
      ...answers,
      [questionId]: {
        ...this.emptyAnswer(),
        ...answers[questionId],
        selectedQuestionOptionId: '',
        starRatingValue: null,
        smileValue: value,
        textAnswer: '',
        voiceFileName: '',
      },
    }));
    this.clearHiddenAnswers();
  }

  updateTextAnswer(questionId: string, event: Event): void {
    const value = this.readInputValue(event);
    this.answers.update((answers) => ({
      ...answers,
      [questionId]: {
        ...this.emptyAnswer(),
        ...answers[questionId],
        selectedQuestionOptionId: '',
        starRatingValue: null,
        smileValue: null,
        textAnswer: value,
        voiceFileName: '',
      },
    }));
    this.clearHiddenAnswers();
  }

  updateVoiceFile(questionId: string, event: Event): void {
    const input = event.target instanceof HTMLInputElement ? event.target : null;
    const fileName = input?.files?.item(0)?.name ?? '';

    this.answers.update((answers) => ({
      ...answers,
      [questionId]: {
        ...this.emptyAnswer(),
        ...answers[questionId],
        selectedQuestionOptionId: '',
        starRatingValue: null,
        smileValue: null,
        textAnswer: '',
        voiceFileName: fileName,
      },
    }));
    this.clearHiddenAnswers();
  }

  questionKind(question: PublicAnonymousTemplateQuestion): PublicQuestionKind {
    const answerType = toQuestionAnswerType(question.typeName || question.type);

    if (answerType === QUESTION_ANSWER_TYPE.SingleChoice) {
      return 'singleChoice';
    }
    if (answerType === QUESTION_ANSWER_TYPE.StarRating) {
      return 'starRating';
    }
    if (answerType === QUESTION_ANSWER_TYPE.Smiles) {
      return 'smiles';
    }
    if (answerType === QUESTION_ANSWER_TYPE.Complain) {
      return 'complain';
    }

    return 'voice';
  }

  optionPrimaryText(option: PublicAnonymousTemplateQuestionOption): string {
    return this.toCustomerFacingOptionText(this.localizedText(option.textEn, option.textAr));
  }

  private toCustomerFacingOptionText(value: string): string {
    return value.replace(/\s*(?:[-|]\s*)?(?:Value|Score)\s+[1-5]\s*$/i, '').trim();
  }

  isSingleChoiceSelected(questionId: string, optionId: string): boolean {
    return this.answerFor(questionId).selectedQuestionOptionId === optionId;
  }

  isStarRatingSelected(questionId: string, value: number): boolean {
    return this.answerFor(questionId).starRatingValue === value;
  }

  isSmileSelected(questionId: string, value: number): boolean {
    return this.answerFor(questionId).smileValue === value;
  }

  hasAnswer(question: PublicAnonymousTemplateQuestion): boolean {
    const answer = this.answers()[question.anonymousTemplateQuestionId];
    if (!answer) {
      return false;
    }

    const kind = this.questionKind(question);

    if (kind === 'singleChoice') {
      return answer.selectedQuestionOptionId.length > 0;
    }
    if (kind === 'starRating') {
      return answer.starRatingValue !== null;
    }
    if (kind === 'smiles') {
      return answer.smileValue !== null;
    }
    if (kind === 'complain') {
      return answer.textAnswer.trim().length > 0;
    }

    return answer.voiceFileName.length > 0;
  }

  questionError(question: PublicAnonymousTemplateQuestion): string {
    if (!this.validationSubmitted() || this.hasAnswer(question)) {
      return '';
    }

    return this.i18n.translate('publicAnonymousTemplates.questionRequiredError');
  }

  submitSurvey(): void {
    const template = this.publicAnonymousTemplateStore.template();
    if (!template || !this.canSubmit()) {
      return;
    }

    this.validationSubmitted.set(true);
    this.validationError.set(null);

    if (!this.isFormValid(template)) {
      this.validationError.set('publicAnonymousTemplates.validationError');
      return;
    }

    const payload = this.toSubmitPayload();
    this.publicAnonymousTemplateStore.submitResponse(
      template.anonymousTemplateId,
      payload,
      (submission) => {
        void this.router.navigate(['/survey', template.anonymousTemplateId, 'success'], {
          queryParams: {
            responseId: submission.anonymousSurveyResponseId,
          },
          state: {
            submission,
          },
        });
      },
    );
  }

  private toSubmitPayload(): SubmitPublicAnonymousResponsePayload {
    const template = this.publicAnonymousTemplateStore.template();
    if (!template) {
      return {
        customInputValues: [],
        answers: [],
      };
    }

    return {
      customInputValues: template.customInputs
        .map((input) => this.toCustomInputValuePayload(input))
        .filter((value): value is PublicAnonymousCustomInputValuePayload => value !== null),
      answers: this.visibleQuestions().map((question) => this.toAnswerPayload(question)),
    };
  }

  private toCustomInputValuePayload(
    input: PublicAnonymousTemplateCustomInput,
  ): PublicAnonymousCustomInputValuePayload | null {
    const value = this.customInputValue(input).trim();

    if (!input.isRequired && value.length === 0) {
      return null;
    }

    return {
      customInputId: input.customInputId,
      stringValue: input.type === 1 ? value : null,
      integerValue: input.type === 2 ? Number(value) : null,
    };
  }

  private toAnswerPayload(question: PublicAnonymousTemplateQuestion): PublicAnonymousAnswerPayload {
    const answer = this.answerFor(question.anonymousTemplateQuestionId);
    const kind = this.questionKind(question);

    return {
      anonymousTemplateQuestionId: question.anonymousTemplateQuestionId,
      selectedQuestionOptionId: kind === 'singleChoice' ? answer.selectedQuestionOptionId : null,
      starRatingValue: kind === 'starRating' ? answer.starRatingValue : null,
      smileValue: kind === 'smiles' ? answer.smileValue : null,
      textAnswer: kind === 'complain' ? answer.textAnswer.trim() : null,
      voiceFileName: kind === 'voice' ? answer.voiceFileName : null,
    };
  }

  private isConditionMatched(
    condition: PublicAnonymousTemplateQuestionCondition,
    answer: PublicAnonymousAnswerDraft,
  ): boolean {
    const normalizedTriggerName = condition.triggerTypeName.replace(/[\s_-]/g, '').toLowerCase();

    if (condition.triggerType === 1 || normalizedTriggerName.includes('single')) {
      return (
        condition.selectedQuestionOptionId !== null &&
        answer.selectedQuestionOptionId === condition.selectedQuestionOptionId
      );
    }

    if (condition.triggerType === 2 || normalizedTriggerName.includes('star')) {
      return condition.triggerValue !== null && answer.starRatingValue === condition.triggerValue;
    }

    return condition.triggerValue !== null && answer.smileValue === condition.triggerValue;
  }

  private clearHiddenAnswers(): void {
    const template = this.publicAnonymousTemplateStore.template();
    if (!template) {
      return;
    }

    this.answers.update((answers) => this.visibleAnswerSubset(template, answers));
  }

  private visibleAnswerSubset(
    template: PublicAnonymousTemplate,
    answers: Readonly<Record<string, PublicAnonymousAnswerDraft>>,
  ): Readonly<Record<string, PublicAnonymousAnswerDraft>> {
    const visibleQuestionIds = new Set(
      this.visibleQuestionsFromAnswers(template, answers).map(
        (question) => question.anonymousTemplateQuestionId,
      ),
    );
    const nextAnswers: Record<string, PublicAnonymousAnswerDraft> = {};

    Object.entries(answers).forEach(([questionId, answer]) => {
      if (visibleQuestionIds.has(questionId)) {
        nextAnswers[questionId] = answer;
      }
    });

    return nextAnswers;
  }

  private visibleQuestionsFromAnswers(
    template: PublicAnonymousTemplate,
    answers: Readonly<Record<string, PublicAnonymousAnswerDraft>>,
  ): readonly PublicAnonymousTemplateQuestion[] {
    const questionsById = new Map(
      template.questions.map((question) => [question.anonymousTemplateQuestionId, question]),
    );
    const orderedIds: string[] = [];

    const visitQuestion = (questionId: string, path: ReadonlySet<string>): void => {
      if (path.has(questionId)) {
        return;
      }

      const question = questionsById.get(questionId);
      if (!question || orderedIds.includes(questionId)) {
        return;
      }

      orderedIds.push(questionId);

      const answer = answers[questionId];
      if (!answer) {
        return;
      }

      const nextPath = new Set(path);
      nextPath.add(questionId);

      template.questionConditions
        .filter(
          (condition) =>
            condition.parentAnonymousTemplateQuestionId === questionId &&
            this.isConditionMatched(condition, answer),
        )
        .sort((first, second) => first.order - second.order)
        .forEach((condition) =>
          visitQuestion(condition.childAnonymousTemplateQuestionId, nextPath),
        );
    };

    template.rootAnonymousTemplateQuestionIds.forEach((questionId) =>
      visitQuestion(questionId, new Set()),
    );

    return orderedIds
      .map((questionId) => questionsById.get(questionId))
      .filter((question): question is PublicAnonymousTemplateQuestion => question !== undefined);
  }

  private buildQuestionHierarchyDepths(
    template: PublicAnonymousTemplate,
  ): Readonly<Record<string, number>> {
    const depths: Record<string, number> = {};
    const childIdsByParent = new Map<string, string[]>();

    template.questionConditions
      .slice()
      .sort((first, second) => first.order - second.order)
      .forEach((condition) => {
        const childIds = childIdsByParent.get(condition.parentAnonymousTemplateQuestionId) ?? [];

        if (!childIds.includes(condition.childAnonymousTemplateQuestionId)) {
          childIds.push(condition.childAnonymousTemplateQuestionId);
        }

        childIdsByParent.set(condition.parentAnonymousTemplateQuestionId, childIds);
      });

    const visitQuestion = (questionId: string, depth: number, path: ReadonlySet<string>): void => {
      const currentDepth = depths[questionId];
      if (currentDepth !== undefined && currentDepth <= depth) {
        return;
      }

      depths[questionId] = depth;

      if (path.has(questionId)) {
        return;
      }

      const nextPath = new Set(path);
      nextPath.add(questionId);

      (childIdsByParent.get(questionId) ?? []).forEach((childQuestionId) =>
        visitQuestion(childQuestionId, depth + 1, nextPath),
      );
    };

    template.rootAnonymousTemplateQuestionIds.forEach((questionId) =>
      visitQuestion(questionId, 0, new Set()),
    );

    template.questions.forEach((question) => {
      depths[question.anonymousTemplateQuestionId] ??= question.isRoot ? 0 : 1;
    });

    return depths;
  }

  private isFormValid(template: PublicAnonymousTemplate): boolean {
    const customInputsValid = template.customInputs.every(
      (input) => this.customInputError(input).length === 0,
    );
    const visibleQuestionsValid = this.visibleQuestions().every((question) =>
      this.hasAnswer(question),
    );

    return customInputsValid && visibleQuestionsValid;
  }

  private localizedText(primary: string, secondary: string | null): string {
    if (this.i18n.language() === 'ar') {
      return secondary?.trim() || primary;
    }

    return primary.trim() || secondary?.trim() || '';
  }

  private emptyAnswer(): PublicAnonymousAnswerDraft {
    return {
      selectedQuestionOptionId: '',
      starRatingValue: null,
      smileValue: null,
      textAnswer: '',
      voiceFileName: '',
    };
  }

  private readInputValue(event: Event): string {
    return event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement
      ? event.target.value
      : '';
  }
}

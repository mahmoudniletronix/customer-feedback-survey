import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { FileAudio, RotateCcw, Star } from 'lucide-angular';
import { I18nService } from '../../../../../core/services/i18n.service';
import {
  QUESTION_ANSWER_TYPE,
  QuestionAnswerOption,
  QuestionAnswerType,
  SMILE_LEVELS,
  questionAnswerTypeLabelKey,
  toQuestionAnswerType,
} from '../../../../../shared/models/question-answer.model';
import {
  ConditionalQuestionAnswerState,
  buildVisibleQuestionIds,
  buildVisibleQuestionOrder,
} from '../../../../../shared/models/question-condition.model';
import { TranslatePipe } from '../../../../../shared/pipes/translate.pipe';
import { ButtonComponent } from '../../../../../shared/ui/button/button.component';
import { IconComponent } from '../../../../../shared/ui/icon/icon.component';
import { BranchTemplateQuestionSelectionItem } from '../../domain/branch-template.model';
import { BranchTemplatesStore } from '../state/branch-templates.store';

interface TemplatePreviewQuestion extends BranchTemplateQuestionSelectionItem {
  templateQuestionId: string;
  groupId: string;
  groupNameEn: string;
  groupNameAr: string;
  groupIsActive: boolean;
  answerType: QuestionAnswerType | null;
}

interface TemplatePreviewAnswerDraft extends ConditionalQuestionAnswerState {
  textAnswer: string;
  voiceFileName: string;
}

const SCALE_VALUES = [1, 2, 3, 4, 5] as const;

@Component({
  selector: 'app-branch-template-preview',
  standalone: true,
  imports: [ButtonComponent, IconComponent, TranslatePipe],
  templateUrl: './branch-template-preview.component.html',
  styleUrl: './branch-template-preview.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BranchTemplatePreviewComponent {
  readonly templatesStore = inject(BranchTemplatesStore);
  private readonly i18n = inject(I18nService);

  readonly fileAudioIcon = FileAudio;
  readonly resetIcon = RotateCcw;
  readonly starIcon = Star;
  readonly ratingValues = SCALE_VALUES;
  readonly smileLevels = SMILE_LEVELS;

  readonly answers = signal<Record<string, TemplatePreviewAnswerDraft>>({});
  private readonly initializedPreviewKey = signal('');

  readonly selectedQuestions = computed<readonly TemplatePreviewQuestion[]>(() =>
    this.flattenSelectedQuestions(),
  );
  readonly visibleQuestionOrder = computed(() =>
    buildVisibleQuestionOrder(
      this.selectedQuestions().map((question) => ({
        templateQuestionId: question.templateQuestionId,
        order: question.order,
      })),
      this.templatesStore.questionsSelection()?.questionConditions ?? [],
      this.answers(),
    ),
  );
  readonly visibleQuestions = computed<readonly TemplatePreviewQuestion[]>(() => {
    const questionsByTemplateQuestionId = new Map(
      this.selectedQuestions().map((question) => [question.templateQuestionId, question]),
    );

    return this.visibleQuestionOrder()
      .map((templateQuestionId) => questionsByTemplateQuestionId.get(templateQuestionId))
      .filter((question): question is TemplatePreviewQuestion => question !== undefined);
  });
  readonly hiddenQuestionsCount = computed(
    () => this.selectedQuestions().length - this.visibleQuestions().length,
  );

  constructor() {
    effect(() => {
      const selection = this.templatesStore.questionsSelection();
      if (!selection) {
        this.answers.set({});
        this.initializedPreviewKey.set('');
        return;
      }

      const previewKey = [
        selection.templateId,
        this.selectedQuestions()
          .map((question) => question.templateQuestionId)
          .join('|'),
        selection.questionConditions
          .map((condition) => `${condition.parentTemplateQuestionId}|${condition.childTemplateQuestionId}|${condition.triggerType}|${condition.selectedQuestionOptionId ?? ''}|${condition.triggerValue ?? ''}`)
          .sort()
          .join('::'),
      ].join('::');

      if (previewKey === this.initializedPreviewKey()) {
        return;
      }

      this.answers.set({});
      this.initializedPreviewKey.set(previewKey);
    });
  }

  resetPreview(): void {
    this.answers.set({});
  }

  selectSingleChoice(question: TemplatePreviewQuestion, optionId: string): void {
    this.updateAnswer(question.templateQuestionId, { selectedQuestionOptionId: optionId });
  }

  selectStarRating(question: TemplatePreviewQuestion, value: number): void {
    this.updateAnswer(question.templateQuestionId, { starRatingValue: value });
  }

  selectSmileValue(question: TemplatePreviewQuestion, value: number): void {
    this.updateAnswer(question.templateQuestionId, { smileValue: value });
  }

  updateTextAnswer(question: TemplatePreviewQuestion, event: Event): void {
    const target = event.target;
    this.updateAnswer(question.templateQuestionId, {
      textAnswer: target instanceof HTMLTextAreaElement ? target.value : '',
    });
  }

  updateVoiceFile(question: TemplatePreviewQuestion, event: Event): void {
    const target = event.target;
    const voiceFileName = target instanceof HTMLInputElement ? (target.files?.[0]?.name ?? '') : '';
    this.updateAnswer(question.templateQuestionId, { voiceFileName });

    if (target instanceof HTMLInputElement) {
      target.value = '';
    }
  }

  selectedOptionId(question: TemplatePreviewQuestion): string {
    return this.answerDraft(question).selectedQuestionOptionId;
  }

  starRatingValue(question: TemplatePreviewQuestion): number | null {
    return this.answerDraft(question).starRatingValue;
  }

  smileValue(question: TemplatePreviewQuestion): number | null {
    return this.answerDraft(question).smileValue;
  }

  textAnswer(question: TemplatePreviewQuestion): string {
    return this.answerDraft(question).textAnswer;
  }

  voiceFileName(question: TemplatePreviewQuestion): string {
    return this.answerDraft(question).voiceFileName;
  }

  questionText(question: TemplatePreviewQuestion): string {
    const isArabic = this.i18n.language() === 'ar';
    return this.localizedText(question.textEn, question.textAr, isArabic) || '-';
  }

  questionSecondaryText(question: TemplatePreviewQuestion): string {
    const isArabic = this.i18n.language() === 'ar';
    return this.secondaryLocalizedText(question.textEn, question.textAr, isArabic);
  }

  optionLabel(option: QuestionAnswerOption): string {
    const isArabic = this.i18n.language() === 'ar';
    return this.localizedText(option.textEn, option.textAr ?? '', isArabic) || '-';
  }

  optionSecondaryLabel(option: QuestionAnswerOption): string {
    const isArabic = this.i18n.language() === 'ar';
    return this.secondaryLocalizedText(option.textEn, option.textAr ?? '', isArabic);
  }

  answerTypeLabel(question: TemplatePreviewQuestion): string {
    const labelKey = questionAnswerTypeLabelKey(question.type);
    return labelKey ? this.i18n.translate(labelKey) : question.type || '-';
  }

  isSingleChoice(question: TemplatePreviewQuestion): boolean {
    return question.answerType === QUESTION_ANSWER_TYPE.SingleChoice;
  }

  isVoice(question: TemplatePreviewQuestion): boolean {
    return question.answerType === QUESTION_ANSWER_TYPE.Voice;
  }

  isStarRating(question: TemplatePreviewQuestion): boolean {
    return question.answerType === QUESTION_ANSWER_TYPE.StarRating;
  }

  isComplain(question: TemplatePreviewQuestion): boolean {
    return question.answerType === QUESTION_ANSWER_TYPE.Complain;
  }

  isSmiles(question: TemplatePreviewQuestion): boolean {
    return question.answerType === QUESTION_ANSWER_TYPE.Smiles;
  }

  private updateAnswer(
    templateQuestionId: string,
    patch: Partial<TemplatePreviewAnswerDraft>,
  ): void {
    this.answers.update((answers) => {
      const nextAnswers = {
        ...answers,
        [templateQuestionId]: {
          ...(answers[templateQuestionId] ?? this.createEmptyDraft()),
          ...patch,
        },
      };

      return this.removeHiddenAnswers(nextAnswers);
    });
  }

  private answerDraft(question: TemplatePreviewQuestion): TemplatePreviewAnswerDraft {
    return this.answers()[question.templateQuestionId] ?? this.createEmptyDraft();
  }

  private createEmptyDraft(): TemplatePreviewAnswerDraft {
    return {
      selectedQuestionOptionId: '',
      starRatingValue: null,
      smileValue: null,
      textAnswer: '',
      voiceFileName: '',
    };
  }

  private removeHiddenAnswers(
    answers: Record<string, TemplatePreviewAnswerDraft>,
  ): Record<string, TemplatePreviewAnswerDraft> {
    const visibleIds = buildVisibleQuestionIds(
      this.selectedQuestions().map((question) => ({
        templateQuestionId: question.templateQuestionId,
        order: question.order,
      })),
      this.templatesStore.questionsSelection()?.questionConditions ?? [],
      answers,
    );

    return Object.fromEntries(
      Object.entries(answers).filter(([templateQuestionId]) => visibleIds.has(templateQuestionId)),
    );
  }

  private flattenSelectedQuestions(): readonly TemplatePreviewQuestion[] {
    return (
      this.templatesStore.questionsSelection()?.groups
        .flatMap((group) =>
          group.questions.map((question) => ({
            ...question,
            groupId: group.groupId,
            groupNameEn: group.nameEn,
            groupNameAr: group.nameAr,
            groupIsActive: group.isActive,
          })),
        )
        .filter(
          (question): question is TemplatePreviewQuestion =>
            question.isSelected &&
            question.isActive &&
            question.groupIsActive &&
            question.templateQuestionId !== null &&
            question.templateQuestionId.length > 0,
        )
        .map((question) => ({
          ...question,
          answerType: toQuestionAnswerType(question.type),
        }))
        .sort(
          (first, second) =>
            (first.order ?? Number.MAX_SAFE_INTEGER) -
            (second.order ?? Number.MAX_SAFE_INTEGER),
        ) ?? []
    );
  }

  private localizedText(englishText: string, arabicText: string, isArabic: boolean): string {
    if (isArabic && arabicText.length > 0) {
      return arabicText;
    }
    return englishText || arabicText;
  }

  private secondaryLocalizedText(
    englishText: string,
    arabicText: string,
    isArabic: boolean,
  ): string {
    if (isArabic) {
      return englishText;
    }
    return arabicText;
  }
}

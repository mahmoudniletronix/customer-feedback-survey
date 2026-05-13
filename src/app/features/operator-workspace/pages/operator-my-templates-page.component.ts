import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  ClipboardList,
  FileText,
  HelpCircle,
  Mic,
  RefreshCw,
  Send,
  Square,
  Star,
  Trash2,
} from 'lucide-angular';
import { I18nService } from '../../../core/services/i18n.service';
import {
  QUESTION_ANSWER_TYPE,
  QuestionAnswerOption,
  QuestionAnswerType,
  QuestionAnswerTypeInput,
  SMILE_LEVELS,
  questionAnswerTypeLabelKey,
  toQuestionAnswerType,
} from '../../../shared/models/question-answer.model';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { IconComponent } from '../../../shared/ui/icon/icon.component';
import {
  OperatorAssignedTemplate,
  OperatorAssignedTemplateQuestion,
  OperatorLatestTemplateAnswer,
  OperatorLatestTemplateResponse,
  OperatorTemplateAnswerSubmission,
  OperatorTemplateResponseResult,
} from '../models/operator-template.model';
import { OperatorTemplatesStore } from '../state/operator-templates.store';

interface OperatorQuestionView {
  id: string;
  questionId: string;
  order: number | null;
  text: string;
  secondaryText: string;
  type: string;
  answerType: QuestionAnswerType | null;
  options: readonly QuestionAnswerOption[];
  groupName: string;
}

interface OperatorTemplateView {
  templateId: string;
  name: string;
  secondaryName: string;
  description: string;
  branchId: string;
  branchName: string;
  branchCode: string;
  questionsCount: number;
  hasAnswered: boolean;
  latestResponse: OperatorLatestResponseView | null;
  questions: readonly OperatorQuestionView[];
}

interface OperatorBranchFilterOption {
  id: string;
  label: string;
  secondaryLabel: string;
  code: string;
}

interface OperatorLatestResponseView {
  surveyResponseId: string;
  submittedOnUtc: string;
  answersCount: number;
  answers: readonly OperatorLatestAnswerView[];
}

interface OperatorLatestAnswerView {
  id: string;
  questionId: string;
  typeLabel: string;
  answer: string;
  voiceFileName: string;
  voiceFileUrl: string;
}

interface OperatorAnswerDraft {
  questionId: string;
  selectedQuestionOptionId: string;
  starRatingValue: number | null;
  smileValue: number | null;
  textAnswer: string;
  voiceFile: File | null;
}

interface OperatorSummaryAnswer {
  question: OperatorQuestionView;
  answer: string;
}

type ScaleSelectionKind = 'star' | 'smile';

interface ScaleSelectionAnimation {
  questionId: string;
  value: number;
  kind: ScaleSelectionKind;
}

type AudioContextConstructor = typeof AudioContext;
type WindowWithWebkitAudioContext = Window & typeof globalThis & {
  webkitAudioContext?: AudioContextConstructor;
};

const VOICE_EXTENSIONS = new Set(['mp3', 'wav', 'm4a', 'aac', 'ogg']);
const MAX_VOICE_FILE_BYTES = 10 * 1024 * 1024;
const RATING_VALUES = [1, 2, 3, 4, 5] as const;
const ALL_BRANCHES_FILTER_ID = 'all';

@Component({
  selector: 'app-operator-my-templates-page',
  standalone: true,
  imports: [ButtonComponent, IconComponent, TranslatePipe],
  templateUrl: './operator-my-templates-page.component.html',
  styleUrl: './operator-my-templates-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OperatorMyTemplatesPageComponent implements OnInit, OnDestroy {
  readonly operatorTemplatesStore = inject(OperatorTemplatesStore);
  private readonly i18n = inject(I18nService);
  private audioContext: AudioContext | null = null;
  private audioSource: MediaStreamAudioSourceNode | null = null;
  private audioProcessor: ScriptProcessorNode | null = null;
  private silentGain: GainNode | null = null;
  private recordingStream: MediaStream | null = null;
  private recordedBuffers: Float32Array[] = [];
  private recordedSampleRate = 44100;
  private recordingTimerId: ReturnType<typeof setInterval> | null = null;
  private recordingStartedAt = 0;
  private scaleSelectionAnimationTimer: ReturnType<typeof setTimeout> | null = null;

  readonly arrowLeftIcon = ArrowLeft;
  readonly arrowRightIcon = ArrowRight;
  readonly branchIcon = Building2;
  readonly checkIcon = CheckCircle2;
  readonly clipboardIcon = ClipboardList;
  readonly fileTextIcon = FileText;
  readonly micIcon = Mic;
  readonly questionIcon = HelpCircle;
  readonly refreshIcon = RefreshCw;
  readonly sendIcon = Send;
  readonly stopIcon = Square;
  readonly starIcon = Star;
  readonly trashIcon = Trash2;
  readonly ratingValues = RATING_VALUES;
  readonly smileLevels = SMILE_LEVELS;

  readonly templates = computed<readonly OperatorTemplateView[]>(() =>
    this.operatorTemplatesStore.templates().map((template) => this.toTemplateView(template)),
  );
  readonly branchOptions = computed<readonly OperatorBranchFilterOption[]>(() => {
    const branches = new Map<string, OperatorBranchFilterOption>();

    for (const template of this.templates()) {
      const id = this.branchFilterId(template);
      if (!id || branches.has(id)) {
        continue;
      }

      branches.set(id, {
        id,
        label: template.branchName || template.branchCode || this.i18n.translate('operatorTemplates.branch'),
        secondaryLabel: template.branchCode,
        code: template.branchCode,
      });
    }

    return [...branches.values()].sort((first, second) => first.label.localeCompare(second.label));
  });
  readonly filteredTemplates = computed<readonly OperatorTemplateView[]>(() => {
    const selectedBranchId = this.selectedBranchId();
    if (selectedBranchId === ALL_BRANCHES_FILTER_ID) {
      return this.templates();
    }

    return this.templates().filter((template) => this.branchFilterId(template) === selectedBranchId);
  });
  readonly displayedTemplatesCount = computed(() => this.filteredTemplates().length);
  readonly displayedQuestionsCount = computed(() =>
    this.filteredTemplates().reduce((total, template) => total + template.questionsCount, 0),
  );
  readonly activeTemplate = signal<OperatorTemplateView | null>(null);
  readonly selectedBranchId = signal(ALL_BRANCHES_FILTER_ID);
  readonly expandedLatestResponseTemplateIds = signal<ReadonlySet<string>>(new Set());
  readonly currentQuestionIndex = signal(0);
  readonly summaryOpen = signal(false);
  readonly responseSubmitted = signal(false);
  readonly answers = signal<Record<string, OperatorAnswerDraft>>({});
  readonly touchedQuestionIds = signal<ReadonlySet<string>>(new Set());
  readonly submittedResponse = signal<OperatorTemplateResponseResult | null>(null);
  readonly recordingQuestionId = signal<string | null>(null);
  readonly recordingElapsedSeconds = signal(0);
  readonly recordingError = signal('');
  readonly voicePreviewUrls = signal<Record<string, string>>({});
  readonly animatedScaleSelection = signal<ScaleSelectionAnimation | null>(null);
  readonly answeredQuestionsCount = computed(() => {
    const template = this.activeTemplate();
    if (!template) {
      return 0;
    }

    return template.questions.filter((question) => this.isQuestionValid(question)).length;
  });
  readonly allQuestionsValid = computed(() => {
    const template = this.activeTemplate();
    return (
      template !== null &&
      template.questions.length > 0 &&
      template.questions.every((question) => this.isQuestionValid(question))
    );
  });
  readonly currentQuestion = computed(() => {
    const template = this.activeTemplate();
    if (!template || this.summaryOpen()) {
      return null;
    }

    return template.questions[this.currentQuestionIndex()] ?? null;
  });
  readonly currentQuestionValid = computed(() => {
    const question = this.currentQuestion();
    return question !== null && this.isQuestionValid(question);
  });
  readonly summaryAnswers = computed<readonly OperatorSummaryAnswer[]>(() => {
    const template = this.activeTemplate();
    if (!template) {
      return [];
    }

    return template.questions.map((question) => ({
      question,
      answer: this.answerSummary(question),
    }));
  });

  ngOnInit(): void {
    this.operatorTemplatesStore.load();
  }

  ngOnDestroy(): void {
    this.clearScaleSelectionAnimation();
    this.stopRecordingResources();
    this.revokeAllVoicePreviews();
  }

  reloadTemplates(): void {
    this.operatorTemplatesStore.load();
  }

  updateBranchFilter(event: Event): void {
    const target = event.target;
    const branchId = target instanceof HTMLSelectElement ? target.value : ALL_BRANCHES_FILTER_ID;
    this.selectedBranchId.set(branchId || ALL_BRANCHES_FILTER_ID);
    this.expandedLatestResponseTemplateIds.set(new Set());
  }

  toggleLatestResponse(template: OperatorTemplateView): void {
    this.expandedLatestResponseTemplateIds.update((expandedTemplateIds) => {
      const nextExpandedTemplateIds = new Set(expandedTemplateIds);
      if (nextExpandedTemplateIds.has(template.templateId)) {
        nextExpandedTemplateIds.delete(template.templateId);
      } else {
        nextExpandedTemplateIds.add(template.templateId);
      }

      return nextExpandedTemplateIds;
    });
  }

  isLatestResponseExpanded(template: OperatorTemplateView): boolean {
    return this.expandedLatestResponseTemplateIds().has(template.templateId);
  }

  startTemplateResponse(template: OperatorTemplateView): void {
    if (template.questions.length === 0) {
      return;
    }

    this.operatorTemplatesStore.clearSubmitState();
    this.activeTemplate.set(template);
    this.resetResponseState(template);
  }

  closeResponseWizard(): void {
    this.clearScaleSelectionAnimation();
    this.stopRecordingResources();
    this.revokeAllVoicePreviews();
    this.activeTemplate.set(null);
    this.currentQuestionIndex.set(0);
    this.summaryOpen.set(false);
    this.responseSubmitted.set(false);
    this.answers.set({});
    this.touchedQuestionIds.set(new Set());
    this.submittedResponse.set(null);
    this.operatorTemplatesStore.clearSubmitState();
  }

  goToPreviousStep(): void {
    if (this.preventNavigationWhileRecording()) {
      return;
    }

    if (this.summaryOpen()) {
      this.summaryOpen.set(false);
      const template = this.activeTemplate();
      this.currentQuestionIndex.set(Math.max((template?.questions.length ?? 1) - 1, 0));
      return;
    }

    this.currentQuestionIndex.update((index) => Math.max(index - 1, 0));
  }

  goToNextStep(): void {
    const question = this.currentQuestion();
    const template = this.activeTemplate();
    if (!question || !template) {
      return;
    }

    if (this.preventNavigationWhileRecording()) {
      return;
    }

    this.markQuestionTouched(question.questionId);
    if (!this.isQuestionValid(question)) {
      return;
    }

    const nextIndex = this.currentQuestionIndex() + 1;
    if (nextIndex >= template.questions.length) {
      this.summaryOpen.set(true);
      return;
    }

    this.currentQuestionIndex.set(nextIndex);
  }

  goToQuestion(index: number): void {
    const template = this.activeTemplate();
    if (!template || index < 0 || index >= template.questions.length || this.responseSubmitted()) {
      return;
    }

    if (this.preventNavigationWhileRecording()) {
      return;
    }

    this.summaryOpen.set(false);
    this.currentQuestionIndex.set(index);
  }

  openSummary(): void {
    if (this.preventNavigationWhileRecording()) {
      return;
    }

    this.markAllQuestionsTouched();
    if (!this.allQuestionsValid()) {
      return;
    }

    this.summaryOpen.set(true);
  }

  submitResponse(): void {
    const template = this.activeTemplate();
    if (!template || this.operatorTemplatesStore.submitting() || this.responseSubmitted()) {
      return;
    }

    if (this.preventNavigationWhileRecording()) {
      return;
    }

    this.markAllQuestionsTouched();
    if (!this.allQuestionsValid()) {
      return;
    }

    this.operatorTemplatesStore.submitTemplateResponse(
      template.templateId,
      this.toSubmissions(template),
      (response) => {
        this.submittedResponse.set(response);
        this.responseSubmitted.set(true);
        this.summaryOpen.set(true);
      },
    );
  }

  submitAnotherResponse(): void {
    const template = this.activeTemplate();
    if (!template) {
      return;
    }

    this.clearScaleSelectionAnimation();
    this.stopRecordingResources();
    this.revokeAllVoicePreviews();
    this.operatorTemplatesStore.clearSubmitState();
    this.resetResponseState(template);
  }

  selectSingleChoice(question: OperatorQuestionView, optionId: string): void {
    this.updateAnswer(question.questionId, { selectedQuestionOptionId: optionId });
    this.markQuestionTouched(question.questionId);
  }

  selectStarRating(question: OperatorQuestionView, value: number): void {
    this.updateAnswer(question.questionId, { starRatingValue: value });
    this.markQuestionTouched(question.questionId);
    this.playScaleSelectionAnimation(question.questionId, value, 'star');
  }

  selectSmileValue(question: OperatorQuestionView, value: number): void {
    this.updateAnswer(question.questionId, { smileValue: value });
    this.markQuestionTouched(question.questionId);
    this.playScaleSelectionAnimation(question.questionId, value, 'smile');
  }

  updateTextAnswer(question: OperatorQuestionView, event: Event): void {
    const target = event.target;
    const textAnswer = target instanceof HTMLTextAreaElement ? target.value : '';
    this.updateAnswer(question.questionId, { textAnswer });
    this.markQuestionTouched(question.questionId);
  }

  updateVoiceFile(question: OperatorQuestionView, event: Event): void {
    const target = event.target;
    const voiceFile = target instanceof HTMLInputElement ? (target.files?.[0] ?? null) : null;
    this.setVoiceFile(question, voiceFile);
    this.markQuestionTouched(question.questionId);

    if (target instanceof HTMLInputElement) {
      target.value = '';
    }
  }

  async startVoiceRecording(question: OperatorQuestionView): Promise<void> {
    if (this.recordingQuestionId()) {
      return;
    }

    const mediaDevices = globalThis.navigator?.mediaDevices;
    const audioContextConstructor =
      globalThis.AudioContext ?? (globalThis as WindowWithWebkitAudioContext).webkitAudioContext;

    if (!mediaDevices?.getUserMedia || !audioContextConstructor) {
      this.recordingError.set('operatorTemplates.recordingNotSupported');
      this.markQuestionTouched(question.questionId);
      return;
    }

    try {
      this.recordingError.set('');
      this.recordingStream = await mediaDevices.getUserMedia({ audio: true });
      this.audioContext = new audioContextConstructor();
      this.recordedSampleRate = this.audioContext.sampleRate;
      this.recordedBuffers = [];
      this.audioSource = this.audioContext.createMediaStreamSource(this.recordingStream);
      this.audioProcessor = this.audioContext.createScriptProcessor(4096, 1, 1);
      this.silentGain = this.audioContext.createGain();
      this.silentGain.gain.value = 0;
      this.audioProcessor.onaudioprocess = (event) => {
        const input = event.inputBuffer.getChannelData(0);
        this.recordedBuffers.push(new Float32Array(input));
      };

      this.audioSource.connect(this.audioProcessor);
      this.audioProcessor.connect(this.silentGain);
      this.silentGain.connect(this.audioContext.destination);
      this.recordingQuestionId.set(question.questionId);
      this.recordingElapsedSeconds.set(0);
      this.recordingStartedAt = Date.now();
      this.recordingTimerId = setInterval(() => {
        this.recordingElapsedSeconds.set(Math.floor((Date.now() - this.recordingStartedAt) / 1000));
      }, 500);
    } catch {
      this.stopRecordingResources();
      this.recordingError.set('operatorTemplates.microphonePermissionDenied');
      this.markQuestionTouched(question.questionId);
    }
  }

  stopVoiceRecording(question: OperatorQuestionView): void {
    if (this.recordingQuestionId() !== question.questionId) {
      return;
    }

    const buffers = [...this.recordedBuffers];
    const sampleRate = this.recordedSampleRate;
    this.stopRecordingResources();

    if (buffers.length === 0) {
      this.recordingError.set('operatorTemplates.recordingEmpty');
      this.markQuestionTouched(question.questionId);
      return;
    }

    const voiceFile = this.toWavFile(buffers, sampleRate, question.questionId);
    this.setVoiceFile(question, voiceFile);
    this.markQuestionTouched(question.questionId);
  }

  discardVoiceAnswer(question: OperatorQuestionView): void {
    if (this.recordingQuestionId() === question.questionId) {
      this.stopRecordingResources();
    }

    this.setVoiceFile(question, null);
    this.markQuestionTouched(question.questionId);
  }

  visibleQuestionError(question: OperatorQuestionView): string {
    return this.touchedQuestionIds().has(question.questionId) ? this.questionError(question) : '';
  }

  selectedOptionId(question: OperatorQuestionView): string {
    return this.answerDraft(question).selectedQuestionOptionId;
  }

  starRatingValue(question: OperatorQuestionView): number | null {
    return this.answerDraft(question).starRatingValue;
  }

  smileValue(question: OperatorQuestionView): number | null {
    return this.answerDraft(question).smileValue;
  }

  textAnswer(question: OperatorQuestionView): string {
    return this.answerDraft(question).textAnswer;
  }

  voiceFileName(question: OperatorQuestionView): string {
    return this.answerDraft(question).voiceFile?.name ?? '';
  }

  voicePreviewUrl(question: OperatorQuestionView): string {
    return this.voicePreviewUrls()[question.questionId] ?? '';
  }

  isRecording(question: OperatorQuestionView): boolean {
    return this.recordingQuestionId() === question.questionId;
  }

  recordingDurationLabel(): string {
    const totalSeconds = this.recordingElapsedSeconds();
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  }

  isScaleSelectionAnimating(
    question: OperatorQuestionView,
    value: number,
    kind: ScaleSelectionKind,
  ): boolean {
    const animation = this.animatedScaleSelection();
    return (
      animation?.questionId === question.questionId &&
      animation.value === value &&
      animation.kind === kind
    );
  }

  optionLabel(option: QuestionAnswerOption): string {
    const isArabic = this.i18n.language() === 'ar';
    return this.localizedText(option.textEn, option.textAr ?? '', isArabic);
  }

  optionSecondaryLabel(option: QuestionAnswerOption): string {
    const isArabic = this.i18n.language() === 'ar';
    return this.secondaryLocalizedText(option.textEn, option.textAr ?? '', isArabic);
  }

  isSingleChoice(question: OperatorQuestionView): boolean {
    return question.answerType === QUESTION_ANSWER_TYPE.SingleChoice;
  }

  isVoice(question: OperatorQuestionView): boolean {
    return question.answerType === QUESTION_ANSWER_TYPE.Voice;
  }

  isStarRating(question: OperatorQuestionView): boolean {
    return question.answerType === QUESTION_ANSWER_TYPE.StarRating;
  }

  isComplain(question: OperatorQuestionView): boolean {
    return question.answerType === QUESTION_ANSWER_TYPE.Complain;
  }

  isSmiles(question: OperatorQuestionView): boolean {
    return question.answerType === QUESTION_ANSWER_TYPE.Smiles;
  }

  answerTypeLabel(type: QuestionAnswerTypeInput): string {
    const labelKey = questionAnswerTypeLabelKey(type);
    if (labelKey) {
      return this.i18n.translate(labelKey);
    }

    return typeof type === 'string' || typeof type === 'number' ? String(type) : '';
  }

  private toTemplateView(template: OperatorAssignedTemplate): OperatorTemplateView {
    const isArabic = this.i18n.language() === 'ar';

    return {
      templateId: template.templateId,
      name: this.localizedText(template.nameEn, template.nameAr, isArabic),
      secondaryName: this.secondaryLocalizedText(template.nameEn, template.nameAr, isArabic),
      description: template.description,
      branchId: template.branchId,
      branchName: this.localizedText(template.branchNameEn, template.branchNameAr, isArabic),
      branchCode: template.branchCode,
      questionsCount: template.questionsCount,
      hasAnswered: template.hasAnswered,
      latestResponse: template.latestResponse
        ? this.toLatestResponseView(template.latestResponse, isArabic)
        : null,
      questions: [...template.questions]
        .sort(
          (first, second) =>
            (first.order ?? Number.MAX_SAFE_INTEGER) - (second.order ?? Number.MAX_SAFE_INTEGER),
        )
        .map((question) => this.toQuestionView(question, isArabic)),
    };
  }

  private toQuestionView(
    question: OperatorAssignedTemplateQuestion,
    isArabic: boolean,
  ): OperatorQuestionView {
    return {
      id: question.templateQuestionId || question.questionId,
      questionId: question.questionId,
      order: question.order,
      text: this.localizedText(question.textEn, question.textAr, isArabic),
      secondaryText: this.secondaryLocalizedText(question.textEn, question.textAr, isArabic),
      type: question.type,
      answerType: toQuestionAnswerType(question.type),
      options: question.options,
      groupName: this.localizedText(question.groupNameEn, question.groupNameAr, isArabic),
    };
  }

  private branchFilterId(template: OperatorTemplateView): string {
    return template.branchId || template.branchCode || template.branchName;
  }

  private toLatestResponseView(
    response: OperatorLatestTemplateResponse,
    isArabic: boolean,
  ): OperatorLatestResponseView {
    return {
      surveyResponseId: response.surveyResponseId,
      submittedOnUtc: response.submittedOnUtc,
      answersCount: response.answersCount,
      answers: response.answers.map((answer, index) =>
        this.toLatestAnswerView(answer, index, isArabic),
      ),
    };
  }

  private toLatestAnswerView(
    answer: OperatorLatestTemplateAnswer,
    index: number,
    isArabic: boolean,
  ): OperatorLatestAnswerView {
    const answerType = toQuestionAnswerType(answer.questionType);
    const fallbackAnswer = this.i18n.translate('operatorTemplates.noAnswer');
    let displayAnswer = fallbackAnswer;

    if (answerType === QUESTION_ANSWER_TYPE.SingleChoice) {
      displayAnswer =
        this.localizedText(
          answer.selectedOptionTextEn ?? '',
          answer.selectedOptionTextAr ?? '',
          isArabic,
        ) || fallbackAnswer;
    } else if (answerType === QUESTION_ANSWER_TYPE.Voice) {
      displayAnswer =
        answer.voiceFileName || this.i18n.translate('operatorTemplates.voiceFileAnswer');
    } else if (answerType === QUESTION_ANSWER_TYPE.StarRating) {
      displayAnswer =
        answer.starRatingValue !== null ? `${answer.starRatingValue} / 5` : fallbackAnswer;
    } else if (answerType === QUESTION_ANSWER_TYPE.Complain) {
      displayAnswer = answer.textAnswer?.trim() || fallbackAnswer;
    } else if (answerType === QUESTION_ANSWER_TYPE.Smiles) {
      displayAnswer =
        answer.smileValue !== null
          ? `${this.smileEmoji(answer.smileValue)} ${answer.smileValue} / 5`
          : fallbackAnswer;
    }

    return {
      id: answer.questionId || `${answer.questionType}-${index}`,
      questionId: answer.questionId,
      typeLabel: this.answerTypeLabel(answer.questionType),
      answer: displayAnswer,
      voiceFileName: answer.voiceFileName ?? '',
      voiceFileUrl: answer.voiceFileUrl ?? '',
    };
  }

  private resetResponseState(template: OperatorTemplateView): void {
    const answers = template.questions.reduce<Record<string, OperatorAnswerDraft>>(
      (drafts, question) => {
        drafts[question.questionId] = this.createEmptyDraft(question.questionId);
        return drafts;
      },
      {},
    );

    this.answers.set(answers);
    this.touchedQuestionIds.set(new Set());
    this.currentQuestionIndex.set(0);
    this.summaryOpen.set(false);
    this.responseSubmitted.set(false);
    this.submittedResponse.set(null);
  }

  private createEmptyDraft(questionId: string): OperatorAnswerDraft {
    return {
      questionId,
      selectedQuestionOptionId: '',
      starRatingValue: null,
      smileValue: null,
      textAnswer: '',
      voiceFile: null,
    };
  }

  private updateAnswer(questionId: string, patch: Partial<OperatorAnswerDraft>): void {
    this.answers.update((answers) => ({
      ...answers,
      [questionId]: {
        ...(answers[questionId] ?? this.createEmptyDraft(questionId)),
        ...patch,
      },
    }));
  }

  private setVoiceFile(question: OperatorQuestionView, voiceFile: File | null): void {
    this.revokeVoicePreview(question.questionId);
    this.updateAnswer(question.questionId, { voiceFile });
    this.recordingError.set('');

    if (!voiceFile) {
      return;
    }

    const previewUrl = URL.createObjectURL(voiceFile);
    this.voicePreviewUrls.update((urls) => ({
      ...urls,
      [question.questionId]: previewUrl,
    }));
  }

  private answerDraft(question: OperatorQuestionView): OperatorAnswerDraft {
    return this.answers()[question.questionId] ?? this.createEmptyDraft(question.questionId);
  }

  private markQuestionTouched(questionId: string): void {
    this.touchedQuestionIds.update((questionIds) => new Set([...questionIds, questionId]));
  }

  private markAllQuestionsTouched(): void {
    const template = this.activeTemplate();
    this.touchedQuestionIds.set(
      new Set(template?.questions.map((question) => question.questionId) ?? []),
    );
  }

  isQuestionValid(question: OperatorQuestionView): boolean {
    return this.questionError(question).length === 0;
  }

  private questionError(question: OperatorQuestionView): string {
    const draft = this.answerDraft(question);

    if (this.isSingleChoice(question)) {
      if (!draft.selectedQuestionOptionId) {
        return 'operatorTemplates.selectedOptionRequired';
      }

      return question.options.some((option) => option.optionId === draft.selectedQuestionOptionId)
        ? ''
        : 'operatorTemplates.selectedOptionInvalid';
    }

    if (this.isVoice(question)) {
      if (!draft.voiceFile) {
        return 'operatorTemplates.voiceFileRequired';
      }

      const extension = this.fileExtension(draft.voiceFile.name);
      if (!VOICE_EXTENSIONS.has(extension)) {
        return 'operatorTemplates.voiceExtensionInvalid';
      }

      return draft.voiceFile.size <= MAX_VOICE_FILE_BYTES
        ? ''
        : 'operatorTemplates.voiceFileTooLarge';
    }

    if (this.isStarRating(question)) {
      return this.isScaleValue(draft.starRatingValue) ? '' : 'operatorTemplates.starRatingRequired';
    }

    if (this.isComplain(question)) {
      const text = draft.textAnswer.trim();
      if (text.length === 0) {
        return 'operatorTemplates.complainTextRequired';
      }

      return text.length <= 4000 ? '' : 'operatorTemplates.complainTextMaxLength';
    }

    if (this.isSmiles(question)) {
      return this.isScaleValue(draft.smileValue) ? '' : 'operatorTemplates.smileValueRequired';
    }

    return 'operatorTemplates.unsupportedQuestionType';
  }

  private toSubmissions(
    template: OperatorTemplateView,
  ): readonly OperatorTemplateAnswerSubmission[] {
    return template.questions.map((question) => {
      const draft = this.answerDraft(question);

      if (this.isSingleChoice(question)) {
        return {
          questionId: question.questionId,
          selectedQuestionOptionId: draft.selectedQuestionOptionId,
        };
      }

      if (this.isVoice(question)) {
        return {
          questionId: question.questionId,
          voiceFile: draft.voiceFile ?? undefined,
        };
      }

      if (this.isStarRating(question)) {
        return {
          questionId: question.questionId,
          starRatingValue: draft.starRatingValue ?? undefined,
        };
      }

      if (this.isComplain(question)) {
        return {
          questionId: question.questionId,
          textAnswer: draft.textAnswer.trim(),
        };
      }

      return {
        questionId: question.questionId,
        smileValue: draft.smileValue ?? undefined,
      };
    });
  }

  private answerSummary(question: OperatorQuestionView): string {
    const draft = this.answerDraft(question);

    if (this.isSingleChoice(question)) {
      const option = question.options.find(
        (currentOption) => currentOption.optionId === draft.selectedQuestionOptionId,
      );
      return option ? this.optionLabel(option) : '';
    }

    if (this.isVoice(question)) {
      return draft.voiceFile?.name ?? '';
    }

    if (this.isStarRating(question)) {
      return draft.starRatingValue ? `${draft.starRatingValue} / 5` : '';
    }

    if (this.isComplain(question)) {
      return draft.textAnswer.trim();
    }

    if (this.isSmiles(question)) {
      return draft.smileValue ? `${this.smileEmoji(draft.smileValue)} ${draft.smileValue} / 5` : '';
    }

    return '';
  }

  private isScaleValue(value: number | null): boolean {
    return value !== null && value >= 1 && value <= 5;
  }

  private fileExtension(fileName: string): string {
    const extension = fileName.split('.').pop();
    return extension ? extension.toLowerCase() : '';
  }

  private smileEmoji(value: number): string {
    return this.smileLevels.find((smileLevel) => smileLevel.value === value)?.emoji ?? '';
  }

  private playScaleSelectionAnimation(
    questionId: string,
    value: number,
    kind: ScaleSelectionKind,
  ): void {
    this.clearScaleSelectionAnimation();
    this.animatedScaleSelection.set({ questionId, value, kind });
    this.scaleSelectionAnimationTimer = setTimeout(() => {
      this.animatedScaleSelection.set(null);
      this.scaleSelectionAnimationTimer = null;
    }, 520);
  }

  private clearScaleSelectionAnimation(): void {
    if (this.scaleSelectionAnimationTimer) {
      clearTimeout(this.scaleSelectionAnimationTimer);
      this.scaleSelectionAnimationTimer = null;
    }

    this.animatedScaleSelection.set(null);
  }

  private stopRecordingResources(): void {
    if (this.recordingTimerId) {
      clearInterval(this.recordingTimerId);
      this.recordingTimerId = null;
    }

    if (this.audioProcessor) {
      this.audioProcessor.onaudioprocess = null;
      this.audioProcessor.disconnect();
    }
    this.audioSource?.disconnect();
    this.silentGain?.disconnect();
    this.recordingStream?.getTracks().forEach((track) => track.stop());
    void this.audioContext?.close();
    this.audioProcessor = null;
    this.audioSource = null;
    this.silentGain = null;
    this.recordingStream = null;
    this.audioContext = null;
    this.recordedBuffers = [];
    this.recordingQuestionId.set(null);
    this.recordingElapsedSeconds.set(0);
  }

  private preventNavigationWhileRecording(): boolean {
    if (!this.recordingQuestionId()) {
      return false;
    }

    this.recordingError.set('operatorTemplates.stopRecordingBeforeContinue');
    return true;
  }

  private toWavFile(buffers: readonly Float32Array[], sampleRate: number, questionId: string): File {
    const samples = this.mergeAudioBuffers(buffers);
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);

    this.writeAsciiString(view, 0, 'RIFF');
    view.setUint32(4, 36 + samples.length * 2, true);
    this.writeAsciiString(view, 8, 'WAVE');
    this.writeAsciiString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    this.writeAsciiString(view, 36, 'data');
    view.setUint32(40, samples.length * 2, true);
    this.writePcm16(view, 44, samples);

    const safeQuestionId = questionId.replace(/[^a-zA-Z0-9-]/g, '');
    return new File([buffer], `voice-${safeQuestionId}-${Date.now()}.wav`, { type: 'audio/wav' });
  }

  private mergeAudioBuffers(buffers: readonly Float32Array[]): Float32Array {
    const totalLength = buffers.reduce((length, buffer) => length + buffer.length, 0);
    const samples = new Float32Array(totalLength);
    let offset = 0;

    for (const buffer of buffers) {
      samples.set(buffer, offset);
      offset += buffer.length;
    }

    return samples;
  }

  private writeAsciiString(view: DataView, offset: number, value: string): void {
    for (let index = 0; index < value.length; index += 1) {
      view.setUint8(offset + index, value.charCodeAt(index));
    }
  }

  private writePcm16(view: DataView, offset: number, samples: Float32Array): void {
    for (let index = 0; index < samples.length; index += 1) {
      const sample = Math.max(-1, Math.min(1, samples[index]));
      view.setInt16(offset + index * 2, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
    }
  }

  private revokeVoicePreview(questionId: string): void {
    const previewUrl = this.voicePreviewUrls()[questionId];
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    this.voicePreviewUrls.update((urls) => {
      const { [questionId]: removedUrl, ...remainingUrls } = urls;
      return remainingUrls;
    });
  }

  private revokeAllVoicePreviews(): void {
    Object.values(this.voicePreviewUrls()).forEach((previewUrl) => URL.revokeObjectURL(previewUrl));
    this.voicePreviewUrls.set({});
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

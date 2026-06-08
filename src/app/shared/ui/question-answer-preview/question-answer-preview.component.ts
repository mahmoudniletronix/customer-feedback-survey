import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { Image as ImageIcon, MessageSquareText, Mic, Star } from 'lucide-angular';
import { I18nService } from '../../../core/services/i18n.service';
import {
  QUESTION_ANSWER_TYPE,
  QuestionAnswerOption,
  QuestionAnswerTypeInput,
  SMILE_LEVELS,
  toQuestionAnswerType,
} from '../../models/question-answer.model';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { IconComponent } from '../icon/icon.component';

interface LocalizedAnswerOption {
  id: string;
  label: string;
  secondaryLabel: string;
  order: number;
  value: number | null;
}

@Component({
  selector: 'app-question-answer-preview',
  standalone: true,
  imports: [IconComponent, TranslatePipe],
  templateUrl: './question-answer-preview.component.html',
  styleUrl: './question-answer-preview.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuestionAnswerPreviewComponent {
  private readonly i18n = inject(I18nService);

  readonly type = input<QuestionAnswerTypeInput>(null);
  readonly options = input<readonly QuestionAnswerOption[]>([]);
  readonly compact = input(false);

  readonly micIcon = Mic;
  readonly messageIcon = MessageSquareText;
  readonly starIcon = Star;
  readonly imageIcon = ImageIcon;
  readonly previewItems = [1, 2, 3, 4, 5] as const;
  readonly smileLevels = SMILE_LEVELS;

  readonly answerType = computed(() => toQuestionAnswerType(this.type()));
  readonly isSingleChoice = computed(() => this.answerType() === QUESTION_ANSWER_TYPE.SingleChoice);
  readonly isVoice = computed(() => this.answerType() === QUESTION_ANSWER_TYPE.Voice);
  readonly isStarRating = computed(() => this.answerType() === QUESTION_ANSWER_TYPE.StarRating);
  readonly isComplain = computed(() => this.answerType() === QUESTION_ANSWER_TYPE.Complain);
  readonly isSmiles = computed(() => this.answerType() === QUESTION_ANSWER_TYPE.Smiles);
  readonly isImage = computed(() => this.answerType() === QUESTION_ANSWER_TYPE.Image);
  readonly localizedOptions = computed<readonly LocalizedAnswerOption[]>(() => {
    const isArabic = this.i18n.language() === 'ar';

    return [...this.options()]
      .filter((option) => option.isActive)
      .sort((first, second) => first.order - second.order)
      .map((option, index) => ({
        id: option.optionId || `${option.order}-${index}`,
        label: this.localizedText(option.textEn, option.textAr ?? '', isArabic),
        secondaryLabel: this.secondaryLocalizedText(option.textEn, option.textAr ?? '', isArabic),
        order: option.order,
        value: option.value,
      }));
  });

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

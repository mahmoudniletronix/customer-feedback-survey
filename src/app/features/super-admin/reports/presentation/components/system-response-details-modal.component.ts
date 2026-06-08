import { DatePipe, DecimalPipe, NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { environment } from '../../../../../../environments/environment';
import { I18nService } from '../../../../../core/services/i18n.service';
import { TranslatePipe } from '../../../../../shared/pipes/translate.pipe';
import { ModalComponent } from '../../../../../shared/ui/modal/modal.component';
import {
  SystemResponseAnswer,
  SystemResponseDetails,
  SystemResponseScore,
} from '../../domain/system-reports.model';

interface SystemAnswerTreeNode {
  readonly answer: SystemResponseAnswer;
  readonly children: readonly SystemAnswerTreeNode[];
}

@Component({
  selector: 'app-system-response-details-modal',
  standalone: true,
  imports: [DatePipe, DecimalPipe, ModalComponent, NgTemplateOutlet, TranslatePipe],
  templateUrl: './system-response-details-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SystemResponseDetailsModalComponent {
  private readonly i18n = inject(I18nService);

  readonly open = input(false);
  readonly loading = input(false);
  readonly error = input<string | null>(null);
  readonly details = input<SystemResponseDetails | null>(null);
  readonly closed = output<void>();
  readonly answerTree = computed<readonly SystemAnswerTreeNode[]>(() =>
    this.toAnswerTree(this.details()?.answers ?? []),
  );

  localized(englishText: string, arabicText: string | null | undefined): string {
    if (this.i18n.language() === 'ar') return arabicText || englishText || '-';
    return englishText || arabicText || '-';
  }

  displayAnswer(answer: SystemResponseAnswer): string {
    if (answer.questionType === 'SingleChoice') {
      return this.localized(answer.selectedOptionTextEn ?? '', answer.selectedOptionTextAr) || answer.displayValue || '-';
    }
    if (answer.questionType === 'StarRating') return `${answer.starRatingValue ?? '-'} / 5`;
    if (answer.questionType === 'Smiles') return `${answer.smileValue ?? '-'} / 5`;
    if (answer.questionType === 'Complain') return answer.textAnswer || answer.displayValue || '-';
    if (answer.questionType === 'Image') {
      return answer.imageFileName || answer.displayValue || this.i18n.translate('operatorTemplates.imageFileAnswer');
    }
    return answer.voiceFileName || answer.displayValue || this.i18n.translate('systemResponseDetails.voiceAnswer');
  }

  answerValueLabel(answer: SystemResponseAnswer): string {
    if (answer.questionType === 'SingleChoice') {
      return this.i18n.translate('systemResponseDetails.selectedOption');
    }
    if (answer.questionType === 'StarRating') {
      return this.i18n.translate('systemResponseDetails.starRatingValue');
    }
    if (answer.questionType === 'Smiles') {
      return this.i18n.translate('systemResponseDetails.smileValue');
    }
    if (answer.questionType === 'Complain') {
      return this.i18n.translate('systemResponseDetails.textAnswer');
    }
    if (answer.questionType === 'Image') {
      return this.i18n.translate('questions.typeImage');
    }
    return this.i18n.translate('systemResponseDetails.voiceAnswer');
  }

  questionTypeLabel(answer: SystemResponseAnswer): string {
    if (answer.questionType === 'SingleChoice') return this.i18n.translate('questions.typeSingleChoice');
    if (answer.questionType === 'StarRating') return this.i18n.translate('questions.typeStarRating');
    if (answer.questionType === 'Smiles') return this.i18n.translate('questions.typeSmiles');
    if (answer.questionType === 'Complain') return this.i18n.translate('questions.typeComplain');
    if (answer.questionType === 'Voice') return this.i18n.translate('questions.typeVoice');
    if (answer.questionType === 'Image') return this.i18n.translate('questions.typeImage');
    return answer.questionTypeName || answer.questionType;
  }

  customInputTypeLabel(typeName: string): string {
    const normalizedType = typeName.replace(/[\s_-]/g, '').toLowerCase();
    if (normalizedType === 'string') return this.i18n.translate('systemResponseDetails.typeString');
    if (normalizedType === 'integer' || normalizedType === 'int') {
      return this.i18n.translate('systemResponseDetails.typeInteger');
    }
    return typeName || '-';
  }

  scoreBadgeLabel(score: SystemResponseScore): string {
    if (!score.isScored) {
      return this.i18n.translate('systemResponseDetails.notScored');
    }

    return `${this.scoreStatusLabel(score)} - ${score.scorePercentage.toFixed(1)}%`;
  }

  scoreStatusLabel(score: SystemResponseScore): string {
    if (!score.isScored) return this.i18n.translate('systemResponseDetails.notScored');
    if (score.scorePercentage >= 80) return this.i18n.translate('systemResponseDetails.healthy');
    if (score.scorePercentage >= 60) return this.i18n.translate('systemResponseDetails.neutral');
    return this.i18n.translate('systemResponseDetails.critical');
  }

  voiceUrl(answer: SystemResponseAnswer): string {
    return this.toMediaUrl(answer.voiceFileUrl);
  }

  imageUrl(answer: SystemResponseAnswer): string {
    return this.toMediaUrl(answer.imageFileUrl);
  }

  private toMediaUrl(url: string | null): string {
    if (!url) return '';
    if (/^https?:\/\//i.test(url)) return url;
    const baseUrl = environment.apiBaseUrl.replace(/\/$/, '');
    const path = url.startsWith('/') ? url : `/${url}`;
    return `${baseUrl}${path}`;
  }

  private toAnswerTree(answers: readonly SystemResponseAnswer[]): readonly SystemAnswerTreeNode[] {
    return answers.map((answer) => ({
      answer,
      children: this.toAnswerTree(answer.children),
    }));
  }
}

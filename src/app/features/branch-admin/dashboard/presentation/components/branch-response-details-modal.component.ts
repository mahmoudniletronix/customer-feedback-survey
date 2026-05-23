import { DatePipe, DecimalPipe, NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import {
  Calendar,
  CircleGauge,
  FileText,
  Hash,
  Mic,
  UserRound,
} from 'lucide-angular';
import { environment } from '../../../../../../environments/environment';
import { I18nService } from '../../../../../core/services/i18n.service';
import { TranslatePipe } from '../../../../../shared/pipes/translate.pipe';
import { ButtonComponent } from '../../../../../shared/ui/button/button.component';
import { IconComponent } from '../../../../../shared/ui/icon/icon.component';
import { ModalComponent } from '../../../../../shared/ui/modal/modal.component';
import {
  BranchSurveyResponseAnswer,
  BranchSurveyResponseDetails,
} from '../../domain/branch-dashboard.model';

interface ScaleSlot {
  readonly index: number;
}

interface BranchResponseAnswerTreeNode {
  readonly answer: BranchSurveyResponseAnswer;
  readonly children: readonly BranchResponseAnswerTreeNode[];
}

@Component({
  selector: 'app-branch-response-details-modal',
  standalone: true,
  imports: [
    ButtonComponent,
    DatePipe,
    DecimalPipe,
    IconComponent,
    ModalComponent,
    NgTemplateOutlet,
    TranslatePipe,
  ],
  templateUrl: './branch-response-details-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BranchResponseDetailsModalComponent {
  private readonly i18n = inject(I18nService);

  readonly open = input(false);
  readonly loading = input(false);
  readonly error = input<string | null>(null);
  readonly details = input<BranchSurveyResponseDetails | null>(null);
  readonly closed = output<void>();
  readonly answerTree = computed<readonly BranchResponseAnswerTreeNode[]>(() =>
    this.toAnswerTree(this.details()?.answers ?? []),
  );

  readonly calendarIcon = Calendar;
  readonly fileIcon = FileText;
  readonly gaugeIcon = CircleGauge;
  readonly hashIcon = Hash;
  readonly micIcon = Mic;
  readonly userIcon = UserRound;
  readonly scaleSlots: readonly ScaleSlot[] = [
    { index: 1 },
    { index: 2 },
    { index: 3 },
    { index: 4 },
    { index: 5 },
  ];

  templateName(details: BranchSurveyResponseDetails): string {
    return this.localized(details.templateNameEn, details.templateNameAr);
  }

  operatorName(details: BranchSurveyResponseDetails): string {
    return this.localized(details.operatorNameEn, details.operatorNameAr);
  }

  questionText(answer: BranchSurveyResponseAnswer): string {
    return this.localized(answer.questionTextEn, answer.questionTextAr);
  }

  selectedOptionText(answer: BranchSurveyResponseAnswer): string {
    return this.localized(answer.selectedOptionTextEn ?? '', answer.selectedOptionTextAr);
  }

  displayAnswer(answer: BranchSurveyResponseAnswer): string {
    if (answer.questionType === 'SingleChoice') {
      return this.selectedOptionText(answer) || answer.displayValue || '-';
    }

    if (answer.questionType === 'StarRating') {
      return `${answer.starRatingValue ?? '-'} / 5`;
    }

    if (answer.questionType === 'Smiles') {
      return `${answer.smileValue ?? '-'} / 5`;
    }

    if (answer.questionType === 'Complain') {
      return answer.textAnswer || answer.displayValue || '-';
    }

    return answer.voiceFileName || answer.displayValue || this.i18n.translate('branchReports.voice');
  }

  isActiveScaleSlot(slot: ScaleSlot, value: number | null): boolean {
    return slot.index <= (value ?? 0);
  }

  voiceUrl(answer: BranchSurveyResponseAnswer): string {
    const voiceFileUrl = answer.voiceFileUrl;
    if (!voiceFileUrl) {
      return '';
    }

    if (/^https?:\/\//i.test(voiceFileUrl)) {
      return voiceFileUrl;
    }

    const baseUrl = environment.apiBaseUrl.replace(/\/$/, '');
    const path = voiceFileUrl.startsWith('/') ? voiceFileUrl : `/${voiceFileUrl}`;
    return `${baseUrl}${path}`;
  }

  private localized(englishText: string, arabicText: string | null | undefined): string {
    if (this.i18n.language() === 'ar') {
      return arabicText || englishText || '-';
    }

    return englishText || arabicText || '-';
  }

  private toAnswerTree(
    answers: readonly BranchSurveyResponseAnswer[],
  ): readonly BranchResponseAnswerTreeNode[] {
    return answers.map((answer) => ({
      answer,
      children: this.toAnswerTree(answer.children),
    }));
  }
}

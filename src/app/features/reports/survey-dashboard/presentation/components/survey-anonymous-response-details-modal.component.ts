import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { Calendar, FileText, Hash, MessageSquareText, Mic } from 'lucide-angular';
import { environment } from '../../../../../../environments/environment';
import { I18nService } from '../../../../../core/services/i18n.service';
import { ButtonComponent } from '../../../../../shared/ui/button/button.component';
import { IconComponent } from '../../../../../shared/ui/icon/icon.component';
import { ModalComponent } from '../../../../../shared/ui/modal/modal.component';
import {
  AnonymousTemplateResponseAnswer,
  AnonymousTemplateResponseCustomInputValue,
  AnonymousTemplateResponseDetails,
} from '../../../../anonymous-templates/domain/anonymous-template.model';

@Component({
  selector: 'app-survey-anonymous-response-details-modal',
  standalone: true,
  imports: [ButtonComponent, DatePipe, DecimalPipe, IconComponent, ModalComponent],
  templateUrl: './survey-anonymous-response-details-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SurveyAnonymousResponseDetailsModalComponent {
  private readonly i18n = inject(I18nService);

  readonly open = input(false);
  readonly loading = input(false);
  readonly error = input<string | null>(null);
  readonly details = input<AnonymousTemplateResponseDetails | null>(null);
  readonly closed = output<void>();

  readonly calendarIcon = Calendar;
  readonly fileIcon = FileText;
  readonly hashIcon = Hash;
  readonly messageIcon = MessageSquareText;
  readonly micIcon = Mic;

  responseTitle(response: AnonymousTemplateResponseDetails): string {
    return this.localized(response.templateNameEn, response.templateNameAr);
  }

  customInputLabel(input: AnonymousTemplateResponseCustomInputValue): string {
    return this.localized(input.labelEn || input.nameSnapshot || input.name, input.labelAr);
  }

  questionText(answer: AnonymousTemplateResponseAnswer): string {
    return this.localized(answer.questionTextEn, answer.questionTextAr);
  }

  answerDisplayValue(answer: AnonymousTemplateResponseAnswer): string {
    const type = (answer.questionTypeName || String(answer.questionType ?? '')).toLowerCase();
    if (type.includes('single')) {
      return this.localized(answer.selectedOptionTextEn ?? '', answer.selectedOptionTextAr);
    }
    if (type.includes('star')) {
      return answer.starRatingValue === null ? '-' : `${answer.starRatingValue} / 5`;
    }
    if (type.includes('smile')) {
      return answer.smileValue === null ? '-' : `${answer.smileValue} / 5`;
    }
    if (type.includes('complain')) {
      return answer.textAnswer?.trim() || '-';
    }

    return answer.voiceFileName?.trim() || answer.voiceUrl?.trim() || '-';
  }

  customInputDisplayValue(input: AnonymousTemplateResponseCustomInputValue): string {
    return input.displayValue || input.stringValue || (input.integerValue === null ? '-' : String(input.integerValue));
  }

  voiceUrl(answer: AnonymousTemplateResponseAnswer): string {
    const voiceUrl = answer.voiceUrl;
    if (!voiceUrl) {
      return '';
    }

    if (/^https?:\/\//i.test(voiceUrl)) {
      return voiceUrl;
    }

    const baseUrl = environment.apiBaseUrl.replace(/\/$/, '');
    const path = voiceUrl.startsWith('/') ? voiceUrl : `/${voiceUrl}`;
    return `${baseUrl}${path}`;
  }

  private localized(englishText: string | null | undefined, arabicText: string | null | undefined): string {
    const english = englishText?.trim() ?? '';
    const arabic = arabicText?.trim() ?? '';

    if (this.i18n.language() === 'ar') {
      return arabic || english || '-';
    }

    return english || arabic || '-';
  }
}

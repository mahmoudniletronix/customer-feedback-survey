import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { environment } from '../../../../../../environments/environment';
import { I18nService } from '../../../../../core/services/i18n.service';
import { ModalComponent } from '../../../../../shared/ui/modal/modal.component';
import { SystemResponseAnswer, SystemResponseDetails } from '../../domain/system-reports.model';

@Component({
  selector: 'app-system-response-details-modal',
  standalone: true,
  imports: [DatePipe, DecimalPipe, ModalComponent],
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
    return answer.voiceFileName || answer.displayValue || 'Voice answer';
  }

  voiceUrl(answer: SystemResponseAnswer): string {
    if (!answer.voiceFileUrl) return '';
    if (/^https?:\/\//i.test(answer.voiceFileUrl)) return answer.voiceFileUrl;
    const baseUrl = environment.apiBaseUrl.replace(/\/$/, '');
    const path = answer.voiceFileUrl.startsWith('/') ? answer.voiceFileUrl : `/${answer.voiceFileUrl}`;
    return `${baseUrl}${path}`;
  }
}

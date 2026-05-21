import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ArrowLeft, FileText, Mic } from 'lucide-angular';
import { environment } from '../../../../../../environments/environment';
import { I18nService } from '../../../../../core/services/i18n.service';
import { IconComponent } from '../../../../../shared/ui/icon/icon.component';
import {
  DepartmentResponseAnswer,
  DepartmentResponseDetails,
} from '../../domain/department-reports.model';
import { DepartmentResponseDetailsStore } from '../state/department-response-details.store';

interface ScaleSlot {
  readonly index: number;
}

@Component({
  selector: 'app-department-response-details-page',
  standalone: true,
  imports: [DatePipe, DecimalPipe, IconComponent],
  templateUrl: './department-response-details-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DepartmentResponseDetailsPageComponent implements OnInit {
  readonly store = inject(DepartmentResponseDetailsStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly i18n = inject(I18nService);

  readonly backIcon = ArrowLeft;
  readonly fileIcon = FileText;
  readonly micIcon = Mic;
  readonly scaleSlots: readonly ScaleSlot[] = [
    { index: 1 },
    { index: 2 },
    { index: 3 },
    { index: 4 },
    { index: 5 },
  ];

  ngOnInit(): void {
    const operatorId = this.route.snapshot.paramMap.get('operatorId') ?? '';
    const surveyResponseId = this.route.snapshot.paramMap.get('surveyResponseId') ?? '';
    this.store.load(operatorId, surveyResponseId);
  }

  backToResponses(): void {
    const operatorId = this.route.snapshot.paramMap.get('operatorId') ?? '';
    void this.router.navigate(['/reports/department/operators', operatorId, 'responses']);
  }

  branchName(details: DepartmentResponseDetails): string {
    const name = this.localized(details.branch.nameEn, details.branch.nameAr);
    return details.branch.code ? `${name} (${details.branch.code})` : name;
  }

  templateName(details: DepartmentResponseDetails): string {
    return this.localized(details.template.nameEn, details.template.nameAr);
  }

  operatorName(details: DepartmentResponseDetails): string {
    return this.localized(details.operator.nameEn, details.operator.nameAr);
  }

  questionText(answer: DepartmentResponseAnswer): string {
    return this.localized(answer.questionTextEn, answer.questionTextAr);
  }

  selectedOptionText(answer: DepartmentResponseAnswer): string {
    return this.localized(answer.selectedOptionTextEn ?? '', answer.selectedOptionTextAr);
  }

  displayAnswer(answer: DepartmentResponseAnswer): string {
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

    return answer.voiceFileName || answer.displayValue || 'Voice answer';
  }

  isActiveScaleSlot(slot: ScaleSlot, value: number | null): boolean {
    return slot.index <= (value ?? 0);
  }

  voiceUrl(answer: DepartmentResponseAnswer): string {
    const voiceFileUrl = answer.voiceFileUrl;
    if (!voiceFileUrl) return '';
    if (/^https?:\/\//i.test(voiceFileUrl)) return voiceFileUrl;

    const baseUrl = environment.apiBaseUrl.replace(/\/$/, '');
    const path = voiceFileUrl.startsWith('/') ? voiceFileUrl : `/${voiceFileUrl}`;
    return `${baseUrl}${path}`;
  }

  private localized(englishText: string, arabicText: string | null | undefined): string {
    if (this.i18n.language() === 'ar') return arabicText || englishText || '-';
    return englishText || arabicText || '-';
  }
}

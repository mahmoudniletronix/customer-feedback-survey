import { DatePipe, DecimalPipe, Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ArrowLeft, ClipboardCheck, FileText, MessageSquareText } from 'lucide-angular';
import {
  QUESTION_ANSWER_TYPE,
  toQuestionAnswerType,
} from '../../../../shared/models/question-answer.model';
import { I18nService } from '../../../../core/services/i18n.service';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { ButtonComponent } from '../../../../shared/ui/button/button.component';
import { CardComponent } from '../../../../shared/ui/card/card.component';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import {
  AnonymousTemplateResponseAnswer,
  AnonymousTemplateResponseCustomInputValue,
} from '../../domain/anonymous-template.model';
import { AnonymousTemplatesStore } from '../state/anonymous-templates.store';

@Component({
  selector: 'app-anonymous-template-response-details-page',
  standalone: true,
  imports: [ButtonComponent, CardComponent, DatePipe, DecimalPipe, IconComponent, RouterLink, TranslatePipe],
  templateUrl: './anonymous-template-response-details-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnonymousTemplateResponseDetailsPageComponent implements OnInit {
  readonly anonymousTemplatesStore = inject(AnonymousTemplatesStore);
  private readonly i18n = inject(I18nService);
  private readonly location = inject(Location);
  private readonly route = inject(ActivatedRoute);

  readonly arrowLeftIcon = ArrowLeft;
  readonly answerIcon = MessageSquareText;
  readonly fileTextIcon = FileText;
  readonly responseIcon = ClipboardCheck;
  readonly anonymousTemplateId = this.route.snapshot.paramMap.get('anonymousTemplateId') ?? '';
  readonly responseId = this.route.snapshot.paramMap.get('responseId') ?? '';

  ngOnInit(): void {
    if (this.anonymousTemplateId.length === 0 || this.responseId.length === 0) {
      this.anonymousTemplatesStore.clearDetails();
      return;
    }

    this.anonymousTemplatesStore.loadResponseDetails(this.anonymousTemplateId, this.responseId);
  }

  goBack(): void {
    this.location.back();
  }

  customInputDisplayValue(value: AnonymousTemplateResponseCustomInputValue): string {
    if (value.type === 2) {
      return value.integerValue === null ? '-' : String(value.integerValue);
    }

    return value.stringValue?.trim() || '-';
  }

  answerQuestionText(answer: AnonymousTemplateResponseAnswer): string {
    if (this.i18n.language() === 'ar') {
      return answer.questionTextAr || answer.questionTextEn || '-';
    }

    return answer.questionTextEn || answer.questionTextAr || '-';
  }

  answerSecondaryText(answer: AnonymousTemplateResponseAnswer): string {
    if (this.i18n.language() === 'ar') {
      return answer.questionTextEn;
    }

    return answer.questionTextAr ?? '';
  }

  answerDisplayValue(answer: AnonymousTemplateResponseAnswer): string {
    const answerType = toQuestionAnswerType(answer.questionTypeName || answer.questionType);

    if (answerType === QUESTION_ANSWER_TYPE.SingleChoice) {
      return this.localizedOptionText(answer) || '-';
    }
    if (answerType === QUESTION_ANSWER_TYPE.StarRating) {
      return answer.starRatingValue === null ? '-' : String(answer.starRatingValue);
    }
    if (answerType === QUESTION_ANSWER_TYPE.Smiles) {
      return answer.smileValue === null ? '-' : String(answer.smileValue);
    }
    if (answerType === QUESTION_ANSWER_TYPE.Complain) {
      return answer.textAnswer?.trim() || '-';
    }

    return answer.voiceFileName?.trim() || '-';
  }

  answerValueBadge(answer: AnonymousTemplateResponseAnswer): string {
    if (answer.selectedOptionValue !== null) {
      return `${this.i18n.translate('anonymousTemplates.value')} ${answer.selectedOptionValue}`;
    }
    if (answer.starRatingValue !== null) {
      return `${this.i18n.translate('anonymousTemplates.value')} ${answer.starRatingValue}`;
    }
    if (answer.smileValue !== null) {
      return `${this.i18n.translate('anonymousTemplates.value')} ${answer.smileValue}`;
    }

    return '';
  }

  private localizedOptionText(answer: AnonymousTemplateResponseAnswer): string {
    if (this.i18n.language() === 'ar') {
      return answer.selectedOptionTextAr || answer.selectedOptionTextEn || '';
    }

    return answer.selectedOptionTextEn || answer.selectedOptionTextAr || '';
  }
}

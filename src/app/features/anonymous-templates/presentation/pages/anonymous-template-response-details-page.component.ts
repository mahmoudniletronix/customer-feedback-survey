import { DatePipe, DecimalPipe, Location, NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
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
  AnonymousTemplateQuestionCondition,
  AnonymousTemplateResponseAnswer,
  AnonymousTemplateResponseCustomInputValue,
  AnonymousTemplateResponseDetails,
} from '../../domain/anonymous-template.model';
import { AnonymousTemplatesStore } from '../state/anonymous-templates.store';

interface AnonymousResponseAnswerTreeNode {
  readonly answer: AnonymousTemplateResponseAnswer;
  readonly children: readonly AnonymousResponseAnswerTreeNode[];
}

@Component({
  selector: 'app-anonymous-template-response-details-page',
  standalone: true,
  imports: [
    ButtonComponent,
    CardComponent,
    DatePipe,
    DecimalPipe,
    IconComponent,
    NgTemplateOutlet,
    RouterLink,
    TranslatePipe,
  ],
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
  readonly answerTree = computed<readonly AnonymousResponseAnswerTreeNode[]>(() => {
    const response = this.anonymousTemplatesStore.selectedResponse();
    if (!response) {
      return [];
    }

    const answers = response.answers;
    if (answers.some((answer) => answer.children.length > 0)) {
      return answers.map((answer) => this.toNestedAnswerNode(answer));
    }

    return this.toConditionAnswerTree(
      answers,
      this.anonymousTemplatesStore.selectedTemplate()?.questionConditions ?? [],
    );
  });

  ngOnInit(): void {
    if (this.anonymousTemplateId.length === 0 || this.responseId.length === 0) {
      this.anonymousTemplatesStore.clearDetails();
      return;
    }

    this.anonymousTemplatesStore.loadDetails(this.anonymousTemplateId);
    this.anonymousTemplatesStore.loadResponseDetails(this.anonymousTemplateId, this.responseId);
  }

  goBack(): void {
    this.location.back();
  }

  customInputDisplayValue(value: AnonymousTemplateResponseCustomInputValue): string {
    if (value.displayValue.trim().length > 0) {
      return value.displayValue;
    }

    if (value.type === 2) {
      return value.integerValue === null ? '-' : String(value.integerValue);
    }

    return value.stringValue?.trim() || '-';
  }

  customInputLabel(value: AnonymousTemplateResponseCustomInputValue): string {
    if (this.i18n.language() === 'ar') {
      return value.labelAr || value.labelEn || value.nameSnapshot || value.name || '-';
    }

    return value.labelEn || value.labelAr || value.nameSnapshot || value.name || '-';
  }

  responseTitle(response: AnonymousTemplateResponseDetails): string {
    if (this.i18n.language() === 'ar') {
      return response.templateNameAr || response.templateNameEn || this.i18n.translate('anonymousTemplates.responseDetailsTitle');
    }

    return response.templateNameEn || response.templateNameAr || this.i18n.translate('anonymousTemplates.responseDetailsTitle');
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

    return answer.voiceFileName?.trim() || answer.voiceUrl?.trim() || '-';
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

  private toNestedAnswerNode(
    answer: AnonymousTemplateResponseAnswer,
  ): AnonymousResponseAnswerTreeNode {
    return {
      answer,
      children: answer.children.map((childAnswer) => this.toNestedAnswerNode(childAnswer)),
    };
  }

  private toConditionAnswerTree(
    answers: readonly AnonymousTemplateResponseAnswer[],
    conditions: readonly AnonymousTemplateQuestionCondition[],
  ): readonly AnonymousResponseAnswerTreeNode[] {
    const responseOrder = new Map(
      answers.map((answer, index) => [answer.anonymousTemplateQuestionId, index]),
    );
    const answersByQuestionId = new Map(
      answers
        .filter((answer) => answer.anonymousTemplateQuestionId.length > 0)
        .map((answer) => [answer.anonymousTemplateQuestionId, answer]),
    );
    const childrenByParent = new Map<string, AnonymousTemplateResponseAnswer[]>();
    const nestedChildIds = new Set<string>();

    for (const condition of conditions) {
      const parentAnswer = answersByQuestionId.get(condition.parentAnonymousTemplateQuestionId);
      const childAnswer = answersByQuestionId.get(condition.childAnonymousTemplateQuestionId);

      if (!parentAnswer || !childAnswer) {
        continue;
      }

      const children = childrenByParent.get(parentAnswer.anonymousTemplateQuestionId) ?? [];
      childrenByParent.set(parentAnswer.anonymousTemplateQuestionId, [...children, childAnswer]);
      nestedChildIds.add(childAnswer.anonymousTemplateQuestionId);
    }

    const buildNode = (
      answer: AnonymousTemplateResponseAnswer,
      visitedIds: ReadonlySet<string>,
    ): AnonymousResponseAnswerTreeNode => {
      if (visitedIds.has(answer.anonymousTemplateQuestionId)) {
        return { answer, children: [] };
      }

      const nextVisitedIds = new Set(visitedIds);
      nextVisitedIds.add(answer.anonymousTemplateQuestionId);

      return {
        answer,
        children: [...(childrenByParent.get(answer.anonymousTemplateQuestionId) ?? [])]
          .sort(
            (first, second) =>
              (responseOrder.get(first.anonymousTemplateQuestionId) ?? Number.MAX_SAFE_INTEGER) -
              (responseOrder.get(second.anonymousTemplateQuestionId) ?? Number.MAX_SAFE_INTEGER),
          )
          .map((childAnswer) => buildNode(childAnswer, nextVisitedIds)),
      };
    };

    return answers
      .filter(
        (answer) =>
          answer.anonymousTemplateQuestionId.length === 0 ||
          !nestedChildIds.has(answer.anonymousTemplateQuestionId),
      )
      .map((answer) => buildNode(answer, new Set()));
  }
}

import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { GitBranch } from 'lucide-angular';
import {
  QuestionAnswerOption,
  QuestionAnswerTypeInput,
  questionAnswerTypeLabelKey,
} from '../../../../../shared/models/question-answer.model';
import {
  ConditionalQuestionNode,
  QUESTION_CONDITION_TRIGGER_TYPE,
  QuestionCondition,
  TemplateQuestionTreeNode,
  buildTemplateQuestionTree,
} from '../../../../../shared/models/question-condition.model';
import { TranslatePipe } from '../../../../../shared/pipes/translate.pipe';
import { IconComponent } from '../../../../../shared/ui/icon/icon.component';
import { I18nService } from '../../../../../core/services/i18n.service';

export interface BranchTemplateQuestionTreeItem extends ConditionalQuestionNode {
  questionId: string;
  textEn: string;
  textAr: string | null;
  type: QuestionAnswerTypeInput;
  typeName: string;
  groupNameEn: string;
  groupNameAr: string | null;
  options: readonly QuestionAnswerOption[];
}

@Component({
  selector: 'app-branch-template-question-tree',
  standalone: true,
  imports: [IconComponent, NgTemplateOutlet, TranslatePipe],
  templateUrl: './branch-template-question-tree.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BranchTemplateQuestionTreeComponent {
  private readonly i18n = inject(I18nService);

  readonly questions = input<readonly BranchTemplateQuestionTreeItem[]>([]);
  readonly conditions = input<readonly QuestionCondition[]>([]);
  readonly branchIcon = GitBranch;

  readonly activeQuestions = computed(() =>
    [...this.questions()]
      .filter((question) => question.templateQuestionId.length > 0)
      .sort(
        (first, second) =>
          (first.order ?? Number.MAX_SAFE_INTEGER) -
          (second.order ?? Number.MAX_SAFE_INTEGER),
      ),
  );
  readonly treeRoots = computed<readonly TemplateQuestionTreeNode<BranchTemplateQuestionTreeItem>[]>(
    () => {
      try {
        return buildTemplateQuestionTree(this.activeQuestions(), this.conditions()).roots;
      } catch {
        return this.activeQuestions().map((question) => ({
          question,
          conditionFromParent: null,
          children: [],
        }));
      }
    },
  );

  questionText(question: BranchTemplateQuestionTreeItem): string {
    if (this.i18n.language() === 'ar') {
      return question.textAr || question.textEn || '-';
    }

    return question.textEn || question.textAr || '-';
  }

  questionSecondaryText(question: BranchTemplateQuestionTreeItem): string {
    if (this.i18n.language() === 'ar') {
      return question.textEn;
    }

    return question.textAr ?? '';
  }

  groupName(question: BranchTemplateQuestionTreeItem): string {
    if (this.i18n.language() === 'ar') {
      return question.groupNameAr || question.groupNameEn || '-';
    }

    return question.groupNameEn || question.groupNameAr || '-';
  }

  answerTypeLabel(question: BranchTemplateQuestionTreeItem): string {
    const labelKey = questionAnswerTypeLabelKey(question.type);
    return labelKey ? this.i18n.translate(labelKey) : question.typeName || String(question.type);
  }

  triggerLabel(
    condition: QuestionCondition | null,
    parentQuestion: BranchTemplateQuestionTreeItem | null,
  ): string {
    if (!condition) {
      return this.i18n.translate('branchTemplates.rootQuestion');
    }

    if (condition.triggerType === QUESTION_CONDITION_TRIGGER_TYPE.SingleChoiceOption) {
      const option = parentQuestion?.options.find(
        (item) => item.optionId === condition.selectedQuestionOptionId,
      );
      return `${this.i18n.translate('branchTemplates.ifAnswer')} ${this.optionLabel(option)}`;
    }

    const value = condition.triggerValue ?? '-';
    return `${this.i18n.translate('branchTemplates.ifAnswer')} ${this.i18n.translate('branchTemplates.triggerValue')} ${value}`;
  }

  private optionLabel(option: QuestionAnswerOption | undefined): string {
    if (!option) {
      return '-';
    }

    if (this.i18n.language() === 'ar') {
      return option.textAr || option.textEn || '-';
    }

    return option.textEn || option.textAr || '-';
  }
}

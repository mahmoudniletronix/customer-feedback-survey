import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { CheckCircle2, FileText, GitBranch, ListChecks, XCircle } from 'lucide-angular';
import { I18nService } from '../../../../../core/services/i18n.service';
import {
  QuestionAnswerOption,
  QuestionAnswerTypeInput,
  questionAnswerTypeLabelKey,
} from '../../../../../shared/models/question-answer.model';
import { TranslatePipe } from '../../../../../shared/pipes/translate.pipe';
import { ButtonComponent } from '../../../../../shared/ui/button/button.component';
import { IconComponent } from '../../../../../shared/ui/icon/icon.component';
import { ModalComponent } from '../../../../../shared/ui/modal/modal.component';
import { BranchTemplateQuestionTreeComponent } from '../../../../branch-admin/templates/presentation/components/branch-template-question-tree.component';
import {
  SurveyDashboardSource,
  SurveyDashboardTemplateCustomInput,
  SurveyDashboardTemplateDetails,
  SurveyDashboardTemplateQuestion,
} from '../../domain/survey-dashboard.model';

@Component({
  selector: 'app-survey-template-details-modal',
  standalone: true,
  imports: [
    BranchTemplateQuestionTreeComponent,
    ButtonComponent,
    DatePipe,
    IconComponent,
    ModalComponent,
    TranslatePipe,
  ],
  templateUrl: './survey-template-details-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SurveyTemplateDetailsModalComponent {
  private readonly i18n = inject(I18nService);

  readonly open = input(false);
  readonly loading = input(false);
  readonly error = input<string | null>(null);
  readonly details = input<SurveyDashboardTemplateDetails | null>(null);
  readonly closed = output<void>();

  readonly activeIcon = CheckCircle2;
  readonly branchIcon = GitBranch;
  readonly inactiveIcon = XCircle;
  readonly questionsIcon = ListChecks;
  readonly templateIcon = FileText;

  templateTitle(template: SurveyDashboardTemplateDetails): string {
    return this.localized(template.nameEn, template.nameAr);
  }

  branchName(template: SurveyDashboardTemplateDetails): string {
    return this.localized(template.branchNameEn, template.branchNameAr);
  }

  sourceLabel(source: SurveyDashboardSource): string {
    if (source === 'Anonymous') {
      return this.i18n.translate('surveyDashboard.sourceAnonymous');
    }
    if (source === 'Internal') {
      return this.i18n.translate('surveyDashboard.sourceInternal');
    }

    return this.i18n.translate('surveyDashboard.sourceAll');
  }

  sourceClass(source: SurveyDashboardSource): string {
    if (source === 'Anonymous') return 'bg-violet-50 text-violet-700';
    if (source === 'Internal') return 'bg-cyan-50 text-cyan-700';
    return 'bg-slate-100 text-slate-600';
  }

  activeLabel(isActive: boolean): string {
    return this.i18n.translate(isActive ? 'surveyDashboard.active' : 'surveyDashboard.inactive');
  }

  customInputLabel(input: SurveyDashboardTemplateCustomInput): string {
    return this.localized(input.labelEn || input.name, input.labelAr);
  }

  customInputTypeLabel(input: SurveyDashboardTemplateCustomInput): string {
    if (this.isIntegerCustomInput(input)) {
      return this.i18n.translate('surveyDashboard.typeInteger');
    }

    return this.i18n.translate('surveyDashboard.typeString');
  }

  customInputValidationLabel(input: SurveyDashboardTemplateCustomInput): string {
    if (this.isIntegerCustomInput(input)) {
      return `${this.i18n.translate('surveyDashboard.minValue')}: ${input.minValue ?? '-'} / ${this.i18n.translate('surveyDashboard.maxValue')}: ${input.maxValue ?? '-'}`;
    }

    return `${this.i18n.translate('surveyDashboard.minLength')}: ${input.minLength ?? '-'} / ${this.i18n.translate('surveyDashboard.maxLength')}: ${input.maxLength ?? '-'}`;
  }

  questionText(question: SurveyDashboardTemplateQuestion): string {
    return this.localized(question.textEn, question.textAr);
  }

  questionSecondaryText(question: SurveyDashboardTemplateQuestion): string {
    if (this.i18n.language() === 'ar') {
      return question.textEn;
    }

    return question.textAr ?? '';
  }

  groupName(question: SurveyDashboardTemplateQuestion): string {
    return this.localized(question.groupNameEn, question.groupNameAr);
  }

  answerTypeLabel(type: QuestionAnswerTypeInput, fallback: string): string {
    const labelKey = questionAnswerTypeLabelKey(type);
    return labelKey ? this.i18n.translate(labelKey) : fallback || String(type ?? '-');
  }

  activeOptions(question: SurveyDashboardTemplateQuestion): readonly QuestionAnswerOption[] {
    return [...question.options]
      .filter((option) => option.isActive)
      .sort((first, second) => first.order - second.order);
  }

  optionPrimaryText(option: QuestionAnswerOption): string {
    return this.localized(option.textEn, option.textAr);
  }

  optionSecondaryText(option: QuestionAnswerOption): string {
    if (this.i18n.language() === 'ar') {
      return option.textEn;
    }

    return option.textAr ?? '';
  }

  private localized(
    englishText: string | null | undefined,
    arabicText: string | null | undefined,
  ): string {
    const english = englishText?.trim() ?? '';
    const arabic = arabicText?.trim() ?? '';

    if (this.i18n.language() === 'ar') {
      return arabic || english || '-';
    }

    return english || arabic || '-';
  }

  private isIntegerCustomInput(input: SurveyDashboardTemplateCustomInput): boolean {
    const normalizedType = (input.typeName || input.type).toString().toLowerCase();
    return normalizedType.includes('integer') || normalizedType === '2';
  }
}

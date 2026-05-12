import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { Building2, ClipboardList, FileText, HelpCircle, RefreshCw } from 'lucide-angular';
import { I18nService } from '../../../core/services/i18n.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { IconComponent } from '../../../shared/ui/icon/icon.component';
import { OperatorAssignedTemplate, OperatorAssignedTemplateQuestion } from '../models/operator-template.model';
import { OperatorTemplatesStore } from '../state/operator-templates.store';

interface OperatorQuestionView {
  id: string;
  order: number | null;
  text: string;
  secondaryText: string;
  type: string;
  groupName: string;
}

interface OperatorTemplateView {
  templateId: string;
  name: string;
  secondaryName: string;
  description: string;
  branchName: string;
  branchCode: string;
  questionsCount: number;
  questions: readonly OperatorQuestionView[];
}

@Component({
  selector: 'app-operator-my-templates-page',
  standalone: true,
  imports: [ButtonComponent, IconComponent, TranslatePipe],
  templateUrl: './operator-my-templates-page.component.html',
  styleUrl: './operator-my-templates-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OperatorMyTemplatesPageComponent implements OnInit {
  readonly operatorTemplatesStore = inject(OperatorTemplatesStore);
  private readonly i18n = inject(I18nService);

  readonly branchIcon = Building2;
  readonly clipboardIcon = ClipboardList;
  readonly fileTextIcon = FileText;
  readonly questionIcon = HelpCircle;
  readonly refreshIcon = RefreshCw;

  readonly templates = computed<readonly OperatorTemplateView[]>(() =>
    this.operatorTemplatesStore.templates().map((template) => this.toTemplateView(template)),
  );

  ngOnInit(): void {
    this.operatorTemplatesStore.load();
  }

  reloadTemplates(): void {
    this.operatorTemplatesStore.load();
  }

  private toTemplateView(template: OperatorAssignedTemplate): OperatorTemplateView {
    const isArabic = this.i18n.language() === 'ar';

    return {
      templateId: template.templateId,
      name: this.localizedText(template.nameEn, template.nameAr, isArabic),
      secondaryName: this.secondaryLocalizedText(template.nameEn, template.nameAr, isArabic),
      description: template.description,
      branchName: this.localizedText(template.branchNameEn, template.branchNameAr, isArabic),
      branchCode: template.branchCode,
      questionsCount: template.questionsCount,
      questions: template.questions.map((question) => this.toQuestionView(question, isArabic)),
    };
  }

  private toQuestionView(
    question: OperatorAssignedTemplateQuestion,
    isArabic: boolean,
  ): OperatorQuestionView {
    return {
      id: question.templateQuestionId || question.questionId,
      order: question.order,
      text: this.localizedText(question.textEn, question.textAr, isArabic),
      secondaryText: this.secondaryLocalizedText(question.textEn, question.textAr, isArabic),
      type: question.type,
      groupName: this.localizedText(question.groupNameEn, question.groupNameAr, isArabic),
    };
  }

  private localizedText(englishText: string, arabicText: string, isArabic: boolean): string {
    if (isArabic && arabicText.length > 0) {
      return arabicText;
    }
    return englishText || arabicText;
  }

  private secondaryLocalizedText(englishText: string, arabicText: string, isArabic: boolean): string {
    if (isArabic) {
      return englishText;
    }
    return arabicText;
  }
}

import { DatePipe, Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  FileText,
  ListChecks,
  Pencil,
  Save,
  Trash2,
  X,
} from 'lucide-angular';
import { I18nService } from '../../../../../core/services/i18n.service';
import {
  QuestionAnswerTypeInput,
  questionAnswerTypeLabelKey,
} from '../../../../../shared/models/question-answer.model';
import { TranslatePipe } from '../../../../../shared/pipes/translate.pipe';
import { ButtonComponent } from '../../../../../shared/ui/button/button.component';
import { CardComponent } from '../../../../../shared/ui/card/card.component';
import { IconComponent } from '../../../../../shared/ui/icon/icon.component';
import { InputComponent } from '../../../../../shared/ui/input/input.component';
import { QuestionAnswerPreviewComponent } from '../../../../../shared/ui/question-answer-preview/question-answer-preview.component';
import {
  BranchTemplateDetailsQuestion,
  BranchTemplateQuestionSelectionItem,
} from '../../domain/branch-template.model';
import { BranchTemplatesStore } from '../state/branch-templates.store';

interface TemplateDetailsQuestionGroupView {
  groupId: string;
  nameEn: string;
  nameAr: string;
  questions: readonly TemplateDetailsQuestionView[];
}

interface TemplateDetailsQuestionView {
  questionId: string;
  textEn: string;
  textAr: string;
  type: string;
  isSelected: boolean;
  isActive: boolean;
  order: number | null;
  options: BranchTemplateQuestionSelectionItem['options'];
}

@Component({
  selector: 'app-branch-template-details-page',
  standalone: true,
  imports: [
    ButtonComponent,
    CardComponent,
    DatePipe,
    IconComponent,
    InputComponent,
    QuestionAnswerPreviewComponent,
    ReactiveFormsModule,
    TranslatePipe,
  ],
  templateUrl: './branch-template-details-page.component.html',
  styleUrl: './branch-template-details-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BranchTemplateDetailsPageComponent implements OnInit {
  readonly templatesStore = inject(BranchTemplatesStore);
  private readonly formBuilder = inject(FormBuilder);
  private readonly i18n = inject(I18nService);
  private readonly location = inject(Location);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly arrowLeftIcon = ArrowLeft;
  readonly cancelIcon = X;
  readonly checkedIcon = CheckCircle2;
  readonly deleteIcon = Trash2;
  readonly editIcon = Pencil;
  readonly fileTextIcon = FileText;
  readonly listChecksIcon = ListChecks;
  readonly saveIcon = Save;
  readonly unselectedIcon = Circle;
  readonly editMode = signal(false);
  readonly questionGroups = computed<readonly TemplateDetailsQuestionGroupView[]>(() => {
    const selectionGroups = this.templatesStore.questionsSelection()?.groups ?? [];
    if (selectionGroups.length > 0) {
      return selectionGroups.map((group) => ({
        groupId: group.groupId,
        nameEn: group.nameEn,
        nameAr: group.nameAr,
        questions: group.questions,
      }));
    }

    return this.toQuestionGroups(this.templatesStore.selectedTemplate()?.questions ?? []);
  });
  readonly displaySelectedQuestionsCount = computed(() =>
    this.questionGroups().reduce(
      (total, group) => total + group.questions.filter((question) => question.isSelected).length,
      0,
    ),
  );
  readonly displayTotalQuestionsCount = computed(() =>
    this.questionGroups().reduce((total, group) => total + group.questions.length, 0),
  );

  readonly templateForm = this.formBuilder.nonNullable.group({
    nameEn: ['', [Validators.required, Validators.maxLength(200)]],
    nameAr: ['', [Validators.required, Validators.maxLength(200)]],
    description: ['', [Validators.required, Validators.maxLength(1000)]],
    activeFrom: ['', [Validators.required]],
    expireTo: [''],
  });

  private patchedTemplateId = '';

  constructor() {
    effect(() => {
      const template = this.templatesStore.selectedTemplate();
      if (!template || template.templateId === this.patchedTemplateId) {
        return;
      }

      this.templateForm.setValue({
        nameEn: template.nameEn,
        nameAr: template.nameAr,
        description: template.description,
        activeFrom: template.activeFrom
          ? this.toDateTimeLocalValue(new Date(template.activeFrom))
          : this.toDateTimeLocalValue(new Date()),
        expireTo: template.expireTo ? this.toDateTimeLocalValue(new Date(template.expireTo)) : '',
      });
      this.patchedTemplateId = template.templateId;
    });
  }

  ngOnInit(): void {
    const templateId = this.route.snapshot.paramMap.get('templateId') ?? '';
    if (templateId.length === 0) {
      this.templatesStore.clearDetails();
      return;
    }

    this.templatesStore.loadDetails(templateId);
    this.templatesStore.loadQuestionsSelection(templateId);
  }

  goBack(): void {
    this.location.back();
  }

  enableEdit(): void {
    this.editMode.set(true);
  }

  cancelEdit(): void {
    const template = this.templatesStore.selectedTemplate();
    if (template) {
      this.templateForm.setValue({
        nameEn: template.nameEn,
        nameAr: template.nameAr,
        description: template.description,
        activeFrom: template.activeFrom
          ? this.toDateTimeLocalValue(new Date(template.activeFrom))
          : this.toDateTimeLocalValue(new Date()),
        expireTo: template.expireTo ? this.toDateTimeLocalValue(new Date(template.expireTo)) : '',
      });
    }
    this.editMode.set(false);
  }

  updateTemplate(): void {
    const template = this.templatesStore.selectedTemplate();
    this.templateForm.markAllAsTouched();
    this.validateTemplateDates();

    if (!template || this.templateForm.invalid || this.templatesStore.updating()) {
      return;
    }

    const formValue = this.templateForm.getRawValue();
    this.templatesStore.updateTemplate(template.templateId, {
      nameEn: formValue.nameEn,
      nameAr: formValue.nameAr,
      description: formValue.description,
      activeFrom: this.toUtcIsoDateTime(formValue.activeFrom),
      expireTo: formValue.expireTo ? this.toUtcIsoDateTime(formValue.expireTo) : null,
    }, () => {
      this.editMode.set(false);
    });
  }

  deleteTemplate(): void {
    const template = this.templatesStore.selectedTemplate();
    if (!template || this.templatesStore.deleting()) {
      return;
    }

    const confirmed = globalThis.confirm(this.i18n.translate('branchTemplates.deleteConfirm'));
    if (!confirmed) {
      return;
    }

    this.templatesStore.deleteTemplate(template.templateId, () => {
      void this.router.navigateByUrl('/branch-admin/templates');
    });
  }

  openQuestionsManager(): void {
    const template = this.templatesStore.selectedTemplate();
    if (!template) {
      return;
    }

    void this.router.navigate(['/branch-admin/templates', template.templateId, 'questions']);
  }

  answerTypeLabel(type: QuestionAnswerTypeInput): string {
    const labelKey = questionAnswerTypeLabelKey(type);
    if (labelKey) {
      return this.i18n.translate(labelKey);
    }

    return typeof type === 'string' || typeof type === 'number' ? String(type) : '-';
  }

  templateFieldError(field: keyof typeof this.templateForm.controls): string {
    const control = this.templateForm.controls[field];
    if (!control.touched || control.valid) {
      return '';
    }

    if (control.hasError('required')) {
      return this.requiredErrorKey(field);
    }

    if (control.hasError('maxlength')) {
      return this.maxLengthErrorKey(field);
    }

    if (control.hasError('dateRange')) {
      return 'branchTemplates.expireToAfterActiveFrom';
    }

    return 'branchTemplates.fieldRequired';
  }

  private requiredErrorKey(field: keyof typeof this.templateForm.controls): string {
    const errorKeys: Record<keyof typeof this.templateForm.controls, string> = {
      nameEn: 'branchTemplates.nameEnRequired',
      nameAr: 'branchTemplates.nameArRequired',
      description: 'branchTemplates.descriptionRequired',
      activeFrom: 'branchTemplates.activeFromRequired',
      expireTo: 'branchTemplates.fieldRequired',
    };

    return errorKeys[field];
  }

  private maxLengthErrorKey(field: keyof typeof this.templateForm.controls): string {
    const errorKeys: Record<keyof typeof this.templateForm.controls, string> = {
      nameEn: 'branchTemplates.nameEnMaxLength',
      nameAr: 'branchTemplates.nameArMaxLength',
      description: 'branchTemplates.descriptionMaxLength',
      activeFrom: 'branchTemplates.fieldRequired',
      expireTo: 'branchTemplates.fieldRequired',
    };

    return errorKeys[field];
  }

  private toQuestionGroups(
    questions: readonly BranchTemplateDetailsQuestion[],
  ): readonly TemplateDetailsQuestionGroupView[] {
    const groupsById = new Map<string, TemplateDetailsQuestionGroupView>();

    for (const question of questions) {
      const groupId = question.groupId || 'ungrouped';
      const currentGroup = groupsById.get(groupId);
      const nextQuestion: TemplateDetailsQuestionView = {
        questionId: question.questionId,
        textEn: question.textEn,
        textAr: question.textAr,
        type: question.type,
        isSelected: true,
        isActive: question.isActive,
        order: question.order,
        options: question.options,
      };

      if (currentGroup) {
        groupsById.set(groupId, {
          ...currentGroup,
          questions: [...currentGroup.questions, nextQuestion],
        });
        continue;
      }

      groupsById.set(groupId, {
        groupId,
        nameEn: question.groupNameEn,
        nameAr: question.groupNameAr,
        questions: [nextQuestion],
      });
    }

    return [...groupsById.values()];
  }

  private validateTemplateDates(): void {
    const activeFrom = this.templateForm.controls.activeFrom.value;
    const expireTo = this.templateForm.controls.expireTo.value;
    const expireToControl = this.templateForm.controls.expireTo;

    if (!expireTo) {
      const { dateRange: _dateRange, ...remainingErrors } = expireToControl.errors ?? {};
      expireToControl.setErrors(Object.keys(remainingErrors).length > 0 ? remainingErrors : null);
      return;
    }

    const activeFromTime = new Date(activeFrom).getTime();
    const expireToTime = new Date(expireTo).getTime();

    if (
      Number.isNaN(activeFromTime) ||
      Number.isNaN(expireToTime) ||
      expireToTime <= activeFromTime
    ) {
      expireToControl.setErrors({ ...(expireToControl.errors ?? {}), dateRange: true });
      return;
    }

    const { dateRange: _dateRange, ...remainingErrors } = expireToControl.errors ?? {};
    expireToControl.setErrors(Object.keys(remainingErrors).length > 0 ? remainingErrors : null);
  }

  private toUtcIsoDateTime(value: string): string {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : date.toISOString();
  }

  private toDateTimeLocalValue(date: Date): string {
    const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return offsetDate.toISOString().slice(0, 16);
  }
}

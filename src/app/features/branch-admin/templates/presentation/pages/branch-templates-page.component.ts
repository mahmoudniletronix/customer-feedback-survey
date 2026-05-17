import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  ListChecks,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
} from 'lucide-angular';
import { I18nService } from '../../../../../core/services/i18n.service';
import { TranslatePipe } from '../../../../../shared/pipes/translate.pipe';
import { ButtonComponent } from '../../../../../shared/ui/button/button.component';
import { CardComponent } from '../../../../../shared/ui/card/card.component';
import { IconComponent } from '../../../../../shared/ui/icon/icon.component';
import { InputComponent } from '../../../../../shared/ui/input/input.component';
import { ModalComponent } from '../../../../../shared/ui/modal/modal.component';
import { BranchTemplate } from '../../domain/branch-template.model';
import { BranchTemplatesStore } from '../state/branch-templates.store';

@Component({
  selector: 'app-branch-templates-page',
  standalone: true,
  imports: [
    ButtonComponent,
    CardComponent,
    DatePipe,
    IconComponent,
    InputComponent,
    ModalComponent,
    ReactiveFormsModule,
    RouterLink,
    TranslatePipe,
  ],
  templateUrl: './branch-templates-page.component.html',
  styleUrl: './branch-templates-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BranchTemplatesPageComponent implements OnInit {
  readonly templatesStore = inject(BranchTemplatesStore);
  private readonly formBuilder = inject(FormBuilder);
  private readonly i18n = inject(I18nService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly chevronLeftIcon = ChevronLeft;
  readonly chevronRightIcon = ChevronRight;
  readonly deleteIcon = Trash2;
  readonly editIcon = Pencil;
  readonly fileTextIcon = FileText;
  readonly listChecksIcon = ListChecks;
  readonly plusIcon = Plus;
  readonly restoreIcon = RotateCcw;
  readonly searchIcon = Search;
  readonly createModalOpen = signal(false);
  readonly editModalOpen = signal(false);
  readonly selectedTemplate = signal<BranchTemplate | null>(null);

  readonly searchForm = this.formBuilder.nonNullable.group({
    searchText: [''],
    isActive: [''],
    orderSort: [''],
  });

  readonly templateForm = this.formBuilder.nonNullable.group({
    nameEn: ['', [Validators.required, Validators.maxLength(200)]],
    nameAr: ['', [Validators.required, Validators.maxLength(200)]],
    description: ['', [Validators.required, Validators.maxLength(1000)]],
    activeFrom: [this.toDateTimeLocalValue(new Date()), [Validators.required]],
    expireTo: [''],
  });

  readonly editTemplateForm = this.formBuilder.nonNullable.group({
    nameEn: ['', [Validators.required, Validators.maxLength(200)]],
    nameAr: ['', [Validators.required, Validators.maxLength(200)]],
    description: ['', [Validators.required, Validators.maxLength(1000)]],
    activeFrom: ['', [Validators.required]],
    expireTo: [''],
  });

  ngOnInit(): void {
    this.templatesStore.load();
  }

  searchTemplates(): void {
    const formValue = this.searchForm.getRawValue();
    this.templatesStore.search(
      formValue.searchText,
      this.toIsActiveFilter(formValue.isActive),
      formValue.orderSort,
    );
  }

  clearTemplateSearch(): void {
    this.searchForm.reset();
    this.templatesStore.search('', null, '');
  }

  goToPreviousTemplatesPage(): void {
    this.templatesStore.previousPage();
  }

  goToNextTemplatesPage(): void {
    this.templatesStore.nextPage();
  }

  openCreateTemplate(): void {
    this.templatesStore.clearMessages();
    this.templateForm.reset({
      nameEn: '',
      nameAr: '',
      description: '',
      activeFrom: this.toDateTimeLocalValue(new Date()),
      expireTo: '',
    });
    this.createModalOpen.set(true);
  }

  closeCreateTemplate(): void {
    this.templateForm.reset({
      nameEn: '',
      nameAr: '',
      description: '',
      activeFrom: this.toDateTimeLocalValue(new Date()),
      expireTo: '',
    });
    this.createModalOpen.set(false);
  }

  createTemplate(): void {
    this.templateForm.markAllAsTouched();
    this.validateCreateTemplateDates();
    if (this.templateForm.invalid || this.templatesStore.creating()) {
      return;
    }

    const formValue = this.templateForm.getRawValue();
    this.templatesStore.createTemplate(
      {
        nameEn: formValue.nameEn,
        nameAr: formValue.nameAr,
        description: formValue.description,
        activeFrom: this.toUtcIsoDateTime(formValue.activeFrom),
        expireTo: formValue.expireTo ? this.toUtcIsoDateTime(formValue.expireTo) : null,
      },
      () => {
        this.closeCreateTemplate();
      },
    );
  }

  openEditTemplate(event: MouseEvent, template: BranchTemplate): void {
    event.stopPropagation();
    this.templatesStore.clearMessages();
    this.selectedTemplate.set(template);
    this.editTemplateForm.setValue({
      nameEn: template.nameEn,
      nameAr: template.nameAr,
      description: template.description,
      activeFrom: template.activeFrom
        ? this.toDateTimeLocalValue(new Date(template.activeFrom))
        : this.toDateTimeLocalValue(new Date()),
      expireTo: template.expireTo ? this.toDateTimeLocalValue(new Date(template.expireTo)) : '',
    });
    this.editModalOpen.set(true);
  }

  openTemplateQuestions(event: MouseEvent, template: BranchTemplate): void {
    event.stopPropagation();
    void this.router.navigate([template.templateId, 'questions'], { relativeTo: this.route });
  }

  closeEditTemplate(): void {
    this.editTemplateForm.reset();
    this.selectedTemplate.set(null);
    this.editModalOpen.set(false);
  }

  updateSelectedTemplate(): void {
    const template = this.selectedTemplate();
    this.editTemplateForm.markAllAsTouched();
    this.validateTemplateDates(this.editTemplateForm);

    if (!template || this.editTemplateForm.invalid || this.templatesStore.updating()) {
      return;
    }

    const formValue = this.editTemplateForm.getRawValue();
    this.templatesStore.updateTemplate(
      template.templateId,
      {
        nameEn: formValue.nameEn,
        nameAr: formValue.nameAr,
        description: formValue.description,
        activeFrom: this.toUtcIsoDateTime(formValue.activeFrom),
        expireTo: formValue.expireTo ? this.toUtcIsoDateTime(formValue.expireTo) : null,
      },
      () => {
        this.closeEditTemplate();
      },
    );
  }

  deleteTemplate(event: MouseEvent, template: BranchTemplate): void {
    event.stopPropagation();
    if (!template.isActive || this.templatesStore.deleting()) {
      return;
    }

    const confirmed = globalThis.confirm(this.i18n.translate('branchTemplates.deleteConfirm'));
    if (!confirmed) {
      return;
    }

    this.templatesStore.deleteTemplate(template.templateId, () => {});
  }

  restoreTemplate(event: MouseEvent, template: BranchTemplate): void {
    event.stopPropagation();
    if (template.isActive || this.templatesStore.restoring()) {
      return;
    }

    this.templatesStore.restoreTemplate(template.templateId, () => {});
  }

  validityLabelKey(template: BranchTemplate): string {
    const now = Date.now();
    const activeFromTime = template.activeFrom ? new Date(template.activeFrom).getTime() : null;
    const expireToTime = template.expireTo ? new Date(template.expireTo).getTime() : null;

    if (expireToTime !== null && !Number.isNaN(expireToTime) && expireToTime <= now) {
      return 'branchTemplates.expired';
    }

    if (activeFromTime !== null && !Number.isNaN(activeFromTime) && activeFromTime > now) {
      return 'branchTemplates.scheduled';
    }

    if (expireToTime === null) {
      return 'branchTemplates.open';
    }

    return 'common.active';
  }

  validityBadgeClass(template: BranchTemplate): string {
    const labelKey = this.validityLabelKey(template);
    if (labelKey === 'branchTemplates.expired') {
      return 'bg-rose-50 text-rose-700';
    }
    if (labelKey === 'branchTemplates.scheduled') {
      return 'bg-amber-50 text-amber-700';
    }
    if (labelKey === 'branchTemplates.open') {
      return 'bg-cyan-50 text-[#0d94b3]';
    }
    return 'bg-emerald-50 text-emerald-700';
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

  editTemplateFieldError(field: keyof typeof this.editTemplateForm.controls): string {
    const control = this.editTemplateForm.controls[field];
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

  private toIsActiveFilter(value: string): boolean | null {
    if (value === 'true') {
      return true;
    }
    if (value === 'false') {
      return false;
    }
    return null;
  }

  private validateCreateTemplateDates(): void {
    this.validateTemplateDates(this.templateForm);
  }

  private validateTemplateDates(form: typeof this.templateForm | typeof this.editTemplateForm): void {
    const activeFrom = form.controls.activeFrom.value;
    const expireTo = form.controls.expireTo.value;
    const expireToControl = form.controls.expireTo;

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

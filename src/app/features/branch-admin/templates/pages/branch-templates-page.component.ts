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
import { I18nService } from '../../../../core/services/i18n.service';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { ButtonComponent } from '../../../../shared/ui/button/button.component';
import { CardComponent } from '../../../../shared/ui/card/card.component';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { InputComponent } from '../../../../shared/ui/input/input.component';
import { ModalComponent } from '../../../../shared/ui/modal/modal.component';
import { BranchTemplate } from '../models/branch-template.model';
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
  });

  readonly editTemplateForm = this.formBuilder.nonNullable.group({
    nameEn: ['', [Validators.required, Validators.maxLength(200)]],
    nameAr: ['', [Validators.required, Validators.maxLength(200)]],
    description: ['', [Validators.required, Validators.maxLength(1000)]],
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
    this.createModalOpen.set(true);
  }

  closeCreateTemplate(): void {
    this.templateForm.reset();
    this.createModalOpen.set(false);
  }

  createTemplate(): void {
    this.templateForm.markAllAsTouched();
    if (this.templateForm.invalid || this.templatesStore.creating()) {
      return;
    }

    this.templatesStore.createTemplate(this.templateForm.getRawValue(), () => {
      this.closeCreateTemplate();
    });
  }

  openEditTemplate(event: MouseEvent, template: BranchTemplate): void {
    event.stopPropagation();
    this.templatesStore.clearMessages();
    this.selectedTemplate.set(template);
    this.editTemplateForm.setValue({
      nameEn: template.nameEn,
      nameAr: template.nameAr,
      description: template.description,
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

    if (!template || this.editTemplateForm.invalid || this.templatesStore.updating()) {
      return;
    }

    this.templatesStore.updateTemplate(
      template.templateId,
      this.editTemplateForm.getRawValue(),
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

    return 'branchTemplates.fieldRequired';
  }

  private requiredErrorKey(field: keyof typeof this.templateForm.controls): string {
    const errorKeys: Record<keyof typeof this.templateForm.controls, string> = {
      nameEn: 'branchTemplates.nameEnRequired',
      nameAr: 'branchTemplates.nameArRequired',
      description: 'branchTemplates.descriptionRequired',
    };

    return errorKeys[field];
  }

  private maxLengthErrorKey(field: keyof typeof this.templateForm.controls): string {
    const errorKeys: Record<keyof typeof this.templateForm.controls, string> = {
      nameEn: 'branchTemplates.nameEnMaxLength',
      nameAr: 'branchTemplates.nameArMaxLength',
      description: 'branchTemplates.descriptionMaxLength',
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
}

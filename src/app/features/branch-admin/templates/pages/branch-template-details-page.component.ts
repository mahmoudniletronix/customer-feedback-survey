import { DatePipe, Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ArrowLeft, FileText, Pencil, Save, Trash2, X } from 'lucide-angular';
import { I18nService } from '../../../../core/services/i18n.service';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { ButtonComponent } from '../../../../shared/ui/button/button.component';
import { CardComponent } from '../../../../shared/ui/card/card.component';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { InputComponent } from '../../../../shared/ui/input/input.component';
import { BranchTemplatesStore } from '../state/branch-templates.store';

@Component({
  selector: 'app-branch-template-details-page',
  standalone: true,
  imports: [ButtonComponent, CardComponent, DatePipe, IconComponent, InputComponent, ReactiveFormsModule, TranslatePipe],
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
  readonly deleteIcon = Trash2;
  readonly editIcon = Pencil;
  readonly fileTextIcon = FileText;
  readonly saveIcon = Save;
  readonly editMode = signal(false);

  readonly templateForm = this.formBuilder.nonNullable.group({
    nameEn: ['', [Validators.required, Validators.maxLength(200)]],
    nameAr: ['', [Validators.required, Validators.maxLength(200)]],
    description: ['', [Validators.required, Validators.maxLength(1000)]],
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
      });
    }
    this.editMode.set(false);
  }

  updateTemplate(): void {
    const template = this.templatesStore.selectedTemplate();
    this.templateForm.markAllAsTouched();

    if (!template || this.templateForm.invalid || this.templatesStore.updating()) {
      return;
    }

    this.templatesStore.updateTemplate(template.templateId, this.templateForm.getRawValue(), () => {
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
}

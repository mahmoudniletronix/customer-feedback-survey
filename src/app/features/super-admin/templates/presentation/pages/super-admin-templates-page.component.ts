import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  ExternalLink,
  FilePlus2,
  FileText,
  QrCode,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-angular';
import { I18nService } from '../../../../../core/services/i18n.service';
import { TranslatePipe } from '../../../../../shared/pipes/translate.pipe';
import { ButtonComponent } from '../../../../../shared/ui/button/button.component';
import { IconComponent } from '../../../../../shared/ui/icon/icon.component';
import { BranchesService } from '../../../branches/data/branches.service';
import { BranchSelection } from '../../../branches/domain/branch.model';
import {
  SuperAdminTemplateCatalogKind,
  SuperAdminTemplateCopyResult,
  SuperAdminTemplateListItem,
} from '../../domain/super-admin-template.model';
import { SuperAdminTemplatesStore } from '../state/super-admin-templates.store';

@Component({
  selector: 'app-super-admin-templates-page',
  standalone: true,
  imports: [ButtonComponent, DatePipe, IconComponent, ReactiveFormsModule, TranslatePipe],
  templateUrl: './super-admin-templates-page.component.html',
  styleUrl: './super-admin-templates-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuperAdminTemplatesPageComponent implements OnInit {
  readonly templatesStore = inject(SuperAdminTemplatesStore);
  private readonly branchesService = inject(BranchesService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly i18n = inject(I18nService);

  readonly chevronLeftIcon = ChevronLeft;
  readonly chevronRightIcon = ChevronRight;
  readonly copyIcon = Copy;
  readonly externalLinkIcon = ExternalLink;
  readonly filePlusIcon = FilePlus2;
  readonly fileTextIcon = FileText;
  readonly filterIcon = SlidersHorizontal;
  readonly qrCodeIcon = QrCode;
  readonly searchIcon = Search;
  readonly closeIcon = X;

  readonly branchOptions = signal<readonly BranchSelection[]>([]);
  readonly branchOptionsLoading = signal(false);
  readonly copiedMessageKey = signal<string | null>(null);
  readonly copiedTemplateId = signal<string | null>(null);
  readonly copyModalOpen = signal(false);
  readonly selectedTemplateForCopy = signal<SuperAdminTemplateListItem | null>(null);

  readonly searchForm = this.formBuilder.nonNullable.group({
    searchText: [''],
    branchId: [''],
    templateKind: [''],
    isActive: [''],
    pageSize: ['10'],
    orderSort: [''],
  });

  readonly copyForm = this.formBuilder.nonNullable.group({
    branchId: ['', [Validators.required]],
  });

  ngOnInit(): void {
    this.templatesStore.load();
    this.loadBranchOptions();
  }

  searchTemplates(): void {
    const formValue = this.searchForm.getRawValue();
    this.templatesStore.search({
      searchText: formValue.searchText,
      branchId: formValue.branchId,
      templateKind: this.toTemplateKind(formValue.templateKind),
      isActive: this.toNullableBoolean(formValue.isActive),
      pageSize: this.toPageSize(formValue.pageSize),
      orderSort: formValue.orderSort,
    });
  }

  clearSearch(): void {
    this.searchForm.reset({
      searchText: '',
      branchId: '',
      templateKind: '',
      isActive: '',
      pageSize: '10',
      orderSort: '',
    });
    this.templatesStore.search({
      searchText: '',
      branchId: '',
      templateKind: '',
      isActive: null,
      pageSize: 10,
      orderSort: '',
    });
  }

  previousPage(): void {
    this.templatesStore.previousPage();
  }

  nextPage(): void {
    this.templatesStore.nextPage();
  }

  openCopyModal(template: SuperAdminTemplateListItem): void {
    this.selectedTemplateForCopy.set(template);
    this.copyForm.reset({ branchId: '' });
    this.copyModalOpen.set(true);
    this.templatesStore.clearCopyState();
  }

  closeCopyModal(): void {
    if (this.templatesStore.copying()) {
      return;
    }
    this.copyModalOpen.set(false);
    this.selectedTemplateForCopy.set(null);
    this.copyForm.reset({ branchId: '' });
    this.templatesStore.clearCopyState();
  }

  copySelectedTemplate(): void {
    this.copyForm.markAllAsTouched();
    const template = this.selectedTemplateForCopy();

    if (!template || this.copyForm.invalid || this.templatesStore.copying()) {
      return;
    }

    this.templatesStore.copyToBranch({
      templateId: template.templateId,
      branchId: this.copyForm.controls.branchId.value,
    });
  }

  templateDisplayName(template: SuperAdminTemplateListItem): string {
    if (this.i18n.language() === 'ar') {
      return template.nameAr || template.nameEn || '-';
    }
    return template.nameEn || template.nameAr || '-';
  }

  branchDisplayName(template: SuperAdminTemplateListItem): string {
    if (this.i18n.language() === 'ar') {
      return template.branchNameAr || template.branchNameEn || '-';
    }
    return template.branchNameEn || template.branchNameAr || '-';
  }

  branchOptionDisplayName(branch: BranchSelection): string {
    if (this.i18n.language() === 'ar') {
      return branch.nameAr || branch.nameEn || branch.code;
    }
    return branch.nameEn || branch.nameAr || branch.code;
  }

  createdByDisplayName(template: SuperAdminTemplateListItem): string {
    if (!template.createdBy) {
      return '-';
    }
    if (this.i18n.language() === 'ar') {
      return template.createdBy.nameAr || template.createdBy.nameEn || '-';
    }
    return template.createdBy.nameEn || template.createdBy.nameAr || '-';
  }

  typeLabelKey(template: SuperAdminTemplateListItem): string {
    return template.templateKind === 'Anonymous'
      ? 'superAdminTemplates.anonymous'
      : 'superAdminTemplates.authorized';
  }

  copyResultTypeLabelKey(result: SuperAdminTemplateCopyResult): string {
    return result.templateKind === 'Anonymous'
      ? 'superAdminTemplates.anonymous'
      : 'superAdminTemplates.authorized';
  }

  copyResultDisplayName(result: SuperAdminTemplateCopyResult): string {
    if (this.i18n.language() === 'ar') {
      return result.nameAr || result.nameEn || '-';
    }
    return result.nameEn || result.nameAr || '-';
  }

  copyResultQrCodeSrc(result: SuperAdminTemplateCopyResult): string {
    if (!result.qrCode) {
      return '';
    }
    if (result.qrCode.startsWith('data:image') || result.qrCode.startsWith('http')) {
      return result.qrCode;
    }
    return `data:image/png;base64,${result.qrCode}`;
  }

  async copyTemplateId(template: SuperAdminTemplateListItem): Promise<void> {
    await this.copyText(template.templateId, 'superAdminTemplates.templateIdCopied');
    this.copiedTemplateId.set(template.templateId);
  }

  async copyPublicUrl(template: SuperAdminTemplateListItem): Promise<void> {
    if (!template.publicUrl) {
      return;
    }
    await this.copyText(template.publicUrl, 'superAdminTemplates.publicUrlCopied');
    this.copiedTemplateId.set(template.templateId);
  }

  private loadBranchOptions(): void {
    this.branchOptionsLoading.set(true);
    this.branchesService.selection().subscribe({
      next: (branches) => {
        this.branchOptions.set(branches);
        this.branchOptionsLoading.set(false);
      },
      error: () => {
        this.branchOptions.set([]);
        this.branchOptionsLoading.set(false);
      },
    });
  }

  private async copyText(value: string, messageKey: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(value);
      this.showCopiedMessage(messageKey);
    } catch {
      this.showCopiedMessage('superAdminTemplates.copyUnavailable');
    }
  }

  private showCopiedMessage(messageKey: string): void {
    this.copiedMessageKey.set(messageKey);
    window.setTimeout(() => {
      this.copiedMessageKey.set(null);
      this.copiedTemplateId.set(null);
    }, 1800);
  }

  private toTemplateKind(value: string): SuperAdminTemplateCatalogKind | '' {
    return value === 'Authorized' || value === 'Anonymous' || value === 'AuthorizeAndAnonymous'
      ? value
      : '';
  }

  private toNullableBoolean(value: string): boolean | null {
    if (value === 'true') {
      return true;
    }
    if (value === 'false') {
      return false;
    }
    return null;
  }

  private toPageSize(value: string): number {
    const pageSize = Number(value);
    return Number.isFinite(pageSize) && pageSize > 0 ? pageSize : 10;
  }
}

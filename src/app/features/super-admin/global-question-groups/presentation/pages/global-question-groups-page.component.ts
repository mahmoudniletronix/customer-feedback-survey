import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Trash2,
} from 'lucide-angular';
import { AuthStore } from '../../../../auth/presentation/state/auth.store';
import { TranslatePipe } from '../../../../../shared/pipes/translate.pipe';
import { ButtonComponent } from '../../../../../shared/ui/button/button.component';
import { CardComponent } from '../../../../../shared/ui/card/card.component';
import { IconComponent } from '../../../../../shared/ui/icon/icon.component';
import { InputComponent } from '../../../../../shared/ui/input/input.component';
import { ModalComponent } from '../../../../../shared/ui/modal/modal.component';
import { I18nService } from '../../../../../core/services/i18n.service';
import {
  CreateGlobalQuestionGroupRequest,
  GlobalQuestionGroupListItem,
} from '../../domain/global-question-group.model';
import { GlobalQuestionGroupsStore } from '../state/global-question-groups.store';

@Component({
  selector: 'app-global-question-groups-page',
  standalone: true,
  imports: [
    ButtonComponent,
    CardComponent,
    DatePipe,
    IconComponent,
    InputComponent,
    ModalComponent,
    ReactiveFormsModule,
    TranslatePipe,
  ],
  templateUrl: './global-question-groups-page.component.html',
  styleUrl: './global-question-groups-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GlobalQuestionGroupsPageComponent implements OnInit {
  readonly globalQuestionGroupsStore = inject(GlobalQuestionGroupsStore);
  private readonly authStore = inject(AuthStore);
  private readonly formBuilder = inject(FormBuilder);
  private readonly i18n = inject(I18nService);

  readonly chevronLeftIcon = ChevronLeft;
  readonly chevronRightIcon = ChevronRight;
  readonly deleteIcon = Trash2;
  readonly editIcon = Pencil;
  readonly groupIcon = ClipboardList;
  readonly plusIcon = Plus;
  readonly restoreIcon = RotateCcw;
  readonly searchIcon = Search;
  readonly filterIcon = SlidersHorizontal;

  readonly advancedFiltersOpen = signal(true);

  readonly createModalOpen = signal(false);
  readonly deleteModalOpen = signal(false);
  readonly editModalOpen = signal(false);
  readonly groupPendingDelete = signal<GlobalQuestionGroupListItem | null>(null);
  readonly selectedGroup = signal<GlobalQuestionGroupListItem | null>(null);

  readonly canCreate = computed(() => this.authStore.canManageGlobalQuestionGroups('Create'));

  readonly searchForm = this.formBuilder.nonNullable.group({
    searchText: [''],
    isActive: [''],
    pageSize: ['10'],
    orderSort: [''],
  });

  readonly groupForm = this.formBuilder.nonNullable.group({
    nameEn: ['', [Validators.required, Validators.maxLength(200)]],
    nameAr: ['', [Validators.maxLength(200)]],
  });

  readonly editGroupForm = this.formBuilder.nonNullable.group({
    nameEn: ['', [Validators.required, Validators.maxLength(200)]],
    nameAr: ['', [Validators.maxLength(200)]],
  });

  toggleAdvancedFilters(): void {
    this.advancedFiltersOpen.update((open) => !open);
  }

  ngOnInit(): void {
    this.globalQuestionGroupsStore.load();
  }

  searchGroups(): void {
    const formValue = this.searchForm.getRawValue();
    this.globalQuestionGroupsStore.search(
      formValue.searchText,
      this.toIsActiveFilter(formValue.isActive),
      this.toPageSize(formValue.pageSize),
      formValue.orderSort,
    );
  }

  clearGroupSearch(): void {
    this.searchForm.setValue({
      searchText: '',
      isActive: '',
      pageSize: '10',
      orderSort: '',
    });
    this.globalQuestionGroupsStore.search('', null, 10, '');
  }

  goToPreviousGroupsPage(): void {
    this.globalQuestionGroupsStore.previousPage();
  }

  goToNextGroupsPage(): void {
    this.globalQuestionGroupsStore.nextPage();
  }

  openCreateGroup(): void {
    if (!this.canCreate()) {
      return;
    }

    this.globalQuestionGroupsStore.clearMessages();
    this.createModalOpen.set(true);
  }

  closeCreateGroup(): void {
    this.groupForm.reset();
    this.createModalOpen.set(false);
  }

  createGroup(): void {
    this.groupForm.markAllAsTouched();
    if (this.groupForm.invalid || this.globalQuestionGroupsStore.creating() || !this.canCreate()) {
      return;
    }

    this.globalQuestionGroupsStore.createGroup(this.toPayload(this.groupForm.getRawValue()), () => {
      this.closeCreateGroup();
    });
  }

  openEditGroup(event: MouseEvent, group: GlobalQuestionGroupListItem): void {
    event.stopPropagation();
    if (!this.canEditGroup(group)) {
      return;
    }

    this.globalQuestionGroupsStore.clearMessages();
    this.selectedGroup.set(group);
    this.editGroupForm.setValue({
      nameEn: group.nameEn,
      nameAr: group.nameAr ?? '',
    });
    this.editModalOpen.set(true);
  }

  closeEditGroup(): void {
    this.editGroupForm.reset();
    this.selectedGroup.set(null);
    this.editModalOpen.set(false);
  }

  updateSelectedGroup(): void {
    const group = this.selectedGroup();
    this.editGroupForm.markAllAsTouched();

    if (
      !group ||
      this.editGroupForm.invalid ||
      this.globalQuestionGroupsStore.updating() ||
      !this.canEditGroup(group)
    ) {
      return;
    }

    this.globalQuestionGroupsStore.updateGroup(
      group.groupId,
      this.toPayload(this.editGroupForm.getRawValue()),
      () => {
        this.closeEditGroup();
      },
    );
  }

  canEditGroup(group: GlobalQuestionGroupListItem): boolean {
    return group.isEditable && this.authStore.canManageGlobalQuestionGroups('Update');
  }

  openDeleteGroup(event: MouseEvent, group: GlobalQuestionGroupListItem): void {
    event.stopPropagation();
    if (!this.canDeleteGroup(group)) {
      return;
    }

    this.globalQuestionGroupsStore.clearMessages();
    this.groupPendingDelete.set(group);
    this.deleteModalOpen.set(true);
  }

  closeDeleteGroup(): void {
    this.groupPendingDelete.set(null);
    this.deleteModalOpen.set(false);
  }

  deleteSelectedGroup(): void {
    const group = this.groupPendingDelete();
    if (!group || this.globalQuestionGroupsStore.deleting() || !this.canDeleteGroup(group)) {
      return;
    }

    this.globalQuestionGroupsStore.deleteGroup(group.groupId, () => {
      this.closeDeleteGroup();
    });
  }

  canDeleteGroup(group: GlobalQuestionGroupListItem): boolean {
    return group.isEditable && group.isActive && this.authStore.canManageGlobalQuestionGroups('Delete');
  }

  restoreGroup(event: MouseEvent, group: GlobalQuestionGroupListItem): void {
    event.stopPropagation();
    if (!this.canRestoreGroup(group) || this.globalQuestionGroupsStore.restoring()) {
      return;
    }

    this.globalQuestionGroupsStore.clearMessages();
    this.globalQuestionGroupsStore.restoreGroup(group.groupId, () => undefined);
  }

  canRestoreGroup(group: GlobalQuestionGroupListItem): boolean {
    return group.isEditable && !group.isActive && this.authStore.canManageGlobalQuestionGroups('Restore');
  }

  groupFieldError(field: keyof typeof this.groupForm.controls): string {
    const control = this.groupForm.controls[field];
    return this.fieldError(field, control.touched, control.valid, control.hasError('required'));
  }

  editGroupFieldError(field: keyof typeof this.editGroupForm.controls): string {
    const control = this.editGroupForm.controls[field];
    return this.fieldError(field, control.touched, control.valid, control.hasError('required'));
  }

  groupDisplayName(group: { nameEn: string | null; nameAr?: string | null }): string {
    return this.localizedText(group.nameEn, group.nameAr);
  }

  private localizedText(
    enValue: string | null | undefined,
    arValue: string | null | undefined,
    fallback = '-',
  ): string {
    const englishText = enValue?.trim() ?? '';
    const arabicText = arValue?.trim() ?? '';

    if (this.i18n.language() === 'ar') {
      return arabicText || englishText || fallback;
    }

    return englishText || arabicText || fallback;
  }

  private fieldError(
    field: keyof typeof this.groupForm.controls,
    touched: boolean,
    valid: boolean,
    required: boolean,
  ): string {
    if (!touched || valid) {
      return '';
    }

    if (required) {
      return 'globalQuestionGroups.nameEnRequired';
    }

    return field === 'nameEn'
      ? 'globalQuestionGroups.nameEnMaxLength'
      : 'globalQuestionGroups.nameArMaxLength';
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

  private toPageSize(value: string): number {
    const pageSize = Number(value);
    if (!Number.isFinite(pageSize)) {
      return 10;
    }
    return Math.min(Math.max(pageSize, 1), 100);
  }

  private toPayload(value: { nameEn: string; nameAr: string }): CreateGlobalQuestionGroupRequest {
    const nameAr = value.nameAr.trim();
    return {
      nameEn: value.nameEn.trim(),
      nameAr: nameAr.length > 0 ? nameAr : null,
    };
  }
}

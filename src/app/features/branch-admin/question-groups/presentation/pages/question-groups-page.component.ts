import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Trash2,
} from 'lucide-angular';
import { AuthStore } from '../../../../auth/presentation/state/auth.store';
import { I18nService } from '../../../../../core/services/i18n.service';
import { TranslatePipe } from '../../../../../shared/pipes/translate.pipe';
import { BackButtonComponent } from '../../../../../shared/ui/back-button/back-button.component';
import { ButtonComponent } from '../../../../../shared/ui/button/button.component';
import { CardComponent } from '../../../../../shared/ui/card/card.component';
import { IconComponent } from '../../../../../shared/ui/icon/icon.component';
import { InputComponent } from '../../../../../shared/ui/input/input.component';
import { ModalComponent } from '../../../../../shared/ui/modal/modal.component';
import {
  CreateQuestionGroupRequest,
  QuestionGroupListItem,
} from '../../domain/question-group.model';
import { QuestionGroupsStore } from '../state/question-groups.store';

@Component({
  selector: 'app-question-groups-page',
  standalone: true,
  imports: [
    ButtonComponent,
    BackButtonComponent,
    CardComponent,
    DatePipe,
    IconComponent,
    InputComponent,
    ModalComponent,
    ReactiveFormsModule,
    TranslatePipe,
  ],
  templateUrl: './question-groups-page.component.html',
  styleUrl: './question-groups-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuestionGroupsPageComponent implements OnInit {
  readonly questionGroupsStore = inject(QuestionGroupsStore);
  private readonly authStore = inject(AuthStore);
  private readonly formBuilder = inject(FormBuilder);
  private readonly i18n = inject(I18nService);
  private readonly router = inject(Router);

  readonly chevronLeftIcon = ChevronLeft;
  readonly chevronRightIcon = ChevronRight;
  readonly deleteIcon = Trash2;
  readonly editIcon = Pencil;
  readonly groupIcon = FileText;
  readonly plusIcon = Plus;
  readonly restoreIcon = RotateCcw;
  readonly searchIcon = Search;
  readonly filterIcon = SlidersHorizontal;
  readonly advancedFiltersOpen = signal(true);

  readonly createModalOpen = signal(false);
  readonly editModalOpen = signal(false);
  readonly deleteModalOpen = signal(false);
  readonly selectedGroup = signal<QuestionGroupListItem | null>(null);
  readonly groupPendingDelete = signal<QuestionGroupListItem | null>(null);

  readonly canCreate = computed(() => this.canUseQuestionGroups('QuestionGroups.Create'));
  readonly canUpdate = computed(() => this.canUseQuestionGroups('QuestionGroups.Update'));
  readonly canDelete = computed(() => this.canUseQuestionGroups('QuestionGroups.Delete'));
  readonly canRestore = computed(() => this.canUseQuestionGroups('QuestionGroups.Update'));

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

  ngOnInit(): void {
    this.questionGroupsStore.load();
  }

  toggleAdvancedFilters(): void {
    this.advancedFiltersOpen.update((open) => !open);
  }

  searchGroups(): void {
    const formValue = this.searchForm.getRawValue();
    this.questionGroupsStore.search(
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
    this.questionGroupsStore.search('', null, 10, '');
  }

  goToPreviousGroupsPage(): void {
    this.questionGroupsStore.previousPage();
  }

  goToNextGroupsPage(): void {
    this.questionGroupsStore.nextPage();
  }

  openCreateGroup(): void {
    if (!this.canCreate()) {
      return;
    }

    this.questionGroupsStore.clearMessages();
    this.createModalOpen.set(true);
  }

  closeCreateGroup(): void {
    this.groupForm.reset();
    this.createModalOpen.set(false);
  }

  createGroup(): void {
    this.groupForm.markAllAsTouched();
    if (this.groupForm.invalid || this.questionGroupsStore.creating() || !this.canCreate()) {
      return;
    }

    this.questionGroupsStore.createGroup(this.toPayload(this.groupForm.getRawValue()), () => {
      this.closeCreateGroup();
    });
  }

  openEditGroup(event: MouseEvent, group: QuestionGroupListItem): void {
    event.stopPropagation();
    if (!this.canEditGroup(group)) {
      return;
    }

    this.questionGroupsStore.clearMessages();
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
      this.questionGroupsStore.updating() ||
      !this.canEditGroup(group)
    ) {
      return;
    }

    this.questionGroupsStore.updateGroup(
      group.groupId,
      this.toPayload(this.editGroupForm.getRawValue()),
      () => {
        this.closeEditGroup();
      },
    );
  }

  openDeleteGroup(event: MouseEvent, group: QuestionGroupListItem): void {
    event.stopPropagation();
    if (!this.canDeleteGroup(group)) {
      return;
    }

    this.questionGroupsStore.clearMessages();
    this.groupPendingDelete.set(group);
    this.deleteModalOpen.set(true);
  }

  closeDeleteGroup(): void {
    this.groupPendingDelete.set(null);
    this.deleteModalOpen.set(false);
  }

  deleteSelectedGroup(): void {
    const group = this.groupPendingDelete();
    if (!group || this.questionGroupsStore.deleting() || !this.canDeleteGroup(group)) {
      return;
    }

    this.questionGroupsStore.deleteGroup(group.groupId, () => {
      this.closeDeleteGroup();
    });
  }

  restoreGroup(event: MouseEvent, group: QuestionGroupListItem): void {
    event.stopPropagation();
    if (!this.canRestoreGroup(group) || this.questionGroupsStore.restoring()) {
      return;
    }

    this.questionGroupsStore.restoreGroup(group.groupId, () => undefined);
  }

  openGroupQuestions(group: QuestionGroupListItem): void {
    if (group.groupId.length === 0) {
      return;
    }

    void this.router.navigate(['/branch-admin/question-groups', group.groupId, 'questions']);
  }

  canEditGroup(group: QuestionGroupListItem): boolean {
    return group.isEditable && this.canUpdate();
  }

  canDeleteGroup(group: QuestionGroupListItem): boolean {
    return group.isEditable && group.isActive && this.canDelete();
  }

  canRestoreGroup(group: QuestionGroupListItem): boolean {
    return group.isEditable && !group.isActive && this.canRestore();
  }

  createdByName(group: QuestionGroupListItem): string {
    if (!group.createdBy) {
      return '-';
    }

    if (this.i18n.language() === 'ar') {
      return group.createdBy.nameAr || group.createdBy.nameEn || '-';
    }

    return group.createdBy.nameEn || group.createdBy.nameAr || '-';
  }

  groupFieldError(field: keyof typeof this.groupForm.controls): string {
    const control = this.groupForm.controls[field];
    return this.fieldError(field, control.touched, control.valid, control.hasError('required'));
  }

  editGroupFieldError(field: keyof typeof this.editGroupForm.controls): string {
    const control = this.editGroupForm.controls[field];
    return this.fieldError(field, control.touched, control.valid, control.hasError('required'));
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
      return 'questionGroups.nameEnRequired';
    }

    if (field === 'nameEn') {
      return 'questionGroups.nameEnMaxLength';
    }

    return 'questionGroups.nameArMaxLength';
  }

  private toPayload(value: { nameEn: string; nameAr: string }): CreateQuestionGroupRequest {
    const nameAr = value.nameAr.trim();
    return {
      nameEn: value.nameEn.trim(),
      nameAr: nameAr.length > 0 ? nameAr : null,
    };
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

  private canUseQuestionGroups(permission: string): boolean {
    const action = permission.replace('QuestionGroups.', '') as
      | 'Create'
      | 'Update'
      | 'Delete'
      | 'ViewAll';
    return this.authStore.canManageQuestionGroups(action);
  }
}

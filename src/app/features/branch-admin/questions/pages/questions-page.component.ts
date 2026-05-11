import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ChevronLeft, ChevronRight, HelpCircle, Pencil, Plus, Search, Trash2 } from 'lucide-angular';
import { AuthStore } from '../../../auth/state/auth.store';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { ButtonComponent } from '../../../../shared/ui/button/button.component';
import { CardComponent } from '../../../../shared/ui/card/card.component';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { InputComponent } from '../../../../shared/ui/input/input.component';
import { ModalComponent } from '../../../../shared/ui/modal/modal.component';
import { CreateQuestionRequest, QuestionListItem, QuestionTypeOption } from '../models/question.model';
import { QuestionsStore } from '../state/questions.store';

const QUESTION_TYPE_OPTIONS: readonly QuestionTypeOption[] = [
  { value: 1, label: 'Rating' },
  { value: 2, label: 'Text' },
  { value: 3, label: 'Multiple choice' },
  { value: 4, label: 'Yes / No' },
];

@Component({
  selector: 'app-questions-page',
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
  templateUrl: './questions-page.component.html',
  styleUrl: './questions-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuestionsPageComponent implements OnInit {
  readonly questionsStore = inject(QuestionsStore);
  private readonly authStore = inject(AuthStore);
  private readonly formBuilder = inject(FormBuilder);

  readonly chevronLeftIcon = ChevronLeft;
  readonly chevronRightIcon = ChevronRight;
  readonly deleteIcon = Trash2;
  readonly editIcon = Pencil;
  readonly plusIcon = Plus;
  readonly questionIcon = HelpCircle;
  readonly searchIcon = Search;
  readonly questionTypeOptions = QUESTION_TYPE_OPTIONS;

  readonly createModalOpen = signal(false);
  readonly editModalOpen = signal(false);
  readonly deleteModalOpen = signal(false);
  readonly selectedQuestion = signal<QuestionListItem | null>(null);
  readonly questionPendingDelete = signal<QuestionListItem | null>(null);

  readonly canCreate = computed(() => this.authStore.canManageQuestions('Create'));
  readonly canUpdate = computed(() => this.authStore.canManageQuestions('Update'));
  readonly canDelete = computed(() => this.authStore.canManageQuestions('Delete'));

  readonly searchForm = this.formBuilder.nonNullable.group({
    searchText: [''],
    isActive: [''],
    pageSize: ['10'],
    orderSort: [''],
  });

  readonly questionForm = this.formBuilder.nonNullable.group({
    groupId: ['', [Validators.required]],
    textEn: ['', [Validators.required, Validators.maxLength(500)]],
    textAr: ['', [Validators.maxLength(500)]],
    type: ['1', [Validators.required]],
  });

  readonly editQuestionForm = this.formBuilder.nonNullable.group({
    groupId: ['', [Validators.required]],
    textEn: ['', [Validators.required, Validators.maxLength(500)]],
    textAr: ['', [Validators.maxLength(500)]],
    type: ['1', [Validators.required]],
  });

  ngOnInit(): void {
    this.questionsStore.load();
  }

  openCreateQuestion(): void {
    if (!this.canCreate()) {
      return;
    }

    this.questionsStore.clearMessages();
    this.questionsStore.loadGroupsSelection();
    this.questionForm.reset({
      groupId: '',
      textEn: '',
      textAr: '',
      type: '1',
    });
    this.createModalOpen.set(true);
  }

  closeCreateQuestion(): void {
    this.questionForm.reset({
      groupId: '',
      textEn: '',
      textAr: '',
      type: '1',
    });
    this.createModalOpen.set(false);
  }

  createQuestion(): void {
    this.questionForm.markAllAsTouched();
    if (this.questionForm.invalid || this.questionsStore.creating() || !this.canCreate()) {
      return;
    }

    this.questionsStore.createQuestion(this.toPayload(this.questionForm.getRawValue()), () => {
      this.closeCreateQuestion();
    });
  }

  openEditQuestion(event: MouseEvent, question: QuestionListItem): void {
    event.stopPropagation();
    if (!this.canUpdate()) {
      return;
    }

    this.questionsStore.clearMessages();
    this.questionsStore.loadGroupsSelection();
    this.selectedQuestion.set(question);
    this.editQuestionForm.setValue({
      groupId: question.groupId,
      textEn: question.textEn,
      textAr: question.textAr ?? '',
      type: String(question.type || 1),
    });
    this.editModalOpen.set(true);
  }

  closeEditQuestion(): void {
    this.editQuestionForm.reset({
      groupId: '',
      textEn: '',
      textAr: '',
      type: '1',
    });
    this.selectedQuestion.set(null);
    this.editModalOpen.set(false);
  }

  updateSelectedQuestion(): void {
    const question = this.selectedQuestion();
    this.editQuestionForm.markAllAsTouched();

    if (!question || this.editQuestionForm.invalid || this.questionsStore.updating() || !this.canUpdate()) {
      return;
    }

    this.questionsStore.updateQuestion(question.questionId, this.toPayload(this.editQuestionForm.getRawValue()), () => {
      this.closeEditQuestion();
    });
  }

  openDeleteQuestion(event: MouseEvent, question: QuestionListItem): void {
    event.stopPropagation();
    if (!question.isActive || !this.canDelete()) {
      return;
    }

    this.questionsStore.clearMessages();
    this.questionPendingDelete.set(question);
    this.deleteModalOpen.set(true);
  }

  closeDeleteQuestion(): void {
    this.questionPendingDelete.set(null);
    this.deleteModalOpen.set(false);
  }

  deleteSelectedQuestion(): void {
    const question = this.questionPendingDelete();
    if (!question || this.questionsStore.deleting() || !this.canDelete()) {
      return;
    }

    this.questionsStore.deleteQuestion(question.questionId, () => {
      this.closeDeleteQuestion();
    });
  }

  searchQuestions(): void {
    const formValue = this.searchForm.getRawValue();
    this.questionsStore.search(
      formValue.searchText,
      this.toIsActiveFilter(formValue.isActive),
      this.toPageSize(formValue.pageSize),
      formValue.orderSort,
    );
  }

  clearQuestionSearch(): void {
    this.searchForm.setValue({
      searchText: '',
      isActive: '',
      pageSize: '10',
      orderSort: '',
    });
    this.questionsStore.search('', null, 10, '');
  }

  goToPreviousQuestionsPage(): void {
    this.questionsStore.previousPage();
  }

  goToNextQuestionsPage(): void {
    this.questionsStore.nextPage();
  }

  questionFieldError(field: keyof typeof this.questionForm.controls): string {
    const control = this.questionForm.controls[field];
    return this.fieldError(field, control.touched, control.valid, control.hasError('required'));
  }

  editQuestionFieldError(field: keyof typeof this.editQuestionForm.controls): string {
    const control = this.editQuestionForm.controls[field];
    return this.fieldError(field, control.touched, control.valid, control.hasError('required'));
  }

  private fieldError(
    field: keyof typeof this.questionForm.controls,
    touched: boolean,
    valid: boolean,
    required: boolean,
  ): string {
    if (!touched || valid) {
      return '';
    }

    if (required) {
      if (field === 'groupId') {
        return 'questions.groupRequired';
      }
      if (field === 'type') {
        return 'questions.typeRequired';
      }
      return 'questions.textEnRequired';
    }

    return 'questions.textMaxLength';
  }

  private toPayload(value: { groupId: string; textEn: string; textAr: string; type: string }): CreateQuestionRequest {
    const textAr = value.textAr.trim();
    return {
      groupId: value.groupId,
      textEn: value.textEn.trim(),
      textAr: textAr.length > 0 ? textAr : null,
      type: Number(value.type),
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
}

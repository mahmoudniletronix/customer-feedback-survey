import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ClipboardList, CirclePlus, MessageSquareText, Plus, RefreshCw, SquarePen } from 'lucide-angular';
import { roleGuard } from '../../../../../core/guards/role.guard';
import { I18nService } from '../../../../../core/services/i18n.service';
import { ButtonComponent } from '../../../../../shared/ui/button/button.component';
import { CardComponent } from '../../../../../shared/ui/card/card.component';
import { IconComponent } from '../../../../../shared/ui/icon/icon.component';
import { ModalComponent } from '../../../../../shared/ui/modal/modal.component';
import { TranslatePipe } from '../../../../../shared/pipes/translate.pipe';
import { QuestionListComponent } from '../components/question-list.component';
import { QuestionType } from '../../domain/survey.model';
import { SurveyStore } from '../state/survey.store';

@Component({
  selector: 'app-survey-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonComponent,
    CardComponent,
    IconComponent,
    ModalComponent,
    TranslatePipe,
    QuestionListComponent
  ],
  templateUrl: './survey-page.component.html',
  styleUrl: './survey-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SurveyPageComponent implements OnInit {
  readonly surveyStore = inject(SurveyStore);
  private readonly i18n = inject(I18nService);
  readonly createModalOpen = signal(false);
  readonly questionModalOpen = signal(false);
  readonly questionTypes: readonly QuestionType[] = ['MCQ', 'TEXT'];
  readonly clipboardIcon = ClipboardList;
  readonly circlePlusIcon = CirclePlus;
  readonly messageIcon = MessageSquareText;
  readonly plusIcon = Plus;
  readonly refreshIcon = RefreshCw;
  readonly squarePenIcon = SquarePen;

  private readonly formBuilder = inject(FormBuilder);

  readonly surveyForm = this.formBuilder.nonNullable.group({
    title: ['', Validators.required],
    department: ['', Validators.required],
    assignedBranch: ['', Validators.required]
  });

  readonly questionForm = this.formBuilder.nonNullable.group({
    text: ['', Validators.required],
    type: ['MCQ' as QuestionType, Validators.required],
    options: ['']
  });

  ngOnInit(): void {
    this.surveyStore.load();
  }

  isSelected(surveyId: string): boolean {
    return this.surveyStore.selectedSurvey()?.id === surveyId;
  }

  selectedSurveyTitle(): string {
    return this.surveyStore.selectedSurvey()?.title ?? this.i18n.translate('survey.details');
  }

  selectedSurveySubtitle(): string {
    return this.surveyStore.selectedSurvey()?.department ?? this.i18n.translate('survey.selectSurvey');
  }

  createSurvey(): void {
    this.surveyForm.markAllAsTouched();
    if (this.surveyForm.invalid) {
      return;
    }

    this.surveyStore.createSurvey(this.surveyForm.getRawValue());
    this.surveyForm.reset();
    this.createModalOpen.set(false);
  }

  addQuestion(): void {
    this.questionForm.markAllAsTouched();
    const survey = this.surveyStore.selectedSurvey();
    if (this.questionForm.invalid || !survey) {
      return;
    }

    const value = this.questionForm.getRawValue();
    this.surveyStore.addQuestion({
      surveyId: survey.id,
      text: value.text,
      type: value.type,
      options: value.options
        .split(',')
        .map((option) => option.trim())
        .filter((option) => option.length > 0)
    });
    this.questionForm.reset({ text: '', type: 'MCQ', options: '' });
    this.questionModalOpen.set(false);
  }

  protected readonly roleGuard = roleGuard;
}

import { DatePipe, DecimalPipe, Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CheckCircle2, ClipboardCheck, RotateCcw } from 'lucide-angular';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { AppFooterComponent } from '../../../../shared/ui/app-footer/app-footer.component';
import { PublicAnonymousSubmissionResult } from '../../domain/public-anonymous-template.model';

@Component({
  selector: 'app-public-anonymous-template-success-page',
  standalone: true,
  imports: [DatePipe, DecimalPipe, IconComponent, RouterLink, TranslatePipe, AppFooterComponent],
  templateUrl: './public-anonymous-template-success-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicAnonymousTemplateSuccessPageComponent {
  private readonly location = inject(Location);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly checkIcon = CheckCircle2;
  readonly responseIcon = ClipboardCheck;
  readonly restartIcon = RotateCcw;
  readonly anonymousTemplateId = this.route.snapshot.paramMap.get('anonymousTemplateId') ?? '';
  readonly responseId = this.route.snapshot.queryParamMap.get('responseId') ?? '';
  readonly submission = signal<PublicAnonymousSubmissionResult | null>(this.readSubmission());

  goBack(): void {
    this.location.back();
  }

  private readSubmission(): PublicAnonymousSubmissionResult | null {
    const currentNavigationState = this.router.getCurrentNavigation()?.extras.state;
    const locationState = this.location.getState();
    const submission = this.readStateSubmission(currentNavigationState) ??
      this.readStateSubmission(locationState);

    return submission;
  }

  private readStateSubmission(value: unknown): PublicAnonymousSubmissionResult | null {
    if (!this.isRecord(value)) {
      return null;
    }

    const submission = value['submission'];
    if (!this.isRecord(submission)) {
      return null;
    }

    return {
      anonymousSurveyResponseId: this.readString(submission['anonymousSurveyResponseId']),
      anonymousTemplateId:
        this.readString(submission['anonymousTemplateId']) || this.anonymousTemplateId,
      submittedOnUtc: this.readString(submission['submittedOnUtc']),
      actualScore: this.readNullableNumber(submission['actualScore']),
      maxScore: this.readNullableNumber(submission['maxScore']),
      scorePercentage: this.readNullableNumber(submission['scorePercentage']),
      visibleQuestionsCount: this.readNumber(submission['visibleQuestionsCount']),
      answersCount: this.readNumber(submission['answersCount']),
      customInputValuesCount: this.readNumber(submission['customInputValuesCount']),
    };
  }

  private readString(value: unknown): string {
    return typeof value === 'string' || typeof value === 'number' ? String(value) : '';
  }

  private readNumber(value: unknown): number {
    return typeof value === 'number' && Number.isFinite(value) ? value : 0;
  }

  private readNullableNumber(value: unknown): number | null {
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }
}

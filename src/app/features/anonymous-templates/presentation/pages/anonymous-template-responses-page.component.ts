import { DatePipe, DecimalPipe, Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  Search,
} from 'lucide-angular';
import { AuthStore } from '../../../auth/presentation/state/auth.store';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { ButtonComponent } from '../../../../shared/ui/button/button.component';
import { CardComponent } from '../../../../shared/ui/card/card.component';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { ActivatedRoute } from '@angular/router';
import { AnonymousTemplatesStore } from '../state/anonymous-templates.store';

@Component({
  selector: 'app-anonymous-template-responses-page',
  standalone: true,
  imports: [
    ButtonComponent,
    CardComponent,
    DatePipe,
    DecimalPipe,
    IconComponent,
    ReactiveFormsModule,
    RouterLink,
    TranslatePipe,
  ],
  templateUrl: './anonymous-template-responses-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnonymousTemplateResponsesPageComponent implements OnInit {
  readonly anonymousTemplatesStore = inject(AnonymousTemplatesStore);
  private readonly authStore = inject(AuthStore);
  private readonly formBuilder = inject(FormBuilder);
  private readonly location = inject(Location);
  private readonly route = inject(ActivatedRoute);

  readonly arrowLeftIcon = ArrowLeft;
  readonly chevronLeftIcon = ChevronLeft;
  readonly chevronRightIcon = ChevronRight;
  readonly detailsIcon = Eye;
  readonly fileTextIcon = FileText;
  readonly searchIcon = Search;

  readonly anonymousTemplateId = this.route.snapshot.paramMap.get('anonymousTemplateId') ?? '';
  readonly canViewResponses = computed(() =>
    this.authStore.canManageAnonymousTemplates('ViewResponses'),
  );

  readonly filtersForm = this.formBuilder.nonNullable.group({
    fromDate: [''],
    toDate: [''],
    minScorePercentage: [''],
    maxScorePercentage: [''],
    pageSize: ['10'],
    orderSort: [''],
  });

  ngOnInit(): void {
    if (this.anonymousTemplateId.length === 0 || !this.canViewResponses()) {
      return;
    }

    this.anonymousTemplatesStore.loadDetails(this.anonymousTemplateId);
    this.anonymousTemplatesStore.loadResponses(this.anonymousTemplateId);
  }

  goBack(): void {
    this.location.back();
  }

  applyFilters(): void {
    if (this.anonymousTemplateId.length === 0 || !this.canViewResponses()) {
      return;
    }

    const value = this.filtersForm.getRawValue();
    this.anonymousTemplatesStore.searchResponses(
      this.anonymousTemplateId,
      this.toPageSize(value.pageSize),
      value.orderSort,
      this.toStartOfDayUtc(value.fromDate),
      this.toEndOfDayUtc(value.toDate),
      this.toScoreFilter(value.minScorePercentage),
      this.toScoreFilter(value.maxScorePercentage),
    );
  }

  clearFilters(): void {
    this.filtersForm.setValue({
      fromDate: '',
      toDate: '',
      minScorePercentage: '',
      maxScorePercentage: '',
      pageSize: '10',
      orderSort: '',
    });

    if (this.anonymousTemplateId.length > 0 && this.canViewResponses()) {
      this.anonymousTemplatesStore.searchResponses(
        this.anonymousTemplateId,
        10,
        '',
        null,
        null,
        null,
        null,
      );
    }
  }

  previousPage(): void {
    this.anonymousTemplatesStore.previousResponsesPage(this.anonymousTemplateId);
  }

  nextPage(): void {
    this.anonymousTemplatesStore.nextResponsesPage(this.anonymousTemplateId);
  }

  private toPageSize(value: string): number {
    const pageSize = Number(value);
    if (!Number.isFinite(pageSize)) {
      return 10;
    }

    return Math.min(Math.max(pageSize, 1), 100);
  }

  private toScoreFilter(value: string): number | null {
    if (value.trim().length === 0) {
      return null;
    }

    const score = Number(value);
    return Number.isFinite(score) ? Math.min(Math.max(score, 0), 100) : null;
  }

  private toStartOfDayUtc(value: string): string | null {
    if (!value) {
      return null;
    }

    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }

  private toEndOfDayUtc(value: string): string | null {
    if (!value) {
      return null;
    }

    const date = new Date(`${value}T23:59:59.999`);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }
}

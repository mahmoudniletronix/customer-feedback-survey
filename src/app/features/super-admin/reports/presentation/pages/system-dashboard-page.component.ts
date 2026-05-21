import { DatePipe, DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  Search,
  SlidersHorizontal,
  Building2,
  Users,
  FileText,
  BarChart3,
  AlertTriangle,
  Mic,
  TrendingUp,
} from 'lucide-angular';
import { I18nService } from '../../../../../core/services/i18n.service';
import { TranslatePipe } from '../../../../../shared/pipes/translate.pipe';
import { ButtonComponent } from '../../../../../shared/ui/button/button.component';
import { IconComponent } from '../../../../../shared/ui/icon/icon.component';
import {
  ReportBranchOption,
  ReportDepartmentOption,
  SystemBranchPerformance,
  SystemCriticalResponse,
  SystemDashboardResponse,
  SystemReportsGroupBy,
  SystemReportsRiskLevel,
  SystemTemplatePerformance,
} from '../../domain/system-reports.model';
import { SystemResponseDetailsModalComponent } from '../components/system-response-details-modal.component';
import { SystemReportsStore } from '../state/system-reports.store';

@Component({
  selector: 'app-system-dashboard-page',
  standalone: true,
  imports: [
    ButtonComponent,
    DatePipe,
    DecimalPipe,
    IconComponent,
    ReactiveFormsModule,
    RouterLink,
    SystemResponseDetailsModalComponent,
    TranslatePipe,
  ],
  templateUrl: './system-dashboard-page.component.html',
  styleUrl: './system-dashboard-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SystemDashboardPageComponent implements OnInit {
  readonly store = inject(SystemReportsStore);
  private readonly formBuilder = inject(FormBuilder);
  private readonly i18n = inject(I18nService);

  readonly searchIcon = Search;
  readonly filtersIcon = SlidersHorizontal;
  readonly buildingIcon = Building2;
  readonly usersIcon = Users;
  readonly fileTextIcon = FileText;
  readonly barChartIcon = BarChart3;
  readonly alertTriangleIcon = AlertTriangle;
  readonly micIcon = Mic;
  readonly trendingUpIcon = TrendingUp;

  readonly advancedFiltersOpen = signal(true);

  readonly filtersForm = this.formBuilder.nonNullable.group({
    from: [''],
    to: [''],
    branchId: [''],
    departmentId: [''],
    groupBy: ['Day' as SystemReportsGroupBy],
  });

  readonly branchMetrics = computed(() => {
    const summary = this.store.dashboard()?.summary;
    if (!summary) return null;
    return {
      total: summary.totalBranches,
      active: summary.activeBranches,
      inactive: summary.inactiveBranches,
      activePercentage:
        summary.totalBranches > 0
          ? Math.round((summary.activeBranches / summary.totalBranches) * 100)
          : 0,
    };
  });

  readonly orgMetrics = computed(() => {
    const summary = this.store.dashboard()?.summary;
    if (!summary) return null;
    return {
      departments: summary.totalDepartments,
      activeDepartments: summary.activeDepartments,
      operators: summary.totalOperators,
    };
  });

  readonly templateMetrics = computed(() => {
    const summary = this.store.dashboard()?.summary;
    if (!summary) return null;
    return {
      total: summary.totalTemplates,
      active: summary.activeTemplates,
      activePercentage:
        summary.totalTemplates > 0
          ? Math.round((summary.activeTemplates / summary.totalTemplates) * 100)
          : 0,
    };
  });

  readonly responseMetrics = computed(() => {
    const summary = this.store.dashboard()?.summary;
    if (!summary) return null;
    return {
      total: summary.totalResponses,
      averageScore: summary.averageScorePercentage,
      complaints: summary.complaintsCount,
      voice: summary.voiceAnswersCount,
    };
  });

  ngOnInit(): void {
    this.store.loadOptions();
    this.store.loadDashboard();
  }

  toggleAdvancedFilters(): void {
    this.advancedFiltersOpen.update((open) => !open);
  }

  applyFilters(): void {
    const value = this.filtersForm.getRawValue();
    this.store.loadDashboard({
      from: value.from || undefined,
      to: value.to || undefined,
      branchId: value.branchId || undefined,
      departmentId: value.departmentId || undefined,
      groupBy: value.groupBy,
      criticalScoreThreshold: 40,
      criticalResponsesCount: 10,
      topTemplatesCount: 10,
    });
  }

  clearFilters(): void {
    this.filtersForm.setValue({
      from: '',
      to: '',
      branchId: '',
      departmentId: '',
      groupBy: 'Day',
    });
    this.store.loadDashboard();
  }

  openDetails(response: SystemCriticalResponse): void {
    this.store.loadDetails(response.surveyResponseId);
  }

  localized(englishText: string, arabicText: string | null | undefined): string {
    if (this.i18n.language() === 'ar') return arabicText || englishText || '-';
    return englishText || arabicText || '-';
  }

  branchOptionName(branch: ReportBranchOption): string {
    const name = this.localized(branch.nameEn, branch.nameAr);
    return branch.code ? `${name} (${branch.code})` : name;
  }

  departmentOptionName(department: ReportDepartmentOption): string {
    return this.localized(department.nameEn, department.nameAr);
  }

  branchName(
    item: SystemBranchPerformance | SystemCriticalResponse | SystemTemplatePerformance,
  ): string {
    return this.localized(item.branchNameEn, item.branchNameAr);
  }

  riskLabel(riskLevel: SystemReportsRiskLevel): string {
    if (riskLevel === 'HighRisk') return this.i18n.translate('systemDashboard.highRisk');
    if (riskLevel === 'MediumRisk') return this.i18n.translate('systemDashboard.mediumRisk');
    return this.i18n.translate('systemDashboard.healthy');
  }

}

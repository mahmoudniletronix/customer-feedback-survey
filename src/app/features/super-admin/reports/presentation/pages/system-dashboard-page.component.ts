import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Search } from 'lucide-angular';
import { I18nService } from '../../../../../core/services/i18n.service';
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
  ],
  templateUrl: './system-dashboard-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SystemDashboardPageComponent implements OnInit {
  readonly store = inject(SystemReportsStore);
  private readonly formBuilder = inject(FormBuilder);
  private readonly i18n = inject(I18nService);

  readonly searchIcon = Search;

  readonly filtersForm = this.formBuilder.nonNullable.group({
    from: [''],
    to: [''],
    branchId: [''],
    departmentId: [''],
    groupBy: ['Day' as SystemReportsGroupBy],
  });

  ngOnInit(): void {
    this.store.loadOptions();
    this.store.loadDashboard();
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

  branchName(item: SystemBranchPerformance | SystemCriticalResponse | SystemTemplatePerformance): string {
    return this.localized(item.branchNameEn, item.branchNameAr);
  }

  riskLabel(riskLevel: SystemReportsRiskLevel): string {
    if (riskLevel === 'HighRisk') return 'High Risk';
    if (riskLevel === 'MediumRisk') return 'Medium Risk';
    return 'Healthy';
  }

  barWidth(value: number): string {
    return `${Math.min(Math.max(value, 0), 100)}%`;
  }

  summaryMetrics(dashboard: SystemDashboardResponse): readonly { label: string; value: string | number }[] {
    const summary = dashboard.summary;
    return [
      { label: 'Total Branches', value: summary.totalBranches },
      { label: 'Active Branches', value: summary.activeBranches },
      { label: 'Inactive Branches', value: summary.inactiveBranches },
      { label: 'Departments', value: summary.totalDepartments },
      { label: 'Active Departments', value: summary.activeDepartments },
      { label: 'Operators', value: summary.totalOperators },
      { label: 'Templates', value: summary.totalTemplates },
      { label: 'Active Templates', value: summary.activeTemplates },
      { label: 'Responses', value: summary.totalResponses },
      { label: 'Avg Satisfaction', value: `${summary.averageScorePercentage.toFixed(1)}%` },
      { label: 'Complaints', value: summary.complaintsCount },
      { label: 'Voice Answers', value: summary.voiceAnswersCount },
    ];
  }
}

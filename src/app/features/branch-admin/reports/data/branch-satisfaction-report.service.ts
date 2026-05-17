import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import {
  BranchSatisfactionReport,
  BranchSatisfactionReportApiResponse,
  BranchSatisfactionReportQuery,
  SatisfactionComplaints,
  SatisfactionDistributionItem,
  SatisfactionOverall,
  SatisfactionReportPeriod,
  SatisfactionTrendItem,
  SatisfactionByTemplateItem,
} from '../domain/branch-satisfaction-report.model';

@Injectable()
export class BranchSatisfactionReportService {
  private readonly http = inject(HttpClient);
  private readonly reportUrl = `${environment.apiBaseUrl}/api/reports/branch/satisfaction`;

  getReport(query: BranchSatisfactionReportQuery): Observable<BranchSatisfactionReport> {
    let params = new HttpParams();

    if (query.templateId) {
      params = params.set('templateId', query.templateId);
    }
    if (query.from) {
      params = params.set('from', query.from);
    }
    if (query.to) {
      params = params.set('to', query.to);
    }

    return this.http
      .get<BranchSatisfactionReportApiResponse>(this.reportUrl, { params })
      .pipe(map((response) => this.toReport(response)));
  }

  private toReport(response: BranchSatisfactionReportApiResponse): BranchSatisfactionReport {
    return {
      period: this.toPeriod(response.period),
      overall: this.toOverall(response.overall),
      distribution: (response.distribution ?? []).map((item) => this.toDistributionItem(item)),
      byTemplate: (response.byTemplate ?? []).map((item) => this.toByTemplateItem(item)),
      trend: (response.trend ?? []).map((item) => this.toTrendItem(item)),
      complaints: this.toComplaints(response.complaints),
    };
  }

  private toPeriod(period: Partial<SatisfactionReportPeriod> | undefined): SatisfactionReportPeriod {
    return {
      from: period?.from ?? '',
      to: period?.to ?? '',
      isDefaultPeriod: period?.isDefaultPeriod ?? false,
      periodSource: period?.periodSource ?? '',
    };
  }

  private toOverall(overall: Partial<SatisfactionOverall> | undefined): SatisfactionOverall {
    return {
      score: overall?.score ?? 0,
      totalResponses: overall?.totalResponses ?? 0,
      scoredResponses: overall?.scoredResponses ?? 0,
      unscoredResponses: overall?.unscoredResponses ?? 0,
      totalScoredAnswers: overall?.totalScoredAnswers ?? 0,
      satisfiedResponses: overall?.satisfiedResponses ?? 0,
      neutralResponses: overall?.neutralResponses ?? 0,
      unsatisfiedResponses: overall?.unsatisfiedResponses ?? 0,
      complaintsCount: overall?.complaintsCount ?? 0,
      voiceAnswersCount: overall?.voiceAnswersCount ?? 0,
    };
  }

  private toDistributionItem(
    item: Partial<SatisfactionDistributionItem>,
  ): SatisfactionDistributionItem {
    return {
      value: item.value ?? 0,
      labelEn: item.labelEn ?? '',
      labelAr: item.labelAr ?? '',
      count: item.count ?? 0,
      percentage: item.percentage ?? 0,
    };
  }

  private toByTemplateItem(item: Partial<SatisfactionByTemplateItem>): SatisfactionByTemplateItem {
    return {
      templateId: item.templateId ?? '',
      templateNameEn: item.templateNameEn ?? '',
      templateNameAr: item.templateNameAr ?? null,
      score: item.score ?? 0,
      responsesCount: item.responsesCount ?? 0,
      scoredAnswersCount: item.scoredAnswersCount ?? 0,
    };
  }

  private toTrendItem(item: Partial<SatisfactionTrendItem>): SatisfactionTrendItem {
    return {
      date: item.date ?? '',
      score: item.score ?? 0,
      responsesCount: item.responsesCount ?? 0,
    };
  }

  private toComplaints(
    complaints: Partial<SatisfactionComplaints> | undefined,
  ): SatisfactionComplaints {
    return {
      count: complaints?.count ?? 0,
      percentageOfResponses: complaints?.percentageOfResponses ?? 0,
    };
  }
}

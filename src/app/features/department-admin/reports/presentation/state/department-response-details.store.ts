import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { finalize, take } from 'rxjs';
import { DepartmentReportsService } from '../../data/department-reports.service';
import { DepartmentResponseDetails } from '../../domain/department-reports.model';

@Injectable()
export class DepartmentResponseDetailsStore {
  private readonly reportsService = inject(DepartmentReportsService);
  private readonly router = inject(Router);

  private readonly detailsSignal = signal<DepartmentResponseDetails | null>(null);
  private readonly loadingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);

  readonly details = this.detailsSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  load(operatorId: string, surveyResponseId: string): void {
    if (!operatorId || !surveyResponseId) {
      this.errorSignal.set('departmentResponseDetails.requiredIds');
      return;
    }

    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.detailsSignal.set(null);

    this.reportsService
      .getResponseDetails(operatorId, surveyResponseId)
      .pipe(
        take(1),
        finalize(() => this.loadingSignal.set(false)),
      )
      .subscribe({
        next: (details) => this.detailsSignal.set(details),
        error: (error: unknown) => this.handleError(error),
      });
  }

  private handleError(error: unknown): void {
    if (!(error instanceof HttpErrorResponse)) {
      this.errorSignal.set('departmentResponseDetails.unavailable');
      return;
    }

    if (error.status === 401) {
      void this.router.navigateByUrl('/auth/login', { replaceUrl: true });
      return;
    }
    if (error.status === 403) {
      this.errorSignal.set('departmentResponseDetails.noPermission');
      return;
    }
    if (error.status === 404) {
      this.errorSignal.set('departmentResponseDetails.notFound');
      return;
    }
    if (error.status === 400 || error.status === 422) {
      this.errorSignal.set('departmentResponseDetails.invalidRequest');
      return;
    }

    this.errorSignal.set('departmentResponseDetails.unavailable');
  }
}

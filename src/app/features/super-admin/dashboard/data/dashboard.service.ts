import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { Role } from '../../../../shared/models/role.model';
import { Kpi, TrendPoint } from '../domain/dashboard.model';

@Injectable()
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly dashboardUrl = `${environment.apiBaseUrl}/api/dashboard`;

  getKpis(role: Role): Observable<readonly Kpi[]> {
    return this.http.get<readonly Kpi[]>(`${this.dashboardUrl}/kpis`, {
      params: this.roleParams(role)
    });
  }

  getTrend(role: Role): Observable<readonly TrendPoint[]> {
    return this.http.get<readonly TrendPoint[]>(`${this.dashboardUrl}/trend`, {
      params: this.roleParams(role)
    });
  }

  private roleParams(role: Role): HttpParams {
    return new HttpParams().set('role', role);
  }
}

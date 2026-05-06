import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CreateQuestionPayload, CreateSurveyPayload, Question, Survey } from '../models/survey.model';

@Injectable()
export class SurveyService {
  private readonly http = inject(HttpClient);
  private readonly surveysUrl = `${environment.apiBaseUrl}/api/surveys`;

  list(): Observable<readonly Survey[]> {
    return this.http.get<readonly Survey[]>(this.surveysUrl);
  }

  create(payload: CreateSurveyPayload): Observable<Survey> {
    return this.http.post<Survey>(this.surveysUrl, payload);
  }

  addQuestion(payload: CreateQuestionPayload): Observable<Question> {
    return this.http.post<Question>(`${this.surveysUrl}/${payload.surveyId}/questions`, {
      text: payload.text,
      type: payload.type,
      options: payload.options
    });
  }

  toggleStatus(surveyId: string): Observable<Survey | null> {
    return this.http.patch<Survey | null>(`${this.surveysUrl}/${surveyId}/toggle-status`, {});
  }
}

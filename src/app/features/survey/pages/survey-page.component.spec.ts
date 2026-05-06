import { provideHttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SurveyService } from '../services/survey.service';
import { SurveyStore } from '../state/survey.store';
import { SurveyPageComponent } from './survey-page.component';

describe('SurveyPageComponent', () => {
  let fixture: ComponentFixture<SurveyPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SurveyPageComponent],
      providers: [provideHttpClient(), SurveyService, SurveyStore]
    }).compileComponents();

    fixture = TestBed.createComponent(SurveyPageComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReportCardComponent } from './report-card.component';

describe('ReportCardComponent', () => {
  let fixture: ComponentFixture<ReportCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportCardComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ReportCardComponent);
    fixture.componentRef.setInput('report', {
      id: 'rep-001',
      titleKey: 'reports.globalSatisfaction',
      metric: '87%',
      descriptionKey: 'reports.globalSatisfactionDescription',
      icon: 'satisfaction'
    });
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});

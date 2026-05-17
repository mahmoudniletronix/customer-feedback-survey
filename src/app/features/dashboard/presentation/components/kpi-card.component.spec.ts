import { ComponentFixture, TestBed } from '@angular/core/testing';
import { KpiCardComponent } from './kpi-card.component';

describe('KpiCardComponent', () => {
  let fixture: ComponentFixture<KpiCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KpiCardComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(KpiCardComponent);
    fixture.componentRef.setInput('kpi', {
      labelKey: 'kpi.branches',
      value: '18',
      deltaKey: 'kpi.deltaBranches',
      tone: 'primary',
      icon: 'branches'
    });
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});

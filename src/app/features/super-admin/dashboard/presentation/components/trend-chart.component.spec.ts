import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TrendChartComponent } from './trend-chart.component';

describe('TrendChartComponent', () => {
  let fixture: ComponentFixture<TrendChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrendChartComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(TrendChartComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});

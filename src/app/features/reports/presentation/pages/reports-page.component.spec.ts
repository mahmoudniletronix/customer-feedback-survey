import { provideHttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReportsService } from '../../data/reports.service';
import { ReportsStore } from '../state/reports.store';
import { ReportsPageComponent } from './reports-page.component';

describe('ReportsPageComponent', () => {
  let fixture: ComponentFixture<ReportsPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportsPageComponent],
      providers: [provideHttpClient(), ReportsService, ReportsStore]
    }).compileComponents();

    fixture = TestBed.createComponent(ReportsPageComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});

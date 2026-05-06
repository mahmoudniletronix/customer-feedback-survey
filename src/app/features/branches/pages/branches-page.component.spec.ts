import { provideHttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BranchesService } from '../services/branches.service';
import { BranchesStore } from '../state/branches.store';
import { BranchesPageComponent } from './branches-page.component';

describe('BranchesPageComponent', () => {
  let fixture: ComponentFixture<BranchesPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BranchesPageComponent],
      providers: [provideHttpClient(), BranchesService, BranchesStore]
    }).compileComponents();

    fixture = TestBed.createComponent(BranchesPageComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});

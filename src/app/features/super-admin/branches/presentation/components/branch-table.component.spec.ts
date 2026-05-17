import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BranchTableComponent } from './branch-table.component';

describe('BranchTableComponent', () => {
  let fixture: ComponentFixture<BranchTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BranchTableComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(BranchTableComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});

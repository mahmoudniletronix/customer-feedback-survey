import { ComponentFixture, TestBed } from '@angular/core/testing';
import { QuestionListComponent } from './question-list.component';

describe('QuestionListComponent', () => {
  let fixture: ComponentFixture<QuestionListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuestionListComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(QuestionListComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});

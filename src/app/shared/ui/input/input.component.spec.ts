import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InputComponent } from './input.component';

describe('InputComponent', () => {
  let fixture: ComponentFixture<InputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InputComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(InputComponent);
    fixture.componentRef.setInput('label', 'Email');
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should show a password visibility toggle for password fields', () => {
    fixture.componentRef.setInput('type', 'password');
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    const toggle = fixture.nativeElement.querySelector('button') as HTMLButtonElement;

    expect(input.type).toBe('password');
    expect(toggle).toBeTruthy();

    toggle.click();
    fixture.detectChanges();

    expect(input.type).toBe('text');
  });

  it('should not show a password visibility toggle for text fields', () => {
    fixture.componentRef.setInput('type', 'text');
    fixture.detectChanges();

    const toggle = fixture.nativeElement.querySelector('button') as HTMLButtonElement | null;

    expect(toggle).toBeNull();
  });
});

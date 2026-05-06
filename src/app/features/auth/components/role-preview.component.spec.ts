import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RolePreviewComponent } from './role-preview.component';

describe('RolePreviewComponent', () => {
  let fixture: ComponentFixture<RolePreviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RolePreviewComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(RolePreviewComponent);
    fixture.componentRef.setInput('role', 'SUPER_ADMIN');
    fixture.componentRef.setInput('description', 'Role description');
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});

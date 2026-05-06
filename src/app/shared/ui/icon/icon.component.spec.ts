import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Plus } from 'lucide-angular';
import { IconComponent } from './icon.component';

describe('IconComponent', () => {
  let fixture: ComponentFixture<IconComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IconComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(IconComponent);
    fixture.componentRef.setInput('icon', Plus);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});

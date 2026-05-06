import { provideHttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UsersService } from '../services/users.service';
import { UsersStore } from '../state/users.store';
import { UsersPageComponent } from './users-page.component';

describe('UsersPageComponent', () => {
  let fixture: ComponentFixture<UsersPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UsersPageComponent],
      providers: [provideHttpClient(), UsersService, UsersStore]
    }).compileComponents();

    fixture = TestBed.createComponent(UsersPageComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});

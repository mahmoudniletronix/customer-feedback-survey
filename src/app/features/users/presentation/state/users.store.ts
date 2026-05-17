import { Injectable, inject, signal } from '@angular/core';
import { take } from 'rxjs';
import { ManagedUser } from '../../domain/user-management.model';
import { UsersService } from '../../data/users.service';

@Injectable()
export class UsersStore {
  private readonly usersService = inject(UsersService);
  private readonly usersSignal = signal<readonly ManagedUser[]>([]);
  private readonly errorSignal = signal<string | null>(null);

  readonly users = this.usersSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  load(): void {
    this.errorSignal.set(null);
    this.usersService
      .list()
      .pipe(take(1))
      .subscribe({
        next: (users) => this.usersSignal.set(users),
        error: () => {
          this.usersSignal.set([]);
          this.errorSignal.set('users.loadError');
        }
      });
  }
}

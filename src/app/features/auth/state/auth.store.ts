import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { finalize, take } from 'rxjs';
import { TokenStorageService } from '../../../core/services/token-storage.service';
import { AuthSession, Role, User } from '../../../shared/models/role.model';
import { LoginCredentials } from '../models/auth.model';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly authService = inject(AuthService);
  private readonly tokenStorage = inject(TokenStorageService);
  private readonly router = inject(Router);

  private readonly sessionSignal = signal<AuthSession | null>(null);
  private readonly loadingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);

  readonly session = this.sessionSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly user = computed<User | null>(() => this.sessionSignal()?.user ?? null);
  readonly token = computed<string | null>(() => this.sessionSignal()?.token ?? null);
  readonly role = computed<Role | null>(() => this.user()?.role ?? null);
  readonly userType = computed(() => this.sessionSignal()?.userType ?? null);
  readonly permissions = computed(() => this.sessionSignal()?.permissions ?? []);
  readonly apiRoles = computed(() => this.sessionSignal()?.roles ?? []);
  readonly isAuthenticated = computed(() => this.token() !== null);

  constructor() {
    this.sessionSignal.set(this.tokenStorage.getSession());

    effect(() => {
      const session = this.sessionSignal();
      if (session) {
        this.tokenStorage.setSession(session);
      } else {
        this.tokenStorage.clear();
      }
    });
  }

  login(credentials: LoginCredentials): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.authService
      .login(credentials)
      .pipe(
        take(1),
        finalize(() => this.loadingSignal.set(false))
      )
      .subscribe({
        next: (session) => {
          this.sessionSignal.set(session);
          void this.router.navigateByUrl(this.redirectPath());
        },
        error: (error: Error) => {
          this.errorSignal.set(error.message);
        }
      });
  }

  logout(): void {
    this.sessionSignal.set(null);
    void this.router.navigateByUrl('/auth/login');
  }

  redirectPath(): string {
    const role = this.role();
    if (role === 'BRANCH_ADMIN') {
      return '/branch-admin';
    }
    if (role === 'DEPARTMENT_ADMIN') {
      return '/survey';
    }
    return '/dashboard';
  }
}

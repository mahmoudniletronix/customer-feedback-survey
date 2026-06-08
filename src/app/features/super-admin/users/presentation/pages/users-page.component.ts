import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { UsersRound } from 'lucide-angular';
import { CardComponent } from '../../../../../shared/ui/card/card.component';
import { IconComponent } from '../../../../../shared/ui/icon/icon.component';
import { TranslatePipe } from '../../../../../shared/pipes/translate.pipe';
import {
  ResetPasswordModalComponent,
  ResetPasswordModalValue,
} from '../../../../../shared/ui/reset-password-modal/reset-password-modal.component';
import { ManagedUser } from '../../domain/user-management.model';
import { UserTableComponent } from '../components/user-table.component';
import { UsersStore } from '../state/users.store';

@Component({
  selector: 'app-users-page',
  standalone: true,
  imports: [
    CardComponent,
    IconComponent,
    ResetPasswordModalComponent,
    TranslatePipe,
    UserTableComponent,
  ],
  templateUrl: './users-page.component.html',
  styleUrl: './users-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UsersPageComponent implements OnInit {
  readonly usersStore = inject(UsersStore);
  readonly usersIcon = UsersRound;
  readonly resetPasswordModalOpen = signal(false);
  readonly selectedUser = signal<ManagedUser | null>(null);
  readonly selectedUserLabel = computed(() => {
    const user = this.selectedUser();
    return user ? `${user.name} - ${user.id}` : '';
  });

  ngOnInit(): void {
    this.usersStore.load();
  }

  openResetPassword(user: ManagedUser): void {
    this.usersStore.clearMessages();
    this.selectedUser.set(user);
    this.resetPasswordModalOpen.set(true);
  }

  closeResetPassword(): void {
    this.selectedUser.set(null);
    this.resetPasswordModalOpen.set(false);
  }

  resetPassword(payload: ResetPasswordModalValue): void {
    const user = this.selectedUser();
    if (!user || this.usersStore.resettingPassword()) {
      return;
    }

    this.usersStore.resetPassword(user.id, payload, () => this.closeResetPassword());
  }
}

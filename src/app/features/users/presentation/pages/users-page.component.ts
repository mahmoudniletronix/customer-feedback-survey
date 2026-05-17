import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { UsersRound } from 'lucide-angular';
import { CardComponent } from '../../../../shared/ui/card/card.component';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { UserTableComponent } from '../components/user-table.component';
import { UsersStore } from '../state/users.store';

@Component({
  selector: 'app-users-page',
  standalone: true,
  imports: [CardComponent, IconComponent, TranslatePipe, UserTableComponent],
  templateUrl: './users-page.component.html',
  styleUrl: './users-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UsersPageComponent implements OnInit {
  readonly usersStore = inject(UsersStore);
  readonly usersIcon = UsersRound;

  ngOnInit(): void {
    this.usersStore.load();
  }
}

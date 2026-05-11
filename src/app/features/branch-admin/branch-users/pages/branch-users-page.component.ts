import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ChevronLeft, ChevronRight, Search, UsersRound } from 'lucide-angular';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { ButtonComponent } from '../../../../shared/ui/button/button.component';
import { CardComponent } from '../../../../shared/ui/card/card.component';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { InputComponent } from '../../../../shared/ui/input/input.component';
import { BranchUsersStore } from '../state/branch-users.store';

@Component({
  selector: 'app-branch-users-page',
  standalone: true,
  imports: [
    ButtonComponent,
    CardComponent,
    DatePipe,
    IconComponent,
    InputComponent,
    ReactiveFormsModule,
    TranslatePipe,
  ],
  templateUrl: './branch-users-page.component.html',
  styleUrl: './branch-users-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BranchUsersPageComponent implements OnInit {
  readonly branchUsersStore = inject(BranchUsersStore);
  private readonly formBuilder = inject(FormBuilder);

  readonly chevronLeftIcon = ChevronLeft;
  readonly chevronRightIcon = ChevronRight;
  readonly searchIcon = Search;
  readonly usersIcon = UsersRound;

  readonly searchForm = this.formBuilder.nonNullable.group({
    searchText: [''],
  });

  ngOnInit(): void {
    this.branchUsersStore.load();
  }

  searchBranchUsers(): void {
    this.branchUsersStore.search(this.searchForm.controls.searchText.value);
  }

  clearBranchUserSearch(): void {
    this.searchForm.reset();
    this.branchUsersStore.search('');
  }

  goToPreviousBranchUsersPage(): void {
    this.branchUsersStore.previousPage();
  }

  goToNextBranchUsersPage(): void {
    this.branchUsersStore.nextPage();
  }
}

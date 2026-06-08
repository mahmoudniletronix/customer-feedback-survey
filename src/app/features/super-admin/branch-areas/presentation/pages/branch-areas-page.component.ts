import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  ChevronLeft,
  ChevronRight,
  CirclePlus,
  Eye,
  RotateCcw,
  Search,
  ShieldCheck,
  UserX,
  UsersRound,
} from 'lucide-angular';
import { I18nService } from '../../../../../core/services/i18n.service';
import { AuthStore } from '../../../../auth/presentation/state/auth.store';
import { ButtonComponent } from '../../../../../shared/ui/button/button.component';
import { CardComponent } from '../../../../../shared/ui/card/card.component';
import { IconComponent } from '../../../../../shared/ui/icon/icon.component';
import { InputComponent } from '../../../../../shared/ui/input/input.component';
import { TranslatePipe } from '../../../../../shared/pipes/translate.pipe';
import {
  BranchAreaBranch,
  BranchAreaListItem,
  BranchAreaOrderSort,
} from '../../domain/branch-area.model';
import { BranchAreasStore } from '../state/branch-areas.store';

@Component({
  selector: 'app-branch-areas-page',
  standalone: true,
  imports: [
    ButtonComponent,
    CardComponent,
    DatePipe,
    IconComponent,
    InputComponent,
    ReactiveFormsModule,
    RouterLink,
    TranslatePipe,
  ],
  templateUrl: './branch-areas-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BranchAreasPageComponent implements OnInit {
  readonly branchAreasStore = inject(BranchAreasStore);
  private readonly authStore = inject(AuthStore);
  private readonly formBuilder = inject(FormBuilder);
  private readonly i18n = inject(I18nService);

  readonly chevronLeftIcon = ChevronLeft;
  readonly chevronRightIcon = ChevronRight;
  readonly createIcon = CirclePlus;
  readonly deactivateIcon = UserX;
  readonly detailsIcon = Eye;
  readonly restoreIcon = RotateCcw;
  readonly searchIcon = Search;
  readonly shieldIcon = ShieldCheck;
  readonly usersIcon = UsersRound;
  readonly canCreate = computed(() => this.authStore.canCreateBranchAreas());
  readonly canDeactivate = computed(() => this.authStore.canDeactivateBranchAreas());
  readonly canRestore = computed(() => this.authStore.canRestoreBranchAreas());
  readonly canViewDetails = computed(() => this.authStore.canViewBranchAreaDetails());

  readonly filtersForm = this.formBuilder.nonNullable.group({
    searchText: [''],
    pageSize: [10],
    orderSort: this.formBuilder.nonNullable.control<BranchAreaOrderSort>('Newest'),
  });

  ngOnInit(): void {
    this.branchAreasStore.load();
  }

  searchBranchAreas(): void {
    const filters = this.filtersForm.getRawValue();
    this.branchAreasStore.search(filters.searchText);
  }

  clearSearch(): void {
    this.filtersForm.controls.searchText.setValue('');
    this.branchAreasStore.search('');
  }

  changePageSizeFromEvent(event: Event): void {
    const value = Number((event.target as HTMLSelectElement).value);
    this.filtersForm.controls.pageSize.setValue(value);
    this.branchAreasStore.changePageSize(value);
  }

  changeOrderSortFromEvent(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    const orderSort: BranchAreaOrderSort = value === 'Oldest' ? 'Oldest' : 'Newest';
    this.filtersForm.controls.orderSort.setValue(orderSort);
    this.branchAreasStore.changeOrderSort(orderSort);
  }

  goToPreviousPage(): void {
    this.branchAreasStore.previousPage();
  }

  goToNextPage(): void {
    this.branchAreasStore.nextPage();
  }

  deactivateBranchArea(branchArea: BranchAreaListItem): void {
    if (!branchArea.isActive || this.branchAreasStore.deactivatingBranchAreaId()) {
      return;
    }

    const confirmed = globalThis.confirm(this.i18n.translate('branchAreas.deactivateConfirm'));
    if (!confirmed) {
      return;
    }

    this.branchAreasStore.deactivate(branchArea.branchAreaId);
  }

  restoreBranchArea(branchArea: BranchAreaListItem): void {
    if (branchArea.isActive || this.branchAreasStore.restoringBranchAreaId()) {
      return;
    }

    const confirmed = globalThis.confirm(this.i18n.translate('branchAreas.restoreConfirm'));
    if (!confirmed) {
      return;
    }

    this.branchAreasStore.restore(branchArea.branchAreaId);
  }

  displayName(branchArea: BranchAreaListItem): string {
    if (this.i18n.language() === 'ar') {
      return branchArea.nameAr || branchArea.nameEn || branchArea.userName || '-';
    }

    return branchArea.nameEn || branchArea.nameAr || branchArea.userName || '-';
  }

  branchName(branch: BranchAreaBranch): string {
    if (this.i18n.language() === 'ar') {
      return branch.nameAr || branch.nameEn || branch.code || branch.id;
    }

    return branch.nameEn || branch.nameAr || branch.code || branch.id;
  }

  branchSummary(branchArea: BranchAreaListItem): string {
    if (branchArea.branches.length === 0) {
      return this.i18n.translate('branchAreas.noBranchesAssigned');
    }

    return branchArea.branches.map((branch) => this.branchName(branch)).join(', ');
  }
}

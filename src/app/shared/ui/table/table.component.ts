import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TableColumn, TableRow } from '../../models/table.model';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './table.component.html',
  styleUrl: './table.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TableComponent {
  readonly columns = input<readonly TableColumn[]>([]);
  readonly rows = input<readonly TableRow[]>([]);
  readonly trackKey = input('id');
}

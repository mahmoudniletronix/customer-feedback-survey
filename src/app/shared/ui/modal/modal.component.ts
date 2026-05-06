import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModalComponent {
  readonly open = input(false);
  readonly title = input('');
  readonly closed = output<void>();
}

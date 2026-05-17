import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Question } from '../../domain/survey.model';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-question-list',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './question-list.component.html',
  styleUrl: './question-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuestionListComponent {
  readonly questions = input<readonly Question[]>([]);
}

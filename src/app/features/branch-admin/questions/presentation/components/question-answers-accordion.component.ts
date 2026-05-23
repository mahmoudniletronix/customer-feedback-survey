import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { ChevronDown, ListChecks, Star } from 'lucide-angular';
import { AnswerScaleValue } from '../../../../../shared/models/question-answer.model';
import { TranslatePipe } from '../../../../../shared/pipes/translate.pipe';
import { IconComponent } from '../../../../../shared/ui/icon/icon.component';

export interface QuestionAnswerAccordionItem {
  readonly id: string;
  readonly label: string;
  readonly score: AnswerScaleValue | null;
  readonly title: string;
  readonly variant?: 'text' | 'stars';
}

@Component({
  selector: 'app-question-answers-accordion',
  standalone: true,
  imports: [IconComponent, TranslatePipe],
  template: `
    @if (answers().length > 0) {
      <button
        class="mt-2 inline-flex h-7 items-center gap-1.5 rounded-lg border border-cyan-100 bg-cyan-50/70 px-2 text-[11px] font-extrabold text-[#0d94b3] transition hover:bg-cyan-100 focus:outline-none focus:ring-2 focus:ring-[#11A7C9]/20"
        type="button"
        [attr.aria-expanded]="expanded()"
        (click)="toggle()"
      >
        <app-icon [icon]="answersIcon" [size]="13" />
        {{ expanded() ? ('questions.hideAnswers' | t) : ('questions.showAnswers' | t) }}
        <span class="rounded-full bg-white/80 px-1.5 py-0.5 text-[10px] text-slate-600">
          {{ answers().length }}
        </span>
        <app-icon
          class="transition-transform duration-200"
          [class.rotate-180]="expanded()"
          [icon]="chevronDownIcon"
          [size]="13"
        />
      </button>

      <div
        class="grid transition-[grid-template-rows,opacity,transform] duration-200 ease-out motion-reduce:transition-none"
        [class.mt-2]="expanded()"
        [class.grid-rows-[1fr]]="expanded()"
        [class.grid-rows-[0fr]]="!expanded()"
        [class.opacity-100]="expanded()"
        [class.opacity-0]="!expanded()"
        [class.translate-y-0]="expanded()"
        [class.-translate-y-1]="!expanded()"
      >
        <div class="min-h-0 overflow-hidden">
          <div
            class="flex max-w-full flex-wrap items-center gap-1.5 rounded-lg bg-slate-50/80 p-1.5 ring-1 ring-slate-100"
          >
            @for (answer of answers(); track answer.id) {
              <span
                class="inline-flex max-w-full items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-700 shadow-sm"
                [title]="answer.title"
              >
                @if (answer.variant === 'stars') {
                  <span class="inline-flex items-center gap-0.5 text-amber-400">
                    @for (score of scoreValues; track score) {
                      @if (answer.score !== null && score <= answer.score) {
                        <app-icon [icon]="starIcon" [size]="12" [strokeWidth]="2.4" />
                      }
                    }
                  </span>
                } @else {
                  <span class="max-w-[12rem] truncate">{{ answer.label }}</span>
                }
                @if (answer.score !== null) {
                  <span
                    class="rounded-full bg-cyan-50 px-1.5 py-0.5 text-[10px] font-extrabold text-[#0d94b3]"
                  >
                    {{ 'questions.optionValue' | t }} {{ answer.score }}
                  </span>
                }
              </span>
            }
          </div>
        </div>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuestionAnswersAccordionComponent {
  readonly answers = input<readonly QuestionAnswerAccordionItem[]>([]);
  readonly expanded = signal(false);

  readonly scoreValues: readonly AnswerScaleValue[] = [1, 2, 3, 4, 5];
  readonly answersIcon = ListChecks;
  readonly chevronDownIcon = ChevronDown;
  readonly starIcon = Star;

  toggle(): void {
    this.expanded.update((expanded) => !expanded);
  }
}

import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CheckCircle2 } from 'lucide-angular';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { PublicSurveyFooterComponent } from '../components/public-survey-footer.component';

@Component({
  selector: 'app-public-anonymous-template-success-page',
  standalone: true,
  imports: [IconComponent, TranslatePipe, PublicSurveyFooterComponent],
  templateUrl: './public-anonymous-template-success-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicAnonymousTemplateSuccessPageComponent {
  readonly checkIcon = CheckCircle2;
}

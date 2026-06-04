import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BRAND_ASSETS } from '../../../core/theme/brand-assets';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './app-footer.component.html',
  styleUrl: './app-footer.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppFooterComponent {
  readonly brandAssets = BRAND_ASSETS;
}

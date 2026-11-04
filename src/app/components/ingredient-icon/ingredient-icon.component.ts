import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { EVERYTHING_ICON, ingredientKind } from '../../utils/graphic.utils';

export type IconMark = 'none' | 'remove' | 'add' | 'less';

@Component({
  selector: 'app-ingredient-icon',
  standalone: true,
  templateUrl: './ingredient-icon.component.html',
  styleUrl: './ingredient-icon.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IngredientIconComponent {
  name = input('');
  everything = input(false);
  mark = input<IconMark>('none');

  parts = computed(() =>
    this.everything() ? EVERYTHING_ICON : ingredientKind(this.name()).icon
  );
}

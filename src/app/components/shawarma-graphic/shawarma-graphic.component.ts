import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import {
  GraphicLayer,
  IconPart,
  ingredientKind,
  MEAT,
} from '../../utils/graphic.utils';

// The inside of the roll, in the 200×200 drawing space.
const WELL = { left: 66, width: 68, top: 44, bottom: 180 };
const MEAT_ID = '~meat';

interface Band {
  id: string;
  y: number;
  h: number;
  fill: string;
  icon: IconPart[];
  spots: string[];
}

interface Callout {
  id: string;
  name: string;
  state: string;
  y: number;
  leader: string;
}

// Icon positions filling a layer of height h: one row, or two staggered rows once it's thick.
function spots(h: number): string[] {
  const rows = h >= 26 ? 2 : 1;
  const size = Math.min(11, (h / rows) * 0.8);
  if (size < 4) return [];

  const perRow = 5;
  const step = WELL.width / perRow;
  const result: string[] = [];
  for (let row = 0; row < rows; row++) {
    const staggered = row % 2 === 1;
    for (let i = 0; i < (staggered ? perRow - 1 : perRow); i++) {
      const x = WELL.left + step * (i + (staggered ? 1 : 0.5));
      const y = (h * (row + 0.5)) / rows;
      const rotation = (((row * perRow + i) * 37) % 40) - 20;
      result.push(
        `translate(${x}px, ${y}px) rotate(${rotation}deg) scale(${size / 24}) translate(-12px, -12px)`
      );
    }
  }
  return result;
}

const capitalize = (name: string) => name.charAt(0).toUpperCase() + name.slice(1);

@Component({
  selector: 'app-shawarma-graphic',
  standalone: true,
  templateUrl: './shawarma-graphic.component.html',
  styleUrl: './shawarma-graphic.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.mini]': 'mini()', '[class.callouts]': 'legend()' },
})
export class ShawarmaGraphicComponent {
  layers = input<GraphicLayer[]>([]);
  scale = input(1);
  mini = input(false);
  // Labels each layer with a leader line to the right of the roll.
  legend = input(false);

  // The fillings as stacked layers: meat at the bottom, sauces on top. Layers share the height of
  // the roll; extras count double, "less" half, and removed ones collapse to nothing.
  bands = computed<Band[]>(() => {
    const mini = this.mini();
    const stack = [
      { id: MEAT_ID, kind: MEAT, weight: 2 },
      ...[...this.layers()]
        .sort(
          (a, b) =>
            Number(!!ingredientKind(a.name).top) - Number(!!ingredientKind(b.name).top)
        )
        .map((layer) => ({
          id: layer.name,
          kind: ingredientKind(layer.name),
          weight: layer.amount,
        })),
    ];
    const unit =
      (WELL.bottom - WELL.top) / stack.reduce((sum, item) => sum + item.weight, 0);

    let bottom = WELL.bottom;
    return stack.map(({ id, kind, weight }) => {
      const h = weight * unit;
      bottom -= h;
      return {
        id,
        y: bottom,
        h,
        fill: mini ? kind.color : kind.tint,
        icon: kind.icon,
        spots: mini ? [] : spots(h),
      };
    });
  });

  // Labels, nudged apart so thin layers don't overlap.
  callouts = computed<Callout[]>(() => {
    if (!this.legend() || this.mini()) return [];

    const amounts = new Map(this.layers().map((l) => [l.name, l]));
    let last = -Infinity;
    return this.bands()
      .filter((band) => band.h > 0 && band.id !== MEAT_ID)
      .sort((a, b) => a.y - b.y)
      .map((band) => {
        const center = band.y + band.h / 2;
        const y = Math.max(center, last + 9);
        last = y;
        const layer = amounts.get(band.id);
        return {
          id: band.id,
          name: capitalize(band.id),
          state: layer ? this.stateLabel(layer) : '',
          y,
          leader: `M134 ${center}H143L149 ${y}H152`,
        };
      });
  });

  // The roll is tall and narrow, so big drawings crop in on it; labelled ones keep room on the right.
  viewBox = computed(() =>
    this.mini() ? '0 0 200 200' : this.legend() ? '16 24 176 176' : '12 24 176 176'
  );

  label = computed(() => {
    const shown = this.layers().filter((layer) => layer.base || layer.amount);
    const withIt = shown.filter((l) => l.amount).map((l) => l.name);
    const without = shown.filter((l) => !l.amount).map((l) => l.name);
    return [
      'Shawarma',
      withIt.length ? `with ${withIt.join(', ')}` : '',
      without.length ? `without ${without.join(', ')}` : '',
    ]
      .filter(Boolean)
      .join(' ');
  });

  stateLabel(layer: GraphicLayer) {
    if (layer.amount > 0 && layer.amount < 1) return 'LESS';
    if (layer.amount > 1 || (layer.amount && !layer.base)) return 'EXTRA';
    return '';
  }
}

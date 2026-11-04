import {
  Ingredient,
  IngredientAdjustment,
  MultiselectOption,
  productInfo,
} from '../models';

export interface GraphicLayer {
  name: string;
  // 0 = left out, 0.5 = less, 1 = normal, 2 = extra
  amount: number;
  // false for ingredients that only come as an extra (e.g. cheese)
  base: boolean;
}

export interface IconPart {
  d?: string;
  text?: string;
  fill?: string;
  stroke?: string;
  sw?: number;
  transform?: string;
}

export interface IngredientKind {
  icon: IconPart[];
  color: string; // solid, for small drawings
  tint: string; // light, behind the icons in a layer
  top?: boolean; // sauces sit on top of the stack
}

const INK = '#111111';
const circle = (cx: number, cy: number, r: number) =>
  `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;
const DROP =
  'M12 2.5c3.8 5.2 6.5 8.4 6.5 11.8a6.5 6.5 0 0 1-13 0c0-3.4 2.7-6.6 6.5-11.8z';

// Icons are drawn on a 24×24 grid. Ingredient names come from Firestore, so match English and
// Georgian stems; anything unknown gets a lettered square in a stable colour.
const KINDS: [RegExp, IngredientKind][] = [
  [/tomat|პომიდ/i, {
    color: '#e8361b',
    tint: '#ffd3c6',
    icon: [
      { d: circle(12, 13, 8.5), fill: '#e8361b', stroke: INK },
      { d: 'M12 7.5c-1.6-2.4-4-2.8-5.8-1.8 1.8.9 3.6 1.6 5.8 1.8zm0 0c1.6-2.4 4-2.8 5.8-1.8-1.8.9-3.6 1.6-5.8 1.8zM12 7.5V4', fill: '#4f8a26', stroke: INK, sw: 1 },
    ],
  }],
  [/onion|ხახვ/i, {
    color: '#b46fd0',
    tint: '#efdcf6',
    icon: [
      { d: circle(12, 12, 9), fill: '#f4e3f8', stroke: INK },
      { d: circle(12, 12, 6), stroke: '#9a4fb3' },
      { d: circle(12, 12, 3), stroke: '#9a4fb3' },
    ],
  }],
  [/pickl|cucumb|gherk|კიტრ|მწნილ/i, {
    color: '#5c9a2e',
    tint: '#d7ebc2',
    icon: [
      { d: 'M2.5 12a9.5 5 0 1 0 19 0a9.5 5 0 1 0-19 0', fill: '#5c9a2e', stroke: INK, transform: 'rotate(-35 12 12)' },
      { d: 'M7.5 12h.01M11 10.5h.01M14.5 12.5h.01M17 11h.01M10 14h.01', stroke: '#c3e38a', sw: 2.2, transform: 'rotate(-35 12 12)' },
    ],
  }],
  [/cabbag|lettuc|salad|green|parsl|კომბოსტ|მწვან|სალათ/i, {
    color: '#a8d14a',
    tint: '#e9f4cc',
    icon: [
      { d: 'M4 20C4 10 9.5 4 20.5 3.5 20.5 13.5 14.5 20 4 20z', fill: '#a8d14a', stroke: INK },
      { d: 'M4.5 19.5L16 8M9 15.5v-4M12.5 12H16', stroke: '#4f8a26' },
    ],
  }],
  [/ketchup|კეჩუპ/i, {
    color: '#d81f26',
    tint: '#ffcaca',
    top: true,
    icon: [{ d: DROP, fill: '#d81f26', stroke: INK }],
  }],
  [/sauce|garlic|mayo|ნიორ|სოუს|მაიონ/i, {
    color: '#fff6e0',
    tint: '#fffaf0',
    top: true,
    icon: [
      { d: DROP, fill: '#fff6e0', stroke: INK },
      { d: 'M9 15a3 3 0 0 0 3 3', stroke: '#d9b46a' },
    ],
  }],
  [/chees|ყველ/i, {
    color: '#ffc400',
    tint: '#ffeaa3',
    icon: [
      { d: 'M2.5 18L21.5 8.5V18z', fill: '#ffc400', stroke: INK },
      { d: circle(14, 14.5, 1.4) + circle(18, 12.5, 1.1) + circle(9, 16, 1), fill: '#e39a00' },
    ],
  }],
  [/pepper|chil|jalap|spic|წიწაკ|ცხარ/i, {
    color: '#d81f26',
    tint: '#ffcaca',
    icon: [
      { d: 'M17.5 7.5c1.5 6-4 12.5-13.5 13 3.5-2.5 7.5-7 9.5-12.5z', fill: '#d81f26', stroke: INK },
      { d: 'M15.5 8c.5-2.5 2-4 4.5-4.5', stroke: '#4f8a26', sw: 2 },
    ],
  }],
  [/potat|fries|კარტოფ/i, {
    color: '#f0ad2c',
    tint: '#fde3ae',
    icon: [
      { d: 'M7 13V4.5M10.5 13V3M14 13V5M17 13V6.5', stroke: '#f0ad2c', sw: 2.6 },
      { d: 'M5 11.5h14l-2 9.5H7z', fill: '#e8361b', stroke: INK },
    ],
  }],
];

export const MEAT: IngredientKind = {
  color: '#8a3f1d',
  tint: '#b9714a',
  icon: [
    { d: 'M3.5 10l5-4.5 9 1.5 3.5 6.5-4.5 5.5-9.5-1z', fill: '#8a3f1d', stroke: INK },
    { d: 'M8 10.5l7 1M7 14.5l8 1.2', stroke: '#c47a52' },
  ],
};

// "With everything": a little stack of layers, like the builder drawing.
export const EVERYTHING_ICON: IconPart[] = [
  { d: 'M5 3.5h14v17H5z', fill: '#efd6a2', stroke: INK },
  { d: 'M7.5 8h9', stroke: '#e8361b', sw: 2.2 },
  { d: 'M7.5 11.5h9', stroke: '#5c9a2e', sw: 2.2 },
  { d: 'M7.5 15h9', stroke: '#b46fd0', sw: 2.2 },
];

const FALLBACK: [string, string, string][] = [
  ['#2457d6', '#d6e0fa', '#ffffff'],
  ['#111111', '#d9d6cf', '#ffffff'],
  ['#ffc400', '#ffeaa3', INK],
  ['#5c9a2e', '#d7ebc2', '#ffffff'],
  ['#b46fd0', '#efdcf6', '#ffffff'],
];

export function ingredientKind(name: string): IngredientKind {
  const known = KINDS.find(([pattern]) => pattern.test(name));
  if (known) return known[1];

  const hash = [...name].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const [color, tint, letter] = FALLBACK[hash % FALLBACK.length];
  return {
    color,
    tint,
    icon: [
      { d: 'M3 3h18v18H3z', fill: color, stroke: INK },
      { text: name.charAt(0).toUpperCase(), fill: letter },
    ],
  };
}

// "No onion" / "Extra onion" -> "onion"; falls back to the label's second word for data without it.
export function ingredientOf(option: MultiselectOption): string {
  return (
    option.product ||
    option.value.split(' ')[1] ||
    option.value
  ).toLowerCase();
}

export const isLessAdjustment = (label: string) => /less|ნაკლ/i.test(label);

export function buildLayers(
  restrictionOptions: MultiselectOption[],
  adjustmentOptions: MultiselectOption[],
  restrictions: string[] = [],
  adjustments: string[] = []
): GraphicLayer[] {
  const base = new Set(restrictionOptions.map(ingredientOf));
  const removed = new Set(
    restrictionOptions
      .filter((option) => restrictions.includes(option.value))
      .map(ingredientOf)
  );
  const adjusted = new Map(
    adjustmentOptions
      .filter((option) => adjustments.includes(option.value))
      .map((option) => [ingredientOf(option), option.value])
  );
  const names = [...new Set([...base, ...adjustmentOptions.map(ingredientOf)])];

  return names.map((name) => {
    const adjustment = adjusted.get(name);
    let amount = base.has(name) && !removed.has(name) ? 1 : 0;
    if (adjustment) amount = isLessAdjustment(adjustment) ? 0.5 : amount ? 2 : 1;
    return { name, amount, base: base.has(name) };
  });
}

export const toRestrictionOptions = (ingredients: Ingredient[]): MultiselectOption[] =>
  ingredients.map((val) => ({
    label: val.product.restriction,
    value: val.product.restriction,
    product: val.product.ingredient,
  }));

export const toAdjustmentOptions = (
  adjustments: IngredientAdjustment[]
): MultiselectOption[] =>
  adjustments
    .filter((val) => val.product.adjustment && val.product.ingredient)
    .flatMap((val) =>
      val.product.adjustment.map((adjustment) => ({
        label: adjustment,
        value: adjustment,
        product: val.product.ingredient,
      }))
    );

export const toSizeOptions = (sizes: productInfo[]): MultiselectOption[] =>
  sizes
    .map((val) => ({
      label: val.productInfo.size,
      value: val.productInfo.size,
      price: val.productInfo.price,
    }))
    .sort((a, b) => a.price - b.price);

// The smallest size draws at 72% of the biggest; an unknown size sits in between.
export function sizeScale(
  sizes: MultiselectOption[],
  size: string | null | undefined
): number {
  const index = sizes.findIndex((option) => option.value === size);
  if (index < 0) return 0.86;
  return sizes.length > 1 ? 0.72 + (0.28 * index) / (sizes.length - 1) : 1;
}

export const DEMO_LAYERS: GraphicLayer[] = [
  'tomato',
  'onion',
  'pickles',
  'cabbage',
  'sauce',
].map((name) => ({ name, amount: 1, base: true }));

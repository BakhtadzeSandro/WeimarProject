import { buildLayers, ingredientKind, ingredientOf, sizeScale } from './graphic.utils';

describe('graphic utils', () => {
  const restrictions = [
    { label: 'No onion', value: 'No onion', product: 'onion' },
    { label: 'No tomato', value: 'No tomato', product: 'tomato' },
  ];
  const adjustments = [
    { label: 'Extra onion', value: 'Extra onion', product: 'onion' },
    { label: 'Less sauce', value: 'Less sauce', product: 'sauce' },
    { label: 'Extra cheese', value: 'Extra cheese', product: 'cheese' },
  ];

  it('turns choices into layer amounts', () => {
    const layers = buildLayers(restrictions, adjustments, ['No tomato'], ['Extra onion', 'Extra cheese']);
    expect(layers).toEqual([
      { name: 'onion', amount: 2, base: true },
      { name: 'tomato', amount: 0, base: true },
      { name: 'sauce', amount: 0, base: false },
      { name: 'cheese', amount: 1, base: false },
    ]);
    expect(buildLayers(restrictions, adjustments, [], ['Less sauce'])[2].amount).toBe(0.5);
  });

  it('falls back to the label when an option has no ingredient', () => {
    expect(ingredientOf({ label: 'No Pickles', value: 'No Pickles' })).toBe('pickles');
  });

  it('scales sizes from smallest to biggest', () => {
    const sizes = [{ label: 'S', value: 'S' }, { label: 'M', value: 'M' }, { label: 'L', value: 'L' }];
    expect(sizeScale(sizes, 'S')).toBeCloseTo(0.72);
    expect(sizeScale(sizes, 'L')).toBe(1);
    expect(sizeScale(sizes, undefined)).toBe(0.86);
  });

  it('picks icons by English or Georgian name and letters unknown ones', () => {
    expect(ingredientKind('ხახვი')).toBe(ingredientKind('Onion'));
    expect(ingredientKind('sauce').top).toBeTrue();
    expect(ingredientKind('zaatar').icon[1].text).toBe('Z');
    expect(ingredientKind('zaatar')).toEqual(ingredientKind('zaatar'));
  });
});

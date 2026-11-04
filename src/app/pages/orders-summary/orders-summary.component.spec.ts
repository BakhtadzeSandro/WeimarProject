import { Order } from '../../models';
import { OrdersSummaryComponent } from './orders-summary.component';

describe('OrdersSummaryComponent.groupByPerson', () => {
  const item = (orderedBy: string, price: number, orderedFor: string | null = null) =>
    ({ orderedBy, orderedFor, photoUrl: null, productDetails: { price } } as Order);

  it('groups items by who they are for and splits delivery per item', () => {
    const people = OrdersSummaryComponent.prototype.groupByPerson.call(
      { deliveryPrice: 4 },
      [item('Sandro', 10), item('Sandro', 12, 'Nika'), item('Sandro', 10), item('Ana', 8)]
    );

    expect(people.map((p) => [p.name, p.items.length, p.total])).toEqual([
      ['Sandro', 2, 22],
      ['Nika', 1, 13],
      ['Ana', 1, 9],
    ]);
  });
});

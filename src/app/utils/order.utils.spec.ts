import { docNameToDate, formatDateToDocName } from './date.utils';
import { describeOrder, groupCreatorIds, personName } from './order.utils';

describe('order utils', () => {
  it('lists only group creators from a day doc', () => {
    expect(groupCreatorIds({ createdAt: 1, orderedGroups: {}, a: [], b: [] })).toEqual(['a', 'b']);
  });

  it('describes an item', () => {
    const base = { withEverything: true, size: 'Big', price: 13, restrictions: [], adjustment: [] };
    expect(describeOrder(base)).toBe('Big · with everything');
    expect(describeOrder({ ...base, restrictions: ['No onion'], adjustment: ['Extra sauce'] })).toBe(
      'Big · No onion · Extra sauce'
    );
  });

  it('bills items to the person they are for', () => {
    expect(personName({ orderedBy: 'Sandro', orderedFor: 'Nika' } as any)).toBe('Nika');
    expect(personName({ orderedBy: 'Sandro', orderedFor: null } as any)).toBe('Sandro');
  });

  it('round-trips doc names', () => {
    expect(formatDateToDocName(docNameToDate('11-4-2026'))).toBe('11-4-2026');
  });
});

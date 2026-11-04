import { DocumentData } from '@angular/fire/firestore';
import { User } from 'firebase/auth';
import { Order, productDetails } from '../models';

// A day doc holds one Order[] per group creator, next to these bookkeeping fields.
const RESERVED_KEYS = ['createdAt', 'orderedGroups'];

export function groupCreatorIds(day: DocumentData | undefined): string[] {
  return Object.keys(day ?? {}).filter((key) => !RESERVED_KEYS.includes(key));
}

export function describeOrder(p: productDetails | undefined): string {
  if (!p) return '';
  return [
    p.size,
    p.restrictions?.length ? p.restrictions.join(', ') : 'with everything',
    p.adjustment?.join(', '),
  ]
    .filter(Boolean)
    .join(' · ');
}

// The person an item is for, i.e. who owes money for it.
export function personName(order: Order): string {
  return order.orderedFor || order.orderedBy || 'Unknown';
}

// Legacy orders have no userId and were matched by display name.
export function isOwnOrder(
  order: Order,
  user: Pick<User, 'uid' | 'displayName'>
): boolean {
  return order.userId
    ? order.userId === user.uid
    : order.orderedBy === user.displayName;
}

export function firstName(name: string | null | undefined): string {
  return name?.split(' ')[0] ?? '';
}

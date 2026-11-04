import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Unsubscribe } from '@angular/fire/auth';
import { ActivatedRoute, Router } from '@angular/router';
import { User } from 'firebase/auth';
import { isEqual } from 'lodash';
import { ToastrService } from 'ngx-toastr';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { switchMap, take, tap } from 'rxjs';
import { ShawarmaGraphicComponent } from '../../components/shawarma-graphic/shawarma-graphic.component';
import {
  FirestoreUser,
  GroupedOrders,
  MultiselectOption,
  Order,
} from '../../models/index';
import { AuthService, OrderService, UsersService } from '../../services/index';
import { docNameToDate, formatDateToDocName } from '../../utils/date.utils';
import {
  buildLayers,
  GraphicLayer,
  sizeScale,
  toAdjustmentOptions,
  toRestrictionOptions,
  toSizeOptions,
} from '../../utils/graphic.utils';
import {
  describeOrder,
  firstName,
  isOwnOrder,
  personName,
} from '../../utils/order.utils';

interface Line {
  group: GroupedOrders;
  layers: GraphicLayer[];
  scale: number;
}

interface Person {
  name: string;
  total: number;
  items: Order[];
  paid: boolean;
}

@Component({
  selector: 'app-orders-summary',
  templateUrl: './orders-summary.component.html',
  styleUrls: ['./orders-summary.component.scss'],
  standalone: true,
  imports: [CommonModule, ButtonModule, TooltipModule, ShawarmaGraphicComponent],
  providers: [ToastrService],
})
export class OrdersSummaryComponent implements OnInit, OnDestroy {
  private orderService = inject(OrderService);
  private userService = inject(UsersService);
  private authService = inject(AuthService);
  private toastr = inject(ToastrService);
  private router = inject(Router);
  private _originalOrders: Order[] | undefined;
  private activatedRoute = inject(ActivatedRoute);
  readonly weimarPhone = '511 16 16 35';
  deliveryPrice = 5;
  allOrdersLength: number | undefined;

  // Doc name like "11-4-2026"; kept as a string because Safari can't parse it with new Date().
  selectedDate: string | undefined;

  orders: GroupedOrders[] | undefined;

  lines: Line[] = [];

  private menu: {
    sizes: MultiselectOption[];
    restrictions: MultiselectOption[];
    adjustments: MultiselectOption[];
  } = { sizes: [], restrictions: [], adjustments: [] };

  people: Person[] = [];

  currentUser: User | null | undefined;

  orderCreator: FirestoreUser | undefined;

  creatorLoaded = false;

  orderedAt: Date | undefined;

  groupLeaverId: string | undefined;

  unsub: Unsubscribe | undefined;

  describeOrder = describeOrder;

  get foodPrice() {
    return (
      this._originalOrders?.reduce(
        (acc, curr) => acc + (curr.productDetails?.price || 0),
        0
      ) ?? 0
    );
  }

  get orderPrice() {
    return this._originalOrders?.length
      ? this.foodPrice + this.deliveryPrice
      : 0;
  }

  // Who's viewing and whose group it is are both known, so creator-only actions won't flicker in.
  get ready() {
    return this.creatorLoaded && this.currentUser !== undefined;
  }

  get isToday() {
    return this.selectedDate === formatDateToDocName();
  }

  get dateLabel() {
    return this.selectedDate ? docNameToDate(this.selectedDate) : undefined;
  }

  get creatorFirstName() {
    return firstName(this.orderCreator?.name);
  }

  get isCreator() {
    return !!this.currentUser && this.currentUser.uid === this.orderCreator?.id;
  }

  // Items can only change on today's group while it's still open.
  get canEdit() {
    return this.isToday && !this.orderedAt;
  }

  get hasOwnItems() {
    const user = this.currentUser;
    return !!user && !!this._originalOrders?.some((o) => isOwnOrder(o, user));
  }

  get myShare() {
    return this.people.find((p) => p.name === this.currentUser?.displayName);
  }

  get payers() {
    return this.people.filter((p) => !this.isOrganizer(p));
  }

  get paidCount() {
    return this.payers.filter((p) => p.paid).length;
  }

  get hasPaymentDetails() {
    const c = this.orderCreator;
    return !!(c?.bogAccountNumber || c?.tbcAccountNumber || c?.personalNumber);
  }

  constructor() {}

  isOrganizer(person: Person) {
    return person.name === this.orderCreator?.name;
  }

  backToOrderPage() {
    this.router.navigate([`order/${this.orderCreator?.id}`]);
  }

  backToHomePage() {
    this.router.navigate(['/all-orders']);
  }

  copyToClipboard(n: string | number | undefined | null) {
    if (n) {
      navigator.clipboard.writeText(n.toString());
      this.toastr.success('Copied to clipboard');
    }
  }

  // Plain-text order to paste into a chat or read out on the phone.
  copyOrder() {
    this.copyToClipboard(
      [
        `${this.orderCreator?.name}'s order (${this.allOrdersLength} items)`,
        ...(this.orders ?? []).map(
          (group) => `${group.count}× ${describeOrder(group.productDetails)}`
        ),
        `Total: ${Math.round(this.orderPrice * 100) / 100} GEL`,
      ].join('\n')
    );
  }

  leaveGroup() {
    this.authService
      .getCurrentUser()
      .pipe(
        take(1),
        tap((user) => (this.groupLeaverId = user?.uid)),
        switchMap((user) =>
          this.orderService.leaveGroup(this.orderCreator?.id ?? '', user)
        )
      )
      .subscribe((left) => left && this.router.navigate(['/all-orders']));
  }

  removeItem(itemId: string) {
    this.orderService
      .removeOrderItem(this.orderCreator?.id ?? '', itemId)
      .then((removed) => removed || this.toastr.error('This group is closed'))
      .catch(() => this.toastr.error('Could not remove the item'));
  }

  togglePaid(person: Person) {
    this.orderService
      .setPaid(
        this.selectedDate ?? '',
        this.orderCreator?.id ?? '',
        person.name,
        !person.paid
      )
      .catch(() => this.toastr.error('Could not update payment status'));
  }

  setOrdered(ordered: boolean) {
    this.orderService
      .setOrdered(this.orderCreator?.id ?? '', ordered)
      .catch(() => this.toastr.error('Could not update the group'));
  }

  // Combined order lines plus the drawing for each; rebuilt when orders or the menu arrive.
  buildLines() {
    const { sizes, restrictions, adjustments } = this.menu;
    this.lines = (this.orders ?? []).map((group) => ({
      group,
      layers: buildLayers(
        restrictions,
        adjustments,
        group.productDetails.restrictions,
        group.productDetails.adjustment
      ),
      scale: sizeScale(sizes, group.productDetails.size),
    }));
  }

  loadMenu() {
    Promise.all([
      this.orderService.getProductSizesAndPrices(),
      this.orderService.getIngredientsData(),
      this.orderService.getIngredientAdjustmentsData(),
    ]).then(([sizes, ingredients, adjustments]) => {
      this.menu = {
        sizes: toSizeOptions(sizes),
        restrictions: toRestrictionOptions(ingredients),
        adjustments: toAdjustmentOptions(adjustments),
      };
      this.buildLines();
    });
  }

  // Delivery is split per item, rounded to tetri.
  groupByPerson(orders: Order[]): Person[] {
    const deliveryShare = orders.length
      ? Math.round((this.deliveryPrice / orders.length) * 100) / 100
      : 0;
    const people = new Map<string, Person>();

    orders.forEach((order) => {
      const name = personName(order);
      const person = people.get(name) ?? { name, total: 0, items: [], paid: false };
      person.total += (order.productDetails?.price ?? 0) + deliveryShare;
      person.items.push(order);
      people.set(name, person);
    });

    return [...people.values()].map((person) => ({
      ...person,
      paid: person.items.every((item) => item.paid),
    }));
  }

  groupOrders(orders: Order[]): GroupedOrders[] {
    const groupedOrders: GroupedOrders[] = [];

    orders?.forEach((order) => {
      const { productDetails } = order;
      const user = {
        orderedBy: order.orderedFor
          ? `${order.orderedFor} (added by ${order.orderedBy})`
          : order.orderedBy ?? '',
        photoUrl: order.photoUrl ?? '',
      };

      const existingGroup = groupedOrders.find((group) =>
        isEqual(group.productDetails, productDetails)
      );

      if (existingGroup) {
        existingGroup.count++;
        existingGroup.users.push(user);
      } else {
        groupedOrders.push({ productDetails, count: 1, users: [user] });
      }
    });

    return groupedOrders;
  }

  getData() {
    const orderCreatorId = this.activatedRoute.snapshot.params['creatorId'];

    this.userService.getUserWithId(orderCreatorId ?? '').then((val) => {
      if (val) {
        this.orderCreator = val;
      }
      this.creatorLoaded = true;

      if (this.selectedDate) {
        this.unsub?.();
        this.unsub = this.orderService.listenToOrderUpdates(
          this.selectedDate,
          (doc) => {
            const data = doc.data();
            if (data) {
              this._originalOrders = data[
                this.orderCreator?.id ?? ''
              ] as Order[];
              if (!this._originalOrders) {
                this.router.navigate(['/all-orders']);
                this.groupLeaverId === this.orderCreator?.id
                  ? ''
                  : this.toastr.error('Order creator left the group');
              }
              this.orderedAt = data['orderedGroups']?.[
                this.orderCreator?.id ?? ''
              ]?.toDate();
              this.allOrdersLength = this._originalOrders?.length;
              this.orders = this.groupOrders(this._originalOrders ?? []);
              this.people = this.groupByPerson(this._originalOrders ?? []);
            } else {
              this.orders = [];
            }
            this.buildLines();
          }
        );
      }
    });
  }

  ngOnInit() {
    this.authService
      .getCurrentUser()
      .pipe(take(1))
      .subscribe((user) => (this.currentUser = user));

    this.loadMenu();

    this.activatedRoute.queryParams.subscribe((params) => {
      this.selectedDate = params['date'] ?? formatDateToDocName();
      this.getData();
    });
  }

  ngOnDestroy() {
    if (this.unsub) {
      this.unsub();
    }
  }
}

import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Unsubscribe } from '@angular/fire/auth';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { of } from 'rxjs';
import { switchMap, take } from 'rxjs/operators';
import { AccountNumberPopUpComponent } from '../../components/account-number-pop-up/account-number-pop-up.component';
import { PreviousOrderSidebarComponent } from '../../components/previous-order-sidebar/previous-order-sidebar.component';
import { FirestoreUser, Order } from '../../models/index';
import { AuthService, OrderService, UsersService } from '../../services/index';
import { formatDateToDocName } from '../../utils/date.utils';
import { firstName, groupCreatorIds } from '../../utils/order.utils';

interface GroupCard {
  creator: FirestoreUser;
  items: number;
  photos: string[];
  joined: boolean;
  ordered: boolean;
}

@Component({
  selector: 'app-all-orders',
  standalone: true,
  imports: [
    FormsModule,
    ButtonModule,
    CommonModule,
    PreviousOrderSidebarComponent,
    AccountNumberPopUpComponent,
    DialogModule,
  ],
  templateUrl: './all-orders.component.html',
  styleUrl: './all-orders.component.scss',
  providers: [],
})
export class AllOrdersComponent implements OnInit, OnDestroy {
  private orderService = inject(OrderService);
  private authService = inject(AuthService);
  private userService = inject(UsersService);
  private router = inject(Router);
  groups: GroupCard[] = [];
  loaded = false;
  currentUserId: string | undefined;
  today = new Date();
  sidebarDisplayed = false;
  showAccountNumberPop = false;
  unsub: Unsubscribe | undefined;
  firstName = firstName;

  constructor() {}

  get totalItems() {
    return this.groups.reduce((sum, group) => sum + group.items, 0);
  }

  get hasOwnGroup() {
    return this.groups.some((group) => group.creator.id === this.currentUserId);
  }

  openOwnGroup() {
    this.router.navigate([`order/${this.currentUserId}/summary`]);
  }

  // Members, the creator, and anyone once the group is closed go to the summary; others to the order form.
  clickOrderGroup({ creator, ordered }: GroupCard) {
    if (ordered || creator.id === this.currentUserId) {
      this.router.navigate([`order/${creator.id}/summary`]);
      return;
    }

    this.authService
      .getCurrentUser()
      .pipe(
        take(1),
        switchMap((val) => {
          if (!val) return of(null);

          return this.orderService.isUserInOrderGroup(
            formatDateToDocName(),
            creator.id,
            val
          );
        })
      )
      .subscribe((isInOrder) => {
        if (isInOrder) {
          this.router.navigate(['order/' + creator.id + '/summary']);
          return;
        }
        this.router.navigate(['order/' + creator.id]);
      });
  }

  displaySidebar() {
    this.sidebarDisplayed = true;
  }

  createNewGroup() {
    return this.authService
      .getCurrentUser()
      .pipe(
        take(1),
        switchMap((val) => {
          if (!val) return of(null);

          return this.userService
            .canCreateOrder(val.uid)
            .then((canCreateOrder) => ({
              user: val,
              canCreateOrder,
            }));
        }),
        switchMap((result) => {
          if (!result?.canCreateOrder) {
            this.showAccountNumberPop = true;
            return of(null);
          }
          return this.orderService.createNewGroup(result?.user.uid ?? '');
        })
      )
      .subscribe();
  }

  getCreators(date: Date | undefined) {
    if (!date) return;

    try {
      this.unsub = this.orderService.listenToOrderUpdates(
        formatDateToDocName(date),
        (doc) => {
          const day = doc.data();

          Promise.all(
            groupCreatorIds(day).map((id) => this.userService.getUserWithId(id))
          ).then((creators) => {
            this.groups = creators
              .filter((creator): creator is FirestoreUser => !!creator)
              .map((creator) => {
                const orders: Order[] = day?.[creator.id] ?? [];
                return {
                  creator,
                  items: orders.length,
                  photos: [
                    ...new Set(orders.map((order) => order.photoUrl ?? '')),
                  ].filter(Boolean),
                  joined: orders.some(
                    (order) => order.userId === this.currentUserId
                  ),
                  ordered: !!day?.['orderedGroups']?.[creator.id],
                };
              });
            this.loaded = true;
          });
        }
      );
    } catch (error) {
      console.error('Error retrieving creators:', error);
    }
  }

  ngOnInit() {
    this.authService
      .getCurrentUser()
      .pipe(take(1))
      .subscribe((user) => {
        this.currentUserId = user?.uid;
        this.getCreators(new Date());
      });
  }

  ngOnDestroy() {
    if (this.unsub) {
      this.unsub();
    }
  }
}

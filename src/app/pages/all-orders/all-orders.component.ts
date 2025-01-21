import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Unsubscribe } from '@angular/fire/auth';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AccountNumberPopUpComponent } from '../../components/account-number-pop-up/account-number-pop-up.component';
import { PreviousOrderSidebarComponent } from '../../components/previous-order-sidebar/previous-order-sidebar.component';
import { FirestoreUser } from '../../models/index';
import { AuthService, OrderService, UsersService } from '../../services/index';
import { formatDateToDocName } from '../../utils/date.utils';

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
  orderCreators: FirestoreUser[] = [];
  orderCreatorsIds: string[] | undefined;
  previousOrders: { [key: string]: string[] } | undefined;
  previousGroupCreators: { [key: string]: FirestoreUser[] } | undefined;
  previousOrderIds: string[] = [];
  visibleOrderDetails: string[] = [];
  lastDocId: string | null = null;
  sidebarDisplayed = false;
  hasMoreOrders = true;
  showAccountNumberPop = false;
  unsub: Unsubscribe | undefined;

  constructor() {}

  clickOrderGroup(orderCreator: FirestoreUser) {
    this.authService
      .getCurrentUser()
      .pipe(
        switchMap((val) => {
          if (!val) return of(null);

          return this.orderService.isUserInOrderGroup(
            formatDateToDocName(),
            orderCreator.id,
            val.displayName ?? ''
          );
        })
      )
      .subscribe((isInOrder) => {
        if (isInOrder) {
          this.router.navigate(['order/' + orderCreator.id + '/summary']);
          return;
        }
        this.router.navigate(['order/' + orderCreator.id]);
      });
  }

  displaySidebar() {
    this.sidebarDisplayed = true;
  }

  createNewGroup() {
    return this.authService
      .getCurrentUser()
      .pipe(
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
          if (doc.exists()) {
            this.orderCreatorsIds = Object.keys(doc.data());

            const creatorPromises = this.orderCreatorsIds.map((id) =>
              this.userService.getUserWithId(id)
            );
            Promise.all(creatorPromises).then((creators) => {
              this.orderCreators = creators.filter(
                (creator) => creator !== undefined && creator !== null
              ) as FirestoreUser[];
            });
          } else {
            this.orderCreators = [];
          }
        }
      );
    } catch (error) {
      console.error('Error retrieving creators:', error);
    }
  }

  ngOnInit() {
    this.getCreators(new Date());
  }

  ngOnDestroy() {
    if (this.unsub) {
      this.unsub();
    }
  }
}

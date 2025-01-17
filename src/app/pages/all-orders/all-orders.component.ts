import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DatePickerModule } from 'primeng/datepicker';
import { of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { FirestoreUser } from '../../models/index';
import { AuthService, OrderService, UsersService } from '../../services/index';
import { formatDateToDocName } from '../../utils/date.utils';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';
import { PreviousOrderSidebarComponent } from '../../components/previous-order-sidebar/previous-order-sidebar.component';
import { DialogModule } from 'primeng/dialog';
import { AccountNumberPopUpComponent } from '../../components/account-number-pop-up/account-number-pop-up.component';

@Component({
  selector: 'app-all-orders',
  standalone: true,
  imports: [
    DatePickerModule,
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
export class AllOrdersComponent implements OnInit {
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

  constructor() {}

  clickOrderGroup(orderCreator: FirestoreUser) {
    this.router.navigate(['order/' + orderCreator.id]);
    return;
  }

  async displaySidebar() {
    this.sidebarDisplayed = true;
  }

  createNewGroup() {
    return this.authService
      .getCurrentUser()
      .pipe(
        switchMap(async (val) => {
          if (!val) return null;
          const user = await this.userService.getUserWithId(val.uid);

          if (
            user?.bogAccountNumber ||
            user?.tbcAccountNumber ||
            user?.personalNumber ||
            user?.bogAccountNumber === '' ||
            user?.tbcAccountNumber === '' ||
            user?.personalNumber === 0
          ) {
            return val;
          }

          this.showAccountNumberPop = true;
          return null;
        }),
        switchMap((val) => {
          if (!val) return of(null);
          return this.orderService.createNewGroup(val.uid);
        })
      )
      .subscribe();
  }

  async getCreators(date: Date | undefined) {
    if (!date) return;

    try {
      this.orderService.listenToOrderUpdates(
        formatDateToDocName(date),
        async (doc) => {
          if (doc.exists()) {
            this.orderCreatorsIds = Object.keys(doc.data());

            const creatorPromises = this.orderCreatorsIds.map((id) =>
              this.userService.getUserWithId(id)
            );
            const creators = await Promise.all(creatorPromises);

            this.orderCreators = creators.filter(
              (creator) => creator !== undefined && creator !== null
            ) as FirestoreUser[];
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
}

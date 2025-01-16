import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DatePickerModule } from 'primeng/datepicker';
import { of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { FirestoreUser } from '../../models/index';
import { AuthService, OrderService, UsersService } from '../../services/index';
import { formatDateToDocName } from '../../utils/date.utils';
import { SidebarModule } from 'primeng/sidebar';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { CommonModule } from '@angular/common';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-all-orders',
  standalone: true,
  imports: [
    DatePickerModule,
    FormsModule,
    SidebarModule,
    ButtonModule,
    DividerModule,
    CommonModule,
    NgClass,
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

  constructor() {}

  clickOrderGroup(orderCreator: FirestoreUser, date: string | null = null) {
    if (!date) {
      this.router.navigate(['order/' + orderCreator.id]);
      return;
    }

    this.router.navigate(['order/' + orderCreator.id + '/summary'], {
      queryParams: { date: date },
    });
  }

  loadPreviousOrder(date: string, orderCreator: FirestoreUser) {
    this.router.navigate(['order/' + orderCreator.id + '/summary'], {
      queryParams: { date: date },
    });
  }

  async displaySidebar() {
    const { docs, lastDocId } =
      await this.orderService.retrieveOrdersForPagination();

    this.previousOrderIds = docs.map((doc) => doc.id);

    docs.forEach(async (doc) => {
      this.previousOrders = {
        ...this.previousOrders,
        [doc.id]: Object.keys(doc.data()).filter((key) => key !== 'createdAt'),
      };
    });

    this.lastDocId = lastDocId;
    this.sidebarDisplayed = true;
  }

  isOrderDetailsVisible(orderId: string): boolean {
    return this.visibleOrderDetails.includes(orderId);
  }

  async toggleOrderDetails(date: string) {
    if (this.visibleOrderDetails.includes(date)) {
      this.visibleOrderDetails.splice(
        this.visibleOrderDetails.indexOf(date),
        1
      );
      return;
    }
    this.visibleOrderDetails.push(date);
    if (!this.previousGroupCreators?.[date]) await this.loadOrderDetails(date);
  }

  async loadOrderDetails(date: string) {
    const response = await Promise.all(
      this.previousOrders?.[date].map((id) =>
        this.userService.getUserWithId(id)
      ) || []
    );
    this.previousGroupCreators = {
      ...this.previousGroupCreators,
      [date]: response as FirestoreUser[],
    };
  }

  loadMoreOrders() {
    this.orderService
      .retrieveOrdersForPagination(this.lastDocId)
      .then(({ docs, lastDocId }) => {
        this.previousOrderIds = [
          ...this.previousOrderIds,
          ...docs.map((doc) => doc.id),
        ];

        this.lastDocId = lastDocId;
        this.hasMoreOrders = docs.length > 0;
      });
  }

  createNewGroup() {
    return this.authService
      .getCurrentUser()
      .pipe(
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

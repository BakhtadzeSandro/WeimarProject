import { Component, inject, OnChanges, OnInit } from '@angular/core';
import { FirestoreUser } from '../../models';
import { OrderService, UsersService } from '../../services';
import { Router } from '@angular/router';
import { DatePickerModule } from 'primeng/datepicker';
import { FormsModule } from '@angular/forms';
import { SidebarModule } from 'primeng/sidebar';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { CommonModule, NgClass } from '@angular/common';
import { Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-previous-order-sidebar',
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
  templateUrl: './previous-order-sidebar.component.html',
  styleUrl: './previous-order-sidebar.component.scss',
})
export class PreviousOrderSidebarComponent implements OnInit, OnChanges {
  @Input() sidebarVisible = false;

  @Output() sidebarVisibleChange = new EventEmitter<boolean>();

  private orderService = inject(OrderService);
  private userService = inject(UsersService);
  private router = inject(Router);
  previousOrders: { [key: string]: string[] } | undefined;
  previousGroupCreators: { [key: string]: FirestoreUser[] } | undefined;
  previousOrderIds: string[] = [];
  visibleOrderDetails: string[] = [];
  lastDocId: string | null = null;
  sidebarDisplayed = false;
  hasMoreOrders = true;

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

  ngOnInit(): void {
    this.displaySidebar();
  }

  ngOnChanges() {
    this.sidebarDisplayed = this.sidebarVisible;
  }

  onHide() {
    console.log(this.sidebarDisplayed);
    this.sidebarVisibleChange.emit(this.sidebarDisplayed);
  }
}

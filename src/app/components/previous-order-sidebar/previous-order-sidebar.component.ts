import { CommonModule, NgClass } from '@angular/common';
import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  Output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { SidebarModule } from 'primeng/sidebar';
import { FirestoreUser } from '../../models';
import { OrderService, UsersService } from '../../services';

@Component({
  selector: 'app-previous-order-sidebar',
  standalone: true,
  imports: [
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
export class PreviousOrderSidebarComponent implements OnChanges {
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

  displaySidebar() {
    this.orderService
      .retrieveOrdersForPagination()
      .then(({ docs, lastDocId }) => {
        this.previousOrderIds = docs
          .map((doc) => {
            if (
              Object.keys(doc.data()).filter((key) => key !== 'createdAt')
                .length > 0
            ) {
              return doc.id;
            }
            return '';
          })
          .filter((id) => id !== '');

        docs.forEach((doc) => {
          this.previousOrders = {
            ...this.previousOrders,
            [doc.id]: Object.keys(doc.data()).filter(
              (key) => key !== 'createdAt'
            ),
          };
        });

        this.lastDocId = lastDocId;
      });
  }

  isOrderDetailsVisible(orderId: string): boolean {
    return this.visibleOrderDetails.includes(orderId);
  }

  toggleOrderDetails(date: string) {
    if (this.visibleOrderDetails.includes(date)) {
      this.visibleOrderDetails.splice(
        this.visibleOrderDetails.indexOf(date),
        1
      );
      return;
    }
    this.visibleOrderDetails.push(date);
    if (!this.previousGroupCreators?.[date]) this.loadOrderDetails(date);
  }

  loadOrderDetails(date: string) {
    Promise.all(
      this.previousOrders?.[date].map((id) =>
        this.userService.getUserWithId(id)
      ) || []
    ).then((response) => {
      this.previousGroupCreators = {
        ...this.previousGroupCreators,
        [date]: response as FirestoreUser[],
      };
    });
  }

  loadMoreOrders() {
    this.orderService
      .retrieveOrdersForPagination(this.lastDocId)
      .then(({ docs, lastDocId }) => {
        this.previousOrderIds = [
          ...this.previousOrderIds,
          ...docs.map((doc) => doc.id),
        ];

        docs.forEach((doc) => {
          this.previousOrders = {
            ...this.previousOrders,
            [doc.id]: Object.keys(doc.data()).filter(
              (key) => key !== 'createdAt'
            ),
          };
        });

        this.lastDocId = lastDocId;
        this.hasMoreOrders = docs.length === 10;
      });
  }

  onHide() {
    this.sidebarVisibleChange.emit(this.sidebarDisplayed);
  }

  ngOnChanges() {
    this.sidebarDisplayed = this.sidebarVisible;
    if (this.sidebarVisible) {
      this.hasMoreOrders = true;
      this.displaySidebar();
    }
  }
}

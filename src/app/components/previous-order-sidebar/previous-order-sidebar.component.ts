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
import { DrawerModule } from 'primeng/drawer';
import { FirestoreUser } from '../../models';
import { OrderService, UsersService } from '../../services';
import { docNameToDate } from '../../utils/date.utils';
import { groupCreatorIds } from '../../utils/order.utils';

@Component({
  selector: 'app-previous-order-sidebar',
  standalone: true,
  imports: [
    FormsModule,
    DrawerModule,
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
  previousGroupCreators: { [key: string]: (FirestoreUser | null)[] } | undefined;
  previousOrderIds: string[] = [];
  visibleOrderDetails: string[] = [];
  lastDocId: string | null = null;
  sidebarDisplayed = false;
  hasMoreOrders = true;
  loading = false;
  toDate = docNameToDate;

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
    this.previousOrderIds = [];
    this.lastDocId = null;
    this.loadMoreOrders();
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
        [date]: response,
      };
    });
  }

  loadMoreOrders() {
    this.loading = true;
    this.orderService
      .retrieveOrdersForPagination(this.lastDocId)
      .then(({ docs, lastDocId }) => {
        docs.forEach((doc) => {
          const creatorIds = groupCreatorIds(doc.data());
          if (!creatorIds.length) return;

          this.previousOrderIds = [...this.previousOrderIds, doc.id];
          this.previousOrders = { ...this.previousOrders, [doc.id]: creatorIds };
        });

        this.lastDocId = lastDocId;
        this.hasMoreOrders = docs.length === 10;
      })
      .finally(() => (this.loading = false));
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

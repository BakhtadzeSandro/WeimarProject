import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { isEqual } from 'lodash';
import { DatePickerModule } from 'primeng/datepicker';
import { OrderCardComponent } from '../../components/order-card/order-card.component';
import { GroupedOrders, Order } from '../../models/order.model';
import { FirestoreUser } from '../../models/user.model';
import { OrderService } from '../../services/order.service';
import { UsersService } from '../../services/users.service';

@Component({
  selector: 'app-orders-summary',
  templateUrl: './orders-summary.component.html',
  styleUrls: ['./orders-summary.component.scss'],
  standalone: true,
  imports: [OrderCardComponent, CommonModule, DatePickerModule, FormsModule],
  providers: [OrderService],
})
export class OrdersSummaryComponent implements OnInit {
  private orderService = inject(OrderService);
  private userService = inject(UsersService);
  private router = inject(Router);
  private _originalOrders: Order[] | undefined;
  private activatedRoute = inject(ActivatedRoute);
  deliveryPrice = 4;
  allOrdersLength: number | undefined;

  selectedDate: Date | undefined;

  similarOrdersFromDifferentUsers: any[] | undefined = [];

  orders: GroupedOrders[] | undefined;

  orderCreator: FirestoreUser | undefined;

  get orderPrice() {
    if (this._originalOrders) {
      return (
        this._originalOrders?.reduce(
          (acc, curr) => acc + (curr.productDetails?.price || 0),
          0
        ) + this.deliveryPrice
      );
    } else {
      return 0;
    }
  }

  constructor() {}

  backToOrderPage() {
    this.router.navigate([`order/${this.orderCreator?.id}`]);
  }

  retrieveOrdersForSpecificDate() {
    this.getOrders(this.selectedDate);
  }

  groupOrders(orders: Order[]): GroupedOrders[] {
    const groupedOrders: GroupedOrders[] = [];

    orders?.forEach((order) => {
      const { productDetails } = order;

      const existingGroup = groupedOrders.find((group) =>
        isEqual(group.productDetails, productDetails)
      );

      if (existingGroup?.count && order.orderedBy && order.photoUrl) {
        existingGroup.count++;
        existingGroup.users.push({
          orderedBy: order.orderedBy,
          photoUrl: order.photoUrl,
        });
      } else if (!existingGroup && order.orderedBy && order.photoUrl) {
        groupedOrders.push({
          productDetails,
          count: 1,
          users: [{ orderedBy: order.orderedBy, photoUrl: order.photoUrl }],
        });
      }
    });

    return groupedOrders;
  }

  async getOrders(date: Date | undefined) {
    await this.getOrderCreator();

    if (date) {
      const formattedDate = `${
        date.getMonth() + 1
      }-${date.getDate()}-${date.getFullYear()}`;
      this.orderService
        .retrieveOrdersPerUser(formattedDate, this.orderCreator?.id ?? '')
        .then((orders) => {
          this.allOrdersLength = orders?.length;
          this._originalOrders = orders;
          this.orders = this.groupOrders(orders ?? []);
        });
    }
  }

  async getOrderCreator() {
    // TODO: update orders in real time
    // ** https://firebase.google.com/docs/firestore/query-data/listen
    const orderCreatorId = this.activatedRoute.snapshot.params['creatorId'];

    await this.userService.getUserWithId(orderCreatorId ?? '').then((val) => {
      if (val) {
        this.orderCreator = val;
      }
    });
  }

  ngOnInit() {
    this.getOrders(new Date());
  }
}

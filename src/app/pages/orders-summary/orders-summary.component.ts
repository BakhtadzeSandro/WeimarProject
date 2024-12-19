import { Component, inject, OnInit } from '@angular/core';
import { OrderService } from '../../services/order.service';
import { GroupedOrders, Order } from '../../models/order.model';
import { OrderCardComponent } from '../../components/order-card/order-card.component';
import { CommonModule } from '@angular/common';
import { isEqual } from 'lodash';

@Component({
  selector: 'app-orders-summary',
  templateUrl: './orders-summary.component.html',
  styleUrls: ['./orders-summary.component.scss'],
  standalone: true,
  imports: [OrderCardComponent, CommonModule],
  providers: [OrderService],
})
export class OrdersSummaryComponent implements OnInit {
  private orderService = inject(OrderService);
  private _originalOrders: Order[] | undefined;
  deliveryPrice = 4;
  allOrdersLength: number | undefined;

  similarOrdersFromDifferentUsers: any[] | undefined = [];

  orders: GroupedOrders[] | undefined;

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

  ngOnInit() {
    const today = new Date();
    const formattedDate = `${
      today.getMonth() + 1
    }-${today.getDate()}-${today.getFullYear()}`;
    this.orderService.retrieveOrders(formattedDate).then((orders) => {
      this._originalOrders = orders;
      this.orders = this.groupOrders(orders);
      this.allOrdersLength = orders.length;
    });
  }
}

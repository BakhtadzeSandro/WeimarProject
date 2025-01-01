import { Component, inject, OnInit } from '@angular/core';
import { OrderService } from '../../services/order.service';
import { OrderCreatorUser } from '../../models/order.model';
import { Router } from '@angular/router';
import { or } from 'firebase/firestore';

@Component({
  selector: 'app-all-orders',
  standalone: true,
  imports: [],
  templateUrl: './all-orders.component.html',
  styleUrl: './all-orders.component.scss',
  providers: [OrderService, Router],
})
export class AllOrdersComponent implements OnInit {
  private orderService = inject(OrderService);
  private router = inject(Router);
  orderCreators: OrderCreatorUser[] = [];

  clickOrderGroup(orderCreator: OrderCreatorUser) {
    console.log(orderCreator);
    this.orderService.orderCreator = orderCreator;
    console.log(this.orderService.orderCreator);
    this.router.navigate(['order']);
  }

  getOrders(date: Date | undefined) {
    if (date) {
      const formattedDate = `${
        date.getMonth() + 1
      }-${date.getDate()}-${date.getFullYear()}`;
      this.orderService.retrieveOrders(formattedDate).then((orders) => {
        this.orderCreators = orders
          .filter(
            (order, index, self) =>
              index === self.findIndex((o) => o.createdBy === order.createdBy)
          )
          .map((o) => ({
            createdBy: o.createdBy ?? '',
            creatorPhotoUrl: o.creatorPhotoUrl ?? '',
          }));
        console.log(this.orderCreators);
      });
    }
  }

  ngOnInit() {
    this.getOrders(new Date('12-27-2024'));
  }
}

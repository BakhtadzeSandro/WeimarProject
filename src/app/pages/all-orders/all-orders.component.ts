import { Component, inject, OnInit } from '@angular/core';
import { OrderService } from '../../services/order.service';
import { Order, OrderCreatorUser } from '../../models/order.model';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-all-orders',
  standalone: true,
  imports: [],
  templateUrl: './all-orders.component.html',
  styleUrl: './all-orders.component.scss',
  providers: [Router],
})
export class AllOrdersComponent implements OnInit {
  private orderService = inject(OrderService);
  private router = inject(Router);
  orderCreators: OrderCreatorUser[] = [];
  authService = inject(AuthService);

  constructor() {}

  clickOrderGroup(orderCreator: OrderCreatorUser) {
    this.router.navigate(['order/' + orderCreator.creatorId]);
  }

  createNewGroup() {
    // TODO: Not let the user create a new group if they already have one or allow them to remove their current group
    return this.authService
      .getCurrentUser()
      .pipe(
        switchMap((val) => {
          const payload: Order = {
            orderedBy: val?.displayName,
            photoUrl: val?.photoURL,
            productDetails: {
              withEverything: false,
              restrictions: [],
              adjustment: [],
              size: '',
              price: 0,
            },
            createdBy: val?.displayName,
            creatorPhotoUrl: val?.photoURL,
            creatorId: val?.uid,
          };

          return this.orderService.createNewGroup(payload);
        })
      )
      .subscribe();
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
              index === self.findIndex((o) => o.creatorId === order.creatorId)
          )
          .map((o) => ({
            createdBy: o.createdBy ?? '',
            creatorPhotoUrl: o.creatorPhotoUrl ?? '',
            creatorId: o.creatorId ?? '',
          }));
      });
    }
  }

  ngOnInit() {
    this.getOrders(new Date('12-27-2024'));
  }
}

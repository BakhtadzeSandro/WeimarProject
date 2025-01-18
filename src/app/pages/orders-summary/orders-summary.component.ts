import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { isEqual } from 'lodash';
import { ToastrService } from 'ngx-toastr';
import { of, switchMap } from 'rxjs';
import { OrderCardComponent } from '../../components/index';
import { FirestoreUser, GroupedOrders, Order } from '../../models/index';
import { AuthService, OrderService, UsersService } from '../../services/index';
import { formatDateToDocName } from '../../utils/date.utils';

@Component({
  selector: 'app-orders-summary',
  templateUrl: './orders-summary.component.html',
  styleUrls: ['./orders-summary.component.scss'],
  standalone: true,
  imports: [OrderCardComponent, CommonModule],
  providers: [OrderService, ToastrService],
})
export class OrdersSummaryComponent implements OnInit {
  // TODO: show weimar number

  private orderService = inject(OrderService);
  private userService = inject(UsersService);
  private authService = inject(AuthService);
  private toastr = inject(ToastrService);
  private router = inject(Router);
  private _originalOrders: Order[] | undefined;
  private activatedRoute = inject(ActivatedRoute);
  deliveryPrice = 4;
  allOrdersLength: number | undefined;

  selectedDate: Date | undefined;

  today = new Date();

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

  backToHomePage() {
    this.router.navigate(['/all-orders']);
  }

  copyToClipboard(n: string | number | undefined | null) {
    if (n) {
      navigator.clipboard.writeText(n.toString());
      this.toastr.success('Copied to clipboard');
    }
  }

  leaveGroup() {
    this.authService
      .getCurrentUser()
      .pipe(
        switchMap((user) => {
          const updatedOrders =
            this._originalOrders?.filter(
              (order) => order.orderedBy !== user?.displayName
            ) ?? [];
          this.orderService.leaveGroup(
            this.orderCreator?.id ?? '',
            updatedOrders,
            user?.uid === this.orderCreator?.id
          );

          return of(user);
        })
      )
      .subscribe(() => this.router.navigate(['/all-orders']));
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

  async getOrders() {
    await this.getOrderCreator();

    if (this.selectedDate) {
      this.orderService.listenToOrderUpdates(
        formatDateToDocName(this.selectedDate),
        (doc) => {
          const data = doc.data();
          if (data) {
            this._originalOrders = data[this.orderCreator?.id ?? ''] as Order[];
            this.allOrdersLength = this._originalOrders?.length;
            this.orders = this.groupOrders(this._originalOrders ?? []);
          }
        }
      );
    }
  }

  async getOrderCreator() {
    const orderCreatorId = this.activatedRoute.snapshot.params['creatorId'];

    await this.userService.getUserWithId(orderCreatorId ?? '').then((val) => {
      if (val) {
        this.orderCreator = val;
      }
    });
  }

  ngOnInit() {
    this.activatedRoute.queryParams.subscribe((params) => {
      this.selectedDate = params['date']
        ? new Date(params['date'])
        : new Date();
      this.getOrders();
    });
  }
}

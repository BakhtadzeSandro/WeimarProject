import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  input,
  OnInit,
} from '@angular/core';
import { TooltipModule } from 'primeng/tooltip';
import { GroupedOrders } from '../../models/order.model';

@Component({
  selector: 'app-order-card',
  templateUrl: './order-card.component.html',
  styleUrls: ['./order-card.component.scss'],
  standalone: true,
  imports: [CommonModule, TooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderCardComponent implements OnInit {
  order = input.required<GroupedOrders>();
  deliveryPrice = input.required<number | undefined>();
  totalOrders = input.required<number | undefined>();

  get totalPrice() {
    const orderValue = this.order();
    const deliveryPriceValue = this.deliveryPrice();
    const totalOrdersValue = this.totalOrders();

    if (
      orderValue?.productDetails.price !== undefined &&
      orderValue?.productDetails.price !== null &&
      deliveryPriceValue !== undefined &&
      totalOrdersValue !== undefined
    ) {
      return (
        (orderValue.productDetails.price +
          Math.round((deliveryPriceValue / totalOrdersValue) * 100) / 100) *
        orderValue.count
      );
    } else {
      return undefined;
    }
  }

  individualPrice(count: number) {
    if (this.totalPrice) {
      return this.totalPrice / count;
    } else {
      return;
    }
  }
  constructor() {}

  ngOnInit() {}
}

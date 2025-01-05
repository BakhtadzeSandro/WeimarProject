import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { DynamicDialogConfig } from 'primeng/dynamicdialog';
import { Order } from '../../models/order.model';

export interface PreviousOrderDialogData {
  previousOrder: Order;
}

@Component({
  selector: 'app-previous-order-modal',
  templateUrl: './previous-order-modal.component.html',
  styleUrls: ['./previous-order-modal.component.scss'],
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreviousOrderModalComponent implements OnInit {
  constructor(private config: DynamicDialogConfig<PreviousOrderDialogData>) {}

  data: Order | undefined;

  ngOnInit() {
    if (this.config.data?.previousOrder) {
      this.data = this.config?.data?.previousOrder;
    }
  }
}

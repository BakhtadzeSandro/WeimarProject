import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DatePickerModule } from 'primeng/datepicker';
import { of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { FirestoreUser } from '../../models/index';
import { AuthService, OrderService, UsersService } from '../../services/index';
import { formatDateToDocName } from '../../utils/date.utils';

@Component({
  selector: 'app-all-orders',
  standalone: true,
  imports: [DatePickerModule, FormsModule],
  templateUrl: './all-orders.component.html',
  styleUrl: './all-orders.component.scss',
  providers: [],
})
export class AllOrdersComponent implements OnInit {
  private orderService = inject(OrderService);
  private authService = inject(AuthService);
  private userService = inject(UsersService);
  private router = inject(Router);
  orderCreators: FirestoreUser[] = [];
  orderCreatorsIds: string[] | undefined;
  selectedDate: Date | undefined;

  constructor() {}

  retrieveOrdersForSpecificDate() {
    this.getCreators(this.selectedDate);
  }

  clickOrderGroup(orderCreator: FirestoreUser) {
    localStorage.setItem('orderCreator', JSON.stringify(orderCreator));
    this.router.navigate(['order/' + orderCreator.id]);
  }

  createNewGroup() {
    return this.authService
      .getCurrentUser()
      .pipe(
        switchMap((val) => {
          if (!val) return of(null);
          return this.orderService.createNewGroup(val.uid);
        })
      )
      .subscribe();
  }

  async getCreators(date: Date | undefined) {
    if (!date) return;

    try {
      this.orderService.listenToOrderUpdates(
        formatDateToDocName(date),
        async (doc) => {
          if (doc.exists()) {
            this.orderCreatorsIds = Object.keys(doc.data());

            const creatorPromises = this.orderCreatorsIds.map((id) =>
              this.userService.getUserWithId(id)
            );
            const creators = await Promise.all(creatorPromises);

            this.orderCreators = creators.filter(
              (creator) => creator !== undefined && creator !== null
            ) as FirestoreUser[];
          }
        }
      );
    } catch (error) {
      console.error('Error retrieving creators:', error);
    }
  }

  ngOnInit() {
    this.getCreators(new Date());
  }
}

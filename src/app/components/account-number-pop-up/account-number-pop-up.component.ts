import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { MultiSelectModule } from 'primeng/multiselect';
import { Select } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { of, switchMap } from 'rxjs';
import { BankOptions } from '../../models';
import {
  AccountNumberForm,
  SingleSelectOption,
} from '../../models/forms.model';
import { AuthService, OrderService, UsersService } from '../../services';

@Component({
  selector: 'app-account-number-pop-up',
  standalone: true,
  imports: [
    ButtonModule,
    MultiSelectModule,
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    TextareaModule,
    InputTextModule,
    ButtonModule,
    Select,
    InputNumberModule,
    MessageModule,
  ],
  templateUrl: './account-number-pop-up.component.html',
  styleUrl: './account-number-pop-up.component.scss',
})
export class AccountNumberPopUpComponent implements OnInit {
  bankOptions: SingleSelectOption[] = [];

  private userService = inject(UsersService);
  private authService = inject(AuthService);
  private orderService = inject(OrderService);
  private fb = inject(FormBuilder);

  accountNumberIsInvalid = false;
  personalNumberIsInvalid = false;
  orderForm = signal<FormGroup<AccountNumberForm>>(this.buildForm());

  buildForm() {
    return this.fb.group<AccountNumberForm>({
      bank: this.fb.control(null),
      personalNumber: this.fb.control(null),
      accountNumber: this.fb.control(''),
    });
  }

  mapBankOptions(bankOptions: BankOptions[]) {
    this.bankOptions = bankOptions.map((option) => ({
      label: option.shortName,
      value: option.shortName,
    }));
  }

  getBankOptions() {
    this.orderService.getBankOptions().then((val) => this.mapBankOptions(val));
  }

  submitForm() {
    if (this.orderForm().get('bank')?.value?.value === 'Personal number') {
      this.orderForm()
        .get('personalNumber')
        ?.setValidators(Validators.required);

      const v = this.orderForm().get('personalNumber')?.value;

      if (v && v.toString().length === 11 && this.orderForm().valid) {
        this.authService
          .getCurrentUser()
          .pipe(
            switchMap((user) => {
              this.userService.updateUser(user?.uid ?? '', {
                personalNumber: this.orderForm().get('personalNumber')?.value,
              });

              return of(user);
            }),
            switchMap((user) => {
              this.orderService.createNewGroup(user?.uid ?? '');
              return of(user);
            })
          )
          .subscribe();
      } else {
        this.personalNumberIsInvalid = true;
      }
      return;
    }

    this.orderForm().get('accountNumber')?.setValidators(Validators.required);

    if (
      this.orderForm().get('accountNumber')?.value &&
      this.orderForm().get('accountNumber')?.value?.length === 22 &&
      this.orderForm().valid
    ) {
      this.authService
        .getCurrentUser()
        .pipe(
          switchMap((user) => {
            this.userService.updateUser(user?.uid ?? '', {
              [this.orderForm().get('bank')?.value?.value === 'BOG'
                ? 'bogAccountNumber'
                : 'tbcAccountNumber']:
                this.orderForm().get('accountNumber')?.value,
            });

            return of(user);
          }),
          switchMap((user) => {
            this.orderService.createNewGroup(user?.uid ?? '');
            return of(user);
          })
        )
        .subscribe();
    }
    this.accountNumberIsInvalid = true;
  }

  ngOnInit(): void {
    this.getBankOptions();
  }
}

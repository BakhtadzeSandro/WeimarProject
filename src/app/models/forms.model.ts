import { FormControl } from '@angular/forms';

export interface OrderForm {
  size: FormControl<MultiselectOption | null | undefined>;
  restrictions: FormControl<MultiselectOption[] | null | undefined>;
  adjustments: FormControl<MultiselectOption[] | null | undefined>;
  orderedFor: FormControl<string | null>;
}

export interface MultiselectOption {
  label: string;
  value: string;
  price?: number;
  product?: string;
}

export interface AccountNumberForm {
  bank: FormControl<SingleSelectOption | null>;
  accountNumber: FormControl<string | null>;
  personalNumber: FormControl<number | null>;
}

export interface SingleSelectOption {
  label: string;
  value: string;
}

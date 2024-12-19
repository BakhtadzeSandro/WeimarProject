import { FormControl } from '@angular/forms';

export interface OrderForm {
  size: FormControl<MultiselectOption | null | undefined>;
  useLastOrder: FormControl<boolean | null>;
  restrictions: FormControl<MultiselectOption[] | null | undefined>;
  adjustments: FormControl<MultiselectOption[] | null | undefined>;
  withEverything: FormControl<boolean | null | undefined>;
}

export interface MultiselectOption {
  label: string;
  value: string;
  price?: number;
  product?: string;
}

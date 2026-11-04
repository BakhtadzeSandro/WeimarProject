import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { Unsubscribe } from '@angular/fire/firestore';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { finalize, switchMap, take } from 'rxjs';
import { IngredientIconComponent } from '../../components/ingredient-icon/ingredient-icon.component';
import { ShawarmaGraphicComponent } from '../../components/shawarma-graphic/shawarma-graphic.component';
import {
  FirestoreUser,
  MultiselectOption,
  Order,
  OrderForm,
} from '../../models/index';
import { AuthService, OrderService, UsersService } from '../../services/index';
import { formatDateToDocName } from '../../utils/date.utils';
import {
  buildLayers,
  GraphicLayer,
  ingredientOf,
  isLessAdjustment,
  sizeScale,
  toAdjustmentOptions,
  toRestrictionOptions,
  toSizeOptions,
} from '../../utils/graphic.utils';
import { describeOrder } from '../../utils/order.utils';

type ChipControl = 'restrictions' | 'adjustments';

@Component({
  selector: 'app-order',
  templateUrl: './order.component.html',
  styleUrls: ['./order.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    InputTextModule,
    ButtonModule,
    ShawarmaGraphicComponent,
    IngredientIconComponent,
  ],
  providers: [ToastrService],
})
export class OrderComponent implements OnInit, OnDestroy {
  private orderService = inject(OrderService);
  private userService = inject(UsersService);
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private toastr = inject(ToastrService);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);

  creatorId: string = this.activatedRoute.snapshot.params['creatorId'];

  previousOrder: Order | undefined;

  orderForm = signal<FormGroup<OrderForm>>(this.buildForm());

  ingredientOptions: MultiselectOption[] = [];
  productInfoOptions: MultiselectOption[] = [];
  ingredientAdjustmentOptions: MultiselectOption[] = [];
  orderCreator: FirestoreUser | undefined;
  submitting = false;
  menuLoaded = false;
  itemsSoFar: number | undefined;
  ordered = false;
  unsub: Unsubscribe | undefined;
  layers: GraphicLayer[] = [];
  describeOrder = describeOrder;
  ingredientOf = ingredientOf;
  isLessAdjustment = isLessAdjustment;

  constructor() {}

  get selectedSize() {
    return this.orderForm().controls.size.value;
  }

  get scale() {
    return sizeScale(this.productInfoOptions, this.selectedSize?.value);
  }

  get hasRestrictions() {
    return !!this.orderForm().controls.restrictions.value?.length;
  }

  navigateToOrdersList() {
    this.router.navigate([`order/${this.creatorId}/summary`]);
  }

  backToHomePage() {
    this.router.navigate(['/all-orders']);
  }

  selectSize(option: MultiselectOption) {
    this.orderForm().controls.size.setValue(option);
  }

  clearRestrictions() {
    this.orderForm().controls.restrictions.setValue([]);
  }

  isSelected(control: ChipControl, option: MultiselectOption) {
    return !!this.orderForm()
      .controls[control].value?.some((o) => o.value === option.value);
  }

  // One choice per ingredient: an adjustment replaces any restriction or other adjustment
  // of the same ingredient ("Extra sauce" drops "Less sauce"), a restriction replaces adjustments.
  toggle(control: ChipControl, option: MultiselectOption) {
    const controls = this.orderForm().controls;

    if (this.isSelected(control, option)) {
      controls[control].setValue(
        controls[control].value?.filter((o) => o.value !== option.value) ?? []
      );
      return;
    }

    const ingredient = ingredientOf(option);
    if (ingredient) {
      const clashing: ChipControl[] =
        control === 'restrictions'
          ? ['adjustments']
          : ['restrictions', 'adjustments'];
      clashing.forEach((name) =>
        controls[name].setValue(
          controls[name].value?.filter((o) => ingredientOf(o) !== ingredient) ??
            []
        )
      );
    }
    controls[control].setValue([...(controls[control].value ?? []), option]);
  }

  loadPreviousOrder() {
    const details = this.previousOrder?.productDetails;
    if (!details) return;

    const { size, restrictions, adjustments } = this.orderForm().controls;
    size.setValue(
      this.productInfoOptions.find((option) => option.value === details.size)
    );
    restrictions.setValue(
      this.ingredientOptions.filter((option) =>
        details.restrictions?.includes(option.value)
      )
    );
    adjustments.setValue(
      this.ingredientAdjustmentOptions.filter((option) =>
        details.adjustment?.includes(option.value)
      )
    );
  }

  buildForm() {
    return this.fb.group<OrderForm>({
      size: this.fb.control(null),
      restrictions: this.fb.control([]),
      adjustments: this.fb.control([]),
      orderedFor: this.fb.control(''),
    });
  }

  checkPreviousOrder() {
    const previousOrder = localStorage.getItem('previousOrder');
    if (previousOrder) {
      this.previousOrder = JSON.parse(previousOrder);
    }
  }

  submitOrder() {
    if (!this.selectedSize) {
      this.toastr.warning('Pick a size first');
      return;
    }

    this.submitting = true;
    this.authService
      .getCurrentUser()
      .pipe(
        take(1),
        switchMap((currentUser) => {
          const { size, restrictions, adjustments, orderedFor } =
            this.orderForm().controls;
          const forSomeoneElse = orderedFor.value?.trim() || null;
          const payload: Order = {
            id: crypto.randomUUID(),
            userId: currentUser?.uid,
            orderedBy: currentUser?.displayName,
            orderedFor: forSomeoneElse,
            photoUrl: currentUser?.photoURL,
            productDetails: {
              price: size.value?.price,
              size: size.value?.value,
              restrictions: restrictions.value?.map((val) => val.value),
              withEverything: !restrictions.value?.length,
              adjustment: adjustments.value?.map((val) => val.value),
            },
          };

          // "Use my last order" should only remember your own food.
          if (!forSomeoneElse) {
            localStorage.setItem('previousOrder', JSON.stringify(payload));
          }

          return this.orderService.submitOrder(payload, this.creatorId);
        }),
        finalize(() => (this.submitting = false))
      )
      .subscribe((result) => {
        if (!result) {
          this.toastr.error(
            'This group is closed or no longer exists',
            "Couldn't add your order"
          );
          this.router.navigate(['/all-orders']);
        }
      });
  }

  updateLayers() {
    const { restrictions, adjustments } = this.orderForm().controls;
    this.layers = buildLayers(
      this.ingredientOptions,
      this.ingredientAdjustmentOptions,
      restrictions.value?.map((option) => option.value),
      adjustments.value?.map((option) => option.value)
    );
  }

  loadMenu() {
    Promise.all([
      this.orderService.getProductSizesAndPrices(),
      this.orderService.getIngredientsData(),
      this.orderService.getIngredientAdjustmentsData(),
    ]).then(([sizes, ingredients, adjustments]) => {
      this.productInfoOptions = toSizeOptions(sizes);
      this.ingredientOptions = toRestrictionOptions(ingredients);
      this.ingredientAdjustmentOptions = toAdjustmentOptions(adjustments);
      this.menuLoaded = true;
      this.updateLayers();
    }, () => this.toastr.error('Reload the page to try again', "Couldn't load the menu"));
  }

  getOrderCreator() {
    this.userService.getUserWithId(this.creatorId ?? '').then((val) => {
      if (val) {
        this.orderCreator = val;
      }
    });
  }

  listenToGroup() {
    this.unsub = this.orderService.listenToOrderUpdates(
      formatDateToDocName(),
      (doc) => {
        const day = doc.data();
        this.itemsSoFar = day?.[this.creatorId]?.length ?? 0;
        this.ordered = !!day?.['orderedGroups']?.[this.creatorId];
      }
    );
  }

  get firstName(): string {
    return this.orderCreator?.name?.split(' ')[0] ?? '';
  }

  get forStepNo() {
    return !this.menuLoaded || this.ingredientAdjustmentOptions.length ? '04' : '03';
  }

  ngOnInit() {
    this.checkPreviousOrder();
    this.orderForm().valueChanges.subscribe(() => this.updateLayers());
    this.loadMenu();
    this.getOrderCreator();
    this.listenToGroup();
  }

  ngOnDestroy() {
    this.unsub?.();
  }
}

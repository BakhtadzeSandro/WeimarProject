export interface Ingredient {
  id: string;
  product: {
    ingredient: string;
    restriction: string;
  };
}

export interface IngredientAdjustment {
  id: string;
  product: {
    ingredient: string;
    adjustment: string[];
  };
}

export interface productInfo {
  id: string;
  productInfo: {
    size: string;
    price: number;
  };
}

export interface productDetails {
  withEverything: boolean | null | undefined;
  restrictions: string[] | undefined;
  adjustment: string[] | undefined;
  size: string | null | undefined;
  price: number | null | undefined;
}

export interface Order {
  id?: string | null | undefined;
  orderedBy: string | null | undefined;
  photoUrl: string | null | undefined;
  createdBy: string | null | undefined;
  creatorPhotoUrl: string | null | undefined;
  creatorId?: string | null | undefined;
  productDetails: productDetails;
}

export interface GroupedOrders {
  count: number;
  productDetails: productDetails;
  users: OrderUser[];
}

export interface OrderUser {
  orderedBy: string;
  photoUrl: string;
}

export interface OrderCreatorUser {
  createdBy: string;
  creatorPhotoUrl: string;
  creatorId: string;
}

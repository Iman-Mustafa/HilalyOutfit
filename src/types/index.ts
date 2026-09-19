export type ProductCategory = 'vyote' | 'suti' | 'wanaume' | 'wanawake' | 'viatu' | 'accessories';

export interface Product {
  id: string;
  name: string;
  category: 'suti' | 'wanaume' | 'wanawake' | 'viatu' | 'accessories';
  categoryLabel: string;
  price: number; // in TZS
  originalPrice?: number;
  description: string;
  image: string;
  images?: string[];
  sizes: string[];
  colors: { name: string; hex: string }[];
  inStock: boolean;
  rating: number;
  reviewsCount: number;
  badge?: string;
  featured?: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize: string;
  selectedColor: string;
}

export interface User {
  id: string;
  name: string;
  phone: string;
  role: 'customer' | 'admin';
}

export interface CustomerInfo {
  fullName: string;
  phone: string;
  email?: string;
  region?: string;
  district: string; // mahali pa kupokelea mzigo
  deliveryNotes?: string;
}

/** Snapshot of a product as it was when the order was placed */
export type OrderItemProduct = Pick<Product, 'id' | 'name' | 'category' | 'categoryLabel' | 'price' | 'image'>;

export interface OrderItem {
  product: OrderItemProduct;
  quantity: number;
  selectedSize: string;
  selectedColor: string;
}

/** 'other': the network could not be named from the number; the gateway routes the payment by phone number */
export type PaymentProvider = 'tigopesa' | 'mpesa' | 'airtel' | 'halopesa' | 'other';

export interface PaymentProviderInfo {
  id: PaymentProvider;
  name: string;
  ussdName: string;
  color: string;
  badgeBg: string;
  prefix: string[];
  logoText: string;
  instructions: string;
}

export type PaymentStatus = 'pending' | 'processing' | 'successful' | 'failed' | 'cancelled';

export interface Transaction {
  id: string; // e.g. HLY-TZ-98412
  customer: CustomerInfo;
  items: OrderItem[];
  amount: number;
  currency: 'TZS';
  provider: PaymentProvider;
  paymentPhone: string;
  status: PaymentStatus;
  createdAt: string;
  updatedAt: string;
  gatewayRef?: string;
  failureReason?: string;
}

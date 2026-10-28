export type CountryCode = 'BD';
export type CurrencyCode = 'BDT';

export interface ProductVariant {
  id: string;
  size: string;
  color: string;
  colorHex?: string;
  stock: number;
  skuVariant: string;
  priceOverrideBDT?: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  productType?: 'simple' | 'variable';
  ribbonText?: string;
  brand: string;
  category: string;
  gender: 'men' | 'women' | 'unisex' | 'kids';
  description: string;
  images: string[];
  regularPriceBDT: number;
  salePriceBDT?: number;
  isFeatured: boolean;
  isBestSeller: boolean;
  isPublished: boolean;
  variants: ProductVariant[];
  specifications: Record<string, string>;
  rating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  displayOrder: number;
  isFeatured: boolean;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
}

export interface CartItem {
  productId: string;
  productName: string;
  productSlug: string;
  sku: string;
  image: string;
  size: string;
  color: string;
  quantity: number;
  priceBDT: number;
  maxStock: number;
}

export interface Address {
  id: string;
  fullName: string;
  phone: string;
  address: string;
  city: string;
  stateDivision: string;
  postalCode: string;
  country: 'BD';
  isDefault: boolean;
}

export interface CustomerUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  country: 'BD';
  role: 'customer' | 'admin';
  addresses: Address[];
}

export interface OrderItem {
  productId: string;
  productName: string;
  productSku: string;
  image: string;
  size: string;
  color: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  currency: 'BDT';
}

export interface OrderNotification {
  id: string;
  channel: 'email' | 'sms';
  event: 'order_placed' | 'payment_confirmed' | 'status_updated';
  recipient: string;
  subject?: string;
  message: string;
  status: 'sent' | 'dispatched';
  provider: string;
  previewUrl?: string;
  sentAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId?: string;
  isGuest: boolean;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: {
    fullName: string;
    phone: string;
    address: string;
    city: string;
    stateDivision: string;
    postalCode: string;
    country: 'BD';
    deliveryInstructions?: string;
  };
  items: OrderItem[];
  currency: 'BDT';
  subtotal: number;
  discount: number;
  couponCode?: string;
  shippingCharge: number;
  tax: number;
  grandTotal: number;
  shippingMethod: string;
  paymentMethod: 'cod' | 'bkash' | 'nagad' | 'rocket' | 'sslcommerz' | 'card';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  orderStatus: 'pending_payment' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'return_requested' | 'returned';
  transactionRef?: string;
  trackingNumber?: string;
  courierName?: string;
  internalNotes?: string;
  notifications?: OrderNotification[];
  auditLog: Array<{ timestamp: string; action: string; note: string; actor: string }>;
  cancellationReason?: string;
  returnReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount?: number;
  startDate: string;
  expiryDate: string;
  usageLimit: number;
  timesUsed: number;
  countryRestriction: 'BD';
  isActive: boolean;
}

export interface Review {
  id: string;
  productId: string;
  userName: string;
  userCountry: 'BD';
  rating: number;
  title: string;
  comment: string;
  isVerifiedPurchase: boolean;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: 'new' | 'read' | 'resolved';
  createdAt: string;
}

export interface StoreSettings {
  storeName: string;
  logoUrl?: string;
  storeTagline: string;
  supportEmail: string;
  supportPhone: string;
  whatsappNumber: string;
  announcementText: string;
  announcementEnabled: boolean;
  shippingBD: {
    insideDhaka: number;
    outsideDhaka: number;
    freeShippingThreshold: number;
  };
  paymentGateways: {
    bkashEnabled: boolean;
    bkashSandbox: boolean;
    nagadEnabled: boolean;
    nagadSandbox: boolean;
    rocketEnabled: boolean;
    rocketSandbox: boolean;
    sslcommerzEnabled: boolean;
    sslcommerzSandbox: boolean;
    codEnabledBD: boolean;
  };
  heroBanner: {
    title: string;
    subtitle: string;
    ctaText: string;
    ctaLink: string;
    imageUrl: string;
  };
  notifications?: {
    emailEnabled: boolean;
    smsEnabled: boolean;
    senderName: string;
    adminAlertEmail?: string;
    adminAlertPhone?: string;
    notifyAdminOnNewOrder?: boolean;
    notifyAdminOnNewUser?: boolean;
    ntfyTopic?: string;
    smsGatewayUrl?: string;
    smsApiKey?: string;
    smsSenderId?: string;
  };
  maintenanceMode: boolean;
}

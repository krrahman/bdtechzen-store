import fs from 'fs';
import os from 'os';
import path from 'path';
import crypto from 'crypto';
import { initMySqlAndHydrate, syncDatabaseToMySql } from './mysql.js';

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

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  country: 'BD';
  role: 'customer' | 'admin';
  passwordHash: string;
  salt: string;
  mustChangePassword?: boolean;
  addresses: Address[];
  createdAt: string;
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
  userId?: string;
  userName: string;
  userCountry: 'BD';
  rating: number;
  title: string;
  comment: string;
  isVerifiedPurchase: boolean;
  status: 'pending' | 'approved' | 'rejected';
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

export interface DatabaseSchema {
  schemaVersion?: string;
  products: Product[];
  categories: Category[];
  brands: Brand[];
  users: User[];
  orders: Order[];
  coupons: Coupon[];
  reviews: Review[];
  settings: StoreSettings;
  contactSubmissions: ContactSubmission[];
  wishlists: Record<string, string[]>;
}

const SCHEMA_VERSION = 'bdtechzen_en_v7';
const IS_SERVERLESS = Boolean(
  process.env.NETLIFY ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.LAMBDA_TASK_ROOT ||
    process.env.VERCEL
);
const BUNDLED_DB_FILE = path.resolve(process.cwd(), '.data', 'store.json');
const SEED_DB_FILE = path.resolve(process.cwd(), 'seed', 'store.json');
const DATA_DIR = IS_SERVERLESS
  ? path.join(os.tmpdir(), 'bdtechzen-data')
  : path.resolve(process.cwd(), '.data');
const DB_FILE = path.join(DATA_DIR, 'store.json');

let inMemoryData: DatabaseSchema | null = null;
let writeQueue: Promise<void> = Promise.resolve();

export function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

export function generateInitialAdmin(): User {
  const salt = 'bdtechzen_admin_salt_2026';
  const passwordHash = hashPassword('kr123456', salt);
  return {
    id: 'user_admin_krrahman',
    name: 'krrahman',
    email: 'krrahman@bdtechzen.com',
    phone: '+8801623604635',
    country: 'BD',
    role: 'admin',
    passwordHash,
    salt,
    mustChangePassword: false,
    addresses: [],
    createdAt: new Date().toISOString()
  };
}

const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'cat_men',
    name: "Men's Footwear",
    slug: 'mens-shoes',
    description: 'Hand-burnished full-grain leather Oxfords, penny loafers, and tailored footwear.',
    image: '/src/assets/images/product_oxford_dress_shoe_1792775360783.jpg',
    displayOrder: 1,
    isFeatured: true
  },
  {
    id: 'cat_women',
    name: "Women's Footwear",
    slug: 'womens-shoes',
    description: 'Sculpted Napa leather mules, horsebit loafers, and featherweight daily sneakers.',
    image: '/src/assets/images/product_womens_leather_mule_1792775364104.jpg',
    displayOrder: 2,
    isFeatured: true
  },
  {
    id: 'cat_sneakers',
    name: 'Lifestyle Sneakers',
    slug: 'sneakers',
    description: 'Italian court low-tops, monochrome high-tops, and architectural street silhouettes.',
    image: '/src/assets/images/product_high_top_sneaker_1792775362853.jpg',
    displayOrder: 3,
    isFeatured: true
  },
  {
    id: 'cat_sports',
    name: 'Sports & Running',
    slug: 'sports-running',
    description: 'Carbon-plated marathon racers and supercritical nitrogen-foam road trainers.',
    image: '/src/assets/images/product_trail_marathon_shoe_1792775363886.jpg',
    displayOrder: 4,
    isFeatured: true
  },
  {
    id: 'cat_formal',
    name: 'Formal Leather',
    slug: 'formal-shoes',
    description: 'Cap-toe Oxfords, hand-stitched penny loafers, and executive ceremony dress shoes.',
    image: '/src/assets/images/product_penny_loafer_tan_1792775363081.jpg',
    displayOrder: 5,
    isFeatured: true
  },
  {
    id: 'cat_casual',
    name: 'Casual & Boots',
    slug: 'casual-shoes',
    description: 'Weather-sealed suede Chelsea boots and relaxed weekend moccasins.',
    image: '/src/assets/images/product_chelsea_boots_1792739008903.jpg',
    displayOrder: 6,
    isFeatured: true
  },
  {
    id: 'cat_sandals',
    name: 'Sandals & Slides',
    slug: 'sandals-slippers',
    description: 'Anatomical cork-footbed nubuck slides engineered for warm humid climates.',
    image: '/src/assets/images/product_leather_sandal_1792769000370.jpg',
    displayOrder: 7,
    isFeatured: false
  },
  {
    id: 'cat_kids',
    name: "Kids' Footwear",
    slug: 'kids-shoes',
    description: 'Flexible non-marking athletic runners and reinforced everyday footwear.',
    image: '/src/assets/images/product_urban_runner_1792739007692.jpg',
    displayOrder: 8,
    isFeatured: false
  }
];

const DEFAULT_BRANDS: Brand[] = [
  { id: 'b_techzen', name: 'BDTechZen Originals', slug: 'bdtechzen-originals' },
  { id: 'b_artisano', name: 'Artisano Leathercraft', slug: 'artisano' },
  { id: 'b_velox', name: 'Velox Performance', slug: 'velox' },
  { id: 'b_urbanstride', name: 'Urban Stride', slug: 'urban-stride' },
  { id: 'b_aerofit', name: 'AeroFit Athletics', slug: 'aerofit' }
];

const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 'prod_apex_violet',
    name: 'BDTechZen Apex Carbon-Violet Runner',
    slug: 'bdtechzen-apex-carbon-violet-runner',
    sku: 'BDTZ-APX-001',
    productType: 'variable',
    ribbonText: 'Flagship Drop',
    brand: 'BDTechZen Originals',
    category: 'sports-running',
    gender: 'unisex',
    description:
      'Engineered with a full-length propulsion plate and nitrogen-infused supercritical midsole. Breathable Matte-Onyx monofilament mesh with signature BDTechZen Violet heel stabilizer delivers zero-fatigue cushioning on city pavement.',
    images: [
      '/src/assets/images/hero_bdtechzen_flagship_1792768997575.jpg',
      '/src/assets/images/product_trail_marathon_shoe_1792775363886.jpg',
      '/src/assets/images/product_urban_runner_1792739007692.jpg'
    ],
    regularPriceBDT: 5600,
    salePriceBDT: 4790,
    isFeatured: true,
    isBestSeller: true,
    isPublished: true,
    variants: [
      { id: 'v_apx_1', size: '40', color: 'Obsidian / Violet', colorHex: '#6d28d9', stock: 14, skuVariant: 'BDTZ-APX-001-40-VIO' },
      { id: 'v_apx_2', size: '41', color: 'Obsidian / Violet', colorHex: '#6d28d9', stock: 18, skuVariant: 'BDTZ-APX-001-41-VIO' },
      { id: 'v_apx_3', size: '42', color: 'Obsidian / Violet', colorHex: '#6d28d9', stock: 22, skuVariant: 'BDTZ-APX-001-42-VIO' },
      { id: 'v_apx_4', size: '43', color: 'Obsidian / Violet', colorHex: '#6d28d9', stock: 15, skuVariant: 'BDTZ-APX-001-43-VIO' },
      { id: 'v_apx_5', size: '44', color: 'Obsidian / Violet', colorHex: '#6d28d9', stock: 9, skuVariant: 'BDTZ-APX-001-44-VIO' },
      { id: 'v_apx_6', size: '41', color: 'Stealth Black', colorHex: '#18181b', stock: 11, skuVariant: 'BDTZ-APX-001-41-BLK' },
      { id: 'v_apx_7', size: '42', color: 'Stealth Black', colorHex: '#18181b', stock: 16, skuVariant: 'BDTZ-APX-001-42-BLK' },
      { id: 'v_apx_8', size: '43', color: 'Stealth Black', colorHex: '#18181b', stock: 10, skuVariant: 'BDTZ-APX-001-43-BLK' },
      { id: 'v_apx_9', size: '42', color: 'Carbon Pro Edition', colorHex: '#4c1d95', stock: 7, skuVariant: 'BDTZ-APX-001-42-PRO', priceOverrideBDT: 5190 },
      { id: 'v_apx_10', size: '43', color: 'Carbon Pro Edition', colorHex: '#4c1d95', stock: 6, skuVariant: 'BDTZ-APX-001-43-PRO', priceOverrideBDT: 5190 }
    ],
    specifications: {
      'Upper Material': 'Breathable engineered monofilament jacquard mesh',
      'Midsole Tech': 'Supercritical nitrogen foam + propulsion plate',
      'Outsole': 'High-abrasion wet-grip carbon rubber',
      'Weight': '218g (EU Size 42)',
      'Warranty': '7-Day Easy Doorstep Size Exchange'
    },
    rating: 4.9,
    reviewCount: 46,
    createdAt: '2026-10-23T08:00:00Z',
    updatedAt: '2026-10-23T08:00:00Z'
  },
  {
    id: 'prod_mayfair_oxford',
    name: 'Artisano Mayfair Cap-Toe Calfskin Oxford',
    slug: 'artisano-mayfair-cap-toe-calfskin-oxford',
    sku: 'ART-OXF-010',
    productType: 'variable',
    ribbonText: 'Atelier Reserve',
    brand: 'Artisano Leathercraft',
    category: 'formal-shoes',
    gender: 'men',
    description:
      'Closed-channel Blake-stitched formal cap-toe Oxford sculpted from full-grain European box calfskin. Hand-mirror-polished toe box and vegetable-tanned leather insole mold effortlessly to executive attire.',
    images: [
      '/src/assets/images/product_oxford_dress_shoe_1792775360783.jpg',
      '/src/assets/images/category_men_shoes_1792739006791.jpg'
    ],
    regularPriceBDT: 7800,
    salePriceBDT: 6690,
    isFeatured: true,
    isBestSeller: true,
    isPublished: true,
    variants: [
      { id: 'v_oxf_1', size: '40', color: 'Obsidian Calfskin', colorHex: '#09090b', stock: 10, skuVariant: 'ART-OXF-010-40-BLK' },
      { id: 'v_oxf_2', size: '41', color: 'Obsidian Calfskin', colorHex: '#09090b', stock: 14, skuVariant: 'ART-OXF-010-41-BLK' },
      { id: 'v_oxf_3', size: '42', color: 'Obsidian Calfskin', colorHex: '#09090b', stock: 18, skuVariant: 'ART-OXF-010-42-BLK' },
      { id: 'v_oxf_4', size: '43', color: 'Obsidian Calfskin', colorHex: '#09090b', stock: 12, skuVariant: 'ART-OXF-010-43-BLK' },
      { id: 'v_oxf_5', size: '44', color: 'Obsidian Calfskin', colorHex: '#09090b', stock: 8, skuVariant: 'ART-OXF-010-44-BLK' },
      { id: 'v_oxf_6', size: '41', color: 'Dark Espresso Patina', colorHex: '#3b1d0e', stock: 9, skuVariant: 'ART-OXF-010-41-ESP', priceOverrideBDT: 6950 },
      { id: 'v_oxf_7', size: '42', color: 'Dark Espresso Patina', colorHex: '#3b1d0e', stock: 11, skuVariant: 'ART-OXF-010-42-ESP', priceOverrideBDT: 6950 },
      { id: 'v_oxf_8', size: '43', color: 'Dark Espresso Patina', colorHex: '#3b1d0e', stock: 7, skuVariant: 'ART-OXF-010-43-ESP', priceOverrideBDT: 6950 }
    ],
    specifications: {
      'Upper Leather': '100% Full-grain European box calfskin',
      'Construction': 'Blake-stitched leather outsole with anti-slip heel insert',
      'Lining': 'Full breathable natural glove calfskin',
      'Insole': 'High-density leather-topped orthotic arch bed'
    },
    rating: 5.0,
    reviewCount: 34,
    createdAt: '2026-10-23T07:55:00Z',
    updatedAt: '2026-10-23T07:55:00Z'
  },
  {
    id: 'prod_skyline_hightop',
    name: 'BDTechZen Skyline Violet-Slate High-Top',
    slug: 'bdtechzen-skyline-violet-slate-high-top',
    sku: 'BDTZ-SKY-011',
    productType: 'variable',
    ribbonText: 'New Arrival',
    brand: 'BDTechZen Originals',
    category: 'sneakers',
    gender: 'unisex',
    description:
      'Architectural high-top street sneaker combining tumbled chalk-white grain leather, charcoal suede overlays, and subtle royal-violet trim over a 360-stitched cupsole.',
    images: [
      '/src/assets/images/product_high_top_sneaker_1792775362853.jpg',
      '/src/assets/images/product_court_sneaker_1792769000669.jpg'
    ],
    regularPriceBDT: 5400,
    salePriceBDT: 4650,
    isFeatured: true,
    isBestSeller: false,
    isPublished: true,
    variants: [
      { id: 'v_sky_1', size: '39', color: 'Chalk / Slate / Violet', colorHex: '#6d28d9', stock: 9, skuVariant: 'BDTZ-SKY-011-39-SLV' },
      { id: 'v_sky_2', size: '40', color: 'Chalk / Slate / Violet', colorHex: '#6d28d9', stock: 15, skuVariant: 'BDTZ-SKY-011-40-SLV' },
      { id: 'v_sky_3', size: '41', color: 'Chalk / Slate / Violet', colorHex: '#6d28d9', stock: 19, skuVariant: 'BDTZ-SKY-011-41-SLV' },
      { id: 'v_sky_4', size: '42', color: 'Chalk / Slate / Violet', colorHex: '#6d28d9', stock: 16, skuVariant: 'BDTZ-SKY-011-42-SLV' },
      { id: 'v_sky_5', size: '43', color: 'Chalk / Slate / Violet', colorHex: '#6d28d9', stock: 11, skuVariant: 'BDTZ-SKY-011-43-SLV' },
      { id: 'v_sky_6', size: '41', color: 'Triple Onyx Suede', colorHex: '#18181b', stock: 10, skuVariant: 'BDTZ-SKY-011-41-ONX' },
      { id: 'v_sky_7', size: '42', color: 'Triple Onyx Suede', colorHex: '#18181b', stock: 12, skuVariant: 'BDTZ-SKY-011-42-ONX' }
    ],
    specifications: {
      'Upper': 'Tumbled calfskin leather + water-resistant charcoal nubuck',
      'Collar': 'Plush memory-foam padded ankle support',
      'Outsole': 'Sidewall-stitched dual-density court rubber'
    },
    rating: 4.9,
    reviewCount: 27,
    createdAt: '2026-10-23T07:50:00Z',
    updatedAt: '2026-10-23T07:50:00Z'
  },
  {
    id: 'prod_florence_penny_loafer',
    name: 'Artisano Florence Cognac Penny Loafer',
    slug: 'artisano-florence-cognac-penny-loafer',
    sku: 'ART-FLR-012',
    productType: 'variable',
    ribbonText: 'Hand-Burnished',
    brand: 'Artisano Leathercraft',
    category: 'formal-shoes',
    gender: 'men',
    description:
      'Timeless Italian apron-stitched penny loafer crafted from antique-burnished cognac calfskin. Unstructured forefoot flexes naturally from smart linen ensembles to tailored suits.',
    images: [
      '/src/assets/images/product_penny_loafer_tan_1792775363081.jpg',
      '/src/assets/images/product_leather_loafer_1792768998636.jpg'
    ],
    regularPriceBDT: 6400,
    salePriceBDT: 5490,
    isFeatured: true,
    isBestSeller: true,
    isPublished: true,
    variants: [
      { id: 'v_flr_1', size: '40', color: 'Antique Cognac', colorHex: '#92400e', stock: 11, skuVariant: 'ART-FLR-012-40-COG' },
      { id: 'v_flr_2', size: '41', color: 'Antique Cognac', colorHex: '#92400e', stock: 15, skuVariant: 'ART-FLR-012-41-COG' },
      { id: 'v_flr_3', size: '42', color: 'Antique Cognac', colorHex: '#92400e', stock: 17, skuVariant: 'ART-FLR-012-42-COG' },
      { id: 'v_flr_4', size: '43', color: 'Antique Cognac', colorHex: '#92400e', stock: 10, skuVariant: 'ART-FLR-012-43-COG' },
      { id: 'v_flr_5', size: '41', color: 'Burgundy Cordovan Finish', colorHex: '#4c0519', stock: 8, skuVariant: 'ART-FLR-012-41-BRG', priceOverrideBDT: 5790 },
      { id: 'v_flr_6', size: '42', color: 'Burgundy Cordovan Finish', colorHex: '#4c0519', stock: 9, skuVariant: 'ART-FLR-012-42-BRG', priceOverrideBDT: 5790 }
    ],
    specifications: {
      'Upper': 'Hand-burnished Italian vegetable-tanned calfskin',
      'Apron Stitch': 'Waxed linen hand-sewn moccasin seam',
      'Sole': 'Stacked leather heel with recessed rubber grip pad'
    },
    rating: 4.9,
    reviewCount: 31,
    createdAt: '2026-10-23T07:45:00Z',
    updatedAt: '2026-10-23T07:45:00Z'
  },
  {
    id: 'prod_celeste_horsebit_mule',
    name: 'BDTechZen Celeste Napa Horsebit Mule',
    slug: 'bdtechzen-celeste-napa-horsebit-mule',
    sku: 'BDTZ-CLS-013',
    productType: 'variable',
    ribbonText: 'Women’s Atelier',
    brand: 'BDTechZen Originals',
    category: 'womens-shoes',
    gender: 'women',
    description:
      'Butter-soft ivory Napa calfskin backless loafer mule adorned with brushed 18k-tone equestrian hardware and a 15mm stacked wood heel for effortless studio-to-evening elegance.',
    images: [
      '/src/assets/images/product_womens_leather_mule_1792775364104.jpg',
      '/src/assets/images/category_women_sneakers_1792739007245.jpg'
    ],
    regularPriceBDT: 4800,
    salePriceBDT: 4150,
    isFeatured: true,
    isBestSeller: true,
    isPublished: true,
    variants: [
      { id: 'v_cls_1', size: '36', color: 'Ivory Cream Napa', colorHex: '#f5f5f4', stock: 12, skuVariant: 'BDTZ-CLS-013-36-IVR' },
      { id: 'v_cls_2', size: '37', color: 'Ivory Cream Napa', colorHex: '#f5f5f4', stock: 16, skuVariant: 'BDTZ-CLS-013-37-IVR' },
      { id: 'v_cls_3', size: '38', color: 'Ivory Cream Napa', colorHex: '#f5f5f4', stock: 18, skuVariant: 'BDTZ-CLS-013-38-IVR' },
      { id: 'v_cls_4', size: '39', color: 'Ivory Cream Napa', colorHex: '#f5f5f4', stock: 14, skuVariant: 'BDTZ-CLS-013-39-IVR' },
      { id: 'v_cls_5', size: '40', color: 'Ivory Cream Napa', colorHex: '#f5f5f4', stock: 9, skuVariant: 'BDTZ-CLS-013-40-IVR' },
      { id: 'v_cls_6', size: '37', color: 'Noir Black Napa', colorHex: '#18181b', stock: 11, skuVariant: 'BDTZ-CLS-013-37-BLK' },
      { id: 'v_cls_7', size: '38', color: 'Noir Black Napa', colorHex: '#18181b', stock: 13, skuVariant: 'BDTZ-CLS-013-38-BLK' }
    ],
    specifications: {
      'Upper': 'Drum-dyed supple Napa lambskin & calfskin',
      'Hardware': 'Anti-tarnish brushed brass horsebit',
      'Footbed': 'Quilted memory-foam leather cushion'
    },
    rating: 4.9,
    reviewCount: 24,
    createdAt: '2026-10-23T07:40:00Z',
    updatedAt: '2026-10-23T07:40:00Z'
  },
  {
    id: 'prod_velocity_elite_marathon',
    name: 'Velox Marathon Elite 03 Nitrogen Racer',
    slug: 'velox-marathon-elite-03-nitrogen-racer',
    sku: 'VLX-MRT-014',
    productType: 'variable',
    ribbonText: 'Pro Performance',
    brand: 'Velox Performance',
    category: 'sports-running',
    gender: 'unisex',
    description:
      'Built for 10K and half-marathon PRs with pearl-grey open-cell engineered mesh, sculpted dual-chamber nitrogen foam, and a molded royal-violet external heel counter.',
    images: [
      '/src/assets/images/product_trail_marathon_shoe_1792775363886.jpg',
      '/src/assets/images/hero_bdtechzen_flagship_1792768997575.jpg'
    ],
    regularPriceBDT: 5900,
    salePriceBDT: 4990,
    isFeatured: true,
    isBestSeller: false,
    isPublished: true,
    variants: [
      { id: 'v_mrt_1', size: '39', color: 'Pearl Grey / Violet', colorHex: '#7c3aed', stock: 10, skuVariant: 'VLX-MRT-014-39-GRV' },
      { id: 'v_mrt_2', size: '40', color: 'Pearl Grey / Violet', colorHex: '#7c3aed', stock: 14, skuVariant: 'VLX-MRT-014-40-GRV' },
      { id: 'v_mrt_3', size: '41', color: 'Pearl Grey / Violet', colorHex: '#7c3aed', stock: 18, skuVariant: 'VLX-MRT-014-41-GRV' },
      { id: 'v_mrt_4', size: '42', color: 'Pearl Grey / Violet', colorHex: '#7c3aed', stock: 20, skuVariant: 'VLX-MRT-014-42-GRV' },
      { id: 'v_mrt_5', size: '43', color: 'Pearl Grey / Violet', colorHex: '#7c3aed', stock: 12, skuVariant: 'VLX-MRT-014-43-GRV' },
      { id: 'v_mrt_6', size: '44', color: 'Pearl Grey / Violet', colorHex: '#7c3aed', stock: 8, skuVariant: 'VLX-MRT-014-44-GRV' }
    ],
    specifications: {
      'Midsole': '38mm heel / 30mm forefoot Nitrogen-Foam stack',
      'Heel Lock': '3D-molded external TPU Violet heel cradle',
      'Weight': '209g ultra-lightweight race geometry'
    },
    rating: 4.9,
    reviewCount: 22,
    createdAt: '2026-10-23T07:35:00Z',
    updatedAt: '2026-10-23T07:35:00Z'
  },
  {
    id: 'prod_court_violet',
    name: 'BDTechZen Court Classic Leather Sneaker',
    slug: 'bdtechzen-court-classic-leather-sneaker',
    sku: 'BDTZ-CRT-002',
    productType: 'variable',
    ribbonText: 'Best Seller',
    brand: 'BDTechZen Originals',
    category: 'sneakers',
    gender: 'unisex',
    description:
      'Minimalist full-grain tumbled white calfskin low-top accented with a deep royal-violet Napa leather heel tab. Stitched Margom-style rubber cupsole built for crisp smart-casual styling.',
    images: [
      '/src/assets/images/product_court_sneaker_1792769000669.jpg',
      '/src/assets/images/product_high_top_sneaker_1792775362853.jpg'
    ],
    regularPriceBDT: 4500,
    salePriceBDT: 3890,
    isFeatured: true,
    isBestSeller: true,
    isPublished: true,
    variants: [
      { id: 'v_crt_1', size: '39', color: 'Chalk White / Violet', colorHex: '#7c3aed', stock: 10, skuVariant: 'BDTZ-CRT-002-39-WHT' },
      { id: 'v_crt_2', size: '40', color: 'Chalk White / Violet', colorHex: '#7c3aed', stock: 16, skuVariant: 'BDTZ-CRT-002-40-WHT' },
      { id: 'v_crt_3', size: '41', color: 'Chalk White / Violet', colorHex: '#7c3aed', stock: 20, skuVariant: 'BDTZ-CRT-002-41-WHT' },
      { id: 'v_crt_4', size: '42', color: 'Chalk White / Violet', colorHex: '#7c3aed', stock: 18, skuVariant: 'BDTZ-CRT-002-42-WHT' },
      { id: 'v_crt_5', size: '43', color: 'Chalk White / Violet', colorHex: '#7c3aed', stock: 11, skuVariant: 'BDTZ-CRT-002-43-WHT' },
      { id: 'v_crt_6', size: '41', color: 'Chalk White / Obsidian', colorHex: '#18181b', stock: 14, skuVariant: 'BDTZ-CRT-002-41-OBS' },
      { id: 'v_crt_7', size: '42', color: 'Chalk White / Obsidian', colorHex: '#18181b', stock: 15, skuVariant: 'BDTZ-CRT-002-42-OBS' }
    ],
    specifications: {
      'Upper Material': '100% Full-grain tumbled calfskin leather',
      'Heel Tab': 'Soft Napa leather in BDTechZen Violet',
      'Insole': 'Dual-density OrthoLite memory foam',
      'Construction': '360-degree sidewall-stitched cupsole'
    },
    rating: 4.9,
    reviewCount: 39,
    createdAt: '2026-10-22T12:00:00Z',
    updatedAt: '2026-10-22T12:00:00Z'
  },
  {
    id: 'prod_verona_wingtip',
    name: 'Artisano Verona Hand-Burnished Derby',
    slug: 'artisano-verona-hand-burnished-derby',
    sku: 'ART-VR-003',
    productType: 'variable',
    ribbonText: 'Save 13%',
    brand: 'Artisano Leathercraft',
    category: 'mens-shoes',
    gender: 'men',
    description:
      'Crafted from vegetable-tanned full-grain leather with hand-burnished cognac patina and classic brogue detailing. Supple calfskin lining molds naturally to your foot for boardroom and formal occasions.',
    images: [
      '/src/assets/images/category_men_shoes_1792739006791.jpg',
      '/src/assets/images/product_oxford_dress_shoe_1792775360783.jpg'
    ],
    regularPriceBDT: 7200,
    salePriceBDT: 6250,
    isFeatured: true,
    isBestSeller: true,
    isPublished: true,
    variants: [
      { id: 'v_vw_1', size: '40', color: 'Cognac Brown', colorHex: '#9a3412', stock: 8, skuVariant: 'ART-VR-003-40-COG' },
      { id: 'v_vw_2', size: '41', color: 'Cognac Brown', colorHex: '#9a3412', stock: 12, skuVariant: 'ART-VR-003-41-COG' },
      { id: 'v_vw_3', size: '42', color: 'Cognac Brown', colorHex: '#9a3412', stock: 14, skuVariant: 'ART-VR-003-42-COG' },
      { id: 'v_vw_4', size: '43', color: 'Cognac Brown', colorHex: '#9a3412', stock: 7, skuVariant: 'ART-VR-003-43-COG' },
      { id: 'v_vw_5', size: '41', color: 'Espresso Black', colorHex: '#1c1917', stock: 10, skuVariant: 'ART-VR-003-41-BLK' },
      { id: 'v_vw_6', size: '42', color: 'Espresso Black', colorHex: '#1c1917', stock: 12, skuVariant: 'ART-VR-003-42-BLK' }
    ],
    specifications: {
      'Upper': '100% Vegetable-tanned full-grain calf leather',
      'Lining': 'Breathable natural calfskin leather',
      'Outsole': 'Blake-stitched leather sole with rubber heel insert',
      'Finish': 'Hand-burnished Italian wax polish'
    },
    rating: 5.0,
    reviewCount: 28,
    createdAt: '2026-10-22T11:00:00Z',
    updatedAt: '2026-10-22T11:00:00Z'
  },
  {
    id: 'prod_chelsea_tan',
    name: 'BDTechZen Heritage Suede Chelsea Boot',
    slug: 'bdtechzen-heritage-suede-chelsea-boot',
    sku: 'BDTZ-CH-004',
    productType: 'variable',
    ribbonText: 'Limited Edition',
    brand: 'BDTechZen Originals',
    category: 'casual-shoes',
    gender: 'men',
    description:
      'Water-repellent Scotchgard-treated suede Chelsea boot set on a natural plantation crepe outsole. Elasticated twin gussets and woven pull-tabs ensure effortless slip-on comfort.',
    images: [
      '/src/assets/images/product_chelsea_boots_1792739008903.jpg',
      '/src/assets/images/product_penny_loafer_tan_1792775363081.jpg'
    ],
    regularPriceBDT: 6600,
    salePriceBDT: 5850,
    isFeatured: true,
    isBestSeller: false,
    isPublished: true,
    variants: [
      { id: 'v_ch_1', size: '40', color: 'Camel Sand Suede', colorHex: '#d97706', stock: 8, skuVariant: 'BDTZ-CH-004-40-SND' },
      { id: 'v_ch_2', size: '41', color: 'Camel Sand Suede', colorHex: '#d97706', stock: 12, skuVariant: 'BDTZ-CH-004-41-SND' },
      { id: 'v_ch_3', size: '42', color: 'Camel Sand Suede', colorHex: '#d97706', stock: 14, skuVariant: 'BDTZ-CH-004-42-SND' },
      { id: 'v_ch_4', size: '43', color: 'Camel Sand Suede', colorHex: '#d97706', stock: 9, skuVariant: 'BDTZ-CH-004-43-SND' },
      { id: 'v_ch_5', size: '42', color: 'Dark Chocolate Suede', colorHex: '#451a03', stock: 10, skuVariant: 'BDTZ-CH-004-42-CHC' },
      { id: 'v_ch_6', size: '43', color: 'Dark Chocolate Suede', colorHex: '#451a03', stock: 8, skuVariant: 'BDTZ-CH-004-43-CHC' }
    ],
    specifications: {
      'Upper': 'Hydrophobic Italian split suede leather',
      'Outsole': 'Natural plantation crepe rubber',
      'Lining': 'Full glove-soft cowhide lining'
    },
    rating: 4.9,
    reviewCount: 29,
    createdAt: '2026-10-21T15:00:00Z',
    updatedAt: '2026-10-21T15:00:00Z'
  },
  {
    id: 'prod_aura_trainer',
    name: 'Velox Aura Cloudfoam Women Sneaker',
    slug: 'velox-aura-cloudfoam-women-sneaker',
    sku: 'VLX-AU-005',
    productType: 'variable',
    ribbonText: 'Best Seller',
    brand: 'Velox Performance',
    category: 'womens-shoes',
    gender: 'women',
    description:
      'Sculpted specifically around an anatomical women last with featherweight Cloudfoam cushioning and breathable circular-knit upper for effortless daily movement.',
    images: [
      '/src/assets/images/category_women_sneakers_1792739007245.jpg',
      '/src/assets/images/product_womens_leather_mule_1792775364104.jpg'
    ],
    regularPriceBDT: 4400,
    salePriceBDT: 3790,
    isFeatured: false,
    isBestSeller: true,
    isPublished: true,
    variants: [
      { id: 'v_at_1', size: '36', color: 'Pearl White / Lavender', colorHex: '#c4b5fd', stock: 14, skuVariant: 'VLX-AU-005-36-LAV' },
      { id: 'v_at_2', size: '37', color: 'Pearl White / Lavender', colorHex: '#c4b5fd', stock: 16, skuVariant: 'VLX-AU-005-37-LAV' },
      { id: 'v_at_3', size: '38', color: 'Pearl White / Lavender', colorHex: '#c4b5fd', stock: 20, skuVariant: 'VLX-AU-005-38-LAV' },
      { id: 'v_at_4', size: '39', color: 'Pearl White / Lavender', colorHex: '#c4b5fd', stock: 15, skuVariant: 'VLX-AU-005-39-LAV' },
      { id: 'v_at_5', size: '40', color: 'Pearl White / Lavender', colorHex: '#c4b5fd', stock: 10, skuVariant: 'VLX-AU-005-40-LAV' },
      { id: 'v_at_6', size: '37', color: 'Blush Quartz', colorHex: '#f9a8d4', stock: 12, skuVariant: 'VLX-AU-005-37-BLS' },
      { id: 'v_at_7', size: '38', color: 'Blush Quartz', colorHex: '#f9a8d4', stock: 14, skuVariant: 'VLX-AU-005-38-BLS' }
    ],
    specifications: {
      'Upper': 'Seamless 3D circular knit + TPU heel clip',
      'Insole': 'Anti-microbial memory foam footbed',
      'Outsole': 'High-flex shock-absorbing EVA'
    },
    rating: 4.8,
    reviewCount: 42,
    createdAt: '2026-10-21T12:00:00Z',
    updatedAt: '2026-10-21T12:00:00Z'
  },
  {
    id: 'prod_monaco_loafer',
    name: 'Artisano Monaco Midnight Suede Loafer',
    slug: 'artisano-monaco-midnight-suede-loafer',
    sku: 'ART-MN-006',
    productType: 'variable',
    ribbonText: 'Handcrafted',
    brand: 'Artisano Leathercraft',
    category: 'formal-shoes',
    gender: 'men',
    description:
      'Unlined butter-soft midnight-navy suede Venetian loafer on a stacked leather-and-rubber dress heel. Tailored for smart trousers, linen suits, and evening receptions.',
    images: [
      '/src/assets/images/product_leather_loafer_1792768998636.jpg',
      '/src/assets/images/product_penny_loafer_tan_1792775363081.jpg'
    ],
    regularPriceBDT: 5600,
    salePriceBDT: 4890,
    isFeatured: false,
    isBestSeller: true,
    isPublished: true,
    variants: [
      { id: 'v_mn_1', size: '40', color: 'Midnight Navy Suede', colorHex: '#1e3a8a', stock: 9, skuVariant: 'ART-MN-006-40-NVY' },
      { id: 'v_mn_2', size: '41', color: 'Midnight Navy Suede', colorHex: '#1e3a8a', stock: 12, skuVariant: 'ART-MN-006-41-NVY' },
      { id: 'v_mn_3', size: '42', color: 'Midnight Navy Suede', colorHex: '#1e3a8a', stock: 15, skuVariant: 'ART-MN-006-42-NVY' },
      { id: 'v_mn_4', size: '43', color: 'Midnight Navy Suede', colorHex: '#1e3a8a', stock: 8, skuVariant: 'ART-MN-006-43-NVY' },
      { id: 'v_mn_5', size: '41', color: 'Charcoal Velvet Suede', colorHex: '#27272a', stock: 10, skuVariant: 'ART-MN-006-41-CHR' },
      { id: 'v_mn_6', size: '42', color: 'Charcoal Velvet Suede', colorHex: '#27272a', stock: 11, skuVariant: 'ART-MN-006-42-CHR' }
    ],
    specifications: {
      'Upper': 'Velvet-nap Italian suede leather',
      'Sole': 'Blake-stitched leather sole with anti-slip heel pad',
      'Profile': 'Classic unembellished Venetian vamp'
    },
    rating: 4.9,
    reviewCount: 23,
    createdAt: '2026-10-20T15:00:00Z',
    updatedAt: '2026-10-20T15:00:00Z'
  },
  {
    id: 'prod_stride_sandal',
    name: 'Urban Stride Cork & Nubuck Leather Slide',
    slug: 'urban-stride-cork-nubuck-leather-slide',
    sku: 'URB-SD-007',
    productType: 'variable',
    ribbonText: 'Everyday Essential',
    brand: 'Urban Stride',
    category: 'sandals-slippers',
    gender: 'unisex',
    description:
      'Anatomically contoured Portuguese cork-latex footbed paired with rich oiled saddle-brown nubuck leather straps. Shapes naturally to your arch for unmatched everyday comfort.',
    images: [
      '/src/assets/images/product_leather_sandal_1792769000370.jpg',
      '/src/assets/images/product_chelsea_boots_1792739008903.jpg'
    ],
    regularPriceBDT: 2450,
    salePriceBDT: 1990,
    isFeatured: false,
    isBestSeller: true,
    isPublished: true,
    variants: [
      { id: 'v_sd_1', size: '39', color: 'Saddle Tan Nubuck', colorHex: '#78350f', stock: 15, skuVariant: 'URB-SD-007-39-TAN' },
      { id: 'v_sd_2', size: '40', color: 'Saddle Tan Nubuck', colorHex: '#78350f', stock: 20, skuVariant: 'URB-SD-007-40-TAN' },
      { id: 'v_sd_3', size: '41', color: 'Saddle Tan Nubuck', colorHex: '#78350f', stock: 18, skuVariant: 'URB-SD-007-41-TAN' },
      { id: 'v_sd_4', size: '42', color: 'Saddle Tan Nubuck', colorHex: '#78350f', stock: 14, skuVariant: 'URB-SD-007-42-TAN' },
      { id: 'v_sd_5', size: '43', color: 'Saddle Tan Nubuck', colorHex: '#78350f', stock: 10, skuVariant: 'URB-SD-007-43-TAN' },
      { id: 'v_sd_6', size: '41', color: 'Matte Onyx Nubuck', colorHex: '#18181b', stock: 12, skuVariant: 'URB-SD-007-41-BLK' },
      { id: 'v_sd_7', size: '42', color: 'Matte Onyx Nubuck', colorHex: '#18181b', stock: 14, skuVariant: 'URB-SD-007-42-BLK' }
    ],
    specifications: {
      'Footbed': '100% Shock-absorbing natural cork & suede liner',
      'Upper Strap': 'Thick oiled pull-up nubuck leather',
      'Outsole': 'Lightweight traction-patterned EVA'
    },
    rating: 4.8,
    reviewCount: 34,
    createdAt: '2026-10-20T11:00:00Z',
    updatedAt: '2026-10-20T11:00:00Z'
  },
  {
    id: 'prod_horiz_runner',
    name: 'AeroFit Horizon Pro Urban Trainer',
    slug: 'aerofit-horizon-pro-urban-trainer',
    sku: 'AERO-HZ-008',
    productType: 'variable',
    ribbonText: 'Monsoon Grip',
    brand: 'AeroFit Athletics',
    category: 'mens-shoes',
    gender: 'men',
    description:
      'Versatile cross-training sneaker combining reinforced lateral stability cages with high-rebound dual-density cushioning and breathable open-weave mesh.',
    images: [
      '/src/assets/images/product_urban_runner_1792739007692.jpg',
      '/src/assets/images/hero_bdtechzen_flagship_1792768997575.jpg'
    ],
    regularPriceBDT: 4800,
    salePriceBDT: 4190,
    isFeatured: false,
    isBestSeller: false,
    isPublished: true,
    variants: [
      { id: 'v_hr_1', size: '40', color: 'Charcoal / White', colorHex: '#27272a', stock: 12, skuVariant: 'AERO-HZ-008-40-CHR' },
      { id: 'v_hr_2', size: '41', color: 'Charcoal / White', colorHex: '#27272a', stock: 15, skuVariant: 'AERO-HZ-008-41-CHR' },
      { id: 'v_hr_3', size: '42', color: 'Charcoal / White', colorHex: '#27272a', stock: 19, skuVariant: 'AERO-HZ-008-42-CHR' },
      { id: 'v_hr_4', size: '43', color: 'Charcoal / White', colorHex: '#27272a', stock: 11, skuVariant: 'AERO-HZ-008-43-CHR' },
      { id: 'v_hr_5', size: '44', color: 'Charcoal / White', colorHex: '#27272a', stock: 8, skuVariant: 'AERO-HZ-008-44-CHR' }
    ],
    specifications: {
      'Upper': 'Engineered ripstop mesh with TPU overlays',
      'Midsole': 'Dual-density responsive EVA',
      'Outsole': 'Multi-surface lugged wet-traction rubber'
    },
    rating: 4.7,
    reviewCount: 19,
    createdAt: '2026-10-19T14:00:00Z',
    updatedAt: '2026-10-19T14:00:00Z'
  },
  {
    id: 'prod_milan_street_court',
    name: 'Urban Stride Milan Minimalist Street Low',
    slug: 'urban-stride-milan-minimalist-street-low',
    sku: 'URB-MLN-015',
    productType: 'variable',
    ribbonText: 'Smart Casual',
    brand: 'Urban Stride',
    category: 'casual-shoes',
    gender: 'unisex',
    description:
      'Clean low-profile weekend sneaker pairing pebble-grained leather with micro-perforated quarter panels and high-rebound cupsole comfort for effortless everyday wear.',
    images: [
      '/src/assets/images/hero_footwear_banner_1792739005918.jpg',
      '/src/assets/images/product_court_sneaker_1792769000669.jpg'
    ],
    regularPriceBDT: 3950,
    salePriceBDT: 3390,
    isFeatured: false,
    isBestSeller: false,
    isPublished: true,
    variants: [
      { id: 'v_mln_1', size: '39', color: 'Pure Chalk / Gum', colorHex: '#e4e4e7', stock: 12, skuVariant: 'URB-MLN-015-39-CHK' },
      { id: 'v_mln_2', size: '40', color: 'Pure Chalk / Gum', colorHex: '#e4e4e7', stock: 16, skuVariant: 'URB-MLN-015-40-CHK' },
      { id: 'v_mln_3', size: '41', color: 'Pure Chalk / Gum', colorHex: '#e4e4e7', stock: 18, skuVariant: 'URB-MLN-015-41-CHK' },
      { id: 'v_mln_4', size: '42', color: 'Pure Chalk / Gum', colorHex: '#e4e4e7', stock: 15, skuVariant: 'URB-MLN-015-42-CHK' },
      { id: 'v_mln_5', size: '43', color: 'Pure Chalk / Gum', colorHex: '#e4e4e7', stock: 10, skuVariant: 'URB-MLN-015-43-CHK' }
    ],
    specifications: {
      'Upper': 'Soft pebble-grain leather & suede heel counter',
      'Lining': 'Moisture-wicking micro-terry lining',
      'Outsole': 'Non-marking natural rubber cupsole'
    },
    rating: 4.8,
    reviewCount: 21,
    createdAt: '2026-10-19T10:00:00Z',
    updatedAt: '2026-10-19T10:00:00Z'
  },
  {
    id: 'prod_junior_velocity',
    name: 'Velox Junior Velocity Flex Runner',
    slug: 'velox-junior-velocity-flex-runner',
    sku: 'VLX-JR-009',
    productType: 'variable',
    ribbonText: 'Kids Favorite',
    brand: 'Velox Performance',
    category: 'kids-shoes',
    gender: 'kids',
    description:
      'Easy hook-and-loop strap athletic runner for active kids, featuring a scuff-resistant toe bumper and ultra-flexible non-marking rubber sole.',
    images: [
      '/src/assets/images/product_trail_marathon_shoe_1792775363886.jpg',
      '/src/assets/images/category_women_sneakers_1792739007245.jpg'
    ],
    regularPriceBDT: 2650,
    salePriceBDT: 2290,
    isFeatured: false,
    isBestSeller: false,
    isPublished: true,
    variants: [
      { id: 'v_jr_1', size: '30', color: 'Royal Violet / Grey', colorHex: '#7c3aed', stock: 10, skuVariant: 'VLX-JR-009-30-VIO' },
      { id: 'v_jr_2', size: '32', color: 'Royal Violet / Grey', colorHex: '#7c3aed', stock: 14, skuVariant: 'VLX-JR-009-32-VIO' },
      { id: 'v_jr_3', size: '34', color: 'Royal Violet / Grey', colorHex: '#7c3aed', stock: 12, skuVariant: 'VLX-JR-009-34-VIO' },
      { id: 'v_jr_4', size: '35', color: 'Royal Violet / Grey', colorHex: '#7c3aed', stock: 9, skuVariant: 'VLX-JR-009-35-VIO' }
    ],
    specifications: {
      'Closure': 'No-tie elastic laces + secure hook-and-loop strap',
      'Outsole': 'Non-marking playground grip rubber'
    },
    rating: 4.9,
    reviewCount: 17,
    createdAt: '2026-10-18T12:00:00Z',
    updatedAt: '2026-10-18T12:00:00Z'
  },
  {
    id: 'prod_leather_care_vault',
    name: 'Artisano Executive Calfskin Care & Cedar Valet Kit',
    slug: 'artisano-executive-calfskin-care-cedar-valet-kit',
    sku: 'ART-KIT-016',
    productType: 'simple',
    ribbonText: 'Shoe Care Kit',
    brand: 'Artisano Leathercraft',
    category: 'formal-shoes',
    gender: 'unisex',
    description:
      'Complete 5-piece luxury shoe care kit including aromatic red-cedar shoe trees, neutral beeswax conditioning cream, horsehair shine brush, and suede eraser block.',
    images: [
      '/src/assets/images/product_penny_loafer_tan_1792775363081.jpg',
      '/src/assets/images/product_oxford_dress_shoe_1792775360783.jpg'
    ],
    regularPriceBDT: 1850,
    salePriceBDT: 1490,
    isFeatured: false,
    isBestSeller: false,
    isPublished: true,
    variants: [
      { id: 'v_kit_1', size: 'Standard Kit', color: 'Natural Cedar / Neutral Wax', colorHex: '#92400e', stock: 35, skuVariant: 'ART-KIT-016-STD' }
    ],
    specifications: {
      'Contents': 'Cedar shoe Inserts, neutral carnauba wax, horsehair brush, microfiber cloth',
      'Compatibility': 'Safe for all calfskin, nubuck, and full-grain leather footwear'
    },
    rating: 5.0,
    reviewCount: 15,
    createdAt: '2026-10-18T09:00:00Z',
    updatedAt: '2026-10-18T09:00:00Z'
  }
];

const DEFAULT_COUPONS: Coupon[] = [
  {
    id: 'coup_welcome',
    code: 'ZEN10',
    discountType: 'percentage',
    discountValue: 10,
    minOrderAmount: 2000,
    maxDiscountAmount: 1000,
    startDate: '2026-01-01',
    expiryDate: '2028-12-31',
    usageLimit: 1000,
    timesUsed: 42,
    countryRestriction: 'BD',
    isActive: true
  },
  {
    id: 'coup_dhaka',
    code: 'SAVE300',
    discountType: 'fixed',
    discountValue: 300,
    minOrderAmount: 3500,
    startDate: '2026-01-01',
    expiryDate: '2028-12-31',
    usageLimit: 500,
    timesUsed: 19,
    countryRestriction: 'BD',
    isActive: true
  }
];

const DEFAULT_SETTINGS: StoreSettings = {
  storeName: 'BDTechZen',
  logoUrl: '',
  storeTagline: 'Full-grain calfskin loafers, Blake-stitched Oxfords, and everyday court sneakers—made for walking Bangladesh.',
  supportEmail: 'support@bdtechzen.com',
  supportPhone: '+880 1623-604635',
  whatsappNumber: '+8801623604635',
  announcementText: 'Complimentary delivery across Bangladesh on orders above ৳3,000 · Cash on Delivery & 7-day doorstep size exchange',
  announcementEnabled: true,
  shippingBD: {
    insideDhaka: 70,
    outsideDhaka: 130,
    freeShippingThreshold: 3000
  },
  paymentGateways: {
    bkashEnabled: true,
    bkashSandbox: true,
    nagadEnabled: true,
    nagadSandbox: true,
    rocketEnabled: true,
    rocketSandbox: true,
    sslcommerzEnabled: true,
    sslcommerzSandbox: true,
    codEnabledBD: true
  },
  heroBanner: {
    title: 'Shoes built to walk, cut from full-grain calfskin.',
    subtitle:
      'We pair Italian-tanned calfskin and water-resistant suede with cushioned anatomical footbeds—so your morning commute in Motijheel feels as effortless as dinner in Gulshan.',
    ctaText: 'Shop the Collection',
    ctaLink: '/shop',
    imageUrl: '/src/assets/images/hero_bangladeshi_models_1792779716481.jpg'
  },
  notifications: {
    emailEnabled: true,
    smsEnabled: true,
    senderName: 'BDTechZen Studio',
    adminAlertEmail: 'khalil5172@gmail.com',
    adminAlertPhone: '+8801623604635',
    notifyAdminOnNewOrder: true,
    notifyAdminOnNewUser: true,
    ntfyTopic: 'bdtechzen-khalil-8801623604635',
    smsGatewayUrl: '',
    smsApiKey: '',
    smsSenderId: 'BDTechZen'
  },
  maintenanceMode: false
};

const DEFAULT_ORDERS: Order[] = [
  {
    id: 'ord_1001',
    orderNumber: 'BDTZ-2601',
    userId: undefined,
    isGuest: true,
    customerName: 'Tanvir Ahmed',
    customerEmail: 'tanvir.ahmed@example.com',
    customerPhone: '01711223344',
    shippingAddress: {
      fullName: 'Tanvir Ahmed',
      phone: '01711223344',
      address: 'House 42, Road 11, Banani',
      city: 'Dhaka',
      stateDivision: 'Dhaka Division',
      postalCode: '1213',
      country: 'BD',
      deliveryInstructions: 'Please call before arrival at main gate'
    },
    items: [
      {
        productId: 'prod_apex_violet',
        productName: 'BDTechZen Apex Carbon-Violet Runner',
        productSku: 'BDTZ-APX-001-42-VIO',
        image: '/src/assets/images/hero_bdtechzen_flagship_1792768997575.jpg',
        size: '42',
        color: 'Obsidian / Violet',
        quantity: 1,
        unitPrice: 4790,
        totalPrice: 4790,
        currency: 'BDT'
      }
    ],
    currency: 'BDT',
    subtotal: 4790,
    discount: 0,
    shippingCharge: 0,
    tax: 0,
    grandTotal: 4790,
    shippingMethod: 'Dhaka Express Courier (24–48h)',
    paymentMethod: 'bkash',
    paymentStatus: 'paid',
    orderStatus: 'processing',
    transactionRef: 'BKH93710842X',
    trackingNumber: 'STF-DH-98402',
    courierName: 'Steadfast Courier',
    internalNotes: 'Payment verified via bKash Merchant Portal.',
    auditLog: [
      { timestamp: '2026-10-22T10:14:00Z', action: 'Order Placed', note: 'Customer completed bKash checkout', actor: 'Customer' },
      { timestamp: '2026-10-22T10:15:30Z', action: 'Payment Captured', note: 'bKash TrxID BKH93710842X verified', actor: 'bKash Gateway' },
      { timestamp: '2026-10-22T14:30:00Z', action: 'Status Updated', note: 'Assigned to Steadfast Courier', actor: 'krrahman' }
    ],
    createdAt: '2026-10-22T10:14:00Z',
    updatedAt: '2026-10-22T14:30:00Z'
  },
  {
    id: 'ord_1002',
    orderNumber: 'BDTZ-2602',
    userId: undefined,
    isGuest: true,
    customerName: 'Mehrab Hossain',
    customerEmail: 'mehrab.ctg@example.com',
    customerPhone: '01819876543',
    shippingAddress: {
      fullName: 'Mehrab Hossain',
      phone: '01819876543',
      address: 'GEC Circle, Nasirabad',
      city: 'Chattogram',
      stateDivision: 'Chattogram Division',
      postalCode: '4000',
      country: 'BD',
      deliveryInstructions: 'Home delivery during daytime'
    },
    items: [
      {
        productId: 'prod_mayfair_oxford',
        productName: 'Artisano Mayfair Cap-Toe Calfskin Oxford',
        productSku: 'ART-OXF-010-42-BLK',
        image: '/src/assets/images/product_oxford_dress_shoe_1792775360783.jpg',
        size: '42',
        color: 'Obsidian Calfskin',
        quantity: 1,
        unitPrice: 6690,
        totalPrice: 6690,
        currency: 'BDT'
      }
    ],
    currency: 'BDT',
    subtotal: 6690,
    discount: 0,
    shippingCharge: 0,
    tax: 0,
    grandTotal: 6690,
    shippingMethod: 'Nationwide Courier Express',
    paymentMethod: 'cod',
    paymentStatus: 'pending',
    orderStatus: 'shipped',
    transactionRef: 'COD-BDTZ-2602',
    trackingNumber: 'RDX-CTG-44912',
    courierName: 'RedX Nationwide',
    internalNotes: 'Dispatched to Chattogram Hub via Cash on Delivery.',
    auditLog: [
      { timestamp: '2026-10-21T09:00:00Z', action: 'Order Placed', note: 'Cash on Delivery confirmed', actor: 'Customer' },
      { timestamp: '2026-10-21T16:00:00Z', action: 'Shipped', note: 'Handed over to RedX Nationwide', actor: 'krrahman' }
    ],
    createdAt: '2026-10-21T09:00:00Z',
    updatedAt: '2026-10-21T16:00:00Z'
  }
];

const DEFAULT_REVIEWS: Review[] = [
  {
    id: 'rev_1',
    productId: 'prod_apex_violet',
    userName: 'Kazi Farhan',
    userCountry: 'BD',
    rating: 5,
    title: 'Incredible rebound and breathable mesh for Dhaka weather',
    comment:
      'Been running 5km every morning around Hatirjheel in these. Zero heel slip, super lightweight, and Cash on Delivery arrived in 24 hours.',
    isVerifiedPurchase: true,
    status: 'approved',
    createdAt: '2026-10-18T14:20:00Z'
  },
  {
    id: 'rev_2',
    productId: 'prod_mayfair_oxford',
    userName: 'Asif Mahmud',
    userCountry: 'BD',
    rating: 5,
    title: 'Genuine full-grain calfskin with executive mirror polish',
    comment:
      'Wore the Mayfair Cap-Toe Oxfords to two corporate board meetings and a reception. Comfortable right out of the box.',
    isVerifiedPurchase: true,
    status: 'approved',
    createdAt: '2026-10-19T11:15:00Z'
  },
  {
    id: 'rev_3',
    productId: 'prod_court_violet',
    userName: 'Nusrat Jahan',
    userCountry: 'BD',
    rating: 5,
    title: 'Cleanest white leather sneakers I own',
    comment:
      'The violet leather heel tab matches BDTechZen branding subtly and the OrthoLite insole feels plush even after 8 hours.',
    isVerifiedPurchase: true,
    status: 'approved',
    createdAt: '2026-10-20T09:40:00Z'
  }
];

function initializeDefaultDatabase(): DatabaseSchema {
  const adminUser = generateInitialAdmin();
  return {
    schemaVersion: SCHEMA_VERSION,
    products: DEFAULT_PRODUCTS,
    categories: DEFAULT_CATEGORIES,
    brands: DEFAULT_BRANDS,
    users: [adminUser],
    orders: DEFAULT_ORDERS,
    coupons: DEFAULT_COUPONS,
    reviews: DEFAULT_REVIEWS,
    settings: DEFAULT_SETTINGS,
    contactSubmissions: [],
    wishlists: {}
  };
}

export function getDatabase(): DatabaseSchema {
  if (inMemoryData) {
    return inMemoryData;
  }

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch {
    // Ignore read-only filesystem errors; inMemoryData will still serve requests
  }

  const readableDbFile = fs.existsSync(DB_FILE)
    ? DB_FILE
    : fs.existsSync(BUNDLED_DB_FILE)
    ? BUNDLED_DB_FILE
    : fs.existsSync(SEED_DB_FILE)
    ? SEED_DB_FILE
    : null;

  if (readableDbFile) {
    try {
      const raw = fs.readFileSync(readableDbFile, 'utf-8');
      const parsed: DatabaseSchema = JSON.parse(raw);

      if (parsed.schemaVersion !== SCHEMA_VERSION) {
        if (parsed.schemaVersion === 'bdtechzen_en_v6' && parsed.settings?.heroBanner) {
          // Preserve existing catalog/orders while upgrading the flagship hero image to the 2 Bangladeshi models photo
          if (
            !parsed.settings.heroBanner.imageUrl ||
            parsed.settings.heroBanner.imageUrl.includes('hero_atelier_lookbook') ||
            parsed.settings.heroBanner.imageUrl.includes('hero_bdtechzen_flagship')
          ) {
            parsed.settings.heroBanner.imageUrl =
              '/src/assets/images/hero_bangladeshi_models_1792779716481.jpg';
          }
          parsed.schemaVersion = SCHEMA_VERSION;
          inMemoryData = parsed;
          saveDatabase(inMemoryData);
          return inMemoryData;
        }
        inMemoryData = initializeDefaultDatabase();
        saveDatabase(inMemoryData);
        return inMemoryData;
      }

      inMemoryData = parsed;
      let needsSave = false;
      if (
        inMemoryData.settings?.heroBanner?.title ===
        'Shoes built to walk Dhaka, cut from full-grain calfskin.'
      ) {
        inMemoryData.settings.heroBanner.title =
          'Shoes built to walk, cut from full-grain calfskin.';
        needsSave = true;
      }
      const adminIdx = inMemoryData.users.findIndex(
        (u) => u.name.toLowerCase() === 'krrahman' || u.role === 'admin'
      );
      if (adminIdx === -1) {
        inMemoryData.users.push(generateInitialAdmin());
        needsSave = true;
      } else {
        inMemoryData.users[adminIdx].id = 'user_admin_krrahman';
        inMemoryData.users[adminIdx].name = 'krrahman';
        inMemoryData.users[adminIdx].mustChangePassword = false;
      }
      if (!inMemoryData.settings.notifications) {
        inMemoryData.settings.notifications = { ...DEFAULT_SETTINGS.notifications! };
        needsSave = true;
      } else {
        const n = inMemoryData.settings.notifications;
        if (!n.adminAlertEmail) {
          n.adminAlertEmail = 'khalil5172@gmail.com';
          needsSave = true;
        }
        if (!n.adminAlertPhone) {
          n.adminAlertPhone = '+8801623604635';
          needsSave = true;
        }
        if (n.notifyAdminOnNewOrder === undefined) {
          n.notifyAdminOnNewOrder = true;
          needsSave = true;
        }
        if (n.notifyAdminOnNewUser === undefined) {
          n.notifyAdminOnNewUser = true;
          needsSave = true;
        }
        if (n.ntfyTopic === undefined) {
          n.ntfyTopic = 'bdtechzen-khalil-8801623604635';
          needsSave = true;
        }
      }
      if (needsSave) {
        saveDatabase(inMemoryData);
      }
      return inMemoryData;
    } catch (err) {
      console.error('[DB] Error reading store.json, initializing fresh database:', err);
      inMemoryData = initializeDefaultDatabase();
      saveDatabase(inMemoryData);
      return inMemoryData;
    }
  } else {
    inMemoryData = initializeDefaultDatabase();
    saveDatabase(inMemoryData);
    return inMemoryData;
  }
}

export async function bootstrapDatabase(): Promise<DatabaseSchema> {
  const localBaseline = getDatabase();
  const mysqlData = await initMySqlAndHydrate(localBaseline);
  if (mysqlData) {
    inMemoryData = mysqlData;
  }
  return inMemoryData!;
}

export function getPublicStoreSnapshot() {
  const db = getDatabase();
  const safeNotifications = db.settings.notifications
    ? {
        ...db.settings.notifications,
        smsApiKey: ''
      }
    : undefined;
  return {
    generatedAt: new Date().toISOString(),
    settings: {
      ...db.settings,
      notifications: safeNotifications
    },
    categories: db.categories,
    brands: db.brands,
    products: db.products,
    coupons: db.coupons,
    reviews: db.reviews.filter((r) => r.status === 'approved'),
    sampleOrders: db.orders.slice(0, 5)
  };
}

export function saveDatabase(data: DatabaseSchema): Promise<void> {
  data.schemaVersion = SCHEMA_VERSION;
  inMemoryData = data;
  writeQueue = writeQueue.then(async () => {
    try {
      await syncDatabaseToMySql(data);
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const tempPath = `${DB_FILE}.${Date.now()}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
      fs.renameSync(tempPath, DB_FILE);
    } catch (err) {
      console.error('[DB] Failed to persist data:', err);
    }
  });
  return writeQueue;
}

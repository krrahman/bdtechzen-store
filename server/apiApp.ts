import express, { Request, Response } from 'express';
import os from 'os';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import dotenv from 'dotenv';
import {
  getDatabase,
  saveDatabase,
  bootstrapDatabase,
  Product,
  Category,
  Brand,
  Order,
  OrderItem,
  Coupon,
  Review,
  ContactSubmission,
  User,
  hashPassword
} from './db.js';
import {
  generateToken,
  requireAuth,
  requireAdmin,
  rateLimitLogin,
  AuthenticatedRequest
} from './auth.js';
import { initiatePayment, verifyAndCapturePayment } from './paymentGateways.js';
import {
  dispatchOrderNotifications,
  dispatchNewUserAdminNotifications,
  dispatchTestAdminNotifications
} from './notifications.js';
import { generateMySqlDumpSql, isMySqlConfigured } from './mysql.js';

dotenv.config();

export const app = express();

export const IS_SERVERLESS = Boolean(
  process.env.NETLIFY ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.LAMBDA_TASK_ROOT ||
    process.env.VERCEL
);

// Ensure uploads folder exists (uses /tmp in read-only serverless runtimes)
export const UPLOADS_DIR = IS_SERVERLESS
  ? path.join(os.tmpdir(), 'bdtechzen-uploads')
  : path.resolve(process.cwd(), '.data', 'uploads');
try {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
} catch {
  // Ignore on read-only filesystem
}

let bootstrapPromise: Promise<ReturnType<typeof getDatabase>> | null = null;
export function ensureServerBootstrapped() {
  if (!bootstrapPromise) {
    bootstrapPromise = bootstrapDatabase();
  }
  return bootstrapPromise;
}

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));
app.use('/uploads', express.static(UPLOADS_DIR));
app.use('/src/assets/images', express.static(path.resolve(process.cwd(), 'src', 'assets', 'images')));

/* -------------------------------------------------------------
 * 0. HEALTH CHECK ENDPOINT (NETLIFY & PRODUCTION DIAGNOSTICS)
 * ------------------------------------------------------------*/

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    ok: true,
    runtime: IS_SERVERLESS ? 'netlify-serverless' : 'node-server',
    mysqlConfigured: isMySqlConfigured(),
    timestamp: new Date().toISOString()
  });
});

/* -------------------------------------------------------------
 * 1. PUBLIC STOREFRONT API (BANGLADESH BDT EXCLUSIVELY)
 * ------------------------------------------------------------*/

app.get('/api/settings', (_req: Request, res: Response) => {
  const db = getDatabase();
  const {
    paymentGateways,
    heroBanner,
    storeName,
    logoUrl,
    storeTagline,
    supportEmail,
    supportPhone,
    whatsappNumber,
    announcementText,
    announcementEnabled,
    shippingBD,
    notifications,
    maintenanceMode
  } = db.settings;

  const publicNotifications = notifications
    ? {
        ...notifications,
        smsApiKey: ''
      }
    : undefined;

  res.json({
    storeName,
    logoUrl,
    storeTagline,
    supportEmail,
    supportPhone,
    whatsappNumber,
    announcementText,
    announcementEnabled,
    shippingBD,
    paymentGateways,
    heroBanner,
    notifications: publicNotifications,
    maintenanceMode
  });
});

app.get('/api/categories', (_req: Request, res: Response) => {
  const db = getDatabase();
  res.json(db.categories);
});

app.get('/api/brands', (_req: Request, res: Response) => {
  const db = getDatabase();
  res.json(db.brands);
});

app.get('/api/products', (req: Request, res: Response) => {
  const db = getDatabase();
  let items = db.products.filter((p) => p.isPublished);

  const {
    search,
    category,
    brand,
    gender,
    size,
    color,
    minPrice,
    maxPrice,
    inStock,
    onSale,
    sort,
    featured,
    bestSeller,
    page,
    limit
  } = req.query;

  if (typeof search === 'string' && search.trim()) {
    const q = search.toLowerCase().trim();
    items = items.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
    );
  }

  if (typeof category === 'string' && category && category !== 'all') {
    items = items.filter((p) => p.category === category || p.category.toLowerCase() === category.toLowerCase());
  }

  if (typeof brand === 'string' && brand && brand !== 'all') {
    items = items.filter((p) => p.brand.toLowerCase() === brand.toLowerCase());
  }

  if (typeof gender === 'string' && gender && gender !== 'all') {
    items = items.filter((p) => p.gender === gender || p.gender === 'unisex');
  }

  if (typeof size === 'string' && size && size !== 'all') {
    items = items.filter((p) => p.variants.some((v) => v.size === size && v.stock > 0));
  }

  if (typeof color === 'string' && color && color !== 'all') {
    items = items.filter((p) => p.variants.some((v) => v.color.toLowerCase().includes(color.toLowerCase())));
  }

  if (inStock === 'true') {
    items = items.filter((p) => p.variants.reduce((acc, v) => acc + v.stock, 0) > 0);
  }

  if (onSale === 'true') {
    items = items.filter((p) => p.salePriceBDT && p.salePriceBDT < p.regularPriceBDT);
  }

  if (featured === 'true') {
    items = items.filter((p) => p.isFeatured);
  }
  if (bestSeller === 'true') {
    items = items.filter((p) => p.isBestSeller);
  }

  if (minPrice) {
    const min = Number(minPrice);
    items = items.filter((p) => (p.salePriceBDT || p.regularPriceBDT) >= min);
  }
  if (maxPrice) {
    const max = Number(maxPrice);
    items = items.filter((p) => (p.salePriceBDT || p.regularPriceBDT) <= max);
  }

  if (sort === 'price_asc') {
    items.sort((a, b) => (a.salePriceBDT || a.regularPriceBDT) - (b.salePriceBDT || b.regularPriceBDT));
  } else if (sort === 'price_desc') {
    items.sort((a, b) => (b.salePriceBDT || b.regularPriceBDT) - (a.salePriceBDT || a.regularPriceBDT));
  } else if (sort === 'rating') {
    items.sort((a, b) => b.rating - a.rating);
  } else if (sort === 'popular') {
    items.sort((a, b) => b.reviewCount - a.reviewCount);
  } else {
    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  const total = items.length;
  const currentPage = Math.max(1, Number(page) || 1);
  const perPage = Math.min(50, Math.max(1, Number(limit) || 12));
  const paginated = items.slice((currentPage - 1) * perPage, currentPage * perPage);

  res.json({
    products: paginated,
    total,
    page: currentPage,
    totalPages: Math.ceil(total / perPage),
    hasMore: currentPage * perPage < total
  });
});

app.get('/api/products/:slugOrId', (req: Request, res: Response) => {
  const db = getDatabase();
  const idOrSlug = req.params.slugOrId;
  const product = db.products.find((p) => p.slug === idOrSlug || p.id === idOrSlug);

  if (!product) {
    res.status(404).json({ error: 'Product not found' });
    return;
  }

  const related = db.products
    .filter((p) => p.id !== product.id && p.isPublished && (p.category === product.category || p.brand === product.brand))
    .slice(0, 4);

  res.json({ product, related });
});

app.post('/api/coupons/verify', (req: Request, res: Response) => {
  const { code, subtotal } = req.body;
  if (!code) {
    res.status(400).json({ error: 'Please enter a coupon code' });
    return;
  }

  const db = getDatabase();
  const coupon = db.coupons.find((c) => c.code.toUpperCase() === code.trim().toUpperCase() && c.isActive);

  if (!coupon) {
    res.status(404).json({ error: 'Invalid or inactive coupon code' });
    return;
  }

  const today = new Date().toISOString().split('T')[0];
  if (coupon.startDate && coupon.startDate > today) {
    res.status(400).json({ error: 'This coupon campaign has not started yet' });
    return;
  }
  if (coupon.expiryDate && coupon.expiryDate < today) {
    res.status(400).json({ error: 'This coupon code has expired' });
    return;
  }
  if (coupon.timesUsed >= coupon.usageLimit) {
    res.status(400).json({ error: 'Coupon usage limit reached' });
    return;
  }
  if (subtotal < coupon.minOrderAmount) {
    res.status(400).json({ error: `Minimum order of ৳${coupon.minOrderAmount.toLocaleString()} required for this coupon` });
    return;
  }

  let discount = 0;
  if (coupon.discountType === 'percentage') {
    discount = Math.round((subtotal * coupon.discountValue) / 100);
    if (coupon.maxDiscountAmount && discount > coupon.maxDiscountAmount) {
      discount = coupon.maxDiscountAmount;
    }
  } else {
    discount = coupon.discountValue;
  }

  res.json({
    valid: true,
    code: coupon.code,
    discount,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue
  });
});

app.post('/api/orders', async (req: Request, res: Response) => {
  try {
    const {
      customerName,
      customerEmail,
      customerPhone,
      stateDivision,
      city,
      address,
      postalCode,
      deliveryInstructions,
      items,
      couponCode,
      paymentMethod,
      shippingMethod,
      userId
    } = req.body;

    if (!customerName || !customerPhone || !address || !city || !items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'Please provide your full name, phone number, and complete delivery address.' });
      return;
    }

    const db = getDatabase();
    const currency: 'BDT' = 'BDT';
    const orderItems: OrderItem[] = [];
    let subtotal = 0;

    for (const item of items) {
      const product = db.products.find((p) => p.id === item.productId);
      if (!product || !product.isPublished) {
        res.status(400).json({ error: `Product "${item.productName || item.productId}" is currently unavailable.` });
        return;
      }

      const variant = product.variants.find((v) => v.size === item.size && v.color === item.color);
      if (!variant) {
        res.status(400).json({ error: `Size ${item.size} / Color ${item.color} was not found.` });
        return;
      }

      const requestedQty = Number(item.quantity) || 1;
      if (variant.stock < requestedQty) {
        res.status(400).json({
          error: `Insufficient stock for ${product.name} (Size ${item.size}, ${item.color}). Only ${variant.stock} pair(s) left.`
        });
        return;
      }

      const unitPrice = variant.priceOverrideBDT || product.salePriceBDT || product.regularPriceBDT;
      const lineTotal = unitPrice * requestedQty;
      subtotal += lineTotal;

      orderItems.push({
        productId: product.id,
        productName: product.name,
        productSku: variant.skuVariant || product.sku,
        image: product.images[0] || '',
        size: variant.size,
        color: variant.color,
        quantity: requestedQty,
        unitPrice,
        totalPrice: lineTotal,
        currency
      });
    }

    let discount = 0;
    if (couponCode) {
      const coupon = db.coupons.find((c) => c.code.toUpperCase() === couponCode.trim().toUpperCase() && c.isActive);
      if (coupon && coupon.timesUsed < coupon.usageLimit && subtotal >= coupon.minOrderAmount) {
        if (coupon.discountType === 'percentage') {
          discount = Math.round((subtotal * coupon.discountValue) / 100);
          if (coupon.maxDiscountAmount && discount > coupon.maxDiscountAmount) {
            discount = coupon.maxDiscountAmount;
          }
        } else {
          discount = coupon.discountValue;
        }
        coupon.timesUsed++;
      }
    }

    const isInsideDhaka = city.toLowerCase().includes('dhaka') || stateDivision?.toLowerCase().includes('dhaka');
    let shippingCharge = isInsideDhaka ? db.settings.shippingBD.insideDhaka : db.settings.shippingBD.outsideDhaka;
    if (subtotal >= db.settings.shippingBD.freeShippingThreshold) {
      shippingCharge = 0;
    }

    const tax = 0;
    const grandTotal = Math.max(0, subtotal - discount + shippingCharge + tax);

    for (const item of orderItems) {
      const product = db.products.find((p) => p.id === item.productId)!;
      const variant = product.variants.find((v) => v.size === item.size && v.color === item.color)!;
      variant.stock = Math.max(0, variant.stock - item.quantity);
      product.updatedAt = new Date().toISOString();
    }

    const orderNumber = `BDTZ-${Math.floor(100000 + Math.random() * 900000)}`;
    const orderId = `ord_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;

    const newOrder: Order = {
      id: orderId,
      orderNumber,
      userId: userId || undefined,
      isGuest: !userId,
      customerName,
      customerEmail: customerEmail || `${customerPhone.replace(/\D/g, '')}@guest.bdtechzen.com`,
      customerPhone,
      shippingAddress: {
        fullName: customerName,
        phone: customerPhone,
        address,
        city,
        stateDivision: stateDivision || 'Dhaka Division',
        postalCode: postalCode || '',
        country: 'BD',
        deliveryInstructions
      },
      items: orderItems,
      currency,
      subtotal,
      discount,
      couponCode: discount > 0 ? couponCode : undefined,
      shippingCharge,
      tax,
      grandTotal,
      shippingMethod: shippingMethod || (isInsideDhaka ? 'Inside Dhaka Express Delivery' : 'Nationwide Bangladesh Courier'),
      paymentMethod: paymentMethod || 'cod',
      paymentStatus: 'pending',
      orderStatus: paymentMethod === 'cod' ? 'confirmed' : 'pending_payment',
      auditLog: [
        {
          timestamp: new Date().toISOString(),
          action: 'Order Placed',
          note: `Grand Total: ৳${grandTotal.toLocaleString()} via ${(paymentMethod || 'cod').toUpperCase()}`,
          actor: 'Customer'
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.orders.unshift(newOrder);
    const dispatchedNotifications = await dispatchOrderNotifications(newOrder, 'order_placed', db.settings);
    await saveDatabase(db);

    const paymentResult = initiatePayment(newOrder, paymentMethod);

    res.status(201).json({
      success: true,
      order: newOrder,
      payment: paymentResult,
      notifications: dispatchedNotifications
    });
  } catch (err: any) {
    console.error('[Orders API] Order placement failed:', err);
    res.status(500).json({ error: err.message || 'Could not place order. Please try again.' });
  }
});

app.get('/api/orders/track/:orderNumber', (req: Request, res: Response) => {
  const db = getDatabase();
  const orderNumber = req.params.orderNumber.toUpperCase().trim();
  const phone = typeof req.query.phone === 'string' ? req.query.phone.trim() : null;

  const order = db.orders.find((o) => o.orderNumber.toUpperCase() === orderNumber);
  if (!order) {
    res.status(404).json({ error: 'Order not found. Please check your order number (e.g. BDTZ-104820).' });
    return;
  }

  if (phone) {
    const cleanOrderPhone = order.customerPhone.replace(/\D/g, '');
    const cleanSearchPhone = phone.replace(/\D/g, '');
    if (!cleanOrderPhone.endsWith(cleanSearchPhone) && !cleanSearchPhone.endsWith(cleanOrderPhone)) {
      res.status(403).json({ error: 'The phone number entered does not match this order.' });
      return;
    }
  }

  res.json({
    orderNumber: order.orderNumber,
    orderStatus: order.orderStatus,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    trackingNumber: order.trackingNumber,
    courierName: order.courierName,
    items: order.items,
    grandTotal: order.grandTotal,
    currency: order.currency,
    createdAt: order.createdAt,
    shippingAddress: {
      fullName: order.shippingAddress.fullName,
      city: order.shippingAddress.city,
      stateDivision: order.shippingAddress.stateDivision,
      country: order.shippingAddress.country
    },
    notifications: order.notifications || [],
    auditLog: order.auditLog
  });
});

app.post('/api/payment/initiate', (req: Request, res: Response) => {
  const { orderId, paymentMethod } = req.body;
  const db = getDatabase();
  const order = db.orders.find((o) => o.id === orderId || o.orderNumber === orderId);

  if (!order) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }

  try {
    const result = initiatePayment(order, paymentMethod);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/payment/verify', async (req: Request, res: Response) => {
  const { orderId, transactionRef } = req.body;
  if (!orderId || !transactionRef) {
    res.status(400).json({ error: 'orderId and transactionRef are required' });
    return;
  }

  try {
    const result = await verifyAndCapturePayment(orderId, transactionRef);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/contact', async (req: Request, res: Response) => {
  const { name, email, phone, subject, message } = req.body;
  if (!name || !message) {
    res.status(400).json({ error: 'Name and message are required.' });
    return;
  }

  const db = getDatabase();
  const submission: ContactSubmission = {
    id: `cont_${Date.now()}`,
    name,
    email: email || '',
    phone: phone || '',
    subject: subject || 'General Inquiry',
    message,
    status: 'new',
    createdAt: new Date().toISOString()
  };

  db.contactSubmissions.unshift(submission);
  await saveDatabase(db);

  res.json({ success: true, message: 'Your message has been received by our concierge team.' });
});

app.get('/api/reviews/:productId', (req: Request, res: Response) => {
  const db = getDatabase();
  const reviews = db.reviews.filter((r) => r.productId === req.params.productId && r.status === 'approved');
  res.json(reviews);
});

app.post('/api/reviews', async (req: Request, res: Response) => {
  const { productId, userName, rating, title, comment } = req.body;
  if (!productId || !userName || !rating || !comment) {
    res.status(400).json({ error: 'Please complete all required review fields.' });
    return;
  }

  const db = getDatabase();
  const product = db.products.find((p) => p.id === productId);
  if (!product) {
    res.status(404).json({ error: 'Product not found' });
    return;
  }

  const newReview: Review = {
    id: `rev_${Date.now()}`,
    productId,
    userName,
    userCountry: 'BD',
    rating: Math.min(5, Math.max(1, Number(rating))),
    title: title || 'Verified Customer Review',
    comment,
    isVerifiedPurchase: true,
    status: 'approved',
    createdAt: new Date().toISOString()
  };

  db.reviews.unshift(newReview);

  const approvedReviews = db.reviews.filter((r) => r.productId === productId && r.status === 'approved');
  const sumRating = approvedReviews.reduce((acc, r) => acc + r.rating, 0);
  product.rating = Number((sumRating / approvedReviews.length).toFixed(1));
  product.reviewCount = approvedReviews.length;

  await saveDatabase(db);
  res.status(201).json({ success: true, review: newReview });
});

/* -------------------------------------------------------------
 * 2. CUSTOMER AUTHENTICATION & PORTAL API
 * ------------------------------------------------------------*/

app.post('/api/auth/register', rateLimitLogin, async (req: Request, res: Response) => {
  const { name, email, phone, password } = req.body;
  if (!name || !email || !password || !phone) {
    res.status(400).json({ error: 'Please fill out all required fields.' });
    return;
  }

  const db = getDatabase();
  const existing = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    res.status(400).json({ error: 'An account with this email address already exists.' });
    return;
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = hashPassword(password, salt);
  const newUser: User = {
    id: `usr_${Date.now()}`,
    name,
    email: email.toLowerCase(),
    phone,
    country: 'BD',
    role: 'customer',
    passwordHash,
    salt,
    addresses: [],
    createdAt: new Date().toISOString()
  };

  db.users.push(newUser);
  await saveDatabase(db);
  await dispatchNewUserAdminNotifications(newUser, db.settings);

  const token = generateToken({ userId: newUser.id, role: 'customer' });
  res.status(201).json({
    token,
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      phone: newUser.phone,
      country: newUser.country,
      role: newUser.role,
      addresses: newUser.addresses
    }
  });
});

app.post('/api/auth/login', rateLimitLogin, (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required.' });
    return;
  }

  const db = getDatabase();
  const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    res.status(401).json({ error: 'Invalid email or password.' });
    return;
  }

  const hash = hashPassword(password, user.salt);
  if (hash !== user.passwordHash) {
    res.status(401).json({ error: 'Invalid email or password.' });
    return;
  }

  const token = generateToken({ userId: user.id, role: user.role });
  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      country: user.country,
      role: user.role,
      addresses: user.addresses
    }
  });
});

app.get('/api/auth/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    country: user.country,
    role: user.role,
    addresses: user.addresses
  });
});

app.post('/api/auth/address', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { fullName, phone, address, city, stateDivision, postalCode, isDefault } = req.body;
  const user = req.user!;
  const newAddr = {
    id: `addr_${Date.now()}`,
    fullName,
    phone,
    address,
    city,
    stateDivision: stateDivision || 'Dhaka Division',
    postalCode: postalCode || '',
    country: 'BD' as const,
    isDefault: !!isDefault
  };

  const db = getDatabase();
  const dbUser = db.users.find((u) => u.id === user.id);
  if (dbUser) {
    if (newAddr.isDefault) {
      dbUser.addresses.forEach((a) => (a.isDefault = false));
    }
    dbUser.addresses.push(newAddr);
    await saveDatabase(db);
    res.json(dbUser.addresses);
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

app.get('/api/auth/orders', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const db = getDatabase();
  const userOrders = db.orders.filter(
    (o) => o.userId === user.id || o.customerEmail.toLowerCase() === user.email.toLowerCase()
  );
  res.json(userOrders);
});

app.post('/api/auth/order-cancel', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { orderId, reason } = req.body;
  const user = req.user!;
  const db = getDatabase();
  const order = db.orders.find((o) => o.id === orderId && (o.userId === user.id || o.customerEmail === user.email));

  if (!order) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }

  if (order.orderStatus === 'shipped' || order.orderStatus === 'delivered') {
    res.status(400).json({ error: 'Orders already shipped or delivered cannot be cancelled.' });
    return;
  }

  order.orderStatus = 'cancelled';
  order.cancellationReason = reason || 'Cancelled by customer';
  order.auditLog.push({
    timestamp: new Date().toISOString(),
    action: 'Order Cancelled',
    note: order.cancellationReason || '',
    actor: user.name
  });

  for (const item of order.items) {
    const p = db.products.find((prod) => prod.id === item.productId);
    if (p) {
      const v = p.variants.find((vr) => vr.size === item.size && vr.color === item.color);
      if (v) v.stock += item.quantity;
    }
  }

  await saveDatabase(db);
  res.json({ success: true, order });
});

app.post('/api/auth/order-return', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { orderId, reason } = req.body;
  const user = req.user!;
  const db = getDatabase();
  const order = db.orders.find((o) => o.id === orderId && (o.userId === user.id || o.customerEmail === user.email));

  if (!order) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }

  order.orderStatus = 'return_requested';
  order.returnReason = reason || 'Size exchange requested by customer';
  order.auditLog.push({
    timestamp: new Date().toISOString(),
    action: 'Return / Exchange Requested',
    note: order.returnReason || '',
    actor: user.name
  });

  await saveDatabase(db);
  res.json({ success: true, order });
});

/* -------------------------------------------------------------
 * 3. SECURE ADMINISTRATOR PANEL API (/admin)
 * Credentials: krrahman / kr123456
 * ------------------------------------------------------------*/

app.post('/api/admin/login', rateLimitLogin, (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: 'Username and password are required.' });
    return;
  }

  const cleanUser = username.trim().toLowerCase();
  const db = getDatabase();

  const adminUser = db.users.find(
    (u) =>
      u.role === 'admin' &&
      (u.name.toLowerCase() === cleanUser ||
        u.email.toLowerCase() === cleanUser ||
        cleanUser === 'krrahman')
  );

  if (!adminUser) {
    res.status(401).json({ error: 'Invalid administrator username.' });
    return;
  }

  const hash = hashPassword(password, adminUser.salt);
  const isValid = hash === adminUser.passwordHash || (cleanUser === 'krrahman' && password === 'kr123456');

  if (!isValid) {
    res.status(401).json({ error: 'Invalid administrator password.' });
    return;
  }

  const token = generateToken({ userId: adminUser.id, role: 'admin' }, 72);
  res.json({
    token,
    admin: {
      id: adminUser.id,
      name: adminUser.name,
      email: adminUser.email,
      role: adminUser.role
    }
  });
});

app.get('/api/admin/me', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const admin = req.user!;
  res.json({
    id: admin.id,
    name: admin.name,
    email: admin.email,
    role: admin.role
  });
});

app.get('/api/admin/stats', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  const db = getDatabase();

  const paidOrders = db.orders.filter((o) => o.paymentStatus === 'paid');
  const totalRevenueBDT = paidOrders.reduce((acc, o) => acc + o.grandTotal, 0);

  const pendingCodOrders = db.orders.filter(
    (o) => o.paymentStatus === 'pending' && o.orderStatus !== 'cancelled'
  );
  const pendingCodBDT = pendingCodOrders.reduce((acc, o) => acc + o.grandTotal, 0);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayOrders = db.orders.filter((o) => o.createdAt.startsWith(todayStr));
  const todaySalesBDT = todayOrders
    .filter((o) => o.orderStatus !== 'cancelled')
    .reduce((acc, o) => acc + o.grandTotal, 0);

  const pendingOrders = db.orders.filter(
    (o) => o.orderStatus === 'pending_payment' || o.orderStatus === 'confirmed'
  ).length;
  const processingOrders = db.orders.filter((o) => o.orderStatus === 'processing').length;
  const shippedOrders = db.orders.filter((o) => o.orderStatus === 'shipped').length;
  const deliveredOrders = db.orders.filter((o) => o.orderStatus === 'delivered').length;
  const cancelledOrders = db.orders.filter((o) => o.orderStatus === 'cancelled').length;

  let totalStockUnits = 0;
  let lowStockProducts = 0;
  let outOfStockProducts = 0;

  db.products.forEach((p) => {
    const totalPStock = p.variants.reduce((acc, v) => acc + v.stock, 0);
    totalStockUnits += totalPStock;
    if (totalPStock === 0) outOfStockProducts++;
    else if (totalPStock < 12) lowStockProducts++;
  });

  const paymentMethodCounts: Record<string, number> = {};
  db.orders.forEach((o) => {
    paymentMethodCounts[o.paymentMethod] = (paymentMethodCounts[o.paymentMethod] || 0) + 1;
  });

  res.json({
    revenue: {
      totalRevenueBDT,
      pendingCodBDT,
      todaySalesBDT
    },
    orders: {
      total: db.orders.length,
      pending: pendingOrders,
      processing: processingOrders,
      shipped: shippedOrders,
      delivered: deliveredOrders,
      cancelled: cancelledOrders
    },
    inventory: {
      totalProducts: db.products.length,
      totalUnits: totalStockUnits,
      lowStock: lowStockProducts,
      outOfStock: outOfStockProducts
    },
    customersCount: db.users.filter((u) => u.role === 'customer').length,
    categoriesCount: db.categories.length,
    couponsCount: db.coupons.filter((c) => c.isActive).length,
    paymentMethodCounts,
    recentOrders: db.orders.slice(0, 8)
  });
});

// Admin Products CRUD (WooCommerce Simple + Variable Support)
app.get('/api/admin/products', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  const db = getDatabase();
  res.json(db.products);
});

app.post('/api/admin/products', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const {
    name,
    brand,
    category,
    gender,
    productType,
    ribbonText,
    description,
    images,
    regularPriceBDT,
    salePriceBDT,
    variants,
    isFeatured,
    isBestSeller,
    isPublished,
    specifications,
    sku
  } = req.body;

  if (!name || !sku || !regularPriceBDT) {
    res.status(400).json({ error: 'Product name, SKU, and regular price (BDT) are required.' });
    return;
  }

  const db = getDatabase();
  if (db.products.some((p) => p.sku.toLowerCase() === sku.trim().toLowerCase())) {
    res.status(400).json({ error: 'A product with this SKU already exists.' });
    return;
  }

  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  const newProduct: Product = {
    id: `prod_${Date.now()}`,
    name: name.trim(),
    slug: `${slug}-${Math.floor(100 + Math.random() * 900)}`,
    sku: sku.trim().toUpperCase(),
    productType: productType || 'variable',
    ribbonText: ribbonText ? String(ribbonText).trim() : '',
    brand: brand || 'BDTechZen Studio',
    category: category || 'sneakers',
    gender: gender || 'unisex',
    description: description || '',
    images:
      Array.isArray(images) && images.length > 0
        ? images
        : ['/src/assets/images/hero_bdtechzen_flagship_1792768997575.jpg'],
    regularPriceBDT: Number(regularPriceBDT),
    salePriceBDT: salePriceBDT ? Number(salePriceBDT) : undefined,
    isFeatured: !!isFeatured,
    isBestSeller: !!isBestSeller,
    isPublished: isPublished !== false,
    variants: Array.isArray(variants) ? variants : [],
    specifications: specifications || {},
    rating: 5.0,
    reviewCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.products.unshift(newProduct);
  await saveDatabase(db);
  res.status(201).json(newProduct);
});

app.put('/api/admin/products/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const db = getDatabase();
  const index = db.products.findIndex((p) => p.id === req.params.id);
  if (index === -1) {
    res.status(404).json({ error: 'Product not found' });
    return;
  }

  const existing = db.products[index];
  const updated: Product = {
    ...existing,
    ...req.body,
    id: existing.id,
    regularPriceBDT: Number(req.body.regularPriceBDT ?? existing.regularPriceBDT),
    salePriceBDT:
      req.body.salePriceBDT === '' || req.body.salePriceBDT === null
        ? undefined
        : req.body.salePriceBDT !== undefined
        ? Number(req.body.salePriceBDT)
        : existing.salePriceBDT,
    updatedAt: new Date().toISOString()
  };

  db.products[index] = updated;
  await saveDatabase(db);
  res.json(updated);
});

app.delete('/api/admin/products/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const db = getDatabase();
  db.products = db.products.filter((p) => p.id !== req.params.id);
  await saveDatabase(db);
  res.json({ success: true, message: 'Product deleted successfully' });
});

// Admin Image Upload (stores inline dataUrl on Serverless so images persist in MySQL / JSON without ephemeral disk)
app.post('/api/admin/upload-image', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { dataUrl } = req.body;
  if (!dataUrl || !dataUrl.includes('base64,')) {
    res.status(400).json({ error: 'Valid base64 image data URL required' });
    return;
  }

  try {
    const matches = dataUrl.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/);
    if (!matches) {
      res.status(400).json({ error: 'Unsupported image format' });
      return;
    }

    let ext = matches[1].toLowerCase();
    if (ext === 'jpeg') ext = 'jpg';
    if (ext === 'svg+xml') ext = 'svg';
    const safeName = `img_${Date.now()}_${crypto.randomBytes(4).toString('hex')}.${ext}`;

    if (IS_SERVERLESS) {
      res.json({
        url: dataUrl,
        filename: safeName
      });
      return;
    }

    const buffer = Buffer.from(matches[2], 'base64');
    const filePath = path.join(UPLOADS_DIR, safeName);

    fs.writeFileSync(filePath, buffer);
    res.json({
      url: `/uploads/${safeName}`,
      filename: safeName
    });
  } catch {
    res.status(500).json({ error: 'Failed to save uploaded image' });
  }
});

// Admin Orders
app.get('/api/admin/orders', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  const db = getDatabase();
  res.json(db.orders);
});

app.put('/api/admin/orders/:id/status', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { status, trackingNumber, courierName, internalNotes, paymentStatus } = req.body;
  const db = getDatabase();
  const order = db.orders.find((o) => o.id === req.params.id || o.orderNumber === req.params.id);

  if (!order) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }

  const prevStatus = order.orderStatus;
  if (status) order.orderStatus = status;
  if (trackingNumber !== undefined) order.trackingNumber = trackingNumber;
  if (courierName !== undefined) order.courierName = courierName;
  if (internalNotes !== undefined) order.internalNotes = internalNotes;
  if (paymentStatus) order.paymentStatus = paymentStatus;

  order.updatedAt = new Date().toISOString();
  order.auditLog.push({
    timestamp: new Date().toISOString(),
    action: `Status Updated (${prevStatus} -> ${order.orderStatus})`,
    note: `Courier: ${order.courierName || 'N/A'}, Waybill: ${order.trackingNumber || 'N/A'}. ${internalNotes || ''}`.trim(),
    actor: req.user?.name || 'krrahman'
  });

  if (status && status !== prevStatus) {
    await dispatchOrderNotifications(order, 'status_updated', db.settings);
  }

  await saveDatabase(db);
  res.json(order);
});

app.post('/api/admin/orders/:id/notify', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const db = getDatabase();
  const order = db.orders.find((o) => o.id === req.params.id || o.orderNumber === req.params.id);
  if (!order) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }

  const eventType =
    order.orderStatus === 'shipped' || order.orderStatus === 'delivered' || order.orderStatus === 'cancelled'
      ? 'status_updated'
      : 'order_placed';

  const sent = await dispatchOrderNotifications(order, eventType, db.settings);
  await saveDatabase(db);
  res.json({ success: true, order, notifications: sent });
});

app.delete('/api/admin/orders/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const db = getDatabase();
  db.orders = db.orders.filter((o) => o.id !== req.params.id);
  await saveDatabase(db);
  res.json({ success: true });
});

// Admin Customers
app.get('/api/admin/customers', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  const db = getDatabase();
  const customers = db.users
    .filter((u) => u.role === 'customer')
    .map((c) => {
      const orders = db.orders.filter((o) => o.userId === c.id || o.customerEmail.toLowerCase() === c.email.toLowerCase());
      const totalSpentBDT = orders
        .filter((o) => o.orderStatus !== 'cancelled')
        .reduce((acc, o) => acc + o.grandTotal, 0);
      return {
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        country: 'BD',
        orderCount: orders.length,
        totalSpentBDT,
        createdAt: c.createdAt
      };
    });
  res.json(customers);
});

// Admin Categories & Brands CRUD
app.post('/api/admin/categories', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { name, description, image, isFeatured } = req.body;
  if (!name) {
    res.status(400).json({ error: 'Category name is required' });
    return;
  }
  const db = getDatabase();
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  const newCat: Category = {
    id: `cat_${Date.now()}`,
    name: name.trim(),
    slug,
    description: description || '',
    image: image || '/src/assets/images/category_men_shoes_1792739006791.jpg',
    displayOrder: db.categories.length + 1,
    isFeatured: !!isFeatured
  };
  db.categories.push(newCat);
  await saveDatabase(db);
  res.status(201).json(newCat);
});

app.put('/api/admin/categories/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const db = getDatabase();
  const idx = db.categories.findIndex((c) => c.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Category not found' });
    return;
  }
  db.categories[idx] = {
    ...db.categories[idx],
    ...req.body,
    id: db.categories[idx].id
  };
  await saveDatabase(db);
  res.json(db.categories[idx]);
});

app.delete('/api/admin/categories/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const db = getDatabase();
  db.categories = db.categories.filter((c) => c.id !== req.params.id);
  await saveDatabase(db);
  res.json({ success: true });
});

app.post('/api/admin/brands', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    res.status(400).json({ error: 'Brand name is required' });
    return;
  }
  const db = getDatabase();
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  const newBrand: Brand = {
    id: `b_${Date.now()}`,
    name: name.trim(),
    slug
  };
  db.brands.push(newBrand);
  await saveDatabase(db);
  res.status(201).json(newBrand);
});

app.delete('/api/admin/brands/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const db = getDatabase();
  db.brands = db.brands.filter((b) => b.id !== req.params.id);
  await saveDatabase(db);
  res.json({ success: true });
});

// Admin Coupons CRUD
app.get('/api/admin/coupons', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  const db = getDatabase();
  res.json(db.coupons);
});

app.post('/api/admin/coupons', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { code, discountType, discountValue, minOrderAmount, maxDiscountAmount, startDate, expiryDate, usageLimit, isActive } =
    req.body;
  if (!code || !discountValue || minOrderAmount === undefined) {
    res.status(400).json({ error: 'Coupon code, discount value, and minimum order amount are required.' });
    return;
  }
  const db = getDatabase();
  const newCoupon: Coupon = {
    id: `coup_${Date.now()}`,
    code: code.trim().toUpperCase(),
    discountType: discountType || 'percentage',
    discountValue: Number(discountValue),
    minOrderAmount: Number(minOrderAmount),
    maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : undefined,
    startDate: startDate || new Date().toISOString().split('T')[0],
    expiryDate: expiryDate || '2028-12-31',
    usageLimit: Number(usageLimit) || 1000,
    timesUsed: 0,
    countryRestriction: 'BD',
    isActive: isActive !== false
  };
  db.coupons.unshift(newCoupon);
  await saveDatabase(db);
  res.status(201).json(newCoupon);
});

app.put('/api/admin/coupons/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const db = getDatabase();
  const idx = db.coupons.findIndex((c) => c.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Coupon not found' });
    return;
  }
  db.coupons[idx] = {
    ...db.coupons[idx],
    ...req.body,
    id: db.coupons[idx].id
  };
  await saveDatabase(db);
  res.json(db.coupons[idx]);
});

app.delete('/api/admin/coupons/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const db = getDatabase();
  db.coupons = db.coupons.filter((c) => c.id !== req.params.id);
  await saveDatabase(db);
  res.json({ success: true });
});

// Admin Store Settings
app.get('/api/admin/settings', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  const db = getDatabase();
  res.json(db.settings);
});

app.put('/api/admin/settings', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const db = getDatabase();
  db.settings = {
    ...db.settings,
    ...req.body
  };
  await saveDatabase(db);
  res.json(db.settings);
});

app.post('/api/admin/test-alert', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const db = getDatabase();
  const effectiveSettings = req.body?.settings
    ? {
        ...db.settings,
        ...req.body.settings,
        notifications: {
          ...db.settings.notifications,
          ...(req.body.settings.notifications || {})
        }
      }
    : db.settings;

  const result = await dispatchTestAdminNotifications(effectiveSettings);
  res.json({ success: true, result });
});

// Admin Reviews & Contact Inquiries
app.get('/api/admin/reviews', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  const db = getDatabase();
  res.json(db.reviews);
});

app.put('/api/admin/reviews/:id/status', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { status } = req.body;
  const db = getDatabase();
  const rev = db.reviews.find((r) => r.id === req.params.id);
  if (!rev) {
    res.status(404).json({ error: 'Review not found' });
    return;
  }
  rev.status = status;
  await saveDatabase(db);
  res.json(rev);
});

app.delete('/api/admin/reviews/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const db = getDatabase();
  db.reviews = db.reviews.filter((r) => r.id !== req.params.id);
  await saveDatabase(db);
  res.json({ success: true });
});

app.get('/api/admin/contact-messages', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  const db = getDatabase();
  res.json(db.contactSubmissions);
});

app.put('/api/admin/contact-messages/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const db = getDatabase();
  const msg = db.contactSubmissions.find((m) => m.id === req.params.id);
  if (!msg) {
    res.status(404).json({ error: 'Message not found' });
    return;
  }
  if (req.body.status) msg.status = req.body.status;
  await saveDatabase(db);
  res.json(msg);
});

app.get('/api/export/bdtechzen-mysql.sql', (_req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const sql = generateMySqlDumpSql(db);
    res.setHeader('Content-Type', 'application/sql; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="bdtechzen_mysql.sql"');
    res.send(sql);
  } catch (err: any) {
    console.error('[Export SQL] Failed:', err);
    res.status(500).json({ error: 'Failed to generate MySQL SQL dump.' });
  }
});

// SEO sitemap.xml & robots.txt
app.get('/sitemap.xml', (req: Request, res: Response) => {
  const db = getDatabase();
  const host = req.get('host') || 'bdtechzen.com';
  const protocol = req.protocol;
  const baseUrl = `${protocol}://${host}`;

  const urls = [
    `${baseUrl}/`,
    `${baseUrl}/shop`,
    `${baseUrl}/about`,
    `${baseUrl}/contact`,
    `${baseUrl}/track`,
    `${baseUrl}/size-guide`,
    `${baseUrl}/shipping-policy`,
    `${baseUrl}/return-policy`
  ];

  db.categories.forEach((c) => urls.push(`${baseUrl}/shop?category=${c.slug}`));
  db.products.forEach((p) => urls.push(`${baseUrl}/product/${p.slug}`));

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u}</loc><changefreq>daily</changefreq><priority>0.8</priority></url>`).join('\n')}
</urlset>`;

  res.header('Content-Type', 'application/xml');
  res.send(xml);
});

app.get('/robots.txt', (req: Request, res: Response) => {
  const host = req.get('host') || 'bdtechzen.com';
  res.type('text/plain');
  res.send(`User-agent: *\nDisallow: /admin\nDisallow: /api/\nAllow: /\nSitemap: https://${host}/sitemap.xml`);
});

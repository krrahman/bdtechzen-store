import type {
  Product,
  Category,
  Brand,
  Order,
  OrderItem,
  Coupon,
  Review,
  StoreSettings
} from '../types';
import {
  dispatchClientNewOrderAlerts,
  dispatchClientNewUserAlerts,
  dispatchClientContactInquiry,
  sendTestAdminAlert
} from './adminAlertClient';

interface StaticStoreSnapshot {
  generatedAt?: string;
  settings: StoreSettings;
  categories: Category[];
  brands: Brand[];
  products: Product[];
  coupons: Coupon[];
  reviews: Review[];
  sampleOrders?: Order[];
}

interface LocalStaticState extends StaticStoreSnapshot {
  orders: Order[];
  customers: Array<{
    id: string;
    name: string;
    email: string;
    phone: string;
    country: 'BD';
    role: 'customer' | 'admin';
    password: string;
    addresses: any[];
    createdAt: string;
  }>;
  contactSubmissions: Array<{
    id: string;
    name: string;
    email: string;
    phone: string;
    subject: string;
    message: string;
    status: 'new' | 'read' | 'resolved';
    createdAt: string;
  }>;
}

const LOCAL_STATE_KEY = 'bdtechzen_static_store_v1';

let isStaticModeConfirmed: boolean | null = null;
let cachedStatePromise: Promise<LocalStaticState> | null = null;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'x-static-fallback': '1'
    }
  });
}

async function loadStaticState(rawFetch: typeof window.fetch): Promise<LocalStaticState> {
  if (cachedStatePromise) return cachedStatePromise;

  cachedStatePromise = (async () => {
    let snapshot: StaticStoreSnapshot | null = null;
    try {
      const res = await rawFetch('/data/store-snapshot.json', { cache: 'no-cache' });
      if (res.ok) {
        snapshot = (await res.json()) as StaticStoreSnapshot;
      }
    } catch {
      // Fallback below if snapshot cannot be fetched
    }

    const baseSettings: StoreSettings = snapshot?.settings || {
      storeName: 'BDTechZen',
      logoUrl: '',
      storeTagline:
        'Full-grain calfskin loafers, Blake-stitched Oxfords, and everyday court sneakers—made for walking Bangladesh.',
      supportEmail: 'support@bdtechzen.com',
      supportPhone: '+880 1623-604635',
      whatsappNumber: '+8801623604635',
      announcementText:
        'Complimentary delivery across Bangladesh on orders above ৳3,000 · Cash on Delivery & 7-day doorstep size exchange',
      announcementEnabled: true,
      shippingBD: { insideDhaka: 70, outsideDhaka: 130, freeShippingThreshold: 3000 },
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

    let persisted: Partial<LocalStaticState> = {};
    try {
      const raw = localStorage.getItem(LOCAL_STATE_KEY);
      if (raw) persisted = JSON.parse(raw);
    } catch {
      persisted = {};
    }

    const defaultNotif = {
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
      smsSenderId: 'BDTechZen',
      ...(baseSettings.notifications || {})
    };

    const mergedSettings: StoreSettings = persisted.settings
      ? {
          ...baseSettings,
          ...persisted.settings,
          notifications: {
            ...defaultNotif,
            ...(persisted.settings.notifications || {}),
            adminAlertEmail:
              persisted.settings.notifications?.adminAlertEmail ||
              defaultNotif.adminAlertEmail,
            adminAlertPhone:
              persisted.settings.notifications?.adminAlertPhone ||
              defaultNotif.adminAlertPhone,
            ntfyTopic:
              persisted.settings.notifications?.ntfyTopic !== undefined
                ? persisted.settings.notifications.ntfyTopic
                : defaultNotif.ntfyTopic,
            notifyAdminOnNewOrder:
              persisted.settings.notifications?.notifyAdminOnNewOrder !== undefined
                ? persisted.settings.notifications.notifyAdminOnNewOrder
                : true,
            notifyAdminOnNewUser:
              persisted.settings.notifications?.notifyAdminOnNewUser !== undefined
                ? persisted.settings.notifications.notifyAdminOnNewUser
                : true
          }
        }
      : {
          ...baseSettings,
          notifications: defaultNotif
        };

    const merged: LocalStaticState = {
      settings: mergedSettings,
      categories: persisted.categories || snapshot?.categories || [],
      brands: persisted.brands || snapshot?.brands || [],
      products: persisted.products || snapshot?.products || [],
      coupons: persisted.coupons || snapshot?.coupons || [],
      reviews: persisted.reviews || snapshot?.reviews || [],
      orders: persisted.orders || snapshot?.sampleOrders || [],
      customers: persisted.customers || [],
      contactSubmissions: persisted.contactSubmissions || []
    };

    return merged;
  })();

  return cachedStatePromise;
}

function persistStaticState(state: LocalStaticState): void {
  try {
    localStorage.setItem(LOCAL_STATE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota errors
  }
}

function parseBody(init?: RequestInit): any {
  if (!init?.body) return {};
  if (typeof init.body === 'string') {
    try {
      return JSON.parse(init.body);
    } catch {
      return {};
    }
  }
  return {};
}

async function handleStaticApiRequest(
  rawFetch: typeof window.fetch,
  urlObj: URL,
  init?: RequestInit
): Promise<Response> {
  const state = await loadStaticState(rawFetch);
  const method = (init?.method || 'GET').toUpperCase();
  const pathname = urlObj.pathname.replace(/\/+$/, '') || '/';
  const body = parseBody(init);

  // 1. Public Storefront Endpoints
  if (method === 'GET' && pathname === '/api/settings') {
    return jsonResponse(state.settings);
  }

  if (method === 'GET' && pathname === '/api/categories') {
    return jsonResponse(state.categories);
  }

  if (method === 'GET' && pathname === '/api/brands') {
    return jsonResponse(state.brands);
  }

  if (method === 'GET' && pathname === '/api/products') {
    let items = state.products.filter((p) => p.isPublished);
    const sp = urlObj.searchParams;
    const search = sp.get('search');
    const category = sp.get('category');
    const brand = sp.get('brand');
    const gender = sp.get('gender');
    const size = sp.get('size');
    const color = sp.get('color');
    const inStock = sp.get('inStock');
    const onSale = sp.get('onSale');
    const featured = sp.get('featured');
    const bestSeller = sp.get('bestSeller');
    const minPrice = sp.get('minPrice');
    const maxPrice = sp.get('maxPrice');
    const sort = sp.get('sort');
    const page = sp.get('page');
    const limit = sp.get('limit');

    if (search && search.trim()) {
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
    if (category && category !== 'all') {
      items = items.filter((p) => p.category === category || p.category.toLowerCase() === category.toLowerCase());
    }
    if (brand && brand !== 'all') {
      items = items.filter((p) => p.brand.toLowerCase() === brand.toLowerCase());
    }
    if (gender && gender !== 'all') {
      items = items.filter((p) => p.gender === gender || p.gender === 'unisex');
    }
    if (size && size !== 'all') {
      items = items.filter((p) => p.variants.some((v) => v.size === size && v.stock > 0));
    }
    if (color && color !== 'all') {
      items = items.filter((p) => p.variants.some((v) => v.color.toLowerCase().includes(color.toLowerCase())));
    }
    if (inStock === 'true') {
      items = items.filter((p) => p.variants.reduce((acc, v) => acc + v.stock, 0) > 0);
    }
    if (onSale === 'true') {
      items = items.filter((p) => Boolean(p.salePriceBDT && p.salePriceBDT < p.regularPriceBDT));
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

    return jsonResponse({
      products: paginated,
      total,
      page: currentPage,
      totalPages: Math.ceil(total / perPage),
      hasMore: currentPage * perPage < total
    });
  }

  if (method === 'GET' && pathname.startsWith('/api/products/')) {
    const slugOrId = decodeURIComponent(pathname.slice('/api/products/'.length));
    const product = state.products.find((p) => p.slug === slugOrId || p.id === slugOrId);
    if (!product) {
      return jsonResponse({ error: 'Product not found' }, 404);
    }
    const related = state.products
      .filter(
        (p) =>
          p.id !== product.id &&
          p.isPublished &&
          (p.category === product.category || p.brand === product.brand)
      )
      .slice(0, 4);
    return jsonResponse({ product, related });
  }

  if (method === 'POST' && pathname === '/api/coupons/verify') {
    const code = String(body.code || '').trim().toUpperCase();
    const subtotal = Number(body.subtotal) || 0;
    if (!code) return jsonResponse({ error: 'Please enter a coupon code' }, 400);

    const coupon = state.coupons.find((c) => c.code.toUpperCase() === code && c.isActive);
    if (!coupon) return jsonResponse({ error: 'Invalid or inactive coupon code' }, 404);
    if (subtotal < coupon.minOrderAmount) {
      return jsonResponse(
        { error: `Minimum order of ৳${coupon.minOrderAmount.toLocaleString()} required for this coupon` },
        400
      );
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

    return jsonResponse({
      valid: true,
      code: coupon.code,
      discount,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue
    });
  }

  if (method === 'POST' && pathname === '/api/orders') {
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
    } = body;

    if (!customerName || !customerPhone || !address || !city || !Array.isArray(items) || items.length === 0) {
      return jsonResponse(
        { error: 'Please provide your full name, phone number, and complete delivery address.' },
        400
      );
    }

    const orderItems: OrderItem[] = [];
    let subtotal = 0;

    for (const item of items) {
      const product = state.products.find((p) => p.id === item.productId);
      if (!product) {
        return jsonResponse({ error: `Product "${item.productName || item.productId}" is unavailable.` }, 400);
      }
      const variant = product.variants.find((v) => v.size === item.size && v.color === item.color);
      if (!variant) {
        return jsonResponse({ error: `Size ${item.size} / Color ${item.color} was not found.` }, 400);
      }
      const requestedQty = Number(item.quantity) || 1;
      if (variant.stock < requestedQty) {
        return jsonResponse(
          { error: `Only ${variant.stock} pair(s) left for ${product.name} (${item.size}).` },
          400
        );
      }

      const unitPrice = variant.priceOverrideBDT || product.salePriceBDT || product.regularPriceBDT;
      const lineTotal = unitPrice * requestedQty;
      subtotal += lineTotal;

      variant.stock = Math.max(0, variant.stock - requestedQty);
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
        currency: 'BDT'
      });
    }

    let discount = 0;
    if (couponCode) {
      const coupon = state.coupons.find(
        (c) => c.code.toUpperCase() === String(couponCode).trim().toUpperCase() && c.isActive
      );
      if (coupon && subtotal >= coupon.minOrderAmount) {
        discount =
          coupon.discountType === 'percentage'
            ? Math.min(
                Math.round((subtotal * coupon.discountValue) / 100),
                coupon.maxDiscountAmount || Infinity
              )
            : coupon.discountValue;
      }
    }

    const isInsideDhaka =
      String(city).toLowerCase().includes('dhaka') ||
      String(stateDivision || '').toLowerCase().includes('dhaka');
    let shippingCharge = isInsideDhaka
      ? state.settings.shippingBD.insideDhaka
      : state.settings.shippingBD.outsideDhaka;
    if (subtotal >= state.settings.shippingBD.freeShippingThreshold) {
      shippingCharge = 0;
    }

    const grandTotal = Math.max(0, subtotal - discount + shippingCharge);
    const orderNumber = `BDTZ-${Math.floor(100000 + Math.random() * 900000)}`;
    const nowIso = new Date().toISOString();

    const newOrder: Order = {
      id: `ord_${Date.now()}`,
      orderNumber,
      userId: userId || undefined,
      isGuest: !userId,
      customerName,
      customerEmail: customerEmail || `${String(customerPhone).replace(/\D/g, '')}@guest.bdtechzen.com`,
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
      currency: 'BDT',
      subtotal,
      discount,
      couponCode: discount > 0 ? couponCode : undefined,
      shippingCharge,
      tax: 0,
      grandTotal,
      shippingMethod:
        shippingMethod || (isInsideDhaka ? 'Inside Dhaka Express Delivery' : 'Nationwide Bangladesh Courier'),
      paymentMethod: paymentMethod || 'cod',
      paymentStatus: 'pending',
      orderStatus: paymentMethod === 'cod' ? 'confirmed' : 'pending_payment',
      notifications: [
        {
          id: `ntf_sms_${Date.now()}`,
          channel: 'sms',
          recipient: customerPhone,
          event: 'order_placed',
          message: `BDTechZen: Order #${orderNumber} confirmed (Tk ${grandTotal.toLocaleString('en-BD')}). Support: +8801623604635`,
          status: 'dispatched',
          provider: 'BDTechZen Outbox',
          sentAt: nowIso
        },
        ...(customerEmail
          ? [
              {
                id: `ntf_email_${Date.now()}`,
                channel: 'email' as const,
                recipient: customerEmail,
                subject: `Order Confirmed — #${orderNumber} | BDTechZen`,
                event: 'order_placed' as const,
                message: `Thank you ${customerName}, your order #${orderNumber} for Tk ${grandTotal.toLocaleString('en-BD')} has been received.`,
                status: 'dispatched' as const,
                provider: 'BDTechZen Outbox',
                sentAt: nowIso
              }
            ]
          : [])
      ],
      auditLog: [
        {
          timestamp: nowIso,
          action: 'Order Placed',
          note: `Grand Total: ৳${grandTotal.toLocaleString()} via ${String(paymentMethod || 'cod').toUpperCase()}`,
          actor: 'Customer'
        }
      ],
      createdAt: nowIso,
      updatedAt: nowIso
    };

    state.orders.unshift(newOrder);
    persistStaticState(state);

    await Promise.race([
      dispatchClientNewOrderAlerts(newOrder, state.settings),
      new Promise((resolve) => setTimeout(resolve, 3500))
    ]);

    const payment = {
      gateway: paymentMethod || 'cod',
      transactionRef: `TRX-${Math.floor(10000000 + Math.random() * 90000000)}`,
      merchantNumber: '+8801623604635',
      amountBDT: grandTotal,
      instructions: `Send ৳${grandTotal.toLocaleString()} via ${(paymentMethod || 'cod').toUpperCase()} to +8801623604635 and enter your TrxID below.`
    };

    return jsonResponse(
      {
        success: true,
        order: newOrder,
        payment,
        notifications: newOrder.notifications
      },
      201
    );
  }

  if (method === 'GET' && pathname.startsWith('/api/orders/track/')) {
    const orderNumber = decodeURIComponent(pathname.slice('/api/orders/track/'.length))
      .toUpperCase()
      .trim();
    const order = state.orders.find((o) => o.orderNumber.toUpperCase() === orderNumber);
    if (!order) {
      return jsonResponse(
        { error: 'Order not found. Please check your order number (e.g. BDTZ-104820).' },
        404
      );
    }
    return jsonResponse(order);
  }

  if (method === 'POST' && pathname === '/api/payment/verify') {
    const { orderId, transactionRef } = body;
    const order = state.orders.find((o) => o.id === orderId || o.orderNumber === orderId);
    if (!order) return jsonResponse({ error: 'Order not found' }, 404);
    order.paymentStatus = 'paid';
    order.orderStatus = 'confirmed';
    order.transactionRef = transactionRef;
    order.updatedAt = new Date().toISOString();
    order.auditLog.push({
      timestamp: order.updatedAt,
      action: 'Payment Verified',
      note: `TrxID: ${transactionRef}`,
      actor: 'Gateway'
    });
    persistStaticState(state);
    return jsonResponse({ success: true, order });
  }

  if (method === 'POST' && pathname === '/api/contact') {
    if (!body.name || !body.message) {
      return jsonResponse({ error: 'Name and message are required.' }, 400);
    }
    const newInquiry = {
      id: `cont_${Date.now()}`,
      name: body.name,
      email: body.email || '',
      phone: body.phone || '',
      subject: body.subject || 'General Inquiry',
      message: body.message,
      status: 'new' as const,
      createdAt: new Date().toISOString()
    };
    state.contactSubmissions.unshift(newInquiry);
    persistStaticState(state);
    await Promise.race([
      dispatchClientContactInquiry(newInquiry, state.settings),
      new Promise((resolve) => setTimeout(resolve, 3000))
    ]);
    return jsonResponse({ success: true, message: 'Your message has been received by our concierge team.' });
  }

  if (method === 'GET' && pathname.startsWith('/api/reviews/')) {
    const productId = decodeURIComponent(pathname.slice('/api/reviews/'.length));
    return jsonResponse(state.reviews.filter((r) => r.productId === productId && r.status === 'approved'));
  }

  if (method === 'POST' && pathname === '/api/reviews') {
    const { productId, userName, rating, title, comment } = body;
    if (!productId || !userName || !rating || !comment) {
      return jsonResponse({ error: 'Please complete all required review fields.' }, 400);
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
    state.reviews.unshift(newReview);
    persistStaticState(state);
    return jsonResponse({ success: true, review: newReview }, 201);
  }

  // 2. Customer Auth Fallback
  if (method === 'POST' && pathname === '/api/auth/register') {
    const { name, email, phone, password } = body;
    if (!name || !email || !password || !phone) {
      return jsonResponse({ error: 'Please fill out all required fields.' }, 400);
    }
    if (state.customers.some((c) => c.email.toLowerCase() === String(email).toLowerCase())) {
      return jsonResponse({ error: 'An account with this email address already exists.' }, 400);
    }
    const newCustomer = {
      id: `usr_${Date.now()}`,
      name,
      email: String(email).toLowerCase(),
      phone,
      country: 'BD' as const,
      role: 'customer' as const,
      password: String(password),
      addresses: [],
      createdAt: new Date().toISOString()
    };
    state.customers.push(newCustomer);
    persistStaticState(state);

    await Promise.race([
      dispatchClientNewUserAlerts(newCustomer, state.settings),
      new Promise((resolve) => setTimeout(resolve, 3500))
    ]);

    return jsonResponse(
      {
        token: `static_tok_${newCustomer.id}`,
        user: {
          id: newCustomer.id,
          name: newCustomer.name,
          email: newCustomer.email,
          phone: newCustomer.phone,
          country: 'BD',
          role: 'customer',
          addresses: []
        }
      },
      201
    );
  }

  if (method === 'POST' && pathname === '/api/auth/login') {
    const { email, password } = body;
    const found = state.customers.find(
      (c) => c.email.toLowerCase() === String(email || '').toLowerCase() && c.password === String(password)
    );
    if (!found) return jsonResponse({ error: 'Invalid email or password.' }, 401);
    return jsonResponse({
      token: `static_tok_${found.id}`,
      user: {
        id: found.id,
        name: found.name,
        email: found.email,
        phone: found.phone,
        country: 'BD',
        role: 'customer',
        addresses: found.addresses
      }
    });
  }

  if (method === 'GET' && pathname === '/api/auth/orders') {
    return jsonResponse(state.orders);
  }

  // 3. Admin Panel Fallback (krrahman / kr123456)
  if (method === 'POST' && pathname === '/api/admin/login') {
    const { username, password } = body;
    if (String(username || '').trim().toLowerCase() === 'krrahman' && password === 'kr123456') {
      return jsonResponse({
        token: 'static_admin_token_krrahman',
        admin: {
          id: 'user_admin_krrahman',
          name: 'krrahman',
          email: 'admin@bdtechzen.com',
          role: 'admin'
        }
      });
    }
    return jsonResponse({ error: 'Invalid administrator credentials.' }, 401);
  }

  if (method === 'GET' && pathname === '/api/admin/me') {
    return jsonResponse({
      id: 'user_admin_krrahman',
      name: 'krrahman',
      email: 'admin@bdtechzen.com',
      role: 'admin'
    });
  }

  if (method === 'GET' && pathname === '/api/admin/stats') {
    const paidOrders = state.orders.filter((o) => o.paymentStatus === 'paid');
    const totalRevenueBDT = paidOrders.reduce((acc, o) => acc + o.grandTotal, 0);
    const pendingCodBDT = state.orders
      .filter((o) => o.paymentStatus === 'pending' && o.orderStatus !== 'cancelled')
      .reduce((acc, o) => acc + o.grandTotal, 0);
    let totalUnits = 0;
    let lowStock = 0;
    let outOfStock = 0;
    state.products.forEach((p) => {
      const s = p.variants.reduce((a, v) => a + v.stock, 0);
      totalUnits += s;
      if (s === 0) outOfStock++;
      else if (s < 12) lowStock++;
    });

    const paymentMethodCounts: Record<string, number> = {};
    state.orders.forEach((o) => {
      paymentMethodCounts[o.paymentMethod] = (paymentMethodCounts[o.paymentMethod] || 0) + 1;
    });

    return jsonResponse({
      revenue: { totalRevenueBDT, pendingCodBDT, todaySalesBDT: pendingCodBDT },
      orders: {
        total: state.orders.length,
        pending: state.orders.filter((o) => o.orderStatus === 'confirmed' || o.orderStatus === 'pending_payment').length,
        processing: state.orders.filter((o) => o.orderStatus === 'processing').length,
        shipped: state.orders.filter((o) => o.orderStatus === 'shipped').length,
        delivered: state.orders.filter((o) => o.orderStatus === 'delivered').length,
        cancelled: state.orders.filter((o) => o.orderStatus === 'cancelled').length
      },
      inventory: {
        totalProducts: state.products.length,
        totalUnits,
        lowStock,
        outOfStock
      },
      customersCount: state.customers.length,
      categoriesCount: state.categories.length,
      couponsCount: state.coupons.filter((c) => c.isActive).length,
      paymentMethodCounts,
      recentOrders: state.orders.slice(0, 8)
    });
  }

  if (pathname === '/api/admin/products') {
    if (method === 'GET') return jsonResponse(state.products);
    if (method === 'POST') {
      const slug = String(body.name || 'shoe')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      const created: Product = {
        id: `prod_${Date.now()}`,
        name: body.name,
        slug: `${slug}-${Math.floor(100 + Math.random() * 900)}`,
        sku: String(body.sku || `SKU-${Date.now()}`).toUpperCase(),
        productType: body.productType || 'variable',
        ribbonText: body.ribbonText || '',
        brand: body.brand || 'BDTechZen Studio',
        category: body.category || 'sneakers',
        gender: body.gender || 'unisex',
        description: body.description || '',
        images:
          Array.isArray(body.images) && body.images.length > 0
            ? body.images
            : ['/src/assets/images/hero_bangladeshi_models_1792779716481.jpg'],
        regularPriceBDT: Number(body.regularPriceBDT) || 2990,
        salePriceBDT: body.salePriceBDT ? Number(body.salePriceBDT) : undefined,
        isFeatured: Boolean(body.isFeatured),
        isBestSeller: Boolean(body.isBestSeller),
        isPublished: body.isPublished !== false,
        variants: Array.isArray(body.variants) ? body.variants : [],
        specifications: body.specifications || {},
        rating: 5,
        reviewCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      state.products.unshift(created);
      persistStaticState(state);
      return jsonResponse(created, 201);
    }
  }

  if (pathname.startsWith('/api/admin/products/')) {
    const id = pathname.slice('/api/admin/products/'.length);
    if (method === 'PUT') {
      const idx = state.products.findIndex((p) => p.id === id);
      if (idx === -1) return jsonResponse({ error: 'Product not found' }, 404);
      state.products[idx] = { ...state.products[idx], ...body, id, updatedAt: new Date().toISOString() };
      persistStaticState(state);
      return jsonResponse(state.products[idx]);
    }
    if (method === 'DELETE') {
      state.products = state.products.filter((p) => p.id !== id);
      persistStaticState(state);
      return jsonResponse({ success: true });
    }
  }

  if (method === 'POST' && pathname === '/api/admin/upload-image') {
    return jsonResponse({ url: body.dataUrl || '', filename: `inline_${Date.now()}` });
  }

  if (method === 'GET' && pathname === '/api/admin/orders') {
    return jsonResponse(state.orders);
  }

  if (method === 'PUT' && pathname.startsWith('/api/admin/orders/') && pathname.endsWith('/status')) {
    const id = pathname.slice('/api/admin/orders/'.length, -'/status'.length);
    const order = state.orders.find((o) => o.id === id || o.orderNumber === id);
    if (!order) return jsonResponse({ error: 'Order not found' }, 404);
    if (body.status) order.orderStatus = body.status;
    if (body.paymentStatus) order.paymentStatus = body.paymentStatus;
    if (body.trackingNumber !== undefined) order.trackingNumber = body.trackingNumber;
    if (body.courierName !== undefined) order.courierName = body.courierName;
    order.updatedAt = new Date().toISOString();
    persistStaticState(state);
    return jsonResponse(order);
  }

  if (method === 'GET' && pathname === '/api/admin/customers') {
    return jsonResponse(state.customers);
  }

  if (method === 'GET' && pathname === '/api/admin/coupons') {
    return jsonResponse(state.coupons);
  }

  if (pathname === '/api/admin/settings') {
    if (method === 'GET') return jsonResponse(state.settings);
    if (method === 'PUT') {
      state.settings = { ...state.settings, ...body };
      persistStaticState(state);
      return jsonResponse(state.settings);
    }
  }

  if (method === 'GET' && pathname === '/api/admin/reviews') {
    return jsonResponse(state.reviews);
  }

  if (method === 'GET' && pathname === '/api/admin/contact-messages') {
    return jsonResponse(state.contactSubmissions);
  }

  if (method === 'POST' && pathname === '/api/admin/test-alert') {
    const effectiveSettings: StoreSettings = body?.settings
      ? { ...state.settings, ...body.settings }
      : state.settings;
    const result = await sendTestAdminAlert(effectiveSettings);
    return jsonResponse({ success: true, result });
  }

  return jsonResponse({ error: `Endpoint not found: ${pathname}` }, 404);
}

function nativeBrowserFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  return window.fetch(input, init);
}

export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  if (typeof window === 'undefined') {
    return fetch(input, init);
  }

  const urlStr =
    typeof input === 'string'
      ? input
      : input instanceof URL
      ? input.toString()
      : input.url;

  let urlObj: URL | null = null;
  try {
    urlObj = new URL(urlStr, window.location.origin);
  } catch {
    return nativeBrowserFetch(input, init);
  }

  const isSameOriginApi =
    urlObj.origin === window.location.origin && urlObj.pathname.startsWith('/api/');

  if (!isSameOriginApi) {
    return nativeBrowserFetch(input, init);
  }

  if (isStaticModeConfirmed === true) {
    return handleStaticApiRequest(nativeBrowserFetch, urlObj, init);
  }

  try {
    const response = await nativeBrowserFetch(input, init);
    const contentType = (response.headers.get('content-type') || '').toLowerCase();

    // Real Express / Netlify Function backend always returns application/json for /api/*
    if (contentType.includes('application/json')) {
      isStaticModeConfirmed = false;
      return response;
    }

    // Static Netlify Drop returns text/html (SPA _redirects) or 404/405/502 when no backend exists
    if (
      contentType.includes('text/html') ||
      response.status === 404 ||
      response.status === 405 ||
      response.status === 502
    ) {
      isStaticModeConfirmed = true;
      return handleStaticApiRequest(nativeBrowserFetch, urlObj, init);
    }

    return response;
  } catch {
    isStaticModeConfirmed = true;
    return handleStaticApiRequest(nativeBrowserFetch, urlObj, init);
  }
}

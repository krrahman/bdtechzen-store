import mysql, { Pool, PoolConnection, RowDataPacket } from 'mysql2/promise';
import type {
  DatabaseSchema,
  Product,
  ProductVariant,
  Category,
  Brand,
  User,
  Order,
  OrderItem,
  Coupon,
  Review,
  ContactSubmission,
  StoreSettings
} from './db.js';

declare global {
  var _bdtechzenMysqlPool: Pool | undefined;
}

export function isMySqlConfigured(): boolean {
  const url = (process.env.MYSQL_URL || process.env.DATABASE_URL || '').trim();
  if (url.startsWith('mysql://') || url.startsWith('mysql2://')) {
    return true;
  }
  return Boolean(process.env.MYSQL_HOST && process.env.MYSQL_HOST.trim().length > 0);
}

function shouldUseMySqlSsl(host: string, rawUrl: string): boolean {
  if (process.env.MYSQL_SSL === 'true' || process.env.MYSQL_SSL === '1') return true;
  if (process.env.MYSQL_SSL === 'false' || process.env.MYSQL_SSL === '0') return false;
  if (/ssl=/i.test(rawUrl) || /ssl-mode=/i.test(rawUrl)) return true;
  return /(tidbcloud\.com|aivencloud\.com|psdb\.cloud|railway\.app|clever-cloud\.com|filess\.io|amazonaws\.com)/i.test(
    host
  );
}

export function getMySqlPool(): Pool | null {
  if (!isMySqlConfigured()) return null;

  if (!global._bdtechzenMysqlPool) {
    const rawUrl = (process.env.MYSQL_URL || process.env.DATABASE_URL || '').trim();
    if (rawUrl.startsWith('mysql://') || rawUrl.startsWith('mysql2://')) {
      try {
        const parsed = new URL(rawUrl.replace(/^mysql2:\/\//, 'mysql://'));
        const host = parsed.hostname;
        const port = Number(parsed.port) || 3306;
        const user = decodeURIComponent(parsed.username || 'root');
        const password = decodeURIComponent(parsed.password || '');
        const database = decodeURIComponent(parsed.pathname.replace(/^\//, '') || 'bdtechzen_store');
        const useSsl = shouldUseMySqlSsl(host, rawUrl);

        global._bdtechzenMysqlPool = mysql.createPool({
          host,
          port,
          user,
          password,
          database,
          waitForConnections: true,
          connectionLimit: 5,
          queueLimit: 0,
          charset: 'utf8mb4',
          ...(useSsl ? { ssl: { rejectUnauthorized: false } } : {})
        });
        return global._bdtechzenMysqlPool;
      } catch (err) {
        console.error('[MySQL] Invalid MYSQL_URL / DATABASE_URL:', err);
        return null;
      }
    }

    const host = process.env.MYSQL_HOST!.trim();
    const useSsl = shouldUseMySqlSsl(host, '');
    global._bdtechzenMysqlPool = mysql.createPool({
      host,
      port: Number(process.env.MYSQL_PORT) || 3306,
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'bdtechzen_store',
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 0,
      charset: 'utf8mb4',
      ...(useSsl ? { ssl: { rejectUnauthorized: false } } : {})
    });
  }

  return global._bdtechzenMysqlPool;
}

export const MYSQL_SCHEMA_STATEMENTS: string[] = [
  `CREATE TABLE IF NOT EXISTS store_settings (
    id INT NOT NULL PRIMARY KEY,
    store_name VARCHAR(191) NOT NULL,
    logo_url TEXT,
    store_tagline TEXT NOT NULL,
    support_email VARCHAR(191) NOT NULL,
    support_phone VARCHAR(64) NOT NULL,
    whatsapp_number VARCHAR(64) NOT NULL,
    announcement_text TEXT NOT NULL,
    announcement_enabled TINYINT(1) NOT NULL DEFAULT 1,
    inside_dhaka_fee INT NOT NULL DEFAULT 70,
    outside_dhaka_fee INT NOT NULL DEFAULT 130,
    free_shipping_threshold INT NOT NULL DEFAULT 3000,
    hero_title TEXT NOT NULL,
    hero_subtitle TEXT NOT NULL,
    hero_cta_text VARCHAR(120) NOT NULL,
    hero_cta_link VARCHAR(191) NOT NULL,
    hero_image_url TEXT NOT NULL,
    payment_gateways_json LONGTEXT NOT NULL,
    notifications_json LONGTEXT NOT NULL,
    maintenance_mode TINYINT(1) NOT NULL DEFAULT 0,
    updated_at VARCHAR(64) NOT NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    name VARCHAR(191) NOT NULL,
    slug VARCHAR(191) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    image TEXT NOT NULL,
    display_order INT NOT NULL DEFAULT 1,
    is_featured TINYINT(1) NOT NULL DEFAULT 0
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS brands (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    name VARCHAR(191) NOT NULL,
    slug VARCHAR(191) NOT NULL UNIQUE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    sku VARCHAR(100) NOT NULL UNIQUE,
    product_type VARCHAR(32) NOT NULL DEFAULT 'variable',
    ribbon_text VARCHAR(120) DEFAULT '',
    brand VARCHAR(191) NOT NULL,
    category VARCHAR(191) NOT NULL,
    gender VARCHAR(32) NOT NULL DEFAULT 'unisex',
    description TEXT NOT NULL,
    images_json LONGTEXT NOT NULL,
    regular_price_bdt INT NOT NULL,
    sale_price_bdt INT DEFAULT NULL,
    is_featured TINYINT(1) NOT NULL DEFAULT 0,
    is_best_seller TINYINT(1) NOT NULL DEFAULT 0,
    is_published TINYINT(1) NOT NULL DEFAULT 1,
    specifications_json LONGTEXT NOT NULL,
    rating DECIMAL(3,1) NOT NULL DEFAULT 5.0,
    review_count INT NOT NULL DEFAULT 0,
    created_at VARCHAR(64) NOT NULL,
    updated_at VARCHAR(64) NOT NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS product_variants (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    product_id VARCHAR(64) NOT NULL,
    size VARCHAR(64) NOT NULL,
    color VARCHAR(120) NOT NULL,
    color_hex VARCHAR(32) DEFAULT NULL,
    stock INT NOT NULL DEFAULT 0,
    sku_variant VARCHAR(120) NOT NULL,
    price_override_bdt INT DEFAULT NULL,
    INDEX idx_product_variants_product_id (product_id),
    CONSTRAINT fk_variant_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    name VARCHAR(191) NOT NULL,
    email VARCHAR(191) NOT NULL UNIQUE,
    phone VARCHAR(64) NOT NULL,
    country VARCHAR(8) NOT NULL DEFAULT 'BD',
    role VARCHAR(32) NOT NULL DEFAULT 'customer',
    password_hash VARCHAR(255) NOT NULL,
    salt VARCHAR(128) NOT NULL,
    must_change_password TINYINT(1) NOT NULL DEFAULT 0,
    addresses_json LONGTEXT NOT NULL,
    created_at VARCHAR(64) NOT NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    order_number VARCHAR(64) NOT NULL UNIQUE,
    user_id VARCHAR(64) DEFAULT NULL,
    is_guest TINYINT(1) NOT NULL DEFAULT 1,
    customer_name VARCHAR(191) NOT NULL,
    customer_email VARCHAR(191) NOT NULL,
    customer_phone VARCHAR(64) NOT NULL,
    shipping_address_json LONGTEXT NOT NULL,
    currency VARCHAR(8) NOT NULL DEFAULT 'BDT',
    subtotal INT NOT NULL,
    discount INT NOT NULL DEFAULT 0,
    coupon_code VARCHAR(64) DEFAULT NULL,
    shipping_charge INT NOT NULL DEFAULT 0,
    tax INT NOT NULL DEFAULT 0,
    grand_total INT NOT NULL,
    shipping_method VARCHAR(191) NOT NULL,
    payment_method VARCHAR(32) NOT NULL DEFAULT 'cod',
    payment_status VARCHAR(32) NOT NULL DEFAULT 'pending',
    order_status VARCHAR(32) NOT NULL DEFAULT 'confirmed',
    transaction_ref VARCHAR(128) DEFAULT NULL,
    tracking_number VARCHAR(128) DEFAULT NULL,
    courier_name VARCHAR(128) DEFAULT NULL,
    internal_notes TEXT,
    notifications_json LONGTEXT,
    audit_log_json LONGTEXT NOT NULL,
    cancellation_reason TEXT,
    return_reason TEXT,
    created_at VARCHAR(64) NOT NULL,
    updated_at VARCHAR(64) NOT NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS order_items (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    order_id VARCHAR(64) NOT NULL,
    product_id VARCHAR(64) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    product_sku VARCHAR(120) NOT NULL,
    image TEXT NOT NULL,
    size VARCHAR(64) NOT NULL,
    color VARCHAR(120) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price INT NOT NULL,
    total_price INT NOT NULL,
    currency VARCHAR(8) NOT NULL DEFAULT 'BDT',
    INDEX idx_order_items_order_id (order_id),
    CONSTRAINT fk_item_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS coupons (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    code VARCHAR(64) NOT NULL UNIQUE,
    discount_type VARCHAR(32) NOT NULL DEFAULT 'percentage',
    discount_value INT NOT NULL,
    min_order_amount INT NOT NULL DEFAULT 0,
    max_discount_amount INT DEFAULT NULL,
    start_date VARCHAR(32) NOT NULL,
    expiry_date VARCHAR(32) NOT NULL,
    usage_limit INT NOT NULL DEFAULT 1000,
    times_used INT NOT NULL DEFAULT 0,
    country_restriction VARCHAR(8) NOT NULL DEFAULT 'BD',
    is_active TINYINT(1) NOT NULL DEFAULT 1
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS reviews (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    product_id VARCHAR(64) NOT NULL,
    user_id VARCHAR(64) DEFAULT NULL,
    user_name VARCHAR(191) NOT NULL,
    user_country VARCHAR(8) NOT NULL DEFAULT 'BD',
    rating INT NOT NULL DEFAULT 5,
    title VARCHAR(255) NOT NULL,
    comment TEXT NOT NULL,
    is_verified_purchase TINYINT(1) NOT NULL DEFAULT 1,
    status VARCHAR(32) NOT NULL DEFAULT 'approved',
    created_at VARCHAR(64) NOT NULL,
    INDEX idx_reviews_product_id (product_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS contact_submissions (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    name VARCHAR(191) NOT NULL,
    email VARCHAR(191) NOT NULL,
    phone VARCHAR(64) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'new',
    created_at VARCHAR(64) NOT NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
];

async function writeSchemaToConnection(conn: PoolConnection, data: DatabaseSchema): Promise<void> {
  const s = data.settings;
  await conn.execute(
    `INSERT INTO store_settings (
      id, store_name, logo_url, store_tagline, support_email, support_phone, whatsapp_number,
      announcement_text, announcement_enabled, inside_dhaka_fee, outside_dhaka_fee, free_shipping_threshold,
      hero_title, hero_subtitle, hero_cta_text, hero_cta_link, hero_image_url,
      payment_gateways_json, notifications_json, maintenance_mode, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      store_name = VALUES(store_name),
      logo_url = VALUES(logo_url),
      store_tagline = VALUES(store_tagline),
      support_email = VALUES(support_email),
      support_phone = VALUES(support_phone),
      whatsapp_number = VALUES(whatsapp_number),
      announcement_text = VALUES(announcement_text),
      announcement_enabled = VALUES(announcement_enabled),
      inside_dhaka_fee = VALUES(inside_dhaka_fee),
      outside_dhaka_fee = VALUES(outside_dhaka_fee),
      free_shipping_threshold = VALUES(free_shipping_threshold),
      hero_title = VALUES(hero_title),
      hero_subtitle = VALUES(hero_subtitle),
      hero_cta_text = VALUES(hero_cta_text),
      hero_cta_link = VALUES(hero_cta_link),
      hero_image_url = VALUES(hero_image_url),
      payment_gateways_json = VALUES(payment_gateways_json),
      notifications_json = VALUES(notifications_json),
      maintenance_mode = VALUES(maintenance_mode),
      updated_at = VALUES(updated_at)`,
    [
      1,
      s.storeName,
      s.logoUrl || '',
      s.storeTagline,
      s.supportEmail,
      s.supportPhone,
      s.whatsappNumber,
      s.announcementText,
      s.announcementEnabled ? 1 : 0,
      s.shippingBD.insideDhaka,
      s.shippingBD.outsideDhaka,
      s.shippingBD.freeShippingThreshold,
      s.heroBanner.title,
      s.heroBanner.subtitle,
      s.heroBanner.ctaText,
      s.heroBanner.ctaLink,
      s.heroBanner.imageUrl,
      JSON.stringify(s.paymentGateways),
      JSON.stringify(
        s.notifications || { emailEnabled: true, smsEnabled: true, senderName: 'BDTechZen Studio' }
      ),
      s.maintenanceMode ? 1 : 0,
      new Date().toISOString()
    ]
  );

  // Sync categories
  await conn.execute('DELETE FROM categories');
  for (const c of data.categories) {
    await conn.execute(
      `INSERT INTO categories (id, name, slug, description, image, display_order, is_featured)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [c.id, c.name, c.slug, c.description, c.image, c.displayOrder, c.isFeatured ? 1 : 0]
    );
  }

  // Sync brands
  await conn.execute('DELETE FROM brands');
  for (const b of data.brands) {
    await conn.execute(`INSERT INTO brands (id, name, slug) VALUES (?, ?, ?)`, [b.id, b.name, b.slug]);
  }

  // Sync products & variants
  await conn.execute('DELETE FROM product_variants');
  await conn.execute('DELETE FROM products');
  for (const p of data.products) {
    await conn.execute(
      `INSERT INTO products (
        id, name, slug, sku, product_type, ribbon_text, brand, category, gender, description,
        images_json, regular_price_bdt, sale_price_bdt, is_featured, is_best_seller, is_published,
        specifications_json, rating, review_count, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        p.id,
        p.name,
        p.slug,
        p.sku,
        p.productType || 'variable',
        p.ribbonText || '',
        p.brand,
        p.category,
        p.gender,
        p.description,
        JSON.stringify(p.images),
        p.regularPriceBDT,
        p.salePriceBDT ?? null,
        p.isFeatured ? 1 : 0,
        p.isBestSeller ? 1 : 0,
        p.isPublished ? 1 : 0,
        JSON.stringify(p.specifications || {}),
        p.rating,
        p.reviewCount,
        p.createdAt,
        p.updatedAt
      ]
    );

    for (const v of p.variants) {
      await conn.execute(
        `INSERT INTO product_variants (
          id, product_id, size, color, color_hex, stock, sku_variant, price_override_bdt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          v.id,
          p.id,
          v.size,
          v.color,
          v.colorHex ?? null,
          v.stock,
          v.skuVariant,
          v.priceOverrideBDT ?? null
        ]
      );
    }
  }

  // Sync users
  await conn.execute('DELETE FROM users');
  for (const u of data.users) {
    await conn.execute(
      `INSERT INTO users (
        id, name, email, phone, country, role, password_hash, salt, must_change_password, addresses_json, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        u.id,
        u.name,
        u.email,
        u.phone,
        u.country || 'BD',
        u.role,
        u.passwordHash,
        u.salt,
        u.mustChangePassword ? 1 : 0,
        JSON.stringify(u.addresses || []),
        u.createdAt
      ]
    );
  }

  // Sync orders & order_items
  await conn.execute('DELETE FROM order_items');
  await conn.execute('DELETE FROM orders');
  for (const o of data.orders) {
    await conn.execute(
      `INSERT INTO orders (
        id, order_number, user_id, is_guest, customer_name, customer_email, customer_phone,
        shipping_address_json, currency, subtotal, discount, coupon_code, shipping_charge, tax,
        grand_total, shipping_method, payment_method, payment_status, order_status,
        transaction_ref, tracking_number, courier_name, internal_notes, notifications_json,
        audit_log_json, cancellation_reason, return_reason, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        o.id,
        o.orderNumber,
        o.userId ?? null,
        o.isGuest ? 1 : 0,
        o.customerName,
        o.customerEmail,
        o.customerPhone,
        JSON.stringify(o.shippingAddress),
        o.currency,
        o.subtotal,
        o.discount,
        o.couponCode ?? null,
        o.shippingCharge,
        o.tax,
        o.grandTotal,
        o.shippingMethod,
        o.paymentMethod,
        o.paymentStatus,
        o.orderStatus,
        o.transactionRef ?? null,
        o.trackingNumber ?? null,
        o.courierName ?? null,
        o.internalNotes ?? null,
        JSON.stringify(o.notifications || []),
        JSON.stringify(o.auditLog || []),
        o.cancellationReason ?? null,
        o.returnReason ?? null,
        o.createdAt,
        o.updatedAt
      ]
    );

    for (const item of o.items) {
      await conn.execute(
        `INSERT INTO order_items (
          order_id, product_id, product_name, product_sku, image, size, color, quantity, unit_price, total_price, currency
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          o.id,
          item.productId,
          item.productName,
          item.productSku,
          item.image,
          item.size,
          item.color,
          item.quantity,
          item.unitPrice,
          item.totalPrice,
          item.currency
        ]
      );
    }
  }

  // Sync coupons
  await conn.execute('DELETE FROM coupons');
  for (const c of data.coupons) {
    await conn.execute(
      `INSERT INTO coupons (
        id, code, discount_type, discount_value, min_order_amount, max_discount_amount,
        start_date, expiry_date, usage_limit, times_used, country_restriction, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        c.id,
        c.code,
        c.discountType,
        c.discountValue,
        c.minOrderAmount,
        c.maxDiscountAmount ?? null,
        c.startDate,
        c.expiryDate,
        c.usageLimit,
        c.timesUsed,
        c.countryRestriction || 'BD',
        c.isActive ? 1 : 0
      ]
    );
  }

  // Sync reviews
  await conn.execute('DELETE FROM reviews');
  for (const r of data.reviews) {
    await conn.execute(
      `INSERT INTO reviews (
        id, product_id, user_id, user_name, user_country, rating, title, comment, is_verified_purchase, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        r.id,
        r.productId,
        r.userId ?? null,
        r.userName,
        r.userCountry || 'BD',
        r.rating,
        r.title,
        r.comment,
        r.isVerifiedPurchase ? 1 : 0,
        r.status,
        r.createdAt
      ]
    );
  }

  // Sync contact submissions
  await conn.execute('DELETE FROM contact_submissions');
  for (const m of data.contactSubmissions) {
    await conn.execute(
      `INSERT INTO contact_submissions (id, name, email, phone, subject, message, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [m.id, m.name, m.email, m.phone, m.subject, m.message, m.status, m.createdAt]
    );
  }
}

export async function initMySqlAndHydrate(
  defaultData: DatabaseSchema
): Promise<DatabaseSchema | null> {
  const pool = getMySqlPool();
  if (!pool) return null;

  let conn: PoolConnection | null = null;
  try {
    conn = await pool.getConnection();
    for (const ddl of MYSQL_SCHEMA_STATEMENTS) {
      await conn.execute(ddl);
    }

    const [prodRows] = await conn.query<RowDataPacket[]>('SELECT COUNT(*) AS cnt FROM products');
    const productCount = Number(prodRows[0]?.cnt || 0);

    if (productCount === 0) {
      await conn.beginTransaction();
      await writeSchemaToConnection(conn, defaultData);
      await conn.commit();
      console.log('[MySQL] Initialized schema and seeded BDTechZen catalog.');
      return defaultData;
    }

    // Hydrate DatabaseSchema from MySQL tables
    const [settingsRows] = await conn.query<RowDataPacket[]>(
      'SELECT * FROM store_settings WHERE id = 1 LIMIT 1'
    );
    const [catRows] = await conn.query<RowDataPacket[]>(
      'SELECT * FROM categories ORDER BY display_order ASC'
    );
    const [brandRows] = await conn.query<RowDataPacket[]>('SELECT * FROM brands');
    const [productRows] = await conn.query<RowDataPacket[]>(
      'SELECT * FROM products ORDER BY created_at DESC'
    );
    const [variantRows] = await conn.query<RowDataPacket[]>('SELECT * FROM product_variants');
    const [userRows] = await conn.query<RowDataPacket[]>('SELECT * FROM users');
    const [orderRows] = await conn.query<RowDataPacket[]>(
      'SELECT * FROM orders ORDER BY created_at DESC'
    );
    const [orderItemRows] = await conn.query<RowDataPacket[]>('SELECT * FROM order_items');
    const [couponRows] = await conn.query<RowDataPacket[]>('SELECT * FROM coupons');
    const [reviewRows] = await conn.query<RowDataPacket[]>(
      'SELECT * FROM reviews ORDER BY created_at DESC'
    );
    const [contactRows] = await conn.query<RowDataPacket[]>(
      'SELECT * FROM contact_submissions ORDER BY created_at DESC'
    );

    const sr = settingsRows[0];
    const settings: StoreSettings = sr
      ? {
          storeName: sr.store_name,
          logoUrl: sr.logo_url || '',
          storeTagline: sr.store_tagline,
          supportEmail: sr.support_email,
          supportPhone: sr.support_phone,
          whatsappNumber: sr.whatsapp_number,
          announcementText: sr.announcement_text,
          announcementEnabled: Boolean(sr.announcement_enabled),
          shippingBD: {
            insideDhaka: Number(sr.inside_dhaka_fee),
            outsideDhaka: Number(sr.outside_dhaka_fee),
            freeShippingThreshold: Number(sr.free_shipping_threshold)
          },
          paymentGateways: JSON.parse(sr.payment_gateways_json),
          heroBanner: {
            title: sr.hero_title,
            subtitle: sr.hero_subtitle,
            ctaText: sr.hero_cta_text,
            ctaLink: sr.hero_cta_link,
            imageUrl: sr.hero_image_url
          },
          notifications: JSON.parse(sr.notifications_json),
          maintenanceMode: Boolean(sr.maintenance_mode)
        }
      : defaultData.settings;

    const variantsByProduct = new Map<string, ProductVariant[]>();
    for (const v of variantRows) {
      const list = variantsByProduct.get(v.product_id) || [];
      list.push({
        id: v.id,
        size: v.size,
        color: v.color,
        colorHex: v.color_hex || undefined,
        stock: Number(v.stock),
        skuVariant: v.sku_variant,
        priceOverrideBDT: v.price_override_bdt !== null ? Number(v.price_override_bdt) : undefined
      });
      variantsByProduct.set(v.product_id, list);
    }

    const products: Product[] = productRows.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      sku: p.sku,
      productType: p.product_type,
      ribbonText: p.ribbon_text || '',
      brand: p.brand,
      category: p.category,
      gender: p.gender,
      description: p.description,
      images: JSON.parse(p.images_json || '[]'),
      regularPriceBDT: Number(p.regular_price_bdt),
      salePriceBDT: p.sale_price_bdt !== null ? Number(p.sale_price_bdt) : undefined,
      isFeatured: Boolean(p.is_featured),
      isBestSeller: Boolean(p.is_best_seller),
      isPublished: Boolean(p.is_published),
      variants: variantsByProduct.get(p.id) || [],
      specifications: JSON.parse(p.specifications_json || '{}'),
      rating: Number(p.rating),
      reviewCount: Number(p.review_count),
      createdAt: p.created_at,
      updatedAt: p.updated_at
    }));

    const categories: Category[] = catRows.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      image: c.image,
      displayOrder: Number(c.display_order),
      isFeatured: Boolean(c.is_featured)
    }));

    const brands: Brand[] = brandRows.map((b) => ({
      id: b.id,
      name: b.name,
      slug: b.slug
    }));

    const users: User[] = userRows.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      country: 'BD',
      role: u.role,
      passwordHash: u.password_hash,
      salt: u.salt,
      mustChangePassword: Boolean(u.must_change_password),
      addresses: JSON.parse(u.addresses_json || '[]'),
      createdAt: u.created_at
    }));

    const itemsByOrder = new Map<string, OrderItem[]>();
    for (const item of orderItemRows) {
      const list = itemsByOrder.get(item.order_id) || [];
      list.push({
        productId: item.product_id,
        productName: item.product_name,
        productSku: item.product_sku,
        image: item.image,
        size: item.size,
        color: item.color,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unit_price),
        totalPrice: Number(item.total_price),
        currency: 'BDT'
      });
      itemsByOrder.set(item.order_id, list);
    }

    const orders: Order[] = orderRows.map((o) => ({
      id: o.id,
      orderNumber: o.order_number,
      userId: o.user_id || undefined,
      isGuest: Boolean(o.is_guest),
      customerName: o.customer_name,
      customerEmail: o.customer_email,
      customerPhone: o.customer_phone,
      shippingAddress: JSON.parse(o.shipping_address_json),
      items: itemsByOrder.get(o.id) || [],
      currency: 'BDT',
      subtotal: Number(o.subtotal),
      discount: Number(o.discount),
      couponCode: o.coupon_code || undefined,
      shippingCharge: Number(o.shipping_charge),
      tax: Number(o.tax),
      grandTotal: Number(o.grand_total),
      shippingMethod: o.shipping_method,
      paymentMethod: o.payment_method,
      paymentStatus: o.payment_status,
      orderStatus: o.order_status,
      transactionRef: o.transaction_ref || undefined,
      trackingNumber: o.tracking_number || undefined,
      courierName: o.courier_name || undefined,
      internalNotes: o.internal_notes || undefined,
      notifications: JSON.parse(o.notifications_json || '[]'),
      auditLog: JSON.parse(o.audit_log_json || '[]'),
      cancellationReason: o.cancellation_reason || undefined,
      returnReason: o.return_reason || undefined,
      createdAt: o.created_at,
      updatedAt: o.updated_at
    }));

    const coupons: Coupon[] = couponRows.map((c) => ({
      id: c.id,
      code: c.code,
      discountType: c.discount_type,
      discountValue: Number(c.discount_value),
      minOrderAmount: Number(c.min_order_amount),
      maxDiscountAmount: c.max_discount_amount !== null ? Number(c.max_discount_amount) : undefined,
      startDate: c.start_date,
      expiryDate: c.expiry_date,
      usageLimit: Number(c.usage_limit),
      timesUsed: Number(c.times_used),
      countryRestriction: 'BD',
      isActive: Boolean(c.is_active)
    }));

    const reviews: Review[] = reviewRows.map((r) => ({
      id: r.id,
      productId: r.product_id,
      userId: r.user_id || undefined,
      userName: r.user_name,
      userCountry: 'BD',
      rating: Number(r.rating),
      title: r.title,
      comment: r.comment,
      isVerifiedPurchase: Boolean(r.is_verified_purchase),
      status: r.status,
      createdAt: r.created_at
    }));

    const contactSubmissions: ContactSubmission[] = contactRows.map((m) => ({
      id: m.id,
      name: m.name,
      email: m.email,
      phone: m.phone,
      subject: m.subject,
      message: m.message,
      status: m.status,
      createdAt: m.created_at
    }));

    console.log(`[MySQL] Hydrated ${products.length} products and ${orders.length} orders from MySQL.`);
    return {
      schemaVersion: defaultData.schemaVersion,
      products,
      categories,
      brands,
      users,
      orders,
      coupons,
      reviews,
      settings,
      contactSubmissions,
      wishlists: {}
    };
  } catch (err) {
    if (conn) {
      try {
        await conn.rollback();
      } catch {}
    }
    console.error('[MySQL] Failed to connect/hydrate MySQL, falling back to local cache:', err);
    return null;
  } finally {
    if (conn) conn.release();
  }
}

export async function syncDatabaseToMySql(data: DatabaseSchema): Promise<void> {
  const pool = getMySqlPool();
  if (!pool) return;

  let conn: PoolConnection | null = null;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();
    await writeSchemaToConnection(conn, data);
    await conn.commit();
  } catch (err) {
    if (conn) {
      try {
        await conn.rollback();
      } catch {}
    }
    console.error('[MySQL] Failed to persist transaction to MySQL:', err);
  } finally {
    if (conn) conn.release();
  }
}

function sqlVal(val: unknown): string {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return Number.isFinite(val) ? String(val) : '0';
  if (typeof val === 'boolean') return val ? '1' : '0';
  return mysql.escape(String(val));
}

export function generateMySqlDumpSql(data: DatabaseSchema): string {
  const lines: string[] = [
    '-- ============================================================================',
    '-- BDTechZen Footwear Storefront — MySQL 8.0 / MariaDB Database Dump',
    `-- Generated: ${new Date().toISOString()}`,
    '-- Import directly via phpMyAdmin, cPanel MySQL, or mysql CLI',
    '-- ============================================================================',
    '',
    'SET NAMES utf8mb4;',
    'SET FOREIGN_KEY_CHECKS = 0;',
    ''
  ];

  for (const ddl of MYSQL_SCHEMA_STATEMENTS) {
    lines.push(`${ddl};\n`);
  }

  const s = data.settings;
  lines.push('-- Store Settings');
  lines.push(
    `REPLACE INTO store_settings (id, store_name, logo_url, store_tagline, support_email, support_phone, whatsapp_number, announcement_text, announcement_enabled, inside_dhaka_fee, outside_dhaka_fee, free_shipping_threshold, hero_title, hero_subtitle, hero_cta_text, hero_cta_link, hero_image_url, payment_gateways_json, notifications_json, maintenance_mode, updated_at) VALUES (${sqlVal(
      1
    )}, ${sqlVal(s.storeName)}, ${sqlVal(s.logoUrl || '')}, ${sqlVal(s.storeTagline)}, ${sqlVal(
      s.supportEmail
    )}, ${sqlVal(s.supportPhone)}, ${sqlVal(s.whatsappNumber)}, ${sqlVal(
      s.announcementText
    )}, ${sqlVal(s.announcementEnabled)}, ${sqlVal(s.shippingBD.insideDhaka)}, ${sqlVal(
      s.shippingBD.outsideDhaka
    )}, ${sqlVal(s.shippingBD.freeShippingThreshold)}, ${sqlVal(s.heroBanner.title)}, ${sqlVal(
      s.heroBanner.subtitle
    )}, ${sqlVal(s.heroBanner.ctaText)}, ${sqlVal(s.heroBanner.ctaLink)}, ${sqlVal(
      s.heroBanner.imageUrl
    )}, ${sqlVal(JSON.stringify(s.paymentGateways))}, ${sqlVal(
      JSON.stringify(
        s.notifications || { emailEnabled: true, smsEnabled: true, senderName: 'BDTechZen Studio' }
      )
    )}, ${sqlVal(s.maintenanceMode)}, ${sqlVal(new Date().toISOString())});\n`
  );

  lines.push('-- Categories');
  for (const c of data.categories) {
    lines.push(
      `REPLACE INTO categories (id, name, slug, description, image, display_order, is_featured) VALUES (${sqlVal(
        c.id
      )}, ${sqlVal(c.name)}, ${sqlVal(c.slug)}, ${sqlVal(c.description)}, ${sqlVal(
        c.image
      )}, ${sqlVal(c.displayOrder)}, ${sqlVal(c.isFeatured)});`
    );
  }
  lines.push('');

  lines.push('-- Brands');
  for (const b of data.brands) {
    lines.push(
      `REPLACE INTO brands (id, name, slug) VALUES (${sqlVal(b.id)}, ${sqlVal(b.name)}, ${sqlVal(
        b.slug
      )});`
    );
  }
  lines.push('');

  lines.push('-- Products & Variations');
  for (const p of data.products) {
    lines.push(
      `REPLACE INTO products (id, name, slug, sku, product_type, ribbon_text, brand, category, gender, description, images_json, regular_price_bdt, sale_price_bdt, is_featured, is_best_seller, is_published, specifications_json, rating, review_count, created_at, updated_at) VALUES (${sqlVal(
        p.id
      )}, ${sqlVal(p.name)}, ${sqlVal(p.slug)}, ${sqlVal(p.sku)}, ${sqlVal(
        p.productType || 'variable'
      )}, ${sqlVal(p.ribbonText || '')}, ${sqlVal(p.brand)}, ${sqlVal(p.category)}, ${sqlVal(
        p.gender
      )}, ${sqlVal(p.description)}, ${sqlVal(JSON.stringify(p.images))}, ${sqlVal(
        p.regularPriceBDT
      )}, ${sqlVal(p.salePriceBDT ?? null)}, ${sqlVal(p.isFeatured)}, ${sqlVal(
        p.isBestSeller
      )}, ${sqlVal(p.isPublished)}, ${sqlVal(JSON.stringify(p.specifications || {}))}, ${sqlVal(
        p.rating
      )}, ${sqlVal(p.reviewCount)}, ${sqlVal(p.createdAt)}, ${sqlVal(p.updatedAt)});`
    );

    for (const v of p.variants) {
      lines.push(
        `REPLACE INTO product_variants (id, product_id, size, color, color_hex, stock, sku_variant, price_override_bdt) VALUES (${sqlVal(
          v.id
        )}, ${sqlVal(p.id)}, ${sqlVal(v.size)}, ${sqlVal(v.color)}, ${sqlVal(
          v.colorHex ?? null
        )}, ${sqlVal(v.stock)}, ${sqlVal(v.skuVariant)}, ${sqlVal(v.priceOverrideBDT ?? null)});`
      );
    }
  }
  lines.push('');

  lines.push('-- Users (Including Super Admin krrahman)');
  for (const u of data.users) {
    lines.push(
      `REPLACE INTO users (id, name, email, phone, country, role, password_hash, salt, must_change_password, addresses_json, created_at) VALUES (${sqlVal(
        u.id
      )}, ${sqlVal(u.name)}, ${sqlVal(u.email)}, ${sqlVal(u.phone)}, ${sqlVal('BD')}, ${sqlVal(
        u.role
      )}, ${sqlVal(u.passwordHash)}, ${sqlVal(u.salt)}, ${sqlVal(
        Boolean(u.mustChangePassword)
      )}, ${sqlVal(JSON.stringify(u.addresses || []))}, ${sqlVal(u.createdAt)});`
    );
  }
  lines.push('');

  lines.push('-- Coupons');
  for (const c of data.coupons) {
    lines.push(
      `REPLACE INTO coupons (id, code, discount_type, discount_value, min_order_amount, max_discount_amount, start_date, expiry_date, usage_limit, times_used, country_restriction, is_active) VALUES (${sqlVal(
        c.id
      )}, ${sqlVal(c.code)}, ${sqlVal(c.discountType)}, ${sqlVal(c.discountValue)}, ${sqlVal(
        c.minOrderAmount
      )}, ${sqlVal(c.maxDiscountAmount ?? null)}, ${sqlVal(c.startDate)}, ${sqlVal(
        c.expiryDate
      )}, ${sqlVal(c.usageLimit)}, ${sqlVal(c.timesUsed)}, ${sqlVal('BD')}, ${sqlVal(c.isActive)});`
    );
  }
  lines.push('');

  lines.push('-- Reviews');
  for (const r of data.reviews) {
    lines.push(
      `REPLACE INTO reviews (id, product_id, user_id, user_name, user_country, rating, title, comment, is_verified_purchase, status, created_at) VALUES (${sqlVal(
        r.id
      )}, ${sqlVal(r.productId)}, ${sqlVal(r.userId ?? null)}, ${sqlVal(r.userName)}, ${sqlVal(
        'BD'
      )}, ${sqlVal(r.rating)}, ${sqlVal(r.title)}, ${sqlVal(r.comment)}, ${sqlVal(
        r.isVerifiedPurchase
      )}, ${sqlVal(r.status)}, ${sqlVal(r.createdAt)});`
    );
  }
  lines.push('');
  lines.push('SET FOREIGN_KEY_CHECKS = 1;');

  return lines.join('\n');
}

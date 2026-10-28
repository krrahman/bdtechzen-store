-- ============================================================================
-- BDTechZen Footwear Storefront — MySQL 8.0 / MariaDB Database Dump
-- Generated: 2026-10-28T17:00:23.193Z
-- Import directly via phpMyAdmin, cPanel MySQL, or mysql CLI
-- ============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS store_settings (
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
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    name VARCHAR(191) NOT NULL,
    slug VARCHAR(191) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    image TEXT NOT NULL,
    display_order INT NOT NULL DEFAULT 1,
    is_featured TINYINT(1) NOT NULL DEFAULT 0
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS brands (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    name VARCHAR(191) NOT NULL,
    slug VARCHAR(191) NOT NULL UNIQUE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS products (
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
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS product_variants (
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
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS users (
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
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS orders (
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
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS order_items (
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
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS coupons (
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
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS reviews (
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
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS contact_submissions (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    name VARCHAR(191) NOT NULL,
    email VARCHAR(191) NOT NULL,
    phone VARCHAR(64) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'new',
    created_at VARCHAR(64) NOT NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Store Settings
REPLACE INTO store_settings (id, store_name, logo_url, store_tagline, support_email, support_phone, whatsapp_number, announcement_text, announcement_enabled, inside_dhaka_fee, outside_dhaka_fee, free_shipping_threshold, hero_title, hero_subtitle, hero_cta_text, hero_cta_link, hero_image_url, payment_gateways_json, notifications_json, maintenance_mode, updated_at) VALUES (1, 'BDTechZen', '', 'Full-grain calfskin loafers, Blake-stitched Oxfords, and everyday court sneakers—made for walking Bangladesh.', 'support@bdtechzen.com', '+880 1623-604635', '+8801623604635', 'Complimentary delivery across Bangladesh on orders above ৳3,000 · Cash on Delivery & 7-day doorstep size exchange', 1, 70, 130, 3000, 'Shoes built to walk, cut from full-grain calfskin.', 'We pair Italian-tanned calfskin and water-resistant suede with cushioned anatomical footbeds—so your morning commute in Motijheel feels as effortless as dinner in Gulshan.', 'Shop the Collection', '/shop', '/src/assets/images/hero_bangladeshi_models_1792779716481.jpg', '{\"bkashEnabled\":true,\"bkashSandbox\":true,\"nagadEnabled\":true,\"nagadSandbox\":true,\"rocketEnabled\":true,\"rocketSandbox\":true,\"sslcommerzEnabled\":true,\"sslcommerzSandbox\":true,\"codEnabledBD\":true}', '{\"emailEnabled\":true,\"smsEnabled\":true,\"senderName\":\"BDTechZen Studio\",\"adminAlertEmail\":\"khalil5172@gmail.com\",\"adminAlertPhone\":\"+8801623604635\",\"notifyAdminOnNewOrder\":true,\"notifyAdminOnNewUser\":true,\"ntfyTopic\":\"bdtechzen-khalil-8801623604635\"}', 0, '2026-10-28T17:00:23.194Z');

-- Categories
REPLACE INTO categories (id, name, slug, description, image, display_order, is_featured) VALUES ('cat_men', 'Men\'s Footwear', 'mens-shoes', 'Hand-burnished full-grain leather Oxfords, penny loafers, and tailored footwear.', '/src/assets/images/product_oxford_dress_shoe_1792775360783.jpg', 1, 1);
REPLACE INTO categories (id, name, slug, description, image, display_order, is_featured) VALUES ('cat_women', 'Women\'s Footwear', 'womens-shoes', 'Sculpted Napa leather mules, horsebit loafers, and featherweight daily sneakers.', '/src/assets/images/product_womens_leather_mule_1792775364104.jpg', 2, 1);
REPLACE INTO categories (id, name, slug, description, image, display_order, is_featured) VALUES ('cat_sneakers', 'Lifestyle Sneakers', 'sneakers', 'Italian court low-tops, monochrome high-tops, and architectural street silhouettes.', '/src/assets/images/product_high_top_sneaker_1792775362853.jpg', 3, 1);
REPLACE INTO categories (id, name, slug, description, image, display_order, is_featured) VALUES ('cat_sports', 'Sports & Running', 'sports-running', 'Carbon-plated marathon racers and supercritical nitrogen-foam road trainers.', '/src/assets/images/product_trail_marathon_shoe_1792775363886.jpg', 4, 1);
REPLACE INTO categories (id, name, slug, description, image, display_order, is_featured) VALUES ('cat_formal', 'Formal Leather', 'formal-shoes', 'Cap-toe Oxfords, hand-stitched penny loafers, and executive ceremony dress shoes.', '/src/assets/images/product_penny_loafer_tan_1792775363081.jpg', 5, 1);
REPLACE INTO categories (id, name, slug, description, image, display_order, is_featured) VALUES ('cat_casual', 'Casual & Boots', 'casual-shoes', 'Weather-sealed suede Chelsea boots and relaxed weekend moccasins.', '/src/assets/images/product_chelsea_boots_1792739008903.jpg', 6, 1);
REPLACE INTO categories (id, name, slug, description, image, display_order, is_featured) VALUES ('cat_sandals', 'Sandals & Slides', 'sandals-slippers', 'Anatomical cork-footbed nubuck slides engineered for warm humid climates.', '/src/assets/images/product_leather_sandal_1792769000370.jpg', 7, 0);
REPLACE INTO categories (id, name, slug, description, image, display_order, is_featured) VALUES ('cat_kids', 'Kids\' Footwear', 'kids-shoes', 'Flexible non-marking athletic runners and reinforced everyday footwear.', '/src/assets/images/product_urban_runner_1792739007692.jpg', 8, 0);

-- Brands
REPLACE INTO brands (id, name, slug) VALUES ('b_techzen', 'BDTechZen Originals', 'bdtechzen-originals');
REPLACE INTO brands (id, name, slug) VALUES ('b_artisano', 'Artisano Leathercraft', 'artisano');
REPLACE INTO brands (id, name, slug) VALUES ('b_velox', 'Velox Performance', 'velox');
REPLACE INTO brands (id, name, slug) VALUES ('b_urbanstride', 'Urban Stride', 'urban-stride');
REPLACE INTO brands (id, name, slug) VALUES ('b_aerofit', 'AeroFit Athletics', 'aerofit');

-- Products & Variations
REPLACE INTO products (id, name, slug, sku, product_type, ribbon_text, brand, category, gender, description, images_json, regular_price_bdt, sale_price_bdt, is_featured, is_best_seller, is_published, specifications_json, rating, review_count, created_at, updated_at) VALUES ('prod_apex_violet', 'BDTechZen Apex Carbon-Violet Runner', 'bdtechzen-apex-carbon-violet-runner', 'BDTZ-APX-001', 'variable', 'Flagship Drop', 'BDTechZen Originals', 'sports-running', 'unisex', 'Engineered with a full-length propulsion plate and nitrogen-infused supercritical midsole. Breathable Matte-Onyx monofilament mesh with signature BDTechZen Violet heel stabilizer delivers zero-fatigue cushioning on city pavement.', '[\"/src/assets/images/hero_bdtechzen_flagship_1792768997575.jpg\",\"/src/assets/images/product_trail_marathon_shoe_1792775363886.jpg\",\"/src/assets/images/product_urban_runner_1792739007692.jpg\"]', 5600, 4790, 1, 1, 1, '{\"Upper Material\":\"Breathable engineered monofilament jacquard mesh\",\"Midsole Tech\":\"Supercritical nitrogen foam + propulsion plate\",\"Outsole\":\"High-abrasion wet-grip carbon rubber\",\"Weight\":\"218g (EU Size 42)\",\"Warranty\":\"7-Day Easy Doorstep Size Exchange\"}', 4.9, 46, '2026-10-23T08:00:00Z', '2026-10-23T18:14:03.384Z');
REPLACE INTO product_variants (id, product_id, size, color, color_hex, stock, sku_variant, price_override_bdt) VALUES ('v_apx_1', 'prod_apex_violet', '40', 'Obsidian / Violet', '#6d28d9', 13, 'BDTZ-APX-001-40-VIO', NULL);
REPLACE INTO product_variants (id, product_id, size, color, color_hex, stock, sku_variant, price_override_bdt) VALUES ('v_apx_2', 'prod_apex_violet', '41', 'Obsidian / Violet', '#6d28d9', 18, 'BDTZ-APX-001-41-VIO', NULL);
REPLACE INTO product_variants (id, product_id, size, color, color_hex, stock, sku_variant, price_override_bdt) VALUES ('v_apx_3', 'prod_apex_violet', '42', 'Obsidian / Violet', '#6d28d9', 22, 'BDTZ-APX-001-42-VIO', NULL);
REPLACE INTO product_variants (id, product_id, size, color, color_hex, stock, sku_variant, price_override_bdt) VALUES ('v_apx_4', 'prod_apex_violet', '43', 'Obsidian / Violet', '#6d28d9', 15, 'BDTZ-APX-001-43-VIO', NULL);
REPLACE INTO product_variants (id, product_id, size, color, color_hex, stock, sku_variant, price_override_bdt) VALUES ('v_apx_5', 'prod_apex_violet', '44', 'Obsidian / Violet', '#6d28d9', 9, 'BDTZ-APX-001-44-VIO', NULL);
REPLACE INTO product_variants (id, product_id, size, color, color_hex, stock, sku_variant, price_override_bdt) VALUES ('v_apx_6', 'prod_apex_violet', '41', 'Stealth Black', '#18181b', 11, 'BDTZ-APX-001-41-BLK', NULL);
REPLACE INTO product_variants (id, product_id, size, color, color_hex, stock, sku_variant, price_override_bdt) VALUES ('v_apx_7', 'prod_apex_violet', '42', 'Stealth Black', '#18181b', 16, 'BDTZ-APX-001-42-BLK', NULL);
REPLACE INTO product_variants (id, product_id, size, color, color_hex, stock, sku_variant, price_override_bdt) VALUES ('v_apx_8', 'prod_apex_violet', '43', 'Stealth Black', '#18181b', 10, 'BDTZ-APX-001-43-BLK', NULL);
REPLACE INTO product_variants (id, product_id, size, color, color_hex, stock, sku_variant, price_override_bdt) VALUES ('v_apx_9', 'prod_apex_violet', '42', 'Carbon Pro Edition', '#4c1d95', 7, 'BDTZ-APX-001-42-PRO', 5190);
REPLACE INTO product_variants (id, product_id, size, color, color_hex, stock, sku_variant, price_override_bdt) VALUES ('v_apx_10', 'prod_apex_violet', '43', 'Carbon Pro Edition', '#4c1d95', 6, 'BDTZ-APX-001-43-PRO', 5190);
REPLACE INTO products (id, name, slug, sku, product_type, ribbon_text, brand, category, gender, description, images_json, regular_price_bdt, sale_price_bdt, is_featured, is_best_seller, is_published, specifications_json, rating, review_count, created_at, updated_at) VALUES ('prod_mayfair_oxford', 'Artisano Mayfair Cap-Toe Calfskin Oxford', 'artisano-mayfair-cap-toe-calfskin-oxford', 'ART-OXF-010', 'variable', 'Atelier Reserve', 'Artisano Leathercraft', 'formal-shoes', 'men', 'Closed-channel Blake-stitched formal cap-toe Oxford sculpted from full-grain European box calfskin. Hand-mirror-polished toe box and vegetable-tanned leather insole mold effortlessly to executive attire.', '[\"/src/assets/images/product_oxford_dress_shoe_1792775360783.jpg\",\"/src/assets/images/category_men_shoes_1792739006791.jpg\"]', 7800, 6690, 1, 1, 1, '{\"Upper Leather\":\"100% Full-grain European box calfskin\",\"Construction\":\"Blake-stitched leather outsole with anti-slip heel insert\",\"Lining\":\"Full breathable natural glove calfskin\",\"Insole\":\"High-density leather-topped orthotic arch bed\"}', 5, 34, '2026-10-23T07:55:00Z', '2026-10-23T07:55:00Z');
REPLACE INTO product_variants (id, product_id, size, color, color_hex, stock, sku_variant, price_override_bdt) VALUES ('v_oxf_1', 'prod_mayfair_oxford', '40', 'Obsidian Calfskin', '#09090b', 10, 'ART-OXF-010-40-BLK', NULL);
REPLACE INTO product_variants (id, product_id, size, color, color_hex, stock, sku_variant, price_override_bdt) VALUES ('v_oxf_2', 'prod_mayfair_oxford', '41', 'Obsidian Calfskin', '#09090b', 14, 'ART-OXF-010-41-BLK', NULL);
REPLACE INTO product_variants (id, product_id, size, color, color_hex, stock, sku_variant, price_override_bdt) VALUES ('v_oxf_3', 'prod_mayfair_oxford', '42', 'Obsidian Calfskin', '#09090b', 18, 'ART-OXF-010-42-BLK', NULL);
REPLACE INTO product_variants (id, product_id, size, color, color_hex, stock, sku_variant, price_override_bdt) VALUES ('v_oxf_4', 'prod_mayfair_oxford', '43', 'Obsidian Calfskin', '#09090b', 12, 'ART-OXF-010-43-BLK', NULL);
REPLACE INTO product_variants (id, product_id, size, color, color_hex, stock, sku_variant, price_override_bdt) VALUES ('v_oxf_5', 'prod_mayfair_oxford', '44', 'Obsidian Calfskin', '#09090b', 8, 'ART-OXF-010-44-BLK', NULL);
REPLACE INTO product_variants (id, product_id, size, color, color_hex, stock, sku_variant, price_override_bdt) VALUES ('v_oxf_6', 'prod_mayfair_oxford', '41', 'Dark Espresso Patina', '#3b1d0e', 9, 'ART-OXF-010-41-ESP', 6950);
REPLACE INTO product_variants (id, product_id, size, color, color_hex, stock, sku_variant, price_override_bdt) VALUES ('v_oxf_7', 'prod_mayfair_oxford', '42', 'Dark Espresso Patina', '#3b1d0e', 11, 'ART-OXF-010-42-ESP', 6950);
REPLACE INTO product_variants (id, product_id, size, color, color_hex, stock, sku_variant, price_override_bdt) VALUES ('v_oxf_8', 'prod_mayfair_oxford', '43', 'Dark Espresso Patina', '#3b1d0e', 7, 'ART-OXF-010-43-ESP', 6950);
REPLACE INTO products (id, name, slug, sku, product_type, ribbon_text, brand, category, gender, description, images_json, regular_price_bdt, sale_price_bdt, is_featured, is_best_seller, is_published, specifications_json, rating, review_count, created_at, updated_at) VALUES ('prod_skyline_hightop', 'BDTechZen Skyline Violet-Slate High-Top', 'bdtechzen-skyline-violet-slate-high-top', 'BDTZ-SKY-011', 'variable', 'New Arrival', 'BDTechZen Originals', 'sneakers', 'unisex', 'Architectural high-top street sneaker combining tumbled chalk-white grain leather, charcoal suede overlays, and subtle royal-violet trim over a 360-stitched cupsole.', '[\"/src/assets/images/product_high_top_sneaker_1792775362853.jpg\",\"/src/assets/images/product_court_sneaker_1792769000669.jpg\"]', 5400, 4650, 1, 0, 1, '{\"Upper\":\"Tumbled calfskin leather + water-resistant charcoal nubuck\",\"Collar\":\"Plush memory-foam padded ankle support\",\"Outsole\":\"Sidewall-stitched dual-density court rubber\"}', 4.9, 27, '2026-10-23T07:50:00Z', '2026-10-23T07:50:00Z');
REPLACE INTO product_variants (id, product_id, size, color, color_hex, stock, sku_variant, price_override_bdt) VALUES ('v_sky_1', 'prod_skyline_hightop', '39', 'Chalk / Slate / Violet', '#6d28d9', 9, 'BDTZ-SKY-011-39-SLV', NULL);
REPLACE INTO product_variants (id, product_id, size, color, color_hex, stock, sku_variant, price_override_bdt) VALUES ('v_sky_2', 'prod_skyline_hightop', '40', 'Chalk / Slate / Violet', '#6d28d9', 15, 'BDTZ-SKY-011-40-SLV', NULL);
REPLACE INTO product_variants (id, product_id, size, color, color_hex, stock, sku_variant, price_override_bdt) VALUES ('v_sky_3', 'prod_skyline_hightop', '41', 'Chalk / Slate / Violet', '#6d28d9', 19, 'BDTZ-SKY-011-41-SLV', NULL);
REPLACE INTO product_variants (id, product_id, size, color, color_hex, stock, sku_variant, price_override_bdt) VALUES ('v_sky_4', 'prod_skyline_hightop', '42', 'Chalk / Slate / Violet', '#6d28d9', 16, 'BDTZ-SKY-011-42-SLV', NULL);
REPLACE INTO product_variants (id, product_id, size, color, color_hex, stock, sku_variant, price_override_bdt) VALUES ('v_sky_5', 'prod_skyline_hightop', '43', 'Chalk / Slate / Violet', '#6d28d9', 11, 'BDTZ-SKY-011-43-SLV', NULL);
REPLACE INTO product_variants (id, product_id, size, color, color_hex, stock, sku_variant, price_override_bdt) VALUES ('v_sky_6', 'prod_skyline_hightop', '41', 'Triple Onyx Suede', '#18181b', 10, 'BDTZ-SKY-011-41-ONX', NULL);
REPLACE INTO product_variants (id, product_id, size, color, color_hex, stock, sku_variant, price_override_bdt) VALUES ('v_sky_7', 'prod_skyline_hightop', '42', 'Triple Onyx Suede', '#18181b', 12, 'BDTZ-SKY-011-42-ONX', NULL);
REPLACE INTO products (id, name, slug, sku, product_type, ribbon_text, brand, category, gender, description, images_json, regular_price_bdt, sale_price_bdt, is_featured, is_best_seller, is_published, specifications_json, rating, review_count, created_at, updated_at) VALUES ('prod_florence_penny_loafer', 'Artisano Florence Cognac Penny Loafer', 'artisano-florence-cognac-penny-loafer', 'ART-FLR-012', 'variable', 'Hand-Burnished', 'Artisano Leathercraft', 'formal-shoes', 'men', 'Timeless Italian apron-stitched penny loafer crafted from antique-burnished cognac calfskin. Unstructured forefoot flexes naturally from smart linen ensembles to tailored suits.', '[\"/src/assets/images/product_penny_loafer_tan_1792775363081.jpg\",\"/src/assets/images/product_leather_loafer_1792768998636.jpg\"]', 6400, 5490, 1, 1, 1, '{\"Upper\":\"Hand-burnished Italian vegetable-tanned calfskin\",\"Apron Stitch\":\"Waxed linen hand-sewn moccasin seam\",\"Sole\":\"Stacked leather heel with recessed rubber grip pad\"}', 4.9, 31, '2026-10-23T07:45:00Z', '2026-10-23T07:45:00Z');
REPLACE INTO product_variants (id, product_id, size, color, color_hex, stock, sku_variant, price_override_bdt) VALUES ('v_flr_1', 'prod_florence_penny_loafer', '40', 'Antique Cognac', '#92400e', 11, 'ART-FLR-012-40-COG', NULL);
REPLACE INTO product_variants (id, product_id, size, color, color_hex, stock, sku_variant, price_override_bdt) VALUES ('v_flr_2', 'prod_florence_penny_loafer', '41', 'Antique Cognac', '#92400e', 15, 'ART-FLR-012-41-COG', NULL);
REPLACE INTO product_variants (id, product_id, size, color, color_hex, stock, sku_variant, price_override_bdt) VALUES ('v_flr_3', 'prod_florence_penny_loafer', '42', 'Antique Cognac', '#92400e', 17, 'ART-FLR-012-42-COG', NULL);
REPLACE INTO product_variants (id, product_id, size, color, color_hex, stock, sku_variant, price_override_bdt) VALUES ('v_flr_4', 'prod_florence_penny_loafer', '43', 'Antique Cognac', '#92400e', 10, 'ART-FLR-012-43-COG', NULL);
REPLACE INTO product_variants (id, product_id, size, color, color_hex, stock, sku_variant, price_override_bdt) VALUES ('v_flr_5', 'prod_florence_penny_loafer', '41', 'Burgundy Cordovan Finish', '#4c0519', 8, 'ART-FLR-012-41-BRG', 5790);
REPLACE INTO product_variants (id, product_id, size, color, color_hex, stock, sku_variant, price_override_bdt) VALUES ('v_flr_6', 'prod_florence_penny_loafer', '42', 'Burgundy Cordovan Finish', '#4c0519', 9, 'ART-FLR-012-42-BRG', 5790);
REPLACE INTO products (id, name, slug, sku, product_type, ribbon_text, brand, category, gender, description, images_json, regular_price_bdt, sale_price_bdt, is_featured, is_best_seller, is_published, specifications_json, rating, review_count, created_at, updated_at) VALUES ('prod_celeste_horsebit_mule', 'BDTechZen Celeste Napa Horsebit Mule', 'bdtechzen-celeste-napa-horsebit-mule', 'BDTZ-CLS-013', 'variable', 'Women’s Atelier', 'BDTechZen Originals', 'womens-shoes', 'women', 'Butter-soft ivory Napa calfskin backless loafer mule adorned with brushed 18k-tone equestrian hardware and a 15mm stacked wood heel for effortless studio-to-evening elegance.', '[\"/src/assets/images/product_womens_leather_mule_1792775364104.jpg\",\"/src/assets/images/category_women_sneakers_1792739007245.jpg\"]', 4800, 4150, 1, 1, 1, '{\"Upper\":\"Drum-dyed supple Napa lambskin & calfskin\",\"Hardware\":\"Anti-tarnish brushed brass horsebit\",\"Footbed\":\"Quilted memory-foam leather cushion\"}', 4.9, 24, '2026-10-23T07:40:00Z', '2026-10-23T07:40:00Z');
REPLACE INTO product_variants (id, product_id, size, color, color_hex, stock, sku_variant, price_override_bdt) VALUES ('v_cls_1', 'prod_celeste_horsebit_mule', '36', 'Ivory Cream Napa', '#f5f5f4', 12, 'BDTZ-CLS-013-36-IVR', NULL);
REPLACE INTO product_variants (id, product_id, size, color, color_hex, stock, sku_variant, price_override_bdt) VALUES ('v_cls_2', 'prod_celeste_horsebit_mule', '37', 'Ivory Cream Napa', '#f5f5f4', 16, 'BDTZ-CLS-013-37-IVR', NULL);
REPLACE INTO product_variants (id, product_id, size, color, color_hex, stock, sku_variant, price_override_bdt) VALUES ('v_cls_3', 'prod_celeste_horsebit_mule', '38', 'Ivory Cream Napa', '#f5f5f4', 18, 'BDTZ-CLS-013-38-IVR', NULL);
REPLACE INTO product_variants (id, product_id, size, color, color_hex, stock, sku_variant, price_override_bdt) VALUES ('v_cls_4', 'prod_celeste_horsebit_mule', '39', 'Ivory Cream Napa', '#f5f5f4', 14, 'BDTZ-CLS-013-39-IVR', NULL);
REPLACE INTO product_variants (id, product_id, size, color, color_hex, stock, sku_variant, price_override_bdt) VALUES ('v_cls_5', 'prod_celeste_horsebit_mule', '40', 'Ivory Cream Napa', '#f5f5f4', 9, 'BDTZ-CLS-013-40-IVR', NULL);
REPLACE INTO product_variants (id, product_id, size, color, color_hex, stock, sku_variant, price_override_bdt) VALUES ('v_cls_6', 'prod_celeste_horsebit_mule', '37', 'Noir Black Napa', '#18181b', 11, 'BDTZ-CLS-013-37-BLK', NULL);
REPLACE INTO product_variants (id, product_id, size, color, color_hex, stock, sku_variant, price_override_bdt) VALUES ('v_cls_7', 'prod_celeste_horsebit_mule', '38', 'Noir Black Napa', '#18181b', 13, 'BDTZ-CLS-013-38-BLK', NULL);
REPLACE INTO products (id, name, slug, sku, product_type, ribbon_text, brand, category, gender, description, images_json, regular_price_bdt, sale_price_bdt, is_featured, is_best_seller, is_published, specifications_json, rating, review_count, created_at, updated_at) VALUES ('prod_velocity_elite_marathon', 'Velox Marathon Elite 03 Nitrogen Racer', 'velox-marathon-elite-03-nitrogen-racer', 'VLX-MRT-014', 'variable', 'Pro Performance', 'Velox Performance', 'sports-running', 'unisex', 'Built for 10K and half-marathon PRs with pearl-grey open-cell engineered mesh, sculpted dual-chamber nitrogen foam, and a molded royal-violet external heel counter.', '[\"/src/assets/images/product_trail_marathon_shoe_1792775363886.jpg\",\"/src/assets/images/hero_bdtechzen_flagship_1792768997575.jpg\"]', 5900, 4990, 1, 0, 1, '{\"Midsole\":\"38mm heel / 30mm forefoot Nitrogen-Foam stack\",\"Heel Lock\":\"3D-molded external TPU Violet heel cradle\",\"Weight\":\"209g ultra-lightweight race geometry\"}', 4.9, 22, '2026-10-23T07:35:00Z', '2026-10-23T07:35:00Z');
REPLACE INTO product_variants (id, product_id, size, color, color_hex, stock, sku_variant, price_override_bdt) VALUES ('v_mrt_1', 'prod_velocity_elite_marathon', '39', 'Pearl Grey / Violet', '#7c3aed', 10, 'VLX-MRT-014-39-GRV', NULL);
REPLACE INTO product_variants (id, product_id, size, color, color_hex, stock, sku_variant, price_override_bdt) VALUES ('v_mrt_2', 'prod_velocity_elite_marathon', '40', 'Pearl Grey / Violet', '#7c3aed', 14, 'VLX-MRT-014-40-GRV', NULL);
REPLACE INTO product_variants (id, product_id, size, color, color_hex, stock, sku_variant, price_override_bdt) VALUES ('v_mrt_3', 'prod_velocity_elite_marathon', '41', 'Pearl Grey / Violet', '#7c3aed', 18, 'VLX-MRT-014-41-GRV', NULL);
REPLACE INTO product_variants (id, product_id, size, color, color_hex, stock, sku_variant, price_override_bdt) VALUES ('v_mrt_4', 'prod_velocity_elite_marathon', '42', 'Pearl Grey / Violet', '#7c3aed', 20, 'VLX-MRT-014-42-GRV', NULL);
REPLACE INTO product_variants (id, product_id, size, color, color_hex, stock, sku_variant, price_override_bdt) VALUES ('v_mrt_5', 'prod_velocity_elite_marathon', '43', 'Pearl Grey / Violet', '#7c3aed', 12, 'VLX-MRT-014-43-GRV', NULL);
REPLACE INTO product_variants (id, product_id, size, color, color_hex, stock, sku_variant, price_override_bdt) VALUES ('v_mrt_6', 'prod_velocity_elite_marathon', '44', 'Pearl Grey / Violet', '#7c3aed', 8, 'VLX-MRT-014-44-GRV', NULL);
REPLACE INTO products (id, name, slug, sku, product_type, ribbon_text, brand, category, gender, description, images_json, regular_price_bdt, sale_price_bdt, is_featured, is_best_seller, is_published, specifications_json, rating, review_count, created_at, updated_at) VALUES ('prod_court_violet', 'BDTechZen Court Classic Leather Sneaker', 'bdtechzen-court-classic-leather-sneaker', 'BDTZ-CRT-002', 'variable', 'Best Seller', 'BDTechZen Originals', 'sneakers', 'unisex', 'Minimalist full-grain tumbled white calfskin low-top accented with a deep royal-violet Napa leather heel tab. Stitched Margom-style rubber cupsole built for crisp smart-casual styling.', '[\"/src/assets/images/product_court_sneaker_1792769000669.jpg\",\"/src/assets/images/product_high_top_sneaker_1792775362853.jpg\"]', 4500, 3890, 1, 1, 1, '{\"Upper Material\":\"100% Full-grain tumbled calfskin leather\",\"Heel Tab\":\"Soft Napa leather in BDTechZen Violet\",\"Insole\":\"Dual-density OrthoLite memory foam\",\"Construction\":\"360-degree sidewall-stitched cupsole\"}', 4.9, 39, '2026-10-22T12:00:00Z', '2026-10-22T12:00:00Z');
REPLACE INTO product_variants (id, product_id, size, color, color_hex, stock, sku_variant, price_override_bdt) VALUES ('v_crt_1', 'prod_court_violet', '39', 'Chalk White / Violet', '#7c3aed', 10, 'BDTZ-CRT-002-39-WHT', NULL);
REPLACE INTO product_variants (id, product_id, size, color, color_hex, stock, sku_variant, price_override_bdt) VALUES ('v_crt_2', 'prod_court_violet', '40', 'Chalk White / Violet', '#7c3aed', 16, 'BDTZ-CRT-002-40-WHT', NULL);
REPLACE INTO product_variants (id, product_id, size, color, color_hex, stock, sku_variant, price_override_bdt) VALUES ('v_crt_3', 'prod_court_violet', '41', 'Chalk White / Violet', '#7c3aed', 20, 'BDTZ-CRT-002-41-WHT', NULL);
REPLACE INTO product_variants (id, product_id, size, color, color_hex, stock, sku_variant, price_override_bdt) VALUES ('v_crt_4', 'prod_court_violet', '42', 'Chalk White / Violet', '#7c3aed', 18, 'BDTZ-CRT-002-42-WHT', NULL);
REPLACE INTO product_variants (id, product_id, size, color, color_hex, stock, sku_variant, price_override_bdt) VALUES ('v_crt_5', 'prod_court_violet', '43', 'Chalk White / Violet', '#7c3aed', 11, 'BDTZ-CRT-002-43-WHT', NULL);
REPLACE INTO product_variants (id, product_id, size, color, color_hex, stock, sku_variant, price_override_bdt) VALUES ('v_crt_6', 'prod_court_violet', '41', 'Chalk White / Obsidian', '#18181b', 14, 'BDTZ-CRT-002-41-OBS', NULL);
REPLACE INTO product_variants (id, product_id, size, color, color_hex, stock, sku_variant, price_override_bdt) VALUES ('v_crt_7', 'prod_court_violet', '42', 'Chalk White / Obsidian', '#18181b', 15, 'BDTZ-CRT-002-42-OBS', NULL);
REPLACE INTO products (id, name, slug, sku, product_type, ribbon_text, brand, category, gender, description, images_json, regular_price_bdt, sale_price_bdt, is_featured, is_best_seller, is_published, specifications_json, rating, review_count, created_at, updated_at) VALUES ('prod_verona_wingtip', 'Artisano Verona Hand-Burnished Derby', 'artisano-verona-hand-burnished-derby', 'ART-VR-003', 'variable', 'Save 13%', 'Artisano Leathercraft', 'mens-shoes', 'men', 'Crafted from vegetable-tanned full-grain leather with hand-burnished cognac patina and classic brogue detailing. Supple calfskin lining molds naturally to your foot for boardroom and formal occasions.', '[\"/src/assets/images/category_men_shoes_1792739006791.jpg\",\"/src/assets/images/product_oxford_dress_shoe_1792775360783.jpg\"]', 7200, 6250, 1, 1, 1, '{\"Upper\":\"100% Vegetable-tanned full-grain calf leather\",\"Lining\":\"Breathable natural calfskin leather\",\"Outsole\":\"Blake-stitched leather sole with rubber heel insert\",\"Finish\":\"Hand-burnished Italian wax polish\"}', 5, 28, '2026-10-22T11:00:00Z', '2026-10-22T11:00:00Z');
REPLACE INTO product_variants (id, product_id, size, color, color_hex, stock, sku_variant, price_override_bdt) VALUES ('v_vw_1', 'prod_verona_wingtip', '40', 'Cognac Brown', '#9a3412', 8, 'ART-VR-003-40-COG', NULL);
REPLACE INTO product_variants (id, product_id, size, color, color_hex, stock, sku_variant, price_override_bdt) VALUES ('v_vw_2', 'prod_verona_wingtip', '41', 'Cognac Brown', '#9a3412', 12, 'ART-VR-003-41-COG', NULL);
REPLACE INTO product_variants (id, product_id, size, color, color_hex, stock, sku_variant, price_override_bdt) VALUES ('v_vw_3', 'prod_verona_wingtip', '42', 'Cognac Brown', '#9a3412', 14, 'ART-VR-003-42-COG', NULL);
REPLACE INTO product_variants (id, product_id, size, color, color_hex, stock, sku_variant, price_override_bdt) VALUES ('v_vw_4', 'prod_verona_wingtip', '43', 'Cognac Brown', '#9a3412', 7, 'ART-VR-003-43-COG', NULL);
REPLACE INTO product_variants (id, product_id, size, color, color_hex, stock, sku_variant, price_override_bdt) VALUES ('v_vw_5', 'prod_verona_wingtip', '41', 'Espresso Black', '#1c1917', 10, 'ART-VR-003-41-BLK', NULL);
REPLACE INTO product_variants (id, product_id, size, color, color_hex, stock, sku_variant, price_override_bdt) VALUES ('v_vw_6', 'prod_verona_wingtip', '42', 'Espresso Black', '#1c1917', 12, 'ART-VR-003-42-BLK', NULL);
REPLACE INTO products (id, name, slug, sku, product_type, ribbon_text, brand, category, gender, description, images_json, regular_price_bdt, sale_price_bdt, is_featured, is_best_seller, is_published, specifications_json, rating, review_count, created_at, updated_at) VALUES ('prod_chelsea_tan', 'BDTechZen Heritage Suede Chelsea Boot', 'bdtechzen-heritage-suede-chelsea-boot', 'BDTZ-CH-004', 'variable', 'Limited Edition', 'BDTechZen Originals', 'casual-shoes', 'men', 'Water-repellent Scotchgard-treated suede Chelsea boot set on a natural plantation crepe outsole. Elasticated twin gussets and woven pull-tabs ensure effortless slip-on comfort.', '[\"/src/assets/images/product_chelsea_boots_1792739008903.jpg\",\"/src/assets/images/product_penny_loafer_tan_1792775363081.jpg\"]', 6600, 5850, 1, 0, 1, '{\"Upper\":\"Hydrophobic Italian split suede leather\",\"Outsole\":\"Natural plantation crepe rubber\",\"Lining\":\"Full glove-soft cowhide lining\"}', 4.9, 29, '2026-10-21T15:00:00Z', '2026-10-21T15:00:00Z');
REPLACE INTO product_variants (id, product_id, size, color, color_hex, stock, sku_variant, price_override_bdt) VALUES ('v_ch_1', 'prod_chelsea_tan', '40', 'Camel Sand Suede', '#d97706', 8, 'BDTZ-CH-004-40-SND', NULL);
REPLACE INTO product_variants (id, product_id, size, color, color_hex, stock, sku_variant, price_override_bdt) VALUES ('v_ch_2', 'prod_chelsea_tan', '41', 'Camel Sand Suede', '#d97706', 12, 'BDTZ-CH-004-41-SND', NULL);
REPLACE INTO product_variants (id, product_id, size, color, color_hex, stock, sku_variant, price_override_bdt) VALUES ('v_ch_3', 'prod_chelsea_tan', '42', 'Camel Sand Suede', '#d97706', 14, 'BDTZ-CH-004-42-SND', NULL);
REPLACE INTO product_variants (id, product_id, size, color, color_hex, stock, sku_variant, price_override_bdt) VALUES ('v_ch_4', 'prod_chelsea_tan', '43', 'Camel Sand Suede', '#d97706', 9, 'BDTZ-CH-004-43-SND', NULL);
REPLACE INTO product_variants (id, product_id, size, color, color_hex, stock, sku_variant, price_override_bdt) VALUES ('v_ch_5', 'prod_chelsea_tan', '42', 'Dark Chocolate Suede', '#451a03', 10, 'BDTZ-CH-004-42-CHC', NULL);
REPLACE INTO product_variants (id, product_id, size, color, color_hex, stock, sku_variant, price_override_bdt) VALUES ('v_ch_6', 'prod_chelsea_tan', '43', 'Dark Chocolate Suede', '#451a03', 8, 'BDTZ-CH-004-43-CHC', NULL);
REPLACE INTO products (id, name, slug, sku, product_type, ribbon_text, brand, category, gender, description, images_json, regular_price_bdt, sale_price_bdt, is_featured, is_best_seller, is_published, specifications_json, rating, review_count, created_at, updated_at) VALUES ('prod_aura_trainer', 'Velox Aura Cloudfoam Women Sneaker', 'velox-aura-cloudfoam-women-sneaker', 'VLX-AU-005', 'variable', 'Best Seller', 'Velox Performance', 'womens-shoes', 'women', 'Sculpted specifically around an anatomical women last with featherweight Cloudfoam cushioning and breathable circular-knit upper for effortless daily movement.', '[\"/src/assets/images/category_women_sneakers_1792739007245.jpg\",\"/src/assets/images/product_womens_leather_mule_1792775364104.jpg\"]', 4400, 3790, 0, 1, 1, '{\"Upper\":\"Seamless 3D circular knit + TPU heel clip\",\"Insole\":\"Anti-microbial memory foam footbed\",\"Outsole\":\"High-flex shock-absorbing EVA\"}', 4.8, 42, '2026-10-21T12:00:00Z', '2026-10-21T12:00:00Z');
REPLACE INTO product_variants (id, product_id, size, color, color_hex, stock, sku_variant, price_override_bdt) VALUES ('v_at_1', 'prod_aura_trainer', '36', 'Pearl White / Lavender', '#c4b5fd', 14, 'VLX-AU-005-36-LAV', NULL);
REPLACE INTO product_variants (id, product_id, size, color, color_hex, stock, sku_variant, price_override_bdt) VALUES ('v_at_2', 'prod_aura_trainer', '37', 'Pearl White / Lavender', '#c4b5fd', 16, 'VLX-AU-005-37-LAV', NULL);
REPLACE INTO product_variants (id, product_id, size, color, color_hex, stock, sku_variant, price_override_bdt) VALUES ('v_at_3', 'prod_aura_trainer', '38', 'Pearl White / Lavender', '#c4b5fd', 20, 'VLX-AU-005-38-LAV', NULL);
REPLACE INTO product_variants (id, product_id, size, color, color_hex, stock, sku_variant, price_override_bdt) VALUES ('v_at_4', 'prod_aura_trainer', '39', 'Pearl White / Lavender', '#c4b5fd', 15, 'VLX-AU-005-39-LAV', NULL);
REPLACE INTO product_variants (id, product_id, size, color, color_hex, stock, sku_variant, price_override_bdt) VALUES ('v_at_5', 'prod_aura_trainer', '40', 'Pearl White / Lavender', '#c4b5fd', 10, 'VLX-AU-005-40-LAV', NULL);
REPLACE INTO product_variants (id, product_id, size, color, color_hex, stock, sku_variant, price_override_bdt) VALUES ('v_at_6', 'prod_aura_trainer', '37', 'Blush Quartz', '#f9a8d4', 12, 'VLX-AU-005-37-BLS', NULL);
REPLACE INTO product_variants (id, product_id, size, color, color_hex, stock, sku_variant, price_override_bdt) VALUES ('v_at_7', 'prod_aura_trainer', '38', 'Blush Quartz', '#f9a8d4', 14, 'VLX-AU-005-38-BLS', NULL);
REPLACE INTO products (id, name, slug, sku, product_type, ribbon_text, brand, category, gender, description, images_json, regular_price_bdt, sale_price_bdt, is_featured, is_best_seller, is_published, specifications_json, rating, review_count, created_at, updated_at) VALUES ('prod_monaco_loafer', 'Artisano Monaco Midnight Suede Loafer', 'artisano-monaco-midnight-suede-loafer', 'ART-MN-006', 'variable', 'Handcrafted', 'Artisano Leathercraft', 'formal-shoes', 'men', 'Unlined butter-soft midnight-navy suede Venetian loafer on a stacked leather-and-rubber dress heel. Tailored for smart trousers, linen suits, and evening receptions.', '[\"/src/assets/images/product_leather_loafer_1792768998636.jpg\",\"/src/assets/images/product_penny_loafer_tan_1792775363081.jpg\"]', 5600, 4890, 0, 1, 1, '{\"Upper\":\"Velvet-nap Italian suede leather\",\"Sole\":\"Blake-stitched leather sole with anti-slip heel pad\",\"Profile\":\"Classic unembellished Venetian vamp\"}', 4.9, 23, '2026-10-20T15:00:00Z', '2026-10-20T15:00:00Z');
REPLACE INTO product_variants (id, product_id, size, color, color_hex, stock, sku_variant, price_override_bdt) VALUES ('v_mn_1', 'prod_monaco_loafer', '40', 'Midnight Navy Suede', '#1e3a8a', 9, 'ART-MN-006-40-NVY', NULL);
REPLACE INTO product_variants (id, product_id, size, color, color_hex, stock, sku_variant, price_override_bdt) VALUES ('v_mn_2', 'prod_monaco_loafer', '41', 'Midnight Navy Suede', '#1e3a8a', 12, 'ART-MN-006-41-NVY', NULL);
REPLACE INTO product_variants (id, product_id, size, color, color_hex, stock, sku_variant, price_override_bdt) VALUES ('v_mn_3', 'prod_monaco_loafer', '42', 'Midnight Navy Suede', '#1e3a8a', 15, 'ART-MN-006-42-NVY', NULL);
REPLACE INTO product_variants (id, product_id, size, color, color_hex, stock, sku_variant, price_override_bdt) VALUES ('v_mn_4', 'prod_monaco_loafer', '43', 'Midnight Navy Suede', '#1e3a8a', 8, 'ART-MN-006-43-NVY', NULL);
REPLACE INTO product_variants (id, product_id, size, color, color_hex, stock, sku_variant, price_override_bdt) VALUES ('v_mn_5', 'prod_monaco_loafer', '41', 'Charcoal Velvet Suede', '#27272a', 10, 'ART-MN-006-41-CHR', NULL);
REPLACE INTO product_variants (id, product_id, size, color, color_hex, stock, sku_variant, price_override_bdt) VALUES ('v_mn_6', 'prod_monaco_loafer', '42', 'Charcoal Velvet Suede', '#27272a', 11, 'ART-MN-006-42-CHR', NULL);
REPLACE INTO products (id, name, slug, sku, product_type, ribbon_text, brand, category, gender, description, images_json, regular_price_bdt, sale_price_bdt, is_featured, is_best_seller, is_published, specifications_json, rating, review_count, created_at, updated_at) VALUES ('prod_stride_sandal', 'Urban Stride Cork & Nubuck Leather Slide', 'urban-stride-cork-nubuck-leather-slide', 'URB-SD-007', 'variable', 'Everyday Essential', 'Urban Stride', 'sandals-slippers', 'unisex', 'Anatomically contoured Portuguese cork-latex footbed paired with rich oiled saddle-brown nubuck leather straps. Shapes naturally to your arch for unmatched everyday comfort.', '[\"/src/assets/images/product_leather_sandal_1792769000370.jpg\",\"/src/assets/images/product_chelsea_boots_1792739008903.jpg\"]', 2450, 1990, 0, 1, 1, '{\"Footbed\":\"100% Shock-absorbing natural cork & suede liner\",\"Upper Strap\":\"Thick oiled pull-up nubuck leather\",\"Outsole\":\"Lightweight traction-patterned EVA\"}', 4.8, 34, '2026-10-20T11:00:00Z', '2026-10-20T11:00:00Z');
REPLACE INTO product_variants (id, product_id, size, color, color_hex, stock, sku_variant, price_override_bdt) VALUES ('v_sd_1', 'prod_stride_sandal', '39', 'Saddle Tan Nubuck', '#78350f', 15, 'URB-SD-007-39-TAN', NULL);
REPLACE INTO product_variants (id, product_id, size, color, color_hex, stock, sku_variant, price_override_bdt) VALUES ('v_sd_2', 'prod_stride_sandal', '40', 'Saddle Tan Nubuck', '#78350f', 20, 'URB-SD-007-40-TAN', NULL);
REPLACE INTO product_variants (id, product_id, size, color, color_hex, stock, sku_variant, price_override_bdt) VALUES ('v_sd_3', 'prod_stride_sandal', '41', 'Saddle Tan Nubuck', '#78350f', 18, 'URB-SD-007-41-TAN', NULL);
REPLACE INTO product_variants (id, product_id, size, color, color_hex, stock, sku_variant, price_override_bdt) VALUES ('v_sd_4', 'prod_stride_sandal', '42', 'Saddle Tan Nubuck', '#78350f', 14, 'URB-SD-007-42-TAN', NULL);
REPLACE INTO product_variants (id, product_id, size, color, color_hex, stock, sku_variant, price_override_bdt) VALUES ('v_sd_5', 'prod_stride_sandal', '43', 'Saddle Tan Nubuck', '#78350f', 10, 'URB-SD-007-43-TAN', NULL);
REPLACE INTO product_variants (id, product_id, size, color, color_hex, stock, sku_variant, price_override_bdt) VALUES ('v_sd_6', 'prod_stride_sandal', '41', 'Matte Onyx Nubuck', '#18181b', 12, 'URB-SD-007-41-BLK', NULL);
REPLACE INTO product_variants (id, product_id, size, color, color_hex, stock, sku_variant, price_override_bdt) VALUES ('v_sd_7', 'prod_stride_sandal', '42', 'Matte Onyx Nubuck', '#18181b', 14, 'URB-SD-007-42-BLK', NULL);
REPLACE INTO products (id, name, slug, sku, product_type, ribbon_text, brand, category, gender, description, images_json, regular_price_bdt, sale_price_bdt, is_featured, is_best_seller, is_published, specifications_json, rating, review_count, created_at, updated_at) VALUES ('prod_horiz_runner', 'AeroFit Horizon Pro Urban Trainer', 'aerofit-horizon-pro-urban-trainer', 'AERO-HZ-008', 'variable', 'Monsoon Grip', 'AeroFit Athletics', 'mens-shoes', 'men', 'Versatile cross-training sneaker combining reinforced lateral stability cages with high-rebound dual-density cushioning and breathable open-weave mesh.', '[\"/src/assets/images/product_urban_runner_1792739007692.jpg\",\"/src/assets/images/hero_bdtechzen_flagship_1792768997575.jpg\"]', 4800, 4190, 0, 0, 1, '{\"Upper\":\"Engineered ripstop mesh with TPU overlays\",\"Midsole\":\"Dual-density responsive EVA\",\"Outsole\":\"Multi-surface lugged wet-traction rubber\"}', 4.7, 19, '2026-10-19T14:00:00Z', '2026-10-19T14:00:00Z');
REPLACE INTO product_variants (id, product_id, size, color, color_hex, stock, sku_variant, price_override_bdt) VALUES ('v_hr_1', 'prod_horiz_runner', '40', 'Charcoal / White', '#27272a', 12, 'AERO-HZ-008-40-CHR', NULL);
REPLACE INTO product_variants (id, product_id, size, color, color_hex, stock, sku_variant, price_override_bdt) VALUES ('v_hr_2', 'prod_horiz_runner', '41', 'Charcoal / White', '#27272a', 15, 'AERO-HZ-008-41-CHR', NULL);
REPLACE INTO product_variants (id, product_id, size, color, color_hex, stock, sku_variant, price_override_bdt) VALUES ('v_hr_3', 'prod_horiz_runner', '42', 'Charcoal / White', '#27272a', 19, 'AERO-HZ-008-42-CHR', NULL);
REPLACE INTO product_variants (id, product_id, size, color, color_hex, stock, sku_variant, price_override_bdt) VALUES ('v_hr_4', 'prod_horiz_runner', '43', 'Charcoal / White', '#27272a', 11, 'AERO-HZ-008-43-CHR', NULL);
REPLACE INTO product_variants (id, product_id, size, color, color_hex, stock, sku_variant, price_override_bdt) VALUES ('v_hr_5', 'prod_horiz_runner', '44', 'Charcoal / White', '#27272a', 8, 'AERO-HZ-008-44-CHR', NULL);
REPLACE INTO products (id, name, slug, sku, product_type, ribbon_text, brand, category, gender, description, images_json, regular_price_bdt, sale_price_bdt, is_featured, is_best_seller, is_published, specifications_json, rating, review_count, created_at, updated_at) VALUES ('prod_milan_street_court', 'Urban Stride Milan Minimalist Street Low', 'urban-stride-milan-minimalist-street-low', 'URB-MLN-015', 'variable', 'Smart Casual', 'Urban Stride', 'casual-shoes', 'unisex', 'Clean low-profile weekend sneaker pairing pebble-grained leather with micro-perforated quarter panels and high-rebound cupsole comfort for effortless everyday wear.', '[\"/src/assets/images/hero_footwear_banner_1792739005918.jpg\",\"/src/assets/images/product_court_sneaker_1792769000669.jpg\"]', 3950, 3390, 0, 0, 1, '{\"Upper\":\"Soft pebble-grain leather & suede heel counter\",\"Lining\":\"Moisture-wicking micro-terry lining\",\"Outsole\":\"Non-marking natural rubber cupsole\"}', 4.8, 21, '2026-10-19T10:00:00Z', '2026-10-19T10:00:00Z');
REPLACE INTO product_variants (id, product_id, size, color, color_hex, stock, sku_variant, price_override_bdt) VALUES ('v_mln_1', 'prod_milan_street_court', '39', 'Pure Chalk / Gum', '#e4e4e7', 12, 'URB-MLN-015-39-CHK', NULL);
REPLACE INTO product_variants (id, product_id, size, color, color_hex, stock, sku_variant, price_override_bdt) VALUES ('v_mln_2', 'prod_milan_street_court', '40', 'Pure Chalk / Gum', '#e4e4e7', 16, 'URB-MLN-015-40-CHK', NULL);
REPLACE INTO product_variants (id, product_id, size, color, color_hex, stock, sku_variant, price_override_bdt) VALUES ('v_mln_3', 'prod_milan_street_court', '41', 'Pure Chalk / Gum', '#e4e4e7', 18, 'URB-MLN-015-41-CHK', NULL);
REPLACE INTO product_variants (id, product_id, size, color, color_hex, stock, sku_variant, price_override_bdt) VALUES ('v_mln_4', 'prod_milan_street_court', '42', 'Pure Chalk / Gum', '#e4e4e7', 15, 'URB-MLN-015-42-CHK', NULL);
REPLACE INTO product_variants (id, product_id, size, color, color_hex, stock, sku_variant, price_override_bdt) VALUES ('v_mln_5', 'prod_milan_street_court', '43', 'Pure Chalk / Gum', '#e4e4e7', 10, 'URB-MLN-015-43-CHK', NULL);
REPLACE INTO products (id, name, slug, sku, product_type, ribbon_text, brand, category, gender, description, images_json, regular_price_bdt, sale_price_bdt, is_featured, is_best_seller, is_published, specifications_json, rating, review_count, created_at, updated_at) VALUES ('prod_junior_velocity', 'Velox Junior Velocity Flex Runner', 'velox-junior-velocity-flex-runner', 'VLX-JR-009', 'variable', 'Kids Favorite', 'Velox Performance', 'kids-shoes', 'kids', 'Easy hook-and-loop strap athletic runner for active kids, featuring a scuff-resistant toe bumper and ultra-flexible non-marking rubber sole.', '[\"/src/assets/images/product_trail_marathon_shoe_1792775363886.jpg\",\"/src/assets/images/category_women_sneakers_1792739007245.jpg\"]', 2650, 2290, 0, 0, 1, '{\"Closure\":\"No-tie elastic laces + secure hook-and-loop strap\",\"Outsole\":\"Non-marking playground grip rubber\"}', 4.9, 17, '2026-10-18T12:00:00Z', '2026-10-18T12:00:00Z');
REPLACE INTO product_variants (id, product_id, size, color, color_hex, stock, sku_variant, price_override_bdt) VALUES ('v_jr_1', 'prod_junior_velocity', '30', 'Royal Violet / Grey', '#7c3aed', 10, 'VLX-JR-009-30-VIO', NULL);
REPLACE INTO product_variants (id, product_id, size, color, color_hex, stock, sku_variant, price_override_bdt) VALUES ('v_jr_2', 'prod_junior_velocity', '32', 'Royal Violet / Grey', '#7c3aed', 14, 'VLX-JR-009-32-VIO', NULL);
REPLACE INTO product_variants (id, product_id, size, color, color_hex, stock, sku_variant, price_override_bdt) VALUES ('v_jr_3', 'prod_junior_velocity', '34', 'Royal Violet / Grey', '#7c3aed', 12, 'VLX-JR-009-34-VIO', NULL);
REPLACE INTO product_variants (id, product_id, size, color, color_hex, stock, sku_variant, price_override_bdt) VALUES ('v_jr_4', 'prod_junior_velocity', '35', 'Royal Violet / Grey', '#7c3aed', 9, 'VLX-JR-009-35-VIO', NULL);
REPLACE INTO products (id, name, slug, sku, product_type, ribbon_text, brand, category, gender, description, images_json, regular_price_bdt, sale_price_bdt, is_featured, is_best_seller, is_published, specifications_json, rating, review_count, created_at, updated_at) VALUES ('prod_leather_care_vault', 'Artisano Executive Calfskin Care & Cedar Valet Kit', 'artisano-executive-calfskin-care-cedar-valet-kit', 'ART-KIT-016', 'simple', 'Shoe Care Kit', 'Artisano Leathercraft', 'formal-shoes', 'unisex', 'Complete 5-piece luxury shoe care kit including aromatic red-cedar shoe trees, neutral beeswax conditioning cream, horsehair shine brush, and suede eraser block.', '[\"/src/assets/images/product_penny_loafer_tan_1792775363081.jpg\",\"/src/assets/images/product_oxford_dress_shoe_1792775360783.jpg\"]', 1850, 1490, 0, 0, 1, '{\"Contents\":\"Cedar shoe Inserts, neutral carnauba wax, horsehair brush, microfiber cloth\",\"Compatibility\":\"Safe for all calfskin, nubuck, and full-grain leather footwear\"}', 5, 15, '2026-10-18T09:00:00Z', '2026-10-18T09:00:00Z');
REPLACE INTO product_variants (id, product_id, size, color, color_hex, stock, sku_variant, price_override_bdt) VALUES ('v_kit_1', 'prod_leather_care_vault', 'Standard Kit', 'Natural Cedar / Neutral Wax', '#92400e', 35, 'ART-KIT-016-STD', NULL);

-- Users (Including Super Admin krrahman)
REPLACE INTO users (id, name, email, phone, country, role, password_hash, salt, must_change_password, addresses_json, created_at) VALUES ('user_admin_krrahman', 'krrahman', 'krrahman@bdtechzen.com', '+8801623604635', 'BD', 'admin', 'a1f4d3aed1518d05f15f1a280a465715d717c25a4e6824d4b78affaa62512010a2778b28c7b447f2fffeadf4f6cb6c15e90cf8dc88931ac4436a085e24458806', 'bdtechzen_admin_salt_2026', 0, '[]', '2026-10-23T18:12:59.727Z');

-- Coupons
REPLACE INTO coupons (id, code, discount_type, discount_value, min_order_amount, max_discount_amount, start_date, expiry_date, usage_limit, times_used, country_restriction, is_active) VALUES ('coup_welcome', 'ZEN10', 'percentage', 10, 2000, 1000, '2026-01-01', '2028-12-31', 1000, 42, 'BD', 1);
REPLACE INTO coupons (id, code, discount_type, discount_value, min_order_amount, max_discount_amount, start_date, expiry_date, usage_limit, times_used, country_restriction, is_active) VALUES ('coup_dhaka', 'SAVE300', 'fixed', 300, 3500, NULL, '2026-01-01', '2028-12-31', 500, 19, 'BD', 1);

-- Reviews
REPLACE INTO reviews (id, product_id, user_id, user_name, user_country, rating, title, comment, is_verified_purchase, status, created_at) VALUES ('rev_1', 'prod_apex_violet', NULL, 'Kazi Farhan', 'BD', 5, 'Incredible rebound and breathable mesh for Dhaka weather', 'Been running 5km every morning around Hatirjheel in these. Zero heel slip, super lightweight, and Cash on Delivery arrived in 24 hours.', 1, 'approved', '2026-10-18T14:20:00Z');
REPLACE INTO reviews (id, product_id, user_id, user_name, user_country, rating, title, comment, is_verified_purchase, status, created_at) VALUES ('rev_2', 'prod_mayfair_oxford', NULL, 'Asif Mahmud', 'BD', 5, 'Genuine full-grain calfskin with executive mirror polish', 'Wore the Mayfair Cap-Toe Oxfords to two corporate board meetings and a reception. Comfortable right out of the box.', 1, 'approved', '2026-10-19T11:15:00Z');
REPLACE INTO reviews (id, product_id, user_id, user_name, user_country, rating, title, comment, is_verified_purchase, status, created_at) VALUES ('rev_3', 'prod_court_violet', NULL, 'Nusrat Jahan', 'BD', 5, 'Cleanest white leather sneakers I own', 'The violet leather heel tab matches BDTechZen branding subtly and the OrthoLite insole feels plush even after 8 hours.', 1, 'approved', '2026-10-20T09:40:00Z');

SET FOREIGN_KEY_CHECKS = 1;
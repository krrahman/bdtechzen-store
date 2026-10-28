import fs from 'fs';
import path from 'path';
import { DatabaseSchema } from './db.js';
import {
  ZipEntryInput,
  createZipArchive,
  generateElementorFreeFlexboxJson
} from './wpExport.js';

function getImageBasename(rawPath: string, fallbackFile: string): string {
  if (!rawPath || rawPath.startsWith('http') || rawPath.startsWith('data:')) {
    return fallbackFile;
  }
  return path.basename(rawPath) || fallbackFile;
}

/* ---------------------------------------------------------------------------
 * INSTALLABLE WORDPRESS THEME (.ZIP) GENERATOR FOR CPANEL WORDPRESS
 *
 * Produces `bdtechzen-wordpress-theme.zip` with root folder `bdtechzen-theme/`:
 *  - style.css            (Valid WP Theme Header + Pure CSS3 Flexbox Storefront)
 *  - screenshot.jpg       (Theme thumbnail in WP Appearance -> Themes)
 *  - functions.php        (Customizer, COD Orders CPT, Email + BD SMS dispatch,
 *                          1-Click Elementor Free Classic Flexbox Page Creator)
 *  - header.php           (Utility bar + Sticky 3-Zone Flexbox Header)
 *  - footer.php           (Flexbox Footer + Interactive COD Order Modal + JS)
 *  - front-page.php       (Full BDTechZen Storefront + Elementor Builder Bridge)
 *  - page.php             (Full-width WordPress & Elementor Page template)
 *  - index.php            (Standard WordPress fallback loop)
 *  - data/catalog.json    (All variable products, EU sizes, colors, BDT prices)
 *  - elementor/bdtechzen-elementor-free-flexbox.json (Elementor Free Flexbox)
 *  - assets/images/*.jpg  (All hero, lookbook & product images bundled locally)
 *  - README-BANGLA.txt    (Step-by-step cPanel WordPress installation guide)
 * -------------------------------------------------------------------------*/

export function buildInstallableWordPressThemeZip(
  db: DatabaseSchema,
  baseUrl: string
): Buffer {
  const THEME_SLUG = 'bdtechzen-theme';
  const settings = db.settings;

  const catalogPayload = {
    storeName: settings.storeName || 'BDTechZen',
    storeTagline:
      settings.storeTagline ||
      'Handcrafted calfskin dress shoes, loafers & court sneakers in Bangladesh.',
    supportEmail: settings.supportEmail || 'support@bdtechzen.com',
    supportPhone: settings.supportPhone || '+880 1623-604635',
    whatsappNumber: settings.whatsappNumber || '+8801623604635',
    announcementText:
      settings.announcementText ||
      'Cash on Delivery Across All 64 Districts · Free Delivery Over ৳3,000 · Code ZEN10',
    shippingInsideDhaka: settings.shippingBD?.insideDhaka ?? 70,
    shippingOutsideDhaka: settings.shippingBD?.outsideDhaka ?? 130,
    freeShippingThreshold: settings.shippingBD?.freeShippingThreshold ?? 3000,
    heroTitle:
      settings.heroBanner?.title ||
      'Shoes built to walk, cut from full-grain calfskin.',
    heroSubtitle:
      settings.heroBanner?.subtitle ||
      'We pair Italian-tanned calfskin and water-resistant suede with cushioned anatomical footbeds—so your morning commute in Motijheel feels as effortless as dinner in Gulshan.',
    heroCtaText: settings.heroBanner?.ctaText || 'Shop the Collection',
    heroImageFile: getImageBasename(
      settings.heroBanner?.imageUrl || '',
      'hero_bangladeshi_models_1792779716481.jpg'
    ),
    formalImageFile: 'hero_bangladeshi_formal_1792779717196.jpg',
    runnerImageFile: 'product_trail_marathon_shoe_1792775363886.jpg',
    craftImageFile: 'atelier_leather_craft_1792778292354.jpg',
    categories: db.categories.slice(0, 6).map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      imageFile: getImageBasename(c.image, 'category_men_shoes_1792739006791.jpg')
    })),
    coupons: db.coupons
      .filter((c) => c.isActive)
      .map((c) => ({
        code: c.code.toUpperCase(),
        discountType: c.discountType,
        discountValue: c.discountValue,
        minOrderBDT: c.minOrderAmount
      })),
    products: db.products
      .filter((p) => p.isPublished)
      .map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        sku: p.sku,
        brand: p.brand,
        category: p.category,
        gender: p.gender,
        description: p.description,
        regularPriceBDT: p.regularPriceBDT,
        salePriceBDT: p.salePriceBDT || null,
        imageFile: getImageBasename(
          p.images[0] || '',
          'product_oxford_dress_shoe_1792775360783.jpg'
        ),
        variants: p.variants.map((v) => ({
          id: v.id,
          size: v.size,
          color: v.color,
          colorHex: v.colorHex,
          stock: v.stock
        }))
      }))
  };

  /* 1. style.css (Valid WordPress Theme Header + Pure CSS Flexbox Styles) */
  const styleCss = `/*
Theme Name: BDTechZen Footwear Atelier
Theme URI: https://bdtechzen.com
Author: BDTechZen Studio
Author URI: https://bdtechzen.com
Description: Handcrafted Bangladesh Footwear E-Commerce WordPress Theme with Pure CSS3 Flexbox layout, Variable Shoe Sizes & Colors, Cash on Delivery (COD) Checkout, Automatic Customer Email & Mobile SMS Notifications, WhatsApp Quick Order (+8801623604635), and 1-Click Elementor Free Classic Flexbox Container compatibility.
Version: 2.1.0
Requires at least: 6.0
Tested up to: 6.7
Requires PHP: 7.4
License: GPL v2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html
Text Domain: bdtechzen
Tags: e-commerce, custom-logo, custom-menu, full-width-template, flexible-header
*/

:root {
  --bdtz-canvas: #f7f6f2;
  --bdtz-surface: #ffffff;
  --bdtz-limestone: #f1efea;
  --bdtz-obsidian: #0e0e10;
  --bdtz-obsidian-soft: #16161a;
  --bdtz-ink: #111113;
  --bdtz-muted: #52525b;
  --bdtz-border: #e5e2dc;
  --bdtz-dark-border: #27272a;
  --bdtz-whatsapp: #25D366;
  --bdtz-radius: 12px;
  --bdtz-container: 1240px;
}

*, *::before, *::after {
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body.bdtz-body {
  margin: 0;
  padding: 0;
  background-color: var(--bdtz-canvas);
  color: var(--bdtz-ink);
  font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 16px;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}

.bdtz-wp-root h1,
.bdtz-wp-root h2,
.bdtz-wp-root h3,
.bdtz-wp-root h4,
.bdtz-wp-root h5,
.bdtz-font-display {
  font-family: 'Poppins', sans-serif;
  margin: 0;
  letter-spacing: -0.02em;
}

.bdtz-wp-root p {
  margin: 0;
}

.bdtz-wp-root a {
  text-decoration: none;
  color: inherit;
}

.bdtz-container {
  width: 100%;
  max-width: var(--bdtz-container);
  margin: 0 auto;
  padding-left: 24px;
  padding-right: 24px;
}

.bdtz-flex-row {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
}

.bdtz-flex-col {
  display: flex;
  flex-direction: column;
}

/* Top Utility Bar */
.bdtz-utility-bar {
  background-color: var(--bdtz-obsidian);
  color: #d6d3d1;
  font-size: 12px;
  border-bottom: 1px solid var(--bdtz-dark-border);
  padding: 8px 0;
}

.bdtz-utility-inner {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

/* Sticky 3-Zone Flexbox Header */
.bdtz-header {
  position: sticky;
  top: 0;
  z-index: 90;
  background-color: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--bdtz-border);
}

body.admin-bar .bdtz-header {
  top: 32px;
}

@media (max-width: 782px) {
  body.admin-bar .bdtz-header {
    top: 46px;
  }
}

.bdtz-header-inner {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 28px;
  min-height: 72px;
}

.bdtz-brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-family: 'Poppins', sans-serif;
  font-weight: 700;
  font-size: 20px;
  color: var(--bdtz-ink);
  white-space: nowrap;
}

.bdtz-brand-mark {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: var(--bdtz-ink);
  color: #ffffff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
}

.bdtz-nav,
.bdtz-nav ul {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 26px;
  list-style: none;
  margin: 0;
  padding: 0;
}

.bdtz-nav a {
  font-size: 14px;
  font-weight: 500;
  color: #3f3f46;
  white-space: nowrap;
  transition: color 0.15s ease;
}

.bdtz-nav a:hover {
  color: var(--bdtz-ink);
}

.bdtz-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 22px;
  border-radius: 8px;
  font-family: 'Poppins', sans-serif;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid transparent;
  transition: transform 0.15s ease, opacity 0.15s ease, background-color 0.15s ease;
  white-space: nowrap;
}

.bdtz-btn:hover {
  transform: translateY(-1px);
}

.bdtz-btn-dark {
  background-color: var(--bdtz-ink);
  color: #ffffff !important;
}

.bdtz-btn-light {
  background-color: #ffffff;
  color: var(--bdtz-ink) !important;
}

.bdtz-btn-outline-dark {
  background-color: transparent;
  color: #e7e5e4 !important;
  border-color: #3f3f46;
}

.bdtz-btn-whatsapp {
  background-color: var(--bdtz-whatsapp);
  color: #ffffff !important;
}

/* Editorial Hero Split */
.bdtz-hero {
  background-color: var(--bdtz-obsidian);
  color: #ffffff;
  border-bottom: 1px solid var(--bdtz-dark-border);
}

.bdtz-hero-split {
  display: flex;
  flex-direction: row;
  align-items: stretch;
  justify-content: space-between;
  gap: 48px;
  padding-top: 56px;
  padding-bottom: 56px;
}

.bdtz-hero-left {
  flex: 1 1 420px;
  max-width: 500px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 32px;
}

.bdtz-hero-kicker {
  font-size: 12px;
  font-weight: 500;
  color: #a8a29e;
  letter-spacing: 0.02em;
}

.bdtz-hero-title {
  font-size: clamp(2rem, 3.5vw, 2.85rem);
  font-weight: 600;
  line-height: 1.12;
  color: #ffffff;
}

.bdtz-hero-lead {
  font-size: 15px;
  line-height: 1.68;
  color: #d6d3d1;
}

.bdtz-hero-actions {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 12px;
  padding-top: 6px;
}

.bdtz-chapter-tabs {
  display: flex;
  flex-direction: row;
  gap: 16px;
  padding-top: 20px;
  border-top: 1px solid var(--bdtz-dark-border);
}

.bdtz-chapter-btn {
  flex: 1;
  text-align: left;
  background: transparent;
  border: none;
  border-top: 2px solid #27272a;
  padding: 10px 4px 0 0;
  cursor: pointer;
  color: #71717a;
  transition: color 0.15s ease, border-color 0.15s ease;
}

.bdtz-chapter-btn.active {
  border-top-color: #ffffff;
  color: #ffffff;
}

.bdtz-chapter-btn small {
  display: block;
  font-family: monospace;
  font-size: 11px;
  margin-bottom: 2px;
}

.bdtz-chapter-btn span {
  font-size: 12px;
  font-weight: 500;
}

.bdtz-hero-right {
  flex: 1 1 560px;
  display: flex;
  flex-direction: column;
}

.bdtz-hero-media-frame {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: var(--bdtz-radius);
  overflow: hidden;
  background-color: #18181b;
  border: 1px solid var(--bdtz-dark-border);
  display: flex;
}

.bdtz-hero-media-frame img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center center;
  display: block;
}

.bdtz-hero-caption {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding-top: 12px;
  font-size: 12px;
  color: #a8a29e;
  flex-wrap: wrap;
}

/* 4-Column Service Ledger */
.bdtz-ledger-strip {
  background-color: #121215;
  border-top: 1px solid var(--bdtz-dark-border);
}

.bdtz-ledger-flex {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: space-between;
}

.bdtz-ledger-item {
  flex: 1 1 240px;
  padding: 18px 20px 18px 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.bdtz-ledger-item strong {
  font-family: 'Poppins', sans-serif;
  font-size: 13px;
  font-weight: 600;
  color: #ffffff;
}

.bdtz-ledger-item span {
  font-size: 12px;
  color: #a8a29e;
}

/* Collection Section */
.bdtz-section {
  padding-top: 84px;
  padding-bottom: 84px;
}

.bdtz-section-head {
  display: flex;
  flex-direction: row;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  flex-wrap: wrap;
  margin-bottom: 36px;
}

.bdtz-filter-bar {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 6px;
  background-color: #e7e5df;
  padding: 4px;
  border-radius: 10px;
}

.bdtz-filter-btn {
  border: none;
  background: transparent;
  color: #52525b;
  font-family: 'DM Sans', sans-serif;
  font-size: 12px;
  font-weight: 600;
  padding: 7px 14px;
  border-radius: 7px;
  cursor: pointer;
}

.bdtz-filter-btn.active {
  background: #ffffff;
  color: var(--bdtz-ink);
}

.bdtz-product-flex-grid {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 28px;
}

.bdtz-product-card {
  flex: 1 1 calc(33.333% - 20px);
  min-width: 280px;
  max-width: calc(33.333% - 18px);
  background-color: var(--bdtz-surface);
  border: 1px solid var(--bdtz-border);
  border-radius: var(--bdtz-radius);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.bdtz-product-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 28px rgba(17, 17, 19, 0.06);
}

.bdtz-product-img-wrap {
  width: 100%;
  aspect-ratio: 4 / 3;
  background-color: var(--bdtz-limestone);
  overflow: hidden;
  display: flex;
  position: relative;
}

.bdtz-product-img-wrap img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.bdtz-product-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
}

.bdtz-product-meta {
  font-size: 12px;
  color: #71717a;
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.bdtz-product-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--bdtz-ink);
  line-height: 1.35;
}

.bdtz-swatches-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.bdtz-color-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 1px solid rgba(0, 0, 0, 0.2);
  display: inline-block;
}

.bdtz-product-footer {
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px solid #f1f0ec;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.bdtz-price {
  font-family: 'Poppins', sans-serif;
  font-size: 16px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--bdtz-ink);
}

.bdtz-price del {
  font-weight: 400;
  color: #a1a1aa;
  font-size: 13px;
  margin-left: 6px;
}

/* Craftsmanship Split */
.bdtz-craft-band {
  background-color: #ffffff;
  border-top: 1px solid var(--bdtz-border);
  border-bottom: 1px solid var(--bdtz-border);
}

.bdtz-craft-split {
  display: flex;
  flex-direction: row;
  align-items: stretch;
  gap: 48px;
  flex-wrap: wrap;
}

.bdtz-craft-media {
  flex: 1 1 460px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.bdtz-craft-media img {
  width: 100%;
  border-radius: var(--bdtz-radius);
  border: 1px solid var(--bdtz-border);
  aspect-ratio: 16 / 9;
  object-fit: cover;
  display: block;
}

.bdtz-craft-copy {
  flex: 1 1 440px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 22px;
}

.bdtz-craft-point {
  padding: 16px 0;
  border-top: 1px solid var(--bdtz-border);
  display: flex;
  flex-direction: row;
  gap: 16px;
}

.bdtz-dept-flex {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 20px;
  margin-top: 56px;
}

.bdtz-dept-card {
  flex: 1 1 calc(25% - 15px);
  min-width: 220px;
  position: relative;
  aspect-ratio: 4 / 3;
  border-radius: var(--bdtz-radius);
  overflow: hidden;
  border: 1px solid var(--bdtz-border);
  display: flex;
  align-items: flex-end;
}

.bdtz-dept-card img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.bdtz-dept-overlay {
  position: relative;
  z-index: 2;
  width: 100%;
  padding: 16px;
  background: linear-gradient(to top, rgba(0,0,0,0.82), rgba(0,0,0,0.05));
  color: #ffffff;
  font-family: 'Poppins', sans-serif;
  font-size: 14px;
  font-weight: 600;
}

/* Reviews & Sizing Desk CTA */
.bdtz-testimonials-flex {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 24px;
}

.bdtz-quote-card {
  flex: 1 1 300px;
  background: #ffffff;
  border: 1px solid var(--bdtz-border);
  border-radius: var(--bdtz-radius);
  padding: 26px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 20px;
}

.bdtz-cta-banner {
  margin-top: 48px;
  background: var(--bdtz-obsidian);
  color: #ffffff;
  border-radius: var(--bdtz-radius);
  padding: 36px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 28px;
  flex-wrap: wrap;
}

/* Footer */
.bdtz-footer {
  background-color: var(--bdtz-obsidian);
  color: #a8a29e;
  border-top: 1px solid var(--bdtz-dark-border);
  padding: 64px 0 32px;
  font-size: 13px;
}

.bdtz-footer-flex {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 40px;
  padding-bottom: 44px;
  border-bottom: 1px solid #1f1f23;
}

.bdtz-footer-col {
  flex: 1 1 200px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.bdtz-footer-col h5 {
  color: #ffffff;
  font-family: 'Poppins', sans-serif;
  font-size: 13px;
  font-weight: 600;
  margin: 0 0 6px 0;
}

.bdtz-footer-bottom {
  padding-top: 24px;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 16px;
  font-size: 12px;
  color: #78716c;
}

/* Cash on Delivery Interactive Order Modal */
.bdtz-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(14, 14, 16, 0.72);
  backdrop-filter: blur(4px);
  display: none;
  align-items: center;
  justify-content: center;
  padding: 16px;
  overflow-y: auto;
}

.bdtz-modal-backdrop.open {
  display: flex;
}

.bdtz-modal-card {
  width: 100%;
  max-width: 560px;
  background: #ffffff;
  color: var(--bdtz-ink);
  border-radius: 14px;
  border: 1px solid var(--bdtz-border);
  padding: 28px;
  max-height: 92vh;
  overflow-y: auto;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.28);
}

.bdtz-form-grid {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-top: 16px;
}

.bdtz-form-row {
  display: flex;
  flex-direction: row;
  gap: 12px;
  flex-wrap: wrap;
}

.bdtz-field {
  flex: 1 1 200px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.bdtz-field label {
  font-size: 12px;
  font-weight: 600;
  color: #3f3f46;
}

.bdtz-field input,
.bdtz-field select,
.bdtz-field textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d4d4d8;
  border-radius: 8px;
  font-family: 'DM Sans', sans-serif;
  font-size: 14px;
  color: #111113;
  background: #ffffff;
}

.bdtz-size-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.bdtz-size-pill {
  padding: 7px 13px;
  border-radius: 7px;
  border: 1px solid #d4d4d8;
  background: #ffffff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.bdtz-size-pill.active {
  background: #111113;
  color: #ffffff;
  border-color: #111113;
}

.bdtz-order-summary-box {
  background: #f7f6f2;
  border: 1px solid var(--bdtz-border);
  border-radius: 10px;
  padding: 14px 16px;
  font-size: 13px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.bdtz-summary-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

@media (max-width: 992px) {
  .bdtz-nav {
    display: none;
  }
  .bdtz-product-card {
    flex: 1 1 calc(50% - 14px);
    max-width: calc(50% - 14px);
  }
  .bdtz-hero-split {
    flex-direction: column;
    padding-top: 36px;
    padding-bottom: 40px;
  }
  .bdtz-hero-left {
    max-width: 100%;
    flex: 1 1 auto;
  }
  .bdtz-hero-right {
    flex: 1 1 auto;
  }
}

@media (max-width: 640px) {
  .bdtz-product-card {
    flex: 1 1 100%;
    max-width: 100%;
  }
  .bdtz-cta-banner {
    padding: 24px;
  }
  .bdtz-chapter-tabs {
    flex-direction: column;
    gap: 10px;
  }
}
`;

  /* 2. functions.php (Native WP Setup, Customizer, COD Orders + Email/SMS, 1-Click Elementor) */
  const functionsPhp = `<?php
/**
 * BDTechZen Footwear Atelier — Theme Functions & E-Commerce Engine
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

define( 'BDTZ_THEME_VERSION', '2.1.0' );

/**
 * Load bundled catalog JSON (products, variable sizes/colors, BDT prices, settings).
 */
function bdtz_get_catalog() {
    static $catalog = null;
    if ( null !== $catalog ) {
        return $catalog;
    }
    $json_file = get_template_directory() . '/data/catalog.json';
    if ( file_exists( $json_file ) ) {
        $raw = file_get_contents( $json_file );
        $decoded = json_decode( $raw, true );
        if ( is_array( $decoded ) ) {
            $catalog = $decoded;
            return $catalog;
        }
    }
    $catalog = array(
        'storeName' => 'BDTechZen',
        'storeTagline' => 'Handcrafted leather footwear in Bangladesh.',
        'supportEmail' => 'support@bdtechzen.com',
        'supportPhone' => '+880 1623-604635',
        'whatsappNumber' => '+8801623604635',
        'announcementText' => 'Cash on Delivery Across All 64 Districts',
        'shippingInsideDhaka' => 70,
        'shippingOutsideDhaka' => 130,
        'freeShippingThreshold' => 3000,
        'heroTitle' => 'Shoes built to walk, cut from full-grain calfskin.',
        'heroSubtitle' => '',
        'heroCtaText' => 'Shop the Collection',
        'heroImageFile' => 'hero_bangladeshi_models_1792779716481.jpg',
        'formalImageFile' => 'hero_bangladeshi_formal_1792779717196.jpg',
        'runnerImageFile' => 'product_trail_marathon_shoe_1792775363886.jpg',
        'craftImageFile' => 'atelier_leather_craft_1792778292354.jpg',
        'categories' => array(),
        'coupons' => array(),
        'products' => array(),
    );
    return $catalog;
}

function bdtz_theme_img_url( $filename ) {
    return esc_url( trailingslashit( get_template_directory_uri() ) . 'assets/images/' . ltrim( $filename, '/' ) );
}

function bdtz_setting( $key, $fallback = '' ) {
    $catalog = bdtz_get_catalog();
    $default = isset( $catalog[ $key ] ) ? $catalog[ $key ] : $fallback;
    return get_theme_mod( 'bdtz_' . $key, $default );
}

/**
 * Theme Setup & WooCommerce / Elementor Compatibility
 */
function bdtz_theme_setup() {
    add_theme_support( 'title-tag' );
    add_theme_support( 'post-thumbnails' );
    add_theme_support( 'custom-logo', array(
        'height'      => 64,
        'width'       => 220,
        'flex-height' => true,
        'flex-width'  => true,
    ) );
    add_theme_support( 'html5', array( 'search-form', 'comment-form', 'gallery', 'caption', 'style', 'script' ) );
    add_theme_support( 'woocommerce' );

    register_nav_menus( array(
        'primary' => __( 'Primary Storefront Menu', 'bdtechzen' ),
    ) );
}
add_action( 'after_setup_theme', 'bdtz_theme_setup' );

/**
 * Enqueue Google Fonts (Poppins + DM Sans) & Theme Stylesheet
 */
function bdtz_enqueue_assets() {
    wp_enqueue_style(
        'bdtz-google-fonts',
        'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Poppins:wght@500;600;700&display=swap',
        array(),
        null
    );
    wp_enqueue_style(
        'bdtz-main-style',
        get_stylesheet_uri(),
        array( 'bdtz-google-fonts' ),
        BDTZ_THEME_VERSION
    );
}
add_action( 'wp_enqueue_scripts', 'bdtz_enqueue_assets' );

/**
 * WordPress Customizer Settings (Appearance -> Customize -> BDTechZen Storefront)
 */
function bdtz_customize_register( $wp_customize ) {
    $catalog = bdtz_get_catalog();

    $wp_customize->add_section( 'bdtz_store_section', array(
        'title'    => __( 'BDTechZen Storefront & Hero', 'bdtechzen' ),
        'priority' => 25,
    ) );

    $fields = array(
        'storeName'        => array( 'Store Name', $catalog['storeName'], 'text' ),
        'announcementText' => array( 'Top Announcement Bar', $catalog['announcementText'], 'text' ),
        'heroTitle'        => array( 'Hero H1 Headline', $catalog['heroTitle'], 'textarea' ),
        'heroSubtitle'     => array( 'Hero Subtitle Copy', $catalog['heroSubtitle'], 'textarea' ),
        'heroCtaText'      => array( 'Hero Primary Button Text', $catalog['heroCtaText'], 'text' ),
        'whatsappNumber'   => array( 'WhatsApp Number (COD & Sizing)', $catalog['whatsappNumber'], 'text' ),
        'supportPhone'     => array( 'Display Phone Number', $catalog['supportPhone'], 'text' ),
        'supportEmail'     => array( 'Order Support Email', $catalog['supportEmail'], 'text' ),
    );

    foreach ( $fields as $key => $cfg ) {
        $setting_id = 'bdtz_' . $key;
        $wp_customize->add_setting( $setting_id, array(
            'default'           => $cfg[1],
            'sanitize_callback' => ( 'textarea' === $cfg[2] ) ? 'sanitize_textarea_field' : 'sanitize_text_field',
        ) );
        $wp_customize->add_control( $setting_id, array(
            'label'   => $cfg[0],
            'section' => 'bdtz_store_section',
            'type'    => $cfg[2],
        ) );
    }

    $wp_customize->add_setting( 'bdtz_custom_hero_image', array(
        'default'           => '',
        'sanitize_callback' => 'esc_url_raw',
    ) );
    $wp_customize->add_control( new WP_Customize_Image_Control( $wp_customize, 'bdtz_custom_hero_image', array(
        'label'   => __( 'Custom Hero Banner Photo (Optional)', 'bdtechzen' ),
        'section' => 'bdtz_store_section',
    ) ) );
}
add_action( 'customize_register', 'bdtz_customize_register' );

/**
 * Register "Shoe Orders" Custom Post Type in WP Admin
 */
function bdtz_register_orders_cpt() {
    register_post_type( 'bdtz_order', array(
        'labels' => array(
            'name'          => __( 'Shoe Orders', 'bdtechzen' ),
            'singular_name' => __( 'Shoe Order', 'bdtechzen' ),
            'menu_name'     => __( 'Shoe Orders (COD)', 'bdtechzen' ),
            'edit_item'     => __( 'Order Details', 'bdtechzen' ),
        ),
        'public'          => false,
        'show_ui'         => true,
        'show_in_menu'    => true,
        'menu_icon'       => 'dashicons-cart',
        'capability_type' => 'post',
        'capabilities'    => array( 'create_posts' => 'do_not_allow' ),
        'map_meta_cap'    => true,
        'supports'        => array( 'title' ),
    ) );
}
add_action( 'init', 'bdtz_register_orders_cpt' );

function bdtz_order_columns( $cols ) {
    return array(
        'cb'       => '<input type="checkbox" />',
        'title'    => 'Order #',
        'customer' => 'Customer & Mobile',
        'item'     => 'Shoe / EU Size / Color',
        'total'    => 'Grand Total (BDT)',
        'notify'   => 'Email & SMS Status',
        'date'     => 'Date',
    );
}
add_filter( 'manage_bdtz_order_posts_columns', 'bdtz_order_columns' );

function bdtz_order_column_content( $column, $post_id ) {
    if ( 'customer' === $column ) {
        echo '<strong>' . esc_html( get_post_meta( $post_id, '_bdtz_customer_name', true ) ) . '</strong><br/>';
        echo esc_html( get_post_meta( $post_id, '_bdtz_customer_phone', true ) );
    } elseif ( 'item' === $column ) {
        echo esc_html( get_post_meta( $post_id, '_bdtz_product_name', true ) ) . '<br/>';
        echo '<small>EU ' . esc_html( get_post_meta( $post_id, '_bdtz_size', true ) ) . ' · ' . esc_html( get_post_meta( $post_id, '_bdtz_color', true ) ) . ' × ' . intval( get_post_meta( $post_id, '_bdtz_qty', true ) ) . '</small>';
    } elseif ( 'total' === $column ) {
        echo '<strong>৳' . number_format_i18n( intval( get_post_meta( $post_id, '_bdtz_grand_total', true ) ) ) . '</strong> (COD)';
    } elseif ( 'notify' === $column ) {
        echo esc_html( get_post_meta( $post_id, '_bdtz_notify_log', true ) );
    }
}
add_action( 'manage_bdtz_order_posts_custom_column', 'bdtz_order_column_content', 10, 2 );

function bdtz_add_order_metabox() {
    add_meta_box( 'bdtz_order_info', 'Customer & Cash on Delivery Summary', 'bdtz_render_order_metabox', 'bdtz_order', 'normal', 'high' );
}
add_action( 'add_meta_boxes', 'bdtz_add_order_metabox' );

function bdtz_render_order_metabox( $post ) {
    $fields = array(
        'Order Number'    => get_post_meta( $post->ID, '_bdtz_order_number', true ),
        'Customer Name'   => get_post_meta( $post->ID, '_bdtz_customer_name', true ),
        'Mobile Number'   => get_post_meta( $post->ID, '_bdtz_customer_phone', true ),
        'Email Address'   => get_post_meta( $post->ID, '_bdtz_customer_email', true ),
        'Delivery Zone'   => get_post_meta( $post->ID, '_bdtz_zone', true ),
        'Full Address'    => get_post_meta( $post->ID, '_bdtz_address', true ),
        'Product Ordered' => get_post_meta( $post->ID, '_bdtz_product_name', true ) . ' (' . get_post_meta( $post->ID, '_bdtz_sku', true ) . ')',
        'Variant'         => 'EU Size ' . get_post_meta( $post->ID, '_bdtz_size', true ) . ' | Color: ' . get_post_meta( $post->ID, '_bdtz_color', true ) . ' | Qty: ' . get_post_meta( $post->ID, '_bdtz_qty', true ),
        'Grand Total'     => 'BDT ' . get_post_meta( $post->ID, '_bdtz_grand_total', true ) . ' (Cash on Delivery)',
        'Notification'    => get_post_meta( $post->ID, '_bdtz_notify_log', true ),
    );
    echo '<table class="widefat striped"><tbody>';
    foreach ( $fields as $label => $val ) {
        echo '<tr><th style="width:180px;">' . esc_html( $label ) . '</th><td>' . esc_html( $val ) . '</td></tr>';
    }
    echo '</tbody></table>';
}

/**
 * AJAX Cash on Delivery Order Handler (Saves Order + Sends Customer Email & Mobile SMS)
 */
function bdtz_handle_cod_order() {
    check_ajax_referer( 'bdtz_cod_nonce', 'nonce' );

    $customer_name  = sanitize_text_field( wp_unslash( $_POST['customer_name'] ?? '' ) );
    $customer_phone = sanitize_text_field( wp_unslash( $_POST['customer_phone'] ?? '' ) );
    $customer_email = sanitize_email( wp_unslash( $_POST['customer_email'] ?? '' ) );
    $address        = sanitize_textarea_field( wp_unslash( $_POST['address'] ?? '' ) );
    $zone           = sanitize_text_field( wp_unslash( $_POST['zone'] ?? 'Inside Dhaka' ) );
    $product_name   = sanitize_text_field( wp_unslash( $_POST['product_name'] ?? '' ) );
    $sku            = sanitize_text_field( wp_unslash( $_POST['sku'] ?? '' ) );
    $size           = sanitize_text_field( wp_unslash( $_POST['size'] ?? '42' ) );
    $color          = sanitize_text_field( wp_unslash( $_POST['color'] ?? 'Standard' ) );
    $qty            = max( 1, min( 10, intval( $_POST['qty'] ?? 1 ) ) );
    $unit_price     = max( 0, intval( $_POST['unit_price'] ?? 0 ) );
    $coupon_code    = strtoupper( sanitize_text_field( wp_unslash( $_POST['coupon'] ?? '' ) ) );

    if ( empty( $customer_name ) || empty( $customer_phone ) || empty( $address ) || empty( $product_name ) ) {
        wp_send_json_error( array( 'message' => 'Please fill in your Name, Mobile Number, and Full Delivery Address.' ) );
    }

    $catalog   = bdtz_get_catalog();
    $subtotal  = $unit_price * $qty;
    $discount  = 0;

    if ( 'ZEN10' === $coupon_code && $subtotal >= 2000 ) {
        $discount = (int) round( $subtotal * 0.10 );
    } elseif ( 'EID15' === $coupon_code && $subtotal >= 3500 ) {
        $discount = (int) round( $subtotal * 0.15 );
    }

    $threshold = intval( $catalog['freeShippingThreshold'] ?? 3000 );
    $shipping  = ( $subtotal - $discount >= $threshold )
        ? 0
        : ( 'Outside Dhaka' === $zone ? intval( $catalog['shippingOutsideDhaka'] ?? 130 ) : intval( $catalog['shippingInsideDhaka'] ?? 70 ) );

    $grand_total  = max( 0, $subtotal - $discount + $shipping );
    $order_number = 'BDTZ-' . wp_rand( 10000, 99999 );

    $post_id = wp_insert_post( array(
        'post_type'   => 'bdtz_order',
        'post_status' => 'publish',
        'post_title'  => $order_number . ' — ' . $customer_name,
    ) );

    if ( is_wp_error( $post_id ) ) {
        wp_send_json_error( array( 'message' => 'Could not save order. Please order via WhatsApp.' ) );
    }

    update_post_meta( $post_id, '_bdtz_order_number', $order_number );
    update_post_meta( $post_id, '_bdtz_customer_name', $customer_name );
    update_post_meta( $post_id, '_bdtz_customer_phone', $customer_phone );
    update_post_meta( $post_id, '_bdtz_customer_email', $customer_email );
    update_post_meta( $post_id, '_bdtz_address', $address );
    update_post_meta( $post_id, '_bdtz_zone', $zone );
    update_post_meta( $post_id, '_bdtz_product_name', $product_name );
    update_post_meta( $post_id, '_bdtz_sku', $sku );
    update_post_meta( $post_id, '_bdtz_size', $size );
    update_post_meta( $post_id, '_bdtz_color', $color );
    update_post_meta( $post_id, '_bdtz_qty', $qty );
    update_post_meta( $post_id, '_bdtz_grand_total', $grand_total );

    $store_name   = bdtz_setting( 'storeName', 'BDTechZen' );
    $support_mail = bdtz_setting( 'supportEmail', get_option( 'admin_email' ) );
    $whatsapp_no  = bdtz_setting( 'whatsappNumber', '+8801623604635' );

    // 1. Send Confirmation Email to Customer + Admin via wp_mail()
    $email_sent = false;
    $headers    = array( 'Content-Type: text/html; charset=UTF-8' );
    $subject    = '[' . $store_name . '] Order Confirmed: ' . $order_number;
    $email_body = '<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;border:1px solid #e5e2dc;border-radius:10px;">'
        . '<h2 style="margin:0 0 12px;color:#111113;">Thank you for your order, ' . esc_html( $customer_name ) . '!</h2>'
        . '<p style="color:#52525b;font-size:14px;">Your Cash on Delivery order <strong>' . esc_html( $order_number ) . '</strong> has been received by our Dhaka studio.</p>'
        . '<hr style="border:none;border-top:1px solid #e5e2dc;margin:16px 0;" />'
        . '<p style="margin:4px 0;"><strong>Pair:</strong> ' . esc_html( $product_name ) . '</p>'
        . '<p style="margin:4px 0;"><strong>Size &amp; Color:</strong> EU ' . esc_html( $size ) . ' · ' . esc_html( $color ) . ' (Qty: ' . intval( $qty ) . ')</p>'
        . '<p style="margin:4px 0;"><strong>Delivery Address:</strong> ' . esc_html( $address ) . ' (' . esc_html( $zone ) . ')</p>'
        . '<p style="margin:8px 0;font-size:16px;"><strong>Payable on Delivery: ৳' . number_format_i18n( $grand_total ) . '</strong></p>'
        . '<p style="color:#71717a;font-size:12px;margin-top:16px;">Questions or size adjustments? Message us on WhatsApp: ' . esc_html( $whatsapp_no ) . '</p>'
        . '</div>';

    if ( ! empty( $customer_email ) && is_email( $customer_email ) ) {
        $email_sent = wp_mail( $customer_email, $subject, $email_body, $headers );
    }
    wp_mail( $support_mail, '[New COD Order] ' . $order_number . ' - ' . $customer_phone, $email_body, $headers );

    // 2. Send Confirmation SMS to Customer Mobile Number (Bangladesh SMS Gateway)
    $sms_api_url   = get_option( 'bdtz_sms_api_url', '' );
    $sms_api_key   = get_option( 'bdtz_sms_api_key', '' );
    $sms_sender_id = get_option( 'bdtz_sms_sender_id', 'BDTechZen' );
    $sms_status    = 'SMS Ready (Configure API in BDTechZen Settings)';

    $sms_text = $store_name . ': Order ' . $order_number . ' confirmed! ' . $product_name . ' (EU ' . $size . '), Payable COD: BDT ' . $grand_total . '. Helpline: ' . $whatsapp_no;

    if ( ! empty( $sms_api_url ) && ! empty( $sms_api_key ) ) {
        $digits = preg_replace( '/[^0-9]/', '', $customer_phone );
        if ( 11 === strlen( $digits ) && '01' === substr( $digits, 0, 2 ) ) {
            $digits = '88' . $digits;
        }
        $resp = wp_remote_post( $sms_api_url, array(
            'timeout' => 8,
            'body'    => array(
                'api_key'  => $sms_api_key,
                'senderid' => $sms_sender_id,
                'number'   => $digits,
                'message'  => $sms_text,
            ),
        ) );
        $sms_status = is_wp_error( $resp ) ? 'SMS Error' : 'SMS Dispatched';
    }

    $notify_summary = ( $email_sent ? 'Email Sent' : 'Admin Emailed' ) . ' · ' . $sms_status;
    update_post_meta( $post_id, '_bdtz_notify_log', $notify_summary );

    $clean_wa = preg_replace( '/[^0-9]/', '', $whatsapp_no );
    $wa_msg   = rawurlencode( 'Hello ' . $store_name . ', my COD Order #' . $order_number . ' is placed: ' . $product_name . ' (EU ' . $size . ', ' . $color . '), Total BDT ' . $grand_total . '. Phone: ' . $customer_phone );

    wp_send_json_success( array(
        'orderNumber' => $order_number,
        'grandTotal'  => $grand_total,
        'emailSent'   => $email_sent,
        'smsStatus'   => $sms_status,
        'whatsappUrl' => 'https://wa.me/' . $clean_wa . '?text=' . $wa_msg,
    ) );
}
add_action( 'wp_ajax_bdtz_place_cod_order', 'bdtz_handle_cod_order' );
add_action( 'wp_ajax_nopriv_bdtz_place_cod_order', 'bdtz_handle_cod_order' );

/**
 * Admin Page: BDTechZen SMS Gateway + 1-Click Elementor Free Flexbox Home Page Creator
 */
function bdtz_register_admin_menu() {
    add_theme_page(
        'BDTechZen Setup & SMS',
        'BDTechZen Setup & SMS',
        'manage_options',
        'bdtz-setup',
        'bdtz_render_setup_page'
    );
}
add_action( 'admin_menu', 'bdtz_register_admin_menu' );

function bdtz_render_setup_page() {
    if ( ! current_user_can( 'manage_options' ) ) {
        return;
    }

    $notice = '';

    // Save SMS Settings
    if ( isset( $_POST['bdtz_save_sms'] ) && check_admin_referer( 'bdtz_setup_action', 'bdtz_setup_nonce' ) ) {
        update_option( 'bdtz_sms_api_url', esc_url_raw( wp_unslash( $_POST['sms_api_url'] ?? '' ) ) );
        update_option( 'bdtz_sms_api_key', sanitize_text_field( wp_unslash( $_POST['sms_api_key'] ?? '' ) ) );
        update_option( 'bdtz_sms_sender_id', sanitize_text_field( wp_unslash( $_POST['sms_sender_id'] ?? 'BDTechZen' ) ) );
        $notice = 'SMS Gateway settings saved successfully!';
    }

    // 1-Click Create Editable Elementor Free Flexbox Home Page
    if ( isset( $_POST['bdtz_create_elementor_home'] ) && check_admin_referer( 'bdtz_setup_action', 'bdtz_setup_nonce' ) ) {
        $tpl_file = get_template_directory() . '/elementor/bdtechzen-elementor-free-flexbox.json';
        if ( file_exists( $tpl_file ) ) {
            $raw_json = file_get_contents( $tpl_file );
            $local_assets = trailingslashit( get_template_directory_uri() ) . 'assets/images/';
            // Point all bundled image URLs directly to this cPanel WordPress domain
            $raw_json = preg_replace( '#https?://[^"]+/src/assets/images/#', $local_assets, $raw_json );
            $decoded  = json_decode( $raw_json, true );

            if ( is_array( $decoded ) && isset( $decoded['content'] ) ) {
                $page_id = wp_insert_post( array(
                    'post_title'   => 'BDTechZen Home (Elementor Flexbox)',
                    'post_status'  => 'publish',
                    'post_type'    => 'page',
                    'post_content' => '',
                ) );

                if ( ! is_wp_error( $page_id ) ) {
                    update_post_meta( $page_id, '_elementor_edit_mode', 'builder' );
                    update_post_meta( $page_id, '_elementor_template_type', 'wp-page' );
                    update_post_meta( $page_id, '_elementor_version', '3.25.0' );
                    update_post_meta( $page_id, '_wp_page_template', 'elementor_header_footer' );
                    update_post_meta( $page_id, '_elementor_data', wp_slash( wp_json_encode( $decoded['content'] ) ) );

                    update_option( 'show_on_front', 'page' );
                    update_option( 'page_on_front', $page_id );

                    $notice = 'Elementor Free Flexbox Home Page created and set as Front Page! Go to Pages -> "BDTechZen Home (Elementor Flexbox)" -> Edit with Elementor.';
                }
            }
        }
    }

    $sms_url    = get_option( 'bdtz_sms_api_url', '' );
    $sms_key    = get_option( 'bdtz_sms_api_key', '' );
    $sms_sender = get_option( 'bdtz_sms_sender_id', 'BDTechZen' );
    ?>
    <div class="wrap">
        <h1>BDTechZen WordPress Storefront, SMS &amp; Elementor Setup</h1>
        <?php if ( $notice ) : ?>
            <div class="notice notice-success is-dismissible"><p><strong><?php echo esc_html( $notice ); ?></strong></p></div>
        <?php endif; ?>

        <div class="card" style="max-width:760px;padding:20px;margin-top:16px;">
            <h2>1. Edit with Elementor Free (Classic Flexbox Container)</h2>
            <p>Your storefront is already live automatically! If you want to visually drag-and-drop edit the homepage using the free <strong>Elementor</strong> plugin (Classic Flexbox Container — No Atomic V4):</p>
            <ol>
                <li>Install &amp; activate the free <strong>Elementor</strong> plugin from <em>Plugins &rarr; Add New</em>.</li>
                <li>In <em>Elementor &rarr; Settings &rarr; Features</em>, keep <strong>Flexbox Container</strong> Active and <strong>Editor V4 / Atomic</strong> Inactive.</li>
                <li>Click the button below to automatically create the Elementor Homepage with all local images linked to your domain:</li>
            </ol>
            <form method="post">
                <?php wp_nonce_field( 'bdtz_setup_action', 'bdtz_setup_nonce' ); ?>
                <button type="submit" name="bdtz_create_elementor_home" class="button button-primary button-hero">
                    Create Editable Elementor Free Homepage
                </button>
            </form>
        </div>

        <div class="card" style="max-width:760px;padding:20px;margin-top:20px;">
            <h2>2. Customer Email &amp; Bangladesh Mobile SMS Notifications</h2>
            <p>Customer order emails are sent automatically via WordPress (<code>wp_mail</code>). To also send automatic SMS alerts to your customer's mobile number on every order, enter your Bangladesh SMS Gateway credentials (BulkSMSBD / MimSMS / SSL Wireless / GreenWeb):</p>
            <form method="post">
                <?php wp_nonce_field( 'bdtz_setup_action', 'bdtz_setup_nonce' ); ?>
                <table class="form-table">
                    <tr>
                        <th><label for="sms_api_url">SMS Gateway API URL</label></th>
                        <td><input type="url" id="sms_api_url" name="sms_api_url" value="<?php echo esc_attr( $sms_url ); ?>" class="regular-text" placeholder="https://bulksmsbd.net/api/smsapi" /></td>
                    </tr>
                    <tr>
                        <th><label for="sms_api_key">SMS API Key</label></th>
                        <td><input type="text" id="sms_api_key" name="sms_api_key" value="<?php echo esc_attr( $sms_key ); ?>" class="regular-text" /></td>
                    </tr>
                    <tr>
                        <th><label for="sms_sender_id">Sender ID</label></th>
                        <td><input type="text" id="sms_sender_id" name="sms_sender_id" value="<?php echo esc_attr( $sms_sender ); ?>" class="regular-text" /></td>
                    </tr>
                </table>
                <p class="submit">
                    <button type="submit" name="bdtz_save_sms" class="button button-primary">Save SMS Settings</button>
                </p>
            </form>
        </div>
    </div>
    <?php
}
`;

  /* 3. header.php */
  const headerPhp = `<?php
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}
$bdtz_store_name   = bdtz_setting( 'storeName', 'BDTechZen' );
$bdtz_announcement = bdtz_setting( 'announcementText', 'Cash on Delivery Across All 64 Districts' );
$bdtz_whatsapp     = bdtz_setting( 'whatsappNumber', '+8801623604635' );
$bdtz_phone        = bdtz_setting( 'supportPhone', '+880 1623-604635' );
$bdtz_clean_wa     = preg_replace( '/[^0-9]/', '', $bdtz_whatsapp );
?><!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo( 'charset' ); ?>" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <?php wp_head(); ?>
</head>
<body <?php body_class( 'bdtz-body' ); ?>>
<?php wp_body_open(); ?>
<div class="bdtz-wp-root">
    <!-- Top Utility Bar -->
    <div class="bdtz-utility-bar">
        <div class="bdtz-container bdtz-utility-inner">
            <span><?php echo esc_html( $bdtz_announcement ); ?></span>
            <span>Cash on Delivery &middot; WhatsApp: <?php echo esc_html( $bdtz_whatsapp ); ?></span>
        </div>
    </div>

    <!-- Sticky 3-Zone Flexbox Header -->
    <header class="bdtz-header">
        <div class="bdtz-container bdtz-header-inner">
            <a href="<?php echo esc_url( home_url( '/' ) ); ?>" class="bdtz-brand">
                <?php if ( has_custom_logo() ) : ?>
                    <?php the_custom_logo(); ?>
                <?php else : ?>
                    <span class="bdtz-brand-mark">BZ</span>
                    <span><?php echo esc_html( $bdtz_store_name ); ?></span>
                <?php endif; ?>
            </a>

            <nav class="bdtz-nav" aria-label="Primary Navigation">
                <?php
                if ( has_nav_menu( 'primary' ) ) {
                    wp_nav_menu( array(
                        'theme_location' => 'primary',
                        'container'      => false,
                    ) );
                } else {
                    ?>
                    <a href="<?php echo esc_url( home_url( '/#collection' ) ); ?>">Shop All</a>
                    <a href="<?php echo esc_url( home_url( '/#collection' ) ); ?>" onclick="if(window.bdtzFilterBySlug){bdtzFilterBySlug('formal-shoes');}">Oxfords &amp; Loafers</a>
                    <a href="<?php echo esc_url( home_url( '/#collection' ) ); ?>" onclick="if(window.bdtzFilterBySlug){bdtzFilterBySlug('sneakers');}">Sneakers</a>
                    <a href="<?php echo esc_url( home_url( '/#collection' ) ); ?>" onclick="if(window.bdtzFilterBySlug){bdtzFilterBySlug('womens-shoes');}">Women</a>
                    <a href="<?php echo esc_url( home_url( '/#craftsmanship' ) ); ?>">Craftsmanship</a>
                    <a href="<?php echo esc_url( home_url( '/#reviews' ) ); ?>">Reviews</a>
                    <?php
                }
                ?>
            </nav>

            <a
                href="<?php echo esc_url( 'https://wa.me/' . $bdtz_clean_wa . '?text=' . rawurlencode( 'Hello ' . $bdtz_store_name . ', I would like to place a Cash on Delivery shoe order.' ) ); ?>"
                target="_blank"
                rel="noopener noreferrer"
                class="bdtz-btn bdtz-btn-dark"
            >
                Order COD &middot; <?php echo esc_html( $bdtz_phone ); ?>
            </a>
        </div>
    </header>
`;

  /* 4. front-page.php (Full BDTechZen Storefront + Elementor Page Override Support) */
  const frontPagePhp = `<?php
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

get_header();

// If a Static Front Page is assigned AND edited with Elementor Builder, render Elementor directly:
$bdtz_front_id = get_queried_object_id();
if ( $bdtz_front_id && 'page' === get_option( 'show_on_front' ) && 'builder' === get_post_meta( $bdtz_front_id, '_elementor_edit_mode', true ) ) :
    while ( have_posts() ) :
        the_post();
        the_content();
    endwhile;
    get_footer();
    return;
endif;

$catalog          = bdtz_get_catalog();
$store_name       = bdtz_setting( 'storeName', 'BDTechZen' );
$hero_title       = bdtz_setting( 'heroTitle', 'Shoes built to walk, cut from full-grain calfskin.' );
$hero_subtitle    = bdtz_setting( 'heroSubtitle', $catalog['heroSubtitle'] );
$hero_cta         = bdtz_setting( 'heroCtaText', 'Shop the Collection' );
$whatsapp_raw     = bdtz_setting( 'whatsappNumber', '+8801623604635' );
$support_phone    = bdtz_setting( 'supportPhone', '+880 1623-604635' );
$clean_wa         = preg_replace( '/[^0-9]/', '', $whatsapp_raw );
$custom_hero_img  = get_theme_mod( 'bdtz_custom_hero_image', '' );

$hero_img_1       = ! empty( $custom_hero_img ) ? esc_url( $custom_hero_img ) : bdtz_theme_img_url( $catalog['heroImageFile'] );
$hero_img_2       = bdtz_theme_img_url( $catalog['formalImageFile'] );
$hero_img_3       = bdtz_theme_img_url( $catalog['runnerImageFile'] );
$craft_img        = bdtz_theme_img_url( $catalog['craftImageFile'] );

$products         = isset( $catalog['products'] ) ? $catalog['products'] : array();
$categories       = isset( $catalog['categories'] ) ? array_slice( $catalog['categories'], 0, 4 ) : array();
?>

<!-- SECTION 1: EDITORIAL CAMPAIGN HERO (2 BANGLADESHI MODELS) + 4-COLUMN SERVICE LEDGER -->
<section class="bdtz-hero">
    <div class="bdtz-container bdtz-hero-split">
        <div class="bdtz-hero-left">
            <div class="bdtz-flex-col" style="gap:20px;">
                <span class="bdtz-hero-kicker" id="bdtzHeroKicker">Dhaka Cordwainer Studio &middot; Direct to Consumer</span>
                <h1 class="bdtz-hero-title" id="bdtzHeroHeadline"><?php echo esc_html( $hero_title ); ?></h1>
                <p class="bdtz-hero-lead" id="bdtzHeroBody"><?php echo esc_html( $hero_subtitle ); ?></p>

                <div class="bdtz-hero-actions">
                    <a href="#collection" class="bdtz-btn bdtz-btn-light" id="bdtzHeroCta">
                        <?php echo esc_html( $hero_cta ); ?> &rarr;
                    </a>
                    <a
                        href="<?php echo esc_url( 'https://wa.me/' . $clean_wa . '?text=' . rawurlencode( 'Hello ' . $store_name . ', I need help choosing my EU shoe size.' ) ); ?>"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="bdtz-btn bdtz-btn-outline-dark"
                    >
                        Sizing Desk &middot; <?php echo esc_html( $support_phone ); ?>
                    </a>
                </div>
            </div>

            <div class="bdtz-chapter-tabs" role="tablist" aria-label="Lookbook Chapters">
                <button type="button" class="bdtz-chapter-btn active" onclick="bdtzSetChapter(0, this)">
                    <small>01</small>
                    <span>Everyday Calfskin &amp; Court</span>
                </button>
                <button type="button" class="bdtz-chapter-btn" onclick="bdtzSetChapter(1, this)">
                    <small>02</small>
                    <span>Blake-Stitched Dress</span>
                </button>
                <button type="button" class="bdtz-chapter-btn" onclick="bdtzSetChapter(2, this)">
                    <small>03</small>
                    <span>Road &amp; Lake Runners</span>
                </button>
            </div>
        </div>

        <div class="bdtz-hero-right">
            <div class="bdtz-hero-media-frame">
                <img
                    id="bdtzHeroImage"
                    src="<?php echo esc_url( $hero_img_1 ); ?>"
                    alt="Bangladeshi models wearing handcrafted cap-toe calfskin Oxfords and cognac horsebit loafers"
                />
            </div>
            <div class="bdtz-hero-caption">
                <span id="bdtzHeroCaptionTitle">Mayfair Cap-Toe Calfskin Oxford &amp; Cognac Horsebit Loafer</span>
                <span id="bdtzHeroCaptionMeta">Worn in Dhaka &middot; Full-grain leather &middot; EU 36&ndash;45 &middot; From &#2547;4,150</span>
            </div>
        </div>
    </div>

    <div class="bdtz-ledger-strip">
        <div class="bdtz-container bdtz-ledger-flex">
            <div class="bdtz-ledger-item">
                <strong>Cash on Delivery Nationwide</strong>
                <span>Inspect your pair at the doorstep across all 64 districts</span>
            </div>
            <div class="bdtz-ledger-item">
                <strong>24&ndash;48h Dhaka Dispatch</strong>
                <span>2&ndash;4 business days outside Dhaka via Steadfast &amp; Pathao</span>
            </div>
            <div class="bdtz-ledger-item">
                <strong>Instant SMS &amp; Email Updates</strong>
                <span>Automatic order receipt &amp; courier waybill alerts on your phone</span>
            </div>
            <div class="bdtz-ledger-item">
                <strong>7-Day Doorstep Size Swap</strong>
                <span>Between two EU sizes? We exchange unworn pairs effortlessly</span>
            </div>
        </div>
    </div>
</section>

<script>
window.BDTZ_HERO_CHAPTERS = [
    {
        kicker: <?php echo wp_json_encode( 'Dhaka Cordwainer Studio · Direct to Consumer' ); ?>,
        headline: <?php echo wp_json_encode( $hero_title ); ?>,
        body: <?php echo wp_json_encode( $hero_subtitle ); ?>,
        img: <?php echo wp_json_encode( $hero_img_1 ); ?>,
        capTitle: <?php echo wp_json_encode( 'Mayfair Cap-Toe Calfskin Oxford & Cognac Horsebit Loafer' ); ?>,
        capMeta: <?php echo wp_json_encode( 'Worn in Dhaka · Full-grain leather · EU 36–45 · From ৳4,150' ); ?>
    },
    {
        kicker: <?php echo wp_json_encode( 'Bench-Finished Formal · Zero Break-In Week' ); ?>,
        headline: <?php echo wp_json_encode( 'Hand-burnished Oxfords that flex from the first morning.' ); ?>,
        body: <?php echo wp_json_encode( 'Closed-channel Blake stitching joins supple calfskin uppers directly to the outsole without rigid welting bulk—lined in breathable leather suited to warm Bangladesh boardrooms.' ); ?>,
        img: <?php echo wp_json_encode( $hero_img_2 ); ?>,
        capTitle: <?php echo wp_json_encode( 'Obsidian Calfskin Oxford & Black Napa Heeled Loafer' ); ?>,
        capMeta: <?php echo wp_json_encode( 'Hand-finished formal leather · EU 36–45 · ৳4,150 – ৳6,690' ); ?>
    },
    {
        kicker: <?php echo wp_json_encode( 'Featherweight Cushioning · Humid-Climate Knit' ); ?>,
        headline: <?php echo wp_json_encode( 'Built for 6 AM laps around Gulshan Lake and Hatirjheel.' ); ?>,
        body: <?php echo wp_json_encode( 'Open-weave engineered mesh vents heat immediately, while dual-density nitrogen midsoles absorb harsh concrete impact mile after mile.' ); ?>,
        img: <?php echo wp_json_encode( $hero_img_3 ); ?>,
        capTitle: <?php echo wp_json_encode( 'Velox Marathon Elite 03 Racer' ); ?>,
        capMeta: <?php echo wp_json_encode( 'Breathable knit · High-traction rubber · ৳4,990' ); ?>
    }
];
</script>

<!-- SECTION 2: VARIABLE FOOTWEAR COLLECTION (FLEXBOX CARDS + COD MODAL TRIGGER) -->
<section id="collection" class="bdtz-section">
    <div class="bdtz-container">
        <div class="bdtz-section-head">
            <div>
                <p style="font-size:12px;color:#71717a;margin-bottom:4px;">Current Release &middot; Priced in BDT (&#2547;) &middot; Select Size &amp; Order COD</p>
                <h2 style="font-size:30px;font-weight:600;color:#111113;">Pairs Made for Daily Rotation</h2>
            </div>

            <div class="bdtz-filter-bar" role="tablist" aria-label="Filter Footwear">
                <button type="button" class="bdtz-filter-btn active" onclick="bdtzFilter('all', this)">All Pairs</button>
                <button type="button" class="bdtz-filter-btn" data-slug="formal-shoes" onclick="bdtzFilter('formal-shoes', this)">Loafers &amp; Oxfords</button>
                <button type="button" class="bdtz-filter-btn" data-slug="sneakers" onclick="bdtzFilter('sneakers', this)">Court &amp; Street</button>
                <button type="button" class="bdtz-filter-btn" data-slug="sports-running" onclick="bdtzFilter('sports-running', this)">Running</button>
                <button type="button" class="bdtz-filter-btn" data-slug="womens-shoes" onclick="bdtzFilter('womens-shoes', this)">Women</button>
            </div>
        </div>

        <div class="bdtz-product-flex-grid" id="bdtzProductGrid">
            <?php foreach ( $products as $idx => $p ) :
                $p_img        = bdtz_theme_img_url( $p['imageFile'] );
                $active_price = ! empty( $p['salePriceBDT'] ) ? intval( $p['salePriceBDT'] ) : intval( $p['regularPriceBDT'] );
                $reg_price    = intval( $p['regularPriceBDT'] );
                $sizes        = array();
                $colors       = array();
                if ( ! empty( $p['variants'] ) ) {
                    foreach ( $p['variants'] as $v ) {
                        if ( ! in_array( $v['size'], $sizes, true ) ) {
                            $sizes[] = $v['size'];
                        }
                        $colors[ $v['color'] ] = ! empty( $v['colorHex'] ) ? $v['colorHex'] : '#18181b';
                    }
                }
                ?>
                <article
                    class="bdtz-product-card"
                    data-category="<?php echo esc_attr( $p['category'] ); ?>"
                    data-gender="<?php echo esc_attr( $p['gender'] ); ?>"
                >
                    <div class="bdtz-product-img-wrap">
                        <img src="<?php echo esc_url( $p_img ); ?>" alt="<?php echo esc_attr( $p['name'] ); ?>" loading="lazy" />
                    </div>
                    <div class="bdtz-product-body">
                        <div class="bdtz-product-meta">
                            <span><?php echo esc_html( $p['brand'] ); ?></span>
                            <span>EU <?php echo esc_html( implode( ', ', $sizes ) ); ?></span>
                        </div>
                        <h3 class="bdtz-product-title"><?php echo esc_html( $p['name'] ); ?></h3>
                        <p style="font-size:13px;color:#52525b;line-height:1.55;">
                            <?php echo esc_html( wp_trim_words( $p['description'], 18, '...' ) ); ?>
                        </p>
                        <?php if ( ! empty( $colors ) ) : ?>
                            <div class="bdtz-swatches-row" title="Available Leather &amp; Upper Finishes">
                                <?php foreach ( $colors as $c_name => $c_hex ) : ?>
                                    <span class="bdtz-color-dot" style="background-color:<?php echo esc_attr( $c_hex ); ?>;" title="<?php echo esc_attr( $c_name ); ?>"></span>
                                <?php endforeach; ?>
                                <span style="font-size:11px;color:#71717a;"><?php echo count( $colors ); ?> <?php echo 1 === count( $colors ) ? 'finish' : 'finishes'; ?></span>
                            </div>
                        <?php endif; ?>

                        <div class="bdtz-product-footer">
                            <div class="bdtz-price">
                                &#2547;<?php echo esc_html( number_format_i18n( $active_price ) ); ?>
                                <?php if ( $active_price < $reg_price ) : ?>
                                    <del>&#2547;<?php echo esc_html( number_format_i18n( $reg_price ) ); ?></del>
                                <?php endif; ?>
                            </div>
                            <button
                                type="button"
                                class="bdtz-btn bdtz-btn-dark"
                                style="padding:9px 15px;font-size:12px;"
                                onclick="bdtzOpenOrderModal(<?php echo intval( $idx ); ?>)"
                            >
                                Order COD &rarr;
                            </button>
                        </div>
                    </div>
                </article>
            <?php endforeach; ?>
        </div>
    </div>
</section>

<!-- SECTION 3: CRAFTSMANSHIP & DHAKA FORMAL LOOKBOOK -->
<section id="craftsmanship" class="bdtz-section bdtz-craft-band">
    <div class="bdtz-container">
        <div class="bdtz-craft-split">
            <div class="bdtz-craft-media">
                <img src="<?php echo esc_url( $hero_img_2 ); ?>" alt="Bangladeshi formal footwear lookbook featuring Blake-stitched Oxfords and Napa loafers" loading="lazy" />
                <img src="<?php echo esc_url( $craft_img ); ?>" alt="Full-grain calfskin hides and wooden shoe last in Dhaka atelier" loading="lazy" />
            </div>

            <div class="bdtz-craft-copy">
                <span style="font-size:12px;color:#71717a;">Materials &amp; Lasting &middot; Dhaka Atelier</span>
                <h2 style="font-size:30px;font-weight:600;line-height:1.25;">
                    Why a well-lasted pair feels better in year three than week one.
                </h2>
                <p style="font-size:15px;color:#52525b;">
                    Most mass-market dress shoes stiffen up with coated split leather and paperboard insoles. We cut uppers from supple full-grain hides and shape them over anatomical lasts proportioned for South Asian insteps.
                </p>

                <div>
                    <div class="bdtz-craft-point">
                        <strong style="font-family:monospace;color:#71717a;">01.</strong>
                        <div>
                            <h4 style="font-size:15px;font-weight:600;">Full-grain calfskin that develops patina, never peels</h4>
                            <p style="font-size:13px;color:#52525b;margin-top:4px;">Natural open-pore leather breathes through eight-hour workdays and softens around your forefoot.</p>
                        </div>
                    </div>
                    <div class="bdtz-craft-point">
                        <strong style="font-family:monospace;color:#71717a;">02.</strong>
                        <div>
                            <h4 style="font-size:15px;font-weight:600;">Wider forefoot room with a locked-in heel cup</h4>
                            <p style="font-size:13px;color:#52525b;margin-top:4px;">Our EU 36&ndash;45 lasts eliminate pinky-toe pinch while preventing heel slip when walking briskly.</p>
                        </div>
                    </div>
                    <div class="bdtz-craft-point">
                        <strong style="font-family:monospace;color:#71717a;">03.</strong>
                        <div>
                            <h4 style="font-size:15px;font-weight:600;">High-grip rubber channels for wet marble &amp; monsoon streets</h4>
                            <p style="font-size:13px;color:#52525b;margin-top:4px;">Discreet anti-slip traction pods tested for wet Dhaka pavements and corporate lobby tiles.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <?php if ( ! empty( $categories ) ) : ?>
            <div class="bdtz-dept-flex">
                <?php foreach ( $categories as $cat ) : ?>
                    <a href="#collection" class="bdtz-dept-card" onclick="if(window.bdtzFilterBySlug){bdtzFilterBySlug('<?php echo esc_js( $cat['slug'] ); ?>');}">
                        <img src="<?php echo esc_url( bdtz_theme_img_url( $cat['imageFile'] ) ); ?>" alt="<?php echo esc_attr( $cat['name'] ); ?>" loading="lazy" />
                        <div class="bdtz-dept-overlay"><?php echo esc_html( $cat['name'] ); ?> &rarr;</div>
                    </a>
                <?php endforeach; ?>
            </div>
        <?php endif; ?>
    </div>
</section>

<!-- SECTION 4: CLIENT REVIEWS & WHATSAPP SIZING DESK -->
<section id="reviews" class="bdtz-section">
    <div class="bdtz-container">
        <div class="bdtz-section-head">
            <div>
                <p style="font-size:12px;color:#71717a;margin-bottom:4px;">Client Ledger &middot; Bangladesh</p>
                <h2 style="font-size:30px;font-weight:600;">Worn Across Dhaka, Chattogram &amp; Sylhet</h2>
            </div>
            <span style="font-size:13px;color:#52525b;">4.9 / 5.0 across verified orders</span>
        </div>

        <div class="bdtz-testimonials-flex">
            <div class="bdtz-quote-card">
                <p style="font-size:14px;color:#3f3f46;">
                    &ldquo;Before switching to the Mayfair Cap-Toe Oxford, stiff formal shoes blistered my heel during site visits. Wore my EU 42 pair ten hours straight on day one without a single pinch.&rdquo;
                </p>
                <div style="border-top:1px solid #f1f0ec;padding-top:12px;font-size:12px;">
                    <strong style="display:block;color:#111113;">Nafis Rahman</strong>
                    <span style="color:#71717a;">Principal Architect &middot; Gulshan-2, Dhaka</span>
                </div>
            </div>

            <div class="bdtz-quote-card">
                <p style="font-size:14px;color:#3f3f46;">
                    &ldquo;Received an instant SMS and email invoice the moment I placed my Cash on Delivery order. Steadfast delivered to Agrabad in 48 hours, and the cognac penny loafer leather looks twice its price.&rdquo;
                </p>
                <div style="border-top:1px solid #f1f0ec;padding-top:12px;font-size:12px;">
                    <strong style="display:block;color:#111113;">Tanvir Hasan</strong>
                    <span style="color:#71717a;">Corporate Banking VP &middot; Agrabad, Chattogram</span>
                </div>
            </div>

            <div class="bdtz-quote-card">
                <p style="font-size:14px;color:#3f3f46;">
                    &ldquo;Unsure between EU 38 and 39 in the Celeste Napa Mule, I messaged their WhatsApp desk with my foot length. Their recommendation fit like a glove right out of the box.&rdquo;
                </p>
                <div style="border-top:1px solid #f1f0ec;padding-top:12px;font-size:12px;">
                    <strong style="display:block;color:#111113;">Nusrat Jahan</strong>
                    <span style="color:#71717a;">University Lecturer &middot; Dhanmondi, Dhaka</span>
                </div>
            </div>
        </div>

        <div class="bdtz-cta-banner">
            <div style="max-width:640px;display:flex;flex-direction:column;gap:8px;">
                <span style="font-size:12px;color:#a8a29e;">Dhaka Sizing Desk &middot; 10:00 AM &ndash; 10:00 PM BST</span>
                <h3 style="font-size:24px;font-weight:600;color:#ffffff;">Between two sizes, or prefer ordering over WhatsApp?</h3>
                <p style="font-size:14px;color:#d6d3d1;">
                    Send your heel-to-toe measurement in centimeters to <strong><?php echo esc_html( $whatsapp_raw ); ?></strong> for an exact last recommendation&mdash;or use code <strong>ZEN10</strong> for 10% off orders above &#2547;2,000.
                </p>
            </div>
            <div class="bdtz-flex-row" style="gap:12px;">
                <a
                    href="<?php echo esc_url( 'https://wa.me/' . $clean_wa ); ?>"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="bdtz-btn bdtz-btn-whatsapp"
                >
                    WhatsApp &middot; <?php echo esc_html( $whatsapp_raw ); ?>
                </a>
                <a href="#collection" class="bdtz-btn bdtz-btn-light">Browse All Pairs &rarr;</a>
            </div>
        </div>
    </div>
</section>

<?php
get_footer();
`;

  /* 5. footer.php (Flexbox Footer + Interactive Variable Product COD Checkout Modal) */
  const footerPhp = `<?php
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}
$catalog        = bdtz_get_catalog();
$store_name     = bdtz_setting( 'storeName', 'BDTechZen' );
$tagline        = $catalog['storeTagline'];
$support_phone  = bdtz_setting( 'supportPhone', '+880 1623-604635' );
$whatsapp_raw   = bdtz_setting( 'whatsappNumber', '+8801623604635' );
$support_email  = bdtz_setting( 'supportEmail', 'support@bdtechzen.com' );
$clean_wa       = preg_replace( '/[^0-9]/', '', $whatsapp_raw );
$products       = isset( $catalog['products'] ) ? $catalog['products'] : array();
?>
    <!-- Flexbox Storefront Footer -->
    <footer class="bdtz-footer">
        <div class="bdtz-container">
            <div class="bdtz-footer-flex">
                <div class="bdtz-footer-col" style="flex:2 1 280px;">
                    <h5 style="font-size:16px;"><?php echo esc_html( $store_name ); ?></h5>
                    <p style="max-width:340px;line-height:1.6;"><?php echo esc_html( $tagline ); ?></p>
                    <span>Phone: <?php echo esc_html( $support_phone ); ?></span>
                    <span>WhatsApp COD: <?php echo esc_html( $whatsapp_raw ); ?></span>
                    <span>Email: <?php echo esc_html( $support_email ); ?></span>
                </div>

                <div class="bdtz-footer-col">
                    <h5>Footwear</h5>
                    <a href="<?php echo esc_url( home_url( '/#collection' ) ); ?>">Men's Collection</a>
                    <a href="<?php echo esc_url( home_url( '/#collection' ) ); ?>">Women's Collection</a>
                    <a href="<?php echo esc_url( home_url( '/#collection' ) ); ?>">Oxfords &amp; Loafers</a>
                    <a href="<?php echo esc_url( home_url( '/#collection' ) ); ?>">Court &amp; Street Sneakers</a>
                    <a href="<?php echo esc_url( home_url( '/#collection' ) ); ?>">Road &amp; Lake Runners</a>
                </div>

                <div class="bdtz-footer-col">
                    <h5>Client Service</h5>
                    <a href="<?php echo esc_url( home_url( '/#craftsmanship' ) ); ?>">Our Dhaka Workshop</a>
                    <a href="<?php echo esc_url( home_url( '/#reviews' ) ); ?>">Verified Reviews</a>
                    <a href="<?php echo esc_url( 'https://wa.me/' . $clean_wa ); ?>" target="_blank" rel="noopener noreferrer">7-Day Doorstep Size Swap</a>
                    <a href="<?php echo esc_url( 'https://wa.me/' . $clean_wa ); ?>" target="_blank" rel="noopener noreferrer">Cash on Delivery Policy</a>
                </div>
            </div>

            <div class="bdtz-footer-bottom">
                <span>Bangladesh Payment Methods: Cash on Delivery &middot; bKash &middot; Nagad &middot; Rocket &middot; SSLCOMMERZ</span>
                <span>&copy; <?php echo esc_html( gmdate( 'Y' ) ); ?> <?php echo esc_html( $store_name ); ?>. Dhaka, Bangladesh.</span>
            </div>
        </div>
    </footer>

    <!-- Interactive Cash on Delivery (COD) Variable Shoe Order Modal -->
    <div class="bdtz-modal-backdrop" id="bdtzOrderModal" aria-hidden="true">
        <div class="bdtz-modal-card" role="dialog" aria-modal="true" aria-labelledby="bdtzModalTitle">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;">
                <div>
                    <span style="font-size:11px;font-weight:600;color:#71717a;text-transform:uppercase;letter-spacing:0.06em;">Cash on Delivery &middot; Instant Email &amp; SMS Receipt</span>
                    <h3 id="bdtzModalTitle" style="font-size:19px;font-weight:600;margin-top:3px;">Select Size &amp; Delivery Address</h3>
                </div>
                <button type="button" onclick="bdtzCloseOrderModal()" style="border:none;background:#f4f4f5;width:32px;height:32px;border-radius:8px;cursor:pointer;font-size:16px;font-weight:700;">&times;</button>
            </div>

            <form id="bdtzCodForm" class="bdtz-form-grid" onsubmit="return bdtzSubmitCodOrder(event);">
                <div class="bdtz-field">
                    <label>Select EU Size</label>
                    <div id="bdtzModalSizes" class="bdtz-size-pills"></div>
                </div>

                <div class="bdtz-form-row">
                    <div class="bdtz-field">
                        <label for="bdtzModalColor">Leather / Color Finish</label>
                        <select id="bdtzModalColor" name="color"></select>
                    </div>
                    <div class="bdtz-field" style="max-width:120px;">
                        <label for="bdtzModalQty">Quantity</label>
                        <input type="number" id="bdtzModalQty" name="qty" min="1" max="10" value="1" onchange="bdtzRecalculateModal()" />
                    </div>
                </div>

                <div class="bdtz-form-row">
                    <div class="bdtz-field">
                        <label for="bdtzCustomerName">Your Full Name *</label>
                        <input type="text" id="bdtzCustomerName" required placeholder="e.g. Tanvir Ahmed" />
                    </div>
                    <div class="bdtz-field">
                        <label for="bdtzCustomerPhone">Mobile Number (for SMS) *</label>
                        <input type="tel" id="bdtzCustomerPhone" required placeholder="01XXXXXXXXX" />
                    </div>
                </div>

                <div class="bdtz-form-row">
                    <div class="bdtz-field">
                        <label for="bdtzCustomerEmail">Email Address (for Invoice Receipt)</label>
                        <input type="email" id="bdtzCustomerEmail" placeholder="you@example.com" />
                    </div>
                    <div class="bdtz-field">
                        <label for="bdtzDeliveryZone">Delivery Area</label>
                        <select id="bdtzDeliveryZone" onchange="bdtzRecalculateModal()">
                            <option value="Inside Dhaka">Inside Dhaka (&#2547;<?php echo intval( $catalog['shippingInsideDhaka'] ); ?>)</option>
                            <option value="Outside Dhaka">Outside Dhaka (&#2547;<?php echo intval( $catalog['shippingOutsideDhaka'] ); ?>)</option>
                        </select>
                    </div>
                </div>

                <div class="bdtz-field">
                    <label for="bdtzAddress">Full Street Address (House, Road, Area, District) *</label>
                    <textarea id="bdtzAddress" rows="2" required placeholder="House 14, Road 7, Dhanmondi, Dhaka"></textarea>
                </div>

                <div class="bdtz-field">
                    <label for="bdtzCoupon">Promo Code (Optional — Try ZEN10)</label>
                    <input type="text" id="bdtzCoupon" placeholder="ZEN10" oninput="bdtzRecalculateModal()" />
                </div>

                <div class="bdtz-order-summary-box">
                    <div class="bdtz-summary-line">
                        <span>Subtotal</span>
                        <strong id="bdtzSumSubtotal">&#2547;0</strong>
                    </div>
                    <div class="bdtz-summary-line">
                        <span>Delivery Charge (Free over &#2547;<?php echo esc_html( number_format_i18n( intval( $catalog['freeShippingThreshold'] ) ) ); ?>)</span>
                        <span id="bdtzSumShipping">&#2547;0</span>
                    </div>
                    <div class="bdtz-summary-line" style="border-top:1px solid #e5e2dc;padding-top:6px;font-size:15px;">
                        <strong>Payable Cash on Delivery</strong>
                        <strong id="bdtzSumTotal">&#2547;0</strong>
                    </div>
                </div>

                <div id="bdtzOrderFeedback" style="display:none;padding:12px;border-radius:8px;font-size:13px;"></div>

                <button type="submit" id="bdtzSubmitBtn" class="bdtz-btn bdtz-btn-dark" style="width:100%;padding:14px;">
                    Confirm Cash on Delivery Order &rarr;
                </button>
            </form>
        </div>
    </div>
</div><!-- /.bdtz-wp-root -->

<script>
window.BDTZ_PRODUCTS = <?php echo wp_json_encode( $products ); ?>;
window.BDTZ_CONFIG = {
    ajaxUrl: <?php echo wp_json_encode( admin_url( 'admin-ajax.php' ) ); ?>,
    nonce: <?php echo wp_json_encode( wp_create_nonce( 'bdtz_cod_nonce' ) ); ?>,
    insideDhaka: <?php echo intval( $catalog['shippingInsideDhaka'] ); ?>,
    outsideDhaka: <?php echo intval( $catalog['shippingOutsideDhaka'] ); ?>,
    freeThreshold: <?php echo intval( $catalog['freeShippingThreshold'] ); ?>
};

var bdtzCurrentProduct = null;
var bdtzSelectedSize = '42';

function bdtzSetChapter(idx, btn) {
    if (!window.BDTZ_HERO_CHAPTERS || !window.BDTZ_HERO_CHAPTERS[idx]) return;
    var ch = window.BDTZ_HERO_CHAPTERS[idx];
    document.getElementById('bdtzHeroKicker').textContent = ch.kicker;
    document.getElementById('bdtzHeroHeadline').textContent = ch.headline;
    document.getElementById('bdtzHeroBody').textContent = ch.body;
    document.getElementById('bdtzHeroImage').src = ch.img;
    document.getElementById('bdtzHeroCaptionTitle').textContent = ch.capTitle;
    document.getElementById('bdtzHeroCaptionMeta').textContent = ch.capMeta;
    var tabs = document.querySelectorAll('.bdtz-chapter-btn');
    for (var i = 0; i < tabs.length; i++) tabs[i].classList.remove('active');
    if (btn) btn.classList.add('active');
}

function bdtzFilter(cat, btn) {
    var buttons = document.querySelectorAll('.bdtz-filter-btn');
    for (var i = 0; i < buttons.length; i++) buttons[i].classList.remove('active');
    if (btn) btn.classList.add('active');
    var cards = document.querySelectorAll('#bdtzProductGrid .bdtz-product-card');
    for (var j = 0; j < cards.length; j++) {
        var c = cards[j];
        var itemCat = c.getAttribute('data-category') || '';
        var itemGender = c.getAttribute('data-gender') || '';
        if (cat === 'all') {
            c.style.display = 'flex';
        } else if (cat === 'formal-shoes' || cat === 'mens-shoes') {
            c.style.display = (itemCat === 'formal-shoes' || itemCat === 'mens-shoes') ? 'flex' : 'none';
        } else if (cat === 'sneakers' || cat === 'casual-shoes') {
            c.style.display = (itemCat === 'sneakers' || itemCat === 'casual-shoes') ? 'flex' : 'none';
        } else if (cat === 'womens-shoes') {
            c.style.display = (itemCat === 'womens-shoes' || itemGender === 'women') ? 'flex' : 'none';
        } else {
            c.style.display = (itemCat === cat) ? 'flex' : 'none';
        }
    }
}

function bdtzFilterBySlug(slug) {
    var targetBtn = document.querySelector('.bdtz-filter-btn[data-slug="' + slug + '"]');
    bdtzFilter(slug, targetBtn);
}

function bdtzOpenOrderModal(index) {
    var prod = window.BDTZ_PRODUCTS && window.BDTZ_PRODUCTS[index];
    if (!prod) return;
    bdtzCurrentProduct = prod;
    document.getElementById('bdtzModalTitle').textContent = prod.name;
    document.getElementById('bdtzOrderFeedback').style.display = 'none';
    document.getElementById('bdtzSubmitBtn').disabled = false;
    document.getElementById('bdtzSubmitBtn').textContent = 'Confirm Cash on Delivery Order →';

    var sizes = [];
    var colors = [];
    for (var i = 0; i < prod.variants.length; i++) {
        var v = prod.variants[i];
        if (sizes.indexOf(v.size) === -1) sizes.push(v.size);
        if (colors.indexOf(v.color) === -1) colors.push(v.color);
    }
    if (sizes.length === 0) sizes = ['40', '41', '42', '43', '44'];
    if (colors.length === 0) colors = ['Signature Calfskin'];

    bdtzSelectedSize = sizes[0];
    var sizesWrap = document.getElementById('bdtzModalSizes');
    sizesWrap.innerHTML = '';
    sizes.forEach(function(sz) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'bdtz-size-pill' + (sz === bdtzSelectedSize ? ' active' : '');
        b.textContent = 'EU ' + sz;
        b.onclick = function() {
            bdtzSelectedSize = sz;
            var all = sizesWrap.querySelectorAll('.bdtz-size-pill');
            for (var k = 0; k < all.length; k++) all[k].classList.remove('active');
            b.classList.add('active');
        };
        sizesWrap.appendChild(b);
    });

    var colorSel = document.getElementById('bdtzModalColor');
    colorSel.innerHTML = '';
    colors.forEach(function(cl) {
        var opt = document.createElement('option');
        opt.value = cl;
        opt.textContent = cl;
        colorSel.appendChild(opt);
    });

    bdtzRecalculateModal();
    document.getElementById('bdtzOrderModal').classList.add('open');
}

function bdtzCloseOrderModal() {
    document.getElementById('bdtzOrderModal').classList.remove('open');
}

function bdtzRecalculateModal() {
    if (!bdtzCurrentProduct) return;
    var unit = bdtzCurrentProduct.salePriceBDT || bdtzCurrentProduct.regularPriceBDT;
    var qty = Math.max(1, parseInt(document.getElementById('bdtzModalQty').value || '1', 10));
    var subtotal = unit * qty;
    var code = (document.getElementById('bdtzCoupon').value || '').trim().toUpperCase();
    var discount = 0;
    if (code === 'ZEN10' && subtotal >= 2000) discount = Math.round(subtotal * 0.10);
    if (code === 'EID15' && subtotal >= 3500) discount = Math.round(subtotal * 0.15);

    var zone = document.getElementById('bdtzDeliveryZone').value;
    var ship = (subtotal - discount >= window.BDTZ_CONFIG.freeThreshold)
        ? 0
        : (zone === 'Outside Dhaka' ? window.BDTZ_CONFIG.outsideDhaka : window.BDTZ_CONFIG.insideDhaka);
    var total = Math.max(0, subtotal - discount + ship);

    document.getElementById('bdtzSumSubtotal').textContent = '৳' + (subtotal - discount).toLocaleString();
    document.getElementById('bdtzSumShipping').textContent = ship === 0 ? 'FREE' : ('৳' + ship);
    document.getElementById('bdtzSumTotal').textContent = '৳' + total.toLocaleString();
}

function bdtzSubmitCodOrder(e) {
    e.preventDefault();
    if (!bdtzCurrentProduct) return false;
    var btn = document.getElementById('bdtzSubmitBtn');
    var fb = document.getElementById('bdtzOrderFeedback');
    btn.disabled = true;
    btn.textContent = 'Placing Order...';

    var unit = bdtzCurrentProduct.salePriceBDT || bdtzCurrentProduct.regularPriceBDT;
    var fd = new FormData();
    fd.append('action', 'bdtz_place_cod_order');
    fd.append('nonce', window.BDTZ_CONFIG.nonce);
    fd.append('product_name', bdtzCurrentProduct.name);
    fd.append('sku', bdtzCurrentProduct.sku);
    fd.append('unit_price', String(unit));
    fd.append('size', bdtzSelectedSize);
    fd.append('color', document.getElementById('bdtzModalColor').value);
    fd.append('qty', document.getElementById('bdtzModalQty').value);
    fd.append('customer_name', document.getElementById('bdtzCustomerName').value);
    fd.append('customer_phone', document.getElementById('bdtzCustomerPhone').value);
    fd.append('customer_email', document.getElementById('bdtzCustomerEmail').value);
    fd.append('zone', document.getElementById('bdtzDeliveryZone').value);
    fd.append('address', document.getElementById('bdtzAddress').value);
    fd.append('coupon', document.getElementById('bdtzCoupon').value);

    fetch(window.BDTZ_CONFIG.ajaxUrl, { method: 'POST', body: fd })
        .then(function(r) { return r.json(); })
        .then(function(res) {
            if (res && res.success) {
                fb.style.display = 'block';
                fb.style.background = '#ecfdf5';
                fb.style.border = '1px solid #10b981';
                fb.style.color = '#065f46';
                fb.innerHTML = '<strong>Order Confirmed (' + res.data.orderNumber + ')!</strong><br/>Payable on Delivery: ৳' + Number(res.data.grandTotal).toLocaleString() + '. Confirmation sent to your email/mobile.<br/><a href="' + res.data.whatsappUrl + '" target="_blank" rel="noopener" style="display:inline-block;margin-top:8px;padding:7px 14px;background:#25D366;color:#fff;border-radius:6px;font-weight:600;">Also Send Copy via WhatsApp →</a>';
                btn.textContent = 'Order Placed Successfully ✓';
            } else {
                fb.style.display = 'block';
                fb.style.background = '#fef2f2';
                fb.style.border = '1px solid #ef4444';
                fb.style.color = '#991b1b';
                fb.textContent = (res && res.data && res.data.message) ? res.data.message : 'Could not submit order.';
                btn.disabled = false;
                btn.textContent = 'Confirm Cash on Delivery Order →';
            }
        })
        .catch(function() {
            btn.disabled = false;
            btn.textContent = 'Confirm Cash on Delivery Order →';
        });
    return false;
}
</script>
<?php wp_footer(); ?>
</body>
</html>
`;

  /* 6. page.php & index.php (Elementor + WooCommerce + Standard WP Loop Compatible) */
  const pagePhp = `<?php
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}
get_header();
?>
<main class="bdtz-page-main">
    <?php
    while ( have_posts() ) :
        the_post();
        if ( 'builder' === get_post_meta( get_the_ID(), '_elementor_edit_mode', true ) ) {
            the_content();
        } else {
            ?>
            <div class="bdtz-container" style="padding-top:56px;padding-bottom:72px;">
                <h1 style="font-size:32px;font-weight:600;margin-bottom:24px;"><?php the_title(); ?></h1>
                <div class="bdtz-entry-content">
                    <?php the_content(); ?>
                </div>
            </div>
            <?php
        }
    endwhile;
    ?>
</main>
<?php
get_footer();
`;

  const indexPhp = `<?php
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}
get_header();
?>
<main class="bdtz-container" style="padding-top:56px;padding-bottom:72px;">
    <?php if ( have_posts() ) : ?>
        <?php while ( have_posts() ) : the_post(); ?>
            <article style="margin-bottom:40px;padding-bottom:32px;border-bottom:1px solid #e5e2dc;">
                <h2 style="font-size:24px;font-weight:600;margin-bottom:10px;">
                    <a href="<?php the_permalink(); ?>"><?php the_title(); ?></a>
                </h2>
                <div><?php the_excerpt(); ?></div>
            </article>
        <?php endwhile; ?>
    <?php else : ?>
        <p>No posts found.</p>
    <?php endif; ?>
</main>
<?php
get_footer();
`;

  /* 7. Bengali Installation Guide inside Theme */
  const readmeBangla = `========================================================================
BDTechZen — cPanel WordPress Theme (সরাসরি আপলোডযোগ্য জিপ ফোল্ডার)
========================================================================

এই জিপ ফাইলটি (bdtechzen-wordpress-theme.zip) একটি সম্পূর্ণ রেডিমেড WordPress Theme!
এটি ডাউনলোড করার পর আপনার কম্পিউটারে Unzip (ভাঙার) দরকার নেই—সরাসরি WordPress-এ আপলোড করতে পারবেন।

------------------------------------------------------------------------
ধাপ ১: cPanel-এ WordPress ইনস্টল করুন
------------------------------------------------------------------------
১. আপনার cPanel-এ লগইন করে "Softaculous Apps Installer" বা "WordPress Manager"-এ যান।
২. আপনার ডোমেইনে নতুন WordPress ইনস্টল করুন এবং "/wp-admin"-এ লগইন করুন।

------------------------------------------------------------------------
ধাপ ২: এই জিপ ফাইলটি WordPress-এ আপলোড ও Activate করুন
------------------------------------------------------------------------
পদ্ধতি A (সবচেয়ে সহজ — সরাসরি WordPress ড্যাশবোর্ড থেকে):
১. WordPress Admin -> Appearance -> Themes -> উপরের "Add New Theme" -> "Upload Theme"-এ ক্লিক করুন।
২. আপনার ডাউনলোড করা "bdtechzen-wordpress-theme.zip" ফাইলটি সিলেক্ট করে "Install Now" দিন।
৩. ইনস্টল হলে "Activate" বাটনে ক্লিক করুন!

(নোট: আপনার হোস্টিংয়ে যদি PHP upload_max_filesize 2MB লিমিট দেওয়া থাকে এবং ড্যাশবোর্ডে ফাইল সাইজ এরর দেখায়, তাহলে পদ্ধতি B অনুসরণ করুন:)
পদ্ধতি B (cPanel File Manager থেকে — যেকোনো সাইজের ফাইলের জন্য ১০০% কার্যকরী):
১. cPanel -> File Manager -> "public_html/wp-content/themes/" ফোল্ডারের ভেতরে যান।
২. উপরের "Upload" বাটনে ক্লিক করে "bdtechzen-wordpress-theme.zip" ফাইলটি আপলোড করুন।
৩. ফাইলটির ওপর রাইট-ক্লিক করে "Extract" করুন (ভেতরে "bdtechzen-theme" ফোল্ডার তৈরি হবে)।
৪. এবার WordPress Admin -> Appearance -> Themes-এ গিয়ে "BDTechZen Footwear Atelier"-এর নিচে "Activate" ক্লিক করুন!

------------------------------------------------------------------------
ধাপ ৩: Activate করার সাথে সাথেই যা যা চালু হয়ে যাবে
------------------------------------------------------------------------
* আপনার ডোমেইন ভিজিট করলেই ২ জন বাংলাদেশী মডেলের হিরো সেকশন, Poppins ও DM Sans ফন্ট, সব জুতার কালেকশন (EU Size ও Color অপশনসহ), Cash on Delivery (COD) অর্ডার পপআপ এবং WhatsApp (+8801623604635) সহ সম্পূর্ণ সাইট লাইভ হয়ে যাবে!
* সব ছবি থিমের ভেতরেই ("assets/images/") দেওয়া আছে—তাই একটি ছবিও ভাঙবে না।
* কাস্টমার অর্ডার দিলে WordPress ড্যাশবোর্ডের বাম পাশের "Shoe Orders (COD)" মেনুতে অর্ডার সেভ হবে এবং অটোমেটিক কাস্টমারের Email ও Mobile SMS-এ কনফার্মেশন যাবে।

------------------------------------------------------------------------
ধাপ ৪: Elementor Free (Flexbox Container) দিয়ে এডিট করতে চাইলে
------------------------------------------------------------------------
১. Plugins -> Add New থেকে ফ্রি "Elementor" প্লাগইন ইনস্টল ও Activate করুন।
২. Elementor -> Settings -> Features-এ গিয়ে "Flexbox Container" Active রাখুন এবং "Editor V4 / Atomic" বন্ধ (Inactive) রাখুন।
৩. এরপর Appearance -> "BDTechZen Setup & SMS"-এ গিয়ে "Create Editable Elementor Free Homepage" বাটনে ১টি ক্লিক করলেই আপনার হোমপেজটি Elementor দিয়ে ড্র্যাগ-অ্যান্ড-ড্রপ এডিট করার জন্য তৈরি হয়ে যাবে!
========================================================================
`;

  const elementorJson = JSON.stringify(
    generateElementorFreeFlexboxJson(db, baseUrl),
    null,
    2
  );

  const entries: ZipEntryInput[] = [
    {
      filename: `${THEME_SLUG}/style.css`,
      data: Buffer.from(styleCss, 'utf8'),
      compress: true
    },
    {
      filename: `${THEME_SLUG}/functions.php`,
      data: Buffer.from(functionsPhp, 'utf8'),
      compress: true
    },
    {
      filename: `${THEME_SLUG}/header.php`,
      data: Buffer.from(headerPhp, 'utf8'),
      compress: true
    },
    {
      filename: `${THEME_SLUG}/front-page.php`,
      data: Buffer.from(frontPagePhp, 'utf8'),
      compress: true
    },
    {
      filename: `${THEME_SLUG}/footer.php`,
      data: Buffer.from(footerPhp, 'utf8'),
      compress: true
    },
    {
      filename: `${THEME_SLUG}/page.php`,
      data: Buffer.from(pagePhp, 'utf8'),
      compress: true
    },
    {
      filename: `${THEME_SLUG}/index.php`,
      data: Buffer.from(indexPhp, 'utf8'),
      compress: true
    },
    {
      filename: `${THEME_SLUG}/data/catalog.json`,
      data: Buffer.from(JSON.stringify(catalogPayload, null, 2), 'utf8'),
      compress: true
    },
    {
      filename: `${THEME_SLUG}/elementor/bdtechzen-elementor-free-flexbox.json`,
      data: Buffer.from(elementorJson, 'utf8'),
      compress: true
    },
    {
      filename: `${THEME_SLUG}/README-BANGLA.txt`,
      data: Buffer.from(readmeBangla, 'utf8'),
      compress: true
    }
  ];

  // Bundle all referenced hero, lookbook, category & product images into bdtechzen-theme/assets/images/
  const assetsDir = path.resolve(process.cwd(), 'src', 'assets', 'images');
  const imageFiles = new Set<string>([
    catalogPayload.heroImageFile,
    catalogPayload.formalImageFile,
    catalogPayload.runnerImageFile,
    catalogPayload.craftImageFile
  ]);

  catalogPayload.categories.forEach((c) => imageFiles.add(c.imageFile));
  catalogPayload.products.forEach((p) => imageFiles.add(p.imageFile));

  for (const imgFile of imageFiles) {
    const diskPath = path.join(assetsDir, imgFile);
    if (fs.existsSync(diskPath)) {
      try {
        const buf = fs.readFileSync(diskPath);
        entries.push({
          filename: `${THEME_SLUG}/assets/images/${imgFile}`,
          data: buf,
          compress: false
        });
      } catch {
        // Ignore optional missing file
      }
    }
  }

  // Also add screenshot.jpg at theme root so WP Appearance -> Themes shows the preview thumbnail
  const screenshotSource = path.join(assetsDir, catalogPayload.heroImageFile);
  if (fs.existsSync(screenshotSource)) {
    try {
      entries.push({
        filename: `${THEME_SLUG}/screenshot.jpg`,
        data: fs.readFileSync(screenshotSource),
        compress: false
      });
    } catch {
      // Ignore optional screenshot error
    }
  }

  return createZipArchive(entries);
}

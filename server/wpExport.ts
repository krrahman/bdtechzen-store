import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { DatabaseSchema, Product } from './db.js';
import { generateMySqlDumpSql } from './mysql.js';

/* ---------------------------------------------------------------------------
 * ZERO-DEPENDENCY PKZIP BUILDER (CRC-32 + DEFLATE/STORE)
 * Generates standard .zip archives compatible with WordPress, Elementor,
 * Windows Explorer, macOS Archive Utility, and Linux unzip.
 * -------------------------------------------------------------------------*/

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = CRC_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

export interface ZipEntryInput {
  filename: string;
  data: Buffer;
  compress?: boolean;
}

export function createZipArchive(entries: ZipEntryInput[]): Buffer {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;

  const now = new Date();
  const dosTime =
    ((now.getHours() & 0x1f) << 11) |
    ((now.getMinutes() & 0x3f) << 5) |
    ((now.getSeconds() >> 1) & 0x1f);
  const dosDate =
    (((now.getFullYear() - 1980) & 0x7f) << 9) |
    (((now.getMonth() + 1) & 0x0f) << 5) |
    (now.getDate() & 0x1f);

  for (const entry of entries) {
    const nameBuf = Buffer.from(entry.filename.replace(/\\/g, '/'), 'utf8');
    const uncompressedSize = entry.data.length;
    const checksum = crc32(entry.data);
    const shouldDeflate = entry.compress !== false && uncompressedSize > 64;
    const compressedData = shouldDeflate ? zlib.deflateRawSync(entry.data) : entry.data;
    const method = shouldDeflate ? 8 : 0;
    const compressedSize = compressedData.length;

    // Local File Header (30 bytes + filename)
    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0); // signature
    localHeader.writeUInt16LE(20, 4); // version needed (2.0)
    localHeader.writeUInt16LE(0x0800, 6); // UTF-8 filename flag
    localHeader.writeUInt16LE(method, 8);
    localHeader.writeUInt16LE(dosTime, 10);
    localHeader.writeUInt16LE(dosDate, 12);
    localHeader.writeUInt32LE(checksum, 14);
    localHeader.writeUInt32LE(compressedSize, 18);
    localHeader.writeUInt32LE(uncompressedSize, 22);
    localHeader.writeUInt16LE(nameBuf.length, 26);
    localHeader.writeUInt16LE(0, 28); // extra len

    localParts.push(localHeader, nameBuf, compressedData);

    // Central Directory File Header (46 bytes + filename)
    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0); // signature
    centralHeader.writeUInt16LE(20, 4); // version made by
    centralHeader.writeUInt16LE(20, 6); // version needed
    centralHeader.writeUInt16LE(0x0800, 8); // UTF-8 flag
    centralHeader.writeUInt16LE(method, 10);
    centralHeader.writeUInt16LE(dosTime, 12);
    centralHeader.writeUInt16LE(dosDate, 14);
    centralHeader.writeUInt32LE(checksum, 16);
    centralHeader.writeUInt32LE(compressedSize, 20);
    centralHeader.writeUInt32LE(uncompressedSize, 24);
    centralHeader.writeUInt16LE(nameBuf.length, 28);
    centralHeader.writeUInt16LE(0, 30); // extra len
    centralHeader.writeUInt16LE(0, 32); // comment len
    centralHeader.writeUInt16LE(0, 34); // disk number
    centralHeader.writeUInt16LE(0, 36); // internal attrs
    centralHeader.writeUInt32LE(0, 38); // external attrs
    centralHeader.writeUInt32LE(offset, 42); // local header offset

    centralParts.push(centralHeader, nameBuf);
    offset += 30 + nameBuf.length + compressedSize;
  }

  const centralBuffer = Buffer.concat(centralParts);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0); // EOCD signature
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(centralBuffer.length, 12);
  eocd.writeUInt32LE(offset, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([...localParts, centralBuffer, eocd]);
}

function escapeHtml(str: string): string {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function resolvePublicImageUrl(imgPath: string, baseUrl: string): string {
  if (!imgPath) return `${baseUrl}/src/assets/images/hero_bangladeshi_models_1792779716481.jpg`;
  if (imgPath.startsWith('http://') || imgPath.startsWith('https://') || imgPath.startsWith('data:')) {
    return imgPath;
  }
  const clean = imgPath.startsWith('/') ? imgPath : `/${imgPath}`;
  return `${baseUrl}${clean}`;
}

function getLocalZipImageName(imgPath: string): string | null {
  if (!imgPath || imgPath.startsWith('http') || imgPath.startsWith('data:')) return null;
  return path.basename(imgPath);
}

/* ---------------------------------------------------------------------------
 * 1. PURE CSS FLEXBOX STANDALONE HTML GENERATOR
 * Zero Tailwind runtime dependency, semantic Flexbox containers (.bdtz-flex),
 * Poppins + DM Sans fonts, responsive breakpoints, interactive category filter,
 * and WhatsApp / Cash on Delivery quick order modal.
 * -------------------------------------------------------------------------*/

export interface HtmlExportOptions {
  baseUrl: string;
  preferRelativeZipImages?: boolean;
  bodySnippetOnly?: boolean;
}

export function generateStandaloneFlexboxHtml(
  db: DatabaseSchema,
  options: HtmlExportOptions
): string {
  const { baseUrl, preferRelativeZipImages = false, bodySnippetOnly = false } = options;
  const settings = db.settings;
  const storeName = settings.storeName || 'BDTechZen';
  const rawWhatsapp = settings.whatsappNumber || '+8801623604635';
  const cleanWhatsapp = rawWhatsapp.replace(/[^0-9]/g, '') || '8801623604635';
  const supportPhone = settings.supportPhone || '+880 1623-604635';
  const supportEmail = settings.supportEmail || 'support@bdtechzen.com';

  const heroImageRaw =
    settings.heroBanner?.imageUrl ||
    '/src/assets/images/hero_bangladeshi_models_1792779716481.jpg';
  const formalPairRaw = '/src/assets/images/hero_bangladeshi_formal_1792779717196.jpg';
  const craftImageRaw = '/src/assets/images/atelier_leather_craft_1792778292354.jpg';

  const imgSrc = (rawPath: string) => {
    const abs = resolvePublicImageUrl(rawPath, baseUrl);
    if (preferRelativeZipImages) {
      const base = getLocalZipImageName(rawPath);
      if (base) {
        return { src: `./images/${base}`, fallback: abs };
      }
    }
    return { src: abs, fallback: abs };
  };

  const heroImg = imgSrc(heroImageRaw);
  const formalImg = imgSrc(formalPairRaw);
  const craftImg = imgSrc(craftImageRaw);

  const publishedProducts = db.products.filter((p) => p.isPublished).slice(0, 9);
  const featuredCategories = db.categories.slice(0, 4);

  const styles = `
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

    .bdtz-wp-root, .bdtz-wp-root * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      padding: 0;
      background-color: var(--bdtz-canvas);
      color: var(--bdtz-ink);
      font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 16px;
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
    }

    .bdtz-wp-root {
      background-color: var(--bdtz-canvas);
      color: var(--bdtz-ink);
      font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
    }

    .bdtz-wp-root h1,
    .bdtz-wp-root h2,
    .bdtz-wp-root h3,
    .bdtz-wp-root h4,
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

    /* Core Reusable Flexbox Containers (100% Flexbox Layout Architecture) */
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

    /* Main 3-Zone Flexbox Header */
    .bdtz-header {
      position: sticky;
      top: 0;
      z-index: 50;
      background-color: rgba(255, 255, 255, 0.96);
      backdrop-filter: blur(10px);
      border-bottom: 1px solid var(--bdtz-border);
    }

    .bdtz-header-inner {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      gap: 32px;
      min-height: 70px;
    }

    .bdtz-brand {
      display: flex;
      align-items: center;
      gap: 10px;
      font-family: 'Poppins', sans-serif;
      font-weight: 700;
      font-size: 20px;
      color: var(--bdtz-ink);
      white-space: nowrap;
    }

    .bdtz-brand-mark {
      width: 30px;
      height: 30px;
      border-radius: 8px;
      background: var(--bdtz-ink);
      color: #ffffff;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      font-weight: 700;
    }

    .bdtz-nav {
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 28px;
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
      color: #ffffff;
    }

    .bdtz-btn-light {
      background-color: #ffffff;
      color: var(--bdtz-ink);
    }

    .bdtz-btn-outline-dark {
      background-color: transparent;
      color: #e7e5e4;
      border-color: #3f3f46;
    }

    .bdtz-btn-whatsapp {
      background-color: var(--bdtz-whatsapp);
      color: #ffffff;
    }

    /* Section 1: Hero Split Flexbox Container */
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
      padding-top: 64px;
      padding-bottom: 64px;
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
      font-size: clamp(2rem, 3.6vw, 2.85rem);
      font-weight: 600;
      line-height: 1.14;
      color: #ffffff;
      text-wrap: balance;
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

    .bdtz-hero-meta-row {
      display: flex;
      flex-direction: row;
      gap: 24px;
      padding-top: 24px;
      border-top: 1px solid var(--bdtz-dark-border);
      font-size: 12px;
      color: #a8a29e;
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

    /* Full-width 4-Column Flexbox Service Ledger */
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

    /* Section 2: Collection Flexbox Grid */
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
    }

    .bdtz-product-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--bdtz-ink);
      line-height: 1.35;
    }

    .bdtz-product-footer {
      margin-top: auto;
      padding-top: 12px;
      border-top: 1px solid #f1f0ec;
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .bdtz-price {
      font-family: 'Poppins', sans-serif;
      font-size: 15px;
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

    /* Section 3: Craftsmanship & Bangladeshi Formal Pair Split */
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

    /* Section 4: Testimonials & Sizing CTA */
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

    /* Footer Flexbox */
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
        padding-top: 40px;
        padding-bottom: 44px;
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
    }
  `;

  const productCardsHtml = publishedProducts
    .map((p: Product) => {
      const pImg = imgSrc(p.images[0] || '');
      const activePrice = p.salePriceBDT || p.regularPriceBDT;
      const sizes = Array.from(new Set(p.variants.map((v) => v.size))).join(', ');
      const waOrderLink = `https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(
        `Hello ${storeName}, I want to order "${p.name}" (SKU: ${p.sku}) — Price: BDT ${activePrice} via Cash on Delivery.`
      )}`;

      return `
        <article class="bdtz-product-card" data-category="${escapeHtml(p.category)}" data-gender="${escapeHtml(p.gender)}">
          <div class="bdtz-product-img-wrap">
            <img
              src="${escapeHtml(pImg.src)}"
              alt="${escapeHtml(p.name)}"
              referrerpolicy="no-referrer"
              onerror="if(this.src!=='${escapeHtml(pImg.fallback)}'){this.src='${escapeHtml(pImg.fallback)}';}"
            />
          </div>
          <div class="bdtz-product-body">
            <div class="bdtz-product-meta">
              ${escapeHtml(p.brand)} · EU ${escapeHtml(sizes || '40–44')}
            </div>
            <h3 class="bdtz-product-title">${escapeHtml(p.name)}</h3>
            <p style="font-size:13px;color:#52525b;line-height:1.55;">
              ${escapeHtml(p.description.slice(0, 110))}...
            </p>
            <div class="bdtz-product-footer">
              <div class="bdtz-price">
                ৳${activePrice.toLocaleString()}
                ${
                  p.salePriceBDT && p.salePriceBDT < p.regularPriceBDT
                    ? `<del>৳${p.regularPriceBDT.toLocaleString()}</del>`
                    : ''
                }
              </div>
              <a
                href="${waOrderLink}"
                target="_blank"
                rel="noopener noreferrer"
                class="bdtz-btn bdtz-btn-dark"
                style="padding:8px 14px;font-size:12px;"
              >
                Order COD →
              </a>
            </div>
          </div>
        </article>
      `;
    })
    .join('\n');

  const deptCardsHtml = featuredCategories
    .map((c) => {
      const cImg = imgSrc(c.image);
      return `
        <a href="#collection" class="bdtz-dept-card">
          <img
            src="${escapeHtml(cImg.src)}"
            alt="${escapeHtml(c.name)}"
            referrerpolicy="no-referrer"
            onerror="if(this.src!=='${escapeHtml(cImg.fallback)}'){this.src='${escapeHtml(cImg.fallback)}';}"
          />
          <div class="bdtz-dept-overlay">${escapeHtml(c.name)} →</div>
        </a>
      `;
    })
    .join('\n');

  const bodyMarkup = `
  <div class="bdtz-wp-root">
    <!-- Top Utility Strip -->
    <div class="bdtz-utility-bar">
      <div class="bdtz-container bdtz-utility-inner">
        <span>${escapeHtml(settings.announcementText)}</span>
        <span>Cash on Delivery · WhatsApp: ${escapeHtml(rawWhatsapp)}</span>
      </div>
    </div>

    <!-- Sticky 3-Zone Flexbox Header -->
    <header class="bdtz-header">
      <div class="bdtz-container bdtz-header-inner">
        <a href="#" class="bdtz-brand">
          <span class="bdtz-brand-mark">BZ</span>
          <span>${escapeHtml(storeName)}</span>
        </a>

        <nav class="bdtz-nav" aria-label="Primary Navigation">
          <a href="#collection">Shop All</a>
          <a href="#collection">Men</a>
          <a href="#collection">Women</a>
          <a href="#craftsmanship">Craftsmanship</a>
          <a href="#reviews">Client Reviews</a>
        </nav>

        <a
          href="https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(
            `Hello ${storeName}, I would like to place a Cash on Delivery shoe order.`
          )}"
          target="_blank"
          rel="noopener noreferrer"
          class="bdtz-btn bdtz-btn-dark"
        >
          Order COD · ${escapeHtml(supportPhone)}
        </a>
      </div>
    </header>

    <!-- Section 1: Editorial Hero Split with 2 Bangladeshi Models -->
    <section class="bdtz-hero">
      <div class="bdtz-container bdtz-hero-split">
        <div class="bdtz-hero-left">
          <div class="bdtz-flex-col" style="gap:20px;">
            <span class="bdtz-hero-kicker">Dhaka Cordwainer Studio · Handcrafted Leather &amp; Everyday Court</span>
            <h1 class="bdtz-hero-title">
              ${escapeHtml(
                settings.heroBanner?.title ||
                  'Shoes built to walk, cut from full-grain calfskin.'
              )}
            </h1>
            <p class="bdtz-hero-lead">
              ${escapeHtml(
                settings.heroBanner?.subtitle ||
                  'We pair Italian-tanned calfskin and water-resistant suede with cushioned anatomical footbeds—so your morning commute in Motijheel feels as effortless as dinner in Gulshan.'
              )}
            </p>
            <div class="bdtz-hero-actions">
              <a href="#collection" class="bdtz-btn bdtz-btn-light">
                ${escapeHtml(settings.heroBanner?.ctaText || 'Shop the Collection')} →
              </a>
              <a
                href="https://wa.me/${cleanWhatsapp}"
                target="_blank"
                rel="noopener noreferrer"
                class="bdtz-btn bdtz-btn-outline-dark"
              >
                Sizing Desk · ${escapeHtml(supportPhone)}
              </a>
            </div>
          </div>

          <div class="bdtz-hero-meta-row">
            <span>01 · Full-Grain Calfskin</span>
            <span>02 · EU 36–45 Sizing</span>
            <span>03 · 64 Districts COD</span>
          </div>
        </div>

        <div class="bdtz-hero-right">
          <div class="bdtz-hero-media-frame">
            <img
              src="${escapeHtml(heroImg.src)}"
              alt="Bangladeshi models wearing handcrafted cap-toe calfskin Oxfords and cognac horsebit leather loafers in Dhaka"
              referrerpolicy="no-referrer"
              onerror="if(this.src!=='${escapeHtml(heroImg.fallback)}'){this.src='${escapeHtml(heroImg.fallback)}';}"
            />
          </div>
          <div class="bdtz-hero-caption">
            <span>Featured on Models: Mayfair Cap-Toe Calfskin Oxford &amp; Cognac Horsebit Loafer</span>
            <span>Priced in BDT (৳) · Doorstep Inspection</span>
          </div>
        </div>
      </div>

      <!-- 4-Column Flexbox Service Ledger -->
      <div class="bdtz-ledger-strip">
        <div class="bdtz-container bdtz-ledger-flex">
          <div class="bdtz-ledger-item">
            <strong>Cash on Delivery Nationwide</strong>
            <span>Inspect your pair at the doorstep across all 64 districts</span>
          </div>
          <div class="bdtz-ledger-item">
            <strong>24–48h Dhaka Dispatch</strong>
            <span>2–4 business days outside Dhaka via Steadfast &amp; Pathao</span>
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

    <!-- Section 2: Curated Footwear Collection (Flexbox Cards) -->
    <section id="collection" class="bdtz-section">
      <div class="bdtz-container">
        <div class="bdtz-section-head">
          <div>
            <p style="font-size:12px;color:#71717a;margin-bottom:4px;">Current Release · Priced in BDT (৳)</p>
            <h2 style="font-size:30px;font-weight:600;color:#111113;">Pairs Made for Daily Rotation</h2>
          </div>

          <div class="bdtz-filter-bar" role="tablist" aria-label="Filter Footwear">
            <button type="button" class="bdtz-filter-btn active" onclick="bdtzFilter('all', this)">All Pairs</button>
            <button type="button" class="bdtz-filter-btn" onclick="bdtzFilter('formal-shoes', this)">Loafers &amp; Oxfords</button>
            <button type="button" class="bdtz-filter-btn" onclick="bdtzFilter('sneakers', this)">Court &amp; Street</button>
            <button type="button" class="bdtz-filter-btn" onclick="bdtzFilter('sports-running', this)">Running</button>
            <button type="button" class="bdtz-filter-btn" onclick="bdtzFilter('womens-shoes', this)">Women</button>
          </div>
        </div>

        <div class="bdtz-product-flex-grid" id="bdtzProductGrid">
          ${productCardsHtml}
        </div>
      </div>
    </section>

    <!-- Section 3: Craftsmanship & Dhaka Formal Lookbook -->
    <section id="craftsmanship" class="bdtz-section bdtz-craft-band">
      <div class="bdtz-container">
        <div class="bdtz-craft-split">
          <div class="bdtz-craft-media">
            <img
              src="${escapeHtml(formalImg.src)}"
              alt="Bangladeshi formal footwear lookbook featuring Blake-stitched obsidian Oxfords and black Napa loafers"
              referrerpolicy="no-referrer"
              onerror="if(this.src!=='${escapeHtml(formalImg.fallback)}'){this.src='${escapeHtml(formalImg.fallback)}';}"
            />
            <img
              src="${escapeHtml(craftImg.src)}"
              alt="Full-grain calfskin hides and EU 42 wooden shoe last in our Dhaka workshop"
              referrerpolicy="no-referrer"
              onerror="if(this.src!=='${escapeHtml(craftImg.fallback)}'){this.src='${escapeHtml(craftImg.fallback)}';}"
            />
          </div>

          <div class="bdtz-craft-copy">
            <span style="font-size:12px;color:#71717a;">Materials &amp; Lasting · Dhaka Atelier</span>
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
                  <p style="font-size:13px;color:#52525b;margin-top:4px;">Our EU 36–45 lasts eliminate pinky-toe pinch while preventing heel slip when walking briskly.</p>
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

        <div class="bdtz-dept-flex">
          ${deptCardsHtml}
        </div>
      </div>
    </section>

    <!-- Section 4: Verified Bangladesh Client Ledger & WhatsApp Desk -->
    <section id="reviews" class="bdtz-section">
      <div class="bdtz-container">
        <div class="bdtz-section-head">
          <div>
            <p style="font-size:12px;color:#71717a;margin-bottom:4px;">Client Ledger · Bangladesh</p>
            <h2 style="font-size:30px;font-weight:600;">Worn Across Dhaka, Chattogram &amp; Sylhet</h2>
          </div>
          <span style="font-size:13px;color:#52525b;">4.9 / 5.0 across verified orders</span>
        </div>

        <div class="bdtz-testimonials-flex">
          <div class="bdtz-quote-card">
            <p style="font-size:14px;color:#3f3f46;">
              “Before switching to the Mayfair Cap-Toe Oxford, stiff formal shoes blistered my heel during site visits. Wore my EU 42 pair ten hours straight on day one without a single pinch.”
            </p>
            <div style="border-top:1px solid #f1f0ec;padding-top:12px;font-size:12px;">
              <strong style="display:block;color:#111113;">Nafis Rahman</strong>
              <span style="color:#71717a;">Principal Architect · Gulshan-2, Dhaka</span>
            </div>
          </div>

          <div class="bdtz-quote-card">
            <p style="font-size:14px;color:#3f3f46;">
              “Received an instant SMS and email invoice the moment I placed my Cash on Delivery order. Steadfast delivered to Agrabad in 48 hours, and the cognac penny loafer leather looks twice its price.”
            </p>
            <div style="border-top:1px solid #f1f0ec;padding-top:12px;font-size:12px;">
              <strong style="display:block;color:#111113;">Tanvir Hasan</strong>
              <span style="color:#71717a;">Corporate Banking VP · Agrabad, Chattogram</span>
            </div>
          </div>

          <div class="bdtz-quote-card">
            <p style="font-size:14px;color:#3f3f46;">
              “Unsure between EU 38 and 39 in the Celeste Napa Mule, I messaged their WhatsApp desk with my foot length. Their recommendation fit like a glove right out of the box.”
            </p>
            <div style="border-top:1px solid #f1f0ec;padding-top:12px;font-size:12px;">
              <strong style="display:block;color:#111113;">Nusrat Jahan</strong>
              <span style="color:#71717a;">University Lecturer · Dhanmondi, Dhaka</span>
            </div>
          </div>
        </div>

        <div class="bdtz-cta-banner">
          <div style="max-width:640px;display:flex;flex-direction:column;gap:8px;">
            <span style="font-size:12px;color:#a8a29e;">Dhaka Sizing Desk · 10:00 AM – 10:00 PM BST</span>
            <h3 style="font-size:24px;font-weight:600;color:#ffffff;">Between two sizes, or prefer ordering over WhatsApp?</h3>
            <p style="font-size:14px;color:#d6d3d1;">
              Send your heel-to-toe measurement in centimeters to <strong>${escapeHtml(rawWhatsapp)}</strong> for an exact last recommendation—or use code <strong>ZEN10</strong> for 10% off orders above ৳2,000.
            </p>
          </div>
          <div class="bdtz-flex-row" style="gap:12px;">
            <a
              href="https://wa.me/${cleanWhatsapp}"
              target="_blank"
              rel="noopener noreferrer"
              class="bdtz-btn bdtz-btn-whatsapp"
            >
              WhatsApp · ${escapeHtml(rawWhatsapp)}
            </a>
            <a href="#collection" class="bdtz-btn bdtz-btn-light">Browse All Pairs →</a>
          </div>
        </div>
      </div>
    </section>

    <!-- Flexbox Footer -->
    <footer class="bdtz-footer">
      <div class="bdtz-container">
        <div class="bdtz-footer-flex">
          <div class="bdtz-footer-col" style="flex:2 1 280px;">
            <h5 style="font-size:16px;">${escapeHtml(storeName)}</h5>
            <p style="max-width:340px;line-height:1.6;">
              ${escapeHtml(settings.storeTagline)}
            </p>
            <span>Phone: ${escapeHtml(supportPhone)}</span>
            <span>WhatsApp COD: ${escapeHtml(rawWhatsapp)}</span>
            <span>Email: ${escapeHtml(supportEmail)}</span>
          </div>

          <div class="bdtz-footer-col">
            <h5>Footwear</h5>
            <a href="#collection">Men's Collection</a>
            <a href="#collection">Women's Collection</a>
            <a href="#collection">Oxfords &amp; Loafers</a>
            <a href="#collection">Court &amp; Street Sneakers</a>
            <a href="#collection">Road &amp; Lake Runners</a>
          </div>

          <div class="bdtz-footer-col">
            <h5>Client Service</h5>
            <a href="#craftsmanship">Our Dhaka Workshop</a>
            <a href="#reviews">Verified Reviews</a>
            <a href="https://wa.me/${cleanWhatsapp}">7-Day Doorstep Size Swap</a>
            <a href="https://wa.me/${cleanWhatsapp}">Cash on Delivery Policy</a>
          </div>
        </div>

        <div class="bdtz-footer-bottom">
          <span>Bangladesh Payment Methods: Cash on Delivery · bKash · Nagad · Rocket · SSLCOMMERZ</span>
          <span>© ${new Date().getFullYear()} ${escapeHtml(storeName)}. Dhaka, Bangladesh.</span>
        </div>
      </div>
    </footer>
  </div>

  <script>
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
        } else if (cat === 'formal-shoes') {
          c.style.display = (itemCat === 'formal-shoes' || itemCat === 'mens-shoes') ? 'flex' : 'none';
        } else if (cat === 'sneakers') {
          c.style.display = (itemCat === 'sneakers' || itemCat === 'casual-shoes') ? 'flex' : 'none';
        } else if (cat === 'womens-shoes') {
          c.style.display = (itemCat === 'womens-shoes' || itemGender === 'women') ? 'flex' : 'none';
        } else {
          c.style.display = (itemCat === cat) ? 'flex' : 'none';
        }
      }
    }
  </script>`;

  if (bodySnippetOnly) {
    return `<!-- BDTechZen WordPress Custom HTML Snippet (Pure CSS Flexbox) -->\n<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Poppins:wght@500;600;700&display=swap" rel="stylesheet">\n<style>${styles}</style>\n${bodyMarkup}`;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(storeName)} — Handcrafted Leather Footwear &amp; Sneakers in Bangladesh</title>
  <meta name="description" content="${escapeHtml(settings.storeTagline)}" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Poppins:wght@500;600;700&display=swap" rel="stylesheet" />
  <style>${styles}</style>
</head>
<body>
${bodyMarkup}
</body>
</html>`;
}

/* ---------------------------------------------------------------------------
 * 2. ELEMENTOR FREE — CLASSIC FLEXBOX CONTAINER TEMPLATE GENERATOR (.JSON)
 *
 * STRICT COMPATIBILITY GUARANTEES:
 * - Uses ONLY Elementor Free Classic Flexbox Containers ("elType": "container",
 *   "container_type": "flex") and standard Elementor Free widgets:
 *   "heading", "text-editor", "image", "button", "divider", "shortcode".
 * - ZERO Elementor Atomic / Editor V4 elements (NO e-div-block, e-flexbox,
 *   e-heading, e-button, e-image, e-paragraph).
 * - ZERO Elementor Pro widgets.
 * - Imports directly via WordPress -> Elementor -> Templates -> Import Templates.
 * -------------------------------------------------------------------------*/

export function generateElementorFreeFlexboxJson(db: DatabaseSchema, baseUrl: string) {
  let seq = 1000;
  const nextId = () => {
    seq += 1;
    return `bd${seq.toString(16).padStart(5, '0')}`;
  };

  const settings = db.settings;
  const storeName = settings.storeName || 'BDTechZen';
  const rawWhatsapp = settings.whatsappNumber || '+8801623604635';
  const cleanWhatsapp = rawWhatsapp.replace(/[^0-9]/g, '') || '8801623604635';
  const supportPhone = settings.supportPhone || '+880 1623-604635';

  const heroImageUrl = resolvePublicImageUrl(
    settings.heroBanner?.imageUrl ||
      '/src/assets/images/hero_bangladeshi_models_1792779716481.jpg',
    baseUrl
  );
  const formalPairUrl = resolvePublicImageUrl(
    '/src/assets/images/hero_bangladeshi_formal_1792779717196.jpg',
    baseUrl
  );
  const craftImageUrl = resolvePublicImageUrl(
    '/src/assets/images/atelier_leather_craft_1792778292354.jpg',
    baseUrl
  );

  const products = db.products.filter((p) => p.isPublished).slice(0, 6);

  // Helper builders for Classic Elementor Free Widgets & Flexbox Containers
  const makeHeading = (
    title: string,
    tag: 'h1' | 'h2' | 'h3' | 'h4' | 'h5',
    color: string,
    fontSizePx: number,
    weight = '600',
    lineHeightEm = 1.2
  ) => ({
    id: nextId(),
    elType: 'widget',
    widgetType: 'heading',
    settings: {
      title,
      header_size: tag,
      title_color: color,
      typography_typography: 'custom',
      typography_font_family: 'Poppins',
      typography_font_size: { unit: 'px', size: fontSizePx, sizes: [] },
      typography_font_size_mobile: {
        unit: 'px',
        size: Math.max(18, Math.round(fontSizePx * 0.76)),
        sizes: []
      },
      typography_font_weight: weight,
      typography_line_height: { unit: 'em', size: lineHeightEm, sizes: [] }
    },
    elements: []
  });

  const makeText = (html: string, color: string, fontSizePx = 15) => ({
    id: nextId(),
    elType: 'widget',
    widgetType: 'text-editor',
    settings: {
      editor: html,
      text_color: color,
      typography_typography: 'custom',
      typography_font_family: 'DM Sans',
      typography_font_size: { unit: 'px', size: fontSizePx, sizes: [] },
      typography_line_height: { unit: 'em', size: 1.65, sizes: [] }
    },
    elements: []
  });

  const makeButton = (
    text: string,
    url: string,
    bgColor: string,
    textColor: string,
    borderColor?: string
  ) => ({
    id: nextId(),
    elType: 'widget',
    widgetType: 'button',
    settings: {
      text,
      link: {
        url,
        is_external: url.startsWith('http'),
        nofollow: false
      },
      background_color: bgColor,
      button_text_color: textColor,
      border_border: borderColor ? 'solid' : 'none',
      border_width: borderColor
        ? { unit: 'px', top: '1', right: '1', bottom: '1', left: '1', isLinked: true }
        : undefined,
      border_color: borderColor,
      border_radius: { unit: 'px', top: '8', right: '8', bottom: '8', left: '8', isLinked: true },
      text_padding: {
        unit: 'px',
        top: '13',
        right: '24',
        bottom: '13',
        left: '24',
        isLinked: false
      },
      typography_typography: 'custom',
      typography_font_family: 'Poppins',
      typography_font_size: { unit: 'px', size: 13, sizes: [] },
      typography_font_weight: '600'
    },
    elements: []
  });

  const makeImage = (url: string, alt: string, radiusPx = 12) => ({
    id: nextId(),
    elType: 'widget',
    widgetType: 'image',
    settings: {
      image: {
        url,
        id: '',
        alt,
        source: 'url'
      },
      image_size: 'full',
      width: { unit: '%', size: 100, sizes: [] },
      image_border_radius: {
        unit: 'px',
        top: String(radiusPx),
        right: String(radiusPx),
        bottom: String(radiusPx),
        left: String(radiusPx),
        isLinked: true
      }
    },
    elements: []
  });

  // 1. HERO SECTION CONTAINER (Flexbox Row -> Left Copy Container + Right Bangladeshi Models Image Container)
  const heroContainer = {
    id: nextId(),
    elType: 'container',
    isInner: false,
    settings: {
      _title: '01. Hero Section (2 Bangladeshi Models)',
      container_type: 'flex',
      content_width: 'boxed',
      boxed_width: { unit: 'px', size: 1240, sizes: [] },
      flex_direction: 'row',
      flex_direction_tablet: 'column',
      flex_direction_mobile: 'column',
      flex_justify_content: 'space-between',
      flex_align_items: 'center',
      flex_gap: { unit: 'px', size: 44, column: '44', row: '44', isLinked: true },
      background_background: 'classic',
      background_color: '#0E0E10',
      padding: { unit: 'px', top: '72', right: '24', bottom: '72', left: '24', isLinked: false }
    },
    elements: [
      {
        id: nextId(),
        elType: 'container',
        isInner: true,
        settings: {
          _title: 'Hero Editorial Copy Column',
          container_type: 'flex',
          content_width: 'full',
          width: { unit: '%', size: 44, sizes: [] },
          width_tablet: { unit: '%', size: 100, sizes: [] },
          width_mobile: { unit: '%', size: 100, sizes: [] },
          flex_direction: 'column',
          flex_gap: { unit: 'px', size: 20, column: '20', row: '20', isLinked: true }
        },
        elements: [
          makeText(
            '<p>Dhaka Cordwainer Studio · Direct to Consumer</p>',
            '#A8A29E',
            12
          ),
          makeHeading(
            settings.heroBanner?.title ||
              'Shoes built to walk, cut from full-grain calfskin.',
            'h1',
            '#FFFFFF',
            44,
            '600',
            1.14
          ),
          makeText(
            `<p>${escapeHtml(
              settings.heroBanner?.subtitle ||
                'We pair Italian-tanned calfskin and water-resistant suede with cushioned anatomical footbeds—so your morning commute in Motijheel feels as effortless as dinner in Gulshan.'
            )}</p>`,
            '#D6D3D1',
            15
          ),
          {
            id: nextId(),
            elType: 'container',
            isInner: true,
            settings: {
              _title: 'Hero CTA Row',
              container_type: 'flex',
              content_width: 'full',
              flex_direction: 'row',
              flex_wrap: 'wrap',
              flex_gap: { unit: 'px', size: 12, column: '12', row: '12', isLinked: true }
            },
            elements: [
              makeButton(
                settings.heroBanner?.ctaText || 'Shop the Collection →',
                '#collection',
                '#FFFFFF',
                '#111113'
              ),
              makeButton(
                `WhatsApp · ${supportPhone}`,
                `https://wa.me/${cleanWhatsapp}`,
                '#18181B',
                '#F5F5F4',
                '#3F3F46'
              )
            ]
          }
        ]
      },
      {
        id: nextId(),
        elType: 'container',
        isInner: true,
        settings: {
          _title: 'Hero Bangladeshi Models Lookbook Column',
          container_type: 'flex',
          content_width: 'full',
          width: { unit: '%', size: 56, sizes: [] },
          width_tablet: { unit: '%', size: 100, sizes: [] },
          width_mobile: { unit: '%', size: 100, sizes: [] },
          flex_direction: 'column',
          flex_gap: { unit: 'px', size: 10, column: '10', row: '10', isLinked: true }
        },
        elements: [
          makeImage(
            heroImageUrl,
            'Bangladeshi models wearing handcrafted cap-toe calfskin Oxfords and cognac horsebit loafers in Dhaka',
            12
          ),
          makeText(
            '<p>Featured on Models: Mayfair Cap-Toe Calfskin Oxford &amp; Cognac Horsebit Loafer · EU 36–45 · Cash on Delivery across Bangladesh</p>',
            '#A8A29E',
            12
          )
        ]
      }
    ]
  };

  // 2. 4-COLUMN BANGLADESH SERVICE LEDGER CONTAINER
  const ledgerItems = [
    {
      title: 'Cash on Delivery Nationwide',
      desc: 'Inspect your pair at the doorstep across all 64 districts'
    },
    {
      title: '24–48h Dhaka Dispatch',
      desc: '2–4 business days outside Dhaka via Steadfast & Pathao'
    },
    {
      title: 'Instant SMS & Email Updates',
      desc: 'Automatic order receipt & courier waybill alerts on your phone'
    },
    {
      title: '7-Day Doorstep Size Swap',
      desc: 'Between two EU sizes? We exchange unworn pairs effortlessly'
    }
  ];

  const serviceLedgerContainer = {
    id: nextId(),
    elType: 'container',
    isInner: false,
    settings: {
      _title: '02. 4-Column Service Guarantees',
      container_type: 'flex',
      content_width: 'boxed',
      boxed_width: { unit: 'px', size: 1240, sizes: [] },
      flex_direction: 'row',
      flex_direction_tablet: 'row',
      flex_direction_mobile: 'column',
      flex_wrap: 'wrap',
      flex_justify_content: 'space-between',
      flex_gap: { unit: 'px', size: 24, column: '24', row: '24', isLinked: true },
      background_background: 'classic',
      background_color: '#141418',
      border_border: 'solid',
      border_width: { unit: 'px', top: '1', right: '0', bottom: '1', left: '0', isLinked: false },
      border_color: '#27272A',
      padding: { unit: 'px', top: '24', right: '24', bottom: '24', left: '24', isLinked: false }
    },
    elements: ledgerItems.map((item) => ({
      id: nextId(),
      elType: 'container',
      isInner: true,
      settings: {
        container_type: 'flex',
        content_width: 'full',
        width: { unit: '%', size: 23, sizes: [] },
        width_tablet: { unit: '%', size: 47, sizes: [] },
        width_mobile: { unit: '%', size: 100, sizes: [] },
        flex_direction: 'column',
        flex_gap: { unit: 'px', size: 4, column: '4', row: '4', isLinked: true }
      },
      elements: [
        makeHeading(item.title, 'h4', '#FFFFFF', 14, '600', 1.3),
        makeText(`<p>${escapeHtml(item.desc)}</p>`, '#A8A29E', 12)
      ]
    }))
  };

  // 3. FEATURED COLLECTION FLEXBOX CONTAINER (Editable Product Cards in Elementor Free!)
  const productCardContainers = products.map((p) => {
    const prodImgUrl = resolvePublicImageUrl(p.images[0] || '', baseUrl);
    const activePrice = p.salePriceBDT || p.regularPriceBDT;
    const priceLabel =
      p.salePriceBDT && p.salePriceBDT < p.regularPriceBDT
        ? `৳${activePrice.toLocaleString()} (Regular ৳${p.regularPriceBDT.toLocaleString()})`
        : `৳${activePrice.toLocaleString()}`;
    const waUrl = `https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(
      `Hello ${storeName}, I want to order "${p.name}" (SKU: ${p.sku}) — BDT ${activePrice} via Cash on Delivery.`
    )}`;

    return {
      id: nextId(),
      elType: 'container',
      isInner: true,
      settings: {
        _title: p.name,
        container_type: 'flex',
        content_width: 'full',
        width: { unit: '%', size: 31.5, sizes: [] },
        width_tablet: { unit: '%', size: 48, sizes: [] },
        width_mobile: { unit: '%', size: 100, sizes: [] },
        flex_direction: 'column',
        flex_justify_content: 'space-between',
        flex_gap: { unit: 'px', size: 12, column: '12', row: '12', isLinked: true },
        background_background: 'classic',
        background_color: '#FFFFFF',
        border_border: 'solid',
        border_width: { unit: 'px', top: '1', right: '1', bottom: '1', left: '1', isLinked: true },
        border_color: '#E5E2DC',
        border_radius: {
          unit: 'px',
          top: '12',
          right: '12',
          bottom: '12',
          left: '12',
          isLinked: true
        },
        padding: { unit: 'px', top: '16', right: '16', bottom: '20', left: '16', isLinked: false }
      },
      elements: [
        makeImage(prodImgUrl, p.name, 8),
        makeText(`<p>${escapeHtml(p.brand)} · SKU ${escapeHtml(p.sku)}</p>`, '#71717A', 12),
        makeHeading(p.name, 'h3', '#111113', 17, '600', 1.35),
        makeText(`<p><strong>${escapeHtml(priceLabel)}</strong></p>`, '#111113', 15),
        makeButton('Order via COD / WhatsApp →', waUrl, '#111113', '#FFFFFF')
      ]
    };
  });

  const collectionSectionContainer = {
    id: nextId(),
    elType: 'container',
    isInner: false,
    settings: {
      _title: '03. Featured Footwear Collection (Flexbox Grid)',
      css_id: 'collection',
      container_type: 'flex',
      content_width: 'boxed',
      boxed_width: { unit: 'px', size: 1240, sizes: [] },
      flex_direction: 'column',
      flex_gap: { unit: 'px', size: 32, column: '32', row: '32', isLinked: true },
      background_background: 'classic',
      background_color: '#F7F6F2',
      padding: { unit: 'px', top: '80', right: '24', bottom: '80', left: '24', isLinked: false }
    },
    elements: [
      {
        id: nextId(),
        elType: 'container',
        isInner: true,
        settings: {
          _title: 'Section Heading Wrapper',
          container_type: 'flex',
          content_width: 'full',
          flex_direction: 'column',
          flex_gap: { unit: 'px', size: 6, column: '6', row: '6', isLinked: true }
        },
        elements: [
          makeText('<p>Current Release · Priced in BDT (৳)</p>', '#71717A', 12),
          makeHeading('Pairs Made for Daily Rotation', 'h2', '#111113', 32, '600', 1.2)
        ]
      },
      {
        id: nextId(),
        elType: 'container',
        isInner: true,
        settings: {
          _title: 'Flexbox Product Cards Wrapper',
          container_type: 'flex',
          content_width: 'full',
          flex_direction: 'row',
          flex_wrap: 'wrap',
          flex_justify_content: 'space-between',
          flex_align_items: 'stretch',
          flex_gap: { unit: 'px', size: 24, column: '24', row: '24', isLinked: true }
        },
        elements: productCardContainers
      }
    ]
  };

  // 4. CRAFTSMANSHIP & FORMAL LOOKBOOK SPLIT CONTAINER
  const craftsmanshipContainer = {
    id: nextId(),
    elType: 'container',
    isInner: false,
    settings: {
      _title: '04. Dhaka Workshop & Craftsmanship Split',
      container_type: 'flex',
      content_width: 'boxed',
      boxed_width: { unit: 'px', size: 1240, sizes: [] },
      flex_direction: 'row',
      flex_direction_tablet: 'column',
      flex_direction_mobile: 'column',
      flex_align_items: 'center',
      flex_gap: { unit: 'px', size: 48, column: '48', row: '48', isLinked: true },
      background_background: 'classic',
      background_color: '#FFFFFF',
      border_border: 'solid',
      border_width: { unit: 'px', top: '1', right: '0', bottom: '1', left: '0', isLinked: false },
      border_color: '#E5E2DC',
      padding: { unit: 'px', top: '80', right: '24', bottom: '80', left: '24', isLinked: false }
    },
    elements: [
      {
        id: nextId(),
        elType: 'container',
        isInner: true,
        settings: {
          _title: 'Lookbook & Workbench Media Column',
          container_type: 'flex',
          content_width: 'full',
          width: { unit: '%', size: 50, sizes: [] },
          width_tablet: { unit: '%', size: 100, sizes: [] },
          width_mobile: { unit: '%', size: 100, sizes: [] },
          flex_direction: 'column',
          flex_gap: { unit: 'px', size: 20, column: '20', row: '20', isLinked: true }
        },
        elements: [
          makeImage(
            formalPairUrl,
            'Bangladeshi formal footwear lookbook featuring obsidian Oxfords and Napa loafers',
            12
          ),
          makeImage(
            craftImageUrl,
            'Full-grain calfskin hides and wooden shoe last on oak workbench',
            12
          )
        ]
      },
      {
        id: nextId(),
        elType: 'container',
        isInner: true,
        settings: {
          _title: 'Shoemaking Story Column',
          container_type: 'flex',
          content_width: 'full',
          width: { unit: '%', size: 50, sizes: [] },
          width_tablet: { unit: '%', size: 100, sizes: [] },
          width_mobile: { unit: '%', size: 100, sizes: [] },
          flex_direction: 'column',
          flex_gap: { unit: 'px', size: 18, column: '18', row: '18', isLinked: true }
        },
        elements: [
          makeText('<p>Materials &amp; Lasting · Dhaka Atelier</p>', '#71717A', 12),
          makeHeading(
            'Why a well-lasted pair feels better in year three than week one.',
            'h2',
            '#111113',
            30,
            '600',
            1.25
          ),
          makeText(
            '<p>Most mass-market dress shoes stiffen up with coated split leather and paperboard insoles. We cut uppers from supple full-grain hides and shape them over anatomical lasts proportioned for South Asian insteps.</p>',
            '#52525B',
            15
          ),
          makeHeading(
            '01. Full-grain calfskin that develops patina, never peels',
            'h4',
            '#111113',
            16,
            '600',
            1.35
          ),
          makeText(
            '<p>Natural open-pore leather breathes through eight-hour workdays and softens around the flex point of your forefoot.</p>',
            '#52525B',
            14
          ),
          makeHeading(
            '02. Wider forefoot room with a locked-in heel cup',
            'h4',
            '#111113',
            16,
            '600',
            1.35
          ),
          makeText(
            '<p>Our EU 36–45 lasts eliminate pinky-toe pinch while preventing heel slip when walking briskly.</p>',
            '#52525B',
            14
          ),
          makeHeading(
            '03. High-grip rubber channels for wet marble & monsoon streets',
            'h4',
            '#111113',
            16,
            '600',
            1.35
          ),
          makeText(
            '<p>Every leather sole incorporates discreet anti-slip rubber traction pods tested for wet Dhaka pavements and lobby tiles.</p>',
            '#52525B',
            14
          )
        ]
      }
    ]
  };

  // 5. CLIENT TESTIMONIALS & WHATSAPP SIZING DESK CTA CONTAINER
  const testimonials = [
    {
      quote:
        '“Before switching to the Mayfair Cap-Toe Oxford, stiff formal shoes blistered my heel during site visits. Wore my EU 42 pair ten hours straight on day one without a single pinch.”',
      author: 'Nafis Rahman',
      role: 'Principal Architect · Gulshan-2, Dhaka'
    },
    {
      quote:
        '“Received an instant SMS and email invoice the moment I placed my Cash on Delivery order. Steadfast delivered to Agrabad in 48 hours, and the cognac penny loafer leather looks twice its price.”',
      author: 'Tanvir Hasan',
      role: 'Corporate Banking VP · Agrabad, Chattogram'
    },
    {
      quote:
        '“Unsure between EU 38 and 39 in the Celeste Napa Mule, I messaged their WhatsApp desk with my foot length. Their recommendation fit like a glove right out of the box.”',
      author: 'Nusrat Jahan',
      role: 'University Lecturer · Dhanmondi, Dhaka'
    }
  ];

  const reviewsAndCtaContainer = {
    id: nextId(),
    elType: 'container',
    isInner: false,
    settings: {
      _title: '05. Verified Bangladesh Reviews & WhatsApp Sizing Desk',
      container_type: 'flex',
      content_width: 'boxed',
      boxed_width: { unit: 'px', size: 1240, sizes: [] },
      flex_direction: 'column',
      flex_gap: { unit: 'px', size: 36, column: '36', row: '36', isLinked: true },
      background_background: 'classic',
      background_color: '#F7F6F2',
      padding: { unit: 'px', top: '80', right: '24', bottom: '80', left: '24', isLinked: false }
    },
    elements: [
      makeHeading('Worn Across Dhaka, Chattogram & Sylhet', 'h2', '#111113', 30, '600', 1.2),
      {
        id: nextId(),
        elType: 'container',
        isInner: true,
        settings: {
          _title: 'Testimonials Row',
          container_type: 'flex',
          content_width: 'full',
          flex_direction: 'row',
          flex_direction_tablet: 'column',
          flex_direction_mobile: 'column',
          flex_justify_content: 'space-between',
          flex_gap: { unit: 'px', size: 24, column: '24', row: '24', isLinked: true }
        },
        elements: testimonials.map((t) => ({
          id: nextId(),
          elType: 'container',
          isInner: true,
          settings: {
            container_type: 'flex',
            content_width: 'full',
            width: { unit: '%', size: 32, sizes: [] },
            width_tablet: { unit: '%', size: 100, sizes: [] },
            width_mobile: { unit: '%', size: 100, sizes: [] },
            flex_direction: 'column',
            flex_justify_content: 'space-between',
            flex_gap: { unit: 'px', size: 16, column: '16', row: '16', isLinked: true },
            background_background: 'classic',
            background_color: '#FFFFFF',
            border_border: 'solid',
            border_width: {
              unit: 'px',
              top: '1',
              right: '1',
              bottom: '1',
              left: '1',
              isLinked: true
            },
            border_color: '#E5E2DC',
            border_radius: {
              unit: 'px',
              top: '12',
              right: '12',
              bottom: '12',
              left: '12',
              isLinked: true
            },
            padding: {
              unit: 'px',
              top: '24',
              right: '24',
              bottom: '24',
              left: '24',
              isLinked: true
            }
          },
          elements: [
            makeText(`<p>${escapeHtml(t.quote)}</p>`, '#3F3F46', 14),
            makeHeading(t.author, 'h4', '#111113', 14, '600', 1.3),
            makeText(`<p>${escapeHtml(t.role)}</p>`, '#71717A', 12)
          ]
        }))
      },
      {
        id: nextId(),
        elType: 'container',
        isInner: true,
        settings: {
          _title: 'WhatsApp Sizing Desk Banner',
          container_type: 'flex',
          content_width: 'full',
          flex_direction: 'row',
          flex_direction_tablet: 'column',
          flex_direction_mobile: 'column',
          flex_justify_content: 'space-between',
          flex_align_items: 'center',
          flex_gap: { unit: 'px', size: 24, column: '24', row: '24', isLinked: true },
          background_background: 'classic',
          background_color: '#111113',
          border_radius: {
            unit: 'px',
            top: '12',
            right: '12',
            bottom: '12',
            left: '12',
            isLinked: true
          },
          padding: { unit: 'px', top: '36', right: '36', bottom: '36', left: '36', isLinked: true }
        },
        elements: [
          {
            id: nextId(),
            elType: 'container',
            isInner: true,
            settings: {
              container_type: 'flex',
              content_width: 'full',
              width: { unit: '%', size: 65, sizes: [] },
              width_tablet: { unit: '%', size: 100, sizes: [] },
              width_mobile: { unit: '%', size: 100, sizes: [] },
              flex_direction: 'column',
              flex_gap: { unit: 'px', size: 8, column: '8', row: '8', isLinked: true }
            },
            elements: [
              makeHeading(
                'Between two sizes, or prefer ordering over WhatsApp?',
                'h3',
                '#FFFFFF',
                22,
                '600',
                1.3
              ),
              makeText(
                `<p>Send your heel-to-toe measurement in cm to <strong>${escapeHtml(
                  rawWhatsapp
                )}</strong> for an exact last recommendation—or use code <strong>ZEN10</strong> at checkout.</p>`,
                '#D6D3D1',
                14
              )
            ]
          },
          makeButton(
            `WhatsApp · ${rawWhatsapp}`,
            `https://wa.me/${cleanWhatsapp}`,
            '#25D366',
            '#FFFFFF'
          )
        ]
      }
    ]
  };

  // 6. FOOTER FLEXBOX CONTAINER
  const footerContainer = {
    id: nextId(),
    elType: 'container',
    isInner: false,
    settings: {
      _title: '06. Storefront Footer',
      container_type: 'flex',
      content_width: 'boxed',
      boxed_width: { unit: 'px', size: 1240, sizes: [] },
      flex_direction: 'row',
      flex_direction_tablet: 'column',
      flex_direction_mobile: 'column',
      flex_justify_content: 'space-between',
      flex_gap: { unit: 'px', size: 32, column: '32', row: '32', isLinked: true },
      background_background: 'classic',
      background_color: '#0E0E10',
      padding: { unit: 'px', top: '56', right: '24', bottom: '56', left: '24', isLinked: false }
    },
    elements: [
      {
        id: nextId(),
        elType: 'container',
        isInner: true,
        settings: {
          container_type: 'flex',
          content_width: 'full',
          width: { unit: '%', size: 50, sizes: [] },
          width_tablet: { unit: '%', size: 100, sizes: [] },
          width_mobile: { unit: '%', size: 100, sizes: [] },
          flex_direction: 'column',
          flex_gap: { unit: 'px', size: 10, column: '10', row: '10', isLinked: true }
        },
        elements: [
          makeHeading(storeName, 'h4', '#FFFFFF', 18, '700', 1.2),
          makeText(`<p>${escapeHtml(settings.storeTagline)}</p>`, '#A8A29E', 13),
          makeText(
            `<p>WhatsApp &amp; Cash on Delivery: ${escapeHtml(rawWhatsapp)} · ${escapeHtml(
              settings.supportEmail || 'support@bdtechzen.com'
            )}</p>`,
            '#D6D3D1',
            13
          )
        ]
      },
      {
        id: nextId(),
        elType: 'container',
        isInner: true,
        settings: {
          container_type: 'flex',
          content_width: 'full',
          width: { unit: '%', size: 50, sizes: [] },
          width_tablet: { unit: '%', size: 100, sizes: [] },
          width_mobile: { unit: '%', size: 100, sizes: [] },
          flex_direction: 'column',
          flex_align_items: 'flex-end',
          flex_align_items_mobile: 'flex-start',
          flex_justify_content: 'center',
          flex_gap: { unit: 'px', size: 8, column: '8', row: '8', isLinked: true }
        },
        elements: [
          makeText(
            '<p>Bangladesh Payment Methods: Cash on Delivery · bKash · Nagad · Rocket · SSLCOMMERZ</p>',
            '#A8A29E',
            12
          ),
          makeText(
            `<p>© ${new Date().getFullYear()} ${escapeHtml(storeName)}. Dhaka, Bangladesh.</p>`,
            '#78716C',
            12
          )
        ]
      }
    ]
  };

  return {
    version: '0.4',
    title: `${storeName} — Footwear Storefront (Elementor Free Classic Flexbox)`,
    type: 'page',
    page_settings: {
      template: 'elementor_header_footer'
    },
    content: [
      heroContainer,
      serviceLedgerContainer,
      collectionSectionContainer,
      craftsmanshipContainer,
      reviewsAndCtaContainer,
      footerContainer
    ]
  };
}

/* ---------------------------------------------------------------------------
 * 3. COMPLETE WORDPRESS + ELEMENTOR FREE + HTML ZIP BUNDLE BUILDER
 * Bundles:
 *  - bdtechzen-elementor-free-flexbox.json
 *  - bdtechzen-flexbox-standalone.html
 *  - bdtechzen-wordpress-custom-html-snippet.html
 *  - images/*.jpg (all hero & product photos for offline HTML + WP Media)
 *  - README-WORDPRESS-BANGLA.txt
 * -------------------------------------------------------------------------*/

export function buildWordPressZipBundle(db: DatabaseSchema, baseUrl: string): Buffer {
  const elementorJson = JSON.stringify(generateElementorFreeFlexboxJson(db, baseUrl), null, 2);
  const standaloneHtml = generateStandaloneFlexboxHtml(db, {
    baseUrl,
    preferRelativeZipImages: true,
    bodySnippetOnly: false
  });
  const wpSnippetHtml = generateStandaloneFlexboxHtml(db, {
    baseUrl,
    preferRelativeZipImages: false,
    bodySnippetOnly: true
  });
  const mysqlDumpSql = generateMySqlDumpSql(db);

  const readmeTxt = `========================================================================
BDTechZen — Complete Desktop HTML, WordPress (Elementor Free) & MySQL Pack
========================================================================

এই জিপ (ZIP) ফোল্ডারটি ডেস্কটপে Extract (Unzip) করলে যা যা পাবেন:
------------------------------------------------------------------------
1. index.html  (এবং images/ ফোল্ডার)
   -> ডেস্কটপে ফোল্ডারটি Extract করে সরাসরি "index.html"-এ ডাবল-ক্লিক করলেই
      সম্পূর্ণ ওয়েবসাইটটি (২ জন বাংলাদেশী মডেলের হিরো সেকশন ও সব প্রোডাক্টসহ)
      আপনার ব্রাউজারে অফলাইনেই ওপেন হবে। Pure CSS3 Flexbox দিয়ে তৈরি।

2. bdtechzen-elementor-free-flexbox.json
   -> সরাসরি WordPress-এর Elementor (Free Version) Flexbox Container Editor-এ
      আপলোড ও ভিজ্যুয়ালি এডিট করার টেমপ্লেট ফাইল।
   -> এতে কোনো Elementor Atomic (Editor V4) বা Elementor Pro উইজেট নেই।

3. bdtechzen-wordpress-custom-html-snippet.html
   -> ওয়ার্ডপ্রেসের যেকোনো পেজে Custom HTML ব্লকে পেস্ট করার জন্য রেডি কোড।

4. database/bdtechzen_mysql.sql
   -> সম্পূর্ণ MySQL 8.0 / MariaDB ডাটাবেজ স্কিমা এবং সব প্রোডাক্ট, ভেরিয়েশন,
      অর্ডার, কুপন ও স্টোর সেটিংস-এর SQL ডাম্প ফাইল (phpMyAdmin বা cPanel MySQL-এ
      সরাসরি Import করার জন্য)।

========================================================================
WordPress Elementor Free-তে আপলোড ও এডিট করার নিয়ম:
========================================================================
ধাপ ১: WordPress সাইটে ফ্রি "Elementor" প্লাগইন ইনস্টল ও Active করুন।
ধাপ ২: Elementor -> Settings -> Features-এ গিয়ে:
       - "Flexbox Container" -> Active রাখুন।
       - "Editor V4 / Atomic Elements" -> Inactive (বন্ধ) রাখুন।
ধাপ ৩: Templates -> Saved Templates -> উপরের "Import Templates" বাটনে ক্লিক করে
       "bdtechzen-elementor-free-flexbox.json" ফাইলটি আপলোড করুন।
ধাপ ৪: নতুন একটি Page খুলে "Edit with Elementor" দিন -> Page Layout: "Elementor Full Width"
       সিলেক্ট করুন -> ফোল্ডার আইকন (My Templates) থেকে টেমপ্লেটটি Insert করে এডিট করুন।
========================================================================
`;

  const entries: ZipEntryInput[] = [
    {
      filename: 'index.html',
      data: Buffer.from(standaloneHtml, 'utf8'),
      compress: true
    },
    {
      filename: 'bdtechzen-elementor-free-flexbox.json',
      data: Buffer.from(elementorJson, 'utf8'),
      compress: true
    },
    {
      filename: 'bdtechzen-wordpress-custom-html-snippet.html',
      data: Buffer.from(wpSnippetHtml, 'utf8'),
      compress: true
    },
    {
      filename: 'database/bdtechzen_mysql.sql',
      data: Buffer.from(mysqlDumpSql, 'utf8'),
      compress: true
    },
    {
      filename: 'README-BANGLA.txt',
      data: Buffer.from(readmeTxt, 'utf8'),
      compress: true
    }
  ];

  // Collect referenced local images from /src/assets/images/ so offline HTML + WP Media work seamlessly
  const assetsDir = path.resolve(process.cwd(), 'src', 'assets', 'images');
  const referencedPaths = new Set<string>([
    db.settings.heroBanner?.imageUrl ||
      '/src/assets/images/hero_bangladeshi_models_1792779716481.jpg',
    '/src/assets/images/hero_bangladeshi_formal_1792779717196.jpg',
    '/src/assets/images/atelier_leather_craft_1792778292354.jpg'
  ]);

  db.products.forEach((p) => {
    if (p.images[0]) referencedPaths.add(p.images[0]);
  });
  db.categories.slice(0, 4).forEach((c) => {
    if (c.image) referencedPaths.add(c.image);
  });

  for (const relPath of referencedPaths) {
    const baseName = getLocalZipImageName(relPath);
    if (!baseName) continue;
    const diskPath = path.join(assetsDir, baseName);
    if (fs.existsSync(diskPath)) {
      try {
        const imgBuf = fs.readFileSync(diskPath);
        entries.push({
          filename: `images/${baseName}`,
          data: imgBuf,
          compress: false // JPEGs are already compressed
        });
      } catch {
        // Ignore unreadable optional image
      }
    }
  }

  return createZipArchive(entries);
}

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { DatabaseSchema, getPublicStoreSnapshot } from './db.js';
import { createZipArchive, ZipEntryInput } from './wpExport.js';
import { generateMySqlDumpSql } from './mysql.js';

const BINARY_ALREADY_COMPRESSED_EXTS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.gif',
  '.woff',
  '.woff2',
  '.zip'
]);

function collectDirectoryEntries(
  absDir: string,
  zipPrefix: string,
  entries: ZipEntryInput[],
  seenPaths: Set<string>,
  ignoreNames: Set<string> = new Set()
): void {
  if (!fs.existsSync(absDir)) return;

  const items = fs.readdirSync(absDir, { withFileTypes: true });
  for (const item of items) {
    if (ignoreNames.has(item.name) || item.name === '.DS_Store') continue;

    const absChild = path.join(absDir, item.name);
    const relChild = zipPrefix ? `${zipPrefix}/${item.name}` : item.name;

    if (item.isDirectory()) {
      collectDirectoryEntries(absChild, relChild, entries, seenPaths, ignoreNames);
    } else if (item.isFile()) {
      const normalized = relChild.replace(/\\/g, '/');
      if (seenPaths.has(normalized)) continue;
      seenPaths.add(normalized);

      const ext = path.extname(item.name).toLowerCase();
      entries.push({
        filename: normalized,
        data: fs.readFileSync(absChild),
        compress: !BINARY_ALREADY_COMPRESSED_EXTS.has(ext)
      });
    }
  }
}

function ensureDistBuilt(): string {
  const distDir = path.resolve(process.cwd(), 'dist');
  const distIndex = path.join(distDir, 'index.html');
  if (!fs.existsSync(distIndex)) {
    execSync('npx vite build', {
      cwd: process.cwd(),
      stdio: 'pipe'
    });
  }
  return distDir;
}

/**
 * Builds `bdtechzen-netlify-deploy.zip`
 * Pre-built production `dist` archive ready for 1-click Drag & Drop at https://app.netlify.com/drop
 * (Netlify -> Sites -> Add new site -> Deploy manually).
 */
export function buildNetlifyDropZip(_db: DatabaseSchema): Buffer {
  const distDir = ensureDistBuilt();
  const entries: ZipEntryInput[] = [];
  const seen = new Set<string>();

  // 1. Always place fresh live store snapshot at data/store-snapshot.json
  const snapshotJson = JSON.stringify(getPublicStoreSnapshot(), null, 2);
  seen.add('data/store-snapshot.json');
  entries.push({
    filename: 'data/store-snapshot.json',
    data: Buffer.from(snapshotJson, 'utf-8'),
    compress: true
  });

  // 2. Always include SPA _redirects for Netlify manual Drop
  seen.add('_redirects');
  entries.push({
    filename: '_redirects',
    data: Buffer.from('/* /index.html 200\n', 'utf-8'),
    compress: false
  });

  // 3. Always include _headers for optimal Netlify CDN caching
  const headersText = [
    '/assets/*',
    '  Cache-Control: public, max-age=31536000, immutable',
    '/src/assets/images/*',
    '  Cache-Control: public, max-age=31536000, immutable',
    ''
  ].join('\n');
  seen.add('_headers');
  entries.push({
    filename: '_headers',
    data: Buffer.from(headersText, 'utf-8'),
    compress: false
  });

  // 4. Collect compiled Vite dist/ files (index.html, assets/*.js, assets/*.css, public files, etc.)
  collectDirectoryEntries(distDir, '', entries, seen);

  // 5. Guarantee all /src/assets/images/* photos are present even if dist was built earlier
  const srcImagesDir = path.resolve(process.cwd(), 'src', 'assets', 'images');
  collectDirectoryEntries(srcImagesDir, 'src/assets/images', entries, seen);

  return createZipArchive(entries);
}

/**
 * Builds `bdtechzen-netlify-fullstack.zip`
 * Complete source repository with `netlify.toml` + `netlify/functions/api.ts` Serverless Express API,
 * ready for GitHub -> Netlify CI/CD or `npx netlify-cli deploy --build --prod`.
 */
export function buildNetlifyFullStackZip(db: DatabaseSchema): Buffer {
  const rootDir = process.cwd();
  const entries: ZipEntryInput[] = [];
  const seen = new Set<string>();

  const rootFiles = [
    'netlify.toml',
    '.nvmrc',
    'package.json',
    'tsconfig.json',
    'vite.config.ts',
    'index.html',
    'server.ts',
    '.env.example',
    '.gitignore'
  ];

  for (const file of rootFiles) {
    const absFile = path.join(rootDir, file);
    if (fs.existsSync(absFile) && fs.statSync(absFile).isFile()) {
      seen.add(file);
      entries.push({
        filename: file,
        data: fs.readFileSync(absFile),
        compress: true
      });
    }
  }

  // Include netlify/functions, server/, public/, and src/
  collectDirectoryEntries(path.join(rootDir, 'netlify'), 'netlify', entries, seen);
  collectDirectoryEntries(path.join(rootDir, 'server'), 'server', entries, seen);
  collectDirectoryEntries(path.join(rootDir, 'public'), 'public', entries, seen);
  collectDirectoryEntries(path.join(rootDir, 'src'), 'src', entries, seen);

  // Sanitize any SMS API secret before writing seed JSON into a GitHub-ready archive
  const cleanDbCopy: DatabaseSchema = {
    ...db,
    settings: {
      ...db.settings,
      notifications: db.settings.notifications
        ? {
            ...db.settings.notifications,
            smsApiKey: ''
          }
        : undefined
    },
    orders: db.orders.slice(0, 10)
  };
  const seedPayload = Buffer.from(JSON.stringify(cleanDbCopy, null, 2), 'utf-8');

  // Include non-dotfile seed/store.json (survives GitHub Web Drag & Drop upload and bundles into Netlify Functions)
  seen.add('seed/store.json');
  entries.push({
    filename: 'seed/store.json',
    data: seedPayload,
    compress: true
  });

  seen.add('.data/store.json');
  entries.push({
    filename: '.data/store.json',
    data: seedPayload,
    compress: true
  });

  seen.add('database/bdtechzen_mysql.sql');
  entries.push({
    filename: 'database/bdtechzen_mysql.sql',
    data: Buffer.from(generateMySqlDumpSql(db), 'utf-8'),
    compress: true
  });

  const readmeMd = `# BDTechZen Footwear Storefront — Full-Stack (GitHub + Netlify Serverless + MySQL)

Complete full-stack React + Express + Netlify Serverless Functions + MySQL e-commerce platform for **BDTechZen**.

## Quick Deploy: GitHub -> Netlify

1. **Unzip** \`bdtechzen-netlify-fullstack.zip\` on your computer.
2. Create a new repository on [GitHub](https://github.com/new) and push the **contents** of this folder so \`package.json\` and \`netlify.toml\` are in the **root** of the repository.
3. Log in to [Netlify](https://app.netlify.com) -> **Add new site** -> **Import an existing project** -> **GitHub** -> select your repository.
4. Netlify automatically detects \`netlify.toml\`:
   - **Build command:** \`npm run build:netlify\`
   - **Publish directory:** \`dist\`
   - **Functions directory:** \`netlify/functions\`
   - **Node version:** \`22\`
5. **(Recommended for Permanent Cloud Database, Email & SMS)** Open **Site configuration -> Environment variables** in Netlify and add:
   - \`JWT_SECRET\` = any strong secret text (e.g. \`bdtechzen_live_secret_2026\`)
   - \`MYSQL_URL\` = \`mysql://user:password@host:4000/bdtechzen_store?ssl={"rejectUnauthorized":false}\` *(Free 5GB Cloud MySQL from TiDB Cloud Serverless or Aiven — tables & all 12 products auto-create on first request!)*
   - \`SMTP_HOST\`, \`SMTP_PORT\` (\`465\` or \`587\`), \`SMTP_USER\`, \`SMTP_PASS\`, \`SMTP_FROM\` *(e.g. Gmail App Password for \`khalil5172@gmail.com\`)*
   - \`SMS_API_URL\`, \`SMS_API_KEY\`, \`SMS_SENDER_ID\` *(Optional BulkSMSBD / GreenWeb API key)*
6. Click **Deploy site**!

- **Public Storefront:** \`https://<your-site>.netlify.app\`
- **API Health Check:** \`https://<your-site>.netlify.app/api/health\`
- **Admin Dashboard:** \`https://<your-site>.netlify.app/admin\` (\`krrahman\` / \`kr123456\`)
`;

  seen.add('README.md');
  entries.push({
    filename: 'README.md',
    data: Buffer.from(readmeMd, 'utf-8'),
    compress: true
  });

  seen.add('NETLIFY-DEPLOYMENT-GUIDE.txt');
  entries.push({
    filename: 'NETLIFY-DEPLOYMENT-GUIDE.txt',
    data: Buffer.from(readmeMd, 'utf-8'),
    compress: true
  });

  return createZipArchive(entries);
}

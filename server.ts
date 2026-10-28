import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { app, ensureServerBootstrapped, IS_SERVERLESS } from './server/apiApp.js';
import { getDatabase } from './server/db.js';
import {
  generateStandaloneFlexboxHtml,
  generateElementorFreeFlexboxJson,
  buildWordPressZipBundle
} from './server/wpExport.js';
import { buildInstallableWordPressThemeZip } from './server/wpThemeExport.js';
import { buildNetlifyDropZip, buildNetlifyFullStackZip } from './server/netlifyExport.js';
import { generateMySqlDumpSql } from './server/mysql.js';

export { app, ensureServerBootstrapped };

const isProduction = process.env.NODE_ENV === 'production';

/* -------------------------------------------------------------
 * DOWNLOAD & EXPORT PACKAGES (LOCAL / PREVIEW SERVER)
 * ------------------------------------------------------------*/

function getPublicBaseUrl(req: Request): string {
  const forwardedProto = (req.headers['x-forwarded-proto'] as string)?.split(',')[0]?.trim();
  const protocol = forwardedProto || req.protocol || 'https';
  const host = req.get('host') || 'localhost:3000';
  return `${protocol}://${host}`;
}

app.get(
  ['/download/bdtechzen-netlify-deploy.zip', '/api/export/bdtechzen-netlify-deploy.zip'],
  (_req: Request, res: Response) => {
    try {
      const db = getDatabase();
      const zipBuffer = buildNetlifyDropZip(db);
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="bdtechzen-netlify-deploy.zip"'
      );
      res.setHeader('Content-Length', String(zipBuffer.length));
      res.send(zipBuffer);
    } catch (err: any) {
      console.error('[Export Netlify Deploy ZIP] Failed:', err);
      res.status(500).json({ error: 'Failed to generate Netlify Drag-and-Drop ZIP.' });
    }
  }
);

app.get(
  ['/download/bdtechzen-netlify-fullstack.zip', '/api/export/bdtechzen-netlify-fullstack.zip'],
  (_req: Request, res: Response) => {
    try {
      const db = getDatabase();
      const zipBuffer = buildNetlifyFullStackZip(db);
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="bdtechzen-netlify-fullstack.zip"'
      );
      res.setHeader('Content-Length', String(zipBuffer.length));
      res.send(zipBuffer);
    } catch (err: any) {
      console.error('[Export Netlify Fullstack ZIP] Failed:', err);
      res.status(500).json({ error: 'Failed to generate Netlify Full-Stack Source ZIP.' });
    }
  }
);

app.get(
  ['/download/bdtechzen-wordpress-theme.zip', '/api/export/bdtechzen-wordpress-theme.zip'],
  (req: Request, res: Response) => {
    try {
      const db = getDatabase();
      const baseUrl = getPublicBaseUrl(req);
      const zipBuffer = buildInstallableWordPressThemeZip(db, baseUrl);
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="bdtechzen-wordpress-theme.zip"'
      );
      res.setHeader('Content-Length', String(zipBuffer.length));
      res.send(zipBuffer);
    } catch (err: any) {
      console.error('[Export WP Theme ZIP] Failed:', err);
      res.status(500).json({ error: 'Failed to generate installable WordPress Theme ZIP.' });
    }
  }
);

app.get(
  ['/download/bdtechzen-complete-website.zip', '/api/export/bdtechzen-wordpress-pack.zip'],
  (req: Request, res: Response) => {
    try {
      const db = getDatabase();
      const baseUrl = getPublicBaseUrl(req);
      const zipBuffer = buildWordPressZipBundle(db, baseUrl);
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="bdtechzen-complete-website.zip"'
      );
      res.setHeader('Content-Length', String(zipBuffer.length));
      res.send(zipBuffer);
    } catch (err: any) {
      console.error('[Export ZIP] Failed:', err);
      res.status(500).json({ error: 'Failed to generate complete website ZIP bundle.' });
    }
  }
);

app.get(
  [
    '/download/bdtechzen-elementor-free-flexbox.json',
    '/api/export/bdtechzen-elementor-free-flexbox.json'
  ],
  (req: Request, res: Response) => {
    try {
      const db = getDatabase();
      const baseUrl = getPublicBaseUrl(req);
      const template = generateElementorFreeFlexboxJson(db, baseUrl);
      const jsonStr = JSON.stringify(template, null, 2);
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="bdtechzen-elementor-free-flexbox.json"'
      );
      res.send(jsonStr);
    } catch (err: any) {
      console.error('[Export Elementor JSON] Failed:', err);
      res.status(500).json({ error: 'Failed to generate Elementor Free Flexbox JSON.' });
    }
  }
);

app.get(
  ['/download/bdtechzen-flexbox.html', '/api/export/bdtechzen-flexbox.html'],
  (req: Request, res: Response) => {
    try {
      const db = getDatabase();
      const baseUrl = getPublicBaseUrl(req);
      const html = generateStandaloneFlexboxHtml(db, {
        baseUrl,
        preferRelativeZipImages: false,
        bodySnippetOnly: false
      });
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="bdtechzen-flexbox.html"');
      res.send(html);
    } catch (err: any) {
      console.error('[Export HTML] Failed:', err);
      res.status(500).json({ error: 'Failed to generate standalone Flexbox HTML.' });
    }
  }
);

app.get('/download/bdtechzen-mysql.sql', (_req: Request, res: Response) => {
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

/* -------------------------------------------------------------
 * MOUNT VITE MIDDLEWARE (DEV) OR STATIC DIST (PROD)
 * ------------------------------------------------------------*/

async function startServer() {
  const db = await ensureServerBootstrapped();
  try {
    const sqlDir = path.resolve(process.cwd(), 'database');
    if (!fs.existsSync(sqlDir)) {
      fs.mkdirSync(sqlDir, { recursive: true });
    }
    fs.writeFileSync(path.join(sqlDir, 'bdtechzen_mysql.sql'), generateMySqlDumpSql(db), 'utf-8');
  } catch (err) {
    console.error('[MySQL Dump] Could not write database/bdtechzen_mysql.sql:', err);
  }

  if (!isProduction) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const rawPort = process.env.PORT;
  if (rawPort && Number.isNaN(Number(rawPort))) {
    app.listen(rawPort, () => {
      console.log(`[BDTechZen] Server listening on cPanel Passenger socket ${rawPort}`);
    });
  } else {
    const listenPort = process.env.DEFAULT_APP_PORT
      ? Number(process.env.DEFAULT_APP_PORT)
      : rawPort && rawPort !== process.env.NGINX_PORT
      ? Number(rawPort)
      : 3000;
    app.listen(listenPort, '0.0.0.0', () => {
      console.log(`[BDTechZen] Server running on http://0.0.0.0:${listenPort}`);
    });
  }
}

if (!IS_SERVERLESS) {
  startServer();
}

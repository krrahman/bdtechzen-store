import serverless from 'serverless-http';
import { app, ensureServerBootstrapped } from '../../server/apiApp.js';

const expressHandler = serverless(app);

function normalizeFunctionPath(rawPath: string): string {
  if (!rawPath) return '/api/health';

  if (rawPath === '/sitemap.xml' || rawPath === '/robots.txt') {
    return rawPath;
  }

  if (rawPath.startsWith('/.netlify/functions/api')) {
    const suffix = rawPath.slice('/.netlify/functions/api'.length);
    if (suffix === '/sitemap.xml' || suffix === '/robots.txt') {
      return suffix;
    }
    if (!suffix || suffix === '/') {
      return '/api/health';
    }
    return suffix.startsWith('/api') ? suffix : `/api${suffix.startsWith('/') ? suffix : `/${suffix}`}`;
  }

  return rawPath;
}

export const handler = async (event: any, context: any) => {
  if (context) {
    context.callbackWaitsForEmptyEventLoop = false;
  }

  await ensureServerBootstrapped();

  // Fallback to rawUrl pathname if event.path stripped the suffix
  if (
    event &&
    event.path === '/.netlify/functions/api' &&
    typeof event.rawUrl === 'string'
  ) {
    try {
      const parsed = new URL(event.rawUrl);
      if (parsed.pathname && parsed.pathname !== '/.netlify/functions/api') {
        event.path = parsed.pathname;
      }
    } catch {
      // Ignore invalid rawUrl
    }
  }

  if (typeof event?.path === 'string') {
    event.path = normalizeFunctionPath(event.path);
  }
  if (typeof event?.rawPath === 'string') {
    event.rawPath = normalizeFunctionPath(event.rawPath);
  }

  return expressHandler(event, context);
};

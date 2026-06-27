import {readEcosystemDomain} from './ecosystem-domains.js';

export const CODE_PRODUCTION_URL = 'https://code.spirzen.ru';
export const CODE_LOCAL_URL = 'http://localhost:4321';

export const CODE_TRUSTED_ORIGINS = [
  CODE_PRODUCTION_URL,
  CODE_LOCAL_URL,
  'http://127.0.0.1:4321',
];

export function getCodeBaseUrl() {
  if (import.meta.env?.DEV) {
    return CODE_LOCAL_URL;
  }
  return readEcosystemDomain('code', CODE_PRODUCTION_URL);
}

export function buildCodeEmbedUrl(baseUrl, example) {
  const slug = example.replace(/^\/+|\/+$/g, '');
  return `${baseUrl.replace(/\/$/, '')}/e/embed/${slug}/`;
}

export function buildCodePageUrl(baseUrl, example) {
  const slug = example.replace(/^\/+|\/+$/g, '');
  return `${baseUrl.replace(/\/$/, '')}/e/${slug}/`;
}

export function isTrustedCodeOrigin(origin, baseUrl) {
  if (CODE_TRUSTED_ORIGINS.includes(origin)) {
    return true;
  }
  try {
    return new URL(baseUrl).origin === origin;
  } catch {
    return false;
  }
}

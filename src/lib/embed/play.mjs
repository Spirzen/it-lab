import {readEcosystemDomain} from './ecosystem-domains.js';

export const PLAY_PRODUCTION_URL = 'https://play.spirzen.ru';
export const PLAY_LOCAL_URL = 'http://localhost:4322';

export const PLAY_TRUSTED_ORIGINS = [
  PLAY_PRODUCTION_URL,
  PLAY_LOCAL_URL,
  'http://127.0.0.1:4322',
];

export function getPlayBaseUrl() {
  if (import.meta.env?.DEV) {
    return PLAY_LOCAL_URL;
  }
  return readEcosystemDomain('play', PLAY_PRODUCTION_URL);
}

export function buildPlayEmbedUrl(baseUrl, example) {
  const slug = example.replace(/^\/+|\/+$/g, '');
  return `${baseUrl.replace(/\/$/, '')}/p/embed/${slug}/`;
}

export function buildPlayPageUrl(baseUrl, example) {
  const slug = example.replace(/^\/+|\/+$/g, '');
  return `${baseUrl.replace(/\/$/, '')}/p/${slug}/`;
}

export function isTrustedPlayOrigin(origin, baseUrl) {
  if (PLAY_TRUSTED_ORIGINS.includes(origin)) {
    return true;
  }
  try {
    return new URL(baseUrl).origin === origin;
  } catch {
    return false;
  }
}

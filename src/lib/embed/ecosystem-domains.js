/** @param {string} key @param {string} fallback */
export function readEcosystemDomain(key, fallback) {
  if (typeof document === 'undefined') {
    return fallback;
  }
  try {
    const raw = document.getElementById('itu-ecosystem-config')?.textContent;
    const cfg = JSON.parse(raw || '{}');
    return cfg.domains?.[key] || fallback;
  } catch {
    return fallback;
  }
}

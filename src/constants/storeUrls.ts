import { Config } from './config';

/** Resolved URL for App Store badge (env or web landing). */
export function getAppStoreUrl(): string {
  return Config.APP_STORE_URL || Config.STORE_WEB_LANDING_URL;
}

/** Resolved URL for Play Store badge (env or web landing). */
export function getPlayStoreUrl(): string {
  return Config.PLAY_STORE_URL || Config.STORE_WEB_LANDING_URL;
}

/** Short line for the share card (no https://). */
export function getStoreShareLinkLine(): string {
  try {
    const u = new URL(Config.STORE_WEB_LANDING_URL);
    return u.host + u.pathname.replace(/\/$/, '') || 'thygita.app';
  } catch {
    return 'thygita.app';
  }
}

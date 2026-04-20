import { Config } from './config';

/** Resolved URL for App Store badge (env or web landing). */
export function getAppStoreUrl(): string {
  return Config.APP_STORE_URL || Config.STORE_WEB_LANDING_URL;
}

/** Resolved URL for Play Store (env override, else public Play listing for this package). */
export function getPlayStoreUrl(): string {
  if (Config.PLAY_STORE_URL) return Config.PLAY_STORE_URL;
  const id = Config.ANDROID_PACKAGE_ID;
  if (id) return `https://play.google.com/store/apps/details?id=${encodeURIComponent(id)}`;
  return Config.STORE_WEB_LANDING_URL;
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

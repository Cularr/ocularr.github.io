import { useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';

type UserAgentNavigator = Navigator & {
  userAgentData?: { mobile: boolean };
};

export const DEMO_BASE = '/demo';
export const SMALL_SCREEN = '(max-width: 768px)';
export const PORTRAIT_SCREEN = '(max-width: 599px) and (orientation: portrait)';
export const DEMO_WIDTH = 1130;
export const DEMO_HEIGHT = 637;
export const PHONE_WIDTH = 430;
export const PHONE_HEIGHT = 760;
const PHONE_USER_AGENT = /iPhone|iPod|Android.+Mobile|Windows Phone/i;

export function routeUrl(route: string) {
  return route === '/'
    ? `${DEMO_BASE}/`
    : `${DEMO_BASE}/?route=${encodeURIComponent(route)}`;
}

export function currentTheme(): Theme {
  return document.documentElement.getAttribute('data-theme') === 'dark'
    ? 'dark'
    : 'light';
}

export function isPhoneDevice() {
  const { userAgentData, userAgent } = navigator as UserAgentNavigator;

  return userAgentData
    ? userAgentData.mobile
    : PHONE_USER_AGENT.test(userAgent);
}

export function framePath(frame: HTMLIFrameElement | null) {
  try {
    const pathname = frame?.contentWindow?.location.pathname ?? DEMO_BASE;

    return pathname.replace(DEMO_BASE, '').replace(/\/$/, '') || '/';
  } catch {
    return '/';
  }
}

export function whenIdle(callback: () => void) {
  if (typeof window.requestIdleCallback === 'function') {
    const handle = window.requestIdleCallback(callback, { timeout: 2500 });

    return () => window.cancelIdleCallback(handle);
  }

  const handle = window.setTimeout(callback, 1200);

  return () => window.clearTimeout(handle);
}

export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(
    () => window.matchMedia(query).matches
  );

  useEffect(() => {
    const list = window.matchMedia(query);
    const handleChange = () => setMatches(list.matches);

    list.addEventListener('change', handleChange);

    return () => {
      list.removeEventListener('change', handleChange);
    };
  }, [query]);

  return matches;
}

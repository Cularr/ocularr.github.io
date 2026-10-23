export type PlatformId =
  | 'windows'
  | 'macos'
  | 'linux'
  | 'docker'
  | 'nas'
  | 'other';

export interface Variant {
  id: string;
  name: string;
}

export interface Platform {
  id: PlatformId;
  name: string;
  variants: Variant[];
}

export const platforms: Platform[] = [
  { id: 'windows', name: 'Windows', variants: [] },
  { id: 'macos', name: 'macOS', variants: [] },
  {
    id: 'linux',
    name: 'Linux',
    variants: [
      { id: 'debian', name: 'Debian' },
      { id: 'ubuntu', name: 'Ubuntu' },
      { id: 'archlinux', name: 'Arch Linux' },
      { id: 'gentoo', name: 'Gentoo' },
      { id: 'freebsd', name: 'FreeBSD' },
      { id: 'other', name: 'Other' },
    ],
  },
  { id: 'docker', name: 'Docker', variants: [] },
  {
    id: 'nas',
    name: 'NAS',
    variants: [
      { id: 'synology', name: 'Synology' },
      { id: 'qnap', name: 'QNAP' },
      { id: 'other', name: 'Other' },
    ],
  },
  { id: 'other', name: 'Other', variants: [] },
];

export interface Selection {
  platform: PlatformId;
  variant: string | null;
}

function defaultVariant(platform: Platform) {
  return platform.variants[0]?.id ?? null;
}

export function isMobileDevice() {
  const agent = navigator.userAgent.toLowerCase();

  return (
    /android|iphone|ipod/.test(agent) ||
    (agent.includes('mac os') && navigator.maxTouchPoints > 1)
  );
}

export function wantsAlternatives(hash: string) {
  return /-alternatives$/i.test(hash);
}

export function detectSelection(): Selection {
  const agent = navigator.userAgent.toLowerCase();

  const isTouchDevice = navigator.maxTouchPoints > 1;

  if (isMobileDevice()) {
    return { platform: 'docker', variant: null };
  }

  if (agent.includes('mac os') && !agent.includes('iphone') && !isTouchDevice) {
    return { platform: 'macos', variant: null };
  }

  if (agent.includes('linux') && !agent.includes('android')) {
    return { platform: 'linux', variant: 'debian' };
  }

  return { platform: 'windows', variant: null };
}

export function parseHash(hash: string): Selection | null {
  const match = hash
    .toLowerCase()
    .match(/^#downloads?-([a-z]+)(?:-([a-z]+))?(?:-alternatives)?$/);

  if (!match) {
    return null;
  }

  const platform = platforms.find((p) => p.id === match[1]);

  if (!platform) {
    return null;
  }

  const variant = platform.variants.find((v) => v.id === match[2]);

  return {
    platform: platform.id,
    variant: variant?.id ?? defaultVariant(platform),
  };
}

export function toHash(selection: Selection) {
  return selection.variant
    ? `#downloads-${selection.platform}-${selection.variant}`
    : `#downloads-${selection.platform}`;
}

export function selectPlatform(platformId: PlatformId): Selection {
  const platform = platforms.find((p) => p.id === platformId);

  return {
    platform: platformId,
    variant: platform ? defaultVariant(platform) : null,
  };
}

export function platformName(selection: Selection) {
  return platforms.find((p) => p.id === selection.platform)?.name ?? '';
}

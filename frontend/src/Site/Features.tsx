import {
  CalendarDays,
  CircleArrowUp,
  LayoutGrid,
  LucideIcon,
  RotateCcw,
  SlidersHorizontal,
  UserSearch,
} from 'lucide-react';
import React from 'react';
import Section from 'Components/Section';
import FeatureItem from './FeatureItem';
import styles from './Features.module.css';

export interface Feature {
  id: string;
  route: string;
  icon: LucideIcon;
  title: string;
  text: string;
}

const FEATURES: Feature[] = [
  {
    id: 'calendar',
    route: '/calendar',
    icon: CalendarDays,
    title: 'Calendar',
    text: 'Every upcoming episode in one place, colored by whether it is on disk, downloading or missing.',
  },
  {
    id: 'search',
    route: '/series/slow-horses',
    icon: UserSearch,
    title: 'Manual search',
    text: 'See every release for an episode, compare quality, size and peers, and send the one you want to your download client.',
  },
  {
    id: 'failed',
    route: '/activity/queue',
    icon: RotateCcw,
    title: 'Failed download handling',
    text: 'When a download is password protected, missing repair blocks or broken in some other way, Sonarr blocklists the release and tries another one.',
  },
  {
    id: 'profiles',
    route: '/settings/profiles',
    icon: SlidersHorizontal,
    title: 'Quality profiles',
    text: 'Choose exactly which qualities you want, in which order, and when Sonarr should stop upgrading.',
  },
  {
    id: 'series',
    route: '/',
    icon: LayoutGrid,
    title: 'Series views',
    text: 'Posters, overview or table. Every series and season shows how many episodes you have.',
  },
  {
    id: 'updates',
    route: '/system/updates',
    icon: CircleArrowUp,
    title: 'Built-in updater',
    text: 'Read what changed and update from inside Sonarr, without reinstalling.',
  },
];

const INTEGRATIONS = [
  {
    title: 'Download clients',
    items:
      'SABnzbd, NZBGet, qBittorrent, Transmission, Deluge, rTorrent and more',
  },
  {
    title: 'Media servers and notifications',
    items:
      'Plex, Kodi, Emby, Jellyfin, Discord, Telegram, Pushover, email and more',
  },
  {
    title: 'Import lists',
    items: 'Trakt, Plex Watchlist, IMDb lists, AniList, MyAnimeList and more',
  },
  {
    title: 'Everything else',
    items:
      'Custom formats, renaming, specials, multi-episode releases and a full REST API',
  },
];

interface FeaturesProps {
  onShowFeature: (route: string) => void;
}

function Features({ onShowFeature }: FeaturesProps) {
  return (
    <Section
      id="features"
      title="Features"
      lede="Add your shows once. Sonarr keeps checking for new episodes and better releases, and handles the rest."
    >
      <ul className={styles.list}>
        {FEATURES.map((feature) => (
          <FeatureItem
            key={feature.id}
            feature={feature}
            onShowPress={onShowFeature}
          />
        ))}
      </ul>

      <div className={styles.integrations}>
        <h3 className={styles.subtitle}>Works with</h3>
        <dl className={styles.table}>
          {INTEGRATIONS.map((item) => (
            <div key={item.title} className={styles.row}>
              <dt>{item.title}</dt>
              <dd>{item.items}</dd>
            </div>
          ))}
        </dl>
      </div>
    </Section>
  );
}

export default Features;

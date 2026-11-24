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
    text: 'Announced volume releases in one place, colored by whether they are on disk, downloading or missing.',
  },
  {
    id: 'search',
    route: '/series/witch-hat-atelier',
    icon: UserSearch,
    title: 'Manual search',
    text: 'See every release for a chapter or volume, compare quality, size and peers, and send the one you want to your download client.',
  },
  {
    id: 'failed',
    route: '/activity/queue',
    icon: RotateCcw,
    title: 'Failed download handling',
    text: 'When a download is password protected, missing repair blocks or broken in some other way, Ocularr blocklists the release and tries another one.',
  },
  {
    id: 'profiles',
    route: '/settings/profiles',
    icon: SlidersHorizontal,
    title: 'Quality profiles',
    text: 'Rank scans, web rips, digital and retail releases by quality, and decide when Ocularr should stop upgrading.',
  },
  {
    id: 'series',
    route: '/',
    icon: LayoutGrid,
    title: 'Series views',
    text: 'Covers, overview or table. Every series and volume shows how many chapters you have.',
  },
  {
    id: 'updates',
    route: '/system/updates',
    icon: CircleArrowUp,
    title: 'Built-in updater',
    text: 'Read what changed and update from inside Ocularr, without reinstalling.',
  },
];

const INTEGRATIONS = [
  {
    title: 'Download clients',
    items:
      'SABnzbd, NZBGet, qBittorrent, Transmission, Deluge, rTorrent, plugins and more',
  },
  {
    title: 'Media servers and notifications',
    items:
      'Komga, Kavita, Emby, Jellyfin, Discord, Telegram, Pushover, ntfy, Apprise, email and more',
  },
  {
    title: 'Import lists',
    items: 'MangaBaka, AniList, MyAnimeList, custom lists and RSS',
  },
  {
    title: 'Everything else',
    items:
      'Custom formats, renaming, multi-chapter and volume releases, Mylar-compatible metadata and a full REST API',
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
      lede="Add your manga and comics once. Ocularr keeps checking for new chapters, issues and better releases, and handles the rest."
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

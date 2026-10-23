import {
  ArrowUpRight,
  BookOpen,
  Bug,
  Hash,
  Heart,
  LucideIcon,
  MessageCircle,
  MessagesSquare,
  Users,
} from 'lucide-react';
import React from 'react';
import Section from 'Components/Section';
import styles from './Support.module.css';

interface SupportLink {
  icon: LucideIcon;
  title: string;
  text: string;
  href: string;
  address: string;
}

const LINKS: SupportLink[] = [
  {
    icon: BookOpen,
    title: 'Wiki',
    text: 'FAQ, setup guides and troubleshooting.',
    href: 'https://wiki.servarr.com/sonarr',
    address: 'wiki.servarr.com/sonarr',
  },
  {
    icon: MessageCircle,
    title: 'Discord',
    text: 'Chat with other users and the developers.',
    href: 'https://discord.sonarr.tv',
    address: 'discord.sonarr.tv',
  },
  {
    icon: MessagesSquare,
    title: 'Forums',
    text: 'Ask questions and search older answers.',
    href: 'https://forums.sonarr.tv',
    address: 'forums.sonarr.tv',
  },
  {
    icon: Users,
    title: 'Reddit',
    text: 'Share setups and talk about Sonarr.',
    href: 'https://www.reddit.com/r/sonarr',
    address: 'r/sonarr',
  },
  {
    icon: Hash,
    title: 'IRC',
    text: 'The #sonarr channel on Libera.Chat.',
    href: 'https://web.libera.chat/?channels=#sonarr',
    address: 'irc.libera.chat #sonarr',
  },
  {
    icon: Bug,
    title: 'GitHub Issues',
    text: 'Bug reports and feature requests only.',
    href: 'https://github.com/Sonarr/Sonarr/issues',
    address: 'github.com/Sonarr/Sonarr',
  },
];

function Support() {
  return (
    <>
      <Section
        id="support"
        title="Support"
        lede="Most questions are answered in the wiki. For anything else, Discord and the forums are the quickest way to reach other users and the team."
      >
        <ul className={styles.links}>
          {LINKS.map(({ icon: Icon, title, text, href, address }) => (
            <li key={title} className={styles.item}>
              <a className={styles.link} href={href}>
                <span className={styles.linkTitle}>
                  <Icon className={styles.icon} size={18} strokeWidth={1.75} />
                  {title}
                  <ArrowUpRight className={styles.arrow} size={16} />
                </span>
                <span className={styles.text}>{text}</span>
                <span className={styles.address}>{address}</span>
              </a>
            </li>
          ))}
        </ul>
      </Section>

      <Section
        title="Donate"
        lede="Sonarr is built by volunteers in their spare time."
      >
        <div className={styles.donate}>
          <p className={styles.donateText}>
            Donations pay for the servers Sonarr relies on for metadata and
            updates, and support development. Every expense on Open Collective
            is public.
          </p>
          <div className={styles.donateActions}>
            <a
              className={styles.donateButton}
              href="https://opencollective.com/sonarr"
            >
              <Heart size={16} />
              Donate on Open Collective
            </a>
            <a className={styles.donateLink} href="/donate.html">
              Other ways to donate
            </a>
          </div>
        </div>
      </Section>
    </>
  );
}

export default Support;

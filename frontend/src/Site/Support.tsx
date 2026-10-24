import {
  ArrowUpRight,
  BookOpen,
  Bug,
  Heart,
  LucideIcon,
  MessageCircle,
  Users,
} from 'lucide-react';
import React from 'react';
import Section from 'Components/Section';
import Note from 'Download/Components/Note';
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
    text: 'The Servarr wiki. Ocularr works like Sonarr, so most guides apply.',
    href: 'https://wiki.servarr.com/',
    address: 'wiki.servarr.com',
  },
  {
    icon: Bug,
    title: 'GitHub Issues',
    text: 'Bug reports and feature requests for Ocularr.',
    href: 'https://github.com/cularr/ocularr/issues',
    address: 'github.com/cularr/ocularr',
  },
  {
    icon: MessageCircle,
    title: 'Discord',
    text: 'Ocularr has no Discord of its own. General questions about the *arr stack can be asked on the Servarr Discord.',
    href: 'https://radarr.video/discord',
    address: 'Servarr Discord',
  },
  {
    icon: Users,
    title: 'Reddit',
    text: 'Talk about the *arr stack with other users.',
    href: 'https://www.reddit.com/r/servarr',
    address: 'r/servarr',
  },
];

function Support() {
  return (
    <>
      <Section
        id="support"
        title="Support"
        lede="Bugs and feature requests go to GitHub Issues. For general questions about the *arr stack, the Servarr wiki and community are the place to look."
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
        <div className={styles.notice}>
          <Note kind="warning" title="Not supported by the Servarr team">
            Ocularr is an independent fork. The Servarr team does not support it
            and only answers general questions about the *arr stack. Please do
            not ask them about Ocularr-specific problems.
          </Note>
        </div>
      </Section>

      <Section
        title="Donate"
        lede="Ocularr does not accept donations at the moment."
      >
        <div className={styles.donate}>
          <p className={styles.donateText}>
            Ocularr is built on Sonarr. If you want to give something back,
            consider donating to Sonarr instead. Donations pay for the servers
            Sonarr relies on and support its development. Every expense on Open
            Collective is public.
          </p>
          <div className={styles.donateActions}>
            <a
              className={styles.donateButton}
              href="https://opencollective.com/sonarr"
            >
              <Heart size={16} />
              Donate to Sonarr on Open Collective
            </a>
          </div>
        </div>
      </Section>
    </>
  );
}

export default Support;

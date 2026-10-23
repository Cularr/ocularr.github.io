import { ArrowDownToLine } from 'lucide-react';
import React from 'react';
import styles from './DownloadLinks.module.css';

export interface DownloadLinkItem {
  label: string;
  detail: string;
  href: string;
}

interface DownloadLinksProps {
  links: DownloadLinkItem[];
}

function DownloadLinks({ links }: DownloadLinksProps) {
  return (
    <div className={styles.links}>
      {links.map((link, index) => (
        <a
          key={link.href}
          className={index === 0 ? styles.primary : styles.link}
          href={link.href}
        >
          <ArrowDownToLine size={18} />
          <span className={styles.text}>
            <span className={styles.label}>{link.label}</span>
            <span className={styles.detail}>{link.detail}</span>
          </span>
        </a>
      ))}
    </div>
  );
}

export default DownloadLinks;

import React from 'react';
import Logo from 'Components/Logo';
import styles from './SiteFooter.module.css';

function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <Logo size={32} />
          <div className={styles.brandText}>
            <span className={styles.name}>Sonarr</span>
            <span>
              Free and open source, released under the GPL-3.0 license.
            </span>
          </div>
        </div>
        <nav className={styles.links} aria-label="Footer">
          <a href="https://github.com/Sonarr/Sonarr">GitHub</a>
          <a href="/docs/api/">API docs</a>
          <a href="https://wiki.servarr.com/sonarr">Wiki</a>
          <a href="https://discord.sonarr.tv">Discord</a>
          <a href="/donate">Donate</a>
        </nav>
      </div>
    </footer>
  );
}

export default SiteFooter;

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
            <span className={styles.name}>Ocularr</span>
            <span>
              Free and open source, released under the GPL-3.0 license. A fork
              of Sonarr, not affiliated with Team Sonarr or Servarr.
            </span>
          </div>
        </div>
        <nav className={styles.links} aria-label="Footer">
          <a href="https://github.com/cularr/ocularr">GitHub</a>
          <a href="/docs/api/">API docs</a>
          <a href="https://wiki.servarr.com/">Wiki</a>
          <a href="https://opencollective.com/sonarr">Donate to Sonarr</a>
        </nav>
        <p className={styles.copyright}>
          © {new Date().getFullYear()} Ocularr. Website design inspired by{' '}
          <a href="https://sonarr.tv">sonarr.tv</a>.
        </p>
      </div>
    </footer>
  );
}

export default SiteFooter;

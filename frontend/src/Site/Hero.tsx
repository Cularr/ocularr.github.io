import { ArrowDownToLine, Github } from 'lucide-react';
import React, { useCallback } from 'react';
import {
  isMobileDevice,
  platformName,
  Selection,
  toHash,
} from 'Download/platforms';
import DemoFrame, { DemoRequest } from './DemoFrame';
import styles from './Hero.module.css';

interface HeroProps {
  selection: Selection;
  demoRequest: DemoRequest | null;
}

function Hero({ selection, demoRequest }: HeroProps) {
  const handleDownloadPress = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      window.history.replaceState(null, '', toHash(selection));
      document.getElementById('download')?.scrollIntoView();
    },
    [selection]
  );

  return (
    <section id="home" className={styles.hero}>
      <div className={styles.inner}>
        <div className={styles.intro}>
          <h1 className={styles.title}>
            Ocularr is an automatic pull list for manga and comics.
          </h1>
          <div className={styles.side}>
            <p className={styles.lede}>
              It watches Usenet and BitTorrent RSS feeds for new chapters and
              issues of the series you follow, grabs them, sorts them and
              renames them. When a better release comes along, it upgrades the
              file you already have. Bring your own reader.
            </p>
            <div className={styles.actions}>
              <a
                className={styles.primary}
                href={toHash(selection)}
                onClick={handleDownloadPress}
              >
                <ArrowDownToLine size={18} />
                {isMobileDevice()
                  ? 'See install options'
                  : `Download for ${platformName(selection)}`}
              </a>
              <a
                className={styles.secondary}
                href="https://github.com/cularr/ocularr"
              >
                <Github size={18} />
                Source on GitHub
              </a>
            </div>
            <p className={styles.facts}>
              Free and open source under GPL-3.0. A fork of Sonarr for manga and
              comics. Runs on Windows, macOS, Linux, Docker and most NAS
              devices.
            </p>
          </div>
        </div>

        <div id="demo" className={styles.demo}>
          <DemoFrame request={demoRequest} />
          <p className={styles.caption}>
            <strong>Try it here.</strong> This is the Ocularr interface, running
            in your browser with a sample library. Open a series, search for a
            chapter, grab a release and watch it download and import.
          </p>
        </div>
      </div>
    </section>
  );
}

export default Hero;

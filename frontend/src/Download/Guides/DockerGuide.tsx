import React from 'react';
import CodeBlock from 'Components/CodeBlock';
import Guide from 'Download/Components/Guide';
import Note from 'Download/Components/Note';
import Step from 'Download/Components/Step';
import Steps from 'Download/Components/Steps';
import ViewSonarr from 'Download/Components/ViewSonarr';
import styles from './DockerGuide.module.css';

function DockerGuide() {
  return (
    <Guide
      maintainers={[
        { name: 'linuxserver', href: 'https://www.linuxserver.io' },
        { name: 'hotio', href: 'https://hotio.dev' },
      ]}
      intro={
        <p>
          Team Sonarr does not publish an official Docker image, but several
          third parties maintain one. These steps apply to any Sonarr image.
        </p>
      }
      upgrade={
        <Note title="Upgrading from v3">
          Most images mount the data directory at <code>/config</code> and pass
          it to Sonarr. Sonarr converts an existing database found there on
          startup. Back it up first.
        </Note>
      }
    >
      <Steps>
        <Step number={1} title="Plan your volumes and permissions">
          <p>
            Two problems cause most Docker trouble. The download client and
            Sonarr see different paths for the same file, and separate volumes
            for downloads and media stop fast moves and hard links.
          </p>
          <p>
            Your download client might report{' '}
            <code>/torrents/My.Show.S01E01/</code> while Sonarr sees it at{' '}
            <code>/downloads/My.Show.S01E01/</code>. Mounting <code>/tv</code>{' '}
            and <code>/downloads</code> separately makes them two file systems
            inside the container, so every import is a slow copy.
          </p>
          <p>
            Use one shared volume, such as <code>/data</code>, in every
            container:
          </p>
          <div className={styles.tree}>
            <span>/data</span>
            <span>├── tv</span>
            <span>└── downloads</span>
            <span>&nbsp;&nbsp;&nbsp;&nbsp;├── torrents</span>
            <span>&nbsp;&nbsp;&nbsp;&nbsp;└── usenet</span>
          </div>
          <p>
            If you cannot, set up a Remote Path Mapping in Sonarr under Settings
            › Download Clients. Also give all related containers a common group
            so each can read and write the shared folders. Sonarr needs write
            access to both the download and the series folders. The{' '}
            <a href="https://wiki.servarr.com/docker-guide">Docker guide</a> on
            the wiki explains this in detail.
          </p>
        </Step>
        <Step number={2} title="Pick an image and start it">
          <div className={styles.images}>
            <div className={styles.image}>
              <a href="https://hotio.dev/containers/sonarr">
                ghcr.io/hotio/sonarr:release
              </a>
              <p>
                Declares only <code>/config</code> as a volume and rebuilds
                several times an hour when upstream changes.
              </p>
            </div>
            <div className={styles.image}>
              <a href="https://docs.linuxserver.io/images/docker-sonarr">
                ghcr.io/linuxserver/sonarr:latest
              </a>
              <p>
                From one of the most popular image maintainers, who also package
                most download clients. Its default <code>/tv</code> and{' '}
                <code>/downloads</code> volumes are not recommended; use a
                single data volume as above.
              </p>
            </div>
          </div>
          <CodeBlock
            variants={[
              {
                label: 'docker run',
                code: [
                  'docker run -d --name sonarr \\',
                  '  -p 8989:8989 \\',
                  '  -e PUID=1000 -e PGID=1000 -e UMASK=002 \\',
                  '  -v /path/to/config:/config \\',
                  '  -v /path/to/data:/data \\',
                  '  --restart unless-stopped \\',
                  '  ghcr.io/hotio/sonarr:release',
                ].join('\n'),
              },
              {
                label: 'compose',
                code: [
                  'services:',
                  '  sonarr:',
                  '    image: ghcr.io/hotio/sonarr:release',
                  '    ports:',
                  '      - 8989:8989',
                  '    environment:',
                  '      - PUID=1000',
                  '      - PGID=1000',
                  '      - UMASK=002',
                  '    volumes:',
                  '      - /path/to/config:/config',
                  '      - /path/to/data:/data',
                  '    restart: unless-stopped',
                ].join('\n'),
              },
            ]}
            prompt=" "
          />
        </Step>
        <ViewSonarr number={3} />
      </Steps>
    </Guide>
  );
}

export default DockerGuide;

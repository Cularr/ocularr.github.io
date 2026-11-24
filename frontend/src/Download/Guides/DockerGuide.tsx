import React from 'react';
import CodeBlock from 'Components/CodeBlock';
import Guide from 'Download/Components/Guide';
import Note from 'Download/Components/Note';
import Step from 'Download/Components/Step';
import Steps from 'Download/Components/Steps';
import ViewOcularr from 'Download/Components/ViewOcularr';
import styles from './DockerGuide.module.css';

function DockerGuide() {
  return (
    <Guide
      // Disabled until images exist
      // maintainers={[
      //   { name: 'linuxserver', href: 'https://www.linuxserver.io' },
      //   { name: 'hotio', href: 'https://hotio.dev' },
      // ]}
      intro={
        <>
          <Note kind="warning" title="No Docker images yet">
            <p>
              We don&apos;t publish Docker images, and we don&apos;t plan to
              release our own for now. If you want one, please contact{' '}
              <a href="https://hotio.dev">hotio</a> or{' '}
              <a href="https://www.linuxserver.io">linuxserver</a>.
            </p>
            <p>
              There are currently no known Docker builds of Ocularr. If you
              maintain one, <a href="#support">get in touch</a>.
            </p>
          </Note>
          <p>These steps apply to any Ocularr image.</p>
        </>
      }
    >
      <Steps>
        <Step number={1} title="Plan your volumes and permissions">
          <p>
            Two problems cause most Docker trouble. The download client and
            Ocularr see different paths for the same file, and separate volumes
            for downloads and media stop fast moves and hard links.
          </p>
          <p>
            Your download client might report{' '}
            <code>/torrents/One.Piece.v105/</code> while Ocularr sees it at{' '}
            <code>/downloads/One.Piece.v105/</code>. Mounting{' '}
            <code>/manga</code> and <code>/downloads</code> separately makes
            them two file systems inside the container, so every import is a
            slow copy.
          </p>
          <p>
            Use one shared volume, such as <code>/data</code>, in every
            container:
          </p>
          <div className={styles.tree}>
            <span>/data</span>
            <span>├── manga</span>
            <span>└── downloads</span>
            <span>&nbsp;&nbsp;&nbsp;&nbsp;├── torrents</span>
            <span>&nbsp;&nbsp;&nbsp;&nbsp;├── usenet</span>
            <span>&nbsp;&nbsp;&nbsp;&nbsp;└── plugins</span>
          </div>
          <p>
            If you cannot, set up a Remote Path Mapping in Ocularr under
            Settings › Download Clients. Also give all related containers a
            common group so each can read and write the shared folders. Ocularr
            needs write access to both the download and the series folders. The{' '}
            <a href="https://wiki.servarr.com/docker-guide">Docker guide</a> on
            the wiki explains this in detail.
          </p>
        </Step>
        <Step number={2} title="Start the container">
          {/* Disabled until images exist
          <div className={styles.images}>
            <div className={styles.image}>
              <a href="https://hotio.dev/containers/ocularr">
                ghcr.io/hotio/ocularr:release
              </a>
              <p>
                Declares only <code>/config</code> as a volume and rebuilds
                several times an hour when upstream changes.
              </p>
            </div>
            <div className={styles.image}>
              <a href="https://docs.linuxserver.io/images/docker-ocularr">
                ghcr.io/linuxserver/ocularr:latest
              </a>
              <p>
                From one of the most popular image maintainers, who also package
                most download clients. Its default <code>/manga</code> and{' '}
                <code>/downloads</code> volumes are not recommended; use a
                single data volume as above.
              </p>
            </div>
          </div>
          */}
          <CodeBlock
            variants={[
              {
                label: 'docker run',
                code: [
                  'docker run -d --name ocularr \\',
                  '  -p 8484:8484 \\',
                  '  -e PUID=1000 -e PGID=1000 -e UMASK=002 \\',
                  '  -v /path/to/config:/config \\',
                  '  -v /path/to/data:/data \\',
                  '  --restart unless-stopped \\',
                  // '  ghcr.io/hotio/ocularr:release',
                  '  <ocularr-image>',
                ].join('\n'),
              },
              {
                label: 'compose',
                code: [
                  'services:',
                  '  ocularr:',
                  // '    image: ghcr.io/hotio/ocularr:release',
                  '    image: <ocularr-image>',
                  '    ports:',
                  '      - 8484:8484',
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
        <ViewOcularr number={3} />
      </Steps>
    </Guide>
  );
}

export default DockerGuide;

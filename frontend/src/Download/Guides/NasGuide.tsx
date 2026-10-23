import React from 'react';
import DownloadLinks from 'Download/Components/DownloadLinks';
import Guide from 'Download/Components/Guide';
import downloadUrl from 'Download/downloadUrl';

interface NasGuideProps {
  nas: 'synology' | 'qnap' | 'other';
}

function NasGuide({ nas }: NasGuideProps) {
  if (nas === 'synology') {
    return (
      <Guide
        intro={
          <>
            <p>
              A Sonarr package for Synology is maintained by{' '}
              <a href="https://synocommunity.com/">SynoCommunity</a>. Add their
              package source in Package Center to install it.
            </p>
            <p>
              Maintain that package? <a href="#support">Get in touch</a> and we
              will add full install steps here.
            </p>
          </>
        }
      />
    );
  }

  if (nas === 'qnap') {
    return (
      <Guide
        intro={
          <>
            <p>
              The Sonarr QNAP package is maintained by the QNAP forum community.
            </p>
            <p>
              Maintain that package? <a href="#support">Get in touch</a> and we
              will add full install steps here.
            </p>
          </>
        }
      />
    );
  }

  return (
    <Guide
      intro={
        <>
          <p>
            Most NAS systems can run Sonarr in{' '}
            <a href="#downloads-docker">Docker</a>. A generic Linux build is
            also available, but you will need to handle dependencies,
            installation and permissions yourself.
          </p>
          <p>
            Want to port Sonarr to another NAS?{' '}
            <a href="#support">Get in touch</a>.
          </p>
        </>
      }
    >
      <DownloadLinks
        links={[
          {
            label: 'Linux',
            detail: '.tar.gz',
            href: downloadUrl({ os: 'linux' }),
          },
        ]}
      />
    </Guide>
  );
}

export default NasGuide;

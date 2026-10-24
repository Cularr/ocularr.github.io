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
              There is no Ocularr package for Synology yet. If you would like
              one, please contact{' '}
              <a href="https://synocommunity.com/">SynoCommunity</a>.
            </p>
            <p>
              Maintain an Ocularr package? <a href="#support">Get in touch</a>{' '}
              and we will add full install steps here.
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
              The Ocularr QNAP package is maintained by the QNAP forum
              community.
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
            Please <a href="#support">contact us</a> if you wish to port Ocularr
            to any other NAS than the ones already listed.
          </p>
          <p>
            A generic download is available for Linux, but dependencies,
            installation and permissions will need to be done manually.
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

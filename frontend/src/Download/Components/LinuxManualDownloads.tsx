import React from 'react';
import downloadUrl from 'Download/downloadUrl';
import DownloadLinks from './DownloadLinks';

function LinuxManualDownloads() {
  return (
    <DownloadLinks
      links={[
        {
          label: 'Linux x64',
          detail: 'amd64 .tar.gz',
          href: downloadUrl({ os: 'linux', arch: 'x64' }),
        },
        {
          label: 'Linux ARM64',
          detail: 'arm64 .tar.gz',
          href: downloadUrl({ os: 'linux', arch: 'arm64' }),
        },
        {
          label: 'Linux ARM',
          detail: 'arm, armf, armhf .tar.gz',
          href: downloadUrl({ os: 'linux', arch: 'arm' }),
        },
      ]}
    />
  );
}

export default LinuxManualDownloads;

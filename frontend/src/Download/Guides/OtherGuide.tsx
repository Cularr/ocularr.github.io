import React from 'react';
import Guide from 'Download/Components/Guide';
import LinuxManualDownloads from 'Download/Components/LinuxManualDownloads';

function OtherGuide() {
  return (
    <Guide
      intro={
        <>
          <p>
            Ocularr runs on .NET, so it works on most platforms that .NET
            supports, including a Raspberry Pi.
          </p>
          <p>
            Want to run Ocularr on a platform not listed here?{' '}
            <a href="https://github.com/cularr/ocularr/issues">Open an issue</a>
            .
          </p>
        </>
      }
    >
      <LinuxManualDownloads />
    </Guide>
  );
}

export default OtherGuide;

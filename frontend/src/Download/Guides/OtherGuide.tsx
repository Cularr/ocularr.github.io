import React from 'react';
import Guide from 'Download/Components/Guide';
import LinuxManualDownloads from 'Download/Components/LinuxManualDownloads';

function OtherGuide() {
  return (
    <Guide
      intro={
        <>
          <p>
            Sonarr runs on .NET, so it works on most platforms that .NET
            supports, including a Raspberry Pi with the Linux ARM build.
          </p>
          <p>
            Want to port Sonarr to a platform not listed here?{' '}
            <a href="#support">Get in touch</a>.
          </p>
        </>
      }
    >
      <LinuxManualDownloads />
    </Guide>
  );
}

export default OtherGuide;

import React from 'react';
import DockerAlternative from 'Download/Components/DockerAlternative';
import Guide from 'Download/Components/Guide';
import LinuxManualDownloads from 'Download/Components/LinuxManualDownloads';

function LinuxOtherGuide() {
  return (
    <Guide
      intro={
        <>
          <p>
            A generic Linux build is available. You will need to handle
            dependencies, installation and permissions yourself.
          </p>
          <p>
            If you want to package Sonarr v4 for another distribution,{' '}
            <a href="#support">get in touch</a>.
          </p>
        </>
      }
    >
      <LinuxManualDownloads />
      <div>
        <DockerAlternative />
      </div>
    </Guide>
  );
}

export default LinuxOtherGuide;

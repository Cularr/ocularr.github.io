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
            If you want to package Ocularr for another distribution,{' '}
            <a href="https://github.com/cularr/ocularr/issues">open an issue</a>
            .
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

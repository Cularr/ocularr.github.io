import React from 'react';
import CodeBlock from 'Components/CodeBlock';
import DockerAlternative from 'Download/Components/DockerAlternative';
import Guide from 'Download/Components/Guide';
import LinuxManualDownloads from 'Download/Components/LinuxManualDownloads';
import Step from 'Download/Components/Step';
import Steps from 'Download/Components/Steps';
import ViewSonarr from 'Download/Components/ViewSonarr';

function FreeBsdGuide() {
  return (
    <Guide
      maintainers={[{ name: 'mvanbaak' }]}
      intro={
        <p>
          Install Sonarr from the{' '}
          <a href="https://cgit.freebsd.org/ports/tree/net-p2p/sonarr">
            FreeBSD Sonarr port
          </a>
          .
        </p>
      }
      alternatives={
        <>
          <h5>Manual install</h5>
          <p>
            You can install Sonarr from the upstream .tar.gz archive, but then
            you handle dependencies, installation and permissions yourself.
          </p>
          <LinuxManualDownloads />
          <DockerAlternative />
        </>
      }
    >
      <Steps>
        <Step number={1} title="Install the port">
          <CodeBlock
            prompt="#"
            variants={[{ label: 'pkg', code: 'pkg install sonarr' }]}
          />
        </Step>
        <Step number={2} title="Start the service">
          <CodeBlock
            prompt="#"
            variants={[
              {
                label: 'rc',
                code: 'sysrc sonarr_enable=YES\nservice sonarr start',
              },
            ]}
          />
        </Step>
        <ViewSonarr number={3} />
      </Steps>
    </Guide>
  );
}

export default FreeBsdGuide;

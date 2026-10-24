import React from 'react';
import CodeBlock from 'Components/CodeBlock';
import DockerAlternative from 'Download/Components/DockerAlternative';
import Guide from 'Download/Components/Guide';
import LinuxManualDownloads from 'Download/Components/LinuxManualDownloads';
import Step from 'Download/Components/Step';
import Steps from 'Download/Components/Steps';
import ViewOcularr from 'Download/Components/ViewOcularr';

function FreeBsdGuide() {
  return (
    <Guide
      maintainers={[{ name: 'mvanbaak' }]}
      intro={
        <p>
          Install Ocularr from the{' '}
          <a href="https://cgit.freebsd.org/ports/tree/net-p2p/ocularr">
            FreeBSD Ocularr port
          </a>
          .
        </p>
      }
      alternatives={
        <>
          <h5>Manual install</h5>
          <p>
            You can install Ocularr from the upstream .tar.gz archive, but then
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
            variants={[{ label: 'pkg', code: 'pkg install ocularr' }]}
          />
        </Step>
        <Step number={2} title="Start the service">
          <CodeBlock
            prompt="#"
            variants={[
              {
                label: 'rc',
                code: 'sysrc ocularr_enable=YES\nservice ocularr start',
              },
            ]}
          />
        </Step>
        <ViewOcularr number={3} />
      </Steps>
    </Guide>
  );
}

export default FreeBsdGuide;

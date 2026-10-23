import React from 'react';
import CodeBlock from 'Components/CodeBlock';
import DockerAlternative from 'Download/Components/DockerAlternative';
import Guide from 'Download/Components/Guide';
import LinuxManualDownloads from 'Download/Components/LinuxManualDownloads';
import Step from 'Download/Components/Step';
import Steps from 'Download/Components/Steps';
import ViewSonarr from 'Download/Components/ViewSonarr';

function GentooGuide() {
  return (
    <Guide
      maintainers={[
        { name: 'xartin', href: 'https://github.com/xartin' },
        { name: 'candrews', href: 'https://github.com/candrews' },
      ]}
      intro={
        <p>
          Gentoo ships{' '}
          <a href="https://packages.gentoo.org/packages/www-apps/sonarr-bin">
            www-apps/sonarr-bin
          </a>{' '}
          in Portage.
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
        <Step number={1} title="Install the package">
          <CodeBlock
            prompt="#"
            variants={[{ label: 'emerge', code: 'emerge www-apps/sonarr-bin' }]}
          />
        </Step>
        <Step number={2} title="Start Sonarr">
          <CodeBlock
            prompt="#"
            variants={[
              {
                label: 'systemd',
                code: 'systemctl daemon-reload\nsystemctl enable --now sonarr',
              },
              {
                label: 'OpenRC',
                code: 'rc-update add sonarr default\nrc-service sonarr start',
              },
            ]}
          />
        </Step>
        <ViewSonarr number={3} />
      </Steps>
    </Guide>
  );
}

export default GentooGuide;

import React from 'react';
import CodeBlock from 'Components/CodeBlock';
import DockerAlternative from 'Download/Components/DockerAlternative';
import Guide from 'Download/Components/Guide';
import LinuxManualDownloads from 'Download/Components/LinuxManualDownloads';
import Step from 'Download/Components/Step';
import Steps from 'Download/Components/Steps';
import ViewOcularr from 'Download/Components/ViewOcularr';

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
          <a href="https://packages.gentoo.org/packages/www-apps/ocularr-bin">
            www-apps/ocularr-bin
          </a>{' '}
          in Portage.
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
        <Step number={1} title="Install the package">
          <CodeBlock
            prompt="#"
            variants={[
              { label: 'emerge', code: 'emerge www-apps/ocularr-bin' },
            ]}
          />
        </Step>
        <Step number={2} title="Start Ocularr">
          <CodeBlock
            prompt="#"
            variants={[
              {
                label: 'systemd',
                code: 'systemctl daemon-reload\nsystemctl enable --now ocularr',
              },
              {
                label: 'OpenRC',
                code: 'rc-update add ocularr default\nrc-service ocularr start',
              },
            ]}
          />
        </Step>
        <ViewOcularr number={3} />
      </Steps>
    </Guide>
  );
}

export default GentooGuide;

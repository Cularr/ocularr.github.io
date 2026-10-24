import React from 'react';
import CodeBlock from 'Components/CodeBlock';
import DockerAlternative from 'Download/Components/DockerAlternative';
import Guide from 'Download/Components/Guide';
import LinuxManualDownloads from 'Download/Components/LinuxManualDownloads';
import Step from 'Download/Components/Step';
import Steps from 'Download/Components/Steps';
import ViewOcularr from 'Download/Components/ViewOcularr';

function ArchLinuxGuide() {
  return (
    <Guide
      maintainers={[{ name: 'fryfrog' }, { name: 'txtsd' }]}
      intro={
        <p>
          The Arch User Repository has a{' '}
          <a href="https://aur.archlinux.org/packages/ocularr-bin/">
            ocularr-bin
          </a>{' '}
          package you can build by hand or with your favorite{' '}
          <a href="https://wiki.archlinux.org/index.php/AUR_helpers">
            AUR helper
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
        <Step number={1} title="Install the package">
          <p>
            An AUR helper installs Ocularr and its dependencies in one go. For
            example with{' '}
            <a href="https://aur.archlinux.org/packages/paru">paru</a>, or
            follow the{' '}
            <a href="https://wiki.archlinux.org/index.php/Arch_User_Repository#Installing_packages">
              AUR install guide
            </a>
            .
          </p>
          <CodeBlock
            variants={[{ label: 'paru', code: 'paru -S ocularr-bin' }]}
          />
        </Step>
        <Step number={2} title="Start Ocularr">
          <CodeBlock
            variants={[
              {
                label: 'systemd',
                code: 'sudo systemctl daemon-reload\nsudo systemctl enable --now ocularr',
              },
            ]}
          />
        </Step>
        <ViewOcularr number={3} />
      </Steps>
    </Guide>
  );
}

export default ArchLinuxGuide;

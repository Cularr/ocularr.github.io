import React from 'react';
import CodeBlock from 'Components/CodeBlock';
import DockerAlternative from 'Download/Components/DockerAlternative';
import Guide from 'Download/Components/Guide';
import LinuxManualDownloads from 'Download/Components/LinuxManualDownloads';
import Step from 'Download/Components/Step';
import Steps from 'Download/Components/Steps';
import ViewOcularr from 'Download/Components/ViewOcularr';

const SCRIPT_URL =
  'https://raw.githubusercontent.com/cularr/ocularr/main/distribution/debian/install.sh';

function DebianGuide() {
  return (
    <Guide
      intro={
        <p>
          The install script sets up a systemd unit that starts Ocularr
          automatically. The program goes to <code>/opt/Ocularr</code> and its
          data to <code>/var/lib/ocularr</code>.
        </p>
      }
      alternatives={
        <>
          <h5>Manual install</h5>
          <p>
            You can install Ocularr from a .tar.gz archive, but then you handle
            dependencies, installation and permissions yourself. Pick the
            archive for your CPU.
          </p>
          <LinuxManualDownloads />
          <DockerAlternative />
        </>
      }
    >
      <Steps>
        <Step number={1} title="Run the install script as root">
          <CodeBlock
            variants={[
              {
                label: 'curl',
                code: `curl -o install-ocularr.sh ${SCRIPT_URL}\nsudo bash install-ocularr.sh`,
              },
              {
                label: 'wget',
                code: `wget -qO install-ocularr.sh ${SCRIPT_URL}\nsudo bash install-ocularr.sh`,
              },
            ]}
          />
          <p>
            The script asks which user and group Ocularr runs as. Choose these
            carefully to avoid permission problems with your library. Keep at
            least the group the same as your download client. To change them
            later, run the script again.
          </p>
        </Step>
        <ViewOcularr number={2} />
      </Steps>
    </Guide>
  );
}

export default DebianGuide;

import React from 'react';
import CodeBlock from 'Components/CodeBlock';
import DockerAlternative from 'Download/Components/DockerAlternative';
import Guide from 'Download/Components/Guide';
import LinuxManualDownloads from 'Download/Components/LinuxManualDownloads';
import Note from 'Download/Components/Note';
import Step from 'Download/Components/Step';
import Steps from 'Download/Components/Steps';
import ViewSonarr from 'Download/Components/ViewSonarr';

const SCRIPT_URL =
  'https://raw.githubusercontent.com/Sonarr/Sonarr/develop/distribution/debian/install.sh';

function DebianGuide() {
  return (
    <Guide
      maintainers={[{ name: 'Team Sonarr' }]}
      intro={
        <p>
          The install script sets up a systemd unit that starts Sonarr
          automatically. The program goes to <code>/opt/Sonarr</code> and its
          data to <code>/var/lib/sonarr</code>.
        </p>
      }
      upgrade={
        <Note title="Upgrading from v3">
          The v4 script replaces the v3 systemd unit if one exists. Back up your
          v3 data and uninstall the old sonarr package first.
        </Note>
      }
      alternatives={
        <>
          <h5>Manual install</h5>
          <p>
            You can install Sonarr from a .tar.gz archive, but then you handle
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
                code: `curl -o install-sonarr.sh ${SCRIPT_URL}\nsudo bash install-sonarr.sh`,
              },
              {
                label: 'wget',
                code: `wget -qO install-sonarr.sh ${SCRIPT_URL}\nsudo bash install-sonarr.sh`,
              },
            ]}
          />
          <p>
            The script asks which user and group Sonarr runs as. Choose these
            carefully to avoid permission problems with your media files. Keep
            at least the group the same as your download client. To change them
            later, run the script again.
          </p>
        </Step>
        <ViewSonarr number={2} />
      </Steps>
    </Guide>
  );
}

export default DebianGuide;
